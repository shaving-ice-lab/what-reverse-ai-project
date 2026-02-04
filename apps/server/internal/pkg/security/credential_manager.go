package security

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"sync"
	"time"
)

var (
	ErrCredentialNotFound    = errors.New("credential not found")
	ErrCredentialExpired     = errors.New("credential expired")
	ErrCredentialRevoked     = errors.New("credential revoked")
	ErrInvalidCredential     = errors.New("invalid credential")
	ErrRotationFailed        = errors.New("credential rotation failed")
	ErrInsufficientPrivilege = errors.New("insufficient privilege for operation")
)

// CredentialType 凭证类型
type CredentialType string

const (
	CredTypeAPIKey       CredentialType = "api_key"
	CredTypeDBPassword   CredentialType = "db_password"
	CredTypeJWTSecret    CredentialType = "jwt_secret"
	CredTypeEncryption   CredentialType = "encryption_key"
	CredTypeWebhookToken CredentialType = "webhook_token"
	CredTypeOAuthToken   CredentialType = "oauth_token"
)

// CredentialStatus 凭证状态
type CredentialStatus string

const (
	CredStatusActive   CredentialStatus = "active"
	CredStatusExpired  CredentialStatus = "expired"
	CredStatusRevoked  CredentialStatus = "revoked"
	CredStatusRotating CredentialStatus = "rotating"
	CredStatusPending  CredentialStatus = "pending"
)

// Credential 凭证结构
type Credential struct {
	ID            string            `json:"id"`
	Type          CredentialType    `json:"type"`
	Name          string            `json:"name"`
	Description   string            `json:"description"`
	Status        CredentialStatus  `json:"status"`
	OwnerID       string            `json:"owner_id"`   // 所属用户/工作空间ID
	OwnerType     string            `json:"owner_type"` // user, workspace, app
	Scope         []string          `json:"scope"`      // 权限范围
	CreatedAt     time.Time         `json:"created_at"`
	ExpiresAt     *time.Time        `json:"expires_at,omitempty"`
	LastUsedAt    *time.Time        `json:"last_used_at,omitempty"`
	LastRotatedAt *time.Time        `json:"last_rotated_at,omitempty"`
	RevokedAt     *time.Time        `json:"revoked_at,omitempty"`
	RevokedBy     string            `json:"revoked_by,omitempty"`
	RevokeReason  string            `json:"revoke_reason,omitempty"`
	Metadata      map[string]string `json:"metadata,omitempty"`
}

// CredentialManager 凭证管理器接口
type CredentialManager interface {
	// 创建凭证
	Create(ctx context.Context, req CreateCredentialRequest) (*Credential, string, error)
	// 获取凭证信息（不含敏感值）
	Get(ctx context.Context, id string) (*Credential, error)
	// 获取凭证值（需要权限验证）
	GetValue(ctx context.Context, id string, actorID string) (string, error)
	// 验证凭证
	Validate(ctx context.Context, credType CredentialType, value string) (*Credential, error)
	// 轮换凭证
	Rotate(ctx context.Context, id string, actorID string) (string, error)
	// 吊销凭证
	Revoke(ctx context.Context, req RevokeCredentialRequest) error
	// 列出凭证
	List(ctx context.Context, ownerID, ownerType string) ([]Credential, error)
	// 检查是否过期
	IsExpired(ctx context.Context, id string) (bool, error)
	// 更新最后使用时间
	UpdateLastUsed(ctx context.Context, id string) error
	// 清理过期凭证
	CleanupExpired(ctx context.Context) (int, error)
}

// CreateCredentialRequest 创建凭证请求
type CreateCredentialRequest struct {
	Type        CredentialType    `json:"type"`
	Name        string            `json:"name"`
	Description string            `json:"description"`
	OwnerID     string            `json:"owner_id"`
	OwnerType   string            `json:"owner_type"`
	Scope       []string          `json:"scope"`
	TTL         time.Duration     `json:"ttl,omitempty"` // 过期时间
	Metadata    map[string]string `json:"metadata,omitempty"`
}

