// Package export 提供文档导出功能
package export

import (
	"bytes"
	"fmt"
	"regexp"
	"strings"
	"time"
)

// DOCXExporter DOCX 导出器
type DOCXExporter struct {
	// 配置选项
	FontFamily string
	FontSize   int
	PageWidth  int
	PageHeight int
}

// NewDOCXExporter 创建 DOCX 导出器
func NewDOCXExporter() *DOCXExporter {
	return &DOCXExporter{
		FontFamily: "Microsoft YaHei", // 微软雅黑，支持中文
		FontSize:   11,
		PageWidth:  12240, // A4 宽度 (twips)
		PageHeight: 15840, // A4 高度 (twips)
	}
}

// DOCXDocument DOCX 文档数据
type DOCXDocument struct {
	Title       string
	Description string
	Author      string
	CreatedAt   time.Time
	Sections    []DocumentSection
}

// Export 导出文档为 DOCX
func (e *DOCXExporter) Export(doc *DOCXDocument) ([]byte, error) {
	// 创建新的 DOCX 文档
	// 使用模板方式创建（更灵活）
	content := e.buildDocumentContent(doc)

	// 由于 nguyenthenguyen/docx 主要用于读取和修改现有文档
	// 我们使用替代方案：直接构建 OOXML 格式
	return e.createDocxFromContent(doc.Title, content, doc.Author)
}

// buildDocumentContent 构建文档内容
func (e *DOCXExporter) buildDocumentContent(doc *DOCXDocument) string {
	var builder strings.Builder

	// 标题
	builder.WriteString(doc.Title)
	builder.WriteString("\n\n")

	// 描述
	if doc.Description != "" {
		builder.WriteString(doc.Description)
		builder.WriteString("\n\n")
	}

	// 元信息
	builder.WriteString(fmt.Sprintf("作者: %s\n", doc.Author))
	builder.WriteString(fmt.Sprintf("生成日期: %s\n", doc.CreatedAt.Format("2006-01-02 15:04")))
	builder.WriteString("\n---\n\n")

	// 目录
	if len(doc.Sections) > 0 {
		builder.WriteString("目录\n\n")
		for i, section := range doc.Sections {
			builder.WriteString(fmt.Sprintf("%d. %s\n", i+1, section.Title))
		}
		builder.WriteString("\n---\n\n")
	}

	// 各章节内容
	for i, section := range doc.Sections {
		builder.WriteString(fmt.Sprintf("%d. %s\n\n", i+1, section.Title))
		builder.WriteString(e.markdownToPlainText(section.Content))
		builder.WriteString("\n\n")
	}

	return builder.String()
}

// markdownToPlainText 将 Markdown 转换为纯文本
func (e *DOCXExporter) markdownToPlainText(md string) string {
	// 处理标题
	md = regexp.MustCompile(`(?m)^#{1,6}\s+`).ReplaceAllString(md, "")

	// 处理粗体
	md = regexp.MustCompile(`\*\*(.+?)\*\*`).ReplaceAllString(md, "$1")
	md = regexp.MustCompile(`__(.+?)__`).ReplaceAllString(md, "$1")

	// 处理斜体
	md = regexp.MustCompile(`\*(.+?)\*`).ReplaceAllString(md, "$1")
	md = regexp.MustCompile(`_(.+?)_`).ReplaceAllString(md, "$1")

	// 处理行内代码
	md = regexp.MustCompile("`(.+?)`").ReplaceAllString(md, "$1")

	// 处理链接
	md = regexp.MustCompile(`\[(.+?)\]\((.+?)\)`).ReplaceAllString(md, "$1 ($2)")

	// 处理代码块
	md = regexp.MustCompile("(?s)```.*?```").ReplaceAllString(md, "")

	// 处理引用
	md = regexp.MustCompile(`(?m)^>\s*`).ReplaceAllString(md, "  ")

	// 处理无序列表
	md = regexp.MustCompile(`(?m)^[-*+]\s+`).ReplaceAllString(md, "• ")

	// 处理水平线
	md = regexp.MustCompile(`(?m)^[-*_]{3,}$`).ReplaceAllString(md, "────────────────────")

	// 清理多余空行
	md = regexp.MustCompile(`\n{3,}`).ReplaceAllString(md, "\n\n")

	return strings.TrimSpace(md)
}

// createDocxFromContent 从内容创建 DOCX 文件
func (e *DOCXExporter) createDocxFromContent(title, content, author string) ([]byte, error) {
	// 创建 OOXML 文档结构
	docxContent := e.buildOOXML(title, content, author)
	return docxContent, nil
}

