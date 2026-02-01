package executor

import (
	"context"
	"crypto/md5"
	"encoding/hex"
	"fmt"
	"regexp"
	"sort"
	"strings"
	"time"
)

// NodeTypeDocumentAssembler 在 types.go 中定义

// DocumentAssemblerExecutor 文档组装节点执行器
// 用于整合多个章节内容，生成完整的 Markdown 文档
type DocumentAssemblerExecutor struct{}

// NewDocumentAssemblerExecutor 创建文档组装执行器
func NewDocumentAssemblerExecutor() *DocumentAssemblerExecutor {
	return &DocumentAssemblerExecutor{}
}

func (e *DocumentAssemblerExecutor) GetType() NodeType {
	return NodeTypeDocumentAssembler
}

// DocumentSection 文档章节结构
type DocumentSection struct {
	ID       string `json:"id"`
	Title    string `json:"title"`
	Content  string `json:"content"`
	Level    int    `json:"level"`    // 标题级别 1-6
	Order    int    `json:"order"`    // 排序顺序
	ParentID string `json:"parentId"` // 父章节ID（用于嵌套结构）
}

// DocumentConfig 文档配置
type DocumentConfig struct {
	Title              string `json:"title"`              // 文档标题
	Description        string `json:"description"`        // 文档描述
	Author             string `json:"author"`             // 作者
	GenerateTOC        bool   `json:"generateTOC"`        // 是否生成目录
	GenerateSummary    bool   `json:"generateSummary"`    // 是否生成摘要
	TOCTitle           string `json:"tocTitle"`           // 目录标题
	SummaryTitle       string `json:"summaryTitle"`       // 摘要标题
	DateFormat         string `json:"dateFormat"`         // 日期格式
	IncludeMetadata    bool   `json:"includeMetadata"`    // 是否包含元数据
	SectionSeparator   string `json:"sectionSeparator"`   // 章节分隔符
	HeaderTemplate     string `json:"headerTemplate"`     // 头部模板
	FooterTemplate     string `json:"footerTemplate"`     // 尾部模板
	NormalizationLevel int    `json:"normalizationLevel"` // 标准化级别 (0-3)
}

func (e *DocumentAssemblerExecutor) Execute(ctx context.Context, node *NodeDefinition, inputs map[string]interface{}, execCtx *ExecutionContext) (*NodeResult, error) {
	// 解析配置
	config := e.parseConfig(node.Config)

	// 收集章节内容
	sections, err := e.collectSections(inputs, node.Config, execCtx)
	if err != nil {
		return &NodeResult{
			NodeID: node.ID,
			Status: NodeStatusFailed,
			Error:  fmt.Errorf("failed to collect sections: %w", err),
		}, err
	}

	// 排序章节
	e.sortSections(sections)

	// 标准化内容格式
	if config.NormalizationLevel > 0 {
		e.normalizeSections(sections, config.NormalizationLevel)
	}

	// 生成摘要（如果需要）
	var summary string
	if config.GenerateSummary {
		summary = e.generateSummary(sections, config)
	}

	// 生成目录（如果需要）
	var toc string
	if config.GenerateTOC {
		toc = e.generateTOC(sections, config)
	}

	// 组装最终文档
	document := e.assembleDocument(config, toc, summary, sections)

	// 计算统计信息
	stats := e.calculateStats(document, sections)

	// 构建输出
	outputs := map[string]interface{}{
		"document":     document,
		"markdown":     document,
		"content":      document,
		"toc":          toc,
		"summary":      summary,
		"sectionCount": len(sections),
		"wordCount":    stats["wordCount"],
		"charCount":    stats["charCount"],
		"metadata": map[string]interface{}{
			"title":       config.Title,
			"author":      config.Author,
			"generatedAt": time.Now().Format(time.RFC3339),
			"sections":    e.getSectionTitles(sections),
		},
	}

	return &NodeResult{
		NodeID:  node.ID,
		Status:  NodeStatusCompleted,
		Outputs: outputs,
		Logs: []LogEntry{
			{
				Level:     "info",
				Message:   fmt.Sprintf("Document assembled: %d sections, %d words", len(sections), stats["wordCount"]),
				Timestamp: time.Now(),
			},
		},
	}, nil
}

