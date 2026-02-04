package handler

import (
	"net/http"
	"strconv"
	"time"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/pkg/security"
	"github.com/agentflow/server/internal/repository"
	"github.com/agentflow/server/internal/service"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

// SupplyChainHandler 供应链安全处理器
type SupplyChainHandler struct {
	supplyChainService service.SupplyChainService
	workspaceService   service.WorkspaceService
}

// NewSupplyChainHandler 创建供应链安全处理器
func NewSupplyChainHandler(
	supplyChainService service.SupplyChainService,
	workspaceService service.WorkspaceService,
) *SupplyChainHandler {
	return &SupplyChainHandler{
		supplyChainService: supplyChainService,
		workspaceService:   workspaceService,
	}
}

// RegisterRoutes 注册路由
func (h *SupplyChainHandler) RegisterRoutes(g *echo.Group) {
	g.GET("/security/supply-chain/license-policy", h.GetLicensePolicy)
	g.POST("/security/supply-chain/license-review", h.ReviewLicenses)

	g.POST("/security/supply-chain/sboms", h.CreateSBOM)
	g.GET("/security/supply-chain/sboms", h.ListSBOMs)
	g.GET("/security/supply-chain/sboms/latest", h.GetLatestSBOM)

	g.POST("/security/supply-chain/signatures", h.CreateSignature)
	g.GET("/security/supply-chain/signatures", h.ListSignatures)
	g.GET("/security/supply-chain/signatures/latest", h.GetLatestSignature)
}

type licenseReviewRequest struct {
	WorkspaceID  *string                      `json:"workspace_id,omitempty"`
	Dependencies []security.LicenseDependency `json:"dependencies"`
}

// GetLicensePolicy 获取依赖许可审查规则
// @Summary 获取依赖许可审查规则
// @Tags Security
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/security/supply-chain/license-policy [get]
func (h *SupplyChainHandler) GetLicensePolicy(c echo.Context) error {
	policy := h.supplyChainService.GetLicensePolicy()
	return successResponse(c, policy)
}

// ReviewLicenses 执行依赖许可审查
// @Summary 执行依赖许可审查
// @Tags Security
// @Accept json
// @Produce json
// @Param payload body licenseReviewRequest true "依赖列表"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Router /api/v1/security/supply-chain/license-review [post]
func (h *SupplyChainHandler) ReviewLicenses(c echo.Context) error {
	var req licenseReviewRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}
	if len(req.Dependencies) == 0 {
		return errorResponse(c, http.StatusBadRequest, "EMPTY_DEPENDENCIES", "依赖列表不能为空")
	}
	if req.WorkspaceID != nil && *req.WorkspaceID != "" {
		workspaceID, err := uuid.Parse(*req.WorkspaceID)
		if err != nil {
			return errorResponse(c, http.StatusBadRequest, "WORKSPACE_INVALID_ID", "无效的工作空间ID")
		}
		if err := h.ensureWorkspaceAdmin(c, workspaceID); err != nil {
			return err
		}
	}

	result, err := h.supplyChainService.ReviewLicenses(req.Dependencies)
	if err != nil {
		return errorResponseWithDetails(c, http.StatusBadRequest, "LICENSE_REVIEW_DISABLED", "依赖许可审查未启用", map[string]interface{}{
			"error": err.Error(),
		})
	}
	return successResponse(c, result)
}

type createSBOMRequest struct {
	WorkspaceID  string      `json:"workspace_id"`
	ArtifactType string      `json:"artifact_type"`
	ArtifactID   string      `json:"artifact_id"`
	Format       string      `json:"format"`
	Version      *string     `json:"version,omitempty"`
	Source       *string     `json:"source,omitempty"`
	Digest       *string     `json:"digest,omitempty"`
	Content      entity.JSON `json:"content"`
	Metadata     entity.JSON `json:"metadata,omitempty"`
	GeneratedAt  *string     `json:"generated_at,omitempty"`
}

