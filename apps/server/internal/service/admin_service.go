package service

import (
	"context"
	"crypto/rand"
	"encoding/json"
	"errors"
	"math"
	"strconv"
	"strings"
	"time"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/repository"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// AdminCapability 管理员能力范围
type AdminCapability struct {
	Key         string `json:"key"`
	Title       string `json:"title"`
	Description string `json:"description"`
}

// AdminRole 管理员角色
type AdminRole string

const (
	AdminRoleSuper    AdminRole = "super_admin"
	AdminRoleOps      AdminRole = "ops"
	AdminRoleSupport  AdminRole = "support"
	AdminRoleFinance  AdminRole = "finance"
	AdminRoleReviewer AdminRole = "reviewer"
	AdminRoleViewer   AdminRole = "viewer"
)

type AdminPermissionLevel string

const (
	AdminPermissionNone      AdminPermissionLevel = "none"
	AdminPermissionRead      AdminPermissionLevel = "read"
	AdminPermissionReadWrite AdminPermissionLevel = "read_write"
)

var adminRolePermissionMatrix = map[AdminRole]map[string]AdminPermissionLevel{
	AdminRoleSuper: {
		"users":         AdminPermissionReadWrite,
		"workspaces":    AdminPermissionReadWrite,
		"workflows":     AdminPermissionReadWrite,
		"executions":    AdminPermissionReadWrite,
		"conversations": AdminPermissionReadWrite,
		"support":       AdminPermissionReadWrite,
		"billing":       AdminPermissionReadWrite,
		"earnings":      AdminPermissionReadWrite,
		"system":        AdminPermissionReadWrite,
		"config":        AdminPermissionReadWrite,
		"secrets":       AdminPermissionReadWrite,
		"audit":         AdminPermissionReadWrite,
		"announcements": AdminPermissionReadWrite,
		"templates":     AdminPermissionReadWrite,
		"permissions":   AdminPermissionReadWrite,
		"sessions":      AdminPermissionReadWrite,
		"analytics":     AdminPermissionReadWrite,
		"approvals":     AdminPermissionReadWrite,
	},
	AdminRoleOps: {
		"users":         AdminPermissionRead,
		"workspaces":    AdminPermissionReadWrite,
		"workflows":     AdminPermissionReadWrite,
		"executions":    AdminPermissionReadWrite,
		"conversations": AdminPermissionRead,
		"support":       AdminPermissionRead,
		"billing":       AdminPermissionRead,
		"earnings":      AdminPermissionRead,
		"system":        AdminPermissionReadWrite,
		"config":        AdminPermissionReadWrite,
		"secrets":       AdminPermissionReadWrite,
		"audit":         AdminPermissionRead,
		"announcements": AdminPermissionRead,
		"templates":     AdminPermissionRead,
		"permissions":   AdminPermissionRead,
		"sessions":      AdminPermissionReadWrite,
		"analytics":     AdminPermissionRead,
		"approvals":     AdminPermissionRead,
	},
	AdminRoleSupport: {
		"users":         AdminPermissionRead,
		"workspaces":    AdminPermissionRead,
		"workflows":     AdminPermissionNone,
		"executions":    AdminPermissionNone,
		"conversations": AdminPermissionReadWrite,
		"support":       AdminPermissionReadWrite,
		"billing":       AdminPermissionNone,
		"earnings":      AdminPermissionNone,
		"system":        AdminPermissionNone,
		"config":        AdminPermissionNone,
		"secrets":       AdminPermissionNone,
		"audit":         AdminPermissionRead,
		"announcements": AdminPermissionRead,
		"templates":     AdminPermissionRead,
		"permissions":   AdminPermissionNone,
		"sessions":      AdminPermissionRead,
		"analytics":     AdminPermissionRead,
		"approvals":     AdminPermissionRead,
	},
	AdminRoleFinance: {
		"users":         AdminPermissionRead,
		"workspaces":    AdminPermissionRead,
		"workflows":     AdminPermissionNone,
		"executions":    AdminPermissionNone,
		"conversations": AdminPermissionNone,
		"support":       AdminPermissionNone,
		"billing":       AdminPermissionReadWrite,
		"earnings":      AdminPermissionReadWrite,
		"system":        AdminPermissionNone,
		"config":        AdminPermissionRead,
		"secrets":       AdminPermissionNone,
		"audit":         AdminPermissionRead,
		"announcements": AdminPermissionRead,
		"templates":     AdminPermissionNone,
		"permissions":   AdminPermissionNone,
		"sessions":      AdminPermissionRead,
		"analytics":     AdminPermissionRead,
		"approvals":     AdminPermissionRead,
	},
	AdminRoleReviewer: {
		"users":         AdminPermissionRead,
		"workspaces":    AdminPermissionRead,
		"workflows":     AdminPermissionNone,
		"executions":    AdminPermissionNone,
		"conversations": AdminPermissionRead,
		"support":       AdminPermissionRead,
		"billing":       AdminPermissionNone,
		"earnings":      AdminPermissionNone,
		"system":        AdminPermissionNone,
		"config":        AdminPermissionNone,
		"secrets":       AdminPermissionNone,
		"audit":         AdminPermissionRead,
		"announcements": AdminPermissionReadWrite,
		"templates":     AdminPermissionReadWrite,
		"permissions":   AdminPermissionNone,
		"sessions":      AdminPermissionNone,
		"analytics":     AdminPermissionRead,
		"approvals":     AdminPermissionRead,
	},
	AdminRoleViewer: {
		"users":         AdminPermissionRead,
		"workspaces":    AdminPermissionRead,
		"workflows":     AdminPermissionRead,
		"executions":    AdminPermissionRead,
		"conversations": AdminPermissionRead,
		"support":       AdminPermissionRead,
		"billing":       AdminPermissionRead,
		"earnings":      AdminPermissionRead,
		"system":        AdminPermissionRead,
		"config":        AdminPermissionRead,
		"secrets":       AdminPermissionNone,
		"audit":         AdminPermissionRead,
		"announcements": AdminPermissionRead,
		"templates":     AdminPermissionRead,
		"permissions":   AdminPermissionRead,
		"sessions":      AdminPermissionRead,
		"analytics":     AdminPermissionRead,
		"approvals":     AdminPermissionRead,
	},
}

// AdminUserListParams 用户查询参数
type AdminUserListParams struct {
	Search   string
	Status   string
	Role     string
	Page     int
	PageSize int
}

// AdminWorkspaceListParams Workspace 查询参数
type AdminWorkspaceListParams struct {
	Search         string
	Status         string
	OwnerID        *uuid.UUID
	IncludeDeleted bool
	Page           int
	PageSize       int
}

// AdminWorkspaceDetail 管理员 Workspace 详情
type AdminWorkspaceDetail struct {
	Workspace *entity.Workspace
	Members   []entity.WorkspaceMember
}

// AdminStatusUpdateInput 管理员状态变更入参
type AdminStatusUpdateInput struct {
	Status string
	Reason string
}

// AdminAdminRoleUpdateInput 管理员角色更新入参
type AdminAdminRoleUpdateInput struct {
	Role   string
	Reason string
}

// AdminService 管理员服务接口
type AdminService interface {
	ListUsers(ctx context.Context, params AdminUserListParams) ([]entity.User, int64, error)
	GetUser(ctx context.Context, userID uuid.UUID) (*entity.User, error)
	UpdateUserStatus(ctx context.Context, adminID, userID uuid.UUID, input AdminStatusUpdateInput) (*entity.User, error)
	UpdateUserRole(ctx context.Context, adminID, userID uuid.UUID, role string) (*entity.User, error)
	UpdateUserAdminRole(ctx context.Context, adminID, userID uuid.UUID, input AdminAdminRoleUpdateInput) (*entity.User, error)
	ForceLogoutUser(ctx context.Context, adminID, userID uuid.UUID, reason string) error
	ResetUserPassword(ctx context.Context, adminID, userID uuid.UUID, reason string, notify bool) (string, error)
	UpdateUserRiskFlag(ctx context.Context, adminID, userID uuid.UUID, flag, reason string) (*entity.User, error)
	BatchUpdateUserStatus(ctx context.Context, adminID uuid.UUID, userIDs []uuid.UUID, input AdminStatusUpdateInput) (int, []uuid.UUID, error)
	BatchUpdateUserRole(ctx context.Context, adminID uuid.UUID, userIDs []uuid.UUID, role string) (int, []uuid.UUID, error)
	GetUserAssets(ctx context.Context, userID uuid.UUID) (*AdminUserAssets, error)
	ListUserSessions(ctx context.Context, userID uuid.UUID) ([]AdminUserSession, error)
	TerminateUserSession(ctx context.Context, adminID, userID, sessionID uuid.UUID, reason string) error
	ListWorkspaces(ctx context.Context, params AdminWorkspaceListParams) ([]entity.Workspace, int64, error)
	GetWorkspaceDetail(ctx context.Context, workspaceID uuid.UUID, includeDeleted bool) (*AdminWorkspaceDetail, error)
	UpdateWorkspaceStatus(ctx context.Context, adminID, workspaceID uuid.UUID, input AdminStatusUpdateInput) (*entity.Workspace, error)
	UpdateWorkspacePublishStatus(ctx context.Context, adminID, workspaceID uuid.UUID, input AdminStatusUpdateInput) (*entity.Workspace, error)
	Capabilities() []AdminCapability
	CapabilitiesForUser(user *entity.User) []AdminCapability
}

type adminService struct {
	userRepo            repository.UserRepository
	workspaceRepo       repository.WorkspaceRepository
	workspaceMemberRepo repository.WorkspaceMemberRepository
	sessionRepo         repository.SessionRepository
	executionRepo       repository.ExecutionRepository
	workspaceQuotaRepo  repository.WorkspaceQuotaRepository
	activityService     ActivityService
	auditLogService     AuditLogService
	adminEmailSet       map[string]struct{}
	adminRoleOverrides  map[string]AdminRole
	now                 func() time.Time
}

// NewAdminService 创建管理员服务
func NewAdminService(
	userRepo repository.UserRepository,
	workspaceRepo repository.WorkspaceRepository,
	workspaceMemberRepo repository.WorkspaceMemberRepository,
	sessionRepo repository.SessionRepository,
	executionRepo repository.ExecutionRepository,
	workspaceQuotaRepo repository.WorkspaceQuotaRepository,
	activityService ActivityService,
	auditLogService AuditLogService,
	adminEmails []string,
	adminRoleOverrides map[string]string,
) AdminService {
	return &adminService{
		userRepo:            userRepo,
		workspaceRepo:       workspaceRepo,
		workspaceMemberRepo: workspaceMemberRepo,
		sessionRepo:         sessionRepo,
		executionRepo:       executionRepo,
		workspaceQuotaRepo:  workspaceQuotaRepo,
		activityService:     activityService,
		auditLogService:     auditLogService,
		adminEmailSet:       normalizeAdminEmailSet(adminEmails),
		adminRoleOverrides:  normalizeAdminRoleOverrides(adminRoleOverrides),
		now:                 time.Now,
	}
}

var (
	ErrAdminUserNotFound      = errors.New("admin user not found")
	ErrAdminWorkspaceNotFound = errors.New("admin workspace not found")
	ErrAdminInvalidStatus     = errors.New("admin invalid status")
	ErrAdminInvalidRole       = errors.New("admin invalid role")
	ErrAdminInvalidAdminRole  = errors.New("admin invalid admin role")
	ErrAdminInvalidRiskFlag   = errors.New("admin invalid risk flag")
	ErrAdminInvalidBatch      = errors.New("admin invalid batch request")
	ErrAdminReasonRequired    = errors.New("admin reason required")
)

type AdminUserAssetWorkspace struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Role      string `json:"role"`
	CreatedAt string `json:"created_at"`
}

