package service

import (
	"context"
	"errors"
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/agentflow/server/internal/config"
	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/repository"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// WorkspaceService 工作空间服务接口
type WorkspaceService interface {
	EnsureDefaultWorkspace(ctx context.Context, user *entity.User) (*entity.Workspace, error)
	EnsureDefaultWorkspaceByUserID(ctx context.Context, userID uuid.UUID) (*entity.Workspace, error)
	Create(ctx context.Context, ownerID uuid.UUID, req CreateWorkspaceRequest) (*entity.Workspace, error)
	ListByOwner(ctx context.Context, ownerID uuid.UUID) ([]entity.Workspace, error)
	ListByUser(ctx context.Context, userID uuid.UUID) ([]entity.Workspace, error)
	GetByID(ctx context.Context, id uuid.UUID, ownerID uuid.UUID) (*entity.Workspace, error)
	Update(ctx context.Context, id uuid.UUID, ownerID uuid.UUID, req UpdateWorkspaceRequest) (*entity.Workspace, error)
	ExportData(ctx context.Context, id uuid.UUID, ownerID uuid.UUID) (*WorkspaceDataExport, error)
	Delete(ctx context.Context, id uuid.UUID, ownerID uuid.UUID) (*WorkspaceDeletionResult, error)
	Restore(ctx context.Context, id uuid.UUID, ownerID uuid.UUID) (*WorkspaceDeletionResult, error)
	ListMembers(ctx context.Context, workspaceID uuid.UUID, ownerID uuid.UUID) ([]entity.WorkspaceMember, error)
	AddMember(ctx context.Context, workspaceID uuid.UUID, ownerID uuid.UUID, userID uuid.UUID, roleID *uuid.UUID) (*entity.WorkspaceMember, error)
	UpdateMemberRole(ctx context.Context, workspaceID uuid.UUID, ownerID uuid.UUID, memberID uuid.UUID, roleID uuid.UUID) (*entity.WorkspaceMember, error)
	GetWorkspaceAccess(ctx context.Context, workspaceID uuid.UUID, userID uuid.UUID) (*WorkspaceAccess, error)
}

type workspaceService struct {
	workspaceRepo repository.WorkspaceRepository
	slugAliasRepo repository.WorkspaceSlugAliasRepository
	userRepo      repository.UserRepository
	roleRepo      repository.WorkspaceRoleRepository
	memberRepo    repository.WorkspaceMemberRepository
	eventRecorder EventRecorderService
	appRepo       repository.AppRepository
	workflowRepo  repository.WorkflowRepository
	retentionCfg  config.RetentionConfig
}

// NewWorkspaceService 创建工作空间服务实例
func NewWorkspaceService(
	workspaceRepo repository.WorkspaceRepository,
	slugAliasRepo repository.WorkspaceSlugAliasRepository,
	userRepo repository.UserRepository,
	roleRepo repository.WorkspaceRoleRepository,
	memberRepo repository.WorkspaceMemberRepository,
	eventRecorder EventRecorderService,
	appRepo repository.AppRepository,
	workflowRepo repository.WorkflowRepository,
	retentionCfg config.RetentionConfig,
) WorkspaceService {
	return &workspaceService{
		workspaceRepo: workspaceRepo,
		slugAliasRepo: slugAliasRepo,
		userRepo:      userRepo,
		roleRepo:      roleRepo,
		memberRepo:    memberRepo,
		eventRecorder: eventRecorder,
		appRepo:       appRepo,
		workflowRepo:  workflowRepo,
		retentionCfg:  retentionCfg,
	}
}

func (s *workspaceService) EnsureDefaultWorkspace(ctx context.Context, user *entity.User) (*entity.Workspace, error) {
	if user == nil {
		return nil, errors.New("user is nil")
	}

	existing, err := s.workspaceRepo.GetByOwnerID(ctx, user.ID)
	if err == nil && existing != nil {
		roles, roleErr := s.ensureDefaultRoles(ctx, existing.ID)
		if roleErr != nil {
			return nil, roleErr
		}
		if ownerRole, ok := roles["owner"]; ok {
			if err := s.ensureOwnerMembership(ctx, existing.ID, existing.OwnerUserID, ownerRole.ID); err != nil {
				return nil, err
			}
		}
		return existing, nil
	}
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	baseSlug := s.generateSlug(user.Username)
	if baseSlug == "" {
		baseSlug = "workspace"
	}

	slug, err := s.ensureUniqueSlug(ctx, baseSlug)
	if err != nil {
		return nil, err
	}

	plan := user.Plan
	if plan == "" {
		plan = "free"
	}

	workspace := &entity.Workspace{
		OwnerUserID: user.ID,
		Name:        "Default Workspace",
		Slug:        slug,
		Icon:        "🏢",
		Status:      "active",
		Plan:        plan,
		Settings:    entity.JSON{},
	}

	if err := s.workspaceRepo.Create(ctx, workspace); err != nil {
		return nil, err
	}

	roles, err := s.ensureDefaultRoles(ctx, workspace.ID)
	if err != nil {
		return nil, err
	}
	if ownerRole, ok := roles["owner"]; ok {
		if err := s.ensureOwnerMembership(ctx, workspace.ID, user.ID, ownerRole.ID); err != nil {
			return nil, err
		}
	}

	s.recordWorkspaceCreated(ctx, workspace, user.ID, "default")
	return workspace, nil
}

func (s *workspaceService) EnsureDefaultWorkspaceByUserID(ctx context.Context, userID uuid.UUID) (*entity.Workspace, error) {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	return s.EnsureDefaultWorkspace(ctx, user)
}

// CreateWorkspaceRequest 创建工作空间请求
type CreateWorkspaceRequest struct {
	Name   string  `json:"name"`
	Slug   *string `json:"slug"`
	Icon   *string `json:"icon"`
	Plan   *string `json:"plan"`
	Region *string `json:"region"`
}

func (s *workspaceService) Create(ctx context.Context, ownerID uuid.UUID, req CreateWorkspaceRequest) (*entity.Workspace, error) {
	user, err := s.userRepo.GetByID(ctx, ownerID)
	if err != nil {
		return nil, ErrWorkspaceUserNotFound
	}

	name := strings.TrimSpace(req.Name)
	if name == "" {
		return nil, ErrWorkspaceInvalidName
	}

	slugSource := name
	if req.Slug != nil {
		trimmed := strings.TrimSpace(*req.Slug)
		if trimmed == "" {
			return nil, ErrWorkspaceInvalidSlug
		}
		slugSource = trimmed
	}
	slug := s.generateSlug(slugSource)
	if slug == "" {
		return nil, ErrWorkspaceInvalidSlug
	}
	uniqueSlug, err := s.ensureUniqueSlug(ctx, slug)
	if err != nil {
		return nil, err
	}

	icon := ""
	if req.Icon != nil {
		icon = strings.TrimSpace(*req.Icon)
		if icon == "" {
			return nil, ErrWorkspaceInvalidIcon
		}
	}

	plan := ""
	if req.Plan != nil {
		plan = strings.TrimSpace(*req.Plan)
		if plan == "" {
			return nil, ErrWorkspaceInvalidPlan
		}
	} else if user != nil {
		plan = strings.TrimSpace(user.Plan)
	}
	if plan == "" {
		plan = "free"
	}

	region := ""
	if req.Region != nil {
		trimmed := strings.TrimSpace(*req.Region)
		if trimmed != "" {
			region = trimmed
		}
	}

	workspace := &entity.Workspace{
		OwnerUserID: ownerID,
		Name:        name,
		Slug:        uniqueSlug,
		Icon:        icon,
		Status:      "active",
		Plan:        plan,
		Settings:    entity.JSON{},
	}
	if region != "" {
		workspace.Region = &region
	}

	if err := s.workspaceRepo.Create(ctx, workspace); err != nil {
		return nil, err
	}

	roles, err := s.ensureDefaultRoles(ctx, workspace.ID)
	if err != nil {
		return nil, err
	}
	if ownerRole, ok := roles["owner"]; ok {
		if err := s.ensureOwnerMembership(ctx, workspace.ID, ownerID, ownerRole.ID); err != nil {
			return nil, err
		}
	}

	s.recordWorkspaceCreated(ctx, workspace, ownerID, "manual")
	return workspace, nil
}

func (s *workspaceService) recordWorkspaceCreated(ctx context.Context, workspace *entity.Workspace, userID uuid.UUID, source string) {
	if s.eventRecorder == nil || workspace == nil {
		return
	}
	metadata := entity.JSON{
		"source": source,
		"plan":   workspace.Plan,
		"slug":   workspace.Slug,
	}
	event := entity.NewRuntimeEvent(entity.EventWorkspaceCreated).
		WithWorkspace(workspace.ID).
		WithUser(userID).
		WithMessage("workspace created").
		Build()
	event.Metadata = metadata
	_ = s.eventRecorder.Record(ctx, event)
}

func (s *workspaceService) ListByOwner(ctx context.Context, ownerID uuid.UUID) ([]entity.Workspace, error) {
	return s.workspaceRepo.ListByOwnerID(ctx, ownerID)
}

func (s *workspaceService) ListByUser(ctx context.Context, userID uuid.UUID) ([]entity.Workspace, error) {
	return s.workspaceRepo.ListByUserID(ctx, userID)
}

// WorkspaceAccess 当前用户在工作空间的访问上下文
type WorkspaceAccess struct {
	Workspace   *entity.Workspace     `json:"workspace"`
	Role        *entity.WorkspaceRole `json:"role,omitempty"`
	Permissions entity.JSON           `json:"permissions"`
	IsOwner     bool                  `json:"is_owner"`
}

func (s *workspaceService) GetByID(ctx context.Context, id uuid.UUID, ownerID uuid.UUID) (*entity.Workspace, error) {
	access, err := s.GetWorkspaceAccess(ctx, id, ownerID)
	if err != nil {
		return nil, err
	}
	return access.Workspace, nil
}

// UpdateWorkspaceRequest 更新工作空间请求
type UpdateWorkspaceRequest struct {
	Name *string `json:"name"`
	Slug *string `json:"slug"`
	Icon *string `json:"icon"`
	Plan *string `json:"plan"`
}

// WorkspaceDataExport 工作空间数据导出结构
type WorkspaceDataExport struct {
	Version    string                   `json:"version"`
	ExportedAt string                   `json:"exported_at"`
	Workspace  *entity.Workspace        `json:"workspace"`
	Members    []entity.WorkspaceMember `json:"members"`
	Apps       []entity.App             `json:"apps"`
	Workflows  []entity.Workflow        `json:"workflows"`
}

// WorkspaceDeletionResult 工作空间删除结果
type WorkspaceDeletionResult struct {
	WorkspaceID  uuid.UUID  `json:"workspace_id"`
	Stage        string     `json:"stage"`
	DeletedAt    *time.Time `json:"deleted_at,omitempty"`
	RestoreUntil *time.Time `json:"restore_until,omitempty"`
	PurgeAfter   *time.Time `json:"purge_after,omitempty"`
}

func (s *workspaceService) Update(ctx context.Context, id uuid.UUID, ownerID uuid.UUID, req UpdateWorkspaceRequest) (*entity.Workspace, error) {
	access, err := s.authorizeWorkspace(ctx, id, ownerID, PermissionWorkspaceAdmin)
	if err != nil {
		return nil, err
	}
	workspace := access.Workspace
	oldSlug := workspace.Slug
	slugChanged := false

	if req.Name != nil {
		if strings.TrimSpace(*req.Name) == "" {
			return nil, ErrWorkspaceInvalidName
		}
		workspace.Name = strings.TrimSpace(*req.Name)
	}
	if req.Slug != nil {
		normalized := s.generateSlug(*req.Slug)
		if normalized == "" {
			return nil, ErrWorkspaceInvalidSlug
		}
		if normalized != workspace.Slug {
			existing, err := s.workspaceRepo.GetBySlug(ctx, normalized)
			if err == nil && existing != nil && existing.ID != workspace.ID {
				return nil, ErrWorkspaceSlugExists
			}
			if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, err
			}
		}
		workspace.Slug = normalized
		if normalized != oldSlug {
			slugChanged = true
		}
	}
	if req.Icon != nil {
		if strings.TrimSpace(*req.Icon) == "" {
			return nil, ErrWorkspaceInvalidIcon
		}
		workspace.Icon = strings.TrimSpace(*req.Icon)
	}
	if req.Plan != nil {
		if strings.TrimSpace(*req.Plan) == "" {
			return nil, ErrWorkspaceInvalidPlan
		}
		workspace.Plan = strings.TrimSpace(*req.Plan)
	}

	if err := s.workspaceRepo.Update(ctx, workspace); err != nil {
		return nil, err
	}
	if slugChanged {
		s.ensureSlugAlias(ctx, workspace.ID, oldSlug)
	}
	return workspace, nil
}