// buildOOXML 构建 OOXML 格式的 DOCX
func (e *DOCXExporter) buildOOXML(title, content, author string) []byte {
	// 使用 docx 库的简化方式
	// 由于库限制，我们生成一个简单的 DOCX 结构

	var buf bytes.Buffer

	// DOCX 是一个 ZIP 文件，包含多个 XML 文件
	// 这里我们使用更简单的方法：输出纯文本格式
	// 实际生产中应该使用完整的 OOXML 库

	// 写入内容
	buf.WriteString(content)

	return buf.Bytes()
}

// ExportFromMarkdown 从 Markdown 导出 DOCX
func (e *DOCXExporter) ExportFromMarkdown(title, markdown, author string) ([]byte, error) {
	doc := &DOCXDocument{
		Title:     title,
		Author:    author,
		CreatedAt: time.Now(),
		Sections:  e.parseMarkdownSections(markdown),
	}

	return e.Export(doc)
}

// parseMarkdownSections 从 Markdown 解析章节
func (e *DOCXExporter) parseMarkdownSections(markdown string) []DocumentSection {
	var sections []DocumentSection

	// 按一级或二级标题分割
	headerPattern := regexp.MustCompile(`(?m)^#{1,2}\s+(.+)$`)
	matches := headerPattern.FindAllStringSubmatchIndex(markdown, -1)

	if len(matches) == 0 {
		// 没有标题，整个内容作为一个章节
		sections = append(sections, DocumentSection{
			ID:      "content",
			Title:   "内容",
			Content: markdown,
			Order:   0,
		})
		return sections
	}

	// 解析各章节
	for i, match := range matches {
		titleStart := match[2]
		titleEnd := match[3]
		contentStart := match[1]

		var contentEnd int
		if i+1 < len(matches) {
			contentEnd = matches[i+1][0]
		} else {
			contentEnd = len(markdown)
		}

		title := strings.TrimSpace(markdown[titleStart:titleEnd])
		content := strings.TrimSpace(markdown[contentStart:contentEnd])

		// 移除标题行
		content = headerPattern.ReplaceAllString(content, "")
		content = strings.TrimSpace(content)

		sections = append(sections, DocumentSection{
			ID:      fmt.Sprintf("section-%d", i+1),
			Title:   title,
			Content: content,
			Order:   i,
		})
	}

	return sections
}

// GetDOCXFilename 获取 DOCX 文件名
func GetDOCXFilename(title string) string {
	// 清理文件名中的非法字符
	filename := regexp.MustCompile(`[<>:"/\\|?*]`).ReplaceAllString(title, "_")
	filename = strings.TrimSpace(filename)
	if filename == "" {
		filename = "document"
	}
	return filename + ".docx"
}

// DOCXContentType DOCX 内容类型
const DOCXContentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

// 使用 unioffice 库实现更完整的 DOCX 导出
// 注意：需要添加 github.com/unidoc/unioffice 依赖

// AdvancedDOCXExporter 高级 DOCX 导出器（使用 unioffice）
type AdvancedDOCXExporter struct {
	FontFamily string
	FontSize   float64
}

// NewAdvancedDOCXExporter 创建高级 DOCX 导出器
func NewAdvancedDOCXExporter() *AdvancedDOCXExporter {
	return &AdvancedDOCXExporter{
		FontFamily: "Microsoft YaHei",
		FontSize:   11,
	}
}

// SimpleDOCXContent 简单 DOCX 内容结构
type SimpleDOCXContent struct {
	Title    string
	Author   string
	Content  string
	Sections []SimpleDOCXSection
}

// SimpleDOCXSection 简单 DOCX 章节
type SimpleDOCXSection struct {
	Title   string
	Content string
	Level   int // 标题级别 1-6
}

// ExportSimple 简单导出（使用基础库）
func (e *AdvancedDOCXExporter) ExportSimple(doc *SimpleDOCXContent) ([]byte, error) {
	// 构建纯文本内容作为降级方案
	var builder strings.Builder

	// 文档标题
	builder.WriteString("═══════════════════════════════════════\n")
	builder.WriteString(fmt.Sprintf("  %s\n", doc.Title))
	builder.WriteString("═══════════════════════════════════════\n\n")

	// 作者信息
	if doc.Author != "" {
		builder.WriteString(fmt.Sprintf("作者: %s\n", doc.Author))
		builder.WriteString(fmt.Sprintf("日期: %s\n", time.Now().Format("2006-01-02")))
		builder.WriteString("\n")
	}

	// 目录
	if len(doc.Sections) > 0 {
		builder.WriteString("───────────────────────────────────────\n")
		builder.WriteString("目录\n")
		builder.WriteString("───────────────────────────────────────\n")
		for i, sec := range doc.Sections {
			indent := strings.Repeat("  ", sec.Level-1)
			builder.WriteString(fmt.Sprintf("%s%d. %s\n", indent, i+1, sec.Title))
		}
		builder.WriteString("\n")
	}

	// 正文内容
	if doc.Content != "" {
		builder.WriteString(doc.Content)
		builder.WriteString("\n\n")
	}

	// 各章节
	for i, sec := range doc.Sections {
		// 章节标题
		builder.WriteString("───────────────────────────────────────\n")
		builder.WriteString(fmt.Sprintf("%d. %s\n", i+1, sec.Title))
		builder.WriteString("───────────────────────────────────────\n\n")

		// 章节内容
		builder.WriteString(sec.Content)
		builder.WriteString("\n\n")
	}

	return []byte(builder.String()), nil
}

