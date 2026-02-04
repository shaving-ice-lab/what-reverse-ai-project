package service

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/pkg/crypto"
	"github.com/agentflow/server/internal/repository"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

var (
	ErrSecretNotFound   = errors.New("secret not found")
	ErrInvalidSecret    = errors.New("invalid secret")
	ErrSecretRevoked    = errors.New("secret revoked")
	ErrInvalidOwnerType = errors.New("invalid owner type")
	ErrInvalidScope     = errors.New("invalid scope")
)

const (
	SecretOwnerUser      = "user"
	SecretOwnerWorkspace = "workspace"

	secretTypeOAuthToken = "oauth_token"
	secretTypeAPIToken   = "api_token"

	SecretStatusActive  = "active"
	SecretStatusRevoked = "revoked"
)

var connectorSecretTypes = map[string]struct{}{
	secretTypeOAuthToken: {},
	secretTypeAPIToken:   {},
}

// SecretFilter 机密筛选条件
type SecretFilter struct {
	OwnerType  string
	OwnerID    *uuid.UUID
	SecretType *string
	Status     *string
}

// CreateSecretRequest 创建机密请求
type CreateSecretRequest struct {
	OwnerType   string
	OwnerID     *uuid.UUID
	SecretType  string
	Name        string
	Description *string
	Value       string
	ExpiresAt   *time.Time
	Metadata    map[string]string
}

// SecretService 机密管理服务接口
type SecretService interface {
	Create(ctx context.Context, actorID uuid.UUID, req CreateSecretRequest) (*entity.Secret, error)
	Rotate(ctx context.Context, actorID uuid.UUID, secretID uuid.UUID, value string) (*entity.Secret, error)
	Revoke(ctx context.Context, actorID uuid.UUID, secretID uuid.UUID, reason string) (*entity.Secret, error)
	List(ctx context.Context, actorID uuid.UUID, filter SecretFilter) ([]entity.Secret, error)
	Get(ctx context.Context, actorID uuid.UUID, secretID uuid.UUID) (*entity.Secret, error)
}

type secretService struct {
	repo             repository.SecretRepository
	encryptor        *crypto.Encryptor
	workspaceService WorkspaceService
}

// NewSecretService 创建机密管理服务
func NewSecretService(repo repository.SecretRepository, workspaceService WorkspaceService, encryptionKey string) (SecretService, error) {
	encryptor, err := crypto.NewEncryptor(encryptionKey)
	if err != nil {
		return nil, err
	}
	return &secretService{
		repo:             repo,
		encryptor:        encryptor,
		workspaceService: workspaceService,
	}, nil
}

func (s *secretService) Create(ctx context.Context, actorID uuid.UUID, req CreateSecretRequest) (*entity.Secret, error) {
	ownerType, ownerID, err := s.normalizeOwner(ctx, actorID, req.OwnerType, req.OwnerID, requiredWorkspacePermissionForSecretType(req.SecretType))
	if err != nil {
		return nil, err
	}
	if strings.TrimSpace(req.Name) == "" || strings.TrimSpace(req.SecretType) == "" || strings.TrimSpace(req.Value) == "" {
		return nil, ErrInvalidSecret
	}

	encrypted, err := s.encryptor.Encrypt(req.Value)
	if err != nil {
		return nil, err
	}
	preview := crypto.GetKeyPreview(req.Value)
	metadata := entity.JSON{}
	for k, v := range req.Metadata {
		metadata[k] = v
	}
	if len(metadata) == 0 {
		metadata = nil
	}

	secret := &entity.Secret{
		OwnerType:      ownerType,
		OwnerID:        ownerID,
		SecretType:     strings.TrimSpace(req.SecretType),
		Name:           strings.TrimSpace(req.Name),
		Description:    req.Description,
		ValueEncrypted: encrypted,
		ValuePreview:   &preview,
		Status:         SecretStatusActive,
		ExpiresAt:      req.ExpiresAt,
		Metadata:       metadata,
	}
	if err := s.repo.Create(ctx, secret); err != nil {
		return nil, err
	}
	return secret, nil
}

func (s *secretService) Rotate(ctx context.Context, actorID uuid.UUID, secretID uuid.UUID, value string) (*entity.Secret, error) {
	secret, err := s.repo.GetByID(ctx, secretID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrSecretNotFound
		}
		return nil, err
	}
	if err := s.ensureOwnerAccess(ctx, actorID, secret.OwnerType, secret.OwnerID, requiredWorkspacePermissionForSecretType(secret.SecretType)); err != nil {
		return nil, err
	}
	if secret.Status == SecretStatusRevoked {
		return nil, ErrSecretRevoked
	}
	if strings.TrimSpace(value) == "" {
		return nil, ErrInvalidSecret
	}

	encrypted, err := s.encryptor.Encrypt(value)
	if err != nil {
		return nil, err
	}
	preview := crypto.GetKeyPreview(value)
	now := time.Now()

	secret.ValueEncrypted = encrypted
	secret.ValuePreview = &preview
	secret.LastRotatedAt = &now
	secret.Status = SecretStatusActive
	secret.RevokedAt = nil
	secret.RevokedBy = nil
	secret.RevokedReason = nil

	if err := s.repo.Update(ctx, secret); err != nil {
		return nil, err
	}
	return secret, nil
}

