package service

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/reverseai/server/internal/domain/entity"
	"github.com/reverseai/server/internal/pkg/crypto"
	"github.com/reverseai/server/internal/repository"
)

var (
	ErrAPIKeyNotFound = errors.New("API key not found")
	ErrInvalidAPIKey  = errors.New("invalid API key")
)

// APIKeyService API 密钥服务接口
type APIKeyService interface {
	Create(ctx context.Context, userID uuid.UUID, req CreateAPIKeyRequest) (*entity.APIKey, error)
	Rotate(ctx context.Context, userID, id uuid.UUID, req RotateAPIKeyRequest) (*entity.APIKey, error)
	Revoke(ctx context.Context, userID, id uuid.UUID, reason string) (*entity.APIKey, error)
	List(ctx context.Context, userID uuid.UUID) ([]entity.APIKey, error)
	Delete(ctx context.Context, id, userID uuid.UUID) error
	GetDecrypted(ctx context.Context, userID uuid.UUID, provider string) (string, error)
	GetAllDecrypted(ctx context.Context, userID uuid.UUID) (map[string]string, error)
	TestKey(ctx context.Context, provider, key string) (bool, error)
}

// CreateAPIKeyRequest 创建 API 密钥请求
type CreateAPIKeyRequest struct {
	Provider string
	Name     string
	Key      string
	Scopes   []string
}

// RotateAPIKeyRequest 轮换 API 密钥请求
type RotateAPIKeyRequest struct {
	Name   *string
	Key    string
	Scopes []string
}

type apiKeyService struct {
	apiKeyRepo       repository.APIKeyRepository
	encryptor        *crypto.Encryptor
	workspaceService WorkspaceService
}

// NewAPIKeyService 创建 API 密钥服务
func NewAPIKeyService(apiKeyRepo repository.APIKeyRepository, workspaceService WorkspaceService, encryptionKey string) (APIKeyService, error) {
	encryptor, err := crypto.NewEncryptor(encryptionKey)
	if err != nil {
		return nil, err
	}

	return &apiKeyService{
		apiKeyRepo:       apiKeyRepo,
		encryptor:        encryptor,
		workspaceService: workspaceService,
	}, nil
}

func (s *apiKeyService) Create(ctx context.Context, userID uuid.UUID, req CreateAPIKeyRequest) (*entity.APIKey, error) {
	workspace, err := s.workspaceService.EnsureDefaultWorkspaceByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	// 验证密钥格式
	if req.Key == "" {
		return nil, ErrInvalidAPIKey
	}

	// 加密密钥
	encryptedKey, err := s.encryptor.Encrypt(req.Key)
	if err != nil {
		return nil, err
	}

	// 生成预览
	keyPreview := crypto.GetKeyPreview(req.Key)

	scopes := resolveAPIKeyScopes(nil, req.Scopes)

	// 检查是否已存在相同 provider 的密钥
	existing, _ := s.apiKeyRepo.GetByProvider(ctx, userID, req.Provider)
	if existing != nil {
		now := time.Now()
		// 更新现有密钥
		existing.KeyEncrypted = encryptedKey
		existing.KeyPreview = &keyPreview
		existing.Name = req.Name
		existing.Scopes = resolveAPIKeyScopes(existing.Scopes, req.Scopes)
		existing.IsActive = true
		existing.LastRotatedAt = &now
		existing.RevokedAt = nil
		existing.RevokedBy = nil
		existing.RevokedReason = nil
		if existing.WorkspaceID == uuid.Nil {
			existing.WorkspaceID = workspace.ID
		}
		if err := s.apiKeyRepo.Update(ctx, existing); err != nil {
			return nil, err
		}
		return existing, nil
	}

	// 创建新密钥
	apiKey := &entity.APIKey{
		UserID:       userID,
		WorkspaceID:  workspace.ID,
		Provider:     req.Provider,
		Name:         req.Name,
		KeyEncrypted: encryptedKey,
		KeyPreview:   &keyPreview,
		Scopes:       scopes,
		IsActive:     true,
	}

	if err := s.apiKeyRepo.Create(ctx, apiKey); err != nil {
		return nil, err
	}

	return apiKey, nil
}

