package service

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"net/smtp"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/pkg/logger"
	"github.com/agentflow/server/internal/repository"
	"github.com/google/uuid"
)

type criticalEventNotificationService struct {
	workspaceRepo       repository.WorkspaceRepository
	userRepo            repository.UserRepository
	notificationService NotificationService
	log                 logger.Logger
}

var criticalEventDescriptions = map[entity.RuntimeEventType]string{
	entity.EventExecutionFailed:            "工作流执行失败",
	entity.EventDBProvisionFailed:          "数据库创建失败",
	entity.EventDBMigrationFailed:          "数据库迁移失败",
	entity.EventDomainVerifyFailed:         "域名验证失败",
	entity.EventCertIssueFailed:            "证书签发失败",
	entity.EventQuotaExceeded:              "配额超限",
	entity.EventSecurityAuthFailed:         "认证失败",
	entity.EventSystemError:                "系统错误",
	entity.EventConnectorCredentialExpired: "连接器凭证已过期",
}

// NewCriticalEventNotificationService 创建关键事件通知服务
func NewCriticalEventNotificationService(
	workspaceRepo repository.WorkspaceRepository,
	userRepo repository.UserRepository,
	notificationService NotificationService,
	log logger.Logger,
) NotificationDispatcher {
	return &criticalEventNotificationService{
		workspaceRepo:       workspaceRepo,
		userRepo:            userRepo,
		notificationService: notificationService,
		log:                 log,
	}
}

func (s *criticalEventNotificationService) DispatchRuntimeEvent(ctx context.Context, event *entity.RuntimeEvent) {
	if event == nil {
		return
	}
	description, ok := criticalEventDescriptions[event.Type]
	if !ok {
		return
	}
	recipients := s.resolveRecipients(ctx, event)
	if len(recipients) == 0 {
		return
	}

	title, content := buildCriticalEventMessage(event, description)
	for _, user := range recipients {
		if s.notificationService != nil {
			_ = s.notificationService.SendSystemNotification(ctx, user.ID, title, content)
		}
		s.sendEmail(ctx, user, title, content, event)
		s.sendSMS(ctx, user, title, content, event)
	}
}

func (s *criticalEventNotificationService) resolveRecipients(ctx context.Context, event *entity.RuntimeEvent) []*entity.User {
	users := make(map[uuid.UUID]*entity.User)

	if event.UserID != nil {
		if user := s.fetchUser(ctx, *event.UserID); user != nil {
			users[user.ID] = user
		}
	}

	if event.WorkspaceID != nil && s.workspaceRepo != nil {
		workspace, err := s.workspaceRepo.GetByID(ctx, *event.WorkspaceID)
		if err == nil && workspace != nil {
			if user := s.fetchUser(ctx, workspace.OwnerUserID); user != nil {
				users[user.ID] = user
			}
		}
	}

	results := make([]*entity.User, 0, len(users))
	for _, user := range users {
		results = append(results, user)
	}
	return results
}

func (s *criticalEventNotificationService) fetchUser(ctx context.Context, userID uuid.UUID) *entity.User {
	if s.userRepo == nil || userID == uuid.Nil {
		return nil
	}
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil || user == nil {
		if s.log != nil {
			s.log.Warn("Failed to load critical notification recipient", "user_id", userID, "error", err)
		}
		return nil
	}
	return user
}

func (s *criticalEventNotificationService) sendEmail(ctx context.Context, user *entity.User, title, content string, event *entity.RuntimeEvent) {
	if user == nil || strings.TrimSpace(user.Email) == "" {
		return
	}
	cfg, ok := loadSMTPConfig()
	if !ok {
		return
	}
	if err := sendSMTPEmail(cfg, user.Email, title, content); err != nil {
		if s.log != nil {
			s.log.Warn("Critical email notification failed",
				"user_id", user.ID,
				"email", user.Email,
				"event_type", event.Type,
				"error", err,
			)
		}
		return
	}
	if s.log != nil {
		s.log.Info("Critical email notification sent",
			"user_id", user.ID,
			"email", user.Email,
			"event_type", event.Type,
		)
	}
}

func (s *criticalEventNotificationService) sendSMS(ctx context.Context, user *entity.User, title, content string, event *entity.RuntimeEvent) {
	phone := resolveUserPhone(user)
	if phone == "" {
		return
	}
	cfg, ok := loadTwilioConfig()
	if !ok {
		return
	}
	body := buildSMSBody(title, event)
	if err := sendTwilioSMS(ctx, cfg, phone, body); err != nil {
		if s.log != nil {
			s.log.Warn("Critical SMS notification failed",
				"user_id", user.ID,
				"phone", phone,
				"event_type", event.Type,
				"error", err,
			)
		}
		return
	}
	if s.log != nil {
		s.log.Info("Critical SMS notification sent",
			"user_id", user.ID,
			"phone", phone,
			"event_type", event.Type,
		)
	}
}

func resolveUserPhone(user *entity.User) string {
	if user == nil || user.Settings == nil {
		return ""
	}
	for _, key := range []string{"phone", "sms_phone", "phone_number"} {
		if value, ok := user.Settings[key]; ok {
			switch typed := value.(type) {
			case string:
				return strings.TrimSpace(typed)
			case map[string]interface{}:
				if raw, ok := typed["value"]; ok {
					if str, ok := raw.(string); ok {
						return strings.TrimSpace(str)
					}
				}
			}
		}
	}
	return ""
}

