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
	"github.com/agentflow/server/internal/pkg/idempotency"
	"github.com/agentflow/server/internal/pkg/workspace_db"
	"github.com/agentflow/server/internal/repository"
	_ "github.com/go-sql-driver/mysql"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

const (
	workspaceDBStatusPending           = "pending"
	workspaceDBStatusProvisioning      = "provisioning"
	workspaceDBStatusReady             = "ready"
	workspaceDBStatusFailed            = "failed"
	workspaceDBDefaultCharset          = "utf8mb4"
	workspaceDBDefaultCollation        = "utf8mb4_unicode_ci"
	workspaceDBUserPrefix              = "wsu_"
	workspaceDBNamePrefix              = "ws_"
	workspaceDBBackupPrefix            = "wsb_"
	workspaceDBUserMaxLength           = 32
	workspaceDBNameMaxLength           = 63
	workspaceDBPasswordBytesLength     = 24
	workspaceDBQuotaDimension          = "db_storage_gb"
	workspaceDBReservedStorageGB       = 1
	workspaceDBProvisionMaxAttempts    = 3
	workspaceDBProvisionInitialBackoff = 300 * time.Millisecond
	workspaceDBProvisionMaxBackoff     = 3 * time.Second
)

const workspaceDBMigrationTableSQL = `
CREATE TABLE IF NOT EXISTS workspace_db_migrations (
	version VARCHAR(64) PRIMARY KEY,
	applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`

var (
	ErrWorkspaceDatabaseNotFound                   = errors.New("workspace database not found")
	ErrWorkspaceDatabaseExists                     = errors.New("workspace database already exists")
	ErrWorkspaceDatabaseProvisionFailed            = errors.New("workspace database provision failed")
	ErrWorkspaceDatabaseNotReady                   = errors.New("workspace database not ready")
	ErrWorkspaceDatabaseRotateFailed               = errors.New("workspace database rotate failed")
	ErrWorkspaceDatabaseMigrationFailed            = errors.New("workspace database migration failed")
	ErrWorkspaceDatabaseMigrationLocked            = errors.New("workspace database migration locked")
	ErrWorkspaceDatabaseBackupFailed               = errors.New("workspace database backup failed")
	ErrWorkspaceDatabaseRestoreFailed              = errors.New("workspace database restore failed")
	ErrWorkspaceDatabaseBackupNotFound             = errors.New("workspace database backup not found")
	ErrWorkspaceDatabaseQuotaExceeded              = errors.New("workspace database quota exceeded")
	ErrWorkspaceDBSchemaMigrationNotFound          = errors.New("workspace db schema migration not found")
	ErrWorkspaceDBSchemaMigrationActive            = errors.New("workspace db schema migration already active")
	ErrWorkspaceDBSchemaMigrationReviewUnavailable = errors.New("workspace db schema migration review unavailable")
	ErrWorkspaceDBSchemaMigrationNoPending         = errors.New("workspace db schema migration has no pending changes")
	ErrWorkspaceDBSchemaMigrationBlocked           = errors.New("workspace db schema migration blocked by precheck")
	ErrWorkspaceDBSchemaMigrationNotApproved       = errors.New("workspace db schema migration not approved")
	ErrWorkspaceDBSchemaMigrationInvalidVerifySQL  = errors.New("workspace db schema migration verify sql invalid")
)

// WorkspaceDatabaseService 工作空间数据库服务接口
type WorkspaceDatabaseService interface {
	Provision(ctx context.Context, workspaceID, ownerID uuid.UUID) (*entity.WorkspaceDatabase, error)
	GetByWorkspaceID(ctx context.Context, workspaceID, ownerID uuid.UUID) (*entity.WorkspaceDatabase, error)
	RotateSecret(ctx context.Context, workspaceID, ownerID uuid.UUID) (*entity.WorkspaceDatabase, error)
	Migrate(ctx context.Context, workspaceID, ownerID uuid.UUID) (*WorkspaceDBMigrationResult, error)
	Backup(ctx context.Context, workspaceID, ownerID uuid.UUID) (*WorkspaceDBBackupResult, error)
	Restore(ctx context.Context, workspaceID, ownerID uuid.UUID, backupID string) (*WorkspaceDBRestoreResult, error)
	PreviewDBSchemaMigration(ctx context.Context, workspaceID, ownerID uuid.UUID) (*WorkspaceDBSchemaMigrationPlan, *WorkspaceDBSchemaMigrationPrecheck, error)
	SubmitDBSchemaMigration(ctx context.Context, workspaceID, ownerID uuid.UUID, req SubmitWorkspaceDBSchemaMigrationRequest) (*entity.WorkspaceDBSchemaMigration, error)
	GetDBSchemaMigration(ctx context.Context, workspaceID, ownerID, migrationID uuid.UUID) (*entity.WorkspaceDBSchemaMigration, error)
	ApproveDBSchemaMigration(ctx context.Context, reviewerUserID, workspaceID, migrationID uuid.UUID, req ApproveWorkspaceDBSchemaMigrationRequest) (*entity.WorkspaceDBSchemaMigration, error)
	RejectDBSchemaMigration(ctx context.Context, reviewerUserID, workspaceID, migrationID uuid.UUID, req RejectWorkspaceDBSchemaMigrationRequest) (*entity.WorkspaceDBSchemaMigration, error)
	ExecuteDBSchemaMigration(ctx context.Context, workspaceID, ownerID, migrationID uuid.UUID) (*entity.WorkspaceDBSchemaMigration, error)
}

