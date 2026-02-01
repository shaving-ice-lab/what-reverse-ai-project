package repository

import (
	"context"
	"errors"
	"time"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// CreativeDocumentListParams 文档列表查询参数
type CreativeDocumentListParams struct {
	UserID     uuid.UUID  // 用户ID (必须)
	TemplateID *uuid.UUID // 模板ID筛选
	TaskID     *uuid.UUID // 任务ID筛选
	Search     string     // 搜索关键词
	IsArchived *bool      // 是否归档
	Page       int        // 页码
	PageSize   int        // 每页数量
	Sort       string     // 排序方式: newest, oldest, title
}

// CreativeDocumentRepository 创意文档仓储接口
type CreativeDocumentRepository interface {
	// 基础 CRUD
	Create(ctx context.Context, doc *entity.CreativeDocument) error
	GetByID(ctx context.Context, id uuid.UUID) (*entity.CreativeDocument, error)
	GetByIDAndUserID(ctx context.Context, id, userID uuid.UUID) (*entity.CreativeDocument, error)
	GetByShareID(ctx context.Context, shareID string) (*entity.CreativeDocument, error)
	List(ctx context.Context, params CreativeDocumentListParams) ([]entity.CreativeDocument, int64, error)
	Update(ctx context.Context, doc *entity.CreativeDocument) error
	Delete(ctx context.Context, id uuid.UUID) error  // 软删除
	HardDelete(ctx context.Context, id uuid.UUID) error // 硬删除

	// 内容更新
	UpdateContent(ctx context.Context, id uuid.UUID, content string, sections entity.JSON) error
	UpdateSection(ctx context.Context, id uuid.UUID, sectionID string, content string, title string) error
	UpdateTitle(ctx context.Context, id uuid.UUID, title string) error
	UpdateSummary(ctx context.Context, id uuid.UUID, summary string) error
	UpdateTableOfContents(ctx context.Context, id uuid.UUID, toc string) error

	// 分享管理
	CreateShare(ctx context.Context, id uuid.UUID, shareID string, password *string, expiresAt *time.Time, isPublic, allowDownload bool) error
	UpdateShare(ctx context.Context, id uuid.UUID, password *string, expiresAt *time.Time, isPublic, allowDownload bool) error
	DeleteShare(ctx context.Context, id uuid.UUID) error

	// 归档管理
	Archive(ctx context.Context, id uuid.UUID) error
	Unarchive(ctx context.Context, id uuid.UUID) error

	// 版本管理
	IncrementVersion(ctx context.Context, id uuid.UUID) error

	// 章节版本历史
	CreateSectionVersion(ctx context.Context, version *entity.CreativeSectionVersion) error
	GetSectionVersions(ctx context.Context, documentID uuid.UUID, sectionID string) ([]entity.CreativeSectionVersion, error)
	GetLatestSectionVersion(ctx context.Context, documentID uuid.UUID, sectionID string) (*entity.CreativeSectionVersion, error)

	// 统计查询
	CountByUserID(ctx context.Context, userID uuid.UUID) (int64, error)
	GetRecentDocuments(ctx context.Context, userID uuid.UUID, limit int) ([]entity.CreativeDocument, error)
	GetPublicDocuments(ctx context.Context, limit int) ([]entity.CreativeDocument, error)

	// 清理
	DeleteOldArchived(ctx context.Context, olderThan time.Time) (int64, error)
}

type creativeDocumentRepository struct {
	db *gorm.DB
}

// NewCreativeDocumentRepository 创建创意文档仓储实例
func NewCreativeDocumentRepository(db *gorm.DB) CreativeDocumentRepository {
	return &creativeDocumentRepository{db: db}
}

// Create 创建文档
func (r *creativeDocumentRepository) Create(ctx context.Context, doc *entity.CreativeDocument) error {
	return r.db.WithContext(ctx).Create(doc).Error
}

// GetByID 通过 ID 获取文档
func (r *creativeDocumentRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.CreativeDocument, error) {
	var doc entity.CreativeDocument
	if err := r.db.WithContext(ctx).
		Preload("User").
		Preload("Template").
		Preload("Task").
		First(&doc, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &doc, nil
}

// GetByIDAndUserID 通过 ID 和用户 ID 获取文档
func (r *creativeDocumentRepository) GetByIDAndUserID(ctx context.Context, id, userID uuid.UUID) (*entity.CreativeDocument, error) {
	var doc entity.CreativeDocument
	if err := r.db.WithContext(ctx).
		Preload("Template").
		Preload("Task").
		Where("id = ? AND user_id = ?", id, userID).
		First(&doc).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &doc, nil
}

// GetByShareID 通过分享 ID 获取文档
func (r *creativeDocumentRepository) GetByShareID(ctx context.Context, shareID string) (*entity.CreativeDocument, error) {
	var doc entity.CreativeDocument
	if err := r.db.WithContext(ctx).
		Preload("User").
		Preload("Template").
		Where("share_id = ?", shareID).
		First(&doc).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &doc, nil
}

// List 获取文档列表
func (r *creativeDocumentRepository) List(ctx context.Context, params CreativeDocumentListParams) ([]entity.CreativeDocument, int64, error) {
	var docs []entity.CreativeDocument
	var total int64

	query := r.db.WithContext(ctx).Model(&entity.CreativeDocument{}).
		Where("user_id = ?", params.UserID)

	// 模板筛选
	if params.TemplateID != nil {
		query = query.Where("template_id = ?", *params.TemplateID)
	}

	// 任务筛选
	if params.TaskID != nil {
		query = query.Where("task_id = ?", *params.TaskID)
	}

	// 搜索
	if params.Search != "" {
		searchPattern := "%" + params.Search + "%"
		query = query.Where("title LIKE ? OR content LIKE ?", searchPattern, searchPattern)
	}

	// 归档筛选
	if params.IsArchived != nil {
		query = query.Where("is_archived = ?", *params.IsArchived)
	}

	// 统计总数
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// 排序
	switch params.Sort {
	case "oldest":
		query = query.Order("created_at ASC")
	case "title":
		query = query.Order("title ASC")
	case "newest":
		fallthrough
	default:
		query = query.Order("created_at DESC")
	}

	// 分页
	if params.Page > 0 && params.PageSize > 0 {
		offset := (params.Page - 1) * params.PageSize
		query = query.Offset(offset).Limit(params.PageSize)
	}

	// 查询
	if err := query.Preload("Template").Find(&docs).Error; err != nil {
		return nil, 0, err
	}

	return docs, total, nil
}

// Update 更新文档
func (r *creativeDocumentRepository) Update(ctx context.Context, doc *entity.CreativeDocument) error {
	return r.db.WithContext(ctx).Save(doc).Error
}

// Delete 软删除文档
func (r *creativeDocumentRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&entity.CreativeDocument{}, "id = ?", id).Error
}

// HardDelete 硬删除文档
func (r *creativeDocumentRepository) HardDelete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Unscoped().Delete(&entity.CreativeDocument{}, "id = ?", id).Error
}

