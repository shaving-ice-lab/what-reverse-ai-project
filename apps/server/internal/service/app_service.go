package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"reflect"
	"regexp"
	"strings"
	"time"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/pkg/idempotency"
	"github.com/agentflow/server/internal/pkg/uischema"
	"github.com/agentflow/server/internal/repository"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// AppService App 服务接口
type AppService interface {
	Create(ctx context.Context, ownerID uuid.UUID, req CreateAppRequest) (*entity.App, error)
	CreateFromWorkflow(ctx context.Context, ownerID uuid.UUID, req CreateAppFromWorkflowRequest) (*entity.App, error)
	CreateFromAI(ctx context.Context, ownerID uuid.UUID, req CreateAppFromAIRequest) (*entity.App, error)
	Update(ctx context.Context, ownerID uuid.UUID, appID uuid.UUID, req UpdateAppRequest) (*entity.App, error)
	UpdatePublicBranding(ctx context.Context, ownerID uuid.UUID, appID uuid.UUID, req UpdateAppPublicBrandingRequest) (*entity.AppVersion, error)
	UpdatePublicSEO(ctx context.Context, ownerID uuid.UUID, appID uuid.UUID, req UpdateAppPublicSEORequest) (*entity.AppVersion, error)
	UpdatePublicInputs(ctx context.Context, ownerID uuid.UUID, appID uuid.UUID, req UpdateAppPublicInputsRequest) (*entity.AppVersion, error)
	UpdateUISchema(ctx context.Context, ownerID uuid.UUID, appID uuid.UUID, req UpdateAppUISchemaRequest) (*entity.AppVersion, error)
	ListVersions(ctx context.Context, ownerID uuid.UUID, appID uuid.UUID, params AppVersionListParams) ([]entity.AppVersion, int64, error)
	ListExecutions(ctx context.Context, ownerID uuid.UUID, appID uuid.UUID, params AppExecutionListParams) ([]entity.Execution, int64, error)
	CompareVersions(ctx context.Context, ownerID uuid.UUID, appID uuid.UUID, fromID uuid.UUID, toID uuid.UUID) (*AppVersionDiff, error)
	CreateVersion(ctx context.Context, ownerID uuid.UUID, appID uuid.UUID, req CreateAppVersionRequest) (*entity.AppVersion, error)
	// DB Schema 审核流程
	SubmitDBSchemaReview(ctx context.Context, ownerID uuid.UUID, appID uuid.UUID, req SubmitDBSchemaReviewRequest) (*entity.ReviewQueue, error)
	GetDBSchemaReview(ctx context.Context, ownerID uuid.UUID, appID uuid.UUID, versionID *uuid.UUID) (*entity.ReviewQueue, error)
	GetDBSchemaReviewHistory(ctx context.Context, ownerID uuid.UUID, appID uuid.UUID, versionID *uuid.UUID) ([]entity.ReviewRecord, error)
	RollbackDBSchema(ctx context.Context, ownerID uuid.UUID, appID uuid.UUID, req RollbackDBSchemaRequest) (*entity.AppVersion, error)
	ApproveDBSchemaReview(ctx context.Context, reviewerUserID uuid.UUID, appID uuid.UUID, req ApproveDBSchemaReviewRequest) (*entity.ReviewQueue, error)
	RejectDBSchemaReview(ctx context.Context, reviewerUserID uuid.UUID, appID uuid.UUID, req RejectDBSchemaReviewRequest) (*entity.ReviewQueue, error)
	// 重大变更审核流程
	SubmitMajorChangeReview(ctx context.Context, ownerID uuid.UUID, appID uuid.UUID, req SubmitMajorChangeReviewRequest) (*entity.ReviewQueue, error)
	GetMajorChangeReview(ctx context.Context, ownerID uuid.UUID, appID uuid.UUID, versionID *uuid.UUID) (*entity.ReviewQueue, error)
	GetMajorChangeReviewHistory(ctx context.Context, ownerID uuid.UUID, appID uuid.UUID, versionID *uuid.UUID) ([]entity.ReviewRecord, error)
	ApproveMajorChangeReview(ctx context.Context, reviewerUserID uuid.UUID, appID uuid.UUID, req ApproveMajorChangeReviewRequest) (*entity.ReviewQueue, error)
	RejectMajorChangeReview(ctx context.Context, reviewerUserID uuid.UUID, appID uuid.UUID, req RejectMajorChangeReviewRequest) (*entity.ReviewQueue, error)
	Publish(ctx context.Context, ownerID uuid.UUID, appID uuid.UUID, req PublishAppRequest) (*entity.App, error)
	Rollback(ctx context.Context, ownerID uuid.UUID, appID uuid.UUID, versionID uuid.UUID) (*entity.App, error)
	Deprecate(ctx context.Context, ownerID uuid.UUID, appID uuid.UUID) (*entity.App, error)
	Archive(ctx context.Context, ownerID uuid.UUID, appID uuid.UUID) (*entity.App, error)
	GetByID(ctx context.Context, id uuid.UUID, ownerID uuid.UUID) (*entity.App, error)
	ExportConfig(ctx context.Context, ownerID uuid.UUID, appID uuid.UUID) (*AppConfigExport, error)
	GetAccessPolicy(ctx context.Context, ownerID uuid.UUID, appID uuid.UUID) (*entity.AppAccessPolicy, error)
	UpdateAccessPolicy(ctx context.Context, ownerID uuid.UUID, appID uuid.UUID, req UpdateAppAccessPolicyRequest) (*entity.AppAccessPolicy, error)
	List(ctx context.Context, ownerID uuid.UUID, params repository.AppListParams) ([]entity.App, int64, error)
}

// CreateAppRequest 创建 App 请求
type CreateAppRequest struct {
	WorkspaceID uuid.UUID
	Name        string
	Slug        string
	Icon        string
	Description *string
}

// CreateAppFromWorkflowRequest 从工作流创建 App
type CreateAppFromWorkflowRequest struct {
	WorkspaceID uuid.UUID
	WorkflowID  uuid.UUID
	Name        string
	Slug        string
	Icon        string
	Description *string
	UISchema    *entity.JSON
}

// CreateAppFromAIRequest 从 AI 生成创建 App
type CreateAppFromAIRequest struct {
	WorkspaceID uuid.UUID
	Description string
	Name        string
	Slug        string
	Icon        string
}

// UpdateAppRequest 更新 App 基础信息
type UpdateAppRequest struct {
	Name        *string
	Slug        *string
	Icon        *string
	Description *string
}

// CreateAppVersionRequest 创建 App 版本请求
type CreateAppVersionRequest struct {
	WorkflowID *uuid.UUID
	Changelog  *string
	UISchema   *entity.JSON
	DBSchema   *entity.JSON
	ConfigJSON *entity.JSON
}

// SubmitDBSchemaReviewRequest 提交 DB Schema 审核请求
type SubmitDBSchemaReviewRequest struct {
	VersionID *uuid.UUID
	Note      *string
}

// ApproveDBSchemaReviewRequest 通过 DB Schema 审核请求
type ApproveDBSchemaReviewRequest struct {
	VersionID *uuid.UUID
	Note      *string
}

// RejectDBSchemaReviewRequest 拒绝 DB Schema 审核请求
type RejectDBSchemaReviewRequest struct {
	VersionID *uuid.UUID
	Reason    *string
}

// SubmitMajorChangeReviewRequest 提交重大变更审核请求
type SubmitMajorChangeReviewRequest struct {
	VersionID *uuid.UUID
	Note      *string
}

// ApproveMajorChangeReviewRequest 通过重大变更审核请求
type ApproveMajorChangeReviewRequest struct {
	VersionID *uuid.UUID
	Note      *string
}

// RejectMajorChangeReviewRequest 拒绝重大变更审核请求
type RejectMajorChangeReviewRequest struct {
	VersionID *uuid.UUID
	Reason    *string
}

// PublishAppRequest 发布 App 请求
type PublishAppRequest struct {
	VersionID    *uuid.UUID
	AccessPolicy *UpdateAppAccessPolicyRequest
}

// RollbackDBSchemaRequest DB Schema 回滚请求
type RollbackDBSchemaRequest struct {
	TargetVersionID *uuid.UUID
	BaseVersionID   *uuid.UUID
	Changelog       *string
}

// UpdateAppAccessPolicyRequest 更新 App 访问策略请求
type UpdateAppAccessPolicyRequest struct {
	AccessMode         *string
	DataClassification *string
	RateLimitJSON      map[string]interface{}
	AllowedOrigins     []string
	RequireCaptcha     *bool
}

// UpdateAppPublicBrandingRequest 更新公开访问页面主题与品牌设置
type UpdateAppPublicBrandingRequest struct {
	Branding map[string]interface{}
	Theme    map[string]interface{}
}

// UpdateAppPublicSEORequest 更新公开访问 SEO 与元信息
type UpdateAppPublicSEORequest struct {
	SEO map[string]interface{}
}

// UpdateAppPublicInputsRequest 更新公开访问输入模板与默认值
type UpdateAppPublicInputsRequest struct {
	Template map[string]interface{}
	Defaults map[string]interface{}
}

// UpdateAppUISchemaRequest 更新 UI Schema
type UpdateAppUISchemaRequest struct {
	UISchema map[string]interface{}
}

// AppVersionListParams App 版本列表参数
type AppVersionListParams struct {
	Page     int
	PageSize int
}

// AppExecutionListParams App 执行列表参数
type AppExecutionListParams struct {
	Status   string
	Page     int
	PageSize int
	Sort     string
	Order    string
}

// AppVersionSummary App 版本摘要
type AppVersionSummary struct {
	ID         uuid.UUID  `json:"id"`
	Version    string     `json:"version"`
	WorkflowID *uuid.UUID `json:"workflow_id,omitempty"`
	CreatedAt  time.Time  `json:"created_at"`
}

// AppVersionDiff App 版本差异摘要
type AppVersionDiff struct {
	From          AppVersionSummary `json:"from"`
	To            AppVersionSummary `json:"to"`
	ChangedFields []string          `json:"changed_fields"`
}

// AppConfigExport App 配置导出结构
type AppConfigExport struct {
	Version        string                 `json:"version"`
	ExportedAt     string                 `json:"exported_at"`
	App            AppConfigSummary       `json:"app"`
	CurrentVersion *AppConfigVersion      `json:"current_version,omitempty"`
	AccessPolicy   *AppConfigAccessPolicy `json:"access_policy,omitempty"`
}

