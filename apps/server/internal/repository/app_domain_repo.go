package repository

import (
	"context"
	"time"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// AppDomainRepository App 域名仓储接口
type AppDomainRepository interface {
	Create(ctx context.Context, domain *entity.AppDomain) error
	GetByID(ctx context.Context, id uuid.UUID) (*entity.AppDomain, error)
	GetByDomain(ctx context.Context, domain string) (*entity.AppDomain, error)
	ListByAppID(ctx context.Context, appID uuid.UUID) ([]entity.AppDomain, error)
	ListExpiryReminders(ctx context.Context, warnBefore time.Time, limit int) ([]entity.AppDomain, error)
	ListSSLExpiryReminders(ctx context.Context, warnBefore time.Time, limit int) ([]entity.AppDomain, error)
	ListSSLExpired(ctx context.Context, expiredBefore time.Time, limit int) ([]entity.AppDomain, error)
	ListSSLAutoRenewCandidates(ctx context.Context, now time.Time, renewBefore time.Time, limit int) ([]entity.AppDomain, error)
	Update(ctx context.Context, domain *entity.AppDomain) error
	UpdateStatusByApp(ctx context.Context, appID uuid.UUID, fromStatus, toStatus string, excludeID *uuid.UUID) error
	Delete(ctx context.Context, id uuid.UUID) error
}

type appDomainRepository struct {
	db *gorm.DB
}

// NewAppDomainRepository 创建 App 域名仓储实例
func NewAppDomainRepository(db *gorm.DB) AppDomainRepository {
	return &appDomainRepository{db: db}
}

func (r *appDomainRepository) Create(ctx context.Context, domain *entity.AppDomain) error {
	return r.db.WithContext(ctx).Create(domain).Error
}

func (r *appDomainRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.AppDomain, error) {
	var domain entity.AppDomain
	if err := r.db.WithContext(ctx).
		First(&domain, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &domain, nil
}

func (r *appDomainRepository) GetByDomain(ctx context.Context, domain string) (*entity.AppDomain, error) {
	var record entity.AppDomain
	if err := r.db.WithContext(ctx).
		First(&record, "domain = ?", domain).Error; err != nil {
		return nil, err
	}
	return &record, nil
}

func (r *appDomainRepository) ListByAppID(ctx context.Context, appID uuid.UUID) ([]entity.AppDomain, error) {
	var domains []entity.AppDomain
	if err := r.db.WithContext(ctx).
		Where("app_id = ?", appID).
		Order("created_at DESC").
		Find(&domains).Error; err != nil {
		return nil, err
	}
	return domains, nil
}

func (r *appDomainRepository) ListExpiryReminders(ctx context.Context, warnBefore time.Time, limit int) ([]entity.AppDomain, error) {
	var domains []entity.AppDomain
	query := r.db.WithContext(ctx).
		Where("domain_expires_at IS NOT NULL").
		Where("domain_expires_at <= ?", warnBefore).
		Where("domain_expiry_notified_at IS NULL")
	if limit > 0 {
		query = query.Limit(limit)
	}
	if err := query.Order("domain_expires_at ASC").Find(&domains).Error; err != nil {
		return nil, err
	}
	return domains, nil
}

func (r *appDomainRepository) ListSSLExpiryReminders(ctx context.Context, warnBefore time.Time, limit int) ([]entity.AppDomain, error) {
	var domains []entity.AppDomain
	query := r.db.WithContext(ctx).
		Where("ssl_expires_at IS NOT NULL").
		Where("ssl_expires_at <= ?", warnBefore).
		Where("ssl_expiry_notified_at IS NULL").
		Where("ssl_status = ?", "issued")
	if limit > 0 {
		query = query.Limit(limit)
	}
	if err := query.Order("ssl_expires_at ASC").Find(&domains).Error; err != nil {
		return nil, err
	}
	return domains, nil
}

func (r *appDomainRepository) ListSSLExpired(ctx context.Context, expiredBefore time.Time, limit int) ([]entity.AppDomain, error) {
	var domains []entity.AppDomain
	query := r.db.WithContext(ctx).
		Where("ssl_expires_at IS NOT NULL").
		Where("ssl_expires_at <= ?", expiredBefore).
		Where("ssl_status = ?", "issued")
	if limit > 0 {
		query = query.Limit(limit)
	}
	if err := query.Order("ssl_expires_at ASC").Find(&domains).Error; err != nil {
		return nil, err
	}
	return domains, nil
}

func (r *appDomainRepository) ListSSLAutoRenewCandidates(ctx context.Context, now time.Time, renewBefore time.Time, limit int) ([]entity.AppDomain, error) {
	var domains []entity.AppDomain
	query := r.db.WithContext(ctx).
		Where("ssl_expires_at IS NOT NULL").
		Where("ssl_expires_at <= ?", renewBefore).
		Where("ssl_expires_at > ?", now).
		Where("ssl_status = ?", "issued").
		Where("ssl_next_retry_at IS NULL OR ssl_next_retry_at <= ?", now)
	if limit > 0 {
		query = query.Limit(limit)
	}
	if err := query.Order("ssl_expires_at ASC").Find(&domains).Error; err != nil {
		return nil, err
	}
	return domains, nil
}

func (r *appDomainRepository) Update(ctx context.Context, domain *entity.AppDomain) error {
	return r.db.WithContext(ctx).Save(domain).Error
}

func (r *appDomainRepository) UpdateStatusByApp(ctx context.Context, appID uuid.UUID, fromStatus, toStatus string, excludeID *uuid.UUID) error {
	query := r.db.WithContext(ctx).
		Model(&entity.AppDomain{}).
		Where("app_id = ? AND status = ?", appID, fromStatus)
	if excludeID != nil {
		query = query.Where("id <> ?", *excludeID)
	}
	return query.Update("status", toStatus).Error
}

func (r *appDomainRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&entity.AppDomain{}, "id = ?", id).Error
}
