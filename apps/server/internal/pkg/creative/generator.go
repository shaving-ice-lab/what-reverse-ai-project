package creative

import (
	"context"
	"errors"
	"fmt"
	"regexp"
	"strings"
	"sync"
	"time"

	"github.com/agentflow/server/internal/pkg/logger"
)

var (
	ErrTaskNotFound      = errors.New("task not found")
	ErrTaskCancelled     = errors.New("task cancelled")
	ErrGenerationFailed  = errors.New("generation failed")
	ErrInvalidTemplate   = errors.New("invalid template configuration")
)

// ========================
// 章节生成器接口
// ========================

// SectionGeneratorFunc 章节生成函数类型
// 参数: sectionID, promptTemplate, context
// 返回: content, tokenUsed, error
type SectionGeneratorFunc func(ctx context.Context, sectionID string, prompt string, genCtx *GenerationContext) (string, int, error)

// ========================
// 文档生成器
// ========================

// DocumentGenerator 文档生成器
type DocumentGenerator struct {
	log              logger.Logger
	sectionGenerator SectionGeneratorFunc
	maxConcurrent    int
	maxRetries       int
	retryDelay       time.Duration
	eventHandlers    []EventHandler
	mu               sync.RWMutex
}

// GeneratorConfig 生成器配置
type GeneratorConfig struct {
	MaxConcurrent int           // 最大并发章节数
	MaxRetries    int           // 最大重试次数
	RetryDelay    time.Duration // 重试延迟
}

// DefaultGeneratorConfig 默认配置
func DefaultGeneratorConfig() *GeneratorConfig {
	return &GeneratorConfig{
		MaxConcurrent: 3,
		MaxRetries:    2,
		RetryDelay:    time.Second * 2,
	}
}

// NewDocumentGenerator 创建文档生成器
func NewDocumentGenerator(
	sectionGenerator SectionGeneratorFunc,
	log logger.Logger,
	config *GeneratorConfig,
) *DocumentGenerator {
	if config == nil {
		config = DefaultGeneratorConfig()
	}

	return &DocumentGenerator{
		log:              log,
		sectionGenerator: sectionGenerator,
		maxConcurrent:    config.MaxConcurrent,
		maxRetries:       config.MaxRetries,
		retryDelay:       config.RetryDelay,
		eventHandlers:    make([]EventHandler, 0),
	}
}

// RegisterEventHandler 注册事件处理器
func (g *DocumentGenerator) RegisterEventHandler(handler EventHandler) {
	g.mu.Lock()
	defer g.mu.Unlock()
	g.eventHandlers = append(g.eventHandlers, handler)
}

// emitEvent 发送事件
func (g *DocumentGenerator) emitEvent(event *GenerationEvent) {
	g.mu.RLock()
	handlers := make([]EventHandler, len(g.eventHandlers))
	copy(handlers, g.eventHandlers)
	g.mu.RUnlock()

	for _, handler := range handlers {
		handler.HandleEvent(event)
	}
}

// ========================
// 生成流程
// ========================

// GenerateDocument 生成完整文档
func (g *DocumentGenerator) GenerateDocument(
	ctx context.Context,
	task *GenerationTask,
	sections []OutputSectionConfig,
) error {
	// 初始化章节状态
	task.InitializeSections(sections)
	now := time.Now()
	task.StartedAt = &now
	task.Status = TaskStatusProcessing

	// 发送任务开始事件
	g.emitEvent(&GenerationEvent{
		Type:      EventTaskStarted,
		TaskID:    task.ID,
		Total:     len(sections),
		Timestamp: time.Now(),
	})

	// 创建章节队列
	queue, err := NewSectionQueue(sections)
	if err != nil {
		task.Status = TaskStatusFailed
		task.Error = err.Error()
		g.emitEvent(&GenerationEvent{
			Type:      EventTaskFailed,
			TaskID:    task.ID,
			Error:     err.Error(),
			Timestamp: time.Now(),
		})
		return fmt.Errorf("failed to create section queue: %w", err)
	}

	// 创建生成上下文
	genCtx := NewGenerationContext(task.Inputs)

	// 创建章节配置映射
	sectionConfigs := make(map[string]OutputSectionConfig)
	for _, section := range sections {
		sectionConfigs[section.ID] = section
	}

	// 执行生成
	err = g.executeGeneration(ctx, task, queue, genCtx, sectionConfigs)

	// 处理结果
	if err != nil {
		if task.IsCancelled() {
			task.Status = TaskStatusCancelled
			g.emitEvent(&GenerationEvent{
				Type:      EventTaskCancelled,
				TaskID:    task.ID,
				Timestamp: time.Now(),
			})
			return ErrTaskCancelled
		}

		task.Status = TaskStatusFailed
		task.Error = err.Error()
		g.emitEvent(&GenerationEvent{
			Type:      EventTaskFailed,
			TaskID:    task.ID,
			Error:     err.Error(),
			Timestamp: time.Now(),
		})
		return err
	}

	// 整合文档
	task.OutputMarkdown = g.assembleDocument(genCtx, sections)
	task.Status = TaskStatusCompleted
	completedAt := time.Now()
	task.CompletedAt = &completedAt

	// 计算总 Token 使用
	for _, section := range task.Sections {
		task.TokenUsage.TotalTokens += section.TokenUsed
	}

	g.emitEvent(&GenerationEvent{
		Type:      EventTaskComplete,
		TaskID:    task.ID,
		Content:   task.OutputMarkdown,
		Timestamp: time.Now(),
		Metadata: map[string]interface{}{
			"tokenUsage": task.TokenUsage,
		},
	})

	return nil
}

