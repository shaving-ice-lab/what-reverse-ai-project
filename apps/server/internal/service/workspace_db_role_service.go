package service

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/base64"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/agentflow/server/internal/config"
	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/pkg/crypto"
	"github.com/agentflow/server/internal/repository"
	_ "github.com/go-sql-driver/mysql"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

const (
	workspaceDBRoleTypeRead  = "read"
	workspaceDBRoleTypeWrite = "write"
	workspaceDBRoleTypeAdmin = "admin"

	workspaceDBRoleStatusActive  = "active"
	workspaceDBRoleStatusRevoked = "revoked"
	workspaceDBRoleStatusExpired = "expired"

	workspaceDBRoleUserPrefix          = "wsr_"
	workspaceDBRoleUserMaxLength       = 32
	workspaceDBRolePasswordBytesLength = 24
)

var (
	ErrWorkspaceDBRoleInvalid       = errors.New("workspace db role invalid")
	ErrWorkspaceDBRoleExists        = errors.New("workspace db role already exists")
	ErrWorkspaceDBRoleNotFound      = errors.New("workspace db role not found")
	ErrWorkspaceDBRoleInactive      = errors.New("workspace db role inactive")
	ErrWorkspaceDBRoleProvisionFail = errors.New("workspace db role provision failed")
	ErrWorkspaceDBRoleRotateFail    = errors.New("workspace db role rotate failed")
	ErrWorkspaceDBRoleRevokeFail    = errors.New("workspace db role revoke failed")
)

// CreateWorkspaceDBRoleRequest 创建数据库角色请求
type CreateWorkspaceDBRoleRequest struct {
	RoleType  string
	ExpiresAt *time.Time
}

// WorkspaceDBRoleListParams 角色列表参数
type WorkspaceDBRoleListParams struct {
	Status   *string
	RoleType *string
}

// WorkspaceDBRoleService 工作空间数据库角色服务接口
type WorkspaceDBRoleService interface {
	Create(ctx context.Context, workspaceID, actorID uuid.UUID, req CreateWorkspaceDBRoleRequest) (*entity.WorkspaceDBRole, string, error)
	List(ctx context.Context, workspaceID, actorID uuid.UUID, params WorkspaceDBRoleListParams) ([]entity.WorkspaceDBRole, error)
	Rotate(ctx context.Context, workspaceID, actorID uuid.UUID, roleID uuid.UUID) (*entity.WorkspaceDBRole, string, error)
	Revoke(ctx context.Context, workspaceID, actorID uuid.UUID, roleID uuid.UUID, reason string) (*entity.WorkspaceDBRole, error)
}

type workspaceDBRoleService struct {
	repo             repository.WorkspaceDBRoleRepository
	databaseRepo     repository.WorkspaceDatabaseRepository
	workspaceService WorkspaceService
	auditLogService  AuditLogService
	encryptor        *crypto.Encryptor
	dbConfig         config.DatabaseConfig
}

// NewWorkspaceDBRoleService 创建数据库角色服务实例
func NewWorkspaceDBRoleService(
	repo repository.WorkspaceDBRoleRepository,
	databaseRepo repository.WorkspaceDatabaseRepository,
	workspaceService WorkspaceService,
	auditLogService AuditLogService,
	dbConfig config.DatabaseConfig,
	encryptionKey string,
) (WorkspaceDBRoleService, error) {
	encryptor, err := crypto.NewEncryptor(encryptionKey)
	if err != nil {
		return nil, err
	}
	return &workspaceDBRoleService{
		repo:             repo,
		databaseRepo:     databaseRepo,
		workspaceService: workspaceService,
		auditLogService:  auditLogService,
		encryptor:        encryptor,
		dbConfig:         dbConfig,
	}, nil
}