func (s *workspaceService) ExportData(ctx context.Context, id uuid.UUID, ownerID uuid.UUID) (*WorkspaceDataExport, error) {
	if s.appRepo == nil || s.workflowRepo == nil {
		return nil, ErrWorkspaceExportUnavailable
	}
	access, err := s.authorizeWorkspace(ctx, id, ownerID, PermissionWorkspaceAdmin)
	if err != nil {
		return nil, err
	}

	members, err := s.memberRepo.ListByWorkspaceID(ctx, id)
	if err != nil {
		return nil, err
	}
	apps, err := s.appRepo.ListByWorkspaceID(ctx, id)
	if err != nil {
		return nil, err
	}
	workflows, err := s.workflowRepo.ListByWorkspaceID(ctx, id)
	if err != nil {
		return nil, err
	}

	return &WorkspaceDataExport{
		Version:    "1.0.0",
		ExportedAt: time.Now().Format(time.RFC3339),
		Workspace:  access.Workspace,
		Members:    members,
		Apps:       apps,
		Workflows:  workflows,
	}, nil
}

func (s *workspaceService) Delete(ctx context.Context, id uuid.UUID, ownerID uuid.UUID) (*WorkspaceDeletionResult, error) {
	access, err := s.authorizeWorkspace(ctx, id, ownerID, PermissionWorkspaceAdmin)
	if err != nil {
		return nil, err
	}

	workspace := access.Workspace
	workspace.Status = "deleted"
	if err := s.workspaceRepo.Update(ctx, workspace); err != nil {
		return nil, err
	}
	if err := s.workspaceRepo.Delete(ctx, workspace.ID); err != nil {
		return nil, err
	}

	deletedAt := time.Now()
	restoreUntil := s.restoreDeadline(deletedAt)
	purgeAfter := s.purgeDeadline(deletedAt)

	return &WorkspaceDeletionResult{
		WorkspaceID:  workspace.ID,
		Stage:        "soft_deleted",
		DeletedAt:    &deletedAt,
		RestoreUntil: restoreUntil,
		PurgeAfter:   purgeAfter,
	}, nil
}