// executeGeneration 执行生成流程
func (g *DocumentGenerator) executeGeneration(
	ctx context.Context,
	task *GenerationTask,
	queue *SectionQueue,
	genCtx *GenerationContext,
	sectionConfigs map[string]OutputSectionConfig,
) error {
	// 信号量控制并发
	semaphore := make(chan struct{}, g.maxConcurrent)
	var wg sync.WaitGroup
	errChan := make(chan error, len(sectionConfigs))

	for !queue.IsComplete() {
		// 检查取消
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-task.GetCancelChan():
			return ErrTaskCancelled
		default:
		}

		// 获取可执行的章节
		readySections := queue.GetReadySections()
		if len(readySections) == 0 {
			// 检查是否有失败的章节
			if queue.HasFailed() {
				return ErrGenerationFailed
			}
			// 等待正在运行的章节完成
			time.Sleep(100 * time.Millisecond)
			continue
		}

		// 并行执行就绪的章节
		for _, sectionID := range readySections {
			if err := queue.StartSection(sectionID); err != nil {
				continue
			}

			config := sectionConfigs[sectionID]
			wg.Add(1)

			go func(sectionID string, config OutputSectionConfig) {
				defer wg.Done()

				// 获取信号量
				semaphore <- struct{}{}
				defer func() { <-semaphore }()

				// 检查取消
				if task.IsCancelled() {
					return
				}

				// 生成章节
				err := g.generateSection(ctx, task, sectionID, config, genCtx)
				if err != nil {
					queue.FailSection(sectionID)
					errChan <- fmt.Errorf("section %s failed: %w", sectionID, err)
				} else {
					queue.CompleteSection(sectionID)
				}
			}(sectionID, config)
		}
	}

	// 等待所有章节完成
	wg.Wait()
	close(errChan)

	// 检查错误
	var errs []error
	for err := range errChan {
		errs = append(errs, err)
	}

	if len(errs) > 0 {
		return fmt.Errorf("generation failed with %d errors: %v", len(errs), errs)
	}

	return nil
}

// generateSection 生成单个章节
func (g *DocumentGenerator) generateSection(
	ctx context.Context,
	task *GenerationTask,
	sectionID string,
	config OutputSectionConfig,
	genCtx *GenerationContext,
) error {
	// 更新状态
	task.SetSectionStatus(sectionID, SectionStatusGenerating)

	// 发送章节开始事件
	completed, total := task.GetProgress()
	g.emitEvent(&GenerationEvent{
		Type:      EventSectionStarted,
		TaskID:    task.ID,
		SectionID: sectionID,
		Title:     config.Title,
		Progress:  completed,
		Total:     total,
		Timestamp: time.Now(),
	})

	// 构建 prompt
	prompt := g.buildSectionPrompt(config, genCtx)

	var content string
	var tokenUsed int
	var err error

	// 重试机制
	for retry := 0; retry <= g.maxRetries; retry++ {
		if retry > 0 {
			g.log.Info("Retrying section generation",
				"sectionID", sectionID,
				"retry", retry,
				"maxRetries", g.maxRetries,
			)
			time.Sleep(g.retryDelay)
		}

		// 调用生成函数
		content, tokenUsed, err = g.sectionGenerator(ctx, sectionID, prompt, genCtx)
		if err == nil {
			break
		}

		// 检查是否应该重试
		if ctx.Err() != nil || task.IsCancelled() {
			return err
		}

		task.Sections[sectionID].Retries++
	}

	if err != nil {
		task.SetSectionError(sectionID, err.Error())
		g.emitEvent(&GenerationEvent{
			Type:      EventSectionFailed,
			TaskID:    task.ID,
			SectionID: sectionID,
			Title:     config.Title,
			Error:     err.Error(),
			Timestamp: time.Now(),
		})
		return err
	}

	// 更新状态和内容
	task.SetSectionContent(sectionID, content, tokenUsed)
	genCtx.SetSectionResult(sectionID, content)

	// 发送章节完成事件
	completed, total = task.GetProgress()
	g.emitEvent(&GenerationEvent{
		Type:      EventSectionComplete,
		TaskID:    task.ID,
		SectionID: sectionID,
		Title:     config.Title,
		Content:   content,
		Progress:  completed,
		Total:     total,
		Timestamp: time.Now(),
		Metadata: map[string]interface{}{
			"tokenUsed": tokenUsed,
		},
	})

	return nil
}

