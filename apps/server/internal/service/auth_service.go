package service

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/agentflow/server/internal/config"
	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/pkg/redis"
	"github.com/agentflow/server/internal/repository"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrUserNotFound       = errors.New("user not found")
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrEmailExists        = errors.New("email already exists")
	ErrUsernameExists     = errors.New("username already exists")
	ErrInvalidToken       = errors.New("invalid token")
	ErrTokenExpired       = errors.New("token expired")
	ErrAlreadyVerified    = errors.New("email already verified")
	ErrUserSuspended      = errors.New("user suspended")
)

// AuthService 认证服务接口
type AuthService interface {
	Register(ctx context.Context, email, username, password string) (*entity.User, *TokenPair, error)
	Login(ctx context.Context, email, password string) (*entity.User, *TokenPair, error)
	Refresh(ctx context.Context, refreshToken string) (*TokenPair, error)
	Logout(ctx context.Context, userID string) error
	ForgotPassword(ctx context.Context, email string) error
	ResetPassword(ctx context.Context, token, newPassword string) error
	VerifyEmail(ctx context.Context, token string) error
	ResendVerification(ctx context.Context, userID string) error
}

// TokenPair Token 对
type TokenPair struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
}

type authService struct {
	userRepo         repository.UserRepository
	workspaceService WorkspaceService
	redis            *redis.Client
	jwtCfg           *config.JWTConfig
	adminEmailSet    map[string]struct{}
}

// NewAuthService 创建认证服务实例
func NewAuthService(userRepo repository.UserRepository, workspaceService WorkspaceService, redis *redis.Client, jwtCfg *config.JWTConfig, adminEmails []string) AuthService {
	adminSet := map[string]struct{}{}
	for _, email := range adminEmails {
		normalized := strings.ToLower(strings.TrimSpace(email))
		if normalized != "" {
			adminSet[normalized] = struct{}{}
		}
	}
	return &authService{
		userRepo:         userRepo,
		workspaceService: workspaceService,
		redis:            redis,
		jwtCfg:           jwtCfg,
		adminEmailSet:    adminSet,
	}
}

func (s *authService) Register(ctx context.Context, email, username, password string) (*entity.User, *TokenPair, error) {
	// 检查邮箱是否已存在
	exists, err := s.userRepo.ExistsByEmail(ctx, email)
	if err != nil {
		return nil, nil, err
	}
	if exists {
		return nil, nil, ErrEmailExists
	}

	// 检查用户名是否已存在
	exists, err = s.userRepo.ExistsByUsername(ctx, username)
	if err != nil {
		return nil, nil, err
	}
	if exists {
		return nil, nil, ErrUsernameExists
	}

	// 加密密码
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, nil, err
	}

	// 创建用户
	role := "user"
	user := &entity.User{
		Email:        email,
		Username:     username,
		PasswordHash: string(hashedPassword),
		Role:         role,
		Status:       "active",
	}

	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, nil, err
	}

	// 创建默认 Workspace
	if s.workspaceService != nil {
		if _, err := s.workspaceService.EnsureDefaultWorkspace(ctx, user); err != nil {
			_ = s.userRepo.Delete(ctx, user.ID)
			return nil, nil, err
		}
	}

	// 生成 Token
	tokenPair, err := s.generateTokenPair(user.ID.String())
	if err != nil {
		return nil, nil, err
	}

	return user, tokenPair, nil
}

func (s *authService) Login(ctx context.Context, email, password string) (*entity.User, *TokenPair, error) {
	// 查找用户
	user, err := s.userRepo.GetByEmail(ctx, email)
	if err != nil {
		return nil, nil, ErrInvalidCredentials
	}

	normalizedRole := strings.TrimSpace(user.Role)
	normalizedStatus := strings.TrimSpace(user.Status)
	if normalizedRole == "" || normalizedStatus == "" {
		if normalizedRole == "" {
			user.Role = "user"
		}
		if normalizedStatus == "" {
			user.Status = "active"
		}
		_ = s.userRepo.Update(ctx, user)
	}
	// 验证密码
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return nil, nil, ErrInvalidCredentials
	}

	if strings.EqualFold(strings.TrimSpace(user.Status), "suspended") {
		return nil, nil, ErrUserSuspended
	}

	// 确保默认 Workspace 存在（兼容历史用户）
	if s.workspaceService != nil {
		if _, err := s.workspaceService.EnsureDefaultWorkspace(ctx, user); err != nil {
			return nil, nil, err
		}
	}

	// 更新最后登录时间
	now := time.Now()
	user.LastLoginAt = &now
	_ = s.userRepo.Update(ctx, user)

	// 生成 Token
	tokenPair, err := s.generateTokenPair(user.ID.String())
	if err != nil {
		return nil, nil, err
	}

	return user, tokenPair, nil
}

