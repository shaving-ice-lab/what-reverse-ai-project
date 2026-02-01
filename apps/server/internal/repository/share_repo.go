package repository

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"strings"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

var (
	ErrShareNotFound   = errors.New("share not found")
	ErrShareExpired    = errors.New("share has expired")
	ErrInvalidPassword = errors.New("invalid share password")
	ErrShareCodeExists = errors.New("share code already exists")
)

// ShareRepository 分享仓储接口
type ShareRepository interface {
	// CRUD
	Create(ctx context.Context, share *entity.Share) error
	GetByID(ctx context.Context, id uuid.UUID) (*entity.Share, error)
	GetByCode(ctx context.Context, code string) (*entity.Share, error)
	GetByTarget(ctx context.Context, userID uuid.UUID, targetType string, targetID uuid.UUID) (*entity.Share, error)
	Update(ctx context.Context, share *entity.Share) error
	Delete(ctx context.Context, id uuid.UUID) error

	// 列表查询
	ListByUser(ctx context.Context, userID uuid.UUID, page, pageSize int) ([]entity.Share, int64, error)
	ListByTarget(ctx context.Context, targetType string, targetID uuid.UUID) ([]entity.Share, error)

	// 访问记录
	CreateView(ctx context.Context, view *entity.ShareView) error
	GetViewStats(ctx context.Context, shareID uuid.UUID) (*ShareViewStats, error)

	// 工具方法
	GenerateShareCode(ctx context.Context) (string, error)
	IncrementUniqueViews(ctx context.Context, shareID uuid.UUID) error
}

// ShareViewStats 分享访问统计
type ShareViewStats struct {
	TotalViews  int64 `json:"total_views"`
	UniqueViews int64 `json:"unique_views"`
	TodayViews  int64 `json:"today_views"`
	WeekViews   int64 `json:"week_views"`
}

type shareRepository struct {
	db *gorm.DB
}

// NewShareRepository 创建分享仓储实例
func NewShareRepository(db *gorm.DB) ShareRepository {
	return &shareRepository{db: db}
}

func (r *shareRepository) Create(ctx context.Context, share *entity.Share) error {
	return r.db.WithContext(ctx).Create(share).Error
}

func (r *shareRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.Share, error) {
	var share entity.Share
	if err := r.db.WithContext(ctx).
		Preload("User").
		First(&share, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrShareNotFound
		}
		return nil, err
	}
	return &share, nil
}

func (r *shareRepository) GetByCode(ctx context.Context, code string) (*entity.Share, error) {
	var share entity.Share
	if err := r.db.WithContext(ctx).
		Preload("User").
		First(&share, "share_code = ? AND deleted_at IS NULL", code).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrShareNotFound
		}
		return nil, err
	}
	return &share, nil
}

func (r *shareRepository) GetByTarget(ctx context.Context, userID uuid.UUID, targetType string, targetID uuid.UUID) (*entity.Share, error) {
	var share entity.Share
	if err := r.db.WithContext(ctx).
		First(&share, "user_id = ? AND target_type = ? AND target_id = ? AND deleted_at IS NULL", userID, targetType, targetID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrShareNotFound
		}
		return nil, err
	}
	return &share, nil
}

func (r *shareRepository) Update(ctx context.Context, share *entity.Share) error {
	return r.db.WithContext(ctx).Save(share).Error
}

func (r *shareRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&entity.Share{}, "id = ?", id).Error
}

func (r *shareRepository) ListByUser(ctx context.Context, userID uuid.UUID, page, pageSize int) ([]entity.Share, int64, error) {
	var shares []entity.Share
	var total int64

	query := r.db.WithContext(ctx).Model(&entity.Share{}).
		Where("user_id = ? AND deleted_at IS NULL", userID)

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	offset := (page - 1) * pageSize
	if err := r.db.WithContext(ctx).
		Where("user_id = ? AND deleted_at IS NULL", userID).
		Order("created_at DESC").
		Offset(offset).
		Limit(pageSize).
		Find(&shares).Error; err != nil {
		return nil, 0, err
	}

	return shares, total, nil
}

func (r *shareRepository) ListByTarget(ctx context.Context, targetType string, targetID uuid.UUID) ([]entity.Share, error) {
	var shares []entity.Share
	if err := r.db.WithContext(ctx).
		Where("target_type = ? AND target_id = ? AND deleted_at IS NULL", targetType, targetID).
		Order("created_at DESC").
		Find(&shares).Error; err != nil {
		return nil, err
	}
	return shares, nil
}

func (r *shareRepository) CreateView(ctx context.Context, view *entity.ShareView) error {
	return r.db.WithContext(ctx).Create(view).Error
}

func (r *shareRepository) GetViewStats(ctx context.Context, shareID uuid.UUID) (*ShareViewStats, error) {
	var stats ShareViewStats

	// 总访问量
	if err := r.db.WithContext(ctx).
		Model(&entity.ShareView{}).
		Where("share_id = ?", shareID).
		Count(&stats.TotalViews).Error; err != nil {
		return nil, err
	}

	// 独立访客数 (按 IP 统计)
	if err := r.db.WithContext(ctx).
		Model(&entity.ShareView{}).
		Where("share_id = ?", shareID).
		Distinct("ip_address").
		Count(&stats.UniqueViews).Error; err != nil {
		return nil, err
	}

	// 今日访问量
	if err := r.db.WithContext(ctx).
		Model(&entity.ShareView{}).
		Where("share_id = ? AND created_at >= CURRENT_DATE", shareID).
		Count(&stats.TodayViews).Error; err != nil {
		return nil, err
	}

	// 本周访问量
	if err := r.db.WithContext(ctx).
		Model(&entity.ShareView{}).
		Where("share_id = ? AND created_at >= CURRENT_DATE - INTERVAL '7 days'", shareID).
		Count(&stats.WeekViews).Error; err != nil {
		return nil, err
	}

	return &stats, nil
}

func (r *shareRepository) GenerateShareCode(ctx context.Context) (string, error) {
	for i := 0; i < 10; i++ { // 最多尝试10次
		code := generateRandomCode(8)

		// 检查是否已存在
		var count int64
		if err := r.db.WithContext(ctx).
			Model(&entity.Share{}).
			Where("share_code = ?", code).
			Count(&count).Error; err != nil {
			return "", err
		}

		if count == 0 {
			return code, nil
		}
	}
	return "", ErrShareCodeExists
}

func (r *shareRepository) IncrementUniqueViews(ctx context.Context, shareID uuid.UUID) error {
	return r.db.WithContext(ctx).
		Model(&entity.Share{}).
		Where("id = ?", shareID).
		UpdateColumn("unique_views", gorm.Expr("unique_views + 1")).Error
}

// generateRandomCode 生成随机分享码
func generateRandomCode(length int) string {
	b := make([]byte, length)
	rand.Read(b)
	code := base64.URLEncoding.EncodeToString(b)
	// 移除特殊字符，只保留字母数字
	code = strings.NewReplacer("+", "", "/", "", "=", "").Replace(code)
	if len(code) > length {
		code = code[:length]
	}
	return code
}