// parseConfig 解析节点配置
func (e *DocumentAssemblerExecutor) parseConfig(config map[string]interface{}) DocumentConfig {
	dc := DocumentConfig{
		Title:              getString(config, "title"),
		Description:        getString(config, "description"),
		Author:             getString(config, "author"),
		GenerateTOC:        getBool(config, "generateTOC"),
		GenerateSummary:    getBool(config, "generateSummary"),
		TOCTitle:           getString(config, "tocTitle"),
		SummaryTitle:       getString(config, "summaryTitle"),
		DateFormat:         getString(config, "dateFormat"),
		IncludeMetadata:    getBool(config, "includeMetadata"),
		SectionSeparator:   getString(config, "sectionSeparator"),
		HeaderTemplate:     getString(config, "headerTemplate"),
		FooterTemplate:     getString(config, "footerTemplate"),
		NormalizationLevel: getInt(config, "normalizationLevel", 1),
	}

	// 设置默认值
	if dc.TOCTitle == "" {
		dc.TOCTitle = "目录"
	}
	if dc.SummaryTitle == "" {
		dc.SummaryTitle = "摘要"
	}
	if dc.DateFormat == "" {
		dc.DateFormat = "2006-01-02"
	}
	if dc.SectionSeparator == "" {
		dc.SectionSeparator = "\n\n---\n\n"
	}

	return dc
}

// collectSections 收集章节内容
func (e *DocumentAssemblerExecutor) collectSections(inputs map[string]interface{}, config map[string]interface{}, execCtx *ExecutionContext) ([]*DocumentSection, error) {
	sections := make([]*DocumentSection, 0)

	// 方式1: 从 sections 数组获取
	if sectionsArr, ok := config["sections"].([]interface{}); ok {
		for i, s := range sectionsArr {
			if sectionConfig, ok := s.(map[string]interface{}); ok {
				section := e.parseSectionConfig(sectionConfig, i, inputs, execCtx)
				if section != nil {
					sections = append(sections, section)
				}
			}
		}
	}

	// 方式2: 从输入中自动收集带 section- 前缀的内容
	for key, value := range inputs {
		if strings.HasPrefix(key, "section-") || strings.HasPrefix(key, "chapter-") {
			content := e.extractContent(value)
			if content != "" {
				section := &DocumentSection{
					ID:      key,
					Title:   e.extractTitle(content),
					Content: content,
					Level:   2,
					Order:   len(sections),
				}
				sections = append(sections, section)
			}
		}
	}

	// 方式3: 从单个 sections 输入获取
	if sectionsInput, ok := inputs["sections"].([]interface{}); ok {
		for i, s := range sectionsInput {
			switch section := s.(type) {
			case map[string]interface{}:
				parsed := e.parseSectionFromMap(section, i)
				if parsed != nil {
					sections = append(sections, parsed)
				}
			case string:
				sections = append(sections, &DocumentSection{
					ID:      fmt.Sprintf("section-%d", i),
					Title:   e.extractTitle(section),
					Content: section,
					Level:   2,
					Order:   i,
				})
			}
		}
	}

	// 方式4: 从节点输出中收集
	if nodeIDs, ok := config["sourceNodes"].([]interface{}); ok {
		for i, nodeID := range nodeIDs {
			if nid, ok := nodeID.(string); ok {
				if outputs := execCtx.GetNodeOutput(nid); outputs != nil {
					content := e.extractContentFromOutputs(outputs)
					if content != "" {
						section := &DocumentSection{
							ID:      nid,
							Title:   e.extractTitle(content),
							Content: content,
							Level:   2,
							Order:   i,
						}
						sections = append(sections, section)
					}
				}
			}
		}
	}

	return sections, nil
}

// parseSectionConfig 解析章节配置
func (e *DocumentAssemblerExecutor) parseSectionConfig(config map[string]interface{}, order int, inputs map[string]interface{}, execCtx *ExecutionContext) *DocumentSection {
	section := &DocumentSection{
		ID:       getString(config, "id"),
		Title:    getString(config, "title"),
		Level:    getInt(config, "level", 2),
		Order:    getInt(config, "order", order),
		ParentID: getString(config, "parentId"),
	}

	if section.ID == "" {
		section.ID = fmt.Sprintf("section-%d", order)
	}

	// 获取内容 - 支持变量引用
	contentSource := getString(config, "contentSource")
	if contentSource != "" {
		// 解析变量引用 {{nodeId.output}}
		section.Content = interpolateVariables(contentSource, inputs, execCtx)
	} else if content, ok := config["content"].(string); ok {
		section.Content = interpolateVariables(content, inputs, execCtx)
	}

	// 如果标题为空，尝试从内容中提取
	if section.Title == "" {
		section.Title = e.extractTitle(section.Content)
	}

	if section.Content == "" {
		return nil
	}

	return section
}