// WorkspaceDBMigrationResult 迁移结果
type WorkspaceDBMigrationResult struct {
	Applied        []string `json:"applied"`
	CurrentVersion string   `json:"current_version"`
}

// WorkspaceDBBackupResult 备份结果
type WorkspaceDBBackupResult struct {
	BackupID string `json:"backup_id"`
	Database string `json:"database"`
	Tables   int    `json:"tables"`
}

// WorkspaceDBRestoreResult 恢复结果
type WorkspaceDBRestoreResult struct {
	BackupID       string `json:"backup_id"`
	RestoredTables int    `json:"restored_tables"`
}

type workspaceDatabaseService struct {
	repo             repository.WorkspaceDatabaseRepository
	workspaceService WorkspaceService
	billingService   BillingService
	encryptor        *crypto.Encryptor
	dbConfig         config.DatabaseConfig
	eventRecorder    EventRecorderService
	idempotencyRepo  repository.IdempotencyKeyRepository
	reviewQueueRepo  repository.ReviewQueueRepository
	migrationRepo    repository.WorkspaceDBSchemaMigrationRepository
}

// NewWorkspaceDatabaseService 创建工作空间数据库服务
func NewWorkspaceDatabaseService(
	repo repository.WorkspaceDatabaseRepository,
	workspaceService WorkspaceService,
	billingService BillingService,
	eventRecorder EventRecorderService,
	reviewQueueRepo repository.ReviewQueueRepository,
	migrationRepo repository.WorkspaceDBSchemaMigrationRepository,
	idempotencyRepo repository.IdempotencyKeyRepository,
	dbConfig config.DatabaseConfig,
	encryptionKey string,
) (WorkspaceDatabaseService, error) {
	encryptor, err := crypto.NewEncryptor(encryptionKey)
	if err != nil {
		return nil, err
	}

	return &workspaceDatabaseService{
		repo:             repo,
		workspaceService: workspaceService,
		billingService:   billingService,
		encryptor:        encryptor,
		dbConfig:         dbConfig,
		eventRecorder:    eventRecorder,
		idempotencyRepo:  idempotencyRepo,
		reviewQueueRepo:  reviewQueueRepo,
		migrationRepo:    migrationRepo,
	}, nil
}

