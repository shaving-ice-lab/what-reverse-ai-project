// Package export 提供文档导出功能
package export

import (
	"bytes"
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/johnfercher/maroto/v2"
	"github.com/johnfercher/maroto/v2/pkg/components/col"
	"github.com/johnfercher/maroto/v2/pkg/components/row"
	"github.com/johnfercher/maroto/v2/pkg/components/text"
	"github.com/johnfercher/maroto/v2/pkg/config"
	"github.com/johnfercher/maroto/v2/pkg/consts/align"
	"github.com/johnfercher/maroto/v2/pkg/consts/fontstyle"
	"github.com/johnfercher/maroto/v2/pkg/core"
	"github.com/johnfercher/maroto/v2/pkg/props"
)

// PDFExporter PDF 导出器
type PDFExporter struct {
	// 配置选项
	PageSize   string // A4, Letter 等
	FontFamily string // 字体族
	FontSize   float64
	MarginTop  float64
	MarginLeft float64
}

// NewPDFExporter 创建 PDF 导出器
func NewPDFExporter() *PDFExporter {
	return &PDFExporter{
		PageSize:   "A4",
		FontFamily: "Arial",
		FontSize:   10,
		MarginTop:  15,
		MarginLeft: 15,
	}
}

// DocumentSection 文档章节
type DocumentSection struct {
	ID      string
	Title   string
	Content string
	Order   int
}

// PDFDocument PDF 文档数据
type PDFDocument struct {
	Title       string
	Description string
	Author      string
	CreatedAt   time.Time
	Sections    []DocumentSection
}

// Export 导出文档为 PDF
func (e *PDFExporter) Export(doc *PDFDocument) ([]byte, error) {
	// 创建 PDF 配置
	cfg := config.NewBuilder().
		WithPageNumber().
		WithLeftMargin(e.MarginLeft).
		WithTopMargin(e.MarginTop).
		WithRightMargin(e.MarginLeft).
		Build()

	// 创建 maroto 实例
	m := maroto.New(cfg)

	// 添加标题页
	e.addTitlePage(m, doc)

	// 添加目录
	if len(doc.Sections) > 0 {
		e.addTableOfContents(m, doc)
	}

	// 添加各章节内容
	for _, section := range doc.Sections {
		e.addSection(m, section)
	}

	// 生成 PDF
	document, err := m.Generate()
	if err != nil {
		return nil, fmt.Errorf("failed to generate PDF: %w", err)
	}

	return document.GetBytes(), nil
}

// addTitlePage 添加标题页
func (e *PDFExporter) addTitlePage(m core.Maroto, doc *PDFDocument) {
	// 标题
	m.AddRows(
		row.New(40).Add(
			col.New(12).Add(
				text.New(doc.Title, props.Text{
					Size:  24,
					Style: fontstyle.Bold,
					Align: align.Center,
					Top:   20,
				}),
			),
		),
	)

	// 描述
	if doc.Description != "" {
		m.AddRows(
			row.New(20).Add(
				col.New(12).Add(
					text.New(doc.Description, props.Text{
						Size:  12,
						Align: align.Center,
						Top:   5,
						Color: &props.Color{Red: 100, Green: 100, Blue: 100},
					}),
				),
			),
		)
	}

	// 作者和日期
	m.AddRows(
		row.New(30).Add(
			col.New(12).Add(
				text.New(fmt.Sprintf("作者: %s", doc.Author), props.Text{
					Size:  10,
					Align: align.Center,
					Top:   15,
				}),
			),
		),
		row.New(10).Add(
			col.New(12).Add(
				text.New(fmt.Sprintf("生成日期: %s", doc.CreatedAt.Format("2006-01-02 15:04")), props.Text{
					Size:  10,
					Align: align.Center,
				}),
			),
		),
	)

	// 分页
	m.AddRows(row.New(50))
}

// addTableOfContents 添加目录
func (e *PDFExporter) addTableOfContents(m core.Maroto, doc *PDFDocument) {
	// 目录标题
	m.AddRows(
		row.New(15).Add(
			col.New(12).Add(
				text.New("目录", props.Text{
					Size:  18,
					Style: fontstyle.Bold,
					Align: align.Left,
				}),
			),
		),
	)

	// 目录项
	for i, section := range doc.Sections {
		m.AddRows(
			row.New(8).Add(
				col.New(1).Add(
					text.New(fmt.Sprintf("%d.", i+1), props.Text{
						Size:  10,
						Align: align.Right,
					}),
				),
				col.New(11).Add(
					text.New(section.Title, props.Text{
						Size:  10,
						Align: align.Left,
						Left:  2,
					}),
				),
			),
		)
	}

	// 目录后空行
	m.AddRows(row.New(20))
}