type AdminUserAssetUsage struct {
	TotalExecutions      int64 `json:"total_executions"`
	TotalTokens          int64 `json:"total_tokens"`
	TotalStorageMB       int64 `json:"total_storage_mb"`
	Last30DaysExecutions int64 `json:"last_30_days_executions"`
}

type AdminUserAssets struct {
	Workspaces []AdminUserAssetWorkspace `json:"workspaces"`
	Usage      AdminUserAssetUsage       `json:"usage"`
}

type AdminUserSession struct {
	ID           string `json:"id"`
	Device       string `json:"device"`
	IP           string `json:"ip"`
	Location     string `json:"location"`
	LastActiveAt string `json:"last_active_at"`
	CreatedAt    string `json:"created_at"`
}

func (s *adminService) Capabilities() []AdminCapability {
	return []AdminCapability{
		// 用户管理
		{Key: "users.read", Title: "查看用户", Description: "查看用户列表与详情"},
		{Key: "users.write", Title: "编辑用户", Description: "修改用户状态与角色"},
		{Key: "users.manage", Title: "管理用户", Description: "高级用户管理操作"},
		{Key: "users.delete", Title: "删除用户", Description: "删除用户账号"},
		{Key: "users.export", Title: "导出用户", Description: "导出用户数据"},

		// Workspace 管理
		{Key: "workspaces.read", Title: "查看工作空间", Description: "查看工作空间列表与详情"},
		{Key: "workspaces.write", Title: "编辑工作空间", Description: "修改工作空间状态"},
		{Key: "workspaces.manage", Title: "管理工作空间", Description: "高级工作空间管理"},
		{Key: "workspaces.delete", Title: "删除工作空间", Description: "删除工作空间"},
		{Key: "workspaces.export", Title: "导出工作空间", Description: "导出工作空间数据"},

		// 工作流管理
		{Key: "workflows.read", Title: "查看工作流", Description: "查看工作流列表与详情"},
		{Key: "workflows.manage", Title: "管理工作流", Description: "调整工作流状态与配置"},

		// 执行管理
		{Key: "executions.read", Title: "查看执行", Description: "查看执行历史与详情"},
		{Key: "executions.manage", Title: "管理执行", Description: "取消或重试执行"},

		// 对话管理
		{Key: "conversations.read", Title: "查看对话", Description: "查看对话列表与详情"},
		{Key: "conversations.manage", Title: "管理对话", Description: "归档或删除对话"},

		// 工单与支持
		{Key: "support.read", Title: "查看工单", Description: "查看工单列表与详情"},
		{Key: "support.write", Title: "处理工单", Description: "更新工单状态与回复"},
		{Key: "support.manage", Title: "管理支持", Description: "管理渠道、团队、队列"},

		// 计费与收益
		{Key: "billing.read", Title: "查看计费", Description: "查看账单与发票"},
		{Key: "billing.write", Title: "编辑计费", Description: "修改计费配置"},
		{Key: "billing.approve", Title: "审批退款", Description: "处理退款申请"},
		{Key: "earnings.read", Title: "查看收益", Description: "查看收益与提现"},
		{Key: "earnings.approve", Title: "审批提现", Description: "处理提现申请"},

		// 系统运维
		{Key: "system.read", Title: "查看系统", Description: "查看系统状态"},
		{Key: "system.write", Title: "系统运维", Description: "系统配置与操作"},
		{Key: "system.manage", Title: "系统管理", Description: "高级系统管理"},

		// 配置管理
		{Key: "config.read", Title: "查看配置", Description: "查看系统配置"},
		{Key: "config.write", Title: "编辑配置", Description: "修改系统配置"},

		// 密钥管理
		{Key: "secrets.read", Title: "查看密钥", Description: "查看密钥列表"},
		{Key: "secrets.write", Title: "管理密钥", Description: "轮换或禁用密钥"},

		// 审计日志
		{Key: "audit.read", Title: "查看审计", Description: "查看审计日志"},
		{Key: "audit.export", Title: "导出审计", Description: "导出审计日志"},

		// 公告管理
		{Key: "announcements.read", Title: "查看公告", Description: "查看公告列表"},
		{Key: "announcements.write", Title: "管理公告", Description: "创建与编辑公告"},

		// 模板与内容
		{Key: "templates.read", Title: "查看模板", Description: "查看模板列表"},
		{Key: "templates.write", Title: "编辑模板", Description: "修改模板配置"},
		{Key: "templates.approve", Title: "审核模板", Description: "审核模板上架"},

		// 权限管理
		{Key: "permissions.read", Title: "查看权限", Description: "查看权限配置"},
		{Key: "permissions.write", Title: "管理权限", Description: "修改角色权限"},

		// 会话管理
		{Key: "sessions.read", Title: "查看会话", Description: "查看登录会话"},
		{Key: "sessions.write", Title: "管理会话", Description: "终止会话"},

		// 分析数据
		{Key: "analytics.read", Title: "查看分析", Description: "查看分析数据"},
		{Key: "analytics.export", Title: "导出分析", Description: "导出分析报告"},

		// 审批管理
		{Key: "approvals.read", Title: "查看审批", Description: "查看审批请求"},
		{Key: "approvals.approve", Title: "处理审批", Description: "审批或拒绝请求"},
	}
}

