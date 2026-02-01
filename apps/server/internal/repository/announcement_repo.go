package repository

import (
	"context"
	"time"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// AnnouncementRepository 公告仓储接口
type AnnouncementRepository interface {
	Create(ctx context.Context, announcement *entity.Announcement) error
	GetByID(ctx context.Context, id uuid.UUID) (*entity.Announcement, error)
	Update(ctx context.Context, announcement *entity.Announcement) error
	Delete(ctx context.Context, id uuid.UUID) error
	ListActive(ctx context.Context, params AnnouncementListParams) ([]entity.Announcement, int64, error)
	MarkAsRead(ctx context.Context, announcementID, userID uuid.UUID) error
	GetReadStatus(ctx context.Context, userID uuid.UUID) ([]uuid.UUID, error)
}

// AnnouncementListParams 公告列表查询参数
type AnnouncementListParams struct {
	Type     string
	Page     int
	PageSize int
}

type announcementRepository struct {
	db *gorm.DB
}

// NewAnnouncementRepository 创建公告仓储实例
func NewAnnouncementRepository(db *gorm.DB) AnnouncementRepository {
	return &announcementRepository{db: db}
}

func (r *announcementRepository) Create(ctx context.Context, announcement *entity.Announcement) error {
	if announcement.ID == uuid.Nil {
		announcement.ID = uuid.New()
	}
	announcement.CreatedAt = time.Now()
	announcement.UpdatedAt = time.Now()
	return r.db.WithContext(ctx).Create(announcement).Error
}

func (r *announcementRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.Announcement, error) {
	var announcement entity.Announcement
	if err := r.db.WithContext(ctx).Where("id = ?", id).First(&announcement).Error; err != nil {
		return nil, err
	}
	return &announcement, nil
}

func (r *announcementRepository) Update(ctx context.Context, announcement *entity.Announcement) error {
	announcement.UpdatedAt = time.Now()
	return r.db.WithContext(ctx).Save(announcement).Error
}

func (r *announcementRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Where("id = ?", id).Delete(&entity.Announcement{}).Error
}

func (r *announcementRepository) ListActive(ctx context.Context, params AnnouncementListParams) ([]entity.Announcement, int64, error) {
	var announcements []entity.Announcement
	var total int64

	now := time.Now()
	query := r.db.WithContext(ctx).Model(&entity.Announcement{}).
		Where("is_active = ?", true).
		Where("starts_at <= ?", now).
		Where("(ends_at IS NULL OR ends_at > ?)", now)

	if params.Type != "" {
		query = query.Where("type = ?", params.Type)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if params.Page <= 0 {
		params.Page = 1
	}
	if params.PageSize <= 0 {
		params.PageSize = 20
	}

	offset := (params.Page - 1) * params.PageSize
	if err := query.Order("priority DESC, created_at DESC").
		Offset(offset).
		Limit(params.PageSize).
		Find(&announcements).Error; err != nil {
		return nil, 0, err
	}

	return announcements, total, nil
}

func (r *announcementRepository) MarkAsRead(ctx context.Context, announcementID, userID uuid.UUID) error {
	read := &entity.AnnouncementRead{
		ID:             uuid.New(),
		AnnouncementID: announcementID,
		UserID:         userID,
		ReadAt:         time.Now(),
	}
	return r.db.WithContext(ctx).
		Clauses().
		Create(read).Error
}

func (r *announcementRepository) GetReadStatus(ctx context.Context, userID uuid.UUID) ([]uuid.UUID, error) {
	var readIDs []uuid.UUID
	if err := r.db.WithContext(ctx).
		Model(&entity.AnnouncementRead{}).
		Where("user_id = ?", userID).
		Pluck("announcement_id", &readIDs).Error; err != nil {
		return nil, err
	}
	return readIDs, nil
}
