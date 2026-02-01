package service

import (
	"context"
	"errors"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/pkg/crypto"
	"github.com/agentflow/server/internal/repository"
	"github.com/google/uuid"
)

var (
	ErrAPIKeyNotFound = errors.New("API key not found")
	ErrInvalidAPIKey  = errors.New("invalid API key")
)

// APIKeyService API 密钥服务接口
type APIKeyService interface {
	Create(ctx context.Context, userID uuid.UUID, req CreateAPIKeyRequest) (*entity.APIKey, error)
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
}

type apiKeyService struct {
	apiKeyRepo repository.APIKeyRepository
	encryptor  *crypto.Encryptor
}

// NewAPIKeyService 创建 API 密钥服务
func NewAPIKeyService(apiKeyRepo repository.APIKeyRepository, encryptionKey string) (APIKeyService, error) {
	encryptor, err := crypto.NewEncryptor(encryptionKey)
	if err != nil {
		return nil, err
	}

	return &apiKeyService{
		apiKeyRepo: apiKeyRepo,
		encryptor:  encryptor,
	}, nil
}

func (s *apiKeyService) Create(ctx context.Context, userID uuid.UUID, req CreateAPIKeyRequest) (*entity.APIKey, error) {
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

	// 检查是否已存在相同 provider 的密钥
	existing, _ := s.apiKeyRepo.GetByProvider(ctx, userID, req.Provider)
	if existing != nil {
		// 更新现有密钥
		existing.KeyEncrypted = encryptedKey
		existing.KeyPreview = &keyPreview
		existing.Name = req.Name
		existing.IsActive = true
		if err := s.apiKeyRepo.Update(ctx, existing); err != nil {
			return nil, err
		}
		return existing, nil
	}

	// 创建新密钥
	apiKey := &entity.APIKey{
		UserID:       userID,
		Provider:     req.Provider,
		Name:         req.Name,
		KeyEncrypted: encryptedKey,
		KeyPreview:   &keyPreview,
		IsActive:     true,
	}

	if err := s.apiKeyRepo.Create(ctx, apiKey); err != nil {
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

	return s.encryptor.Decrypt(apiKey.KeyEncrypted)
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