// RevokeCredentialRequest 吊销凭证请求
type RevokeCredentialRequest struct {
	ID      string `json:"id"`
	ActorID string `json:"actor_id"`
	Reason  string `json:"reason"`
}

// RotationPolicy 轮换策略
type RotationPolicy struct {
	CredType      CredentialType `json:"cred_type"`
	Enabled       bool           `json:"enabled"`
	Interval      time.Duration  `json:"interval"`        // 轮换间隔
	GracePeriod   time.Duration  `json:"grace_period"`    // 旧密钥保留时间
	NotifyBefore  time.Duration  `json:"notify_before"`   // 提前通知时间
	AutoRotate    bool           `json:"auto_rotate"`     // 是否自动轮换
	MaxActiveKeys int            `json:"max_active_keys"` // 最大活跃密钥数
}

// DefaultRotationPolicies 默认轮换策略
var DefaultRotationPolicies = map[CredentialType]RotationPolicy{
	CredTypeAPIKey: {
		CredType:      CredTypeAPIKey,
		Enabled:       true,
		Interval:      90 * 24 * time.Hour, // 90天
		GracePeriod:   24 * time.Hour,      // 24小时
		NotifyBefore:  7 * 24 * time.Hour,  // 7天
		AutoRotate:    false,
		MaxActiveKeys: 2,
	},
	CredTypeDBPassword: {
		CredType:      CredTypeDBPassword,
		Enabled:       true,
		Interval:      30 * 24 * time.Hour, // 30天
		GracePeriod:   1 * time.Hour,       // 1小时
		NotifyBefore:  3 * 24 * time.Hour,  // 3天
		AutoRotate:    true,
		MaxActiveKeys: 2,
	},
	CredTypeJWTSecret: {
		CredType:      CredTypeJWTSecret,
		Enabled:       true,
		Interval:      180 * 24 * time.Hour, // 180天
		GracePeriod:   24 * time.Hour,       // 24小时
		NotifyBefore:  14 * 24 * time.Hour,  // 14天
		AutoRotate:    false,
		MaxActiveKeys: 2,
	},
	CredTypeEncryption: {
		CredType:      CredTypeEncryption,
		Enabled:       true,
		Interval:      365 * 24 * time.Hour, // 365天
		GracePeriod:   7 * 24 * time.Hour,   // 7天
		NotifyBefore:  30 * 24 * time.Hour,  // 30天
		AutoRotate:    false,
		MaxActiveKeys: 2,
	},
	CredTypeWebhookToken: {
		CredType:      CredTypeWebhookToken,
		Enabled:       true,
		Interval:      90 * 24 * time.Hour, // 90天
		GracePeriod:   1 * time.Hour,       // 1小时
		NotifyBefore:  7 * 24 * time.Hour,  // 7天
		AutoRotate:    true,
		MaxActiveKeys: 2,
	},
	CredTypeOAuthToken: {
		CredType:      CredTypeOAuthToken,
		Enabled:       true,
		Interval:      24 * time.Hour,  // 24小时
		GracePeriod:   5 * time.Minute, // 5分钟
		NotifyBefore:  1 * time.Hour,   // 1小时
		AutoRotate:    true,
		MaxActiveKeys: 2,
	},
}

// PrivilegeLevel 权限级别
type PrivilegeLevel int

const (
	PrivilegeNone  PrivilegeLevel = 0
	PrivilegeRead  PrivilegeLevel = 1
	PrivilegeWrite PrivilegeLevel = 2
	PrivilegeAdmin PrivilegeLevel = 3
	PrivilegeOwner PrivilegeLevel = 4
)

// CredentialPrivilege 凭证操作权限
type CredentialPrivilege struct {
	Operation string         `json:"operation"`
	MinLevel  PrivilegeLevel `json:"min_level"`
}