func (s *workspaceDatabaseService) Provision(ctx context.Context, workspaceID, ownerID uuid.UUID) (*entity.WorkspaceDatabase, error) {
	if _, err := s.workspaceService.GetByID(ctx, workspaceID, ownerID); err != nil {
		return nil, err
	}

	var idempotencyRecord *entity.IdempotencyKey
	idempotencyKey := idempotency.KeyFromContext(ctx)
	if idempotencyKey != "" && s.idempotencyRepo != nil {
		requestHash := idempotency.HashValue(map[string]interface{}{
			"workspace_id": workspaceID.String(),
			"owner_id":     ownerID.String(),
		})
		result, err := beginIdempotency(ctx, s.idempotencyRepo, ownerID, idempotencyKey, "workspace_db.provision", requestHash, idempotencyScope{
			WorkspaceID: &workspaceID,
		})
		if err != nil {
			return nil, err
		}
		if result != nil && result.Replay {
			existing, err := s.repo.GetByWorkspaceID(ctx, workspaceID)
			if err == nil {
				return existing, nil
			}
			return nil, ErrWorkspaceDatabaseNotFound
		}
		if result != nil {
			idempotencyRecord = result.Record
		}
	}

	existing, err := s.repo.GetByWorkspaceID(ctx, workspaceID)
	if err == nil && existing != nil {
		if existing.Status == workspaceDBStatusReady || existing.Status == workspaceDBStatusProvisioning {
			if idempotencyRecord != nil {
				completeIdempotency(ctx, s.idempotencyRepo, idempotencyRecord, "workspace_database", existing.ID)
				return existing, nil
			}
			return nil, ErrWorkspaceDatabaseExists
		}
		if err := s.ensureProvisionQuota(ctx, ownerID, workspaceID, existing); err != nil {
			failIdempotency(ctx, s.idempotencyRepo, idempotencyRecord)
			return nil, err
		}
		provisioned, err := s.provisionExisting(ctx, existing)
		if err != nil {
			failIdempotency(ctx, s.idempotencyRepo, idempotencyRecord)
			return nil, err
		}
		if err := s.consumeProvisionQuota(ctx, ownerID, provisioned); err != nil {
			failIdempotency(ctx, s.idempotencyRepo, idempotencyRecord)
			return nil, err
		}
		completeIdempotency(ctx, s.idempotencyRepo, idempotencyRecord, "workspace_database", provisioned.ID)
		return provisioned, nil
	}
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		failIdempotency(ctx, s.idempotencyRepo, idempotencyRecord)
		return nil, err
	}

	if err := s.ensureProvisionQuota(ctx, ownerID, workspaceID, nil); err != nil {
		failIdempotency(ctx, s.idempotencyRepo, idempotencyRecord)
		return nil, err
	}

	record := &entity.WorkspaceDatabase{
		WorkspaceID: workspaceID,
		DBName:      s.databaseNameForWorkspace(workspaceID),
		DBUser:      s.databaseUserForWorkspace(workspaceID),
		Status:      workspaceDBStatusProvisioning,
	}
	if err := s.repo.Create(ctx, record); err != nil {
		failIdempotency(ctx, s.idempotencyRepo, idempotencyRecord)
		return nil, err
	}
	if idempotencyRecord != nil {
		idempotencyRecord.ResourceType = "workspace_database"
		idempotencyRecord.ResourceID = &record.ID
		_ = s.idempotencyRepo.Update(ctx, idempotencyRecord)
	}

	provisioned, err := s.provisionExisting(ctx, record)
	if err != nil {
		failIdempotency(ctx, s.idempotencyRepo, idempotencyRecord)
		return nil, err
	}
	if err := s.consumeProvisionQuota(ctx, ownerID, provisioned); err != nil {
		failIdempotency(ctx, s.idempotencyRepo, idempotencyRecord)
		return nil, err
	}
	completeIdempotency(ctx, s.idempotencyRepo, idempotencyRecord, "workspace_database", provisioned.ID)
	return provisioned, nil
}

func (s *workspaceDatabaseService) GetByWorkspaceID(ctx context.Context, workspaceID, ownerID uuid.UUID) (*entity.WorkspaceDatabase, error) {
	if _, err := s.workspaceService.GetByID(ctx, workspaceID, ownerID); err != nil {
		return nil, err
	}

	database, err := s.repo.GetByWorkspaceID(ctx, workspaceID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrWorkspaceDatabaseNotFound
		}
		return nil, err
	}

	return database, nil
}

func (s *workspaceDatabaseService) Migrate(ctx context.Context, workspaceID, ownerID uuid.UUID) (*WorkspaceDBMigrationResult, error) {
	if _, err := s.workspaceService.GetByID(ctx, workspaceID, ownerID); err != nil {
		return nil, err
	}

	database, err := s.repo.GetByWorkspaceID(ctx, workspaceID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrWorkspaceDatabaseNotFound
		}
		return nil, err
	}

	if database.Status != workspaceDBStatusReady {
		return nil, ErrWorkspaceDatabaseNotReady
	}
	if strings.TrimSpace(database.DBUser) == "" || strings.TrimSpace(database.DBName) == "" {
		return nil, ErrWorkspaceDatabaseNotReady
	}

	password, err := s.decryptSecretRef(database.SecretRef)
	if err != nil {
		return nil, ErrWorkspaceDatabaseNotReady
	}

	dsn := s.workspaceDSN(database, password)
	workspaceDB, err := sql.Open("mysql", dsn)
	if err != nil {
		return nil, ErrWorkspaceDatabaseMigrationFailed
	}
	defer workspaceDB.Close()

	if err := s.acquireMigrationLock(ctx, workspaceDB, workspaceID); err != nil {
		return nil, err
	}
	defer s.releaseMigrationLock(ctx, workspaceDB, workspaceID)

	return s.runWorkspaceMigrations(ctx, workspaceDB)
}