// CreateSBOM 上传 SBOM 存档
// @Summary 上传 SBOM 存档
// @Tags Security
// @Accept json
// @Produce json
// @Param payload body createSBOMRequest true "SBOM 数据"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Router /api/v1/security/supply-chain/sboms [post]
func (h *SupplyChainHandler) CreateSBOM(c echo.Context) error {
	var req createSBOMRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}
	if req.WorkspaceID == "" {
		return errorResponse(c, http.StatusBadRequest, "WORKSPACE_REQUIRED", "需要提供 workspace_id")
	}
	workspaceID, err := uuid.Parse(req.WorkspaceID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "WORKSPACE_INVALID_ID", "无效的工作空间ID")
	}
	if err := h.ensureWorkspaceAdmin(c, workspaceID); err != nil {
		return err
	}
	if req.ArtifactType == "" || req.ArtifactID == "" {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ARTIFACT", "artifact_type 与 artifact_id 为必填")
	}
	if req.Content == nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_SBOM", "SBOM 内容不能为空")
	}

	var generatedAt *time.Time
	if req.GeneratedAt != nil && *req.GeneratedAt != "" {
		parsed, parseErr := time.Parse(time.RFC3339, *req.GeneratedAt)
		if parseErr != nil {
			return errorResponse(c, http.StatusBadRequest, "INVALID_TIME", "generated_at 必须为 RFC3339")
		}
		generatedAt = &parsed
	}

	userID, ok := c.Get("user_id").(uuid.UUID)
	if !ok {
		return errorResponse(c, http.StatusUnauthorized, "UNAUTHORIZED", "未授权访问")
	}

	record, err := h.supplyChainService.CreateSBOM(c.Request().Context(), service.CreateSBOMInput{
		WorkspaceID:  workspaceID,
		ArtifactType: req.ArtifactType,
		ArtifactID:   req.ArtifactID,
		Format:       req.Format,
		Version:      req.Version,
		Source:       req.Source,
		Digest:       req.Digest,
		Content:      req.Content,
		Metadata:     req.Metadata,
		GeneratedAt:  generatedAt,
		CreatedBy:    &userID,
	})
	if err != nil {
		return errorResponseWithDetails(c, http.StatusBadRequest, "SBOM_CREATE_FAILED", "SBOM 存档失败", map[string]interface{}{
			"error": err.Error(),
		})
	}
	return successResponse(c, record)
}

