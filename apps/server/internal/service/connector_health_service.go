package service

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/agentflow/server/internal/config"
	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/pkg/logger"
	"github.com/agentflow/server/internal/repository"
)

const (
	defaultConnectorHealthInterval       = 6 * time.Hour
	defaultConnectorExpiryWarningDays    = 7
	connectorHealthStatusHealthy         = "healthy"
	connectorHealthStatusExpiring        = "expiring"
	connectorHealthStatusExpired         = "expired"
	connectorHealthStatusNoExpiry        = "no_expiry"
	connectorHealthMetadataStatusKey     = "health_status"
	connectorHealthMetadataCheckedAtKey  = "health_checked_at"
	connectorHealthMetadataConnectorKey  = "connector_id"
	connectorHealthMetadataAuthTypeKey   = "auth_type"
	connectorHealthMetadataTokenTypeKey  = "token_type"
	connectorHealthMetadataSecretTypeKey = "secret_type"
)

// ConnectorHealthReport 连接器健康检查报告
type ConnectorHealthReport struct {
	Checked  int `json:"checked"`
	Healthy  int `json:"healthy"`
	Expiring int `json:"expiring"`
	Expired  int `json:"expired"`
	NoExpiry int `json:"no_expiry"`
	Updated  int `json:"updated"`
}

// ConnectorHealthService 连接器健康检查服务
type ConnectorHealthService interface {
	Run(ctx context.Context)
	RunOnce(ctx context.Context) (*ConnectorHealthReport, error)
}

type connectorHealthService struct {
	cfg           config.ConnectorHealthConfig
	secretRepo    repository.SecretRepository
	eventRecorder EventRecorderService
	log           logger.Logger
}

// NewConnectorHealthService 创建连接器健康检查服务
func NewConnectorHealthService(
	cfg config.ConnectorHealthConfig,
	secretRepo repository.SecretRepository,
	eventRecorder EventRecorderService,
	log logger.Logger,
) ConnectorHealthService {
	return &connectorHealthService{
		cfg:           cfg,
		secretRepo:    secretRepo,
		eventRecorder: eventRecorder,
		log:           log,
	}
}

func (s *connectorHealthService) Run(ctx context.Context) {
	if !s.cfg.Enabled {
		if s.log != nil {
			s.log.Info("Connector health disabled")
		}
		return
	}
	interval := s.resolveInterval()
	if _, err := s.RunOnce(ctx); err != nil && s.log != nil {
		s.log.Warn("Connector health initial run failed", "error", err)
	}

	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			if _, err := s.RunOnce(ctx); err != nil && s.log != nil {
				s.log.Warn("Connector health run failed", "error", err)
			}
		}
	}
}

func (s *connectorHealthService) RunOnce(ctx context.Context) (*ConnectorHealthReport, error) {
	report := &ConnectorHealthReport{}
	if !s.cfg.Enabled {
		return report, nil
	}

	now := time.Now()
	warningDays := s.resolveWarningDays()
	warningAt := now.Add(time.Duration(warningDays) * 24 * time.Hour)
	secretTypes := []string{secretTypeOAuthToken, secretTypeAPIToken}

	var firstErr error
	for _, secretType := range secretTypes {
		secrets, err := s.listConnectorSecrets(ctx, secretType)
		if err != nil {
			if firstErr == nil {
				firstErr = err
			}
			continue
		}
		for i := range secrets {
			secret := &secrets[i]
			status := evaluateConnectorHealth(secret, now, warningAt)
			report.Checked++
			switch status {
			case connectorHealthStatusExpired:
				report.Expired++
			case connectorHealthStatusExpiring:
				report.Expiring++
			case connectorHealthStatusNoExpiry:
				report.NoExpiry++
			default:
				report.Healthy++
			}
			updated, err := s.handleStatusChange(ctx, secret, status, now, warningDays)
			if updated {
				report.Updated++
			}
			if err != nil && firstErr == nil {
				firstErr = err
			}
		}
	}

	return report, firstErr
}

func (s *connectorHealthService) resolveInterval() time.Duration {
	if s.cfg.Interval > 0 {
		return s.cfg.Interval
	}
	return defaultConnectorHealthInterval
}