func (s *workspaceDBRoleService) Create(ctx context.Context, workspaceID, actorID uuid.UUID, req CreateWorkspaceDBRoleRequest) (*entity.WorkspaceDBRole, string, error) {
	if err := s.ensureWorkspaceAccess(ctx, workspaceID, actorID); err != nil {
		return nil, "", err
	}
	roleType := normalizeWorkspaceDBRoleType(req.RoleType)
	if !isValidWorkspaceDBRoleType(roleType) {
		return nil, "", ErrWorkspaceDBRoleInvalid
	}
	if req.ExpiresAt != nil && req.ExpiresAt.Before(time.Now()) {
		return nil, "", ErrWorkspaceDBRoleInvalid
	}

	existing, err := s.repo.GetActiveByWorkspaceRole(ctx, workspaceID, roleType)
	if err == nil && existing != nil {
		return nil, "", ErrWorkspaceDBRoleExists
	}
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, "", err
	}

	database, err := s.getWorkspaceDatabase(ctx, workspaceID)
	if err != nil {
		return nil, "", err
	}

	dbUser := s.dbUserForRole(workspaceID, roleType)
	password, err := generateWorkspaceDBRolePassword()
	if err != nil {
		return nil, "", ErrWorkspaceDBRoleProvisionFail
	}

	if err := s.createOrUpdateDatabaseUser(ctx, database.DBName, dbUser, password, roleType); err != nil {
		return nil, "", ErrWorkspaceDBRoleProvisionFail
	}

	encrypted, err := s.encryptor.Encrypt(password)
	if err != nil {
		_ = s.dropDatabaseUser(ctx, dbUser)
		return nil, "", ErrWorkspaceDBRoleProvisionFail
	}
	secretRef := fmt.Sprintf("enc:%s", encrypted)

	role := &entity.WorkspaceDBRole{
		WorkspaceID: workspaceID,
		RoleType:    roleType,
		DBUser:      dbUser,
		SecretRef:   &secretRef,
		Status:      workspaceDBRoleStatusActive,
		ExpiresAt:   req.ExpiresAt,
	}
	if err := s.repo.Create(ctx, role); err != nil {
		_ = s.dropDatabaseUser(ctx, dbUser)
		return nil, "", err
	}

	s.recordAudit(ctx, workspaceID, actorID, "workspace.db.role.create", role, entity.JSON{
		"role_type": roleType,
		"db_user":   dbUser,
	})

	return role, password, nil
}

func (s *workspaceDBRoleService) List(ctx context.Context, workspaceID, actorID uuid.UUID, params WorkspaceDBRoleListParams) ([]entity.WorkspaceDBRole, error) {
	if err := s.ensureWorkspaceAccess(ctx, workspaceID, actorID); err != nil {
		return nil, err
	}
	filter := repository.WorkspaceDBRoleListParams{
		WorkspaceID: workspaceID,
		Status:      params.Status,
		RoleType:    params.RoleType,
	}
	roles, err := s.repo.ListByWorkspace(ctx, filter)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	for i := range roles {
		if roles[i].Status != workspaceDBRoleStatusActive || roles[i].ExpiresAt == nil {
			continue
		}
		if roles[i].ExpiresAt.After(now) {
			continue
		}
		updated, err := s.revokeRole(ctx, workspaceID, actorID, &roles[i], "expired", workspaceDBRoleStatusExpired)
		if err == nil && updated != nil {
			roles[i] = *updated
		}
	}
	if params.Status != nil {
		normalized := strings.ToLower(strings.TrimSpace(*params.Status))
		if normalized == workspaceDBRoleStatusActive {
			filtered := roles[:0]
			for _, role := range roles {
				if role.Status == workspaceDBRoleStatusActive {
					filtered = append(filtered, role)
				}
			}
			roles = filtered
		}
	}

	return roles, nil
}

func (s *workspaceDBRoleService) Rotate(ctx context.Context, workspaceID, actorID uuid.UUID, roleID uuid.UUID) (*entity.WorkspaceDBRole, string, error) {
	if err := s.ensureWorkspaceAccess(ctx, workspaceID, actorID); err != nil {
		return nil, "", err
	}

	role, err := s.repo.GetByID(ctx, roleID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, "", ErrWorkspaceDBRoleNotFound
		}
		return nil, "", err
	}
	if role.WorkspaceID != workspaceID {
		return nil, "", ErrWorkspaceUnauthorized
	}
	if role.Status != workspaceDBRoleStatusActive {
		return nil, "", ErrWorkspaceDBRoleInactive
	}

	database, err := s.getWorkspaceDatabase(ctx, workspaceID)
	if err != nil {
		return nil, "", err
	}

	password, err := generateWorkspaceDBRolePassword()
	if err != nil {
		return nil, "", ErrWorkspaceDBRoleRotateFail
	}
	if err := s.createOrUpdateDatabaseUser(ctx, database.DBName, role.DBUser, password, role.RoleType); err != nil {
		return nil, "", ErrWorkspaceDBRoleRotateFail
	}

	encrypted, err := s.encryptor.Encrypt(password)
	if err != nil {
		return nil, "", ErrWorkspaceDBRoleRotateFail
	}
	secretRef := fmt.Sprintf("enc:%s", encrypted)
	now := time.Now()
	role.SecretRef = &secretRef
	role.LastRotatedAt = &now
	if err := s.repo.Update(ctx, role); err != nil {
		return nil, "", err
	}

	s.recordAudit(ctx, workspaceID, actorID, "workspace.db.role.rotate", role, entity.JSON{
		"role_type": role.RoleType,
		"db_user":   role.DBUser,
	})

	return role, password, nil
}