// ListSBOMs 获取 SBOM 存档列表
// @Summary 获取 SBOM 存档列表
// @Tags Security
// @Accept json
// @Produce json
// @Param workspace_id query string true "工作空间ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Router /api/v1/security/supply-chain/sboms [get]
func (h *SupplyChainHandler) ListSBOMs(c echo.Context) error {
	workspaceID, err := h.parseWorkspaceIDParam(c)
	if err != nil {
		return err
	}
	if err := h.ensureWorkspaceAdmin(c, workspaceID); err != nil {
		return err
	}
	page, _ := strconv.Atoi(c.QueryParam("page"))
	pageSize, _ := strconv.Atoi(c.QueryParam("page_size"))

	filter := repository.SBOMFilter{
		WorkspaceID:  &workspaceID,
		ArtifactType: c.QueryParam("artifact_type"),
		ArtifactID:   c.QueryParam("artifact_id"),
		Format:       c.QueryParam("format"),
		Source:       c.QueryParam("source"),
	}
	records, total, err := h.supplyChainService.ListSBOMs(c.Request().Context(), filter, page, pageSize)
	if err != nil {
		return errorResponseWithDetails(c, http.StatusBadRequest, "SBOM_LIST_FAILED", "获取 SBOM 列表失败", map[string]interface{}{
			"error": err.Error(),
		})
	}
	return successResponseWithMeta(c, records, map[string]interface{}{
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

// GetLatestSBOM 获取最新 SBOM
// @Summary 获取最新 SBOM
// @Tags Security
// @Accept json
// @Produce json
// @Param workspace_id query string true "工作空间ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Router /api/v1/security/supply-chain/sboms/latest [get]
func (h *SupplyChainHandler) GetLatestSBOM(c echo.Context) error {
	workspaceID, err := h.parseWorkspaceIDParam(c)
	if err != nil {
		return err
	}
	if err := h.ensureWorkspaceAdmin(c, workspaceID); err != nil {
		return err
	}
	filter := repository.SBOMFilter{
		WorkspaceID:  &workspaceID,
		ArtifactType: c.QueryParam("artifact_type"),
		ArtifactID:   c.QueryParam("artifact_id"),
		Format:       c.QueryParam("format"),
		Source:       c.QueryParam("source"),
	}
	record, err := h.supplyChainService.GetLatestSBOM(c.Request().Context(), filter)
	if err != nil {
		return errorResponseWithDetails(c, http.StatusBadRequest, "SBOM_FETCH_FAILED", "获取 SBOM 失败", map[string]interface{}{
			"error": err.Error(),
		})
	}
	if record == nil {
		return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "未找到 SBOM 记录")
	}
	return successResponse(c, record)
}

type createSignatureRequest struct {
	WorkspaceID          string      `json:"workspace_id"`
	ArtifactType         string      `json:"artifact_type"`
	ArtifactID           string      `json:"artifact_id"`
	Digest               string      `json:"digest"`
	Algorithm            string      `json:"algorithm"`
	Signature            string      `json:"signature"`
	Signer               *string     `json:"signer,omitempty"`
	Certificate          *string     `json:"certificate,omitempty"`
	Source               *string     `json:"source,omitempty"`
	Verified             *bool       `json:"verified,omitempty"`
	VerifiedAt           *string     `json:"verified_at,omitempty"`
	VerificationMetadata entity.JSON `json:"verification_metadata,omitempty"`
}

// CreateSignature 上传构建产物签名
// @Summary 上传构建产物签名
// @Tags Security
// @Accept json
// @Produce json
// @Param payload body createSignatureRequest true "签名数据"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Router /api/v1/security/supply-chain/signatures [post]
func (h *SupplyChainHandler) CreateSignature(c echo.Context) error {
	var req createSignatureRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}
	if req.WorkspaceID == "" {
		return errorResponse(c, http.StatusBadRequest, "WORKSPACE_REQUIRED", "需要提供 workspace_id")
	}
	workspaceID, err := uuid.Parse(req.WorkspaceID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "WORKSPACE_INVALID_ID", "无效的工作空间ID")
	}
	if err := h.ensureWorkspaceAdmin(c, workspaceID); err != nil {
		return err
	}
	if req.ArtifactType == "" || req.ArtifactID == "" || req.Digest == "" || req.Algorithm == "" || req.Signature == "" {
		return errorResponse(c, http.StatusBadRequest, "INVALID_SIGNATURE", "签名数据不完整")
	}

	var verifiedAt *time.Time
	if req.VerifiedAt != nil && *req.VerifiedAt != "" {
		parsed, parseErr := time.Parse(time.RFC3339, *req.VerifiedAt)
		if parseErr != nil {
			return errorResponse(c, http.StatusBadRequest, "INVALID_TIME", "verified_at 必须为 RFC3339")
		}
		verifiedAt = &parsed
	}

	userID, ok := c.Get("user_id").(uuid.UUID)
	if !ok {
		return errorResponse(c, http.StatusUnauthorized, "UNAUTHORIZED", "未授权访问")
	}

	record, err := h.supplyChainService.CreateSignature(c.Request().Context(), service.CreateSignatureInput{
		WorkspaceID:  workspaceID,
		ArtifactType: req.ArtifactType,
		ArtifactID:   req.ArtifactID,
		Digest:       req.Digest,
		Algorithm:    req.Algorithm,
		Signature:    req.Signature,
		Signer:       req.Signer,
		Certificate:  req.Certificate,
		Source:       req.Source,
		Verified:     req.Verified,
		VerifiedAt:   verifiedAt,
		Metadata:     req.VerificationMetadata,
		CreatedBy:    &userID,
	})
	if err != nil {
		return errorResponseWithDetails(c, http.StatusBadRequest, "SIGNATURE_CREATE_FAILED", "签名存档失败", map[string]interface{}{
			"error": err.Error(),
		})
	}
	return successResponse(c, record)
}