// parseSectionFromMap 从 map 解析章节
func (e *DocumentAssemblerExecutor) parseSectionFromMap(m map[string]interface{}, order int) *DocumentSection {
	section := &DocumentSection{
		ID:       getString(m, "id"),
		Title:    getString(m, "title"),
		Content:  getString(m, "content"),
		Level:    getInt(m, "level", 2),
		Order:    getInt(m, "order", order),
		ParentID: getString(m, "parentId"),
	}

	if section.ID == "" {
		section.ID = fmt.Sprintf("section-%d", order)
	}

	// 如果内容在 text 字段
	if section.Content == "" {
		section.Content = getString(m, "text")
	}

	// 如果标题为空，尝试从内容中提取
	if section.Title == "" {
		section.Title = e.extractTitle(section.Content)
	}

	if section.Content == "" {
		return nil
	}

	return section
}

// extractContent 从各种类型中提取内容
func (e *DocumentAssemblerExecutor) extractContent(value interface{}) string {
	switch v := value.(type) {
	case string:
		return v
	case map[string]interface{}:
		// 尝试常见的内容字段
		for _, key := range []string{"content", "text", "output", "result", "markdown"} {
			if content, ok := v[key].(string); ok {
				return content
			}
		}
	}
	return ""
}

// extractContentFromOutputs 从节点输出中提取内容
func (e *DocumentAssemblerExecutor) extractContentFromOutputs(outputs map[string]interface{}) string {
	for _, key := range []string{"content", "text", "output", "result", "markdown"} {
		if content, ok := outputs[key].(string); ok {
			return content
		}
	}
	return ""
}

// extractTitle 从内容中提取标题
func (e *DocumentAssemblerExecutor) extractTitle(content string) string {
	if content == "" {
		return ""
	}

	// 尝试匹配 Markdown 标题
	lines := strings.Split(content, "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, "#") {
			// 移除 # 符号
			title := strings.TrimLeft(line, "#")
			title = strings.TrimSpace(title)
			if title != "" {
				return title
			}
		}
	}

	// 使用第一行非空内容作为标题
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line != "" {
			// 截取前50个字符
			if len(line) > 50 {
				return line[:50] + "..."
			}
			return line
		}
	}

	return "未命名章节"
}

// sortSections 排序章节
func (e *DocumentAssemblerExecutor) sortSections(sections []*DocumentSection) {
	sort.SliceStable(sections, func(i, j int) bool {
		return sections[i].Order < sections[j].Order
	})
}

// normalizeSections 标准化章节格式
func (e *DocumentAssemblerExecutor) normalizeSections(sections []*DocumentSection, level int) {
	for _, section := range sections {
		content := section.Content

		// 级别 1: 基础标准化
		if level >= 1 {
			// 移除多余空行
			content = regexp.MustCompile(`\n{3,}`).ReplaceAllString(content, "\n\n")
			// 统一行尾
			content = strings.ReplaceAll(content, "\r\n", "\n")
		}

		// 级别 2: 格式标准化
		if level >= 2 {
			// 确保标题后有空行
			content = regexp.MustCompile(`(^#{1,6}\s+.+)(\n)([^\n])`).ReplaceAllString(content, "$1\n\n$3")
			// 确保代码块前后有空行
			codeBlockPattern := "([^\n])\n(" + "```" + ")"
			content = regexp.MustCompile(codeBlockPattern).ReplaceAllString(content, "$1\n\n$2")
			codeBlockEndPattern := "(" + "```" + ")\n([^\n])"
			content = regexp.MustCompile(codeBlockEndPattern).ReplaceAllString(content, "$1\n\n$2")
		}

		// 级别 3: 高级标准化
		if level >= 3 {
			// 标准化列表缩进
			content = e.normalizeListIndentation(content)
			// 标准化表格格式
			content = e.normalizeTableFormat(content)
		}

		section.Content = strings.TrimSpace(content)
	}
}

