package creative

import (
	"context"
	"sync"

	"github.com/agentflow/server/internal/pkg/logger"
)

// TaskEvent 任务事件
type TaskEvent struct {
	Type string                 `json:"type"`
	Data map[string]interface{} `json:"data"`
}

// Generator 任务生成器 (管理任务执行和事件订阅)
type Generator struct {
	log          logger.Logger
	docGenerator *DocumentGenerator

	// 任务管理
	tasks   map[string]*GenerationTask
	tasksMu sync.RWMutex

	// 事件订阅
	subscribers map[string][]chan TaskEvent
	subMu       sync.RWMutex

	// 取消上下文
	cancelFuncs map[string]context.CancelFunc
	cancelMu    sync.RWMutex
}

// NewGenerator 创建任务生成器
func NewGenerator(docGenerator *DocumentGenerator, log logger.Logger) *Generator {
	g := &Generator{
		log:          log,
		docGenerator: docGenerator,
		tasks:        make(map[string]*GenerationTask),
		subscribers:  make(map[string][]chan TaskEvent),
		cancelFuncs:  make(map[string]context.CancelFunc),
	}

	// 注册事件处理器
	if docGenerator != nil {
		docGenerator.RegisterEventHandler(EventHandlerFunc(func(event *GenerationEvent) {
			g.broadcastEvent(event.TaskID, TaskEvent{
				Type: string(event.Type),
				Data: map[string]interface{}{
					"taskId":    event.TaskID,
					"sectionId": event.SectionID,
					"title":     event.Title,
					"content":   event.Content,
					"progress":  event.Progress,
					"total":     event.Total,
					"error":     event.Error,
					"metadata":  event.Metadata,
					"timestamp": event.Timestamp,
				},
			})
		}))
	}

	return g
}

// Subscribe 订阅任务事件
func (g *Generator) Subscribe(taskID string, ch chan TaskEvent) {
	g.subMu.Lock()
	defer g.subMu.Unlock()
	g.subscribers[taskID] = append(g.subscribers[taskID], ch)
}

// Unsubscribe 取消订阅
func (g *Generator) Unsubscribe(taskID string, ch chan TaskEvent) {
	g.subMu.Lock()
	defer g.subMu.Unlock()

	subs := g.subscribers[taskID]
	for i, sub := range subs {
		if sub == ch {
			g.subscribers[taskID] = append(subs[:i], subs[i+1:]...)
			break
		}
	}

	// 如果没有订阅者了，清理
	if len(g.subscribers[taskID]) == 0 {
		delete(g.subscribers, taskID)
	}
}

// broadcastEvent 广播事件
func (g *Generator) broadcastEvent(taskID string, event TaskEvent) {
	g.subMu.RLock()
	subs := g.subscribers[taskID]
	g.subMu.RUnlock()

	for _, ch := range subs {
		select {
		case ch <- event:
		default:
			// 通道已满，跳过
		}
	}
}

// StartTask 启动任务执行
func (g *Generator) StartTask(ctx context.Context, taskID string) error {
	// 这里需要实现实际的任务启动逻辑
	// 暂时返回 nil，实际实现需要：
	// 1. 从数据库加载任务
	// 2. 加载模板配置
	// 3. 调用 docGenerator.GenerateDocument

	g.log.Info("Task execution started", "taskID", taskID)

	// 发送开始事件
	g.broadcastEvent(taskID, TaskEvent{
		Type: "started",
		Data: map[string]interface{}{
			"taskId": taskID,
		},
	})

	return nil
}

// CancelTask 取消任务
func (g *Generator) CancelTask(taskID string) {
	// 取消任务
	g.tasksMu.RLock()
	task, exists := g.tasks[taskID]
	g.tasksMu.RUnlock()

	if exists && task != nil {
		task.Cancel()
	}

	// 取消上下文
	g.cancelMu.Lock()
	if cancel, ok := g.cancelFuncs[taskID]; ok {
		cancel()
		delete(g.cancelFuncs, taskID)
	}
	g.cancelMu.Unlock()

	// 发送取消事件
	g.broadcastEvent(taskID, TaskEvent{
		Type: "cancelled",
		Data: map[string]interface{}{
			"taskId": taskID,
		},
	})

	g.log.Info("Task cancelled", "taskID", taskID)
}

// GetTask 获取任务
func (g *Generator) GetTask(taskID string) (*GenerationTask, bool) {
	g.tasksMu.RLock()
	defer g.tasksMu.RUnlock()
	task, ok := g.tasks[taskID]
	return task, ok
}

// RegisterTask 注册任务
func (g *Generator) RegisterTask(task *GenerationTask) {
	g.tasksMu.Lock()
	defer g.tasksMu.Unlock()
	g.tasks[task.ID] = task
}

// UnregisterTask 注销任务
func (g *Generator) UnregisterTask(taskID string) {
	g.tasksMu.Lock()
	defer g.tasksMu.Unlock()
	delete(g.tasks, taskID)
}
