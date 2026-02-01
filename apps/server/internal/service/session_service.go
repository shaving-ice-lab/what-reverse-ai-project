package service

import (
	"context"
	"errors"
	"regexp"
	"strings"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/repository"
	"github.com/google/uuid"
)

// SessionService 会话服务接口
type SessionService interface {
	// CreateSession 创建会话
	CreateSession(ctx context.Context, userID uuid.UUID, token, userAgent, ip string, expiresAt int64) (*entity.UserSession, error)
	// GetDevices 获取用户登录设备列表
	GetDevices(ctx context.Context, userID uuid.UUID, currentToken string) ([]entity.LoginDevice, error)
	// LogoutDevice 登出指定设备
	LogoutDevice(ctx context.Context, userID, sessionID uuid.UUID) error
	// LogoutOtherDevices 登出其他所有设备
	LogoutOtherDevices(ctx context.Context, userID uuid.UUID, currentToken string) error
	// LogoutAllDevices 登出所有设备
	LogoutAllDevices(ctx context.Context, userID uuid.UUID) error
	// UpdateActivity 更新会话活动时间
	UpdateActivity(ctx context.Context, token string) error
	// ValidateToken 验证 Token
	ValidateToken(ctx context.Context, token string) (*entity.UserSession, error)
}

type sessionService struct {
	sessionRepo repository.SessionRepository
}

// NewSessionService 创建会话服务实例
func NewSessionService(sessionRepo repository.SessionRepository) SessionService {
	return &sessionService{
		sessionRepo: sessionRepo,
	}
}

func (s *sessionService) CreateSession(ctx context.Context, userID uuid.UUID, token, userAgentStr, ip string, expiresAt int64) (*entity.UserSession, error) {
	// 简单解析 User Agent
	deviceType, deviceName, browser, osInfo := parseUserAgent(userAgentStr)

	session := &entity.UserSession{
		UserID:     userID,
		TokenHash:  s.sessionRepo.HashToken(token),
		DeviceType: deviceType,
		DeviceName: &deviceName,
		Browser:    &browser,
		OS:         &osInfo,
		IP:         &ip,
		UserAgent:  &userAgentStr,
	}

	if err := s.sessionRepo.Create(ctx, session); err != nil {
		return nil, err
	}

	return session, nil
}

// parseUserAgent 简单解析 User-Agent 字符串
func parseUserAgent(ua string) (deviceType, deviceName, browser, osInfo string) {
	ua = strings.ToLower(ua)

	// 检测设备类型
	if strings.Contains(ua, "mobile") || strings.Contains(ua, "iphone") || strings.Contains(ua, "android") && !strings.Contains(ua, "tablet") {
		deviceType = "mobile"
	} else if strings.Contains(ua, "tablet") || strings.Contains(ua, "ipad") {
		deviceType = "tablet"
	} else {
		deviceType = "desktop"
	}

	// 检测操作系统
	switch {
	case strings.Contains(ua, "windows"):
		osInfo = "Windows"
		deviceName = "Windows PC"
	case strings.Contains(ua, "mac os") || strings.Contains(ua, "macintosh"):
		osInfo = "macOS"
		deviceName = "Mac"
	case strings.Contains(ua, "linux"):
		osInfo = "Linux"
		deviceName = "Linux PC"
	case strings.Contains(ua, "iphone"):
		osInfo = "iOS"
		deviceName = "iPhone"
	case strings.Contains(ua, "ipad"):
		osInfo = "iPadOS"
		deviceName = "iPad"
	case strings.Contains(ua, "android"):
		osInfo = "Android"
		deviceName = "Android Device"
	default:
		osInfo = "Unknown"
		deviceName = "Unknown Device"
	}

	// 检测浏览器
	switch {
	case strings.Contains(ua, "edg/"):
		browser = extractBrowserVersion(ua, `edg/([\d.]+)`, "Edge")
	case strings.Contains(ua, "chrome/") && !strings.Contains(ua, "edg/"):
		browser = extractBrowserVersion(ua, `chrome/([\d.]+)`, "Chrome")
	case strings.Contains(ua, "firefox/"):
		browser = extractBrowserVersion(ua, `firefox/([\d.]+)`, "Firefox")
	case strings.Contains(ua, "safari/") && !strings.Contains(ua, "chrome"):
		browser = extractBrowserVersion(ua, `version/([\d.]+)`, "Safari")
	default:
		browser = "Unknown Browser"
	}

	return
}