// DefaultCredentialPrivileges 默认凭证操作权限
var DefaultCredentialPrivileges = map[string]PrivilegeLevel{
	"create":     PrivilegeAdmin,
	"read":       PrivilegeRead,
	"read_value": PrivilegeOwner,
	"rotate":     PrivilegeAdmin,
	"revoke":     PrivilegeOwner,
	"delete":     PrivilegeOwner,
	"list":       PrivilegeRead,
	"update":     PrivilegeAdmin,
}

// CheckPrivilege 检查操作权限
func CheckPrivilege(operation string, userLevel PrivilegeLevel) bool {
	minLevel, ok := DefaultCredentialPrivileges[operation]
	if !ok {
		return false
	}
	return userLevel >= minLevel
}

// InMemoryCredentialManager 内存凭证管理器（用于测试和开发）
type InMemoryCredentialManager struct {
	credentials map[string]*Credential
	values      map[string]string
	mu          sync.RWMutex
}

// NewInMemoryCredentialManager 创建内存凭证管理器
func NewInMemoryCredentialManager() *InMemoryCredentialManager {
	return &InMemoryCredentialManager{
		credentials: make(map[string]*Credential),
		values:      make(map[string]string),
	}
}

func (m *InMemoryCredentialManager) Create(ctx context.Context, req CreateCredentialRequest) (*Credential, string, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	id := generateCredentialID()
	value := generateCredentialValue(req.Type)

	now := time.Now()
	var expiresAt *time.Time
	if req.TTL > 0 {
		t := now.Add(req.TTL)
		expiresAt = &t
	}

	cred := &Credential{
		ID:          id,
		Type:        req.Type,
		Name:        req.Name,
		Description: req.Description,
		Status:      CredStatusActive,
		OwnerID:     req.OwnerID,
		OwnerType:   req.OwnerType,
		Scope:       req.Scope,
		CreatedAt:   now,
		ExpiresAt:   expiresAt,
		Metadata:    req.Metadata,
	}

	m.credentials[id] = cred
	m.values[id] = value

	return cred, value, nil
}

func (m *InMemoryCredentialManager) Get(ctx context.Context, id string) (*Credential, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	cred, ok := m.credentials[id]
	if !ok {
		return nil, ErrCredentialNotFound
	}

	return cred, nil
}

func (m *InMemoryCredentialManager) GetValue(ctx context.Context, id string, actorID string) (string, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	cred, ok := m.credentials[id]
	if !ok {
		return "", ErrCredentialNotFound
	}

	if cred.Status == CredStatusRevoked {
		return "", ErrCredentialRevoked
	}

	if cred.ExpiresAt != nil && time.Now().After(*cred.ExpiresAt) {
		return "", ErrCredentialExpired
	}

	value, ok := m.values[id]
	if !ok {
		return "", ErrCredentialNotFound
	}

	return value, nil
}

func (m *InMemoryCredentialManager) Validate(ctx context.Context, credType CredentialType, value string) (*Credential, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	for id, v := range m.values {
		if v == value {
			cred := m.credentials[id]
			if cred.Type != credType {
				continue
			}
			if cred.Status == CredStatusRevoked {
				return nil, ErrCredentialRevoked
			}
			if cred.ExpiresAt != nil && time.Now().After(*cred.ExpiresAt) {
				return nil, ErrCredentialExpired
			}
			return cred, nil
		}
	}

	return nil, ErrCredentialNotFound
}

func (m *InMemoryCredentialManager) Rotate(ctx context.Context, id string, actorID string) (string, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	cred, ok := m.credentials[id]
	if !ok {
		return "", ErrCredentialNotFound
	}

	if cred.Status == CredStatusRevoked {
		return "", ErrCredentialRevoked
	}

	newValue := generateCredentialValue(cred.Type)
	now := time.Now()

	cred.LastRotatedAt = &now
	m.values[id] = newValue

	return newValue, nil
}

func (m *InMemoryCredentialManager) Revoke(ctx context.Context, req RevokeCredentialRequest) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	cred, ok := m.credentials[req.ID]
	if !ok {
		return ErrCredentialNotFound
	}

	now := time.Now()
	cred.Status = CredStatusRevoked
	cred.RevokedAt = &now
	cred.RevokedBy = req.ActorID
	cred.RevokeReason = req.Reason

	delete(m.values, req.ID)

	return nil
}