// UpdateContent 更新内容
func (r *creativeDocumentRepository) UpdateContent(ctx context.Context, id uuid.UUID, content string, sections entity.JSON) error {
	return r.db.WithContext(ctx).
		Model(&entity.CreativeDocument{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"content":  content,
			"sections": sections,
		}).Error
}

// UpdateSection 更新单个章节
func (r *creativeDocumentRepository) UpdateSection(ctx context.Context, id uuid.UUID, sectionID string, content string, title string) error {
	// 先获取当前文档
	var doc entity.CreativeDocument
	if err := r.db.WithContext(ctx).First(&doc, "id = ?", id).Error; err != nil {
		return err
	}

	// 更新章节
	if !doc.UpdateSection(sectionID, content, title) {
		return errors.New("section not found")
	}

	// 保存
	return r.db.WithContext(ctx).
		Model(&entity.CreativeDocument{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"sections": doc.Sections,
			"content":  doc.Content,
		}).Error
}

// UpdateTitle 更新标题
func (r *creativeDocumentRepository) UpdateTitle(ctx context.Context, id uuid.UUID, title string) error {
	return r.db.WithContext(ctx).
		Model(&entity.CreativeDocument{}).
		Where("id = ?", id).
		Update("title", title).Error
}

// UpdateSummary 更新摘要
func (r *creativeDocumentRepository) UpdateSummary(ctx context.Context, id uuid.UUID, summary string) error {
	return r.db.WithContext(ctx).
		Model(&entity.CreativeDocument{}).
		Where("id = ?", id).
		Update("summary", summary).Error
}

// UpdateTableOfContents 更新目录
func (r *creativeDocumentRepository) UpdateTableOfContents(ctx context.Context, id uuid.UUID, toc string) error {
	return r.db.WithContext(ctx).
		Model(&entity.CreativeDocument{}).
		Where("id = ?", id).
		Update("table_of_contents", toc).Error
}

// CreateShare 创建分享
func (r *creativeDocumentRepository) CreateShare(ctx context.Context, id uuid.UUID, shareID string, password *string, expiresAt *time.Time, isPublic, allowDownload bool) error {
	return r.db.WithContext(ctx).
		Model(&entity.CreativeDocument{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"share_id":         shareID,
			"share_password":   password,
			"share_expires_at": expiresAt,
			"is_public":        isPublic,
			"allow_download":   allowDownload,
		}).Error
}