func (s *adminService) CapabilitiesForUser(user *entity.User) []AdminCapability {
	role := resolveAdminRole(user, s.adminEmailSet, s.adminRoleOverrides)
	capabilities := filterCapabilitiesForRole(s.Capabilities(), role)
	if roleCapability := adminRoleCapability(role); roleCapability.Key != "" {
		capabilities = append(capabilities, roleCapability)
	}
	return capabilities
}

func (s *adminService) ListUsers(ctx context.Context, params AdminUserListParams) ([]entity.User, int64, error) {
	search := strings.TrimSpace(params.Search)
	status := normalizeAdminValue(params.Status)
	role := normalizeAdminValue(params.Role)
	return s.userRepo.List(ctx, repository.UserListParams{
		Search:   search,
		Status:   status,
		Role:     role,
		Page:     params.Page,
		PageSize: params.PageSize,
	})
}

func (s *adminService) GetUser(ctx context.Context, userID uuid.UUID) (*entity.User, error) {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrAdminUserNotFound
		}
		return nil, err
	}
	return user, nil
}

func (s *adminService) UpdateUserStatus(ctx context.Context, adminID, userID uuid.UUID, input AdminStatusUpdateInput) (*entity.User, error) {
	status := normalizeAdminValue(input.Status)
	if !isAllowedUserStatus(status) {
		return nil, ErrAdminInvalidStatus
	}

	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrAdminUserNotFound
		}
		return nil, err
	}

	now := s.now()
	previous := user.Status
	reason := strings.TrimSpace(input.Reason)
	user.Status = status
	user.StatusUpdatedAt = &now
	if reason != "" {
		user.StatusReason = &reason
	} else {
		user.StatusReason = nil
	}

	if err := s.userRepo.Update(ctx, user); err != nil {
		return nil, err
	}

	s.recordUserAdminActivity(ctx, user.ID, adminID, "admin.user_status_update", map[string]interface{}{
		"from_status": previous,
		"to_status":   status,
		"reason":      reason,
	})

	return user, nil
}