func (s *workspaceDatabaseService) Backup(ctx context.Context, workspaceID, ownerID uuid.UUID) (*WorkspaceDBBackupResult, error) {
	if _, err := s.workspaceService.GetByID(ctx, workspaceID, ownerID); err != nil {
		return nil, err
	}

	database, err := s.repo.GetByWorkspaceID(ctx, workspaceID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrWorkspaceDatabaseNotFound
		}
		return nil, err
	}

	if database.Status != workspaceDBStatusReady {
		return nil, ErrWorkspaceDatabaseNotReady
	}
	if strings.TrimSpace(database.DBName) == "" {
		return nil, ErrWorkspaceDatabaseNotReady
	}

	backupID := s.backupDatabaseName(database.WorkspaceID)
	admin, err := sql.Open("mysql", s.adminDSN())
	if err != nil {
		return nil, ErrWorkspaceDatabaseBackupFailed
	}
	defer admin.Close()

	if err := s.createDatabase(ctx, admin, backupID); err != nil {
		return nil, ErrWorkspaceDatabaseBackupFailed
	}

	tables, err := s.listDatabaseTables(ctx, admin, database.DBName)
	if err != nil {
		_ = s.dropDatabase(ctx, admin, backupID)
		return nil, ErrWorkspaceDatabaseBackupFailed
	}

	if err := s.copyTables(ctx, admin, database.DBName, backupID, tables); err != nil {
		_ = s.dropDatabase(ctx, admin, backupID)
		return nil, ErrWorkspaceDatabaseBackupFailed
	}

	return &WorkspaceDBBackupResult{
		BackupID: backupID,
		Database: database.DBName,
		Tables:   len(tables),
	}, nil
}

func (s *workspaceDatabaseService) Restore(ctx context.Context, workspaceID, ownerID uuid.UUID, backupID string) (*WorkspaceDBRestoreResult, error) {
	if _, err := s.workspaceService.GetByID(ctx, workspaceID, ownerID); err != nil {
		return nil, err
	}

	database, err := s.repo.GetByWorkspaceID(ctx, workspaceID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrWorkspaceDatabaseNotFound
		}
		return nil, err
	}

	if database.Status != workspaceDBStatusReady {
		return nil, ErrWorkspaceDatabaseNotReady
	}
	if strings.TrimSpace(database.DBName) == "" {
		return nil, ErrWorkspaceDatabaseNotReady
	}

	backupID = strings.TrimSpace(backupID)
	if backupID == "" || !isSafeIdentifier(backupID) {
		return nil, ErrWorkspaceDatabaseBackupNotFound
	}

	admin, err := sql.Open("mysql", s.adminDSN())
	if err != nil {
		return nil, ErrWorkspaceDatabaseRestoreFailed
	}
	defer admin.Close()

	exists, err := s.databaseExists(ctx, admin, backupID)
	if err != nil || !exists {
		return nil, ErrWorkspaceDatabaseBackupNotFound
	}

	backupTables, err := s.listDatabaseTables(ctx, admin, backupID)
	if err != nil {
		return nil, ErrWorkspaceDatabaseRestoreFailed
	}

	targetTables, err := s.listDatabaseTables(ctx, admin, database.DBName)
	if err != nil {
		return nil, ErrWorkspaceDatabaseRestoreFailed
	}

	if err := s.dropTables(ctx, admin, database.DBName, targetTables); err != nil {
		return nil, ErrWorkspaceDatabaseRestoreFailed
	}

	if err := s.copyTables(ctx, admin, backupID, database.DBName, backupTables); err != nil {
		return nil, ErrWorkspaceDatabaseRestoreFailed
	}

	return &WorkspaceDBRestoreResult{
		BackupID:       backupID,
		RestoredTables: len(backupTables),
	}, nil
}

func (s *workspaceDatabaseService) RotateSecret(ctx context.Context, workspaceID, ownerID uuid.UUID) (*entity.WorkspaceDatabase, error) {
	if _, err := s.workspaceService.GetByID(ctx, workspaceID, ownerID); err != nil {
		return nil, err
	}

	database, err := s.repo.GetByWorkspaceID(ctx, workspaceID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrWorkspaceDatabaseNotFound
		}
		return nil, err
	}

	if database.Status != workspaceDBStatusReady {
		return nil, ErrWorkspaceDatabaseNotReady
	}

	password, err := generateWorkspaceDBPassword()
	if err != nil {
		return nil, ErrWorkspaceDatabaseRotateFailed
	}
	encrypted, err := s.encryptor.Encrypt(password)
	if err != nil {
		return nil, ErrWorkspaceDatabaseRotateFailed
	}

	if err := s.updateDatabaseUserPassword(ctx, database.DBUser, password); err != nil {
		return nil, ErrWorkspaceDatabaseRotateFailed
	}

	secretRef := fmt.Sprintf("enc:%s", encrypted)
	database.SecretRef = &secretRef
	database.Status = workspaceDBStatusReady

	if err := s.repo.Update(ctx, database); err != nil {
		return nil, err
	}

	return database, nil
}