// buildSectionPrompt 构建章节提示词
func (g *DocumentGenerator) buildSectionPrompt(config OutputSectionConfig, genCtx *GenerationContext) string {
	prompt := config.PromptTemplate

	// 替换输入变量 {{input.xxx}}
	inputPattern := regexp.MustCompile(`\{\{input\.(\w+)\}\}`)
	prompt = inputPattern.ReplaceAllStringFunc(prompt, func(match string) string {
		key := inputPattern.FindStringSubmatch(match)[1]
		if value, ok := genCtx.Inputs[key]; ok {
			return fmt.Sprintf("%v", value)
		}
		return match
	})

	// 替换章节引用 {{section.xxx}}
	sectionPattern := regexp.MustCompile(`\{\{section\.(\w+)\}\}`)
	prompt = sectionPattern.ReplaceAllStringFunc(prompt, func(match string) string {
		key := sectionPattern.FindStringSubmatch(match)[1]
		if content, ok := genCtx.GetSectionResult(key); ok {
			return content
		}
		return match
	})

	// 替换变量 {{var.xxx}}
	varPattern := regexp.MustCompile(`\{\{var\.(\w+)\}\}`)
	prompt = varPattern.ReplaceAllStringFunc(prompt, func(match string) string {
		key := varPattern.FindStringSubmatch(match)[1]
		if value, ok := genCtx.GetVariable(key); ok {
			return fmt.Sprintf("%v", value)
		}
		return match
	})

	// 构建上下文信息
	if len(config.DependsOn) > 0 {
		var contextParts []string
		for _, depID := range config.DependsOn {
			if content, ok := genCtx.GetSectionResult(depID); ok {
				contextParts = append(contextParts, fmt.Sprintf("### 参考章节: %s\n%s", depID, content))
			}
		}
		if len(contextParts) > 0 {
			prompt = fmt.Sprintf("以下是之前生成的相关章节内容，请参考：\n\n%s\n\n---\n\n%s",
				strings.Join(contextParts, "\n\n"),
				prompt,
			)
		}
	}

	return prompt
}

// assembleDocument 整合文档
func (g *DocumentGenerator) assembleDocument(genCtx *GenerationContext, sections []OutputSectionConfig) string {
	var parts []string

	for _, section := range sections {
		if content, ok := genCtx.GetSectionResult(section.ID); ok && content != "" {
			parts = append(parts, content)
		}
	}

	return strings.Join(parts, "\n\n---\n\n")
}

// ========================
// 章节重新生成
// ========================

// RegenerateSectionRequest 重新生成章节请求
type RegenerateSectionRequest struct {
	TaskID      string
	SectionID   string
	Instruction string // 附加指令
}

// RegenerateSection 重新生成单个章节
func (g *DocumentGenerator) RegenerateSection(
	ctx context.Context,
	task *GenerationTask,
	sectionID string,
	instruction string,
	sectionConfig OutputSectionConfig,
	genCtx *GenerationContext,
) (string, error) {
	// 更新状态
	task.SetSectionStatus(sectionID, SectionStatusGenerating)

	// 构建带有附加指令的 prompt
	prompt := g.buildSectionPrompt(sectionConfig, genCtx)
	if instruction != "" {
		prompt = fmt.Sprintf("%s\n\n用户附加要求: %s", prompt, instruction)
	}

	// 发送章节开始事件
	g.emitEvent(&GenerationEvent{
		Type:      EventSectionStarted,
		TaskID:    task.ID,
		SectionID: sectionID,
		Title:     sectionConfig.Title,
		Timestamp: time.Now(),
		Metadata: map[string]interface{}{
			"regenerate":  true,
			"instruction": instruction,
		},
	})

	// 调用生成函数
	content, tokenUsed, err := g.sectionGenerator(ctx, sectionID, prompt, genCtx)
	if err != nil {
		task.SetSectionError(sectionID, err.Error())
		g.emitEvent(&GenerationEvent{
			Type:      EventSectionFailed,
			TaskID:    task.ID,
			SectionID: sectionID,
			Title:     sectionConfig.Title,
			Error:     err.Error(),
			Timestamp: time.Now(),
		})
		return "", err
	}

	// 更新状态和内容
	task.SetSectionContent(sectionID, content, tokenUsed)
	genCtx.SetSectionResult(sectionID, content)

	// 发送章节完成事件
	g.emitEvent(&GenerationEvent{
		Type:      EventSectionComplete,
		TaskID:    task.ID,
		SectionID: sectionID,
		Title:     sectionConfig.Title,
		Content:   content,
		Timestamp: time.Now(),
		Metadata: map[string]interface{}{
			"regenerate": true,
			"tokenUsed":  tokenUsed,
		},
	})

	return content, nil
}