// extractBrowserVersion 提取浏览器版本
func extractBrowserVersion(ua, pattern, browserName string) string {
	re := regexp.MustCompile(pattern)
	matches := re.FindStringSubmatch(ua)
	if len(matches) > 1 {
		// 只取主版本号
		version := strings.Split(matches[1], ".")[0]
		return browserName + " " + version
	}
	return browserName
}

func (s *sessionService) GetDevices(ctx context.Context, userID uuid.UUID, currentToken string) ([]entity.LoginDevice, error) {
	sessions, err := s.sessionRepo.ListByUser(ctx, userID)
	if err != nil {
		return nil, err
	}

	currentHash := ""
	if currentToken != "" {
		currentHash = s.sessionRepo.HashToken(currentToken)
	}

	devices := make([]entity.LoginDevice, len(sessions))
	for i, session := range sessions {
		device := entity.LoginDevice{
			ID:           session.ID.String(),
			DeviceType:   session.DeviceType,
			LastActiveAt: session.LastActiveAt,
			IsCurrent:    session.TokenHash == currentHash,
		}

		if session.DeviceName != nil {
			device.DeviceName = *session.DeviceName
		} else {
			device.DeviceName = "Unknown Device"
		}

		if session.Browser != nil {
			device.Browser = *session.Browser
		}

		if session.Location != nil {
			device.Location = *session.Location
		} else {
			device.Location = "Unknown"
		}

		if session.IP != nil {
			// 隐藏部分 IP
			ip := *session.IP
			parts := strings.Split(ip, ".")
			if len(parts) == 4 {
				device.IP = parts[0] + "." + parts[1] + "." + parts[2] + ".***"
			} else {
				device.IP = ip[:len(ip)/2] + "***"
			}
		}

		devices[i] = device
	}

	return devices, nil
}

func (s *sessionService) LogoutDevice(ctx context.Context, userID, sessionID uuid.UUID) error {
	// 验证会话属于该用户
	session, err := s.sessionRepo.GetByID(ctx, sessionID)
	if err != nil {
		return ErrSessionNotFound
	}
	if session.UserID != userID {
		return ErrUnauthorized
	}
	return s.sessionRepo.Deactivate(ctx, sessionID)
}

func (s *sessionService) LogoutOtherDevices(ctx context.Context, userID uuid.UUID, currentToken string) error {
	currentHash := s.sessionRepo.HashToken(currentToken)
	currentSession, err := s.sessionRepo.GetByToken(ctx, currentHash)
	if err != nil {
		return err
	}
	return s.sessionRepo.DeactivateAllExcept(ctx, userID, currentSession.ID)
}

func (s *sessionService) LogoutAllDevices(ctx context.Context, userID uuid.UUID) error {
	return s.sessionRepo.DeactivateAll(ctx, userID)
}

func (s *sessionService) UpdateActivity(ctx context.Context, token string) error {
	tokenHash := s.sessionRepo.HashToken(token)
	session, err := s.sessionRepo.GetByToken(ctx, tokenHash)
	if err != nil {
		return err
	}
	return s.sessionRepo.UpdateLastActive(ctx, session.ID)
}

func (s *sessionService) ValidateToken(ctx context.Context, token string) (*entity.UserSession, error) {
	tokenHash := s.sessionRepo.HashToken(token)
	return s.sessionRepo.GetByToken(ctx, tokenHash)
}

// 错误定义
var (
	ErrSessionNotFound = errors.New("session not found")
)