func (s *workspaceDatabaseService) provisionExisting(ctx context.Context, record *entity.WorkspaceDatabase) (*entity.WorkspaceDatabase, error) {
	startedAt := time.Now()
	if record.DBName == "" {
		record.DBName = s.databaseNameForWorkspace(record.WorkspaceID)
	}
	if record.DBUser == "" {
		record.DBUser = s.databaseUserForWorkspace(record.WorkspaceID)
	}
	record.Status = workspaceDBStatusProvisioning
	if err := s.repo.Update(ctx, record); err != nil {
		return nil, err
	}

	provisioned, err := s.provisionWithRetry(ctx, record)
	if err != nil {
		s.rollbackProvisioning(ctx, record)
		s.recordProvisionFailed(ctx, record, startedAt, err)
		return s.failProvision(ctx, record)
	}

	return provisioned, nil
}

func (s *workspaceDatabaseService) recordProvisionFailed(ctx context.Context, record *entity.WorkspaceDatabase, startedAt time.Time, err error) {
	if s.eventRecorder == nil || record == nil {
		return
	}
	durationMs := time.Since(startedAt).Milliseconds()
	if durationMs < 0 {
		durationMs = 0
	}
	_ = s.eventRecorder.RecordDBEvent(ctx, entity.EventDBProvisionFailed, record.WorkspaceID, durationMs, err)
}

func (s *workspaceDatabaseService) provisionWithRetry(ctx context.Context, record *entity.WorkspaceDatabase) (*entity.WorkspaceDatabase, error) {
	backoff := workspaceDBProvisionInitialBackoff
	var lastErr error

	for attempt := 1; attempt <= workspaceDBProvisionMaxAttempts; attempt++ {
		provisioned, err := s.provisionOnce(ctx, record)
		if err == nil {
			return provisioned, nil
		}
		lastErr = err
		if attempt >= workspaceDBProvisionMaxAttempts {
			break
		}
		if ctx.Err() != nil {
			break
		}

		s.rollbackProvisioning(ctx, record)

		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		case <-time.After(backoff):
		}
		next := backoff * 2
		if next > workspaceDBProvisionMaxBackoff {
			next = workspaceDBProvisionMaxBackoff
		}
		backoff = next
	}

	if lastErr == nil {
		lastErr = ErrWorkspaceDatabaseProvisionFailed
	}
	return nil, lastErr
}

func (s *workspaceDatabaseService) provisionOnce(ctx context.Context, record *entity.WorkspaceDatabase) (*entity.WorkspaceDatabase, error) {
	password, err := generateWorkspaceDBPassword()
	if err != nil {
		return nil, err
	}
	encrypted, err := s.encryptor.Encrypt(password)
	if err != nil {
		return nil, err
	}

	if err := s.createDatabaseAndUser(ctx, record.DBName, record.DBUser, password); err != nil {
		return nil, err
	}
	if err := s.initializeWorkspaceSchema(ctx, record.DBName, record.DBUser, password, record.WorkspaceID); err != nil {
		return nil, err
	}

	host := s.dbConfig.Host
	port := s.dbConfig.Port
	secretRef := fmt.Sprintf("enc:%s", encrypted)

	record.DBHost = &host
	record.DBPort = &port
	record.SecretRef = &secretRef
	record.Status = workspaceDBStatusReady

	if err := s.repo.Update(ctx, record); err != nil {
		return nil, err
	}

	return record, nil
}

func (s *workspaceDatabaseService) failProvision(ctx context.Context, record *entity.WorkspaceDatabase) (*entity.WorkspaceDatabase, error) {
	record.Status = workspaceDBStatusFailed
	_ = s.repo.Update(ctx, record)
	return nil, ErrWorkspaceDatabaseProvisionFailed
}

func (s *workspaceDatabaseService) rollbackProvisioning(ctx context.Context, record *entity.WorkspaceDatabase) {
	if record == nil {
		return
	}
	if strings.TrimSpace(record.DBName) == "" && strings.TrimSpace(record.DBUser) == "" {
		return
	}
	admin, err := sql.Open("mysql", s.adminDSN())
	if err != nil {
		return
	}
	defer admin.Close()

	if strings.TrimSpace(record.DBName) != "" {
		_ = s.dropDatabase(ctx, admin, record.DBName)
	}
	if strings.TrimSpace(record.DBUser) != "" {
		_ = s.dropDatabaseUser(ctx, admin, record.DBUser)
	}
}

