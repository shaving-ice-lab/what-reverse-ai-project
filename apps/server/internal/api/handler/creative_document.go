package handler

import (
	"net/http"
	"strconv"
	"time"

	"github.com/agentflow/server/internal/api/middleware"
	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/repository"
	"github.com/agentflow/server/internal/service"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

// CreativeDocumentHandler 创意文档处理器
type CreativeDocumentHandler struct {
	docService service.CreativeDocumentService
}

// NewCreativeDocumentHandler 创建创意文档处理器
func NewCreativeDocumentHandler(docService service.CreativeDocumentService) *CreativeDocumentHandler {
	return &CreativeDocumentHandler{
		docService: docService,
	}
}

// ================== 请求/响应结构 ==================

// DocumentListResponse 文档列表响应项
type DocumentListResponse struct {
	ID           uuid.UUID `json:"id"`
	Title        string    `json:"title"`
	Description  *string   `json:"description,omitempty"`
	TemplateName string    `json:"template_name,omitempty"`
	WordCount    int       `json:"word_count"`
	SectionCount int       `json:"section_count"`
	Version      int       `json:"version"`
	IsArchived   bool      `json:"is_archived"`
	HasShare     bool      `json:"has_share"`
	CreatedAt    string    `json:"created_at"`
	UpdatedAt    string    `json:"updated_at"`
}

// DocumentDetailResponse 文档详情响应
type DocumentDetailResponse struct {
	ID              uuid.UUID      `json:"id"`
	Title           string         `json:"title"`
	Description     *string        `json:"description,omitempty"`
	Content         string         `json:"content"`
	Sections        entity.JSON    `json:"sections"`
	TableOfContents *string        `json:"table_of_contents,omitempty"`
	Summary         *string        `json:"summary,omitempty"`
	WordCount       int            `json:"word_count"`
	CharCount       int            `json:"char_count"`
	SectionCount    int            `json:"section_count"`
	Version         int            `json:"version"`
	IsArchived      bool           `json:"is_archived"`
	TokenUsage      entity.JSON    `json:"token_usage,omitempty"`
	TemplateID      *uuid.UUID     `json:"template_id,omitempty"`
	TemplateName    string         `json:"template_name,omitempty"`
	TaskID          *uuid.UUID     `json:"task_id,omitempty"`
	ShareSettings   *ShareResponse `json:"share,omitempty"`
	CreatedAt       string         `json:"created_at"`
	UpdatedAt       string         `json:"updated_at"`
}

// ShareResponse 分享设置响应
type ShareResponse struct {
	ShareID       string  `json:"share_id"`
	ShareURL      string  `json:"share_url"`
	HasPassword   bool    `json:"has_password"`
	ExpiresAt     *string `json:"expires_at,omitempty"`
	IsPublic      bool    `json:"is_public"`
	AllowDownload bool    `json:"allow_download"`
}

// UpdateDocumentRequest 更新文档请求
type UpdateDocumentRequest struct {
	Title       *string `json:"title,omitempty"`
	Description *string `json:"description,omitempty"`
	Content     *string `json:"content,omitempty"`
	Summary     *string `json:"summary,omitempty"`
}

// DocumentShareRequest 创建分享请求
type DocumentShareRequest struct {
	Password      *string `json:"password,omitempty"`
	ExpiresIn     *int    `json:"expires_in,omitempty"` // 过期时间（小时）
	IsPublic      bool    `json:"is_public"`
	AllowDownload bool    `json:"allow_download"`
}

// VerifyShareRequest 验证分享密码请求
type VerifyShareRequest struct {
	Password string `json:"password"`
}

// RegenerateSectionRequest 重新生成章节请求
type RegenerateSectionRequest struct {
	SectionID   string `json:"section_id" validate:"required"`
	Instruction string `json:"instruction,omitempty"` // 附加指令
}

// RegenerateSectionResponse 重新生成章节响应
type RegenerateSectionResponse struct {
	SectionID       string `json:"section_id"`
	Title           string `json:"title"`
	Content         string `json:"content"`
	PreviousVersion int    `json:"previous_version"`
	CurrentVersion  int    `json:"current_version"`
	TokenUsed       int    `json:"token_used"`
}

// SectionVersionResponse 章节版本响应
type SectionVersionResponse struct {
	ID          string  `json:"id"`
	SectionID   string  `json:"section_id"`
	Version     int     `json:"version"`
	Title       string  `json:"title"`
	Content     string  `json:"content"`
	Instruction *string `json:"instruction,omitempty"`
	CreatedAt   string  `json:"created_at"`
}

// ================== API 端点 ==================

// List 获取文档列表
// GET /api/v1/creative/documents
// @Summary 获取创意文档列表
// @Description 获取当前用户的创意文档列表，支持搜索、筛选和分页
// @Tags Creative Documents
// @Produce json
// @Security BearerAuth
// @Param search query string false "搜索关键词"
// @Param template_id query string false "模板 ID 筛选"
// @Param is_archived query bool false "是否归档"
// @Param page query int false "页码" default(1)
// @Param page_size query int false "每页数量" default(20)
// @Param sort query string false "排序方式 (newest/oldest/title)" default(newest)
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/creative/documents [get]
func (h *CreativeDocumentHandler) List(c echo.Context) error {
	// 获取当前用户
	userIDStr := middleware.GetUserID(c)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return errorResponse(c, http.StatusUnauthorized, "UNAUTHORIZED", "请先登录")
	}

	// 解析分页参数
	page, _ := strconv.Atoi(c.QueryParam("page"))
	pageSize, _ := strconv.Atoi(c.QueryParam("page_size"))
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}
	if pageSize > 100 {
		pageSize = 100
	}

	// 构建查询参数
	params := repository.CreativeDocumentListParams{
		Search:   c.QueryParam("search"),
		Page:     page,
		PageSize: pageSize,
		Sort:     c.QueryParam("sort"),
	}

	// 模板筛选
	if templateIDStr := c.QueryParam("template_id"); templateIDStr != "" {
		if templateID, err := uuid.Parse(templateIDStr); err == nil {
			params.TemplateID = &templateID
		}
	}

	// 归档筛选
	if archivedStr := c.QueryParam("is_archived"); archivedStr != "" {
		archived := archivedStr == "true"
		params.IsArchived = &archived
	}

	// 调用服务
	docs, total, err := h.docService.List(c.Request().Context(), userID, params)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "LIST_FAILED", "获取文档列表失败")
	}

	// 转换响应
	items := make([]DocumentListResponse, len(docs))
	for i, doc := range docs {
		items[i] = h.buildListResponse(&doc)
	}

	return successResponseWithMeta(c, map[string]interface{}{
		"documents": items,
	}, map[string]interface{}{
		"total":       total,
		"page":        page,
		"page_size":   pageSize,
		"total_pages": (total + int64(pageSize) - 1) / int64(pageSize),
	})
}