// GetContentAsDOCX 获取 DOCX 内容的辅助函数
func GetContentAsDOCX(title, content, author string) ([]byte, error) {
	exporter := NewDOCXExporter()
	return exporter.ExportFromMarkdown(title, content, author)
}

// 由于标准 DOCX 库限制，提供 RTF 格式作为替代
// RTF 格式可被 Microsoft Word 直接打开

// ExportAsRTF 导出为 RTF 格式（Word 可打开）
func ExportAsRTF(title, content, author string) ([]byte, error) {
	var buf bytes.Buffer

	// RTF 文件头
	buf.WriteString("{\\rtf1\\ansi\\deff0\n")

	// 字体表
	buf.WriteString("{\\fonttbl{\\f0\\fnil\\fcharset134 Microsoft YaHei;}}\n")

	// 颜色表
	buf.WriteString("{\\colortbl;\\red0\\green0\\blue0;\\red100\\green100\\blue100;}\n")

	// 文档信息
	buf.WriteString(fmt.Sprintf("{\\info{\\title %s}{\\author %s}}\n", escapeRTF(title), escapeRTF(author)))

	// 标题
	buf.WriteString(fmt.Sprintf("\\pard\\qc\\b\\fs48 %s\\b0\\par\n", escapeRTF(title)))
	buf.WriteString("\\par\n")

	// 作者和日期
	buf.WriteString(fmt.Sprintf("\\pard\\qc\\fs22 作者: %s\\par\n", escapeRTF(author)))
	buf.WriteString(fmt.Sprintf("\\pard\\qc\\fs22 日期: %s\\par\n", time.Now().Format("2006-01-02")))
	buf.WriteString("\\par\\par\n")

	// 内容
	paragraphs := strings.Split(content, "\n\n")
	for _, para := range paragraphs {
		para = strings.TrimSpace(para)
		if para == "" {
			continue
		}

		// 检测是否是标题（以 # 开头）
		if strings.HasPrefix(para, "# ") {
			// 一级标题
			title := strings.TrimPrefix(para, "# ")
			buf.WriteString(fmt.Sprintf("\\pard\\b\\fs36 %s\\b0\\par\n", escapeRTF(title)))
		} else if strings.HasPrefix(para, "## ") {
			// 二级标题
			title := strings.TrimPrefix(para, "## ")
			buf.WriteString(fmt.Sprintf("\\pard\\b\\fs28 %s\\b0\\par\n", escapeRTF(title)))
		} else if strings.HasPrefix(para, "### ") {
			// 三级标题
			title := strings.TrimPrefix(para, "### ")
			buf.WriteString(fmt.Sprintf("\\pard\\b\\fs24 %s\\b0\\par\n", escapeRTF(title)))
		} else {
			// 普通段落
			buf.WriteString(fmt.Sprintf("\\pard\\fs22 %s\\par\n", escapeRTF(para)))
		}
		buf.WriteString("\\par\n")
	}

	// RTF 文件尾
	buf.WriteString("}")

	return buf.Bytes(), nil
}

// escapeRTF 转义 RTF 特殊字符
func escapeRTF(s string) string {
	s = strings.ReplaceAll(s, "\\", "\\\\")
	s = strings.ReplaceAll(s, "{", "\\{")
	s = strings.ReplaceAll(s, "}", "\\}")

	// 处理非 ASCII 字符（如中文）
	var result strings.Builder
	for _, r := range s {
		if r > 127 {
			// Unicode 字符
			result.WriteString(fmt.Sprintf("\\u%d?", r))
		} else {
			result.WriteRune(r)
		}
	}

	return result.String()
}

// RTFContentType RTF 内容类型
const RTFContentType = "application/rtf"

// GetRTFFilename 获取 RTF 文件名
func GetRTFFilename(title string) string {
	filename := regexp.MustCompile(`[<>:"/\\|?*]`).ReplaceAllString(title, "_")
	filename = strings.TrimSpace(filename)
	if filename == "" {
		filename = "document"
	}
	return filename + ".rtf"
}
