package service

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/reverseai/server/internal/config"
	"github.com/reverseai/server/internal/pkg/crypto"
	"github.com/reverseai/server/internal/repository"
	"gorm.io/gorm"
)

var (
	ErrWorkspaceDBNotReady      = errors.New("workspace database not ready")
	ErrWorkspaceDBSecretInvalid = errors.New("workspace database secret invalid")
)

// WorkspaceDBRuntime 提供运行时 DB 连接与权限校验
type WorkspaceDBRuntime interface {
	GetConnection(ctx context.Context, workspaceID string) (*sql.DB, error)
	EnsureAccess(ctx context.Context, workspaceID, userID string) error
}

type workspaceDBRuntime struct {
	repo             repository.WorkspaceDatabaseRepository
	workspaceService WorkspaceService
	encryptor        *crypto.Encryptor
	dbConfig         config.DatabaseConfig
	connections      sync.Map
}

// NewWorkspaceDBRuntime 创建运行时 DB 管理器
func NewWorkspaceDBRuntime(
	repo repository.WorkspaceDatabaseRepository,
	workspaceService WorkspaceService,
	dbConfig config.DatabaseConfig,
	encryptionKey string,
) (WorkspaceDBRuntime, error) {
	encryptor, err := crypto.NewEncryptor(encryptionKey)
	if err != nil {
		return nil, err
	}

	return &workspaceDBRuntime{
		repo:             repo,
		workspaceService: workspaceService,
		encryptor:        encryptor,
		dbConfig:         dbConfig,
	}, nil
}

func (r *workspaceDBRuntime) EnsureAccess(ctx context.Context, workspaceID, userID string) error {
	workspaceUUID, err := uuid.Parse(workspaceID)
	if err != nil {
		return ErrWorkspaceNotFound
	}
	userUUID, err := uuid.Parse(userID)
	if err != nil {
		return ErrWorkspaceUnauthorized
	}

	access, err := r.workspaceService.GetWorkspaceAccess(ctx, workspaceUUID, userUUID)
	if err != nil {
		return err
	}

	if !hasPermission(access.Permissions, PermissionWorkspaceDBAccess) {
		return ErrWorkspaceUnauthorized
	}

	return nil
}

func (r *workspaceDBRuntime) GetConnection(ctx context.Context, workspaceID string) (*sql.DB, error) {
	if workspaceID == "" {
		return nil, ErrWorkspaceNotFound
	}

	if cached, ok := r.connections.Load(workspaceID); ok {
		if db, ok := cached.(*sql.DB); ok {
			return db, nil
		}
	}

	workspaceUUID, err := uuid.Parse(workspaceID)
	if err != nil {
		return nil, ErrWorkspaceNotFound
	}

	record, err := r.repo.GetByWorkspaceID(ctx, workspaceUUID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrWorkspaceDatabaseNotFound
		}
		return nil, err
	}

	if strings.ToLower(strings.TrimSpace(record.Status)) != "ready" {
		return nil, ErrWorkspaceDBNotReady
	}

	password, err := r.decryptSecret(record.SecretRef)
	if err != nil {
		return nil, err
	}

	host := r.dbConfig.Host
	port := r.dbConfig.Port
	if record.DBHost != nil && strings.TrimSpace(*record.DBHost) != "" {
		host = strings.TrimSpace(*record.DBHost)
	}
	if record.DBPort != nil && *record.DBPort > 0 {
		port = *record.DBPort
	}

	charset := strings.TrimSpace(r.dbConfig.Charset)
	if charset == "" {
		charset = "utf8mb4"
	}

	dsn := fmt.Sprintf(
		"%s:%s@tcp(%s:%d)/%s?charset=%s&parseTime=True&loc=Local",
		record.DBUser,
		password,
		host,
		port,
		record.DBName,
		charset,
	)

	db, err := sql.Open("mysql", dsn)
	if err != nil {
		return nil, err
	}

	maxOpen := r.dbConfig.WorkspaceMaxOpenConns
	if maxOpen <= 0 {
		maxOpen = r.dbConfig.MaxOpenConns
		if maxOpen <= 0 {
			maxOpen = 10
		}
	}
	maxIdle := r.dbConfig.WorkspaceMaxIdleConns
	if maxIdle <= 0 {
		maxIdle = r.dbConfig.MaxIdleConns
		if maxIdle <= 0 {
			maxIdle = 5
		}
	}
	if maxOpen > 0 && maxIdle > maxOpen {
		maxIdle = maxOpen
	}

	db.SetMaxOpenConns(maxOpen)
	db.SetMaxIdleConns(maxIdle)

	maxLifetime := r.dbConfig.WorkspaceConnMaxLifetime
	if maxLifetime <= 0 {
		maxLifetime = time.Hour
	}
	db.SetConnMaxLifetime(maxLifetime)
	if r.dbConfig.WorkspaceConnMaxIdleTime > 0 {
		db.SetConnMaxIdleTime(r.dbConfig.WorkspaceConnMaxIdleTime)
	}

	if err := db.PingContext(ctx); err != nil {
		_ = db.Close()
		return nil, err
	}

	r.connections.Store(workspaceID, db)
	return db, nil
}

func (r *workspaceDBRuntime) decryptSecret(secretRef *string) (string, error) {
	if secretRef == nil {
		return "", ErrWorkspaceDBSecretInvalid
	}
	secret := strings.TrimSpace(*secretRef)
	if !strings.HasPrefix(secret, "enc:") {
		return "", ErrWorkspaceDBSecretInvalid
	}
	encrypted := strings.TrimPrefix(secret, "enc:")
	if encrypted == "" {
		return "", ErrWorkspaceDBSecretInvalid
	}
	return r.encryptor.Decrypt(encrypted)
}