// ListSignatures 获取签名列表
// @Summary 获取签名列表
// @Tags Security
// @Accept json
// @Produce json
// @Param workspace_id query string true "工作空间ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Router /api/v1/security/supply-chain/signatures [get]
func (h *SupplyChainHandler) ListSignatures(c echo.Context) error {
	workspaceID, err := h.parseWorkspaceIDParam(c)
	if err != nil {
		return err
	}
	if err := h.ensureWorkspaceAdmin(c, workspaceID); err != nil {
		return err
	}
	page, _ := strconv.Atoi(c.QueryParam("page"))
	pageSize, _ := strconv.Atoi(c.QueryParam("page_size"))

	filter := repository.SignatureFilter{
		WorkspaceID:  &workspaceID,
		ArtifactType: c.QueryParam("artifact_type"),
		ArtifactID:   c.QueryParam("artifact_id"),
		Digest:       c.QueryParam("digest"),
		Algorithm:    c.QueryParam("algorithm"),
	}
	records, total, err := h.supplyChainService.ListSignatures(c.Request().Context(), filter, page, pageSize)
	if err != nil {
		return errorResponseWithDetails(c, http.StatusBadRequest, "SIGNATURE_LIST_FAILED", "获取签名列表失败", map[string]interface{}{
			"error": err.Error(),
		})
	}
	return successResponseWithMeta(c, records, map[string]interface{}{
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

// GetLatestSignature 获取最新签名
// @Summary 获取最新签名
// @Tags Security
// @Accept json
// @Produce json
// @Param workspace_id query string true "工作空间ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Router /api/v1/security/supply-chain/signatures/latest [get]
func (h *SupplyChainHandler) GetLatestSignature(c echo.Context) error {
	workspaceID, err := h.parseWorkspaceIDParam(c)
	if err != nil {
		return err
	}
	if err := h.ensureWorkspaceAdmin(c, workspaceID); err != nil {
		return err
	}
	filter := repository.SignatureFilter{
		WorkspaceID:  &workspaceID,
		ArtifactType: c.QueryParam("artifact_type"),
		ArtifactID:   c.QueryParam("artifact_id"),
		Digest:       c.QueryParam("digest"),
		Algorithm:    c.QueryParam("algorithm"),
	}
	record, err := h.supplyChainService.GetLatestSignature(c.Request().Context(), filter)
	if err != nil {
		return errorResponseWithDetails(c, http.StatusBadRequest, "SIGNATURE_FETCH_FAILED", "获取签名失败", map[string]interface{}{
			"error": err.Error(),
		})
	}
	if record == nil {
		return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "未找到签名记录")
	}
	return successResponse(c, record)
}

func (h *SupplyChainHandler) parseWorkspaceIDParam(c echo.Context) (uuid.UUID, error) {
	raw := c.QueryParam("workspace_id")
	if raw == "" {
		return uuid.Nil, errorResponse(c, http.StatusBadRequest, "WORKSPACE_REQUIRED", "需要提供 workspace_id")
	}
	workspaceID, err := uuid.Parse(raw)
	if err != nil {
		return uuid.Nil, errorResponse(c, http.StatusBadRequest, "WORKSPACE_INVALID_ID", "无效的工作空间ID")
	}
	return workspaceID, nil
}

func (h *SupplyChainHandler) ensureWorkspaceAdmin(c echo.Context, workspaceID uuid.UUID) error {
	userID, ok := c.Get("user_id").(uuid.UUID)
	if !ok {
		return errorResponse(c, http.StatusUnauthorized, "UNAUTHORIZED", "未授权访问")
	}
	access, err := h.workspaceService.GetWorkspaceAccess(c.Request().Context(), workspaceID, userID)
	if err != nil {
		return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权访问此工作空间")
	}
	if !access.IsOwner && !hasPermissionJSON(access.Permissions, "workspace_admin") {
		return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "需要管理员权限")
	}
	return nil
}