// Get 获取文档详情
// GET /api/v1/creative/documents/:id
// @Summary 获取创意文档详情
// @Description 获取指定创意文档的完整内容和元数据
// @Tags Creative Documents
// @Produce json
// @Security BearerAuth
// @Param id path string true "文档 ID"
// @Success 200 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Router /api/v1/creative/documents/{id} [get]
func (h *CreativeDocumentHandler) Get(c echo.Context) error {
	// 获取当前用户
	userIDStr := middleware.GetUserID(c)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return errorResponse(c, http.StatusUnauthorized, "UNAUTHORIZED", "请先登录")
	}

	// 解析文档 ID
	docID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "无效的文档 ID")
	}

	// 获取文档
	doc, err := h.docService.GetByID(c.Request().Context(), docID, userID)
	if err != nil {
		if err == service.ErrCreativeDocumentNotFound {
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "文档不存在")
		}
		return errorResponse(c, http.StatusInternalServerError, "GET_FAILED", "获取文档失败")
	}

	return successResponse(c, map[string]interface{}{
		"document": h.buildDetailResponse(doc),
	})
}

// Update 更新文档
// PATCH /api/v1/creative/documents/:id
// @Summary 更新创意文档
// @Description 更新文档的标题、描述、内容或摘要
// @Tags Creative Documents
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "文档 ID"
// @Param request body UpdateDocumentRequest true "更新内容"
// @Success 200 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Router /api/v1/creative/documents/{id} [patch]
func (h *CreativeDocumentHandler) Update(c echo.Context) error {
	// 获取当前用户
	userIDStr := middleware.GetUserID(c)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return errorResponse(c, http.StatusUnauthorized, "UNAUTHORIZED", "请先登录")
	}

	// 解析文档 ID
	docID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "无效的文档 ID")
	}

	// 解析请求
	var req UpdateDocumentRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数格式错误")
	}

	// 更新文档
	doc, err := h.docService.Update(c.Request().Context(), docID, userID, service.UpdateDocumentInput{
		Title:       req.Title,
		Description: req.Description,
		Content:     req.Content,
		Summary:     req.Summary,
	})
	if err != nil {
		if err == service.ErrCreativeDocumentNotFound {
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "文档不存在")
		}
		return errorResponse(c, http.StatusInternalServerError, "UPDATE_FAILED", "更新文档失败")
	}

	return successResponse(c, map[string]interface{}{
		"document": h.buildDetailResponse(doc),
	})
}