func (s *adminService) UpdateUserRole(ctx context.Context, adminID, userID uuid.UUID, role string) (*entity.User, error) {
	normalized := normalizeAdminValue(role)
	if !isAllowedUserRole(normalized) {
		return nil, ErrAdminInvalidRole
	}

	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrAdminUserNotFound
		}
		return nil, err
	}

	previous := user.Role
	user.Role = normalized

	if err := s.userRepo.Update(ctx, user); err != nil {
		return nil, err
	}

	s.recordUserAdminActivity(ctx, user.ID, adminID, "admin.user_role_update", map[string]interface{}{
		"from_role": previous,
		"to_role":   normalized,
	})

	return user, nil
}

func (s *adminService) UpdateUserAdminRole(
	ctx context.Context,
	adminID, userID uuid.UUID,
	input AdminAdminRoleUpdateInput,
) (*entity.User, error) {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrAdminUserNotFound
		}
		return nil, err
	}

	previous := ""
	if role := roleFromSettings(user.Settings); role != "" {
		previous = string(role)
	}

	nextRole := strings.TrimSpace(input.Role)
	settings := user.Settings
	if settings == nil {
		settings = entity.JSON{}
	}

	if nextRole == "" {
		delete(settings, "admin_role")
		delete(settings, "adminRole")
		nextRole = ""
	} else {
		normalized := normalizeAdminRole(nextRole)
		if normalized == "" {
			return nil, ErrAdminInvalidAdminRole
		}
		settings["admin_role"] = string(normalized)
		delete(settings, "adminRole")
		nextRole = string(normalized)
	}

	user.Settings = settings
	if err := s.userRepo.Update(ctx, user); err != nil {
		return nil, err
	}

	s.recordUserAdminActivity(ctx, user.ID, adminID, "admin.user_admin_role_update", map[string]interface{}{
		"from_admin_role": previous,
		"to_admin_role":   nextRole,
		"reason":          strings.TrimSpace(input.Reason),
	})

	return user, nil
}

func (s *adminService) ForceLogoutUser(ctx context.Context, adminID, userID uuid.UUID, reason string) error {
	reason = strings.TrimSpace(reason)
	if reason == "" {
		return ErrAdminReasonRequired
	}

	if _, err := s.userRepo.GetByID(ctx, userID); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrAdminUserNotFound
		}
		return err
	}

	if s.sessionRepo != nil {
		if err := s.sessionRepo.DeactivateAll(ctx, userID); err != nil {
			return err
		}
	}

	s.recordUserAdminActivity(ctx, userID, adminID, "admin.user_force_logout", map[string]interface{}{
		"reason": reason,
	})

	return nil
}