func (s *connectorHealthService) resolveWarningDays() int {
	if s.cfg.ExpiryWarningDays > 0 {
		return s.cfg.ExpiryWarningDays
	}
	return defaultConnectorExpiryWarningDays
}

func (s *connectorHealthService) listConnectorSecrets(ctx context.Context, secretType string) ([]entity.Secret, error) {
	status := SecretStatusActive
	filter := repository.SecretFilter{
		OwnerType:  SecretOwnerWorkspace,
		SecretType: &secretType,
		Status:     &status,
	}
	return s.secretRepo.List(ctx, filter)
}

func evaluateConnectorHealth(secret *entity.Secret, now time.Time, warningAt time.Time) string {
	if secret == nil {
		return connectorHealthStatusHealthy
	}
	if secret.ExpiresAt == nil {
		return connectorHealthStatusNoExpiry
	}
	if !secret.ExpiresAt.After(now) {
		return connectorHealthStatusExpired
	}
	if !secret.ExpiresAt.After(warningAt) {
		return connectorHealthStatusExpiring
	}
	return connectorHealthStatusHealthy
}

func (s *connectorHealthService) handleStatusChange(
	ctx context.Context,
	secret *entity.Secret,
	status string,
	now time.Time,
	warningDays int,
) (bool, error) {
	if secret == nil {
		return false, nil
	}
	previous := getMetadataString(secret.Metadata, connectorHealthMetadataStatusKey)
	if strings.EqualFold(previous, status) {
		return false, nil
	}

	if status == connectorHealthStatusExpired {
		if err := s.recordCredentialEvent(ctx, secret, entity.EventConnectorCredentialExpired, entity.SeverityError, "Connector credential expired"); err != nil {
			return false, err
		}
	}
	if status == connectorHealthStatusExpiring {
		message := fmt.Sprintf("Connector credential expiring within %d days", warningDays)
		if err := s.recordCredentialEvent(ctx, secret, entity.EventConnectorCredentialExpiring, entity.SeverityWarning, message); err != nil {
			return false, err
		}
	}

	if secret.Metadata == nil {
		secret.Metadata = entity.JSON{}
	}
	secret.Metadata[connectorHealthMetadataStatusKey] = status
	secret.Metadata[connectorHealthMetadataCheckedAtKey] = now.UTC().Format(time.RFC3339)
	secret.Metadata[connectorHealthMetadataSecretTypeKey] = secret.SecretType

	if err := s.secretRepo.Update(ctx, secret); err != nil {
		return false, err
	}
	return true, nil
}

func (s *connectorHealthService) recordCredentialEvent(
	ctx context.Context,
	secret *entity.Secret,
	eventType entity.RuntimeEventType,
	severity entity.RuntimeEventSeverity,
	message string,
) error {
	if s.eventRecorder == nil || secret == nil {
		return nil
	}
	builder := entity.NewRuntimeEvent(eventType).
		WithSeverity(severity).
		WithMessage(message).
		WithWorkspace(secret.OwnerID)

	event := builder.Build()
	event.Metadata = entity.JSON{
		"secret_id":       secret.ID.String(),
		"connector_id":    getMetadataString(secret.Metadata, connectorHealthMetadataConnectorKey),
		"auth_type":       getMetadataString(secret.Metadata, connectorHealthMetadataAuthTypeKey),
		"token_type":      getMetadataString(secret.Metadata, connectorHealthMetadataTokenTypeKey),
		"credential":      strings.TrimSpace(secret.Name),
		"secret_type":     secret.SecretType,
		"expires_at":      formatTimePtr(secret.ExpiresAt),
		"last_used_at":    formatTimePtr(secret.LastUsedAt),
		"last_rotated_at": formatTimePtr(secret.LastRotatedAt),
	}
	return s.eventRecorder.Record(ctx, event)
}

func formatTimePtr(value *time.Time) string {
	if value == nil {
		return ""
	}
	return value.UTC().Format(time.RFC3339)
}

func getMetadataString(metadata entity.JSON, key string) string {
	if metadata == nil {
		return ""
	}
	if value, ok := metadata[key]; ok {
		if str, ok := value.(string); ok {
			return str
		}
	}
	return ""
}
