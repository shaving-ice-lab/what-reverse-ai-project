package service

import (
	"context"
	"encoding/json"
	"errors"
	"strconv"
	"strings"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/pkg/crypto"
	"github.com/agentflow/server/internal/repository"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

var (
	ErrConfigItemNotFound = errors.New("config item not found")
	ErrInvalidConfigItem  = errors.New("invalid config item")
	ErrInvalidConfigScope = errors.New("invalid config scope")
)

const (
	ConfigScopeUser      = "user"
	ConfigScopeWorkspace = "workspace"

	ConfigValueTypeString = "string"
	ConfigValueTypeJSON   = "json"
	ConfigValueTypeBool   = "bool"
	ConfigValueTypeNumber = "number"
)

// ConfigItemFilter 配置筛选条件
type ConfigItemFilter struct {
	ScopeType       string
	ScopeID         *uuid.UUID
	ConfigKey       *string
	IncludeInactive bool
}

// UpsertConfigItemRequest 配置写入请求
type UpsertConfigItemRequest struct {
	ScopeType   string
	ScopeID     *uuid.UUID
	Key         string
	Value       string
	ValueType   string
	IsSecret    bool
	Description *string
}

// ConfigCenterService 配置中心服务接口
type ConfigCenterService interface {
	Upsert(ctx context.Context, actorID uuid.UUID, req UpsertConfigItemRequest) (*entity.ConfigItem, error)
	List(ctx context.Context, actorID uuid.UUID, filter ConfigItemFilter) ([]entity.ConfigItem, error)
	Get(ctx context.Context, actorID uuid.UUID, id uuid.UUID) (*entity.ConfigItem, error)
	Disable(ctx context.Context, actorID uuid.UUID, id uuid.UUID) (*entity.ConfigItem, error)
	DecryptValue(item *entity.ConfigItem) (string, error)
}

type configCenterService struct {
	repo             repository.ConfigItemRepository
	encryptor        *crypto.Encryptor
	workspaceService WorkspaceService
}

// NewConfigCenterService 创建配置中心服务
func NewConfigCenterService(repo repository.ConfigItemRepository, workspaceService WorkspaceService, encryptionKey string) (ConfigCenterService, error) {
	encryptor, err := crypto.NewEncryptor(encryptionKey)
	if err != nil {
		return nil, err
	}
	return &configCenterService{
		repo:             repo,
		encryptor:        encryptor,
		workspaceService: workspaceService,
	}, nil
}

func (s *configCenterService) Upsert(ctx context.Context, actorID uuid.UUID, req UpsertConfigItemRequest) (*entity.ConfigItem, error) {
	scopeType, scopeID, err := s.normalizeScope(ctx, actorID, req.ScopeType, req.ScopeID)
	if err != nil {
		return nil, err
	}
	key := strings.TrimSpace(req.Key)
	if key == "" {
		return nil, ErrInvalidConfigItem
	}
	valueType := strings.TrimSpace(req.ValueType)
	if valueType == "" {
		valueType = ConfigValueTypeString
	}
	if err := validateConfigValue(valueType, req.Value); err != nil {
		return nil, err
	}
	if req.IsSecret && strings.TrimSpace(req.Value) == "" {
		return nil, ErrInvalidConfigItem
	}

	encrypted, err := s.encryptor.Encrypt(req.Value)
	if err != nil {
		return nil, err
	}
	var preview *string
	if req.IsSecret {
		p := crypto.GetKeyPreview(req.Value)
		preview = &p
	}

	existing, err := s.repo.FindByScopeAndKey(ctx, scopeType, scopeID, key)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	if existing != nil && existing.ID != uuid.Nil {
		existing.ValueEncrypted = encrypted
		existing.ValuePreview = preview
		existing.ValueType = valueType
		existing.IsSecret = req.IsSecret
		existing.Description = req.Description
		existing.IsActive = true
		existing.UpdatedBy = &actorID
		if err := s.repo.Update(ctx, existing); err != nil {
			return nil, err
		}
		return existing, nil
	}

	item := &entity.ConfigItem{
		ScopeType:      scopeType,
		ScopeID:        scopeID,
		ConfigKey:      key,
		ValueEncrypted: encrypted,
		ValuePreview:   preview,
		ValueType:      valueType,
		IsSecret:       req.IsSecret,
		IsActive:       true,
		Description:    req.Description,
		UpdatedBy:      &actorID,
	}
	if err := s.repo.Create(ctx, item); err != nil {
		return nil, err
	}
	return item, nil
}

func (s *configCenterService) List(ctx context.Context, actorID uuid.UUID, filter ConfigItemFilter) ([]entity.ConfigItem, error) {
	scopeType, scopeID, err := s.normalizeScope(ctx, actorID, filter.ScopeType, filter.ScopeID)
	if err != nil {
		return nil, err
	}
	filter.ScopeType = scopeType
	filter.ScopeID = scopeID

	return s.repo.List(ctx, repository.ConfigItemFilter{
		ScopeType:       filter.ScopeType,
		ScopeID:         filter.ScopeID,
		ConfigKey:       filter.ConfigKey,
		IncludeInactive: filter.IncludeInactive,
	})
}

func (s *configCenterService) Get(ctx context.Context, actorID uuid.UUID, id uuid.UUID) (*entity.ConfigItem, error) {
	item, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrConfigItemNotFound
		}
		return nil, err
	}
	if err := s.ensureScopeAccess(ctx, actorID, item.ScopeType, item.ScopeID); err != nil {
		return nil, err
	}
	return item, nil
}