// UpdateShare 更新分享设置
func (r *creativeDocumentRepository) UpdateShare(ctx context.Context, id uuid.UUID, password *string, expiresAt *time.Time, isPublic, allowDownload bool) error {
	updates := map[string]interface{}{
		"is_public":        isPublic,
		"allow_download":   allowDownload,
		"share_expires_at": expiresAt,
	}
	if password != nil {
		updates["share_password"] = *password
	}
	return r.db.WithContext(ctx).
		Model(&entity.CreativeDocument{}).
		Where("id = ?", id).
		Updates(updates).Error
}

// DeleteShare 删除分享
func (r *creativeDocumentRepository) DeleteShare(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).
		Model(&entity.CreativeDocument{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"share_id":         nil,
			"share_password":   nil,
			"share_expires_at": nil,
			"is_public":        false,
		}).Error
}

// Archive 归档文档
func (r *creativeDocumentRepository) Archive(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).
		Model(&entity.CreativeDocument{}).
		Where("id = ?", id).
		Update("is_archived", true).Error
}

// Unarchive 取消归档
func (r *creativeDocumentRepository) Unarchive(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).
		Model(&entity.CreativeDocument{}).
		Where("id = ?", id).
		Update("is_archived", false).Error
}

// IncrementVersion 增加版本号
func (r *creativeDocumentRepository) IncrementVersion(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).
		Model(&entity.CreativeDocument{}).
		Where("id = ?", id).
		UpdateColumn("version", gorm.Expr("version + 1")).Error
}

// ================== 章节版本历史 ==================

// CreateSectionVersion 创建章节版本
func (r *creativeDocumentRepository) CreateSectionVersion(ctx context.Context, version *entity.CreativeSectionVersion) error {
	return r.db.WithContext(ctx).Create(version).Error
}

// GetSectionVersions 获取章节的所有版本
func (r *creativeDocumentRepository) GetSectionVersions(ctx context.Context, documentID uuid.UUID, sectionID string) ([]entity.CreativeSectionVersion, error) {
	var versions []entity.CreativeSectionVersion
	if err := r.db.WithContext(ctx).
		Where("document_id = ? AND section_id = ?", documentID, sectionID).
		Order("version DESC").
		Find(&versions).Error; err != nil {
		return nil, err
	}
	return versions, nil
}

// GetLatestSectionVersion 获取章节最新版本
func (r *creativeDocumentRepository) GetLatestSectionVersion(ctx context.Context, documentID uuid.UUID, sectionID string) (*entity.CreativeSectionVersion, error) {
	var version entity.CreativeSectionVersion
	if err := r.db.WithContext(ctx).
		Where("document_id = ? AND section_id = ?", documentID, sectionID).
		Order("version DESC").
		First(&version).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &version, nil
}

// ================== 统计查询 ==================

// CountByUserID 统计用户文档数
func (r *creativeDocumentRepository) CountByUserID(ctx context.Context, userID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&entity.CreativeDocument{}).
		Where("user_id = ?", userID).
		Count(&count).Error
	return count, err
}

// GetRecentDocuments 获取最近文档
func (r *creativeDocumentRepository) GetRecentDocuments(ctx context.Context, userID uuid.UUID, limit int) ([]entity.CreativeDocument, error) {
	var docs []entity.CreativeDocument
	err := r.db.WithContext(ctx).
		Where("user_id = ? AND is_archived = ?", userID, false).
		Order("updated_at DESC").
		Limit(limit).
		Preload("Template").
		Find(&docs).Error
	return docs, err
}

// GetPublicDocuments 获取公开文档
func (r *creativeDocumentRepository) GetPublicDocuments(ctx context.Context, limit int) ([]entity.CreativeDocument, error) {
	var docs []entity.CreativeDocument
	err := r.db.WithContext(ctx).
		Where("is_public = ? AND share_id IS NOT NULL", true).
		Order("created_at DESC").
		Limit(limit).
		Preload("User").
		Preload("Template").
		Find(&docs).Error
	return docs, err
}

// DeleteOldArchived 删除旧的归档文档
func (r *creativeDocumentRepository) DeleteOldArchived(ctx context.Context, olderThan time.Time) (int64, error) {
	result := r.db.WithContext(ctx).
		Where("is_archived = ? AND updated_at < ?", true, olderThan).
		Delete(&entity.CreativeDocument{})
	return result.RowsAffected, result.Error
}