// normalizeListIndentation 标准化列表缩进
func (e *DocumentAssemblerExecutor) normalizeListIndentation(content string) string {
	lines := strings.Split(content, "\n")
	result := make([]string, len(lines))

	listItemPattern := regexp.MustCompile(`^(\s*)([*\-+]|\d+\.)\s+(.*)$`)

	for i, line := range lines {
		if matches := listItemPattern.FindStringSubmatch(line); matches != nil {
			indent := matches[1]
			marker := matches[2]
			text := matches[3]

			// 标准化缩进为2个空格的倍数
			indentLevel := len(indent) / 2
			normalizedIndent := strings.Repeat("  ", indentLevel)

			result[i] = normalizedIndent + marker + " " + text
		} else {
			result[i] = line
		}
	}

	return strings.Join(result, "\n")
}

// normalizeTableFormat 标准化表格格式
func (e *DocumentAssemblerExecutor) normalizeTableFormat(content string) string {
	// 简单实现：确保表格分隔行格式正确
	lines := strings.Split(content, "\n")
	result := make([]string, 0, len(lines))

	for _, line := range lines {
		// 检测表格分隔行
		if regexp.MustCompile(`^\|[\s\-:]+\|$`).MatchString(strings.TrimSpace(line)) {
			// 标准化分隔符
			parts := strings.Split(line, "|")
			normalizedParts := make([]string, len(parts))
			for i, part := range parts {
				part = strings.TrimSpace(part)
				if part == "" {
					normalizedParts[i] = ""
					continue
				}

				hasLeftColon := strings.HasPrefix(part, ":")
				hasRightColon := strings.HasSuffix(part, ":")

				dashes := "---"
				if hasLeftColon && hasRightColon {
					dashes = ":---:"
				} else if hasLeftColon {
					dashes = ":---"
				} else if hasRightColon {
					dashes = "---:"
				}
				normalizedParts[i] = " " + dashes + " "
			}
			result = append(result, strings.Join(normalizedParts, "|"))
		} else {
			result = append(result, line)
		}
	}

	return strings.Join(result, "\n")
}

// generateSummary 生成文档摘要
func (e *DocumentAssemblerExecutor) generateSummary(sections []*DocumentSection, config DocumentConfig) string {
	var summaryParts []string

	summaryParts = append(summaryParts, fmt.Sprintf("## %s\n", config.SummaryTitle))

	// 收集每个章节的概要
	for _, section := range sections {
		if section.Title != "" {
			// 提取章节的第一段作为概要
			firstPara := e.getFirstParagraph(section.Content)
			if firstPara != "" {
				summaryParts = append(summaryParts, fmt.Sprintf("**%s**: %s", section.Title, firstPara))
			}
		}
	}

	return strings.Join(summaryParts, "\n\n")
}

// getFirstParagraph 获取第一段内容
func (e *DocumentAssemblerExecutor) getFirstParagraph(content string) string {
	// 移除标题
	content = regexp.MustCompile(`^#{1,6}\s+.+\n*`).ReplaceAllString(content, "")

	// 分割段落
	paragraphs := regexp.MustCompile(`\n\n+`).Split(content, -1)

	for _, para := range paragraphs {
		para = strings.TrimSpace(para)
		// 跳过空段落、代码块、列表等
		if para == "" ||
			strings.HasPrefix(para, "```") ||
			strings.HasPrefix(para, "- ") ||
			strings.HasPrefix(para, "* ") ||
			strings.HasPrefix(para, "| ") ||
			regexp.MustCompile(`^\d+\.\s`).MatchString(para) {
			continue
		}

		// 限制长度
		if len(para) > 200 {
			return para[:200] + "..."
		}
		return para
	}

	return ""
}

// generateTOC 生成目录
func (e *DocumentAssemblerExecutor) generateTOC(sections []*DocumentSection, config DocumentConfig) string {
	var tocLines []string

	tocLines = append(tocLines, fmt.Sprintf("## %s\n", config.TOCTitle))

	for i, section := range sections {
		if section.Title == "" {
			continue
		}

		// 生成锚点
		anchor := e.generateAnchor(section.Title)

		// 根据层级生成缩进
		indent := strings.Repeat("  ", section.Level-1)
		if section.Level < 1 {
			indent = ""
		}

		// 生成目录项
		tocLines = append(tocLines, fmt.Sprintf("%s%d. [%s](#%s)", indent, i+1, section.Title, anchor))
	}

	return strings.Join(tocLines, "\n")
}