func (s *workspaceDatabaseService) ensureProvisionQuota(ctx context.Context, ownerID, workspaceID uuid.UUID, record *entity.WorkspaceDatabase) error {
	if s.billingService == nil {
		return nil
	}
	if !s.shouldConsumeProvisionQuota(record) {
		return nil
	}
	if workspaceDBReservedStorageGB <= 0 {
		return nil
	}

	quota, _, err := s.billingService.GetWorkspaceQuota(ctx, ownerID, workspaceID)
	if err != nil {
		return err
	}
	limits := jsonToFloatMap(quota.Limits)
	usage := jsonToFloatMap(quota.Usage)
	limit, ok := limits[workspaceDBQuotaDimension]
	if !ok {
		return nil
	}
	if limit >= 0 && usage[workspaceDBQuotaDimension]+workspaceDBReservedStorageGB > limit {
		return ErrWorkspaceDatabaseQuotaExceeded
	}
	return nil
}

func (s *workspaceDatabaseService) consumeProvisionQuota(ctx context.Context, ownerID uuid.UUID, record *entity.WorkspaceDatabase) error {
	if s.billingService == nil || record == nil {
		return nil
	}
	if !s.shouldConsumeProvisionQuota(record) {
		return nil
	}
	if workspaceDBReservedStorageGB <= 0 {
		return nil
	}

	result, err := s.billingService.ConsumeUsage(ctx, ownerID, record.WorkspaceID, ConsumeUsageRequest{
		Usage: map[string]float64{
			workspaceDBQuotaDimension: workspaceDBReservedStorageGB,
		},
	})
	if err != nil {
		return err
	}
	if result != nil && !result.Allowed {
		record.Status = workspaceDBStatusFailed
		_ = s.repo.Update(ctx, record)
		return ErrWorkspaceDatabaseQuotaExceeded
	}
	return nil
}

func (s *workspaceDatabaseService) shouldConsumeProvisionQuota(record *entity.WorkspaceDatabase) bool {
	if record == nil || record.SecretRef == nil {
		return true
	}
	return strings.TrimSpace(*record.SecretRef) == ""
}

func (s *workspaceDatabaseService) databaseNameForWorkspace(workspaceID uuid.UUID) string {
	cleaned := strings.ReplaceAll(strings.ToLower(workspaceID.String()), "-", "")
	name := workspaceDBNamePrefix + cleaned
	if len(name) > workspaceDBNameMaxLength {
		name = name[:workspaceDBNameMaxLength]
	}
	return name
}

func (s *workspaceDatabaseService) databaseUserForWorkspace(workspaceID uuid.UUID) string {
	cleaned := strings.ReplaceAll(strings.ToLower(workspaceID.String()), "-", "")
	maxLength := workspaceDBUserMaxLength - len(workspaceDBUserPrefix)
	if len(cleaned) > maxLength {
		cleaned = cleaned[:maxLength]
	}
	return workspaceDBUserPrefix + cleaned
}

func (s *workspaceDatabaseService) backupDatabaseName(workspaceID uuid.UUID) string {
	cleaned := strings.ReplaceAll(strings.ToLower(workspaceID.String()), "-", "")
	timestamp := time.Now().UTC().Format("20060102150405")
	name := fmt.Sprintf("%s%s_%s", workspaceDBBackupPrefix, cleaned, timestamp)
	if len(name) > workspaceDBNameMaxLength {
		name = name[:workspaceDBNameMaxLength]
	}
	return name
}

func (s *workspaceDatabaseService) createDatabaseAndUser(ctx context.Context, dbName, dbUser, password string) error {
	admin, err := sql.Open("mysql", s.adminDSN())
	if err != nil {
		return err
	}
	defer admin.Close()

	charset := s.databaseCharset()
	createDBSQL := fmt.Sprintf(
		"CREATE DATABASE IF NOT EXISTS `%s` CHARACTER SET %s COLLATE %s",
		dbName,
		charset,
		workspaceDBDefaultCollation,
	)
	if _, err := admin.ExecContext(ctx, createDBSQL); err != nil {
		return err
	}

	escapedPassword := escapeMySQLString(password)
	createUserSQL := fmt.Sprintf(
		"CREATE USER IF NOT EXISTS '%s'@'%%' IDENTIFIED BY '%s'",
		dbUser,
		escapedPassword,
	)
	if _, err := admin.ExecContext(ctx, createUserSQL); err != nil {
		return err
	}

	grantSQL := fmt.Sprintf(
		"GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, DROP ON `%s`.* TO '%s'@'%%'",
		dbName,
		dbUser,
	)
	if _, err := admin.ExecContext(ctx, grantSQL); err != nil {
		return err
	}

	if _, err := admin.ExecContext(ctx, "FLUSH PRIVILEGES"); err != nil {
		return err
	}

	return nil
}

func (s *workspaceDatabaseService) createDatabase(ctx context.Context, db *sql.DB, name string) error {
	charset := s.databaseCharset()
	createSQL := fmt.Sprintf(
		"CREATE DATABASE IF NOT EXISTS %s CHARACTER SET %s COLLATE %s",
		quoteIdentifier(name),
		charset,
		workspaceDBDefaultCollation,
	)
	_, err := db.ExecContext(ctx, createSQL)
	return err
}