// Delete 删除文档
// DELETE /api/v1/creative/documents/:id
// @Summary 删除创意文档
// @Description 软删除指定的创意文档
// @Tags Creative Documents
// @Produce json
// @Security BearerAuth
// @Param id path string true "文档 ID"
// @Success 200 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Router /api/v1/creative/documents/{id} [delete]
func (h *CreativeDocumentHandler) Delete(c echo.Context) error {
	// 获取当前用户
	userIDStr := middleware.GetUserID(c)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return errorResponse(c, http.StatusUnauthorized, "UNAUTHORIZED", "请先登录")
	}

	// 解析文档 ID
	docID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "无效的文档 ID")
	}

	// 删除文档
	if err := h.docService.Delete(c.Request().Context(), docID, userID); err != nil {
		if err == service.ErrCreativeDocumentNotFound {
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "文档不存在")
		}
		return errorResponse(c, http.StatusInternalServerError, "DELETE_FAILED", "删除文档失败")
	}

	return successResponse(c, map[string]interface{}{
		"message": "文档已删除",
	})
}

// Archive 归档文档
// POST /api/v1/creative/documents/:id/archive
func (h *CreativeDocumentHandler) Archive(c echo.Context) error {
	userIDStr := middleware.GetUserID(c)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return errorResponse(c, http.StatusUnauthorized, "UNAUTHORIZED", "请先登录")
	}

	docID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "无效的文档 ID")
	}

	if err := h.docService.Archive(c.Request().Context(), docID, userID); err != nil {
		if err == service.ErrCreativeDocumentNotFound {
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "文档不存在")
		}
		return errorResponse(c, http.StatusInternalServerError, "ARCHIVE_FAILED", "归档失败")
	}

	return successResponse(c, map[string]interface{}{
		"message": "文档已归档",
	})
}

// Unarchive 取消归档
// POST /api/v1/creative/documents/:id/unarchive
func (h *CreativeDocumentHandler) Unarchive(c echo.Context) error {
	userIDStr := middleware.GetUserID(c)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return errorResponse(c, http.StatusUnauthorized, "UNAUTHORIZED", "请先登录")
	}

	docID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "无效的文档 ID")
	}

	if err := h.docService.Unarchive(c.Request().Context(), docID, userID); err != nil {
		if err == service.ErrCreativeDocumentNotFound {
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "文档不存在")
		}
		return errorResponse(c, http.StatusInternalServerError, "UNARCHIVE_FAILED", "取消归档失败")
	}

	return successResponse(c, map[string]interface{}{
		"message": "已取消归档",
	})
}