func (s *adminService) ResetUserPassword(
	ctx context.Context,
	adminID, userID uuid.UUID,
	reason string,
	notify bool,
) (string, error) {
	reason = strings.TrimSpace(reason)
	if reason == "" {
		return "", ErrAdminReasonRequired
	}

	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return "", ErrAdminUserNotFound
		}
		return "", err
	}

	tempPassword, err := generateTempPassword(12)
	if err != nil {
		return "", err
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(tempPassword), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}

	user.PasswordHash = string(hashedPassword)
	if err := s.userRepo.Update(ctx, user); err != nil {
		return "", err
	}

	if s.sessionRepo != nil {
		_ = s.sessionRepo.DeactivateAll(ctx, userID)
	}

	s.recordUserAdminActivity(ctx, userID, adminID, "admin.user_password_reset", map[string]interface{}{
		"reason": reason,
		"notify": notify,
	})

	return tempPassword, nil
}

func (s *adminService) UpdateUserRiskFlag(
	ctx context.Context,
	adminID, userID uuid.UUID,
	flag, reason string,
) (*entity.User, error) {
	reason = strings.TrimSpace(reason)
	if reason == "" {
		return nil, ErrAdminReasonRequired
	}
	normalized := normalizeRiskFlag(flag)
	if normalized == "" {
		return nil, ErrAdminInvalidRiskFlag
	}

	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrAdminUserNotFound
		}
		return nil, err
	}

	previous := getRiskFlagFromSettings(user.Settings)
	settings := user.Settings
	if settings == nil {
		settings = entity.JSON{}
	}
	if normalized == "none" {
		delete(settings, "risk_flag")
		delete(settings, "riskFlag")
		delete(settings, "risk_flag_reason")
		delete(settings, "risk_flag_updated_at")
	} else {
		settings["risk_flag"] = normalized
		settings["risk_flag_reason"] = reason
		settings["risk_flag_updated_at"] = s.now().Format(time.RFC3339)
		delete(settings, "riskFlag")
	}
	user.Settings = settings

	if err := s.userRepo.Update(ctx, user); err != nil {
		return nil, err
	}

	s.recordUserAdminActivity(ctx, userID, adminID, "admin.user_risk_flag_update", map[string]interface{}{
		"from":   previous,
		"to":     normalized,
		"reason": reason,
	})

	return user, nil
}

func (s *adminService) BatchUpdateUserStatus(
	ctx context.Context,
	adminID uuid.UUID,
	userIDs []uuid.UUID,
	input AdminStatusUpdateInput,
) (int, []uuid.UUID, error) {
	if len(userIDs) == 0 {
		return 0, nil, ErrAdminInvalidBatch
	}
	normalizedStatus := normalizeAdminValue(input.Status)
	if !isAllowedUserStatus(normalizedStatus) {
		return 0, nil, ErrAdminInvalidStatus
	}
	if normalizedStatus == "suspended" && strings.TrimSpace(input.Reason) == "" {
		return 0, nil, ErrAdminReasonRequired
	}

	updated := 0
	failed := make([]uuid.UUID, 0)
	for _, userID := range userIDs {
		if _, err := s.UpdateUserStatus(ctx, adminID, userID, input); err != nil {
			failed = append(failed, userID)
			continue
		}
		updated++
	}
	return updated, failed, nil
}

func (s *adminService) BatchUpdateUserRole(
	ctx context.Context,
	adminID uuid.UUID,
	userIDs []uuid.UUID,
	role string,
) (int, []uuid.UUID, error) {
	if len(userIDs) == 0 {
		return 0, nil, ErrAdminInvalidBatch
	}
	normalizedRole := normalizeAdminValue(role)
	if !isAllowedUserRole(normalizedRole) {
		return 0, nil, ErrAdminInvalidRole
	}

	updated := 0
	failed := make([]uuid.UUID, 0)
	for _, userID := range userIDs {
		if _, err := s.UpdateUserRole(ctx, adminID, userID, normalizedRole); err != nil {
			failed = append(failed, userID)
			continue
		}
		updated++
	}
	return updated, failed, nil
}