func (s *configCenterService) Disable(ctx context.Context, actorID uuid.UUID, id uuid.UUID) (*entity.ConfigItem, error) {
	item, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrConfigItemNotFound
		}
		return nil, err
	}
	if err := s.ensureScopeAccess(ctx, actorID, item.ScopeType, item.ScopeID); err != nil {
		return nil, err
	}
	item.IsActive = false
	item.UpdatedBy = &actorID
	if err := s.repo.Update(ctx, item); err != nil {
		return nil, err
	}
	return item, nil
}

func (s *configCenterService) DecryptValue(item *entity.ConfigItem) (string, error) {
	if item == nil {
		return "", ErrInvalidConfigItem
	}
	return s.encryptor.Decrypt(item.ValueEncrypted)
}

func (s *configCenterService) normalizeScope(ctx context.Context, actorID uuid.UUID, scopeType string, scopeID *uuid.UUID) (string, *uuid.UUID, error) {
	resolved := strings.TrimSpace(scopeType)
	if resolved == "" {
		resolved = ConfigScopeUser
	}
	switch resolved {
	case ConfigScopeUser:
		if scopeID != nil && *scopeID != actorID {
			return "", nil, ErrUnauthorized
		}
		return resolved, &actorID, nil
	case ConfigScopeWorkspace:
		if scopeID == nil || *scopeID == uuid.Nil {
			return "", nil, ErrInvalidConfigScope
		}
		if err := s.ensureScopeAccess(ctx, actorID, resolved, scopeID); err != nil {
			return "", nil, err
		}
		return resolved, scopeID, nil
	default:
		return "", nil, ErrInvalidConfigScope
	}
}

func (s *configCenterService) ensureScopeAccess(ctx context.Context, actorID uuid.UUID, scopeType string, scopeID *uuid.UUID) error {
	if scopeType == ConfigScopeUser {
		if scopeID == nil || *scopeID != actorID {
			return ErrUnauthorized
		}
		return nil
	}
	if scopeType == ConfigScopeWorkspace {
		if scopeID == nil {
			return ErrInvalidConfigScope
		}
		access, err := s.workspaceService.GetWorkspaceAccess(ctx, *scopeID, actorID)
		if err != nil {
			return ErrUnauthorized
		}
		if !access.IsOwner && !hasPermission(access.Permissions, PermissionWorkspaceAdmin) {
			return ErrUnauthorized
		}
		return nil
	}
	return ErrInvalidConfigScope
}

func validateConfigValue(valueType, value string) error {
	switch valueType {
	case ConfigValueTypeString:
		return nil
	case ConfigValueTypeJSON:
		if strings.TrimSpace(value) == "" {
			return ErrInvalidConfigItem
		}
		if !json.Valid([]byte(value)) {
			return ErrInvalidConfigItem
		}
		return nil
	case ConfigValueTypeBool:
		if _, err := strconv.ParseBool(strings.TrimSpace(value)); err != nil {
			return ErrInvalidConfigItem
		}
		return nil
	case ConfigValueTypeNumber:
		if _, err := strconv.ParseFloat(strings.TrimSpace(value), 64); err != nil {
			return ErrInvalidConfigItem
		}
		return nil
	default:
		return ErrInvalidConfigItem
	}
}