// AppConfigSummary 导出 App 基础信息
type AppConfigSummary struct {
	ID          uuid.UUID  `json:"id"`
	WorkspaceID uuid.UUID  `json:"workspace_id"`
	OwnerUserID uuid.UUID  `json:"owner_user_id"`
	Name        string     `json:"name"`
	Slug        string     `json:"slug"`
	Icon        string     `json:"icon"`
	Description *string    `json:"description,omitempty"`
	Status      string     `json:"status"`
	PricingType string     `json:"pricing_type"`
	Price       *float64   `json:"price,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
	PublishedAt *time.Time `json:"published_at,omitempty"`
}

// AppConfigVersion 导出 App 版本配置
type AppConfigVersion struct {
	ID         uuid.UUID   `json:"id"`
	Version    string      `json:"version"`
	WorkflowID *uuid.UUID  `json:"workflow_id,omitempty"`
	UISchema   entity.JSON `json:"ui_schema,omitempty"`
	DBSchema   entity.JSON `json:"db_schema,omitempty"`
	ConfigJSON entity.JSON `json:"config_json,omitempty"`
	Changelog  *string     `json:"changelog,omitempty"`
	CreatedAt  time.Time   `json:"created_at"`
}

// AppConfigAccessPolicy 导出 App 访问策略
type AppConfigAccessPolicy struct {
	AccessMode         string             `json:"access_mode"`
	DataClassification string             `json:"data_classification"`
	RateLimitJSON      entity.JSON        `json:"rate_limit_json,omitempty"`
	AllowedOrigins     entity.StringArray `json:"allowed_origins,omitempty"`
	RequireCaptcha     bool               `json:"require_captcha"`
	UpdatedAt          time.Time          `json:"updated_at"`
}

type appService struct {
	appRepo            repository.AppRepository
	appSlugAliasRepo   repository.AppSlugAliasRepository
	appVersionRepo     repository.AppVersionRepository
	appPolicyRepo      repository.AppAccessPolicyRepository
	idempotencyRepo    repository.IdempotencyKeyRepository
	workflowRepo       repository.WorkflowRepository
	executionRepo      repository.ExecutionRepository
	workspaceService   WorkspaceService
	aiAssistantService AIAssistantService
	reviewQueueRepo    repository.ReviewQueueRepository
	eventRecorder      EventRecorderService
}

// NewAppService 创建 App 服务实例
func NewAppService(
	appRepo repository.AppRepository,
	appSlugAliasRepo repository.AppSlugAliasRepository,
	appVersionRepo repository.AppVersionRepository,
	appPolicyRepo repository.AppAccessPolicyRepository,
	idempotencyRepo repository.IdempotencyKeyRepository,
	workflowRepo repository.WorkflowRepository,
	executionRepo repository.ExecutionRepository,
	workspaceService WorkspaceService,
	aiAssistantService AIAssistantService,
	reviewQueueRepo repository.ReviewQueueRepository,
	eventRecorder EventRecorderService,
) AppService {
	return &appService{
		appRepo:            appRepo,
		appSlugAliasRepo:   appSlugAliasRepo,
		appVersionRepo:     appVersionRepo,
		appPolicyRepo:      appPolicyRepo,
		idempotencyRepo:    idempotencyRepo,
		workflowRepo:       workflowRepo,
		executionRepo:      executionRepo,
		workspaceService:   workspaceService,
		aiAssistantService: aiAssistantService,
		reviewQueueRepo:    reviewQueueRepo,
		eventRecorder:      eventRecorder,
	}
}

func (s *appService) Create(ctx context.Context, ownerID uuid.UUID, req CreateAppRequest) (*entity.App, error) {
	if strings.TrimSpace(req.Name) == "" {
		return nil, ErrAppInvalidName
	}
	if req.WorkspaceID == uuid.Nil {
		return nil, ErrAppInvalidWorkspace
	}

	access, err := s.workspaceService.GetWorkspaceAccess(ctx, req.WorkspaceID, ownerID)
	if err != nil {
		if errors.Is(err, ErrWorkspaceNotFound) {
			return nil, ErrAppWorkspaceNotFound
		}
		if errors.Is(err, ErrWorkspaceUnauthorized) {
			return nil, ErrAppUnauthorized
		}
		return nil, err
	}
	if !hasAnyPermission(access.Permissions, PermissionAppsCreate, PermissionAppEdit) {
		return nil, ErrAppUnauthorized
	}
	workspace := access.Workspace

	limit := s.getAppLimitByPlan(workspace.Plan)
	if limit >= 0 {
		count, err := s.appRepo.CountByWorkspace(ctx, req.WorkspaceID)
		if err != nil {
			return nil, err
		}
		if count >= int64(limit) {
			return nil, ErrAppQuotaExceeded
		}
	}

	slug := strings.TrimSpace(req.Slug)
	if slug == "" {
		slug = req.Name
	}
	slug = s.generateSlug(slug)
	if slug == "" {
		return nil, ErrAppInvalidSlug
	}

	var idempotencyRecord *entity.IdempotencyKey
	idempotencyKey := idempotency.KeyFromContext(ctx)
	if idempotencyKey != "" && s.idempotencyRepo != nil {
		descriptionValue := ""
		if req.Description != nil {
			descriptionValue = strings.TrimSpace(*req.Description)
		}
		requestHash := idempotency.HashValue(map[string]interface{}{
			"workspace_id": req.WorkspaceID.String(),
			"name":         strings.TrimSpace(req.Name),
			"slug":         slug,
			"icon":         strings.TrimSpace(req.Icon),
			"description":  descriptionValue,
		})
		result, err := beginIdempotency(ctx, s.idempotencyRepo, ownerID, idempotencyKey, "app.create", requestHash, idempotencyScope{
			WorkspaceID: &req.WorkspaceID,
		})
		if err != nil {
			return nil, err
		}
		if result != nil && result.Replay {
			if result.Record.ResourceID != nil {
				existing, err := s.appRepo.GetByID(ctx, *result.Record.ResourceID)
				if err == nil {
					return existing, nil
				}
			}
			return nil, ErrAppNotFound
		}
		if result != nil {
			idempotencyRecord = result.Record
		}
	}

	uniqueSlug, err := s.ensureUniqueSlug(ctx, req.WorkspaceID, slug)
	if err != nil {
		failIdempotency(ctx, s.idempotencyRepo, idempotencyRecord)
		return nil, err
	}

	app := &entity.App{
		WorkspaceID: req.WorkspaceID,
		OwnerUserID: ownerID,
		Name:        strings.TrimSpace(req.Name),
		Slug:        uniqueSlug,
		Icon:        req.Icon,
		Description: req.Description,
		Status:      AppStatusDraft,
		PricingType: "free",
	}

	if strings.TrimSpace(app.Icon) == "" {
		app.Icon = "📦"
	}

	if err := s.appRepo.Create(ctx, app); err != nil {
		failIdempotency(ctx, s.idempotencyRepo, idempotencyRecord)
		return nil, err
	}
	completeIdempotency(ctx, s.idempotencyRepo, idempotencyRecord, "app", app.ID)

	s.recordAppCreated(ctx, app, ownerID, "manual", nil)
	return app, nil
}

func (s *appService) CreateFromWorkflow(ctx context.Context, ownerID uuid.UUID, req CreateAppFromWorkflowRequest) (*entity.App, error) {
	if req.WorkspaceID == uuid.Nil || req.WorkflowID == uuid.Nil {
		return nil, ErrAppInvalidWorkspace
	}

	access, err := s.workspaceService.GetWorkspaceAccess(ctx, req.WorkspaceID, ownerID)
	if err != nil {
		if errors.Is(err, ErrWorkspaceNotFound) {
			return nil, ErrAppWorkspaceNotFound
		}
		if errors.Is(err, ErrWorkspaceUnauthorized) {
			return nil, ErrAppUnauthorized
		}
		return nil, err
	}
	if !hasAnyPermission(access.Permissions, PermissionAppsCreate, PermissionAppEdit) {
		return nil, ErrAppUnauthorized
	}
	workspace := access.Workspace

	workflow, err := s.workflowRepo.GetByID(ctx, req.WorkflowID)
	if err != nil {
		return nil, ErrAppWorkflowNotFound
	}
	if workflow.UserID != ownerID {
		return nil, ErrAppUnauthorized
	}
	if workflow.WorkspaceID != req.WorkspaceID {
		return nil, ErrAppWorkflowWorkspaceMismatch
	}

	name := strings.TrimSpace(req.Name)
	if name == "" {
		name = workflow.Name
	}
	description := req.Description
	if description == nil && workflow.Description != nil {
		description = workflow.Description
	}

	var idempotencyRecord *entity.IdempotencyKey
	idempotencyKey := idempotency.KeyFromContext(ctx)
	if idempotencyKey != "" && s.idempotencyRepo != nil {
		descriptionValue := ""
		if description != nil {
			descriptionValue = strings.TrimSpace(*description)
		}
		var uiSchemaValue interface{}
		if req.UISchema != nil {
			uiSchemaValue = map[string]interface{}(*req.UISchema)
		}
		requestHash := idempotency.HashValue(map[string]interface{}{
			"workspace_id": req.WorkspaceID.String(),
			"workflow_id":  req.WorkflowID.String(),
			"name":         strings.TrimSpace(name),
			"slug":         strings.TrimSpace(req.Slug),
			"icon":         strings.TrimSpace(req.Icon),
			"description":  descriptionValue,
			"ui_schema":    uiSchemaValue,
		})
		result, err := beginIdempotency(ctx, s.idempotencyRepo, ownerID, idempotencyKey, "app.create", requestHash, idempotencyScope{
			WorkspaceID: &req.WorkspaceID,
		})
		if err != nil {
			return nil, err
		}
		if result != nil && result.Replay {
			if result.Record.ResourceID != nil {
				existing, err := s.appRepo.GetByID(ctx, *result.Record.ResourceID)
				if err == nil {
					return existing, nil
				}
			}
			return nil, ErrAppNotFound
		}
		if result != nil {
			idempotencyRecord = result.Record
		}
	}

	app, err := s.createAppWithVersion(ctx, ownerID, workspace, name, req.Slug, req.Icon, description, "workflow", &workflow.ID, req.UISchema, nil)
	if err != nil {
		failIdempotency(ctx, s.idempotencyRepo, idempotencyRecord)
		return nil, err
	}
	completeIdempotency(ctx, s.idempotencyRepo, idempotencyRecord, "app", app.ID)
	return app, nil
}

func (s *appService) CreateFromAI(ctx context.Context, ownerID uuid.UUID, req CreateAppFromAIRequest) (*entity.App, error) {
	if req.WorkspaceID == uuid.Nil {
		return nil, ErrAppInvalidWorkspace
	}
	if strings.TrimSpace(req.Description) == "" {
		return nil, ErrAppInvalidDescription
	}

	access, err := s.workspaceService.GetWorkspaceAccess(ctx, req.WorkspaceID, ownerID)
	if err != nil {
		if errors.Is(err, ErrWorkspaceNotFound) {
			return nil, ErrAppWorkspaceNotFound
		}
		if errors.Is(err, ErrWorkspaceUnauthorized) {
			return nil, ErrAppUnauthorized
		}
		return nil, err
	}
	if !hasAnyPermission(access.Permissions, PermissionAppsCreate, PermissionAppEdit) {
		return nil, ErrAppUnauthorized
	}
	workspace := access.Workspace

	var idempotencyRecord *entity.IdempotencyKey
	idempotencyKey := idempotency.KeyFromContext(ctx)
	if idempotencyKey != "" && s.idempotencyRepo != nil {
		requestHash := idempotency.HashValue(map[string]interface{}{
			"workspace_id": req.WorkspaceID.String(),
			"description":  strings.TrimSpace(req.Description),
			"name":         strings.TrimSpace(req.Name),
			"slug":         strings.TrimSpace(req.Slug),
			"icon":         strings.TrimSpace(req.Icon),
		})
		result, err := beginIdempotency(ctx, s.idempotencyRepo, ownerID, idempotencyKey, "app.create", requestHash, idempotencyScope{
			WorkspaceID: &req.WorkspaceID,
		})
		if err != nil {
			return nil, err
		}
		if result != nil && result.Replay {
			if result.Record.ResourceID != nil {
				existing, err := s.appRepo.GetByID(ctx, *result.Record.ResourceID)
				if err == nil {
					return existing, nil
				}
			}
			return nil, ErrAppNotFound
		}
		if result != nil {
			idempotencyRecord = result.Record
		}
	}

	genResult, err := s.aiAssistantService.GenerateWorkflow(ctx, ownerID, GenerateWorkflowRequest{
		Description: req.Description,
	})
	if err != nil {
		failIdempotency(ctx, s.idempotencyRepo, idempotencyRecord)
		return nil, ErrAppAIGenerationFailed
	}

	var aiPayload struct {
		Name        string                   `json:"name"`
		Description string                   `json:"description"`
		Nodes       []map[string]interface{} `json:"nodes"`
		Edges       []map[string]interface{} `json:"edges"`
	}
	if err := json.Unmarshal([]byte(genResult.WorkflowJSON), &aiPayload); err != nil {
		failIdempotency(ctx, s.idempotencyRepo, idempotencyRecord)
		return nil, ErrAppInvalidWorkflow
	}
	if len(aiPayload.Nodes) == 0 || len(aiPayload.Edges) == 0 {
		failIdempotency(ctx, s.idempotencyRepo, idempotencyRecord)
		return nil, ErrAppInvalidWorkflow
	}

	workflowName := strings.TrimSpace(aiPayload.Name)
	if workflowName == "" {
		workflowName = "AI Workflow"
	}
	workflowDesc := strings.TrimSpace(aiPayload.Description)
	if workflowDesc == "" {
		workflowDesc = req.Description
	}

	definition := entity.JSON{
		"version":  "1.0.0",
		"nodes":    aiPayload.Nodes,
		"edges":    aiPayload.Edges,
		"settings": defaultWorkflowSettings(),
	}

	workflow := &entity.Workflow{
		UserID:      ownerID,
		WorkspaceID: req.WorkspaceID,
		Name:        workflowName,
		Description: &workflowDesc,
		Definition:  definition,
		Variables:   entity.JSON{},
	}

	if err := s.workflowRepo.Create(ctx, workflow); err != nil {
		failIdempotency(ctx, s.idempotencyRepo, idempotencyRecord)
		return nil, err
	}

	appName := strings.TrimSpace(req.Name)
	if appName == "" {
		appName = workflowName
	}
	description := &workflowDesc
	var uiSchema *entity.JSON
	if genResult.UISchema != nil {
		value := entity.JSON(genResult.UISchema)
		uiSchema = &value
	}
	var dbSchema *entity.JSON
	if genResult.DBSchema != nil {
		value := entity.JSON(genResult.DBSchema)
		dbSchema = &value
	}

	app, err := s.createAppWithVersion(ctx, ownerID, workspace, appName, req.Slug, req.Icon, description, "ai", &workflow.ID, uiSchema, dbSchema)
	if err != nil {
		failIdempotency(ctx, s.idempotencyRepo, idempotencyRecord)
		return nil, err
	}
	completeIdempotency(ctx, s.idempotencyRepo, idempotencyRecord, "app", app.ID)
	return app, nil
}

func (s *appService) Update(ctx context.Context, ownerID uuid.UUID, appID uuid.UUID, req UpdateAppRequest) (*entity.App, error) {
	app, err := s.appRepo.GetByID(ctx, appID)
	if err != nil {
		return nil, ErrAppNotFound
	}
	if _, err := s.authorizeAppAccess(ctx, app, ownerID, PermissionAppEdit); err != nil {
		return nil, err
	}

	oldSlug := app.Slug
	slugChanged := false

	if req.Name != nil {
		name := strings.TrimSpace(*req.Name)
		if name == "" {
			return nil, ErrAppInvalidName
		}
		app.Name = name
	}
	if req.Slug != nil {
		normalized := s.generateSlug(*req.Slug)
		if normalized == "" {
			return nil, ErrAppInvalidSlug
		}
		if normalized != app.Slug {
			exists, err := s.appRepo.ExistsByWorkspaceSlug(ctx, app.WorkspaceID, normalized)
			if err != nil {
				return nil, err
			}
			if exists {
				return nil, ErrAppSlugExists
			}
			app.Slug = normalized
			slugChanged = true
		}
	}
	if req.Icon != nil {
		app.Icon = strings.TrimSpace(*req.Icon)
	}
	if req.Description != nil {
		description := strings.TrimSpace(*req.Description)
		if description == "" {
			app.Description = nil
		} else {
			app.Description = &description
		}
	}

	if err := s.appRepo.Update(ctx, app); err != nil {
		return nil, err
	}
	if slugChanged {
		s.ensureAppSlugAlias(ctx, app.ID, app.WorkspaceID, oldSlug)
	}
	return app, nil
}

func (s *appService) CreateVersion(ctx context.Context, ownerID uuid.UUID, appID uuid.UUID, req CreateAppVersionRequest) (*entity.AppVersion, error) {
	app, err := s.appRepo.GetByID(ctx, appID)
	if err != nil {
		return nil, ErrAppNotFound
	}
	if _, err := s.authorizeAppAccess(ctx, app, ownerID, PermissionAppEdit); err != nil {
		return nil, err
	}

	normalizedChangelog, changeLevel := normalizeChangelog(req.Changelog)
	req.Changelog = normalizedChangelog

	var workflowDefinition entity.JSON
	if req.WorkflowID != nil {
		workflow, err := s.workflowRepo.GetByID(ctx, *req.WorkflowID)
		if err != nil {
			return nil, ErrAppWorkflowNotFound
		}
		if workflow.UserID != ownerID {
			return nil, ErrAppUnauthorized
		}
		if workflow.WorkspaceID != app.WorkspaceID {
			return nil, ErrAppWorkflowWorkspaceMismatch
		}
		workflowDefinition = workflow.Definition
	}

	count, err := s.appVersionRepo.CountByApp(ctx, appID)
	if err != nil {
		return nil, err
	}
	version := fmt.Sprintf("v%d", count+1)

	uiSchema := entity.JSON{}
	if req.UISchema != nil {
		uiSchema = *req.UISchema
	}
	dbSchema := entity.JSON{}
	if req.DBSchema != nil {
		dbSchema = *req.DBSchema
	}
	configJSON := entity.JSON{}
	if req.ConfigJSON != nil {
		configJSON = *req.ConfigJSON
	}

	if len(uiSchema) == 0 && workflowDefinition != nil {
		if generated, ok := buildUISchemaFromWorkflow(workflowDefinition); ok {
			uiSchema = generated
		}
	}
	if workflowDefinition != nil {
		if _, ok := configJSON["output_schema"]; !ok {
			if outputSchema := buildOutputSchemaFromWorkflow(workflowDefinition); outputSchema != nil {
				configJSON["output_schema"] = outputSchema
			}
		}
		if _, ok := configJSON["input_mapping"]; !ok {
			if mapping := buildInputMappingWarnings(uiSchema, workflowDefinition); mapping != nil {
				configJSON["input_mapping"] = mapping
			}
		}
	}

	appVersion := &entity.AppVersion{
		AppID:      appID,
		Version:    version,
		Changelog:  req.Changelog,
		WorkflowID: req.WorkflowID,
		UISchema:   uiSchema,
		DBSchema:   dbSchema,
		ConfigJSON: configJSON,
		CreatedBy:  &ownerID,
	}

	if err := s.appVersionRepo.Create(ctx, appVersion); err != nil {
		return nil, err
	}

	if app.Status == AppStatusDraft {
		app.CurrentVersionID = &appVersion.ID
		if err := s.appRepo.Update(ctx, app); err != nil {
			return nil, err
		}
	}

	if err := s.createMajorChangeReviewIfNeeded(ctx, app, appVersion, ownerID, changeLevel); err != nil {
		return nil, err
	}

	return appVersion, nil
}

// ========== DB Schema 审核 ==========

func (s *appService) SubmitDBSchemaReview(ctx context.Context, ownerID uuid.UUID, appID uuid.UUID, req SubmitDBSchemaReviewRequest) (*entity.ReviewQueue, error) {
	if s.reviewQueueRepo == nil {
		return nil, ErrDBSchemaReviewUnavailable
	}
	app, err := s.appRepo.GetByID(ctx, appID)
	if err != nil {
		return nil, ErrAppNotFound
	}
	if _, err := s.authorizeAppAccess(ctx, app, ownerID, PermissionAppEdit); err != nil {
		return nil, err
	}
	version, err := s.resolveDBSchemaReviewVersion(ctx, app, req.VersionID)
	if err != nil {
		return nil, err
	}
	if len(version.DBSchema) == 0 {
		return nil, ErrDBSchemaMissing
	}
	existing, _ := s.reviewQueueRepo.GetByItemID(ctx, entity.ReviewItemTypeDBSchema, version.ID)
	if existing != nil && (existing.Status == entity.ReviewStatusPending || existing.Status == entity.ReviewStatusInReview) {
		return nil, ErrDBSchemaReviewExists
	}
	reviewQueue := s.buildDBSchemaReviewQueue(app, version, ownerID, req.Note)
	if err := s.reviewQueueRepo.Create(ctx, reviewQueue); err != nil {
		return nil, err
	}
	return reviewQueue, nil
}

func (s *appService) GetDBSchemaReview(ctx context.Context, ownerID uuid.UUID, appID uuid.UUID, versionID *uuid.UUID) (*entity.ReviewQueue, error) {
	if s.reviewQueueRepo == nil {
		return nil, ErrDBSchemaReviewUnavailable
	}
	app, err := s.appRepo.GetByID(ctx, appID)
	if err != nil {
		return nil, ErrAppNotFound
	}
	if _, err := s.authorizeAppAccess(ctx, app, ownerID, PermissionAppEdit); err != nil {
		return nil, err
	}
	version, err := s.resolveDBSchemaReviewVersion(ctx, app, versionID)
	if err != nil {
		return nil, err
	}
	queue, err := s.reviewQueueRepo.GetByItemID(ctx, entity.ReviewItemTypeDBSchema, version.ID)
	if err != nil {
		return nil, ErrDBSchemaReviewNotFound
	}
	return queue, nil
}

func (s *appService) GetDBSchemaReviewHistory(ctx context.Context, ownerID uuid.UUID, appID uuid.UUID, versionID *uuid.UUID) ([]entity.ReviewRecord, error) {
	if s.reviewQueueRepo == nil {
		return nil, ErrDBSchemaReviewUnavailable
	}
	app, err := s.appRepo.GetByID(ctx, appID)
	if err != nil {
		return nil, ErrAppNotFound
	}
	if _, err := s.authorizeAppAccess(ctx, app, ownerID, PermissionAppEdit); err != nil {
		return nil, err
	}
	version, err := s.resolveDBSchemaReviewVersion(ctx, app, versionID)
	if err != nil {
		return nil, err
	}
	queue, err := s.reviewQueueRepo.GetByItemID(ctx, entity.ReviewItemTypeDBSchema, version.ID)
	if err != nil {
		return nil, ErrDBSchemaReviewNotFound
	}
	records, err := s.reviewQueueRepo.ListRecords(ctx, queue.ID)
	if err != nil {
		return nil, err
	}
	return records, nil
}

func (s *appService) RollbackDBSchema(ctx context.Context, ownerID uuid.UUID, appID uuid.UUID, req RollbackDBSchemaRequest) (*entity.AppVersion, error) {
	app, err := s.appRepo.GetByID(ctx, appID)
	if err != nil {
		return nil, ErrAppNotFound
	}
	if _, err := s.authorizeAppAccess(ctx, app, ownerID, PermissionAppEdit); err != nil {
		return nil, err
	}
	if req.TargetVersionID == nil {
		return nil, ErrAppVersionRequired
	}
	baseVersionID := req.BaseVersionID
	if baseVersionID == nil {
		if app.CurrentVersionID == nil {
			return nil, ErrAppVersionRequired
		}
		baseVersionID = app.CurrentVersionID
	}
	baseVersion, err := s.appVersionRepo.GetByID(ctx, *baseVersionID)
	if err != nil {
		return nil, ErrAppVersionNotFound
	}
	if baseVersion.AppID != app.ID {
		return nil, ErrAppVersionMismatch
	}
	targetVersion, err := s.appVersionRepo.GetByID(ctx, *req.TargetVersionID)
	if err != nil {
		return nil, ErrAppVersionNotFound
	}
	if targetVersion.AppID != app.ID {
		return nil, ErrAppVersionMismatch
	}
	if len(targetVersion.DBSchema) == 0 {
		return nil, ErrDBSchemaMissing
	}
	changelog := req.Changelog
	if changelog == nil || strings.TrimSpace(*changelog) == "" {
		message := fmt.Sprintf("Rollback DB schema to %s", targetVersion.Version)
		changelog = &message
	}
	return s.CreateVersion(ctx, ownerID, appID, CreateAppVersionRequest{
		WorkflowID: baseVersion.WorkflowID,
		Changelog:  changelog,
		UISchema:   cloneJSONPointer(baseVersion.UISchema),
		DBSchema:   cloneJSONPointer(targetVersion.DBSchema),
		ConfigJSON: cloneJSONPointer(baseVersion.ConfigJSON),
	})
}

func (s *appService) ApproveDBSchemaReview(ctx context.Context, reviewerUserID uuid.UUID, appID uuid.UUID, req ApproveDBSchemaReviewRequest) (*entity.ReviewQueue, error) {
	if s.reviewQueueRepo == nil {
		return nil, ErrDBSchemaReviewUnavailable
	}
	app, err := s.appRepo.GetByID(ctx, appID)
	if err != nil {
		return nil, ErrAppNotFound
	}
	version, err := s.resolveDBSchemaReviewVersion(ctx, app, req.VersionID)
	if err != nil {
		return nil, err
	}
	queue, err := s.reviewQueueRepo.GetByItemID(ctx, entity.ReviewItemTypeDBSchema, version.ID)
	if err != nil {
		return nil, ErrDBSchemaReviewNotFound
	}
	reviewer, err := s.reviewQueueRepo.GetReviewer(ctx, reviewerUserID)
	if err != nil {
		return nil, ErrDBSchemaReviewerNotFound
	}
	note := "审核通过"
	if req.Note != nil && strings.TrimSpace(*req.Note) != "" {
		note = strings.TrimSpace(*req.Note)
	}
	if err := s.reviewQueueRepo.Approve(ctx, queue.ID, reviewer.ID, note); err != nil {
		return nil, err
	}
	record := &entity.ReviewRecord{
		QueueID:    queue.ID,
		ReviewerID: reviewer.ID,
		Action:     "approve",
		FromStatus: &queue.Status,
		ToStatus:   entity.ReviewStatusApproved,
		Comment:    &note,
	}
	_ = s.reviewQueueRepo.CreateRecord(ctx, record)
	reviewer.TotalReviews++
	reviewer.ApprovedCount++
	_ = s.reviewQueueRepo.UpdateReviewer(ctx, reviewer)
	now := time.Now()
	queue.Status = entity.ReviewStatusApproved
	queue.ResultNote = &note
	queue.ReviewedAt = &now
	return queue, nil
}

func (s *appService) RejectDBSchemaReview(ctx context.Context, reviewerUserID uuid.UUID, appID uuid.UUID, req RejectDBSchemaReviewRequest) (*entity.ReviewQueue, error) {
	if s.reviewQueueRepo == nil {
		return nil, ErrDBSchemaReviewUnavailable
	}
	app, err := s.appRepo.GetByID(ctx, appID)
	if err != nil {
		return nil, ErrAppNotFound
	}
	version, err := s.resolveDBSchemaReviewVersion(ctx, app, req.VersionID)
	if err != nil {
		return nil, err
	}
	queue, err := s.reviewQueueRepo.GetByItemID(ctx, entity.ReviewItemTypeDBSchema, version.ID)
	if err != nil {
		return nil, ErrDBSchemaReviewNotFound
	}
	reviewer, err := s.reviewQueueRepo.GetReviewer(ctx, reviewerUserID)
	if err != nil {
		return nil, ErrDBSchemaReviewerNotFound
	}
	reason := "审核拒绝"
	if req.Reason != nil && strings.TrimSpace(*req.Reason) != "" {
		reason = strings.TrimSpace(*req.Reason)
	}
	if err := s.reviewQueueRepo.Reject(ctx, queue.ID, reviewer.ID, reason); err != nil {
		return nil, err
	}
	record := &entity.ReviewRecord{
		QueueID:    queue.ID,
		ReviewerID: reviewer.ID,
		Action:     "reject",
		FromStatus: &queue.Status,
		ToStatus:   entity.ReviewStatusRejected,
		Comment:    &reason,
	}
	_ = s.reviewQueueRepo.CreateRecord(ctx, record)
	reviewer.TotalReviews++
	reviewer.RejectedCount++
	_ = s.reviewQueueRepo.UpdateReviewer(ctx, reviewer)
	now := time.Now()
	queue.Status = entity.ReviewStatusRejected
	queue.ResultNote = &reason
	queue.ReviewedAt = &now
	return queue, nil
}

// ========== 重大变更审核 ==========

func (s *appService) SubmitMajorChangeReview(ctx context.Context, ownerID uuid.UUID, appID uuid.UUID, req SubmitMajorChangeReviewRequest) (*entity.ReviewQueue, error) {
	if s.reviewQueueRepo == nil {
		return nil, ErrMajorChangeReviewUnavailable
	}
	app, err := s.appRepo.GetByID(ctx, appID)
	if err != nil {
		return nil, ErrAppNotFound
	}
	if _, err := s.authorizeAppAccess(ctx, app, ownerID, PermissionAppEdit); err != nil {
		return nil, err
	}
	version, err := s.resolveMajorChangeReviewVersion(ctx, app, req.VersionID)
	if err != nil {
		return nil, err
	}
	if !requiresMajorChangeReview(version.Changelog) {
		return nil, ErrMajorChangeNotRequired
	}
	existing, _ := s.reviewQueueRepo.GetByItemID(ctx, entity.ReviewItemTypeMajorChange, version.ID)
	if existing != nil && (existing.Status == entity.ReviewStatusPending || existing.Status == entity.ReviewStatusInReview) {
		return nil, ErrMajorChangeReviewExists
	}
	reviewQueue := s.buildMajorChangeReviewQueue(app, version, ownerID, req.Note)
	if err := s.reviewQueueRepo.Create(ctx, reviewQueue); err != nil {
		return nil, err
	}
	return reviewQueue, nil
}

func (s *appService) GetMajorChangeReview(ctx context.Context, ownerID uuid.UUID, appID uuid.UUID, versionID *uuid.UUID) (*entity.ReviewQueue, error) {
	if s.reviewQueueRepo == nil {
		return nil, ErrMajorChangeReviewUnavailable
	}
	app, err := s.appRepo.GetByID(ctx, appID)
	if err != nil {
		return nil, ErrAppNotFound
	}
	if _, err := s.authorizeAppAccess(ctx, app, ownerID, PermissionAppEdit); err != nil {
		return nil, err
	}
	version, err := s.resolveMajorChangeReviewVersion(ctx, app, versionID)
	if err != nil {
		return nil, err
	}
	queue, err := s.reviewQueueRepo.GetByItemID(ctx, entity.ReviewItemTypeMajorChange, version.ID)
	if err != nil {
		return nil, ErrMajorChangeReviewNotFound
	}
	return queue, nil
}

func (s *appService) GetMajorChangeReviewHistory(ctx context.Context, ownerID uuid.UUID, appID uuid.UUID, versionID *uuid.UUID) ([]entity.ReviewRecord, error) {
	if s.reviewQueueRepo == nil {
		return nil, ErrMajorChangeReviewUnavailable
	}
	app, err := s.appRepo.GetByID(ctx, appID)
	if err != nil {
		return nil, ErrAppNotFound
	}
	if _, err := s.authorizeAppAccess(ctx, app, ownerID, PermissionAppEdit); err != nil {
		return nil, err
	}
	version, err := s.resolveMajorChangeReviewVersion(ctx, app, versionID)
	if err != nil {
		return nil, err
	}
	queue, err := s.reviewQueueRepo.GetByItemID(ctx, entity.ReviewItemTypeMajorChange, version.ID)
	if err != nil {
		return nil, ErrMajorChangeReviewNotFound
	}
	records, err := s.reviewQueueRepo.ListRecords(ctx, queue.ID)
	if err != nil {
		return nil, err
	}
	return records, nil
}

func (s *appService) ApproveMajorChangeReview(ctx context.Context, reviewerUserID uuid.UUID, appID uuid.UUID, req ApproveMajorChangeReviewRequest) (*entity.ReviewQueue, error) {
	if s.reviewQueueRepo == nil {
		return nil, ErrMajorChangeReviewUnavailable
	}
	app, err := s.appRepo.GetByID(ctx, appID)
	if err != nil {
		return nil, ErrAppNotFound
	}
	version, err := s.resolveMajorChangeReviewVersion(ctx, app, req.VersionID)
	if err != nil {
		return nil, err
	}
	queue, err := s.reviewQueueRepo.GetByItemID(ctx, entity.ReviewItemTypeMajorChange, version.ID)
	if err != nil {
		return nil, ErrMajorChangeReviewNotFound
	}
	reviewer, err := s.reviewQueueRepo.GetReviewer(ctx, reviewerUserID)
	if err != nil {
		return nil, ErrMajorChangeReviewerNotFound
	}
	note := "审核通过"
	if req.Note != nil && strings.TrimSpace(*req.Note) != "" {
		note = strings.TrimSpace(*req.Note)
	}
	if err := s.reviewQueueRepo.Approve(ctx, queue.ID, reviewer.ID, note); err != nil {
		return nil, err
	}
	record := &entity.ReviewRecord{
		QueueID:    queue.ID,
		ReviewerID: reviewer.ID,
		Action:     "approve",
		FromStatus: &queue.Status,
		ToStatus:   entity.ReviewStatusApproved,
		Comment:    &note,
	}
	_ = s.reviewQueueRepo.CreateRecord(ctx, record)
	reviewer.TotalReviews++
	reviewer.ApprovedCount++
	_ = s.reviewQueueRepo.UpdateReviewer(ctx, reviewer)
	now := time.Now()
	queue.Status = entity.ReviewStatusApproved
	queue.ResultNote = &note
	queue.ReviewedAt = &now
	return queue, nil
}

func (s *appService) RejectMajorChangeReview(ctx context.Context, reviewerUserID uuid.UUID, appID uuid.UUID, req RejectMajorChangeReviewRequest) (*entity.ReviewQueue, error) {
	if s.reviewQueueRepo == nil {
		return nil, ErrMajorChangeReviewUnavailable
	}
	app, err := s.appRepo.GetByID(ctx, appID)
	if err != nil {
		return nil, ErrAppNotFound
	}
	version, err := s.resolveMajorChangeReviewVersion(ctx, app, req.VersionID)
	if err != nil {
		return nil, err
	}
	queue, err := s.reviewQueueRepo.GetByItemID(ctx, entity.ReviewItemTypeMajorChange, version.ID)
	if err != nil {
		return nil, ErrMajorChangeReviewNotFound
	}
	reviewer, err := s.reviewQueueRepo.GetReviewer(ctx, reviewerUserID)
	if err != nil {
		return nil, ErrMajorChangeReviewerNotFound
	}
	reason := "审核拒绝"
	if req.Reason != nil && strings.TrimSpace(*req.Reason) != "" {
		reason = strings.TrimSpace(*req.Reason)
	}
	if err := s.reviewQueueRepo.Reject(ctx, queue.ID, reviewer.ID, reason); err != nil {
		return nil, err
	}
	record := &entity.ReviewRecord{
		QueueID:    queue.ID,
		ReviewerID: reviewer.ID,
		Action:     "reject",
		FromStatus: &queue.Status,
		ToStatus:   entity.ReviewStatusRejected,
		Comment:    &reason,
	}
	_ = s.reviewQueueRepo.CreateRecord(ctx, record)
	reviewer.TotalReviews++
	reviewer.RejectedCount++
	_ = s.reviewQueueRepo.UpdateReviewer(ctx, reviewer)
	now := time.Now()
	queue.Status = entity.ReviewStatusRejected
	queue.ResultNote = &reason
	queue.ReviewedAt = &now
	return queue, nil
}

func (s *appService) Publish(ctx context.Context, ownerID uuid.UUID, appID uuid.UUID, req PublishAppRequest) (*entity.App, error) {
	app, err := s.appRepo.GetByID(ctx, appID)
	if err != nil {
		return nil, ErrAppNotFound
	}
	if _, err := s.authorizeAppAccess(ctx, app, ownerID, PermissionAppPublish); err != nil {
		return nil, err
	}

	var idempotencyRecord *entity.IdempotencyKey
	idempotencyKey := idempotency.KeyFromContext(ctx)
	if idempotencyKey != "" && s.idempotencyRepo != nil {
		versionValue := ""
		if req.VersionID != nil {
			versionValue = req.VersionID.String()
		}
		var policyPayload interface{}
		if req.AccessPolicy != nil {
			var accessMode interface{}
			if req.AccessPolicy.AccessMode != nil {
				accessMode = strings.TrimSpace(*req.AccessPolicy.AccessMode)
			}
			var classification interface{}
			if req.AccessPolicy.DataClassification != nil {
				classification = strings.TrimSpace(*req.AccessPolicy.DataClassification)
			}
			var requireCaptcha interface{}
			if req.AccessPolicy.RequireCaptcha != nil {
				requireCaptcha = *req.AccessPolicy.RequireCaptcha
			}
			policyPayload = map[string]interface{}{
				"access_mode":         accessMode,
				"data_classification": classification,
				"rate_limit_json":     req.AccessPolicy.RateLimitJSON,
				"allowed_origins":     req.AccessPolicy.AllowedOrigins,
				"require_captcha":     requireCaptcha,
			}
		}
		requestHash := idempotency.HashValue(map[string]interface{}{
			"app_id":        appID.String(),
			"version_id":    versionValue,
			"access_policy": policyPayload,
		})
		result, err := beginIdempotency(ctx, s.idempotencyRepo, ownerID, idempotencyKey, "app.publish", requestHash, idempotencyScope{
			AppID: &appID,
		})
		if err != nil {
			return nil, err
		}
		if result != nil && result.Replay {
			targetID := appID
			if result.Record.ResourceID != nil {
				targetID = *result.Record.ResourceID
			}
			existing, err := s.appRepo.GetByID(ctx, targetID)
			if err == nil {
				return existing, nil
			}
			return nil, ErrAppNotFound
		}
		if result != nil {
			idempotencyRecord = result.Record
		}
	}

	if req.AccessPolicy != nil {
		if _, err := s.UpdateAccessPolicy(ctx, ownerID, appID, *req.AccessPolicy); err != nil {
			failIdempotency(ctx, s.idempotencyRepo, idempotencyRecord)
			return nil, err
		}
	}

	targetVersionID := req.VersionID
	if targetVersionID == nil {
		if app.CurrentVersionID == nil {
			failIdempotency(ctx, s.idempotencyRepo, idempotencyRecord)
			return nil, ErrAppPublishVersionRequired
		}
		targetVersionID = app.CurrentVersionID
	}

	version, err := s.appVersionRepo.GetByID(ctx, *targetVersionID)
	if err != nil {
		failIdempotency(ctx, s.idempotencyRepo, idempotencyRecord)
		return nil, ErrAppVersionNotFound
	}
	if version.AppID != app.ID {
		failIdempotency(ctx, s.idempotencyRepo, idempotencyRecord)
		return nil, ErrAppVersionMismatch
	}

	if requiresMajorChangeReview(version.Changelog) {
		if s.reviewQueueRepo == nil {
			failIdempotency(ctx, s.idempotencyRepo, idempotencyRecord)
			return nil, ErrMajorChangeReviewUnavailable
		}
		queue, err := s.reviewQueueRepo.GetByItemID(ctx, entity.ReviewItemTypeMajorChange, version.ID)
		if err != nil {
			failIdempotency(ctx, s.idempotencyRepo, idempotencyRecord)
			return nil, ErrMajorChangeReviewRequired
		}
		if queue.Status != entity.ReviewStatusApproved {
			failIdempotency(ctx, s.idempotencyRepo, idempotencyRecord)
			return nil, ErrMajorChangeReviewNotApproved
		}
	}

	if !canTransitionAppStatus(app.Status, AppStatusPublished) {
		failIdempotency(ctx, s.idempotencyRepo, idempotencyRecord)
		return nil, ErrAppInvalidStatusTransition
	}

	app.CurrentVersionID = targetVersionID
	app.Status = AppStatusPublished
	if app.PublishedAt == nil {
		now := time.Now()
		app.PublishedAt = &now
	}

	if err := s.appRepo.Update(ctx, app); err != nil {
		failIdempotency(ctx, s.idempotencyRepo, idempotencyRecord)
		return nil, err
	}
	completeIdempotency(ctx, s.idempotencyRepo, idempotencyRecord, "app", app.ID)

	s.recordAppPublished(ctx, app, ownerID, targetVersionID)
	return app, nil
}

func (s *appService) Rollback(ctx context.Context, ownerID uuid.UUID, appID uuid.UUID, versionID uuid.UUID) (*entity.App, error) {
	app, err := s.appRepo.GetByID(ctx, appID)
	if err != nil {
		return nil, ErrAppNotFound
	}
	if _, err := s.authorizeAppAccess(ctx, app, ownerID, PermissionAppPublish); err != nil {
		return nil, err
	}

	version, err := s.appVersionRepo.GetByID(ctx, versionID)
	if err != nil {
		return nil, ErrAppVersionNotFound
	}
	if version.AppID != app.ID {
		return nil, ErrAppVersionMismatch
	}

	if !canRollbackAppStatus(app.Status) {
		return nil, ErrAppInvalidStatusTransition
	}

	app.CurrentVersionID = &versionID
	if app.PublishedAt == nil {
		now := time.Now()
		app.PublishedAt = &now
	}

	if err := s.appRepo.Update(ctx, app); err != nil {
		return nil, err
	}

	return app, nil
}

func (s *appService) Deprecate(ctx context.Context, ownerID uuid.UUID, appID uuid.UUID) (*entity.App, error) {
	app, err := s.appRepo.GetByID(ctx, appID)
	if err != nil {
		return nil, ErrAppNotFound
	}
	if app.OwnerUserID != ownerID {
		return nil, ErrAppUnauthorized
	}

	if !canTransitionAppStatus(app.Status, AppStatusDeprecated) {
		return nil, ErrAppInvalidStatusTransition
	}

	app.Status = AppStatusDeprecated
	if err := s.appRepo.Update(ctx, app); err != nil {
		return nil, err
	}

	return app, nil
}

func (s *appService) Archive(ctx context.Context, ownerID uuid.UUID, appID uuid.UUID) (*entity.App, error) {
	app, err := s.appRepo.GetByID(ctx, appID)
	if err != nil {
		return nil, ErrAppNotFound
	}
	if app.OwnerUserID != ownerID {
		return nil, ErrAppUnauthorized
	}

	if !canTransitionAppStatus(app.Status, AppStatusArchived) {
		return nil, ErrAppInvalidStatusTransition
	}

	app.Status = AppStatusArchived
	if err := s.appRepo.Update(ctx, app); err != nil {
		return nil, err
	}

	return app, nil
}

func (s *appService) GetByID(ctx context.Context, id uuid.UUID, ownerID uuid.UUID) (*entity.App, error) {
	app, err := s.appRepo.GetByID(ctx, id)
	if err != nil {
		return nil, ErrAppNotFound
	}
	if _, err := s.authorizeAppAccess(ctx, app, ownerID, PermissionAppEdit, PermissionAppPublish, PermissionAppViewMetrics, PermissionAppsCreate); err != nil {
		return nil, err
	}
	return app, nil
}

func (s *appService) ExportConfig(ctx context.Context, ownerID uuid.UUID, appID uuid.UUID) (*AppConfigExport, error) {
	app, err := s.appRepo.GetByID(ctx, appID)
	if err != nil {
		return nil, ErrAppNotFound
	}
	if _, err := s.authorizeAppAccess(ctx, app, ownerID, PermissionAppEdit, PermissionAppPublish, PermissionAppViewMetrics, PermissionAppsCreate); err != nil {
		return nil, err
	}

	var currentVersion *entity.AppVersion
	if app.CurrentVersionID != nil {
		currentVersion, err = s.appVersionRepo.GetByID(ctx, *app.CurrentVersionID)
		if err != nil {
			return nil, ErrAppVersionNotFound
		}
		if currentVersion.AppID != app.ID {
			return nil, ErrAppVersionMismatch
		}
	}

	var accessPolicy *entity.AppAccessPolicy
	if s.appPolicyRepo != nil {
		accessPolicy, err = s.appPolicyRepo.GetByAppID(ctx, app.ID)
		if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, err
		}
	}

	export := &AppConfigExport{
		Version:    "1.0.0",
		ExportedAt: time.Now().Format(time.RFC3339),
		App: AppConfigSummary{
			ID:          app.ID,
			WorkspaceID: app.WorkspaceID,
			OwnerUserID: app.OwnerUserID,
			Name:        app.Name,
			Slug:        app.Slug,
			Icon:        app.Icon,
			Description: app.Description,
			Status:      app.Status,
			PricingType: app.PricingType,
			Price:       app.Price,
			CreatedAt:   app.CreatedAt,
			UpdatedAt:   app.UpdatedAt,
			PublishedAt: app.PublishedAt,
		},
	}

	if currentVersion != nil {
		export.CurrentVersion = &AppConfigVersion{
			ID:         currentVersion.ID,
			Version:    currentVersion.Version,
			WorkflowID: currentVersion.WorkflowID,
			UISchema:   currentVersion.UISchema,
			DBSchema:   currentVersion.DBSchema,
			ConfigJSON: currentVersion.ConfigJSON,
			Changelog:  currentVersion.Changelog,
			CreatedAt:  currentVersion.CreatedAt,
		}
	}

	if accessPolicy != nil {
		export.AccessPolicy = &AppConfigAccessPolicy{
			AccessMode:         accessPolicy.AccessMode,
			DataClassification: accessPolicy.DataClassification,
			RateLimitJSON:      accessPolicy.RateLimitJSON,
			AllowedOrigins:     accessPolicy.AllowedOrigins,
			RequireCaptcha:     accessPolicy.RequireCaptcha,
			UpdatedAt:          accessPolicy.UpdatedAt,
		}
	}

	return export, nil
}

func (s *appService) GetAccessPolicy(ctx context.Context, ownerID uuid.UUID, appID uuid.UUID) (*entity.AppAccessPolicy, error) {
	app, err := s.appRepo.GetByID(ctx, appID)
	if err != nil {
		return nil, ErrAppNotFound
	}
	if _, err := s.authorizeAppAccess(ctx, app, ownerID, PermissionAppEdit, PermissionAppPublish); err != nil {
		return nil, err
	}

	policy, err := s.appPolicyRepo.GetByAppID(ctx, appID)
	if err != nil {
		return nil, ErrAppPolicyNotFound
	}

	return policy, nil
}

func (s *appService) UpdateAccessPolicy(ctx context.Context, ownerID uuid.UUID, appID uuid.UUID, req UpdateAppAccessPolicyRequest) (*entity.AppAccessPolicy, error) {
	app, err := s.appRepo.GetByID(ctx, appID)
	if err != nil {
		return nil, ErrAppNotFound
	}
	if _, err := s.authorizeAppAccess(ctx, app, ownerID, PermissionAppPublish); err != nil {
		return nil, err
	}

	policy, err := s.appPolicyRepo.GetByAppID(ctx, appID)
	if err != nil {
		return nil, ErrAppPolicyNotFound
	}

	if req.AccessMode != nil {
		normalized := strings.ToLower(strings.TrimSpace(*req.AccessMode))
		if !isValidAccessMode(normalized) {
			return nil, ErrAppInvalidAccessMode
		}
		policy.AccessMode = normalized
	}
	if req.DataClassification != nil {
		normalized := normalizeDataClassification(*req.DataClassification)
		if !isValidDataClassification(normalized) {
			return nil, ErrAppInvalidDataClassification
		}
		policy.DataClassification = normalized
	} else {
		policy.DataClassification = normalizeDataClassification(policy.DataClassification)
		if !isValidDataClassification(policy.DataClassification) {
			return nil, ErrAppInvalidDataClassification
		}
	}
	if req.RateLimitJSON != nil {
		if err := validateRateLimitAlgorithm(req.RateLimitJSON); err != nil {
			return nil, err
		}
		policy.RateLimitJSON = entity.JSON(req.RateLimitJSON)
	}
	if req.AllowedOrigins != nil {
		cleaned := make(entity.StringArray, 0, len(req.AllowedOrigins))
		for _, origin := range req.AllowedOrigins {
			trimmed := strings.TrimSpace(origin)
			if trimmed == "" {
				return nil, ErrAppInvalidAllowedOrigin
			}
			cleaned = append(cleaned, trimmed)
		}
		policy.AllowedOrigins = cleaned
	}
	if req.RequireCaptcha != nil {
		policy.RequireCaptcha = *req.RequireCaptcha
	}

	if err := validateAccessPolicyClassification(policy.AccessMode, policy.DataClassification); err != nil {
		return nil, err
	}

	policy.UpdatedBy = &ownerID
	if err := s.appPolicyRepo.Update(ctx, policy); err != nil {
		return nil, err
	}

	return policy, nil
}

func (s *appService) UpdatePublicBranding(ctx context.Context, ownerID uuid.UUID, appID uuid.UUID, req UpdateAppPublicBrandingRequest) (*entity.AppVersion, error) {
	app, err := s.appRepo.GetByID(ctx, appID)
	if err != nil {
		return nil, ErrAppNotFound
	}
	if _, err := s.authorizeAppAccess(ctx, app, ownerID, PermissionAppEdit); err != nil {
		return nil, err
	}
	if app.CurrentVersionID == nil {
		return nil, ErrAppVersionRequired
	}
	if req.Branding == nil && req.Theme == nil {
		return nil, ErrAppInvalidPublicBranding
	}

	version, err := s.appVersionRepo.GetByID(ctx, *app.CurrentVersionID)
	if err != nil {
		return nil, ErrAppVersionNotFound
	}
	if version.AppID != app.ID {
		return nil, ErrAppVersionMismatch
	}

	if version.ConfigJSON == nil {
		version.ConfigJSON = entity.JSON{}
	}
	if req.Branding != nil {
		version.ConfigJSON["public_branding"] = req.Branding
	}
	if req.Theme != nil {
		version.ConfigJSON["public_theme"] = req.Theme
	}

	if err := s.appVersionRepo.Update(ctx, version); err != nil {
		return nil, err
	}
	return version, nil
}

func (s *appService) UpdatePublicSEO(ctx context.Context, ownerID uuid.UUID, appID uuid.UUID, req UpdateAppPublicSEORequest) (*entity.AppVersion, error) {
	app, err := s.appRepo.GetByID(ctx, appID)
	if err != nil {
		return nil, ErrAppNotFound
	}
	if _, err := s.authorizeAppAccess(ctx, app, ownerID, PermissionAppEdit); err != nil {
		return nil, err
	}
	if app.CurrentVersionID == nil {
		return nil, ErrAppVersionRequired
	}
	if req.SEO == nil {
		return nil, ErrAppInvalidPublicSEO
	}

	version, err := s.appVersionRepo.GetByID(ctx, *app.CurrentVersionID)
	if err != nil {
		return nil, ErrAppVersionNotFound
	}
	if version.AppID != app.ID {
		return nil, ErrAppVersionMismatch
	}

	if version.ConfigJSON == nil {
		version.ConfigJSON = entity.JSON{}
	}
	version.ConfigJSON["public_seo"] = req.SEO

	if err := s.appVersionRepo.Update(ctx, version); err != nil {
		return nil, err
	}
	return version, nil
}

func (s *appService) UpdatePublicInputs(ctx context.Context, ownerID uuid.UUID, appID uuid.UUID, req UpdateAppPublicInputsRequest) (*entity.AppVersion, error) {
	app, err := s.appRepo.GetByID(ctx, appID)
	if err != nil {
		return nil, ErrAppNotFound
	}
	if _, err := s.authorizeAppAccess(ctx, app, ownerID, PermissionAppEdit); err != nil {
		return nil, err
	}
	if app.CurrentVersionID == nil {
		return nil, ErrAppVersionRequired
	}
	if req.Template == nil && req.Defaults == nil {
		return nil, ErrAppInvalidPublicInputs
	}

	version, err := s.appVersionRepo.GetByID(ctx, *app.CurrentVersionID)
	if err != nil {
		return nil, ErrAppVersionNotFound
	}
	if version.AppID != app.ID {
		return nil, ErrAppVersionMismatch
	}

	if version.ConfigJSON == nil {
		version.ConfigJSON = entity.JSON{}
	}
	if req.Template != nil {
		version.ConfigJSON["public_input_template"] = req.Template
	}
	if req.Defaults != nil {
		version.ConfigJSON["public_input_defaults"] = req.Defaults
	}

	if err := s.appVersionRepo.Update(ctx, version); err != nil {
		return nil, err
	}
	return version, nil
}

func (s *appService) UpdateUISchema(ctx context.Context, ownerID uuid.UUID, appID uuid.UUID, req UpdateAppUISchemaRequest) (*entity.AppVersion, error) {
	app, err := s.appRepo.GetByID(ctx, appID)
	if err != nil {
		return nil, ErrAppNotFound
	}
	if _, err := s.authorizeAppAccess(ctx, app, ownerID, PermissionAppEdit); err != nil {
		return nil, err
	}
	if app.CurrentVersionID == nil {
		return nil, ErrAppVersionRequired
	}
	if req.UISchema == nil {
		return nil, ErrAppInvalidUISchema
	}

	normalized, err := uischema.NormalizeMap(entity.JSON(req.UISchema))
	if err != nil {
		return nil, ErrAppInvalidUISchema
	}

	version, err := s.appVersionRepo.GetByID(ctx, *app.CurrentVersionID)
	if err != nil {
		return nil, ErrAppVersionNotFound
	}
	if version.AppID != app.ID {
		return nil, ErrAppVersionMismatch
	}

	if normalized == nil {
		version.UISchema = entity.JSON{}
	} else {
		version.UISchema = entity.JSON(normalized)
	}

	if version.ConfigJSON == nil {
		version.ConfigJSON = entity.JSON{}
	}
	if version.WorkflowID != nil {
		if workflow, err := s.workflowRepo.GetByID(ctx, *version.WorkflowID); err == nil {
			if mapping := buildInputMappingWarnings(version.UISchema, workflow.Definition); mapping != nil {
				version.ConfigJSON["input_mapping"] = mapping
			} else {
				delete(version.ConfigJSON, "input_mapping")
			}
		}
	}

	if err := s.appVersionRepo.Update(ctx, version); err != nil {
		return nil, err
	}
	return version, nil
}

func (s *appService) ListVersions(ctx context.Context, ownerID uuid.UUID, appID uuid.UUID, params AppVersionListParams) ([]entity.AppVersion, int64, error) {
	app, err := s.appRepo.GetByID(ctx, appID)
	if err != nil {
		return nil, 0, ErrAppNotFound
	}
	if _, err := s.authorizeAppAccess(ctx, app, ownerID, PermissionAppEdit, PermissionAppPublish, PermissionAppViewMetrics, PermissionAppsCreate); err != nil {
		return nil, 0, err
	}
	return s.appVersionRepo.ListByAppID(ctx, appID, repository.AppVersionListParams{
		Page:     params.Page,
		PageSize: params.PageSize,
	})
}

func (s *appService) ListExecutions(ctx context.Context, ownerID uuid.UUID, appID uuid.UUID, params AppExecutionListParams) ([]entity.Execution, int64, error) {
	if params.Page < 1 {
		params.Page = 1
	}
	if params.PageSize < 1 || params.PageSize > 100 {
		params.PageSize = 20
	}

	app, err := s.appRepo.GetByID(ctx, appID)
	if err != nil {
		return nil, 0, ErrAppNotFound
	}
	if _, err := s.authorizeAppAccess(ctx, app, ownerID, PermissionAppEdit, PermissionAppPublish, PermissionAppViewMetrics, PermissionAppsCreate); err != nil {
		return nil, 0, err
	}

	if app.CurrentVersionID == nil {
		return []entity.Execution{}, 0, nil
	}
	version, err := s.appVersionRepo.GetByID(ctx, *app.CurrentVersionID)
	if err != nil {
		return nil, 0, ErrAppVersionNotFound
	}
	if version.WorkflowID == nil {
		return []entity.Execution{}, 0, nil
	}
	workflowID := *version.WorkflowID

	return s.executionRepo.List(ctx, repository.ExecutionListParams{
		WorkflowID:  &workflowID,
		WorkspaceID: &app.WorkspaceID,
		Status:      params.Status,
		Page:        params.Page,
		PageSize:    params.PageSize,
		Sort:        params.Sort,
		Order:       params.Order,
	})
}

func (s *appService) CompareVersions(ctx context.Context, ownerID uuid.UUID, appID uuid.UUID, fromID uuid.UUID, toID uuid.UUID) (*AppVersionDiff, error) {
	app, err := s.appRepo.GetByID(ctx, appID)
	if err != nil {
		return nil, ErrAppNotFound
	}
	if _, err := s.authorizeAppAccess(ctx, app, ownerID, PermissionAppEdit, PermissionAppPublish, PermissionAppViewMetrics, PermissionAppsCreate); err != nil {
		return nil, err
	}

	fromVersion, err := s.appVersionRepo.GetByID(ctx, fromID)
	if err != nil {
		return nil, ErrAppVersionNotFound
	}
	toVersion, err := s.appVersionRepo.GetByID(ctx, toID)
	if err != nil {
		return nil, ErrAppVersionNotFound
	}
	if fromVersion.AppID != app.ID || toVersion.AppID != app.ID {
		return nil, ErrAppVersionMismatch
	}

	changed := make([]string, 0, 6)
	if !reflect.DeepEqual(fromVersion.WorkflowID, toVersion.WorkflowID) {
		changed = append(changed, "workflow_id")
	}
	if !reflect.DeepEqual(fromVersion.UISchema, toVersion.UISchema) {
		changed = append(changed, "ui_schema")
	}
	if !reflect.DeepEqual(fromVersion.DBSchema, toVersion.DBSchema) {
		changed = append(changed, "db_schema")
	}
	if !reflect.DeepEqual(fromVersion.ConfigJSON, toVersion.ConfigJSON) {
		changed = append(changed, "config_json")
	}
	if !reflect.DeepEqual(fromVersion.Changelog, toVersion.Changelog) {
		changed = append(changed, "changelog")
	}

	diff := &AppVersionDiff{
		From: AppVersionSummary{
			ID:         fromVersion.ID,
			Version:    fromVersion.Version,
			WorkflowID: fromVersion.WorkflowID,
			CreatedAt:  fromVersion.CreatedAt,
		},
		To: AppVersionSummary{
			ID:         toVersion.ID,
			Version:    toVersion.Version,
			WorkflowID: toVersion.WorkflowID,
			CreatedAt:  toVersion.CreatedAt,
		},
		ChangedFields: changed,
	}
	return diff, nil
}

func (s *appService) List(ctx context.Context, ownerID uuid.UUID, params repository.AppListParams) ([]entity.App, int64, error) {
	if params.WorkspaceID != nil {
		access, err := s.workspaceService.GetWorkspaceAccess(ctx, *params.WorkspaceID, ownerID)
		if err != nil {
			if errors.Is(err, ErrWorkspaceNotFound) {
				return nil, 0, ErrAppWorkspaceNotFound
			}
			if errors.Is(err, ErrWorkspaceUnauthorized) {
				return nil, 0, ErrAppUnauthorized
			}
			return nil, 0, err
		}
		if !hasAnyPermission(access.Permissions, PermissionAppEdit, PermissionAppPublish, PermissionAppViewMetrics, PermissionAppsCreate) {
			return nil, 0, ErrAppUnauthorized
		}
	}

	apps, total, err := s.appRepo.List(ctx, ownerID, params)
	if err != nil {
		return nil, 0, err
	}

	if params.WorkspaceID == nil {
		filtered := make([]entity.App, 0, len(apps))
		for _, app := range apps {
			access, err := s.workspaceService.GetWorkspaceAccess(ctx, app.WorkspaceID, ownerID)
			if err != nil {
				continue
			}
			if hasAnyPermission(access.Permissions, PermissionAppEdit, PermissionAppPublish, PermissionAppViewMetrics, PermissionAppsCreate) {
				filtered = append(filtered, app)
			}
		}
		apps = filtered
		total = int64(len(filtered))
	}

	return apps, total, nil
}

func (s *appService) createAppWithVersion(
	ctx context.Context,
	ownerID uuid.UUID,
	workspace *entity.Workspace,
	name string,
	slug string,
	icon string,
	description *string,
	source string,
	workflowID *uuid.UUID,
	uiSchema *entity.JSON,
	dbSchema *entity.JSON,
) (*entity.App, error) {
	if strings.TrimSpace(name) == "" {
		return nil, ErrAppInvalidName
	}

	limit := s.getAppLimitByPlan(workspace.Plan)
	if limit >= 0 {
		count, err := s.appRepo.CountByWorkspace(ctx, workspace.ID)
		if err != nil {
			return nil, err
		}
		if count >= int64(limit) {
			return nil, ErrAppQuotaExceeded
		}
	}

	rawSlug := strings.TrimSpace(slug)
	if rawSlug == "" {
		rawSlug = name
	}
	normalized := s.generateSlug(rawSlug)
	if normalized == "" {
		return nil, ErrAppInvalidSlug
	}

	uniqueSlug, err := s.ensureUniqueSlug(ctx, workspace.ID, normalized)
	if err != nil {
		return nil, err
	}

	app := &entity.App{
		WorkspaceID: workspace.ID,
		OwnerUserID: ownerID,
		Name:        strings.TrimSpace(name),
		Slug:        uniqueSlug,
		Icon:        icon,
		Description: description,
		Status:      AppStatusDraft,
		PricingType: "free",
	}
	if strings.TrimSpace(app.Icon) == "" {
		app.Icon = "📦"
	}

	if err := s.appRepo.Create(ctx, app); err != nil {
		return nil, err
	}

	s.recordAppCreated(ctx, app, ownerID, source, workflowID)
	if workflowID != nil {
		var workflowDefinition entity.JSON
		if workflow, err := s.workflowRepo.GetByID(ctx, *workflowID); err == nil {
			workflowDefinition = workflow.Definition
		}

		versionUISchema := entity.JSON{}
		if uiSchema != nil {
			versionUISchema = *uiSchema
		}
		versionDBSchema := entity.JSON{}
		if dbSchema != nil {
			versionDBSchema = *dbSchema
		}
		versionConfigJSON := entity.JSON{}

		if len(versionUISchema) == 0 && workflowDefinition != nil {
			if generated, ok := buildUISchemaFromWorkflow(workflowDefinition); ok {
				versionUISchema = generated
			}
		}
		if workflowDefinition != nil {
			if outputSchema := buildOutputSchemaFromWorkflow(workflowDefinition); outputSchema != nil {
				versionConfigJSON["output_schema"] = outputSchema
			}
			if mapping := buildInputMappingWarnings(versionUISchema, workflowDefinition); mapping != nil {
				versionConfigJSON["input_mapping"] = mapping
			}
		}

		version := &entity.AppVersion{
			AppID:      app.ID,
			Version:    "v1",
			WorkflowID: workflowID,
			UISchema:   versionUISchema,
			DBSchema:   versionDBSchema,
			ConfigJSON: versionConfigJSON,
			CreatedBy:  &ownerID,
		}
		if err := s.appVersionRepo.Create(ctx, version); err != nil {
			return nil, err
		}
		app.CurrentVersionID = &version.ID
		if err := s.appRepo.Update(ctx, app); err != nil {
			return nil, err
		}
		if err := s.createDBSchemaReviewIfNeeded(ctx, app, version, ownerID, source); err != nil {
			return nil, err
		}
	}

	policy := &entity.AppAccessPolicy{
		AppID:              app.ID,
		AccessMode:         "private",
		DataClassification: DataClassificationPublic,
		RateLimitJSON:      entity.JSON{"algorithm": "fixed_window"},
		AllowedOrigins:     entity.StringArray{},
		RequireCaptcha:     false,
		UpdatedBy:          &ownerID,
	}
	if err := s.appPolicyRepo.Create(ctx, policy); err != nil {
		return nil, err
	}

	return app, nil
}

func (s *appService) recordAppCreated(ctx context.Context, app *entity.App, userID uuid.UUID, source string, workflowID *uuid.UUID) {
	if s.eventRecorder == nil || app == nil {
		return
	}
	metadata := entity.JSON{
		"source":  source,
		"slug":    app.Slug,
		"status":  app.Status,
		"pricing": app.PricingType,
	}
	if workflowID != nil {
		metadata["workflow_id"] = workflowID.String()
	}
	event := entity.NewRuntimeEvent(entity.EventAppCreated).
		WithApp(app.ID).
		WithWorkspace(app.WorkspaceID).
		WithUser(userID).
		WithMessage("app created").
		Build()
	event.Metadata = metadata
	_ = s.eventRecorder.Record(ctx, event)
}

func (s *appService) recordAppPublished(ctx context.Context, app *entity.App, userID uuid.UUID, versionID *uuid.UUID) {
	if s.eventRecorder == nil || app == nil {
		return
	}
	metadata := entity.JSON{
		"status": app.Status,
		"slug":   app.Slug,
	}
	if versionID != nil {
		metadata["version_id"] = versionID.String()
	}
	event := entity.NewRuntimeEvent(entity.EventAppPublished).
		WithApp(app.ID).
		WithWorkspace(app.WorkspaceID).
		WithUser(userID).
		WithMessage("app published").
		Build()
	event.Metadata = metadata
	_ = s.eventRecorder.Record(ctx, event)
}

func (s *appService) getAppLimitByPlan(plan string) int {
	normalized := strings.ToLower(strings.TrimSpace(plan))
	switch normalized {
	case "pro":
		return 20
	case "enterprise":
		return -1
	case "free", "":
		return 3
	default:
		return 3
	}
}

func isValidAccessMode(mode string) bool {
	switch mode {
	case "private", "public_auth", "public_anonymous":
		return true
	default:
		return false
	}
}

func validateRateLimitAlgorithm(raw map[string]interface{}) error {
	if raw == nil {
		return nil
	}
	algorithm, ok := raw["algorithm"]
	if !ok {
		algorithm, ok = raw["rate_limit_algorithm"]
		if !ok {
			return nil
		}
	}
	algoString, ok := algorithm.(string)
	if !ok {
		return ErrAppInvalidRateLimitAlgorithm
	}
	normalized := normalizeRateLimitAlgorithm(algoString)
	if normalized != "fixed_window" {
		return ErrAppInvalidRateLimitAlgorithm
	}
	raw["algorithm"] = normalized
	delete(raw, "rate_limit_algorithm")
	return nil
}

func normalizeRateLimitAlgorithm(value string) string {
	normalized := strings.ToLower(strings.TrimSpace(value))
	normalized = strings.ReplaceAll(normalized, "-", "_")
	return normalized
}

func defaultWorkflowSettings() map[string]interface{} {
	return map[string]interface{}{
		"timeout": 300000,
		"retryPolicy": map[string]interface{}{
			"maxRetries": 3,
			"backoffMs":  1000,
		},
		"errorHandling": "stop",
		"generatedAt":   time.Now().Format(time.RFC3339),
	}
}

func (s *appService) ensureAppSlugAlias(ctx context.Context, appID uuid.UUID, workspaceID uuid.UUID, slug string) {
	if s.appSlugAliasRepo == nil {
		return
	}
	trimmed := strings.TrimSpace(slug)
	if trimmed == "" {
		return
	}
	exists, err := s.appRepo.ExistsByWorkspaceSlug(ctx, workspaceID, trimmed)
	if err == nil && exists {
		return
	}
	alias, err := s.appSlugAliasRepo.GetByWorkspaceAndSlug(ctx, workspaceID, trimmed)
	if err == nil && alias != nil {
		return
	}
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return
	}
	_ = s.appSlugAliasRepo.Create(ctx, &entity.AppSlugAlias{
		AppID:       appID,
		WorkspaceID: workspaceID,
		Slug:        trimmed,
	})
}

func (s *appService) ensureUniqueSlug(ctx context.Context, workspaceID uuid.UUID, baseSlug string) (string, error) {
	slug := baseSlug
	for i := 0; i < 5; i++ {
		exists, err := s.appRepo.ExistsByWorkspaceSlug(ctx, workspaceID, slug)
		if err != nil {
			return "", err
		}
		if !exists {
			return slug, nil
		}
		slug = fmt.Sprintf("%s-%s", baseSlug, uuid.New().String()[:8])
	}
	return "", ErrAppSlugExists
}

// generateSlug 生成 URL 友好的 slug
func (s *appService) generateSlug(name string) string {
	slug := strings.ToLower(name)
	slug = strings.ReplaceAll(slug, " ", "-")
	reg := regexp.MustCompile("[^a-z0-9-]")
	slug = reg.ReplaceAllString(slug, "")
	reg = regexp.MustCompile("-+")
	slug = reg.ReplaceAllString(slug, "-")
	slug = strings.Trim(slug, "-")
	return slug
}

func (s *appService) resolveDBSchemaReviewVersion(ctx context.Context, app *entity.App, versionID *uuid.UUID) (*entity.AppVersion, error) {
	if app == nil {
		return nil, ErrAppNotFound
	}
	targetID := versionID
	if targetID == nil {
		if app.CurrentVersionID == nil {
			return nil, ErrAppVersionRequired
		}
		targetID = app.CurrentVersionID
	}
	version, err := s.appVersionRepo.GetByID(ctx, *targetID)
	if err != nil {
		return nil, ErrAppVersionNotFound
	}
	if version.AppID != app.ID {
		return nil, ErrAppVersionMismatch
	}
	return version, nil
}

func (s *appService) buildDBSchemaReviewQueue(app *entity.App, version *entity.AppVersion, submitterID uuid.UUID, note *string) *entity.ReviewQueue {
	description := "DB Schema 审核"
	title := fmt.Sprintf("%s %s DB Schema", app.Name, version.Version)
	snapshot := entity.JSON{
		"app":       app,
		"version":   version,
		"db_schema": version.DBSchema,
	}
	queue := &entity.ReviewQueue{
		ItemType:    entity.ReviewItemTypeDBSchema,
		ItemID:      version.ID,
		SubmitterID: submitterID,
		Status:      entity.ReviewStatusPending,
		Priority:    entity.ReviewPriorityNormal,
		Title:       title,
		Description: &description,
		Snapshot:    snapshot,
	}
	if note != nil && strings.TrimSpace(*note) != "" {
		queue.SubmissionNote = note
	}
	return queue
}

func (s *appService) createDBSchemaReviewIfNeeded(ctx context.Context, app *entity.App, version *entity.AppVersion, submitterID uuid.UUID, source string) error {
	if s.reviewQueueRepo == nil || app == nil || version == nil {
		return nil
	}
	if strings.ToLower(strings.TrimSpace(source)) != "ai" {
		return nil
	}
	if len(version.DBSchema) == 0 {
		return nil
	}
	existing, _ := s.reviewQueueRepo.GetByItemID(ctx, entity.ReviewItemTypeDBSchema, version.ID)
	if existing != nil && (existing.Status == entity.ReviewStatusPending || existing.Status == entity.ReviewStatusInReview) {
		return nil
	}
	note := "AI 生成 DB Schema"
	reviewQueue := s.buildDBSchemaReviewQueue(app, version, submitterID, &note)
	return s.reviewQueueRepo.Create(ctx, reviewQueue)
}

func requiresMajorChangeReview(changelog *string) bool {
	if changelog == nil {
		return false
	}
	trimmed := strings.TrimSpace(*changelog)
	if trimmed == "" {
		return false
	}
	return detectChangeLevel(trimmed) == ChangeLevelMajor
}

func (s *appService) resolveMajorChangeReviewVersion(ctx context.Context, app *entity.App, versionID *uuid.UUID) (*entity.AppVersion, error) {
	if app == nil {
		return nil, ErrAppNotFound
	}
	targetID := versionID
	if targetID == nil {
		if app.CurrentVersionID == nil {
			return nil, ErrAppVersionRequired
		}
		targetID = app.CurrentVersionID
	}
	version, err := s.appVersionRepo.GetByID(ctx, *targetID)
	if err != nil {
		return nil, ErrAppVersionNotFound
	}
	if version.AppID != app.ID {
		return nil, ErrAppVersionMismatch
	}
	return version, nil
}

func (s *appService) buildMajorChangeReviewQueue(app *entity.App, version *entity.AppVersion, submitterID uuid.UUID, note *string) *entity.ReviewQueue {
	description := "重大变更审核"
	title := fmt.Sprintf("%s %s 重大变更", app.Name, version.Version)
	snapshot := entity.JSON{
		"app":          app,
		"version":      version,
		"changelog":    version.Changelog,
		"change_level": string(ChangeLevelMajor),
	}
	queue := &entity.ReviewQueue{
		ItemType:    entity.ReviewItemTypeMajorChange,
		ItemID:      version.ID,
		SubmitterID: submitterID,
		Status:      entity.ReviewStatusPending,
		Priority:    entity.ReviewPriorityHigh,
		Title:       title,
		Description: &description,
		Snapshot:    snapshot,
	}
	if note != nil && strings.TrimSpace(*note) != "" {
		queue.SubmissionNote = note
	}
	return queue
}

func (s *appService) createMajorChangeReviewIfNeeded(ctx context.Context, app *entity.App, version *entity.AppVersion, submitterID uuid.UUID, level ChangeLevel) error {
	if s.reviewQueueRepo == nil || app == nil || version == nil {
		return nil
	}
	if level != ChangeLevelMajor {
		return nil
	}
	existing, _ := s.reviewQueueRepo.GetByItemID(ctx, entity.ReviewItemTypeMajorChange, version.ID)
	if existing != nil && (existing.Status == entity.ReviewStatusPending || existing.Status == entity.ReviewStatusInReview) {
		return nil
	}
	note := "检测到 BREAKING 变更"
	reviewQueue := s.buildMajorChangeReviewQueue(app, version, submitterID, &note)
	return s.reviewQueueRepo.Create(ctx, reviewQueue)
}

func cloneJSONPointer(value entity.JSON) *entity.JSON {
	if value == nil {
		return nil
	}
	cloned := make(entity.JSON, len(value))
	for key, val := range value {
		cloned[key] = val
	}
	return &cloned
}

func (s *appService) authorizeAppAccess(ctx context.Context, app *entity.App, userID uuid.UUID, required ...string) (*WorkspaceAccess, error) {
	if app == nil {
		return nil, ErrAppNotFound
	}
	access, err := s.workspaceService.GetWorkspaceAccess(ctx, app.WorkspaceID, userID)
	if err != nil {
		if errors.Is(err, ErrWorkspaceNotFound) {
			return nil, ErrAppNotFound
		}
		if errors.Is(err, ErrWorkspaceUnauthorized) {
			return nil, ErrAppUnauthorized
		}
		return nil, err
	}
	if len(required) > 0 && !hasAnyPermission(access.Permissions, required...) {
		return nil, ErrAppUnauthorized
	}
	return access, nil
}

var (
	ErrAppNotFound                  = errors.New("app not found")
	ErrAppUnauthorized              = errors.New("unauthorized to access this app")
	ErrAppSlugExists                = errors.New("app slug already exists")
	ErrAppInvalidName               = errors.New("app name is invalid")
	ErrAppInvalidSlug               = errors.New("app slug is invalid")
	ErrAppInvalidWorkspace          = errors.New("app workspace is invalid")
	ErrAppWorkspaceNotFound         = errors.New("app workspace not found")
	ErrAppQuotaExceeded             = errors.New("app quota exceeded")
	ErrAppWorkflowNotFound          = errors.New("app workflow not found")
	ErrAppWorkflowWorkspaceMismatch = errors.New("workflow workspace mismatch")
	ErrAppInvalidWorkflow           = errors.New("app workflow is invalid")
	ErrAppInvalidDescription        = errors.New("app description is invalid")
	ErrAppAIGenerationFailed        = errors.New("app ai generation failed")
	ErrAppVersionNotFound           = errors.New("app version not found")
	ErrAppVersionMismatch           = errors.New("app version mismatch")
	ErrAppVersionRequired           = errors.New("app version required")
	ErrAppPublishVersionRequired    = errors.New("app publish version required")
	ErrAppPolicyNotFound            = errors.New("app access policy not found")
	ErrAppInvalidAccessMode         = errors.New("app access mode is invalid")
	ErrAppInvalidDataClassification = errors.New("app data classification is invalid")
	ErrAppInvalidAllowedOrigin      = errors.New("app allowed origin is invalid")
	ErrAppInvalidRateLimitAlgorithm = errors.New("app rate limit algorithm is invalid")
	ErrAppInvalidAccessPolicy       = errors.New("app access policy is invalid")
	ErrAppInvalidPublicBranding     = errors.New("app public branding is invalid")
	ErrAppInvalidPublicSEO          = errors.New("app public seo is invalid")
	ErrAppInvalidPublicInputs       = errors.New("app public inputs is invalid")
	ErrAppInvalidUISchema           = errors.New("app ui schema is invalid")
	ErrAppInvalidStatusTransition   = errors.New("app status transition is invalid")
	ErrDBSchemaMissing              = errors.New("db schema is missing")
	ErrDBSchemaReviewExists         = errors.New("db schema review already exists")
	ErrDBSchemaReviewNotFound       = errors.New("db schema review not found")
	ErrDBSchemaReviewUnavailable    = errors.New("db schema review service unavailable")
	ErrDBSchemaReviewerNotFound     = errors.New("db schema reviewer not found")
	ErrMajorChangeNotRequired       = errors.New("major change review not required")
	ErrMajorChangeReviewExists      = errors.New("major change review already exists")
	ErrMajorChangeReviewNotFound    = errors.New("major change review not found")
	ErrMajorChangeReviewUnavailable = errors.New("major change review service unavailable")
	ErrMajorChangeReviewerNotFound  = errors.New("major change reviewer not found")
	ErrMajorChangeReviewRequired    = errors.New("major change review required")
	ErrMajorChangeReviewNotApproved = errors.New("major change review not approved")
)
