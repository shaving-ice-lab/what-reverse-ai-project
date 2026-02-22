package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"regexp"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/reverseai/server/internal/config"
	"github.com/reverseai/server/internal/domain/entity"
	"github.com/reverseai/server/internal/repository"
	"gorm.io/gorm"
)

var (
	slugNonAlphanumRe = regexp.MustCompile("[^a-z0-9-]")
	slugMultiDashRe   = regexp.MustCompile("-+")
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
	Delete(ctx context.Context, id uuid.UUID, ownerID uuid.UUID) (*WorkspaceDeletionResult, error)
	Restore(ctx context.Context, id uuid.UUID, ownerID uuid.UUID) (*WorkspaceDeletionResult, error)
	ListMembers(ctx context.Context, workspaceID uuid.UUID, ownerID uuid.UUID) ([]entity.WorkspaceMember, error)
	AddMember(ctx context.Context, workspaceID uuid.UUID, ownerID uuid.UUID, userID uuid.UUID, roleID *uuid.UUID) (*entity.WorkspaceMember, error)
	UpdateMemberRole(ctx context.Context, workspaceID uuid.UUID, ownerID uuid.UUID, memberID uuid.UUID, roleID uuid.UUID) (*entity.WorkspaceMember, error)
	RemoveMember(ctx context.Context, workspaceID uuid.UUID, ownerID uuid.UUID, memberID uuid.UUID) error
	GetWorkspaceAccess(ctx context.Context, workspaceID uuid.UUID, userID uuid.UUID) (*WorkspaceAccess, error)
	ListRoles(ctx context.Context, workspaceID uuid.UUID, userID uuid.UUID) ([]entity.WorkspaceRole, error)
	GetRoleByName(ctx context.Context, workspaceID uuid.UUID, name string) (*entity.WorkspaceRole, error)
	GetUserByEmail(ctx context.Context, email string) (*entity.User, error)

	// App 功能（Workspace = App）
	Publish(ctx context.Context, id uuid.UUID, ownerID uuid.UUID) (*entity.Workspace, error)
	Rollback(ctx context.Context, id uuid.UUID, ownerID uuid.UUID, versionID uuid.UUID) (*entity.Workspace, error)
	Deprecate(ctx context.Context, id uuid.UUID, ownerID uuid.UUID) (*entity.Workspace, error)
	Archive(ctx context.Context, id uuid.UUID, ownerID uuid.UUID) (*entity.Workspace, error)
	CreateVersion(ctx context.Context, id uuid.UUID, ownerID uuid.UUID, req WorkspaceCreateVersionRequest) (*entity.WorkspaceVersion, error)
	ListVersions(ctx context.Context, id uuid.UUID, ownerID uuid.UUID, page, pageSize int) ([]entity.WorkspaceVersion, int64, error)
	CompareVersions(ctx context.Context, id uuid.UUID, fromID uuid.UUID, toID uuid.UUID) (map[string]interface{}, error)
	GetAccessPolicy(ctx context.Context, id uuid.UUID, ownerID uuid.UUID) (*AccessPolicyResponse, error)
	UpdateAccessPolicy(ctx context.Context, id uuid.UUID, ownerID uuid.UUID, req UpdateAccessPolicyRequest) (*AccessPolicyResponse, error)
	UpdateUISchema(ctx context.Context, id uuid.UUID, ownerID uuid.UUID, uiSchema map[string]interface{}) (*entity.WorkspaceVersion, error)

	// VM Runtime Logic Code
	UpdateLogicCode(ctx context.Context, id uuid.UUID, ownerID uuid.UUID, code string) (*entity.WorkspaceVersion, error)
	GetLogicCode(ctx context.Context, id uuid.UUID, ownerID uuid.UUID) (string, error)

	// Frontend Component Code
	UpdateComponentCode(ctx context.Context, id uuid.UUID, ownerID uuid.UUID, code string) (*entity.WorkspaceVersion, error)
	GetComponentCode(ctx context.Context, id uuid.UUID, ownerID uuid.UUID) (string, error)

	// Multi-component storage (components_json: map[component_id] -> ComponentEntry)
	DeployComponent(ctx context.Context, id uuid.UUID, ownerID uuid.UUID, componentID, name, code string) (*entity.WorkspaceVersion, string, error)
	ListComponents(ctx context.Context, id uuid.UUID, ownerID uuid.UUID) (map[string]ComponentEntry, error)
	GetComponent(ctx context.Context, id uuid.UUID, ownerID uuid.UUID, componentID string) (*ComponentEntry, error)

	// Settings
	UpdateSettings(ctx context.Context, id uuid.UUID, ownerID uuid.UUID, settings entity.JSON) error

	// Marketplace
	ListPublic(ctx context.Context, page, pageSize int) ([]entity.Workspace, int64, error)
	GetPublic(ctx context.Context, id uuid.UUID) (*entity.Workspace, error)
	ListRatings(ctx context.Context, workspaceID uuid.UUID, page, pageSize int) ([]entity.WorkspaceRating, int64, error)
}

