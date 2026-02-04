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
	ListAll(ctx context.Context, params AnnouncementAdminListParams) ([]entity.Announcement, int64, error)
	GetReadCounts(ctx context.Context, announcementIDs []uuid.UUID) (map[uuid.UUID]int64, error)
	MarkAsRead(ctx context.Context, announcementID, userID uuid.UUID) error
	GetReadStatus(ctx context.Context, userID uuid.UUID) ([]uuid.UUID, error)
}

// AnnouncementListParams 公告列表查询参数
type AnnouncementListParams struct {
	Type     string
	Page     int
	PageSize int
}

// AnnouncementAdminListParams 公告列表参数（管理员）
type AnnouncementAdminListParams struct {
	Type            string
	IncludeInactive bool
	IsActive        *bool
	Page            int
	PageSize        int
}

type announcementRepository struct {
	db *gorm.DB
}

type announcementReadCountRow struct {
	AnnouncementID uuid.UUID `gorm:"column:announcement_id"`
	ReadCount      int64     `gorm:"column:read_count"`
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

func (r *announcementRepository) ListAll(ctx context.Context, params AnnouncementAdminListParams) ([]entity.Announcement, int64, error) {
	var announcements []entity.Announcement
	var total int64

	query := r.db.WithContext(ctx).Model(&entity.Announcement{})
	if params.Type != "" {
		query = query.Where("type = ?", params.Type)
	}
	if params.IsActive != nil {
		query = query.Where("is_active = ?", *params.IsActive)
	} else if !params.IncludeInactive {
		query = query.Where("is_active = ?", true)
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

func (r *announcementRepository) GetReadCounts(ctx context.Context, announcementIDs []uuid.UUID) (map[uuid.UUID]int64, error) {
	counts := make(map[uuid.UUID]int64)
	if len(announcementIDs) == 0 {
		return counts, nil
	}

	var rows []announcementReadCountRow
	if err := r.db.WithContext(ctx).
		Model(&entity.AnnouncementRead{}).
		Select("announcement_id, COUNT(DISTINCT user_id) as read_count").
		Where("announcement_id IN ?", announcementIDs).
		Group("announcement_id").
		Scan(&rows).Error; err != nil {
		return nil, err
	}

	for _, row := range rows {
		counts[row.AnnouncementID] = row.ReadCount
	}

	return counts, nil
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