// generateAnchor 生成 Markdown 锚点
func (e *DocumentAssemblerExecutor) generateAnchor(title string) string {
	// 转换为小写
	anchor := strings.ToLower(title)
	// 移除特殊字符
	anchor = regexp.MustCompile(`[^\p{L}\p{N}\s-]`).ReplaceAllString(anchor, "")
	// 空格转换为连字符
	anchor = regexp.MustCompile(`\s+`).ReplaceAllString(anchor, "-")
	// 移除连续的连字符
	anchor = regexp.MustCompile(`-+`).ReplaceAllString(anchor, "-")
	// 移除首尾连字符
	anchor = strings.Trim(anchor, "-")

	// 如果锚点为空，使用 MD5 哈希
	if anchor == "" {
		hash := md5.Sum([]byte(title))
		anchor = hex.EncodeToString(hash[:])[:8]
	}

	return anchor
}

// assembleDocument 组装最终文档
func (e *DocumentAssemblerExecutor) assembleDocument(config DocumentConfig, toc string, summary string, sections []*DocumentSection) string {
	var parts []string

	// 添加头部模板
	if config.HeaderTemplate != "" {
		parts = append(parts, config.HeaderTemplate)
	}

	// 添加文档标题
	if config.Title != "" {
		parts = append(parts, fmt.Sprintf("# %s\n", config.Title))

		// 添加元数据
		if config.IncludeMetadata {
			metaParts := []string{}
			if config.Author != "" {
				metaParts = append(metaParts, fmt.Sprintf("**作者**: %s", config.Author))
			}
			metaParts = append(metaParts, fmt.Sprintf("**生成日期**: %s", time.Now().Format(config.DateFormat)))
			if len(metaParts) > 0 {
				parts = append(parts, "> "+strings.Join(metaParts, " | "))
			}
		}

		// 添加描述
		if config.Description != "" {
			parts = append(parts, fmt.Sprintf("\n%s\n", config.Description))
		}
	}

	// 添加分隔线
	parts = append(parts, "---")

	// 添加目录
	if toc != "" {
		parts = append(parts, toc)
		parts = append(parts, "---")
	}

	// 添加摘要
	if summary != "" {
		parts = append(parts, summary)
		parts = append(parts, "---")
	}

	// 添加章节内容
	for i, section := range sections {
		if i > 0 && config.SectionSeparator != "" {
			parts = append(parts, strings.TrimSpace(config.SectionSeparator))
		}
		parts = append(parts, section.Content)
	}

	// 添加尾部模板
	if config.FooterTemplate != "" {
		parts = append(parts, "---")
		parts = append(parts, config.FooterTemplate)
	}

	// 组合所有部分
	document := strings.Join(parts, "\n\n")

	// 最终清理
	document = regexp.MustCompile(`\n{3,}`).ReplaceAllString(document, "\n\n")

	return strings.TrimSpace(document)
}

// calculateStats 计算文档统计信息
func (e *DocumentAssemblerExecutor) calculateStats(document string, sections []*DocumentSection) map[string]int {
	stats := make(map[string]int)

	// 字符数（不含空格）
	stats["charCount"] = len(strings.ReplaceAll(document, " ", ""))

	// 字符数（含空格）
	stats["charCountWithSpaces"] = len(document)

	// 词数（简单实现：按空格分割）
	words := strings.Fields(document)
	stats["wordCount"] = len(words)

	// 行数
	stats["lineCount"] = len(strings.Split(document, "\n"))

	// 章节数
	stats["sectionCount"] = len(sections)

	// 统计不同级别的标题数
	h1Count := 0
	h2Count := 0
	h3Count := 0
	for _, section := range sections {
		switch section.Level {
		case 1:
			h1Count++
		case 2:
			h2Count++
		case 3:
			h3Count++
		}
	}
	stats["h1Count"] = h1Count
	stats["h2Count"] = h2Count
	stats["h3Count"] = h3Count

	return stats
}

// getSectionTitles 获取所有章节标题
func (e *DocumentAssemblerExecutor) getSectionTitles(sections []*DocumentSection) []string {
	titles := make([]string, len(sections))
	for i, section := range sections {
		titles[i] = section.Title
	}
	return titles
}