// addSection 添加章节
func (e *PDFExporter) addSection(m core.Maroto, section DocumentSection) {
	// 章节标题
	m.AddRows(
		row.New(12).Add(
			col.New(12).Add(
				text.New(section.Title, props.Text{
					Size:  14,
					Style: fontstyle.Bold,
					Align: align.Left,
					Top:   5,
				}),
			),
		),
	)

	// 章节内容 - 将 Markdown 转换为纯文本
	content := e.markdownToText(section.Content)

	// 分段处理长文本
	paragraphs := strings.Split(content, "\n\n")
	for _, para := range paragraphs {
		para = strings.TrimSpace(para)
		if para == "" {
			continue
		}

		// 计算行数估算高度
		lines := e.estimateLines(para, 80) // 每行约 80 字符
		rowHeight := float64(lines) * 5.0  // 每行约 5mm
		if rowHeight < 8 {
			rowHeight = 8
		}
		if rowHeight > 200 {
			rowHeight = 200
		}

		m.AddRows(
			row.New(rowHeight).Add(
				col.New(12).Add(
					text.New(para, props.Text{
						Size:  10,
						Align: align.Left,
						Top:   2,
					}),
				),
			),
		)
	}

	// 章节后空行
	m.AddRows(row.New(10))
}

// markdownToText 将 Markdown 转换为纯文本
func (e *PDFExporter) markdownToText(md string) string {
	// 移除标题标记
	md = regexp.MustCompile(`^#{1,6}\s+`).ReplaceAllStringFunc(md, func(s string) string {
		return ""
	})

	// 处理粗体
	md = regexp.MustCompile(`\*\*(.+?)\*\*`).ReplaceAllString(md, "$1")
	md = regexp.MustCompile(`__(.+?)__`).ReplaceAllString(md, "$1")

	// 处理斜体
	md = regexp.MustCompile(`\*(.+?)\*`).ReplaceAllString(md, "$1")
	md = regexp.MustCompile(`_(.+?)_`).ReplaceAllString(md, "$1")

	// 处理行内代码
	md = regexp.MustCompile("`(.+?)`").ReplaceAllString(md, "$1")

	// 处理链接
	md = regexp.MustCompile(`\[(.+?)\]\(.+?\)`).ReplaceAllString(md, "$1")

	// 处理代码块
	md = regexp.MustCompile("(?s)```.*?```").ReplaceAllString(md, "")

	// 处理引用
	md = regexp.MustCompile(`(?m)^>\s*`).ReplaceAllString(md, "")

	// 处理无序列表
	md = regexp.MustCompile(`(?m)^[-*+]\s+`).ReplaceAllString(md, "• ")

	// 处理有序列表
	md = regexp.MustCompile(`(?m)^\d+\.\s+`).ReplaceAllString(md, "")

	// 处理水平线
	md = regexp.MustCompile(`(?m)^[-*_]{3,}$`).ReplaceAllString(md, "")

	// 清理多余空行
	md = regexp.MustCompile(`\n{3,}`).ReplaceAllString(md, "\n\n")

	return strings.TrimSpace(md)
}

// estimateLines 估算文本行数
func (e *PDFExporter) estimateLines(text string, charsPerLine int) int {
	lines := 1
	currentLen := 0

	for _, r := range text {
		if r == '\n' {
			lines++
			currentLen = 0
			continue
		}

		// 中文字符算 2 个字符宽度
		if r >= 0x4e00 && r <= 0x9fff {
			currentLen += 2
		} else {
			currentLen++
		}

		if currentLen >= charsPerLine {
			lines++
			currentLen = 0
		}
	}

	return lines
}

// ExportFromMarkdown 从 Markdown 导出 PDF
func (e *PDFExporter) ExportFromMarkdown(title, markdown, author string) ([]byte, error) {
	doc := &PDFDocument{
		Title:     title,
		Author:    author,
		CreatedAt: time.Now(),
		Sections:  e.parseMarkdownSections(markdown),
	}

	return e.Export(doc)
}

// parseMarkdownSections 从 Markdown 解析章节
func (e *PDFExporter) parseMarkdownSections(markdown string) []DocumentSection {
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

// PDFExportOptions PDF 导出选项
type PDFExportOptions struct {
	IncludeTableOfContents bool
	IncludePageNumbers     bool
	WatermarkText          string
	PageSize               string
}

// DefaultPDFExportOptions 默认导出选项
func DefaultPDFExportOptions() *PDFExportOptions {
	return &PDFExportOptions{
		IncludeTableOfContents: true,
		IncludePageNumbers:     true,
		WatermarkText:          "",
		PageSize:               "A4",
	}
}

// GetContentAsPDF 获取 PDF 内容的辅助函数
func GetContentAsPDF(title, content, author string) ([]byte, error) {
	exporter := NewPDFExporter()
	return exporter.ExportFromMarkdown(title, content, author)
}

// GetFilename 获取 PDF 文件名
func GetFilename(title string) string {
	// 清理文件名中的非法字符
	filename := regexp.MustCompile(`[<>:"/\\|?*]`).ReplaceAllString(title, "_")
	filename = strings.TrimSpace(filename)
	if filename == "" {
		filename = "document"
	}
	return filename + ".pdf"
}

// ContentType PDF 内容类型
const ContentType = "application/pdf"

// Buffer 创建一个用于写入 PDF 的 buffer
func Buffer() *bytes.Buffer {
	return new(bytes.Buffer)
}