func (s *workspaceService) Restore(ctx context.Context, id uuid.UUID, ownerID uuid.UUID) (*WorkspaceDeletionResult, error) {
	workspace, err := s.workspaceRepo.GetByIDUnscoped(ctx, id)
	if err != nil {
		return nil, ErrWorkspaceNotFound
	}
	if workspace.OwnerUserID != ownerID {
		return nil, ErrWorkspaceUnauthorized
	}
	if !workspace.DeletedAt.Valid {
		return nil, ErrWorkspaceNotDeleted
	}

	deletedAt := workspace.DeletedAt.Time
	if deadline := s.restoreDeadline(deletedAt); deadline != nil && time.Now().After(*deadline) {
		return nil, ErrWorkspaceRestoreExpired
	}

	if err := s.workspaceRepo.Restore(ctx, workspace.ID); err != nil {
		return nil, err
	}

	return &WorkspaceDeletionResult{
		WorkspaceID: workspace.ID,
		Stage:       "restored",
		DeletedAt:   &deletedAt,
	}, nil
}

func (s *workspaceService) ListMembers(ctx context.Context, workspaceID uuid.UUID, ownerID uuid.UUID) ([]entity.WorkspaceMember, error) {
	if _, err := s.authorizeWorkspace(ctx, workspaceID, ownerID, PermissionMembersManage); err != nil {
		return nil, err
	}

	return s.memberRepo.ListByWorkspaceID(ctx, workspaceID)
}