func (s *adminService) GetUserAssets(ctx context.Context, userID uuid.UUID) (*AdminUserAssets, error) {
	if _, err := s.userRepo.GetByID(ctx, userID); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrAdminUserNotFound
		}
		return nil, err
	}

	workspaces, err := s.workspaceRepo.ListByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	memberships, err := s.workspaceMemberRepo.ListByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	memberMap := map[uuid.UUID]entity.WorkspaceMember{}
	for _, member := range memberships {
		memberMap[member.WorkspaceID] = member
	}

	workspaceAssets := make([]AdminUserAssetWorkspace, 0, len(workspaces))
	storageGB := 0.0
	for _, workspace := range workspaces {
		role := "member"
		createdAt := workspace.CreatedAt
		if workspace.OwnerUserID == userID {
			role = "owner"
		} else if member, ok := memberMap[workspace.ID]; ok {
			if member.Role != nil && strings.TrimSpace(member.Role.Name) != "" {
				role = member.Role.Name
			}
			if member.JoinedAt != nil {
				createdAt = *member.JoinedAt
			}
		}

		if s.workspaceQuotaRepo != nil {
			quota, err := s.workspaceQuotaRepo.GetActiveByWorkspace(ctx, workspace.ID, s.now())
			if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, err
			}
			if quota != nil {
				usage := jsonToFloatMap(quota.Usage)
				storageGB += usage["db_storage_gb"] + usage["storage_gb"]
			}
		}

		workspaceAssets = append(workspaceAssets, AdminUserAssetWorkspace{
			ID:        workspace.ID.String(),
			Name:      workspace.Name,
			Role:      role,
			CreatedAt: formatTime(createdAt),
		})
	}

	usage := AdminUserAssetUsage{}
	if s.executionRepo != nil {
		stats, err := s.executionRepo.GetUsageByUser(ctx, userID, s.now().AddDate(0, 0, -30))
		if err != nil {
			return nil, err
		}
		usage.TotalExecutions = stats.TotalExecutions
		usage.TotalTokens = stats.TotalTokens
		usage.Last30DaysExecutions = stats.Last30DaysExecutions
	}

	if storageGB < 0 {
		storageGB = 0
	}
	usage.TotalStorageMB = int64(math.Round(storageGB * 1024))

	return &AdminUserAssets{
		Workspaces: workspaceAssets,
		Usage:      usage,
	}, nil
}

func (s *adminService) ListUserSessions(ctx context.Context, userID uuid.UUID) ([]AdminUserSession, error) {
	if s.sessionRepo == nil {
		return nil, errors.New("session repository unavailable")
	}
	if _, err := s.userRepo.GetByID(ctx, userID); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrAdminUserNotFound
		}
		return nil, err
	}

	sessions, err := s.sessionRepo.ListByUser(ctx, userID)
	if err != nil {
		return nil, err
	}

	result := make([]AdminUserSession, 0, len(sessions))
	for _, session := range sessions {
		device := buildSessionDeviceLabel(&session)
		ip := ""
		if session.IP != nil {
			ip = *session.IP
		}
		location := "Unknown"
		if session.Location != nil && strings.TrimSpace(*session.Location) != "" {
			location = *session.Location
		}
		result = append(result, AdminUserSession{
			ID:           session.ID.String(),
			Device:       device,
			IP:           ip,
			Location:     location,
			LastActiveAt: formatTime(session.LastActiveAt),
			CreatedAt:    formatTime(session.CreatedAt),
		})
	}

	return result, nil
}

func (s *adminService) TerminateUserSession(
	ctx context.Context,
	adminID, userID, sessionID uuid.UUID,
	reason string,
) error {
	if s.sessionRepo == nil {
		return errors.New("session repository unavailable")
	}
	session, err := s.sessionRepo.GetByID(ctx, sessionID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrSessionNotFound
		}
		return err
	}
	if session.UserID != userID {
		return ErrUnauthorized
	}

	if err := s.sessionRepo.Deactivate(ctx, sessionID); err != nil {
		return err
	}

	if strings.TrimSpace(reason) == "" {
		reason = "terminated_by_admin"
	}
	s.recordUserAdminActivity(ctx, userID, adminID, "admin.user_session_terminate", map[string]interface{}{
		"session_id": sessionID.String(),
		"reason":     reason,
	})

	return nil
}

func (s *adminService) ListWorkspaces(ctx context.Context, params AdminWorkspaceListParams) ([]entity.Workspace, int64, error) {
	search := strings.TrimSpace(params.Search)
	status := normalizeAdminValue(params.Status)
	return s.workspaceRepo.ListAll(ctx, repository.WorkspaceListParams{
		Search:         search,
		Status:         status,
		OwnerID:        params.OwnerID,
		IncludeDeleted: params.IncludeDeleted,
		Page:           params.Page,
		PageSize:       params.PageSize,
	})
}

func (s *adminService) GetWorkspaceDetail(ctx context.Context, workspaceID uuid.UUID, includeDeleted bool) (*AdminWorkspaceDetail, error) {
	var (
		workspace *entity.Workspace
		err       error
	)
	if includeDeleted {
		workspace, err = s.workspaceRepo.GetByIDUnscoped(ctx, workspaceID)
	} else {
		workspace, err = s.workspaceRepo.GetByID(ctx, workspaceID)
	}
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrAdminWorkspaceNotFound
		}
		return nil, err
	}

	if workspace != nil {
		if owner, err := s.userRepo.GetByID(ctx, workspace.OwnerUserID); err == nil {
			workspace.Owner = owner
		}
	}

	members, err := s.workspaceMemberRepo.ListByWorkspaceID(ctx, workspaceID)
	if err != nil {
		return nil, err
	}

	return &AdminWorkspaceDetail{
		Workspace: workspace,
		Members:   members,
	}, nil
}

func (s *adminService) UpdateWorkspaceStatus(ctx context.Context, adminID, workspaceID uuid.UUID, input AdminStatusUpdateInput) (*entity.Workspace, error) {
	status := normalizeAdminValue(input.Status)
	if !isAllowedWorkspaceStatus(status) {
		return nil, ErrAdminInvalidStatus
	}

	workspace, err := s.workspaceRepo.GetByIDUnscoped(ctx, workspaceID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrAdminWorkspaceNotFound
		}
		return nil, err
	}

	now := s.now()
	previous := workspace.Status
	reason := strings.TrimSpace(input.Reason)
	workspace.Status = status
	workspace.StatusUpdatedAt = &now
	if reason != "" {
		workspace.StatusReason = &reason
	} else {
		workspace.StatusReason = nil
	}

	if err := s.workspaceRepo.Update(ctx, workspace); err != nil {
		return nil, err
	}

	s.recordAdminAudit(ctx, workspace.ID, adminID, "admin.workspace_status_update", "workspace", workspace.ID, map[string]interface{}{
		"from_status": previous,
		"to_status":   status,
		"reason":      reason,
	})

	return workspace, nil
}