func buildCriticalEventMessage(event *entity.RuntimeEvent, description string) (string, string) {
	title := fmt.Sprintf("关键事件：%s", description)
	createdAt := event.CreatedAt
	if createdAt.IsZero() {
		createdAt = time.Now().UTC()
	}

	lines := []string{
		fmt.Sprintf("事件类型: %s", event.Type),
		fmt.Sprintf("发生时间: %s", createdAt.UTC().Format(time.RFC3339)),
	}
	if event.WorkspaceID != nil {
		lines = append(lines, fmt.Sprintf("Workspace: %s", event.WorkspaceID.String()))
	}
	if event.ExecutionID != nil {
		lines = append(lines, fmt.Sprintf("Execution: %s", event.ExecutionID.String()))
	}
	if event.ErrorCode != "" {
		lines = append(lines, fmt.Sprintf("错误代码: %s", event.ErrorCode))
	}
	if event.ErrorMessage != "" {
		lines = append(lines, fmt.Sprintf("错误信息: %s", event.ErrorMessage))
	}
	if event.Message != "" {
		lines = append(lines, fmt.Sprintf("说明: %s", event.Message))
	}
	return title, strings.Join(lines, "\n")
}

type smtpConfig struct {
	Host     string
	Port     string
	Username string
	Password string
	From     string
	FromName string
}

type twilioConfig struct {
	AccountSID string
	AuthToken  string
	From       string
}

func loadSMTPConfig() (*smtpConfig, bool) {
	host := strings.TrimSpace(os.Getenv("AGENTFLOW_SMTP_HOST"))
	port := strings.TrimSpace(os.Getenv("AGENTFLOW_SMTP_PORT"))
	from := strings.TrimSpace(os.Getenv("AGENTFLOW_SMTP_FROM"))
	if host == "" || port == "" || from == "" {
		return nil, false
	}
	return &smtpConfig{
		Host:     host,
		Port:     port,
		From:     from,
		FromName: strings.TrimSpace(os.Getenv("AGENTFLOW_SMTP_FROM_NAME")),
		Username: strings.TrimSpace(os.Getenv("AGENTFLOW_SMTP_USERNAME")),
		Password: strings.TrimSpace(os.Getenv("AGENTFLOW_SMTP_PASSWORD")),
	}, true
}

func loadTwilioConfig() (*twilioConfig, bool) {
	sid := strings.TrimSpace(os.Getenv("AGENTFLOW_TWILIO_SID"))
	token := strings.TrimSpace(os.Getenv("AGENTFLOW_TWILIO_TOKEN"))
	from := strings.TrimSpace(os.Getenv("AGENTFLOW_TWILIO_FROM"))
	if sid == "" || token == "" || from == "" {
		return nil, false
	}
	return &twilioConfig{
		AccountSID: sid,
		AuthToken:  token,
		From:       from,
	}, true
}

func sendSMTPEmail(cfg *smtpConfig, to, subject, content string) error {
	if cfg == nil {
		return fmt.Errorf("smtp config missing")
	}
	addr := fmt.Sprintf("%s:%s", cfg.Host, cfg.Port)
	var auth smtp.Auth
	if cfg.Username != "" && cfg.Password != "" {
		auth = smtp.PlainAuth("", cfg.Username, cfg.Password, cfg.Host)
	}
	message := buildEmailMessage(cfg, to, subject, content)
	return smtp.SendMail(addr, auth, cfg.From, []string{to}, []byte(message))
}

func buildEmailMessage(cfg *smtpConfig, to, subject, content string) string {
	from := cfg.From
	if cfg.FromName != "" {
		from = fmt.Sprintf("%s <%s>", cfg.FromName, cfg.From)
	}
	lines := []string{
		fmt.Sprintf("From: %s", from),
		fmt.Sprintf("To: %s", to),
		fmt.Sprintf("Subject: %s", subject),
		"MIME-Version: 1.0",
		"Content-Type: text/plain; charset=UTF-8",
		"",
		content,
	}
	return strings.Join(lines, "\r\n")
}

func sendTwilioSMS(ctx context.Context, cfg *twilioConfig, to, body string) error {
	if cfg == nil {
		return fmt.Errorf("twilio config missing")
	}
	form := url.Values{}
	form.Set("To", to)
	form.Set("From", cfg.From)
	form.Set("Body", body)
	endpoint := fmt.Sprintf("https://api.twilio.com/2010-04-01/Accounts/%s/Messages.json", cfg.AccountSID)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, strings.NewReader(form.Encode()))
	if err != nil {
		return err
	}
	req.SetBasicAuth(cfg.AccountSID, cfg.AuthToken)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		bodyBytes, _ := io.ReadAll(io.LimitReader(resp.Body, 1024))
		return fmt.Errorf("twilio sms failed: %s", strings.TrimSpace(string(bodyBytes)))
	}
	return nil
}

func buildSMSBody(title string, event *entity.RuntimeEvent) string {
	if event == nil {
		return title
	}
	if event.ExecutionID != nil {
		return fmt.Sprintf("%s (execution: %s)", title, event.ExecutionID.String())
	}
	return title
}