// ComponentEntry represents a single component in multi-component storage
type ComponentEntry struct {
	Name      string `json:"name"`
	Code      string `json:"code"`
	CreatedAt string `json:"created_at"`
}

type workspaceService struct {
	db            *gorm.DB
	workspaceRepo repository.WorkspaceRepository
	slugAliasRepo repository.WorkspaceSlugAliasRepository
	userRepo      repository.UserRepository
	roleRepo      repository.WorkspaceRoleRepository
	memberRepo    repository.WorkspaceMemberRepository
	eventRecorder EventRecorderService
	retentionCfg  config.RetentionConfig
}

// NewWorkspaceService 创建工作空间服务实例
func NewWorkspaceService(
	db *gorm.DB,
	workspaceRepo repository.WorkspaceRepository,
	slugAliasRepo repository.WorkspaceSlugAliasRepository,
	userRepo repository.UserRepository,
	roleRepo repository.WorkspaceRoleRepository,
	memberRepo repository.WorkspaceMemberRepository,
	eventRecorder EventRecorderService,
	retentionCfg config.RetentionConfig,
) WorkspaceService {
	return &workspaceService{
		db:            db,
		workspaceRepo: workspaceRepo,
		slugAliasRepo: slugAliasRepo,
		userRepo:      userRepo,
		roleRepo:      roleRepo,
		memberRepo:    memberRepo,
		eventRecorder: eventRecorder,
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

	txErr := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		txWorkspaceRepo := repository.NewWorkspaceRepository(tx)
		txRoleRepo := repository.NewWorkspaceRoleRepository(tx)
		txMemberRepo := repository.NewWorkspaceMemberRepository(tx)

		if err := txWorkspaceRepo.Create(ctx, workspace); err != nil {
			return err
		}

		roles, err := s.ensureDefaultRolesWithRepo(ctx, workspace.ID, txRoleRepo)
		if err != nil {
			return err
		}
		if ownerRole, ok := roles["owner"]; ok {
			if err := s.ensureOwnerMembershipWithRepo(ctx, workspace.ID, user.ID, ownerRole.ID, txMemberRepo); err != nil {
				return err
			}
		}
		return nil
	})
	if txErr != nil {
		return nil, txErr
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
	if name == "" || len(name) > 100 {
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

	txErr := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		txWorkspaceRepo := repository.NewWorkspaceRepository(tx)
		txRoleRepo := repository.NewWorkspaceRoleRepository(tx)
		txMemberRepo := repository.NewWorkspaceMemberRepository(tx)

		if err := txWorkspaceRepo.Create(ctx, workspace); err != nil {
			return err
		}

		roles, err := s.ensureDefaultRolesWithRepo(ctx, workspace.ID, txRoleRepo)
		if err != nil {
			return err
		}
		if ownerRole, ok := roles["owner"]; ok {
			if err := s.ensureOwnerMembershipWithRepo(ctx, workspace.ID, ownerID, ownerRole.ID, txMemberRepo); err != nil {
				return err
			}
		}
		return nil
	})
	if txErr != nil {
		return nil, txErr
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
	if err := s.eventRecorder.Record(ctx, event); err != nil {
		fmt.Fprintf(os.Stderr, "[WARN] failed to record workspace.created event for workspace %s: %v\n", workspace.ID, err)
	}
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

func (s *workspaceService) UpdateSettings(ctx context.Context, id uuid.UUID, ownerID uuid.UUID, settings entity.JSON) error {
	access, err := s.authorizeWorkspace(ctx, id, ownerID, PermissionWorkspaceAdmin)
	if err != nil {
		return err
	}
	workspace := access.Workspace
	workspace.Settings = settings
	return s.workspaceRepo.Update(ctx, workspace)
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

func (s *workspaceService) ListRoles(ctx context.Context, workspaceID uuid.UUID, userID uuid.UUID) ([]entity.WorkspaceRole, error) {
	if _, err := s.authorizeWorkspace(ctx, workspaceID, userID, PermissionMembersManage); err != nil {
		return nil, err
	}
	// Ensure default roles exist before listing
	if _, err := s.ensureDefaultRoles(ctx, workspaceID); err != nil {
		return nil, err
	}
	return s.roleRepo.ListByWorkspaceID(ctx, workspaceID)
}

func (s *workspaceService) GetRoleByName(ctx context.Context, workspaceID uuid.UUID, name string) (*entity.WorkspaceRole, error) {
	return s.roleRepo.GetByWorkspaceAndName(ctx, workspaceID, name)
}

func (s *workspaceService) GetUserByEmail(ctx context.Context, email string) (*entity.User, error) {
	return s.userRepo.GetByEmail(ctx, email)
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

func (s *workspaceService) RemoveMember(ctx context.Context, workspaceID uuid.UUID, ownerID uuid.UUID, memberID uuid.UUID) error {
	access, err := s.authorizeWorkspace(ctx, workspaceID, ownerID, PermissionMembersManage)
	if err != nil {
		return err
	}
	workspace := access.Workspace

	member, err := s.memberRepo.GetByID(ctx, memberID)
	if err != nil || member.WorkspaceID != workspaceID {
		return ErrWorkspaceMemberNotFound
	}
	if member.UserID == workspace.OwnerUserID {
		return ErrWorkspaceOwnerRoleLocked
	}

	return s.memberRepo.Delete(ctx, memberID)
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
	return s.ensureDefaultRolesWithRepo(ctx, workspaceID, s.roleRepo)
}

func (s *workspaceService) ensureDefaultRolesWithRepo(ctx context.Context, workspaceID uuid.UUID, roleRepo repository.WorkspaceRoleRepository) (map[string]*entity.WorkspaceRole, error) {
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
		role, err := roleRepo.GetByWorkspaceAndName(ctx, workspaceID, def.name)
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
			if err := roleRepo.Create(ctx, role); err != nil {
				return nil, err
			}
		} else {
			merged, changed := mergePermissions(role.Permissions, def.permissions)
			if changed {
				role.Permissions = merged
				if err := roleRepo.Update(ctx, role); err != nil {
					return nil, err
				}
			}
		}
		roles[def.name] = role
	}

	return roles, nil
}

func (s *workspaceService) ensureOwnerMembership(ctx context.Context, workspaceID uuid.UUID, ownerID uuid.UUID, ownerRoleID uuid.UUID) error {
	return s.ensureOwnerMembershipWithRepo(ctx, workspaceID, ownerID, ownerRoleID, s.memberRepo)
}

func (s *workspaceService) ensureOwnerMembershipWithRepo(ctx context.Context, workspaceID uuid.UUID, ownerID uuid.UUID, ownerRoleID uuid.UUID, memberRepo repository.WorkspaceMemberRepository) error {
	existing, err := memberRepo.GetByWorkspaceAndUser(ctx, workspaceID, ownerID)
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
	return memberRepo.Create(ctx, member)
}

func (s *workspaceService) ensureUniqueSlug(ctx context.Context, baseSlug string) (string, error) {
	slug := baseSlug
	for i := 0; i < 10; i++ {
		exists, err := s.workspaceRepo.ExistsBySlug(ctx, slug)
		if err != nil {
			return "", err
		}
		if !exists {
			return slug, nil
		}
		slug = fmt.Sprintf("%s-%s", baseSlug, uuid.New().String()[:8])
	}
	return "", ErrWorkspaceSlugExists
}

func (s *workspaceService) GetWorkspaceAccess(ctx context.Context, workspaceID uuid.UUID, userID uuid.UUID) (*WorkspaceAccess, error) {
	workspace, err := s.workspaceRepo.GetByIDWithVersion(ctx, workspaceID)
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
			// Non-member accessing a published public workspace gets read-only visitor access
			am := strings.TrimSpace(workspace.AccessMode)
			if workspace.AppStatus == "published" && (am == "public_anonymous" || am == "public_auth") {
				return &WorkspaceAccess{
					Workspace:   workspace,
					Role:        nil,
					Permissions: entity.JSON{"read": true},
					IsOwner:     false,
				}, nil
			}
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
	slug = slugNonAlphanumRe.ReplaceAllString(slug, "")
	slug = slugMultiDashRe.ReplaceAllString(slug, "-")
	slug = strings.Trim(slug, "-")
	// Non-ASCII names (e.g. pure Chinese) produce an empty slug — fall back to timestamp
	if slug == "" {
		slug = fmt.Sprintf("ws-%d", time.Now().UnixMilli())
	}
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

// ===== Workspace 版本管理请求/响应类型 =====

type WorkspaceCreateVersionRequest struct {
	Version    string                 `json:"version"`
	Changelog  *string                `json:"changelog"`
	UISchema   map[string]interface{} `json:"ui_schema"`
	DBSchema   map[string]interface{} `json:"db_schema"`
	ConfigJSON map[string]interface{} `json:"config_json"`
}

type AccessPolicyResponse struct {
	AccessMode         string                 `json:"access_mode"`
	DataClassification string                 `json:"data_classification"`
	RateLimitJSON      map[string]interface{} `json:"rate_limit_json"`
	AllowedOrigins     []string               `json:"allowed_origins"`
	RequireCaptcha     bool                   `json:"require_captcha"`
}

type UpdateAccessPolicyRequest struct {
	AccessMode         *string                `json:"access_mode"`
	DataClassification *string                `json:"data_classification"`
	RateLimitJSON      map[string]interface{} `json:"rate_limit_json"`
	AllowedOrigins     []string               `json:"allowed_origins"`
	RequireCaptcha     *bool                  `json:"require_captcha"`
}

// ===== App 功能实现 =====

func (s *workspaceService) Publish(ctx context.Context, id uuid.UUID, ownerID uuid.UUID) (*entity.Workspace, error) {
	ws, err := s.getAuthorizedWorkspace(ctx, id, ownerID)
	if err != nil {
		return nil, err
	}
	if ws.AppStatus == "published" {
		return ws, nil
	}
	now := time.Now()
	ws.AppStatus = "published"
	ws.PublishedAt = &now
	if am := strings.TrimSpace(ws.AccessMode); am == "" || am == "private" {
		ws.AccessMode = "public_anonymous"
	}
	if err := s.workspaceRepo.Update(ctx, ws); err != nil {
		return nil, fmt.Errorf("failed to publish workspace: %w", err)
	}
	return ws, nil
}

func (s *workspaceService) Rollback(ctx context.Context, id uuid.UUID, ownerID uuid.UUID, versionID uuid.UUID) (*entity.Workspace, error) {
	ws, err := s.getAuthorizedWorkspace(ctx, id, ownerID)
	if err != nil {
		return nil, err
	}
	version, err := s.workspaceRepo.GetVersionByID(ctx, versionID)
	if err != nil {
		return nil, fmt.Errorf("version not found: %w", err)
	}
	if version.WorkspaceID != ws.ID {
		return nil, errors.New("version does not belong to this workspace")
	}
	ws.CurrentVersionID = &version.ID
	if err := s.workspaceRepo.Update(ctx, ws); err != nil {
		return nil, fmt.Errorf("failed to rollback workspace: %w", err)
	}
	return ws, nil
}

func (s *workspaceService) Deprecate(ctx context.Context, id uuid.UUID, ownerID uuid.UUID) (*entity.Workspace, error) {
	ws, err := s.getAuthorizedWorkspace(ctx, id, ownerID)
	if err != nil {
		return nil, err
	}
	ws.AppStatus = "deprecated"
	if err := s.workspaceRepo.Update(ctx, ws); err != nil {
		return nil, fmt.Errorf("failed to deprecate workspace: %w", err)
	}
	return ws, nil
}

func (s *workspaceService) Archive(ctx context.Context, id uuid.UUID, ownerID uuid.UUID) (*entity.Workspace, error) {
	ws, err := s.getAuthorizedWorkspace(ctx, id, ownerID)
	if err != nil {
		return nil, err
	}
	ws.AppStatus = "archived"
	if err := s.workspaceRepo.Update(ctx, ws); err != nil {
		return nil, fmt.Errorf("failed to archive workspace: %w", err)
	}
	return ws, nil
}

func (s *workspaceService) CreateVersion(ctx context.Context, id uuid.UUID, ownerID uuid.UUID, req WorkspaceCreateVersionRequest) (*entity.WorkspaceVersion, error) {
	ws, err := s.getAuthorizedWorkspace(ctx, id, ownerID)
	if err != nil {
		return nil, err
	}

	// Load previous version to carry forward fields not provided in the request
	var prevVersion *entity.WorkspaceVersion
	if ws.CurrentVersionID != nil {
		prevVersion, _ = s.workspaceRepo.GetVersionByID(ctx, *ws.CurrentVersionID)
	}

	// Auto-generate version string if not provided
	versionStr := req.Version
	if versionStr == "" {
		versionStr = fmt.Sprintf("v0.0.%d", time.Now().UnixMilli())
	}

	version := &entity.WorkspaceVersion{
		ID:          uuid.New(),
		WorkspaceID: ws.ID,
		Version:     versionStr,
		Changelog:   req.Changelog,
		CreatedBy:   &ownerID,
		CreatedAt:   time.Now(),
	}
	if req.UISchema != nil {
		version.UISchema = entity.JSON(req.UISchema)
	} else if prevVersion != nil && prevVersion.UISchema != nil {
		version.UISchema = prevVersion.UISchema
	}
	if req.DBSchema != nil {
		version.DBSchema = entity.JSON(req.DBSchema)
	} else if prevVersion != nil && prevVersion.DBSchema != nil {
		version.DBSchema = prevVersion.DBSchema
	}
	if req.ConfigJSON != nil {
		version.ConfigJSON = entity.JSON(req.ConfigJSON)
	} else if prevVersion != nil && prevVersion.ConfigJSON != nil {
		version.ConfigJSON = prevVersion.ConfigJSON
	}
	if err := s.workspaceRepo.CreateVersion(ctx, version); err != nil {
		return nil, fmt.Errorf("failed to create version: %w", err)
	}
	// 设置为当前版本
	ws.CurrentVersionID = &version.ID
	if err := s.workspaceRepo.Update(ctx, ws); err != nil {
		return nil, fmt.Errorf("failed to update current version: %w", err)
	}
	return version, nil
}

func (s *workspaceService) ListVersions(ctx context.Context, id uuid.UUID, ownerID uuid.UUID, page, pageSize int) ([]entity.WorkspaceVersion, int64, error) {
	_, err := s.getAuthorizedWorkspace(ctx, id, ownerID)
	if err != nil {
		return nil, 0, err
	}
	return s.workspaceRepo.ListVersions(ctx, id, repository.WorkspaceVersionListParams{
		Page:     page,
		PageSize: pageSize,
	})
}

func (s *workspaceService) CompareVersions(ctx context.Context, id uuid.UUID, fromID uuid.UUID, toID uuid.UUID) (map[string]interface{}, error) {
	fromVer, err := s.workspaceRepo.GetVersionByID(ctx, fromID)
	if err != nil {
		return nil, fmt.Errorf("from version not found: %w", err)
	}
	toVer, err := s.workspaceRepo.GetVersionByID(ctx, toID)
	if err != nil {
		return nil, fmt.Errorf("to version not found: %w", err)
	}
	if fromVer.WorkspaceID != id || toVer.WorkspaceID != id {
		return nil, errors.New("version does not belong to this workspace")
	}

	changes := make(map[string]interface{})

	// Compare changelog
	fromChangelog := ""
	toChangelog := ""
	if fromVer.Changelog != nil {
		fromChangelog = *fromVer.Changelog
	}
	if toVer.Changelog != nil {
		toChangelog = *toVer.Changelog
	}
	if fromChangelog != toChangelog {
		changes["changelog"] = map[string]interface{}{"from": fromChangelog, "to": toChangelog}
	}

	// Compare JSON fields (entity.JSON = map[string]interface{})
	compareJSONField := func(fieldName string, fromVal, toVal map[string]interface{}) {
		fromBytes, _ := json.Marshal(fromVal)
		toBytes, _ := json.Marshal(toVal)
		fromStr := string(fromBytes)
		toStr := string(toBytes)
		if fromStr == "null" {
			fromStr = "{}"
		}
		if toStr == "null" {
			toStr = "{}"
		}
		if fromStr != toStr {
			changes[fieldName] = map[string]interface{}{"from": fromVal, "to": toVal}
		}
	}

	compareJSONField("ui_schema", fromVer.UISchema, toVer.UISchema)
	compareJSONField("db_schema", fromVer.DBSchema, toVer.DBSchema)
	compareJSONField("config_json", fromVer.ConfigJSON, toVer.ConfigJSON)

	diff := map[string]interface{}{
		"from_version": fromVer.Version,
		"to_version":   toVer.Version,
		"from_id":      fromVer.ID.String(),
		"to_id":        toVer.ID.String(),
		"changes":      changes,
	}
	return diff, nil
}

func (s *workspaceService) GetAccessPolicy(ctx context.Context, id uuid.UUID, ownerID uuid.UUID) (*AccessPolicyResponse, error) {
	ws, err := s.getAuthorizedWorkspace(ctx, id, ownerID)
	if err != nil {
		return nil, err
	}
	return &AccessPolicyResponse{
		AccessMode:         ws.AccessMode,
		DataClassification: ws.DataClassification,
		RateLimitJSON:      ws.RateLimitJSON,
		AllowedOrigins:     ws.AllowedOrigins,
		RequireCaptcha:     ws.RequireCaptcha,
	}, nil
}

func (s *workspaceService) UpdateAccessPolicy(ctx context.Context, id uuid.UUID, ownerID uuid.UUID, req UpdateAccessPolicyRequest) (*AccessPolicyResponse, error) {
	ws, err := s.getAuthorizedWorkspace(ctx, id, ownerID)
	if err != nil {
		return nil, err
	}
	if req.AccessMode != nil {
		ws.AccessMode = *req.AccessMode
	}
	if req.DataClassification != nil {
		ws.DataClassification = *req.DataClassification
	}
	if req.RateLimitJSON != nil {
		ws.RateLimitJSON = req.RateLimitJSON
	}
	if req.AllowedOrigins != nil {
		ws.AllowedOrigins = req.AllowedOrigins
	}
	if req.RequireCaptcha != nil {
		ws.RequireCaptcha = *req.RequireCaptcha
	}
	if err := s.workspaceRepo.Update(ctx, ws); err != nil {
		return nil, fmt.Errorf("failed to update access policy: %w", err)
	}
	return &AccessPolicyResponse{
		AccessMode:         ws.AccessMode,
		DataClassification: ws.DataClassification,
		RateLimitJSON:      ws.RateLimitJSON,
		AllowedOrigins:     ws.AllowedOrigins,
		RequireCaptcha:     ws.RequireCaptcha,
	}, nil
}

func (s *workspaceService) UpdateUISchema(ctx context.Context, id uuid.UUID, ownerID uuid.UUID, uiSchema map[string]interface{}) (*entity.WorkspaceVersion, error) {
	ws, err := s.getAuthorizedWorkspace(ctx, id, ownerID)
	if err != nil {
		return nil, err
	}
	if ws.CurrentVersionID == nil {
		// Auto-create initial version for workspaces that have never had one
		initVersion := &entity.WorkspaceVersion{
			ID:          uuid.New(),
			WorkspaceID: ws.ID,
			Version:     fmt.Sprintf("v0.0.%d", time.Now().UnixMilli()),
			UISchema:    entity.JSON(uiSchema),
			CreatedBy:   &ownerID,
			CreatedAt:   time.Now(),
		}
		if err := s.workspaceRepo.CreateVersion(ctx, initVersion); err != nil {
			return nil, fmt.Errorf("failed to create initial version: %w", err)
		}
		ws.CurrentVersionID = &initVersion.ID
		if err := s.workspaceRepo.Update(ctx, ws); err != nil {
			return nil, fmt.Errorf("failed to set current version: %w", err)
		}
		return initVersion, nil
	}
	version, err := s.workspaceRepo.GetVersionByID(ctx, *ws.CurrentVersionID)
	if err != nil {
		return nil, fmt.Errorf("current version not found: %w", err)
	}
	version.UISchema = entity.JSON(uiSchema)
	if err := s.workspaceRepo.UpdateVersion(ctx, version); err != nil {
		return nil, fmt.Errorf("failed to update UI schema: %w", err)
	}
	return version, nil
}

func (s *workspaceService) UpdateLogicCode(ctx context.Context, id uuid.UUID, ownerID uuid.UUID, code string) (*entity.WorkspaceVersion, error) {
	ws, err := s.getAuthorizedWorkspace(ctx, id, ownerID)
	if err != nil {
		return nil, err
	}
	if ws.CurrentVersionID == nil {
		initVersion := &entity.WorkspaceVersion{
			ID:          uuid.New(),
			WorkspaceID: ws.ID,
			Version:     fmt.Sprintf("v0.0.%d", time.Now().UnixMilli()),
			LogicCode:   &code,
			CreatedBy:   &ownerID,
			CreatedAt:   time.Now(),
		}
		if err := s.workspaceRepo.CreateVersion(ctx, initVersion); err != nil {
			return nil, fmt.Errorf("failed to create initial version: %w", err)
		}
		ws.CurrentVersionID = &initVersion.ID
		if err := s.workspaceRepo.Update(ctx, ws); err != nil {
			return nil, fmt.Errorf("failed to set current version: %w", err)
		}
		return initVersion, nil
	}
	version, err := s.workspaceRepo.GetVersionByID(ctx, *ws.CurrentVersionID)
	if err != nil {
		return nil, fmt.Errorf("current version not found: %w", err)
	}
	version.LogicCode = &code
	if err := s.workspaceRepo.UpdateVersion(ctx, version); err != nil {
		return nil, fmt.Errorf("failed to update logic code: %w", err)
	}
	return version, nil
}

func (s *workspaceService) GetLogicCode(ctx context.Context, id uuid.UUID, ownerID uuid.UUID) (string, error) {
	ws, err := s.getAuthorizedWorkspace(ctx, id, ownerID)
	if err != nil {
		return "", err
	}
	if ws.CurrentVersionID == nil {
		return "", nil
	}
	version, err := s.workspaceRepo.GetVersionByID(ctx, *ws.CurrentVersionID)
	if err != nil {
		return "", fmt.Errorf("current version not found: %w", err)
	}
	if version.LogicCode == nil {
		return "", nil
	}
	return *version.LogicCode, nil
}

func (s *workspaceService) UpdateComponentCode(ctx context.Context, id uuid.UUID, ownerID uuid.UUID, code string) (*entity.WorkspaceVersion, error) {
	ws, err := s.getAuthorizedWorkspace(ctx, id, ownerID)
	if err != nil {
		return nil, err
	}
	if ws.CurrentVersionID == nil {
		return nil, errors.New("no current version to update")
	}
	version, err := s.workspaceRepo.GetVersionByID(ctx, *ws.CurrentVersionID)
	if err != nil {
		return nil, fmt.Errorf("current version not found: %w", err)
	}
	version.ComponentCode = &code
	if err := s.workspaceRepo.UpdateVersion(ctx, version); err != nil {
		return nil, fmt.Errorf("failed to update component code: %w", err)
	}
	return version, nil
}

func (s *workspaceService) GetComponentCode(ctx context.Context, id uuid.UUID, ownerID uuid.UUID) (string, error) {
	ws, err := s.getAuthorizedWorkspace(ctx, id, ownerID)
	if err != nil {
		return "", err
	}
	if ws.CurrentVersionID == nil {
		return "", nil
	}
	version, err := s.workspaceRepo.GetVersionByID(ctx, *ws.CurrentVersionID)
	if err != nil {
		return "", fmt.Errorf("current version not found: %w", err)
	}
	if version.ComponentCode == nil {
		return "", nil
	}
	return *version.ComponentCode, nil
}

// ---- Multi-component storage ----

func (s *workspaceService) DeployComponent(ctx context.Context, id uuid.UUID, ownerID uuid.UUID, componentID, name, code string) (*entity.WorkspaceVersion, string, error) {
	ws, err := s.getAuthorizedWorkspace(ctx, id, ownerID)
	if err != nil {
		return nil, "", err
	}
	if ws.CurrentVersionID == nil {
		return nil, "", errors.New("no current version to update")
	}
	version, err := s.workspaceRepo.GetVersionByID(ctx, *ws.CurrentVersionID)
	if err != nil {
		return nil, "", fmt.Errorf("current version not found: %w", err)
	}

	// Parse existing components from entity.JSON (map[string]interface{})
	components := parseComponentsJSON(version.ComponentsJSON)

	// Auto-generate component_id if empty
	if componentID == "" {
		componentID = fmt.Sprintf("comp_%s", uuid.New().String()[:8])
	}
	if name == "" {
		name = componentID
	}

	components[componentID] = ComponentEntry{
		Name:      name,
		Code:      code,
		CreatedAt: time.Now().UTC().Format(time.RFC3339),
	}

	version.ComponentsJSON = componentsToJSON(components)

	// Also update legacy ComponentCode for backward compatibility (last deployed code)
	version.ComponentCode = &code

	if err := s.workspaceRepo.UpdateVersion(ctx, version); err != nil {
		return nil, "", fmt.Errorf("failed to update components: %w", err)
	}
	return version, componentID, nil
}

func (s *workspaceService) ListComponents(ctx context.Context, id uuid.UUID, ownerID uuid.UUID) (map[string]ComponentEntry, error) {
	ws, err := s.getAuthorizedWorkspace(ctx, id, ownerID)
	if err != nil {
		return nil, err
	}
	if ws.CurrentVersionID == nil {
		return make(map[string]ComponentEntry), nil
	}
	version, err := s.workspaceRepo.GetVersionByID(ctx, *ws.CurrentVersionID)
	if err != nil {
		return nil, fmt.Errorf("current version not found: %w", err)
	}
	return parseComponentsJSON(version.ComponentsJSON), nil
}

// parseComponentsJSON converts entity.JSON (map[string]interface{}) to typed component map
func parseComponentsJSON(j entity.JSON) map[string]ComponentEntry {
	result := make(map[string]ComponentEntry)
	if len(j) == 0 {
		return result
	}
	// Round-trip through JSON bytes to unmarshal into typed map
	b, err := json.Marshal(j)
	if err != nil {
		return result
	}
	_ = json.Unmarshal(b, &result)
	return result
}

// componentsToJSON converts typed component map to entity.JSON
func componentsToJSON(components map[string]ComponentEntry) entity.JSON {
	b, err := json.Marshal(components)
	if err != nil {
		return make(entity.JSON)
	}
	var result entity.JSON
	_ = json.Unmarshal(b, &result)
	return result
}

func (s *workspaceService) GetComponent(ctx context.Context, id uuid.UUID, ownerID uuid.UUID, componentID string) (*ComponentEntry, error) {
	components, err := s.ListComponents(ctx, id, ownerID)
	if err != nil {
		return nil, err
	}
	entry, ok := components[componentID]
	if !ok {
		return nil, fmt.Errorf("component %q not found", componentID)
	}
	return &entry, nil
}

func (s *workspaceService) ListPublic(ctx context.Context, page, pageSize int) ([]entity.Workspace, int64, error) {
	return s.workspaceRepo.ListPublic(ctx, page, pageSize)
}

func (s *workspaceService) GetPublic(ctx context.Context, id uuid.UUID) (*entity.Workspace, error) {
	ws, err := s.workspaceRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if ws.AppStatus != "published" || ws.AccessMode == "private" {
		return nil, ErrWorkspaceNotFound
	}
	return ws, nil
}

func (s *workspaceService) ListRatings(ctx context.Context, workspaceID uuid.UUID, page, pageSize int) ([]entity.WorkspaceRating, int64, error) {
	return s.workspaceRepo.ListRatings(ctx, workspaceID, repository.RatingListParams{
		Page:     page,
		PageSize: pageSize,
	})
}

// getAuthorizedWorkspace 获取并验证权限
func (s *workspaceService) getAuthorizedWorkspace(ctx context.Context, id uuid.UUID, ownerID uuid.UUID) (*entity.Workspace, error) {
	ws, err := s.workspaceRepo.GetByID(ctx, id)
	if err != nil {
		return nil, ErrWorkspaceNotFound
	}
	if ws.OwnerUserID != ownerID {
		// 检查是否为成员
		members, mErr := s.memberRepo.ListByWorkspaceID(ctx, id)
		if mErr != nil {
			return nil, ErrWorkspaceUnauthorized
		}
		found := false
		for _, m := range members {
			if m.UserID == ownerID {
				found = true
				break
			}
		}
		if !found {
			return nil, ErrWorkspaceUnauthorized
		}
	}
	return ws, nil
}

var (
	ErrWorkspaceNotFound        = errors.New("workspace not found")
	ErrWorkspaceUnauthorized    = errors.New("unauthorized to access this workspace")
	ErrWorkspaceSlugExists      = errors.New("workspace slug already exists")
	ErrWorkspaceInvalidName     = errors.New("workspace name is invalid")
	ErrWorkspaceInvalidSlug     = errors.New("workspace slug is invalid")
	ErrWorkspaceInvalidIcon     = errors.New("workspace icon is invalid")
	ErrWorkspaceInvalidPlan     = errors.New("workspace plan is invalid")
	ErrWorkspaceRoleNotFound    = errors.New("workspace role not found")
	ErrWorkspaceMemberNotFound  = errors.New("workspace member not found")
	ErrWorkspaceMemberExists    = errors.New("workspace member already exists")
	ErrWorkspaceUserNotFound    = errors.New("workspace user not found")
	ErrWorkspaceOwnerRoleLocked = errors.New("workspace owner role locked")
	ErrWorkspaceNotDeleted      = errors.New("workspace is not deleted")
	ErrWorkspaceRestoreExpired  = errors.New("workspace restore window expired")
)