func (m *InMemoryCredentialManager) List(ctx context.Context, ownerID, ownerType string) ([]Credential, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	var result []Credential
	for _, cred := range m.credentials {
		if cred.OwnerID == ownerID && cred.OwnerType == ownerType {
			result = append(result, *cred)
		}
	}

	return result, nil
}

func (m *InMemoryCredentialManager) IsExpired(ctx context.Context, id string) (bool, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	cred, ok := m.credentials[id]
	if !ok {
		return false, ErrCredentialNotFound
	}

	if cred.ExpiresAt == nil {
		return false, nil
	}

	return time.Now().After(*cred.ExpiresAt), nil
}

func (m *InMemoryCredentialManager) UpdateLastUsed(ctx context.Context, id string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	cred, ok := m.credentials[id]
	if !ok {
		return ErrCredentialNotFound
	}

	now := time.Now()
	cred.LastUsedAt = &now
	return nil
}

func (m *InMemoryCredentialManager) CleanupExpired(ctx context.Context) (int, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	count := 0
	now := time.Now()

	for id, cred := range m.credentials {
		if cred.ExpiresAt != nil && now.After(*cred.ExpiresAt) {
			delete(m.credentials, id)
			delete(m.values, id)
			count++
		}
	}

	return count, nil
}

// generateCredentialID 生成凭证ID
func generateCredentialID() string {
	bytes := make([]byte, 16)
	rand.Read(bytes)
	return "cred_" + hex.EncodeToString(bytes)
}

// generateCredentialValue 生成凭证值
func generateCredentialValue(credType CredentialType) string {
	bytes := make([]byte, 32)
	rand.Read(bytes)

	prefix := ""
	switch credType {
	case CredTypeAPIKey:
		prefix = "sk-"
	case CredTypeDBPassword:
		prefix = "db-"
	case CredTypeJWTSecret:
		prefix = "jwt-"
	case CredTypeEncryption:
		prefix = "enc-"
	case CredTypeWebhookToken:
		prefix = "whk-"
	case CredTypeOAuthToken:
		prefix = "oa-"
	default:
		prefix = "gen-"
	}

	return prefix + hex.EncodeToString(bytes)
}

// GetRotationPolicy 获取凭证类型的轮换策略
func GetRotationPolicy(credType CredentialType) RotationPolicy {
	if policy, ok := DefaultRotationPolicies[credType]; ok {
		return policy
	}
	return RotationPolicy{
		CredType:      credType,
		Enabled:       false,
		Interval:      90 * 24 * time.Hour,
		GracePeriod:   24 * time.Hour,
		NotifyBefore:  7 * 24 * time.Hour,
		AutoRotate:    false,
		MaxActiveKeys: 2,
	}
}

// NeedsRotation 检查凭证是否需要轮换
func NeedsRotation(cred *Credential) bool {
	policy := GetRotationPolicy(cred.Type)
	if !policy.Enabled {
		return false
	}

	var lastRotation time.Time
	if cred.LastRotatedAt != nil {
		lastRotation = *cred.LastRotatedAt
	} else {
		lastRotation = cred.CreatedAt
	}

	return time.Since(lastRotation) >= policy.Interval
}

// GetRotationWarning 获取轮换警告
func GetRotationWarning(cred *Credential) *time.Duration {
	policy := GetRotationPolicy(cred.Type)
	if !policy.Enabled {
		return nil
	}

	var lastRotation time.Time
	if cred.LastRotatedAt != nil {
		lastRotation = *cred.LastRotatedAt
	} else {
		lastRotation = cred.CreatedAt
	}

	nextRotation := lastRotation.Add(policy.Interval)
	warningTime := nextRotation.Add(-policy.NotifyBefore)

	if time.Now().After(warningTime) {
		remaining := time.Until(nextRotation)
		return &remaining
	}

	return nil
}