func (s *workspaceService) AddMember(ctx context.Context, workspaceID uuid.UUID, ownerID uuid.UUID, userID uuid.UUID, roleID *uuid.UUID) (*entity.WorkspaceMember, error) {
	access, err := s.authorizeWorkspace(ctx, workspaceID, ownerID, PermissionMembersManage)
	if err != nil {
		return nil, err
	}
	workspace := access.Workspace

	if _, err := s.userRepo.GetByID(ctx, userID); err != nil {
		return nil, ErrWorkspaceUserNotFound
	}

	roles, err := s.ensureDefaultRoles(ctx, workspaceID)
	if err != nil {
		return nil, err
	}
	if ownerRole, ok := roles["owner"]; ok {
		if err := s.ensureOwnerMembership(ctx, workspaceID, workspace.OwnerUserID, ownerRole.ID); err != nil {
			return nil, err
		}
	}

	if existing, err := s.memberRepo.GetByWorkspaceAndUser(ctx, workspaceID, userID); err == nil && existing != nil {
		return nil, ErrWorkspaceMemberExists
	} else if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	selectedRoleID := uuid.Nil
	if roleID != nil {
		role, err := s.roleRepo.GetByID(ctx, *roleID)
		if err != nil || role.WorkspaceID != workspaceID {
			return nil, ErrWorkspaceRoleNotFound
		}
		selectedRoleID = role.ID
	} else if memberRole, ok := roles["member"]; ok {
		selectedRoleID = memberRole.ID
	} else {
		return nil, ErrWorkspaceRoleNotFound
	}

	now := time.Now()
	member := &entity.WorkspaceMember{
		WorkspaceID: workspaceID,
		UserID:      userID,
		RoleID:      &selectedRoleID,
		Status:      "active",
		InvitedBy:   &ownerID,
		JoinedAt:    &now,
	}

	if err := s.memberRepo.Create(ctx, member); err != nil {
		return nil, err
	}

	return member, nil
}