func (s *workspaceDatabaseService) dropDatabase(ctx context.Context, db *sql.DB, name string) error {
	dropSQL := fmt.Sprintf("DROP DATABASE IF EXISTS %s", quoteIdentifier(name))
	_, err := db.ExecContext(ctx, dropSQL)
	return err
}

func (s *workspaceDatabaseService) dropDatabaseUser(ctx context.Context, db *sql.DB, dbUser string) error {
	dbUser = strings.TrimSpace(dbUser)
	if dbUser == "" {
		return nil
	}
	dropSQL := fmt.Sprintf("DROP USER IF EXISTS '%s'@'%%'", dbUser)
	if _, err := db.ExecContext(ctx, dropSQL); err != nil {
		return err
	}
	_, _ = db.ExecContext(ctx, "FLUSH PRIVILEGES")
	return nil
}

func (s *workspaceDatabaseService) databaseExists(ctx context.Context, db *sql.DB, name string) (bool, error) {
	var count int64
	err := db.QueryRowContext(
		ctx,
		"SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name = ?",
		name,
	).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func (s *workspaceDatabaseService) listDatabaseTables(ctx context.Context, db *sql.DB, name string) ([]string, error) {
	rows, err := db.QueryContext(
		ctx,
		"SELECT table_name FROM information_schema.tables WHERE table_schema = ? AND table_type = 'BASE TABLE' ORDER BY table_name",
		name,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	tables := []string{}
	for rows.Next() {
		var table string
		if err := rows.Scan(&table); err != nil {
			return nil, err
		}
		tables = append(tables, table)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return tables, nil
}

func (s *workspaceDatabaseService) copyTables(ctx context.Context, db *sql.DB, sourceDB, targetDB string, tables []string) error {
	for _, table := range tables {
		source := fmt.Sprintf("%s.%s", quoteIdentifier(sourceDB), quoteIdentifier(table))
		target := fmt.Sprintf("%s.%s", quoteIdentifier(targetDB), quoteIdentifier(table))

		createSQL := fmt.Sprintf("CREATE TABLE %s LIKE %s", target, source)
		if _, err := db.ExecContext(ctx, createSQL); err != nil {
			return err
		}
		insertSQL := fmt.Sprintf("INSERT INTO %s SELECT * FROM %s", target, source)
		if _, err := db.ExecContext(ctx, insertSQL); err != nil {
			return err
		}
	}
	return nil
}

func (s *workspaceDatabaseService) dropTables(ctx context.Context, db *sql.DB, database string, tables []string) error {
	for _, table := range tables {
		target := fmt.Sprintf("%s.%s", quoteIdentifier(database), quoteIdentifier(table))
		dropSQL := fmt.Sprintf("DROP TABLE IF EXISTS %s", target)
		if _, err := db.ExecContext(ctx, dropSQL); err != nil {
			return err
		}
	}
	return nil
}

func isSafeIdentifier(value string) bool {
	for _, r := range value {
		if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') || r == '_' {
			continue
		}
		return false
	}
	return true
}

func quoteIdentifier(value string) string {
	if value == "" {
		return "``"
	}
	escaped := strings.ReplaceAll(value, "`", "``")
	return "`" + escaped + "`"
}

func (s *workspaceDatabaseService) updateDatabaseUserPassword(ctx context.Context, dbUser, password string) error {
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

	if _, err := admin.ExecContext(ctx, "FLUSH PRIVILEGES"); err != nil {
		return err
	}

	return nil
}

func (s *workspaceDatabaseService) decryptSecretRef(secretRef *string) (string, error) {
	if secretRef == nil {
		return "", ErrWorkspaceDatabaseNotReady
	}
	value := strings.TrimSpace(*secretRef)
	if value == "" {
		return "", ErrWorkspaceDatabaseNotReady
	}
	trimmed := strings.TrimPrefix(value, "enc:")
	if trimmed == value {
		return "", ErrWorkspaceDatabaseNotReady
	}
	value = trimmed
	if value == "" {
		return "", ErrWorkspaceDatabaseNotReady
	}
	return s.encryptor.Decrypt(value)
}

func (s *workspaceDatabaseService) workspaceDSN(database *entity.WorkspaceDatabase, password string) string {
	host := s.dbConfig.Host
	if database.DBHost != nil && strings.TrimSpace(*database.DBHost) != "" {
		host = strings.TrimSpace(*database.DBHost)
	}
	port := s.dbConfig.Port
	if database.DBPort != nil && *database.DBPort > 0 {
		port = *database.DBPort
	}
	return fmt.Sprintf(
		"%s:%s@tcp(%s:%d)/%s?charset=%s&parseTime=True&loc=Local&multiStatements=true",
		database.DBUser,
		password,
		host,
		port,
		database.DBName,
		s.databaseCharset(),
	)
}

func (s *workspaceDatabaseService) fetchAppliedMigrations(ctx context.Context, db *sql.DB) (map[string]bool, error) {
	applied := make(map[string]bool)
	rows, err := db.QueryContext(ctx, "SELECT version FROM workspace_db_migrations")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var version string
		if err := rows.Scan(&version); err != nil {
			return nil, err
		}
		applied[version] = true
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	return applied, nil
}

func (s *workspaceDatabaseService) insertAppliedMigration(ctx context.Context, db *sql.DB, version string) error {
	_, err := db.ExecContext(ctx, "INSERT INTO workspace_db_migrations (version) VALUES (?)", version)
	return err
}

func (s *workspaceDatabaseService) rollbackMigration(ctx context.Context, db *sql.DB, downSQL string) {
	if strings.TrimSpace(downSQL) == "" {
		return
	}
	_, _ = db.ExecContext(ctx, downSQL)
}

func (s *workspaceDatabaseService) initializeWorkspaceSchema(ctx context.Context, dbName, dbUser, password string, workspaceID uuid.UUID) error {
	dsn := fmt.Sprintf(
		"%s:%s@tcp(%s:%d)/%s?charset=%s&parseTime=True&loc=Local",
		dbUser,
		password,
		s.dbConfig.Host,
		s.dbConfig.Port,
		dbName,
		s.databaseCharset(),
	)
	workspaceDB, err := sql.Open("mysql", dsn)
	if err != nil {
		return err
	}
	defer workspaceDB.Close()

	if _, err := s.runWorkspaceMigrations(ctx, workspaceDB); err != nil {
		return err
	}

	if _, err := workspaceDB.ExecContext(ctx, "INSERT IGNORE INTO workspace_meta (workspace_id) VALUES (?)", workspaceID.String()); err != nil {
		return err
	}

	return nil
}

func (s *workspaceDatabaseService) runWorkspaceMigrations(ctx context.Context, workspaceDB *sql.DB) (*WorkspaceDBMigrationResult, error) {
	if workspaceDB == nil {
		return nil, ErrWorkspaceDatabaseMigrationFailed
	}
	if _, err := workspaceDB.ExecContext(ctx, workspaceDBMigrationTableSQL); err != nil {
		return nil, ErrWorkspaceDatabaseMigrationFailed
	}

	migrations, err := workspace_db.LoadMigrations()
	if err != nil {
		return nil, ErrWorkspaceDatabaseMigrationFailed
	}

	appliedSet, err := s.fetchAppliedMigrations(ctx, workspaceDB)
	if err != nil {
		return nil, ErrWorkspaceDatabaseMigrationFailed
	}

	result := &WorkspaceDBMigrationResult{
		Applied:        []string{},
		CurrentVersion: "",
	}

	for _, migration := range migrations {
		if appliedSet[migration.Version] {
			result.CurrentVersion = migration.Version
			continue
		}

		if strings.TrimSpace(migration.UpSQL) == "" {
			continue
		}

		if _, err := workspaceDB.ExecContext(ctx, migration.UpSQL); err != nil {
			s.rollbackMigration(ctx, workspaceDB, migration.DownSQL)
			return nil, ErrWorkspaceDatabaseMigrationFailed
		}

		if err := s.insertAppliedMigration(ctx, workspaceDB, migration.Version); err != nil {
			s.rollbackMigration(ctx, workspaceDB, migration.DownSQL)
			return nil, ErrWorkspaceDatabaseMigrationFailed
		}

		appliedSet[migration.Version] = true
		result.Applied = append(result.Applied, migration.Version)
		result.CurrentVersion = migration.Version
	}

	return result, nil
}

func (s *workspaceDatabaseService) adminDSN() string {
	return fmt.Sprintf(
		"%s:%s@tcp(%s:%d)/?charset=%s&parseTime=True&loc=Local&multiStatements=true",
		s.dbConfig.User,
		s.dbConfig.Password,
		s.dbConfig.Host,
		s.dbConfig.Port,
		s.databaseCharset(),
	)
}

func (s *workspaceDatabaseService) databaseCharset() string {
	charset := strings.TrimSpace(s.dbConfig.Charset)
	if charset == "" {
		return workspaceDBDefaultCharset
	}
	return charset
}

func generateWorkspaceDBPassword() (string, error) {
	buf := make([]byte, workspaceDBPasswordBytesLength)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(buf), nil
}

func escapeMySQLString(value string) string {
	value = strings.ReplaceAll(value, "\\", "\\\\")
	value = strings.ReplaceAll(value, "'", "\\'")
	return value
}