// Export 导出文档
// GET /api/v1/creative/documents/:id/export
func (h *CreativeDocumentHandler) Export(c echo.Context) error {
	userIDStr := middleware.GetUserID(c)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return errorResponse(c, http.StatusUnauthorized, "UNAUTHORIZED", "请先登录")
	}

	docID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "无效的文档 ID")
	}

	format := c.QueryParam("format")
	if format == "" {
		format = "markdown"
	}

	switch format {
	case "markdown":
		content, err := h.docService.ExportMarkdown(c.Request().Context(), docID, userID)
		if err != nil {
			if err == service.ErrCreativeDocumentNotFound {
				return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "文档不存在")
			}
			return errorResponse(c, http.StatusInternalServerError, "EXPORT_FAILED", "导出失败")
		}

		c.Response().Header().Set("Content-Type", "text/markdown; charset=utf-8")
		c.Response().Header().Set("Content-Disposition", "attachment; filename=document.md")
		return c.String(http.StatusOK, content)

	case "pdf":
		pdfData, filename, err := h.docService.ExportPDF(c.Request().Context(), docID, userID)
		if err != nil {
			if err == service.ErrCreativeDocumentNotFound {
				return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "文档不存在")
			}
			return errorResponse(c, http.StatusInternalServerError, "EXPORT_FAILED", "PDF 导出失败")
		}

		c.Response().Header().Set("Content-Type", "application/pdf")
		c.Response().Header().Set("Content-Disposition", "attachment; filename="+filename)
		return c.Blob(http.StatusOK, "application/pdf", pdfData)

	case "docx", "word", "rtf":
		docxData, filename, err := h.docService.ExportDOCX(c.Request().Context(), docID, userID)
		if err != nil {
			if err == service.ErrCreativeDocumentNotFound {
				return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "文档不存在")
			}
			return errorResponse(c, http.StatusInternalServerError, "EXPORT_FAILED", "Word 文档导出失败")
		}

		c.Response().Header().Set("Content-Type", "application/rtf")
		c.Response().Header().Set("Content-Disposition", "attachment; filename="+filename)
		return c.Blob(http.StatusOK, "application/rtf", docxData)

	default:
		return errorResponse(c, http.StatusBadRequest, "INVALID_FORMAT", "不支持的导出格式，支持: markdown, pdf, docx")
	}
}

// RegenerateSection 重新生成章节
// POST /api/v1/creative/documents/:id/regenerate
// @Summary 重新生成文档章节
// @Description 使用 AI 重新生成指定章节的内容，支持附加指令来调整生成结果
// @Tags Creative Documents
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "文档 ID"
// @Param request body RegenerateSectionRequest true "重新生成参数"
// @Success 200 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Router /api/v1/creative/documents/{id}/regenerate [post]
func (h *CreativeDocumentHandler) RegenerateSection(c echo.Context) error {
	userIDStr := middleware.GetUserID(c)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return errorResponse(c, http.StatusUnauthorized, "UNAUTHORIZED", "请先登录")
	}

	docID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "无效的文档 ID")
	}

	var req RegenerateSectionRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数格式错误")
	}

	if req.SectionID == "" {
		return errorResponse(c, http.StatusBadRequest, "MISSING_SECTION_ID", "缺少章节 ID")
	}

	result, err := h.docService.RegenerateSection(c.Request().Context(), docID, userID, req.SectionID, req.Instruction)
	if err != nil {
		switch err {
		case service.ErrCreativeDocumentNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "文档不存在")
		case service.ErrSectionNotFound:
			return errorResponse(c, http.StatusNotFound, "SECTION_NOT_FOUND", "章节不存在")
		default:
			return errorResponse(c, http.StatusInternalServerError, "REGENERATE_FAILED", "重新生成失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"result": RegenerateSectionResponse{
			SectionID:       result.SectionID,
			Title:           result.Title,
			Content:         result.Content,
			PreviousVersion: result.PreviousVersion,
			CurrentVersion:  result.CurrentVersion,
			TokenUsed:       result.TokenUsed,
		},
	})
}