func (s *workspaceService) UpdateMemberRole(ctx context.Context, workspaceID uuid.UUID, ownerID uuid.UUID, memberID uuid.UUID, roleID uuid.UUID) (*entity.WorkspaceMember, error) {
	access, err := s.authorizeWorkspace(ctx, workspaceID, ownerID, PermissionMembersManage)
	if err != nil {
		return nil, err
	}
	workspace := access.Workspace

	member, err := s.memberRepo.GetByID(ctx, memberID)
	if err != nil || member.WorkspaceID != workspaceID {
		return nil, ErrWorkspaceMemberNotFound
	}
	if member.UserID == workspace.OwnerUserID {
		return nil, ErrWorkspaceOwnerRoleLocked
	}

	role, err := s.roleRepo.GetByID(ctx, roleID)
	if err != nil || role.WorkspaceID != workspaceID {
		return nil, ErrWorkspaceRoleNotFound
	}

	member.RoleID = &role.ID
	if err := s.memberRepo.Update(ctx, member); err != nil {
		return nil, err
	}

	return member, nil
}

type defaultWorkspaceRole struct {
	name        string
	permissions entity.JSON
}

func (s *workspaceService) ensureDefaultRoles(ctx context.Context, workspaceID uuid.UUID) (map[string]*entity.WorkspaceRole, error) {
	defaults := []defaultWorkspaceRole{
		{
			name:        "owner",
			permissions: defaultWorkspaceRolePermissions["owner"],
		},
		{
			name:        "admin",
			permissions: defaultWorkspaceRolePermissions["admin"],
		},
		{
			name:        "member",
			permissions: defaultWorkspaceRolePermissions["member"],
		},
	}

	roles := make(map[string]*entity.WorkspaceRole, len(defaults))
	for _, def := range defaults {
		role, err := s.roleRepo.GetByWorkspaceAndName(ctx, workspaceID, def.name)
		if err != nil {
			if !errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, err
			}
			role = &entity.WorkspaceRole{
				WorkspaceID: workspaceID,
				Name:        def.name,
				Permissions: def.permissions,
				IsSystem:    true,
			}
			if err := s.roleRepo.Create(ctx, role); err != nil {
				return nil, err
			}
		} else {
			merged, changed := mergePermissions(role.Permissions, def.permissions)
			if changed {
				role.Permissions = merged
				if err := s.roleRepo.Update(ctx, role); err != nil {
					return nil, err
				}
			}
		}
		roles[def.name] = role
	}

	return roles, nil
}