func (s *workspaceDBRoleService) Revoke(ctx context.Context, workspaceID, actorID uuid.UUID, roleID uuid.UUID, reason string) (*entity.WorkspaceDBRole, error) {
	if err := s.ensureWorkspaceAccess(ctx, workspaceID, actorID); err != nil {
		return nil, err
	}
	role, err := s.repo.GetByID(ctx, roleID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrWorkspaceDBRoleNotFound
		}
		return nil, err
	}
	if role.WorkspaceID != workspaceID {
		return nil, ErrWorkspaceUnauthorized
	}

	updated, err := s.revokeRole(ctx, workspaceID, actorID, role, reason, workspaceDBRoleStatusRevoked)
	if err != nil {
		return nil, err
	}
	return updated, nil
}

func (s *workspaceDBRoleService) ensureWorkspaceAccess(ctx context.Context, workspaceID, actorID uuid.UUID) error {
	if workspaceID == uuid.Nil || actorID == uuid.Nil {
		return ErrWorkspaceUnauthorized
	}
	access, err := s.workspaceService.GetWorkspaceAccess(ctx, workspaceID, actorID)
	if err != nil {
		return err
	}
	if !access.IsOwner && !hasAnyPermission(access.Permissions, PermissionWorkspaceDBAccess, PermissionWorkspaceAdmin) {
		return ErrWorkspaceUnauthorized
	}
	return nil
}

func (s *workspaceDBRoleService) getWorkspaceDatabase(ctx context.Context, workspaceID uuid.UUID) (*entity.WorkspaceDatabase, error) {
	database, err := s.databaseRepo.GetByWorkspaceID(ctx, workspaceID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrWorkspaceDatabaseNotFound
		}
		return nil, err
	}
	if strings.ToLower(strings.TrimSpace(database.Status)) != "ready" {
		return nil, ErrWorkspaceDatabaseNotReady
	}
	if strings.TrimSpace(database.DBName) == "" {
		return nil, ErrWorkspaceDatabaseNotReady
	}
	return database, nil
}

func (s *workspaceDBRoleService) createOrUpdateDatabaseUser(ctx context.Context, dbName, dbUser, password, roleType string) error {
	admin, err := sql.Open("mysql", s.adminDSN())
	if err != nil {
		return err
	}
	defer admin.Close()

	escapedPassword := escapeMySQLString(password)
	createUserSQL := fmt.Sprintf(
		"CREATE USER IF NOT EXISTS '%s'@'%%' IDENTIFIED BY '%s'",
		dbUser,
		escapedPassword,
	)
	if _, err := admin.ExecContext(ctx, createUserSQL); err != nil {
		return err
	}
	alterSQL := fmt.Sprintf(
		"ALTER USER '%s'@'%%' IDENTIFIED BY '%s'",
		dbUser,
		escapedPassword,
	)
	if _, err := admin.ExecContext(ctx, alterSQL); err != nil {
		return err
	}

	grantSQL, err := buildRoleGrantSQL(dbName, dbUser, roleType)
	if err != nil {
		return err
	}
	if _, err := admin.ExecContext(ctx, grantSQL); err != nil {
		return err
	}
	if _, err := admin.ExecContext(ctx, "FLUSH PRIVILEGES"); err != nil {
		return err
	}
	return nil
}

func (s *workspaceDBRoleService) dropDatabaseUser(ctx context.Context, dbUser string) error {
	dbUser = strings.TrimSpace(dbUser)
	if dbUser == "" {
		return nil
	}
	admin, err := sql.Open("mysql", s.adminDSN())
	if err != nil {
		return err
	}
	defer admin.Close()
	dropSQL := fmt.Sprintf("DROP USER IF EXISTS '%s'@'%%'", dbUser)
	if _, err := admin.ExecContext(ctx, dropSQL); err != nil {
		return err
	}
	_, _ = admin.ExecContext(ctx, "FLUSH PRIVILEGES")
	return nil
}