// GetSectionVersions 获取章节版本历史
// GET /api/v1/creative/documents/:id/sections/:sectionId/versions
// @Summary 获取章节版本历史
// @Description 获取指定章节的所有历史版本
// @Tags Creative Documents
// @Produce json
// @Security BearerAuth
// @Param id path string true "文档 ID"
// @Param sectionId path string true "章节 ID"
// @Success 200 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Router /api/v1/creative/documents/{id}/sections/{sectionId}/versions [get]
func (h *CreativeDocumentHandler) GetSectionVersions(c echo.Context) error {
	userIDStr := middleware.GetUserID(c)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return errorResponse(c, http.StatusUnauthorized, "UNAUTHORIZED", "请先登录")
	}

	docID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "无效的文档 ID")
	}

	sectionID := c.Param("sectionId")
	if sectionID == "" {
		return errorResponse(c, http.StatusBadRequest, "MISSING_SECTION_ID", "缺少章节 ID")
	}

	versions, err := h.docService.GetSectionVersions(c.Request().Context(), docID, userID, sectionID)
	if err != nil {
		if err == service.ErrCreativeDocumentNotFound {
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "文档不存在")
		}
		return errorResponse(c, http.StatusInternalServerError, "GET_VERSIONS_FAILED", "获取版本历史失败")
	}

	// 转换响应
	items := make([]SectionVersionResponse, len(versions))
	for i, v := range versions {
		items[i] = SectionVersionResponse{
			ID:          v.ID.String(),
			SectionID:   v.SectionID,
			Version:     v.Version,
			Title:       v.Title,
			Content:     v.Content,
			Instruction: v.Instruction,
			CreatedAt:   v.CreatedAt.Format(time.RFC3339),
		}
	}

	return successResponse(c, map[string]interface{}{
		"versions": items,
	})
}

// CreateShare 创建分享
// POST /api/v1/creative/documents/:id/share
func (h *CreativeDocumentHandler) CreateShare(c echo.Context) error {
	userIDStr := middleware.GetUserID(c)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return errorResponse(c, http.StatusUnauthorized, "UNAUTHORIZED", "请先登录")
	}

	docID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "无效的文档 ID")
	}

	var req DocumentShareRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数格式错误")
	}

	// 计算过期时间
	var expiresAt *time.Time
	if req.ExpiresIn != nil && *req.ExpiresIn > 0 {
		t := time.Now().Add(time.Duration(*req.ExpiresIn) * time.Hour)
		expiresAt = &t
	}

	share, err := h.docService.CreateShare(c.Request().Context(), docID, userID, service.CreateShareInput{
		Password:      req.Password,
		ExpiresAt:     expiresAt,
		IsPublic:      req.IsPublic,
		AllowDownload: req.AllowDownload,
	})
	if err != nil {
		if err == service.ErrCreativeDocumentNotFound {
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "文档不存在")
		}
		return errorResponse(c, http.StatusInternalServerError, "CREATE_SHARE_FAILED", "创建分享失败")
	}

	return successResponse(c, map[string]interface{}{
		"share": h.buildShareResponse(share),
	})
}

// DeleteShare 删除分享
// DELETE /api/v1/creative/documents/:id/share
func (h *CreativeDocumentHandler) DeleteShare(c echo.Context) error {
	userIDStr := middleware.GetUserID(c)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return errorResponse(c, http.StatusUnauthorized, "UNAUTHORIZED", "请先登录")
	}

	docID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "无效的文档 ID")
	}

	if err := h.docService.DeleteShare(c.Request().Context(), docID, userID); err != nil {
		if err == service.ErrCreativeDocumentNotFound {
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "文档不存在")
		}
		return errorResponse(c, http.StatusInternalServerError, "DELETE_SHARE_FAILED", "删除分享失败")
	}

	return successResponse(c, map[string]interface{}{
		"message": "分享已删除",
	})
}