func (s *apiKeyService) Rotate(ctx context.Context, userID, id uuid.UUID, req RotateAPIKeyRequest) (*entity.APIKey, error) {
	apiKey, err := s.apiKeyRepo.GetByID(ctx, id)
	if err != nil {
		return nil, ErrAPIKeyNotFound
	}
	if apiKey.UserID != userID {
		return nil, ErrUnauthorized
	}
	if strings.TrimSpace(req.Key) == "" {
		return nil, ErrInvalidAPIKey
	}

	encryptedKey, err := s.encryptor.Encrypt(req.Key)
	if err != nil {
		return nil, err
	}
	keyPreview := crypto.GetKeyPreview(req.Key)
	now := time.Now()

	if req.Name != nil && strings.TrimSpace(*req.Name) != "" {
		apiKey.Name = strings.TrimSpace(*req.Name)
	}
	apiKey.KeyEncrypted = encryptedKey
	apiKey.KeyPreview = &keyPreview
	apiKey.Scopes = resolveAPIKeyScopes(apiKey.Scopes, req.Scopes)
	apiKey.IsActive = true
	apiKey.LastRotatedAt = &now
	apiKey.RevokedAt = nil
	apiKey.RevokedBy = nil
	apiKey.RevokedReason = nil

	if err := s.apiKeyRepo.Update(ctx, apiKey); err != nil {
		return nil, err
	}
	return apiKey, nil
}

func (s *apiKeyService) Revoke(ctx context.Context, userID, id uuid.UUID, reason string) (*entity.APIKey, error) {
	apiKey, err := s.apiKeyRepo.GetByID(ctx, id)
	if err != nil {
		return nil, ErrAPIKeyNotFound
	}
	if apiKey.UserID != userID {
		return nil, ErrUnauthorized
	}

	now := time.Now()
	apiKey.IsActive = false
	apiKey.RevokedAt = &now
	apiKey.RevokedBy = &userID
	if trimmed := strings.TrimSpace(reason); trimmed != "" {
		apiKey.RevokedReason = &trimmed
	}

	if err := s.apiKeyRepo.Update(ctx, apiKey); err != nil {
		return nil, err
	}
	return apiKey, nil
}

func (s *apiKeyService) List(ctx context.Context, userID uuid.UUID) ([]entity.APIKey, error) {
	return s.apiKeyRepo.List(ctx, userID)
}

func (s *apiKeyService) Delete(ctx context.Context, id, userID uuid.UUID) error {
	apiKey, err := s.apiKeyRepo.GetByID(ctx, id)
	if err != nil {
		return ErrAPIKeyNotFound
	}

	// 检查权限
	if apiKey.UserID != userID {
		return ErrUnauthorized
	}

	return s.apiKeyRepo.Delete(ctx, id)
}

func (s *apiKeyService) GetDecrypted(ctx context.Context, userID uuid.UUID, provider string) (string, error) {
	apiKey, err := s.apiKeyRepo.GetByProvider(ctx, userID, provider)
	if err != nil {
		return "", ErrAPIKeyNotFound
	}

	if !apiKey.IsActive {
		return "", ErrAPIKeyNotFound
	}

	decrypted, err := s.encryptor.Decrypt(apiKey.KeyEncrypted)
	if err != nil {
		return "", err
	}
	_ = s.apiKeyRepo.UpdateLastUsed(ctx, apiKey.ID)
	return decrypted, nil
}

func (s *apiKeyService) GetAllDecrypted(ctx context.Context, userID uuid.UUID) (map[string]string, error) {
	apiKeys, err := s.apiKeyRepo.List(ctx, userID)
	if err != nil {
		return nil, err
	}

	result := make(map[string]string)
	for _, apiKey := range apiKeys {
		if apiKey.IsActive {
			decrypted, err := s.encryptor.Decrypt(apiKey.KeyEncrypted)
			if err == nil {
				result[apiKey.Provider] = decrypted
				_ = s.apiKeyRepo.UpdateLastUsed(ctx, apiKey.ID)
			}
		}
	}

	return result, nil
}

func (s *apiKeyService) TestKey(ctx context.Context, provider, key string) (bool, error) {
	// TODO: 实现各 provider 的 API 密钥测试
	// 这里简化为检查格式
	switch provider {
	case "openai":
		return len(key) > 20 && (key[:3] == "sk-" || key[:7] == "sk-proj"), nil
	case "anthropic":
		return len(key) > 20 && key[:3] == "sk-", nil
	case "google":
		return len(key) > 20, nil
	default:
		return len(key) > 10, nil
	}
}

func resolveAPIKeyScopes(current entity.StringArray, requested []string) entity.StringArray {
	if len(requested) == 0 {
		if len(current) > 0 {
			return current
		}
		return entity.StringArray{"llm:execute"}
	}
	normalized := normalizeScopes(requested)
	if len(normalized) == 0 {
		return nil
	}
	return normalized
}

func normalizeScopes(scopes []string) entity.StringArray {
	if len(scopes) == 0 {
		return nil
	}
	seen := map[string]struct{}{}
	result := make(entity.StringArray, 0, len(scopes))
	for _, scope := range scopes {
		trimmed := strings.ToLower(strings.TrimSpace(scope))
		if trimmed == "" {
			continue
		}
		if _, ok := seen[trimmed]; ok {
			continue
		}
		seen[trimmed] = struct{}{}
		result = append(result, trimmed)
		if len(result) >= 20 {
			break
		}
	}
	if len(result) == 0 {
		return nil
	}
	return result
}