func (s *authService) Refresh(ctx context.Context, refreshToken string) (*TokenPair, error) {
	// 验证 Refresh Token
	token, err := jwt.Parse(refreshToken, func(token *jwt.Token) (interface{}, error) {
		return []byte(s.jwtCfg.Secret), nil
	})

	if err != nil || !token.Valid {
		return nil, ErrInvalidToken
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, ErrInvalidToken
	}

	userID, ok := claims["user_id"].(string)
	if !ok {
		return nil, ErrInvalidToken
	}

	if uid, err := uuid.Parse(userID); err == nil {
		if user, err := s.userRepo.GetByID(ctx, uid); err == nil {
			if strings.EqualFold(strings.TrimSpace(user.Status), "suspended") {
				return nil, ErrUserSuspended
			}
		}
	}

	// 检查 Token 是否在黑名单中
	key := "refresh_token_blacklist:" + refreshToken[:16]
	exists, err := s.redis.Exists(ctx, key)
	if err == nil && exists > 0 {
		return nil, ErrInvalidToken
	}

	// 生成新的 Token 对
	return s.generateTokenPair(userID)
}

func (s *authService) Logout(ctx context.Context, userID string) error {
	// 可以在这里将 Token 加入黑名单
	// 简单实现：删除 Redis 中的刷新 Token
	return nil
}

func (s *authService) ForgotPassword(ctx context.Context, email string) error {
	// 查找用户
	user, err := s.userRepo.GetByEmail(ctx, email)
	if err != nil {
		return ErrUserNotFound
	}

	// 生成重置令牌
	resetToken := uuid.New().String()

	// 将令牌存储到 Redis，有效期 1 小时
	key := "password_reset:" + resetToken
	err = s.redis.Set(ctx, key, user.ID.String(), time.Hour)
	if err != nil {
		return err
	}

	// TODO: 发送重置密码邮件
	// 在实际应用中，这里应该调用邮件服务发送带有重置链接的邮件
	// 链接格式：https://your-domain.com/reset-password?token=resetToken

	return nil
}

func (s *authService) ResetPassword(ctx context.Context, token, newPassword string) error {
	// 从 Redis 获取用户 ID
	key := "password_reset:" + token
	userID, err := s.redis.Get(ctx, key)
	if err != nil {
		return ErrInvalidToken
	}

	if userID == "" {
		return ErrTokenExpired
	}

	// 解析用户 ID
	uid, err := uuid.Parse(userID)
	if err != nil {
		return ErrInvalidToken
	}

	// 获取用户
	user, err := s.userRepo.GetByID(ctx, uid)
	if err != nil {
		return ErrUserNotFound
	}

	// 加密新密码
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	// 更新密码
	user.PasswordHash = string(hashedPassword)
	if err := s.userRepo.Update(ctx, user); err != nil {
		return err
	}

	// 删除重置令牌
	_ = s.redis.Del(ctx, key)

	return nil
}

func (s *authService) VerifyEmail(ctx context.Context, token string) error {
	// 从 Redis 获取用户 ID
	key := "email_verify:" + token
	userID, err := s.redis.Get(ctx, key)
	if err != nil {
		return ErrInvalidToken
	}

	if userID == "" {
		return ErrTokenExpired
	}

	// 解析用户 ID
	uid, err := uuid.Parse(userID)
	if err != nil {
		return ErrInvalidToken
	}

	// 获取用户
	user, err := s.userRepo.GetByID(ctx, uid)
	if err != nil {
		return ErrUserNotFound
	}

	// 更新邮箱验证状态
	user.EmailVerified = true
	if err := s.userRepo.Update(ctx, user); err != nil {
		return err
	}

	// 删除验证令牌
	_ = s.redis.Del(ctx, key)

	return nil
}

func (s *authService) ResendVerification(ctx context.Context, userID string) error {
	// 解析用户 ID
	uid, err := uuid.Parse(userID)
	if err != nil {
		return ErrInvalidToken
	}

	// 获取用户
	user, err := s.userRepo.GetByID(ctx, uid)
	if err != nil {
		return ErrUserNotFound
	}

	// 检查是否已验证
	if user.EmailVerified {
		return ErrAlreadyVerified
	}

	// 生成验证令牌
	verifyToken := uuid.New().String()

	// 将令牌存储到 Redis，有效期 24 小时
	key := "email_verify:" + verifyToken
	err = s.redis.Set(ctx, key, user.ID.String(), 24*time.Hour)
	if err != nil {
		return err
	}

	// TODO: 发送验证邮件
	// 在实际应用中，这里应该调用邮件服务发送带有验证链接的邮件
	// 链接格式：https://your-domain.com/verify-email?token=verifyToken

	return nil
}

func (s *authService) generateTokenPair(userID string) (*TokenPair, error) {
	// 生成 Access Token
	accessToken, err := s.generateToken(userID, s.jwtCfg.AccessTokenExpire)
	if err != nil {
		return nil, err
	}

	// 生成 Refresh Token
	refreshToken, err := s.generateToken(userID, s.jwtCfg.RefreshTokenExpire)
	if err != nil {
		return nil, err
	}

	return &TokenPair{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	}, nil
}

func (s *authService) generateToken(userID string, expiration time.Duration) (string, error) {
	claims := jwt.MapClaims{
		"user_id": userID,
		"exp":     time.Now().Add(expiration).Unix(),
		"iat":     time.Now().Unix(),
		"jti":     uuid.New().String(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.jwtCfg.Secret))
}

func (s *authService) isAdminEmail(email string) bool {
	if s == nil || len(s.adminEmailSet) == 0 {
		return false
	}
	normalized := strings.ToLower(strings.TrimSpace(email))
	if normalized == "" {
		return false
	}
	_, ok := s.adminEmailSet[normalized]
	return ok
}