func (s *secretService) Revoke(ctx context.Context, actorID uuid.UUID, secretID uuid.UUID, reason string) (*entity.Secret, error) {
	secret, err := s.repo.GetByID(ctx, secretID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrSecretNotFound
		}
		return nil, err
	}
	if err := s.ensureOwnerAccess(ctx, actorID, secret.OwnerType, secret.OwnerID, requiredWorkspacePermissionForSecretType(secret.SecretType)); err != nil {
		return nil, err
	}

	now := time.Now()
	secret.Status = SecretStatusRevoked
	secret.RevokedAt = &now
	secret.RevokedBy = &actorID
	if trimmed := strings.TrimSpace(reason); trimmed != "" {
		secret.RevokedReason = &trimmed
	}

	if err := s.repo.Update(ctx, secret); err != nil {
		return nil, err
	}
	return secret, nil
}

func (s *secretService) List(ctx context.Context, actorID uuid.UUID, filter SecretFilter) ([]entity.Secret, error) {
	requiredPermission := PermissionWorkspaceAdmin
	if filter.SecretType != nil {
		requiredPermission = requiredWorkspacePermissionForSecretType(*filter.SecretType)
	}
	ownerType, ownerID, err := s.normalizeOwner(ctx, actorID, filter.OwnerType, filter.OwnerID, requiredPermission)
	if err != nil {
		return nil, err
	}
	filter.OwnerType = ownerType
	filter.OwnerID = &ownerID

	return s.repo.List(ctx, repository.SecretFilter{
		OwnerType:  filter.OwnerType,
		OwnerID:    filter.OwnerID,
		SecretType: filter.SecretType,
		Status:     filter.Status,
	})
}

func (s *secretService) Get(ctx context.Context, actorID uuid.UUID, secretID uuid.UUID) (*entity.Secret, error) {
	secret, err := s.repo.GetByID(ctx, secretID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrSecretNotFound
		}
		return nil, err
	}
	if err := s.ensureOwnerAccess(ctx, actorID, secret.OwnerType, secret.OwnerID, requiredWorkspacePermissionForSecretType(secret.SecretType)); err != nil {
		return nil, err
	}
	return secret, nil
}

func requiredWorkspacePermissionForSecretType(secretType string) string {
	if isConnectorSecretType(secretType) {
		return PermissionConnectorsManage
	}
	return PermissionWorkspaceAdmin
}

func isConnectorSecretType(secretType string) bool {
	normalized := strings.ToLower(strings.TrimSpace(secretType))
	_, ok := connectorSecretTypes[normalized]
	return ok
}

func (s *secretService) normalizeOwner(ctx context.Context, actorID uuid.UUID, ownerType string, ownerID *uuid.UUID, requiredPermission string) (string, uuid.UUID, error) {
	resolvedType := strings.TrimSpace(ownerType)
	if resolvedType == "" {
		resolvedType = SecretOwnerUser
	}
	switch resolvedType {
	case SecretOwnerUser:
		if ownerID != nil && *ownerID != actorID {
			return "", uuid.Nil, ErrUnauthorized
		}
		return resolvedType, actorID, nil
	case SecretOwnerWorkspace:
		if ownerID == nil || *ownerID == uuid.Nil {
			return "", uuid.Nil, ErrInvalidScope
		}
		if err := s.ensureOwnerAccess(ctx, actorID, resolvedType, *ownerID, requiredPermission); err != nil {
			return "", uuid.Nil, err
		}
		return resolvedType, *ownerID, nil
	default:
		return "", uuid.Nil, ErrInvalidOwnerType
	}
}

func (s *secretService) ensureOwnerAccess(ctx context.Context, actorID uuid.UUID, ownerType string, ownerID uuid.UUID, requiredPermission string) error {
	if ownerType == SecretOwnerUser {
		if ownerID != actorID {
			return ErrUnauthorized
		}
		return nil
	}
	if ownerType == SecretOwnerWorkspace {
		access, err := s.workspaceService.GetWorkspaceAccess(ctx, ownerID, actorID)
		if err != nil {
			return ErrUnauthorized
		}
		permission := strings.TrimSpace(requiredPermission)
		if permission == "" {
			permission = PermissionWorkspaceAdmin
		}
		if !access.IsOwner && !hasAnyPermission(access.Permissions, permission, PermissionWorkspaceAdmin) {
			return ErrUnauthorized
		}
		return nil
	}
	return ErrInvalidOwnerType
}