func (s *workspaceService) ensureOwnerMembership(ctx context.Context, workspaceID uuid.UUID, ownerID uuid.UUID, ownerRoleID uuid.UUID) error {
	existing, err := s.memberRepo.GetByWorkspaceAndUser(ctx, workspaceID, ownerID)
	if err == nil && existing != nil {
		return nil
	}
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}

	now := time.Now()
	member := &entity.WorkspaceMember{
		WorkspaceID: workspaceID,
		UserID:      ownerID,
		RoleID:      &ownerRoleID,
		Status:      "active",
		JoinedAt:    &now,
	}
	return s.memberRepo.Create(ctx, member)
}

func (s *workspaceService) ensureUniqueSlug(ctx context.Context, baseSlug string) (string, error) {
	slug := baseSlug
	for i := 0; i < 5; i++ {
		exists, err := s.workspaceRepo.ExistsBySlug(ctx, slug)
		if err != nil {
			return "", err
		}
		if !exists {
			return slug, nil
		}
		slug = fmt.Sprintf("%s-%s", baseSlug, uuid.New().String()[:8])
	}
	return "", errors.New("unable to generate unique workspace slug")
}

func (s *workspaceService) GetWorkspaceAccess(ctx context.Context, workspaceID uuid.UUID, userID uuid.UUID) (*WorkspaceAccess, error) {
	workspace, err := s.workspaceRepo.GetByID(ctx, workspaceID)
	if err != nil {
		return nil, ErrWorkspaceNotFound
	}
	if strings.EqualFold(strings.TrimSpace(workspace.Status), "suspended") {
		return nil, ErrWorkspaceUnauthorized
	}

	roles, err := s.ensureDefaultRoles(ctx, workspaceID)
	if err != nil {
		return nil, err
	}

	if workspace.OwnerUserID == userID {
		ownerRole := roles["owner"]
		permissions := entity.JSON{}
		if ownerRole != nil {
			if err := s.ensureOwnerMembership(ctx, workspaceID, workspace.OwnerUserID, ownerRole.ID); err != nil {
				return nil, err
			}
			permissions = ownerRole.Permissions
		}
		return &WorkspaceAccess{
			Workspace:   workspace,
			Role:        ownerRole,
			Permissions: permissions,
			IsOwner:     true,
		}, nil
	}

	member, err := s.memberRepo.GetByWorkspaceAndUser(ctx, workspaceID, userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrWorkspaceUnauthorized
		}
		return nil, err
	}

	if member.Role == nil {
		if fallback, ok := roles["member"]; ok {
			return &WorkspaceAccess{
				Workspace:   workspace,
				Role:        fallback,
				Permissions: fallback.Permissions,
				IsOwner:     false,
			}, nil
		}
		return nil, ErrWorkspaceRoleNotFound
	}

	return &WorkspaceAccess{
		Workspace:   workspace,
		Role:        member.Role,
		Permissions: member.Role.Permissions,
		IsOwner:     false,
	}, nil
}