// GetByShare 通过分享链接获取文档（公开接口）
// GET /api/v1/creative/share/:shareId
func (h *CreativeDocumentHandler) GetByShare(c echo.Context) error {
	shareID := c.Param("shareId")
	if shareID == "" {
		return errorResponse(c, http.StatusBadRequest, "INVALID_SHARE_ID", "无效的分享链接")
	}

	// 获取密码（如果有）
	var password *string
	if pwd := c.QueryParam("password"); pwd != "" {
		password = &pwd
	}

	doc, err := h.docService.GetByShareID(c.Request().Context(), shareID, password)
	if err != nil {
		switch err {
		case service.ErrCreativeDocumentShareNotFound:
			return errorResponse(c, http.StatusNotFound, "SHARE_NOT_FOUND", "分享链接不存在或已过期")
		case service.ErrCreativeDocumentSharePassword:
			return errorResponse(c, http.StatusUnauthorized, "PASSWORD_REQUIRED", "需要密码")
		default:
			return errorResponse(c, http.StatusInternalServerError, "GET_SHARE_FAILED", "获取分享文档失败")
		}
	}

	// 构建公开响应（隐藏敏感信息）
	return successResponse(c, map[string]interface{}{
		"document": map[string]interface{}{
			"title":             doc.Title,
			"content":           doc.Content,
			"sections":          doc.Sections,
			"table_of_contents": doc.TableOfContents,
			"word_count":        doc.WordCount,
			"allow_download":    doc.AllowDownload,
			"created_at":        doc.CreatedAt.Format(time.RFC3339),
		},
	})
}

// ================== 辅助方法 ==================

// buildListResponse 构建列表响应
func (h *CreativeDocumentHandler) buildListResponse(doc *entity.CreativeDocument) DocumentListResponse {
	resp := DocumentListResponse{
		ID:           doc.ID,
		Title:        doc.Title,
		Description:  doc.Description,
		WordCount:    doc.WordCount,
		SectionCount: doc.SectionCount,
		Version:      doc.Version,
		IsArchived:   doc.IsArchived,
		HasShare:     doc.ShareID != nil,
		CreatedAt:    doc.CreatedAt.Format(time.RFC3339),
		UpdatedAt:    doc.UpdatedAt.Format(time.RFC3339),
	}

	if doc.Template != nil {
		resp.TemplateName = doc.Template.Name
	}

	return resp
}

// buildDetailResponse 构建详情响应
func (h *CreativeDocumentHandler) buildDetailResponse(doc *entity.CreativeDocument) DocumentDetailResponse {
	resp := DocumentDetailResponse{
		ID:              doc.ID,
		Title:           doc.Title,
		Description:     doc.Description,
		Content:         doc.Content,
		Sections:        doc.Sections,
		TableOfContents: doc.TableOfContents,
		Summary:         doc.Summary,
		WordCount:       doc.WordCount,
		CharCount:       doc.CharCount,
		SectionCount:    doc.SectionCount,
		Version:         doc.Version,
		IsArchived:      doc.IsArchived,
		TokenUsage:      doc.TokenUsage,
		TemplateID:      doc.TemplateID,
		TaskID:          doc.TaskID,
		CreatedAt:       doc.CreatedAt.Format(time.RFC3339),
		UpdatedAt:       doc.UpdatedAt.Format(time.RFC3339),
	}

	if doc.Template != nil {
		resp.TemplateName = doc.Template.Name
	}

	if doc.ShareID != nil {
		resp.ShareSettings = h.buildShareResponse(doc.GetShareSettings())
	}

	return resp
}

// buildShareResponse 构建分享响应
func (h *CreativeDocumentHandler) buildShareResponse(share *entity.ShareSettings) *ShareResponse {
	if share == nil {
		return nil
	}

	resp := &ShareResponse{
		ShareID:       share.ShareID,
		ShareURL:      "/api/v1/creative/share/" + share.ShareID,
		HasPassword:   share.Password != nil,
		IsPublic:      share.IsPublic,
		AllowDownload: share.AllowDownload,
	}

	if share.ExpiresAt != nil {
		t := share.ExpiresAt.Format(time.RFC3339)
		resp.ExpiresAt = &t
	}

	return resp
}