func (s *adminService) UpdateWorkspacePublishStatus(ctx context.Context, adminID, workspaceID uuid.UUID, input AdminStatusUpdateInput) (*entity.Workspace, error) {
	status := normalizeAdminValue(input.Status)
	if !isAllowedWorkspacePublishStatus(status) {
		return nil, ErrAdminInvalidStatus
	}

	workspace, err := s.workspaceRepo.GetByIDUnscoped(ctx, workspaceID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrAdminWorkspaceNotFound
		}
		return nil, err
	}

	now := s.now()
	previous := workspace.AppStatus
	reason := strings.TrimSpace(input.Reason)
	workspace.AppStatus = status
	if status == "published" && workspace.PublishedAt == nil {
		workspace.PublishedAt = &now
	}

	if err := s.workspaceRepo.Update(ctx, workspace); err != nil {
		return nil, err
	}

	s.recordAdminAudit(ctx, workspace.ID, adminID, "admin.workspace_publish_status_update", "workspace", workspace.ID, map[string]interface{}{
		"from_status": previous,
		"to_status":   status,
		"reason":      reason,
	})

	return workspace, nil
}

func (s *adminService) recordUserAdminActivity(ctx context.Context, targetUserID, actorID uuid.UUID, action string, metadata map[string]interface{}) {
	if s.activityService == nil {
		return
	}
	meta := entity.JSON{}
	for key, value := range metadata {
		meta[key] = value
	}
	meta["actor_user_id"] = actorID.String()
	_ = s.activityService.RecordActivity(ctx, &entity.UserActivity{
		UserID:   targetUserID,
		Action:   action,
		Metadata: meta,
	})
}

func (s *adminService) recordAdminAudit(ctx context.Context, workspaceID, actorID uuid.UUID, action, targetType string, targetID uuid.UUID, metadata map[string]interface{}) {
	if s.auditLogService == nil {
		return
	}
	meta := entity.JSON{}
	for key, value := range metadata {
		meta[key] = value
	}
	actor := actorID
	_, _ = s.auditLogService.Record(ctx, AuditLogRecordRequest{
		WorkspaceID: workspaceID,
		ActorUserID: &actor,
		Action:      action,
		TargetType:  targetType,
		TargetID:    &targetID,
		Metadata:    meta,
	})
}

func normalizeAdminValue(value string) string {
	return strings.ToLower(strings.TrimSpace(value))
}

func isAllowedUserStatus(status string) bool {
	switch status {
	case "active", "suspended":
		return true
	default:
		return false
	}
}

func isAllowedUserRole(role string) bool {
	switch role {
	case "user", "admin", "creator":
		return true
	default:
		return false
	}
}

func isAllowedWorkspaceStatus(status string) bool {
	switch status {
	case "active", "suspended", "deleted", "cold_storage":
		return true
	default:
		return false
	}
}

func isAllowedWorkspacePublishStatus(status string) bool {
	switch status {
	case "draft", "published", "deprecated", "archived", "suspended":
		return true
	default:
		return false
	}
}

func normalizeAdminRoleOverrides(overrides map[string]string) map[string]AdminRole {
	if len(overrides) == 0 {
		return map[string]AdminRole{}
	}
	output := make(map[string]AdminRole, len(overrides))
	for email, role := range overrides {
		normalizedEmail := strings.ToLower(strings.TrimSpace(email))
		if normalizedEmail == "" {
			continue
		}
		normalizedRole := normalizeAdminRole(role)
		if normalizedRole == "" {
			continue
		}
		output[normalizedEmail] = normalizedRole
	}
	return output
}

func normalizeAdminEmailSet(emails []string) map[string]struct{} {
	output := map[string]struct{}{}
	for _, email := range emails {
		normalized := strings.ToLower(strings.TrimSpace(email))
		if normalized == "" {
			continue
		}
		output[normalized] = struct{}{}
	}
	return output
}

func normalizeAdminRole(role string) AdminRole {
	value := strings.ToLower(strings.TrimSpace(role))
	switch value {
	case "super_admin", "superadmin", "super-admin", "super":
		return AdminRoleSuper
	case "ops", "operation", "operations":
		return AdminRoleOps
	case "support":
		return AdminRoleSupport
	case "finance":
		return AdminRoleFinance
	case "reviewer", "review":
		return AdminRoleReviewer
	case "viewer", "readonly", "read_only", "read-only":
		return AdminRoleViewer
	default:
		return ""
	}
}

func resolveAdminRole(user *entity.User, emailSet map[string]struct{}, overrides map[string]AdminRole) AdminRole {
	if user == nil {
		return AdminRoleViewer
	}
	email := strings.ToLower(strings.TrimSpace(user.Email))
	if email != "" {
		if role, ok := overrides[email]; ok {
			return role
		}
	}
	if role := roleFromSettings(user.Settings); role != "" {
		return role
	}
	if email != "" {
		if _, ok := emailSet[email]; ok {
			return AdminRoleSuper
		}
	}
	return AdminRoleViewer
}