func (s *workspaceService) authorizeWorkspace(ctx context.Context, workspaceID uuid.UUID, userID uuid.UUID, permission string) (*WorkspaceAccess, error) {
	access, err := s.GetWorkspaceAccess(ctx, workspaceID, userID)
	if err != nil {
		return nil, err
	}
	if permission != "" && !hasPermission(access.Permissions, permission) {
		return nil, ErrWorkspaceUnauthorized
	}
	return access, nil
}

func mergePermissions(current entity.JSON, defaults entity.JSON) (entity.JSON, bool) {
	changed := false
	if current == nil {
		current = entity.JSON{}
	}
	for key, value := range defaults {
		if _, ok := current[key]; !ok {
			current[key] = value
			changed = true
		}
	}
	return current, changed
}

func (s *workspaceService) ensureSlugAlias(ctx context.Context, workspaceID uuid.UUID, slug string) {
	if s.slugAliasRepo == nil {
		return
	}
	trimmed := strings.TrimSpace(slug)
	if trimmed == "" {
		return
	}
	exists, err := s.workspaceRepo.ExistsBySlug(ctx, trimmed)
	if err == nil && exists {
		return
	}
	alias, err := s.slugAliasRepo.GetBySlug(ctx, trimmed)
	if err == nil && alias != nil {
		return
	}
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return
	}
	_ = s.slugAliasRepo.Create(ctx, &entity.WorkspaceSlugAlias{
		WorkspaceID: workspaceID,
		Slug:        trimmed,
	})
}

// generateSlug 生成 URL 友好的 slug
func (s *workspaceService) generateSlug(name string) string {
	slug := strings.ToLower(name)
	slug = strings.ReplaceAll(slug, " ", "-")
	reg := regexp.MustCompile("[^a-z0-9-]")
	slug = reg.ReplaceAllString(slug, "")
	reg = regexp.MustCompile("-+")
	slug = reg.ReplaceAllString(slug, "-")
	slug = strings.Trim(slug, "-")
	return slug
}

func (s *workspaceService) restoreDeadline(deletedAt time.Time) *time.Time {
	graceDays := s.retentionCfg.WorkspaceDeletionGraceDays
	if graceDays <= 0 {
		graceDays = 7
	}
	deadline := deletedAt.AddDate(0, 0, graceDays)
	return &deadline
}

func (s *workspaceService) purgeDeadline(deletedAt time.Time) *time.Time {
	graceDays := s.retentionCfg.WorkspaceDeletionGraceDays
	if graceDays <= 0 {
		graceDays = 7
	}
	coldDays := s.retentionCfg.WorkspaceColdStorageDays
	if coldDays <= 0 {
		coldDays = 30
	}
	deadline := deletedAt.AddDate(0, 0, graceDays+coldDays)
	return &deadline
}

var (
	ErrWorkspaceNotFound          = errors.New("workspace not found")
	ErrWorkspaceUnauthorized      = errors.New("unauthorized to access this workspace")
	ErrWorkspaceSlugExists        = errors.New("workspace slug already exists")
	ErrWorkspaceInvalidName       = errors.New("workspace name is invalid")
	ErrWorkspaceInvalidSlug       = errors.New("workspace slug is invalid")
	ErrWorkspaceInvalidIcon       = errors.New("workspace icon is invalid")
	ErrWorkspaceInvalidPlan       = errors.New("workspace plan is invalid")
	ErrWorkspaceRoleNotFound      = errors.New("workspace role not found")
	ErrWorkspaceMemberNotFound    = errors.New("workspace member not found")
	ErrWorkspaceMemberExists      = errors.New("workspace member already exists")
	ErrWorkspaceUserNotFound      = errors.New("workspace user not found")
	ErrWorkspaceOwnerRoleLocked   = errors.New("workspace owner role locked")
	ErrWorkspaceExportUnavailable = errors.New("workspace export unavailable")
	ErrWorkspaceNotDeleted        = errors.New("workspace is not deleted")
	ErrWorkspaceRestoreExpired    = errors.New("workspace restore window expired")
)
