package service

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"time"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/repository"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// RuntimeAuthService 应用运行时认证服务
type RuntimeAuthService interface {
	Register(ctx context.Context, workspaceID uuid.UUID, email, password, displayName string) (*entity.AppUser, error)
	Login(ctx context.Context, workspaceID uuid.UUID, email, password string) (*RuntimeAuthResult, error)
	ValidateSession(ctx context.Context, token string) (*entity.AppUser, error)
	Logout(ctx context.Context, token string) error
	ListUsers(ctx context.Context, workspaceID uuid.UUID, page, pageSize int) ([]entity.AppUser, int64, error)
	BlockUser(ctx context.Context, userID uuid.UUID) error
}

// RuntimeAuthResult 登录结果
type RuntimeAuthResult struct {
	User      *entity.AppUser `json:"user"`
	Token     string          `json:"token"`
	ExpiresAt time.Time       `json:"expires_at"`
}

type runtimeAuthService struct {
	appUserRepo   repository.AppUserRepository
	workspaceRepo repository.WorkspaceRepository
	sessionRepo   repository.SessionRepository
	db            *gorm.DB
	tokenTTL      time.Duration
}

// NewRuntimeAuthService 创建运行时认证服务
func NewRuntimeAuthService(
	appUserRepo repository.AppUserRepository,
	workspaceRepo repository.WorkspaceRepository,
	sessionRepo repository.SessionRepository,
) RuntimeAuthService {
	return &runtimeAuthService{
		appUserRepo:   appUserRepo,
		workspaceRepo: workspaceRepo,
		sessionRepo:   sessionRepo,
		tokenTTL:      24 * time.Hour,
	}
}

// NewRuntimeAuthServiceWithDB 创建带 DB 的运行时认证服务（用于直接操作 WorkspaceSession）
func NewRuntimeAuthServiceWithDB(
	appUserRepo repository.AppUserRepository,
	workspaceRepo repository.WorkspaceRepository,
	sessionRepo repository.SessionRepository,
	db *gorm.DB,
) RuntimeAuthService {
	return &runtimeAuthService{
		appUserRepo:   appUserRepo,
		workspaceRepo: workspaceRepo,
		sessionRepo:   sessionRepo,
		db:            db,
		tokenTTL:      24 * time.Hour,
	}
}

func (s *runtimeAuthService) Register(ctx context.Context, workspaceID uuid.UUID, email, password, displayName string) (*entity.AppUser, error) {
	// Verify workspace exists and is published
	ws, err := s.workspaceRepo.GetByID(ctx, workspaceID)
	if err != nil {
		return nil, fmt.Errorf("workspace not found: %w", err)
	}
	if ws.AppStatus != "published" {
		return nil, errors.New("app is not published, registration is not available")
	}
	if ws.AccessMode == "private" {
		return nil, errors.New("app is private, registration is not available")
	}

	// Check if email already exists
	existing, err := s.appUserRepo.GetByEmail(ctx, workspaceID, email)
	if err == nil && existing != nil {
		return nil, errors.New("email already registered")
	}

	// Hash password
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	user := &entity.AppUser{
		WorkspaceID:  workspaceID,
		Email:        email,
		PasswordHash: string(hash),
		Role:         "user",
		Status:       "active",
	}
	if displayName != "" {
		user.DisplayName = &displayName
	}

	if err := s.appUserRepo.Create(ctx, user); err != nil {
		return nil, fmt.Errorf("failed to create app user: %w", err)
	}
	return user, nil
}

func (s *runtimeAuthService) Login(ctx context.Context, workspaceID uuid.UUID, email, password string) (*RuntimeAuthResult, error) {
	user, err := s.appUserRepo.GetByEmail(ctx, workspaceID, email)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("invalid email or password")
		}
		return nil, err
	}

	if user.Status == "blocked" {
		return nil, errors.New("account is blocked")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return nil, errors.New("invalid email or password")
	}

	// Generate session token
	token, err := generateSecureToken(32)
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	// Update last login
	now := time.Now()
	user.LastLoginAt = &now
	_ = s.appUserRepo.Update(ctx, user)

	expiresAt := now.Add(s.tokenTTL)

	// Persist session to workspace_sessions with token_hash
	tokenHash := hashToken(token)
	authMethod := "password"
	session := &entity.WorkspaceSession{
		WorkspaceID: workspaceID,
		SessionType: "auth",
		AppUserID:   &user.ID,
		TokenHash:   &tokenHash,
		AuthMethod:  &authMethod,
		ExpiredAt:   &expiresAt,
	}
	if s.db != nil {
		if err := s.db.WithContext(ctx).Create(session).Error; err != nil {
			return nil, fmt.Errorf("failed to persist session: %w", err)
		}
	}

	return &RuntimeAuthResult{
		User:      user,
		Token:     token,
		ExpiresAt: expiresAt,
	}, nil
}

func (s *runtimeAuthService) ValidateSession(ctx context.Context, token string) (*entity.AppUser, error) {
	if token == "" {
		return nil, errors.New("token is required")
	}
	if s.db == nil {
		return nil, errors.New("database not configured for session validation")
	}

	tokenHash := hashToken(token)

	var session entity.WorkspaceSession
	if err := s.db.WithContext(ctx).
		Where("token_hash = ? AND session_type = ? AND (expired_at IS NULL OR expired_at > ?)", tokenHash, "auth", time.Now()).
		First(&session).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("invalid or expired session")
		}
		return nil, err
	}

	if session.AppUserID == nil {
		return nil, errors.New("session has no associated app user")
	}

	user, err := s.appUserRepo.GetByID(ctx, *session.AppUserID)
	if err != nil {
		return nil, fmt.Errorf("failed to load app user: %w", err)
	}
	if user.Status == "blocked" {
		return nil, errors.New("account is blocked")
	}

	return user, nil
}

func (s *runtimeAuthService) Logout(ctx context.Context, token string) error {
	if token == "" {
		return errors.New("token is required")
	}
	if s.db == nil {
		return nil
	}

	tokenHash := hashToken(token)
	now := time.Now()
	return s.db.WithContext(ctx).
		Model(&entity.WorkspaceSession{}).
		Where("token_hash = ? AND session_type = ?", tokenHash, "auth").
		Update("expired_at", now).Error
}

func (s *runtimeAuthService) ListUsers(ctx context.Context, workspaceID uuid.UUID, page, pageSize int) ([]entity.AppUser, int64, error) {
	return s.appUserRepo.ListByWorkspace(ctx, workspaceID, page, pageSize)
}

func (s *runtimeAuthService) BlockUser(ctx context.Context, userID uuid.UUID) error {
	user, err := s.appUserRepo.GetByID(ctx, userID)
	if err != nil {
		return fmt.Errorf("user not found: %w", err)
	}
	user.Status = "blocked"
	return s.appUserRepo.Update(ctx, user)
}

// generateSecureToken generates a cryptographically secure random token
func generateSecureToken(length int) (string, error) {
	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

// hashToken creates a SHA-256 hash of the token for storage
func hashToken(token string) string {
	hash := sha256.Sum256([]byte(token))
	return hex.EncodeToString(hash[:])
}