func roleFromSettings(settings entity.JSON) AdminRole {
	if settings == nil {
		return ""
	}
	if raw, ok := settings["admin_role"]; ok {
		if role, ok := raw.(string); ok {
			return normalizeAdminRole(role)
		}
	}
	if raw, ok := settings["adminRole"]; ok {
		if role, ok := raw.(string); ok {
			return normalizeAdminRole(role)
		}
	}
	return ""
}

func adminRoleCapability(role AdminRole) AdminCapability {
	switch role {
	case AdminRoleSuper:
		return AdminCapability{Key: "admin.super", Title: "超级管理员", Description: "拥有所有管理权限"}
	case AdminRoleOps:
		return AdminCapability{Key: "admin.ops", Title: "运维管理员", Description: "系统运维与配置管理权限"}
	case AdminRoleSupport:
		return AdminCapability{Key: "admin.support", Title: "客服支持", Description: "工单处理与用户支持权限"}
	case AdminRoleFinance:
		return AdminCapability{Key: "admin.finance", Title: "财务管理员", Description: "计费与收益管理权限"}
	case AdminRoleReviewer:
		return AdminCapability{Key: "admin.reviewer", Title: "内容审核员", Description: "内容审核与模板管理权限"}
	case AdminRoleViewer:
		return AdminCapability{Key: "admin.viewer", Title: "只读管理员", Description: "只读访问权限"}
	default:
		return AdminCapability{}
	}
}

func filterCapabilitiesForRole(all []AdminCapability, role AdminRole) []AdminCapability {
	modulePermissions := adminRolePermissionMatrix[role]
	if len(modulePermissions) == 0 {
		return []AdminCapability{}
	}
	output := make([]AdminCapability, 0, len(all))
	for _, capability := range all {
		module, action := parseCapabilityKey(capability.Key)
		if module == "" || action == "" {
			continue
		}
		level := modulePermissions[module]
		if allowsAction(level, action) {
			output = append(output, capability)
		}
	}
	return output
}

func parseCapabilityKey(key string) (string, string) {
	parts := strings.SplitN(strings.TrimSpace(key), ".", 2)
	if len(parts) != 2 {
		return "", ""
	}
	return strings.TrimSpace(parts[0]), strings.TrimSpace(parts[1])
}

func allowsAction(level AdminPermissionLevel, action string) bool {
	if level == AdminPermissionNone {
		return false
	}
	if strings.EqualFold(action, "read") {
		return level == AdminPermissionRead || level == AdminPermissionReadWrite
	}
	return level == AdminPermissionReadWrite
}

const tempPasswordCharset = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"

func generateTempPassword(length int) (string, error) {
	if length <= 0 {
		length = 12
	}
	buf := make([]byte, length)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	for i := range buf {
		buf[i] = tempPasswordCharset[int(buf[i])%len(tempPasswordCharset)]
	}
	return string(buf), nil
}

func normalizeRiskFlag(flag string) string {
	value := strings.ToLower(strings.TrimSpace(flag))
	switch value {
	case "none", "low", "medium", "high":
		return value
	default:
		return ""
	}
}

func getRiskFlagFromSettings(settings entity.JSON) string {
	if settings == nil {
		return "none"
	}
	if raw, ok := settings["risk_flag"]; ok {
		if value, ok := raw.(string); ok && strings.TrimSpace(value) != "" {
			return strings.ToLower(strings.TrimSpace(value))
		}
	}
	if raw, ok := settings["riskFlag"]; ok {
		if value, ok := raw.(string); ok && strings.TrimSpace(value) != "" {
			return strings.ToLower(strings.TrimSpace(value))
		}
	}
	return "none"
}

func buildSessionDeviceLabel(session *entity.UserSession) string {
	if session == nil {
		return "Unknown Device"
	}
	deviceName := ""
	if session.DeviceName != nil {
		deviceName = strings.TrimSpace(*session.DeviceName)
	}
	browser := ""
	if session.Browser != nil {
		browser = strings.TrimSpace(*session.Browser)
	}
	osName := ""
	if session.OS != nil {
		osName = strings.TrimSpace(*session.OS)
	}
	details := make([]string, 0, 2)
	if browser != "" {
		details = append(details, browser)
	}
	if osName != "" {
		details = append(details, osName)
	}
	if len(details) > 0 {
		return strings.Join(details, " · ")
	}
	if deviceName != "" {
		return deviceName
	}
	return "Unknown Device"
}

func formatTime(t time.Time) string {
	return t.Format(time.RFC3339)
}

func jsonToFloatMap(payload entity.JSON) map[string]float64 {
	result := map[string]float64{}
	for key, value := range payload {
		if parsed, ok := parseNumericValue(value); ok {
			result[key] = parsed
		}
	}
	return result
}

func parseNumericValue(value interface{}) (float64, bool) {
	switch v := value.(type) {
	case float64:
		return v, true
	case float32:
		return float64(v), true
	case int:
		return float64(v), true
	case int64:
		return float64(v), true
	case int32:
		return float64(v), true
	case json.Number:
		parsed, err := v.Float64()
		if err == nil {
			return parsed, true
		}
	case string:
		parsed, err := strconv.ParseFloat(v, 64)
		if err == nil {
			return parsed, true
		}
	}
	return 0, false
}