func (s *workspaceDBRoleService) revokeRole(ctx context.Context, workspaceID, actorID uuid.UUID, role *entity.WorkspaceDBRole, reason string, status string) (*entity.WorkspaceDBRole, error) {
	if role == nil {
		return nil, ErrWorkspaceDBRoleNotFound
	}
	if role.Status != workspaceDBRoleStatusActive {
		return role, nil
	}
	if err := s.dropDatabaseUser(ctx, role.DBUser); err != nil {
		return nil, ErrWorkspaceDBRoleRevokeFail
	}
	now := time.Now()
	role.Status = status
	role.RevokedAt = &now
	role.RevokedBy = &actorID
	if trimmed := strings.TrimSpace(reason); trimmed != "" {
		role.RevokedReason = &trimmed
	}
	if err := s.repo.Update(ctx, role); err != nil {
		return nil, err
	}

	action := "workspace.db.role.revoke"
	if status == workspaceDBRoleStatusExpired {
		action = "workspace.db.role.expired"
	}
	s.recordAudit(ctx, workspaceID, actorID, action, role, entity.JSON{
		"role_type": role.RoleType,
		"db_user":   role.DBUser,
		"status":    role.Status,
	})

	return role, nil
}

func (s *workspaceDBRoleService) recordAudit(ctx context.Context, workspaceID, actorID uuid.UUID, action string, role *entity.WorkspaceDBRole, metadata entity.JSON) {
	if s.auditLogService == nil || role == nil {
		return
	}
	if metadata == nil {
		metadata = entity.JSON{}
	}
	if role.ID != uuid.Nil {
		metadata["role_id"] = role.ID.String()
	}
	if role.ExpiresAt != nil {
		metadata["expires_at"] = role.ExpiresAt.Format(time.RFC3339)
	}
	_, _ = s.auditLogService.Record(ctx, AuditLogRecordRequest{
		WorkspaceID: workspaceID,
		ActorUserID: &actorID,
		Action:      action,
		TargetType:  "workspace_db_role",
		TargetID:    &role.ID,
		Metadata:    metadata,
	})
}

func normalizeWorkspaceDBRoleType(value string) string {
	normalized := strings.ToLower(strings.TrimSpace(value))
	normalized = strings.ReplaceAll(normalized, "-", "_")
	return normalized
}

func isValidWorkspaceDBRoleType(value string) bool {
	switch value {
	case workspaceDBRoleTypeRead, workspaceDBRoleTypeWrite, workspaceDBRoleTypeAdmin:
		return true
	default:
		return false
	}
}

func buildRoleGrantSQL(dbName, dbUser, roleType string) (string, error) {
	quotedDB := quoteIdentifier(dbName)
	switch roleType {
	case workspaceDBRoleTypeRead:
		return fmt.Sprintf("GRANT SELECT ON %s.* TO '%s'@'%%'", quotedDB, dbUser), nil
	case workspaceDBRoleTypeWrite:
		return fmt.Sprintf("GRANT SELECT, INSERT, UPDATE, DELETE ON %s.* TO '%s'@'%%'", quotedDB, dbUser), nil
	case workspaceDBRoleTypeAdmin:
		return fmt.Sprintf("GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, DROP ON %s.* TO '%s'@'%%'", quotedDB, dbUser), nil
	default:
		return "", ErrWorkspaceDBRoleInvalid
	}
}

func (s *workspaceDBRoleService) adminDSN() string {
	charset := strings.TrimSpace(s.dbConfig.Charset)
	if charset == "" {
		charset = "utf8mb4"
	}
	return fmt.Sprintf(
		"%s:%s@tcp(%s:%d)/?charset=%s&parseTime=True&loc=Local&multiStatements=true",
		s.dbConfig.User,
		s.dbConfig.Password,
		s.dbConfig.Host,
		s.dbConfig.Port,
		charset,
	)
}

func (s *workspaceDBRoleService) dbUserForRole(workspaceID uuid.UUID, roleType string) string {
	ws := strings.ReplaceAll(strings.ToLower(workspaceID.String()), "-", "")
	if len(ws) > 8 {
		ws = ws[:8]
	}
	roleSegment := roleType
	if roleType == workspaceDBRoleTypeRead {
		roleSegment = "r"
	} else if roleType == workspaceDBRoleTypeWrite {
		roleSegment = "w"
	} else if roleType == workspaceDBRoleTypeAdmin {
		roleSegment = "a"
	}
	user := fmt.Sprintf("%s%s_%s", workspaceDBRoleUserPrefix, ws, roleSegment)
	if len(user) > workspaceDBRoleUserMaxLength {
		user = user[:workspaceDBRoleUserMaxLength]
	}
	return user
}

func generateWorkspaceDBRolePassword() (string, error) {
	buf := make([]byte, workspaceDBRolePasswordBytesLength)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(buf), nil
}
