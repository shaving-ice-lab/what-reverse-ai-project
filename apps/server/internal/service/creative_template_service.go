package service

import (
	"context"
	"errors"
	"regexp"
	"strings"
	"time"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/pkg/logger"
	"github.com/agentflow/server/internal/repository"
	"github.com/google/uuid"
)

// 错误定义
var (
	ErrCreativeTemplateNotFound     = errors.New("creative template not found")
	ErrCreativeTemplateSlugExists   = errors.New("creative template slug already exists")
	ErrCreativeTemplateInvalidSlug  = errors.New("invalid slug format")
	ErrCreativeTemplateNoPermission = errors.New("no permission to modify this template")
)

// CreativeTemplateService 创意模板服务接口
type CreativeTemplateService interface {
	// 模板 CRUD
	Create(ctx context.Context, template *entity.CreativeTemplate, creatorID *uuid.UUID) error
	GetByID(ctx context.Context, id uuid.UUID) (*entity.CreativeTemplate, error)
	GetBySlug(ctx context.Context, slug string) (*entity.CreativeTemplate, error)
	List(ctx context.Context, params repository.CreativeTemplateListParams) ([]entity.CreativeTemplate, int64, error)
	Update(ctx context.Context, id uuid.UUID, updates map[string]interface{}, userID uuid.UUID) error
	Delete(ctx context.Context, id uuid.UUID, userID uuid.UUID) error

	// 查询方法
	GetFeatured(ctx context.Context, limit int) ([]entity.CreativeTemplate, error)
	GetCategories(ctx context.Context) ([]entity.CreativeTemplateCategoryInfo, error)
	GetByCategory(ctx context.Context, category string, limit int) ([]entity.CreativeTemplate, error)

	// 统计
	IncrementUsage(ctx context.Context, id uuid.UUID) error

	// 版本管理
	GetVersions(ctx context.Context, templateID uuid.UUID) ([]entity.CreativeTemplateVersion, error)
	GetVersion(ctx context.Context, templateID uuid.UUID, versionNum int) (*entity.CreativeTemplateVersion, error)
	RestoreVersion(ctx context.Context, templateID uuid.UUID, versionNum int, userID uuid.UUID) error

	// 示例
	GetExample(ctx context.Context, id uuid.UUID) (*entity.TemplateExample, error)
}

type creativeTemplateService struct {
	repo repository.CreativeTemplateRepository
	log  logger.Logger
}

// NewCreativeTemplateService 创建创意模板服务实例
func NewCreativeTemplateService(
	repo repository.CreativeTemplateRepository,
	log logger.Logger,
) CreativeTemplateService {
	return &creativeTemplateService{
		repo: repo,
		log:  log,
	}
}

// Create 创建模板
func (s *creativeTemplateService) Create(ctx context.Context, template *entity.CreativeTemplate, creatorID *uuid.UUID) error {
	// 验证 Slug 格式
	if !isValidSlug(template.Slug) {
		return ErrCreativeTemplateInvalidSlug
	}

	// 检查 Slug 是否已存在
	existing, err := s.repo.GetBySlug(ctx, template.Slug)
	if err != nil {
		return err
	}
	if existing != nil {
		return ErrCreativeTemplateSlugExists
	}

	// 设置创建者信息
	if creatorID != nil {
		template.CreatorID = creatorID
	}

	// 设置发布时间
	if template.IsPublished {
		now := time.Now()
		template.PublishedAt = &now
	}

	// 创建模板
	if err := s.repo.Create(ctx, template); err != nil {
		s.log.Error("Failed to create creative template", "error", err)
		return err
	}

	// 创建初始版本快照
	if err := s.createVersionSnapshot(ctx, template, creatorID, "初始版本"); err != nil {
		s.log.Warn("Failed to create initial version snapshot", "templateId", template.ID, "error", err)
	}

	s.log.Info("Creative template created",
		"id", template.ID,
		"slug", template.Slug,
		"category", template.Category)

	return nil
}

// GetByID 通过 ID 获取模板
func (s *creativeTemplateService) GetByID(ctx context.Context, id uuid.UUID) (*entity.CreativeTemplate, error) {
	template, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if template == nil {
		return nil, ErrCreativeTemplateNotFound
	}
	return template, nil
}

// GetBySlug 通过 Slug 获取模板
func (s *creativeTemplateService) GetBySlug(ctx context.Context, slug string) (*entity.CreativeTemplate, error) {
	template, err := s.repo.GetBySlug(ctx, slug)
	if err != nil {
		return nil, err
	}
	if template == nil {
		return nil, ErrCreativeTemplateNotFound
	}
	return template, nil
}

// List 获取模板列表
func (s *creativeTemplateService) List(ctx context.Context, params repository.CreativeTemplateListParams) ([]entity.CreativeTemplate, int64, error) {
	// 设置默认分页
	if params.Page <= 0 {
		params.Page = 1
	}
	if params.PageSize <= 0 {
		params.PageSize = 20
	}
	if params.PageSize > 100 {
		params.PageSize = 100
	}

	return s.repo.List(ctx, params)
}

// Update 更新模板
func (s *creativeTemplateService) Update(ctx context.Context, id uuid.UUID, updates map[string]interface{}, userID uuid.UUID) error {
	// 获取现有模板
	template, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if template == nil {
		return ErrCreativeTemplateNotFound
	}

	// 检查权限 (只有创建者或官方模板管理员可以修改)
	if template.CreatorID != nil && *template.CreatorID != userID && !template.IsOfficial {
		return ErrCreativeTemplateNoPermission
	}

	// 如果更新了 Slug，检查是否冲突
	if newSlug, ok := updates["slug"].(string); ok && newSlug != template.Slug {
		if !isValidSlug(newSlug) {
			return ErrCreativeTemplateInvalidSlug
		}
		existing, err := s.repo.GetBySlug(ctx, newSlug)
		if err != nil {
			return err
		}
		if existing != nil {
			return ErrCreativeTemplateSlugExists
		}
	}

	// 记录变更前的版本
	changeSummary := buildChangeSummary(updates)
	
	// 应用更新
	applyUpdates(template, updates)

	// 增加版本号
	template.Version++

	// 保存更新
	if err := s.repo.Update(ctx, template); err != nil {
		s.log.Error("Failed to update creative template", "id", id, "error", err)
		return err
	}

	// 创建版本快照
	if err := s.createVersionSnapshot(ctx, template, &userID, changeSummary); err != nil {
		s.log.Warn("Failed to create version snapshot", "templateId", id, "error", err)
	}

	s.log.Info("Creative template updated",
		"id", id,
		"version", template.Version,
		"updatedBy", userID)

	return nil
}

// Delete 删除模板
func (s *creativeTemplateService) Delete(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	template, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if template == nil {
		return ErrCreativeTemplateNotFound
	}

	// 检查权限
	if template.CreatorID != nil && *template.CreatorID != userID && !template.IsOfficial {
		return ErrCreativeTemplateNoPermission
	}

	if err := s.repo.Delete(ctx, id); err != nil {
		s.log.Error("Failed to delete creative template", "id", id, "error", err)
		return err
	}

	s.log.Info("Creative template deleted", "id", id, "deletedBy", userID)
	return nil
}

// GetFeatured 获取精选模板
func (s *creativeTemplateService) GetFeatured(ctx context.Context, limit int) ([]entity.CreativeTemplate, error) {
	if limit <= 0 {
		limit = 10
	}
	if limit > 50 {
		limit = 50
	}
	return s.repo.GetFeatured(ctx, limit)
}

// GetCategories 获取分类列表(带统计)
func (s *creativeTemplateService) GetCategories(ctx context.Context) ([]entity.CreativeTemplateCategoryInfo, error) {
	categories := entity.GetCreativeTemplateCategories()

	// 获取各分类的数量
	counts, err := s.repo.CountByCategory(ctx)
	if err != nil {
		s.log.Warn("Failed to get category counts", "error", err)
		return categories, nil
	}

	// 填充数量
	for i := range categories {
		if count, ok := counts[categories[i].ID]; ok {
			categories[i].Count = count
		}
	}

	return categories, nil
}

// GetByCategory 获取指定分类的模板
func (s *creativeTemplateService) GetByCategory(ctx context.Context, category string, limit int) ([]entity.CreativeTemplate, error) {
	if limit <= 0 {
		limit = 20
	}
	return s.repo.GetByCategory(ctx, category, limit)
}

// IncrementUsage 增加使用次数
func (s *creativeTemplateService) IncrementUsage(ctx context.Context, id uuid.UUID) error {
	return s.repo.IncrementUsageCount(ctx, id)
}

// ================== 版本管理 ==================

// GetVersions 获取版本历史
func (s *creativeTemplateService) GetVersions(ctx context.Context, templateID uuid.UUID) ([]entity.CreativeTemplateVersion, error) {
	return s.repo.GetVersions(ctx, templateID)
}

// GetVersion 获取指定版本
func (s *creativeTemplateService) GetVersion(ctx context.Context, templateID uuid.UUID, versionNum int) (*entity.CreativeTemplateVersion, error) {
	version, err := s.repo.GetVersion(ctx, templateID, versionNum)
	if err != nil {
		return nil, err
	}
	if version == nil {
		return nil, errors.New("version not found")
	}
	return version, nil
}

// RestoreVersion 恢复到指定版本
func (s *creativeTemplateService) RestoreVersion(ctx context.Context, templateID uuid.UUID, versionNum int, userID uuid.UUID) error {
	// 获取模板
	template, err := s.repo.GetByID(ctx, templateID)
	if err != nil {
		return err
	}
	if template == nil {
		return ErrCreativeTemplateNotFound
	}

	// 检查权限
	if template.CreatorID != nil && *template.CreatorID != userID {
		return ErrCreativeTemplateNoPermission
	}

	// 获取目标版本
	version, err := s.repo.GetVersion(ctx, templateID, versionNum)
	if err != nil {
		return err
	}
	if version == nil {
		return errors.New("version not found")
	}

	// 恢复数据
	template.Name = version.Name
	template.Description = version.Description
	template.InputsRequired = version.InputsRequired
	template.InputsOptional = version.InputsOptional
	template.OutputSections = version.OutputSections
	template.Version++

	// 保存
	if err := s.repo.Update(ctx, template); err != nil {
		return err
	}

	// 创建恢复版本记录
	changeSummary := "恢复到版本 " + string(rune(versionNum))
	if err := s.createVersionSnapshot(ctx, template, &userID, changeSummary); err != nil {
		s.log.Warn("Failed to create restore version snapshot", "error", err)
	}

	s.log.Info("Creative template restored",
		"templateId", templateID,
		"restoredVersion", versionNum,
		"newVersion", template.Version)

	return nil
}

// GetExample 获取模板示例
func (s *creativeTemplateService) GetExample(ctx context.Context, id uuid.UUID) (*entity.TemplateExample, error) {
	template, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if template == nil {
		return nil, ErrCreativeTemplateNotFound
	}

	// 构建示例对象
	example := &entity.TemplateExample{}

	// 解析示例输入 (JSON 类型本身就是 map[string]interface{})
	if template.ExampleInput != nil {
		example.Input = map[string]interface{}(template.ExampleInput)
	}

	// 设置示例输出
	if template.ExampleOutput != nil {
		example.Output = *template.ExampleOutput
	}

	// 设置示例标题和描述
	if template.ExampleTitle != nil {
		example.Title = *template.ExampleTitle
	}
	if template.ExampleDescription != nil {
		example.Description = *template.ExampleDescription
	}

	return example, nil
}

// ================== 辅助方法 ==================

// createVersionSnapshot 创建版本快照
func (s *creativeTemplateService) createVersionSnapshot(ctx context.Context, template *entity.CreativeTemplate, userID *uuid.UUID, changeSummary string) error {
	version := &entity.CreativeTemplateVersion{
		TemplateID:     template.ID,
		Version:        template.Version,
		Name:           template.Name,
		Description:    template.Description,
		InputsRequired: template.InputsRequired,
		InputsOptional: template.InputsOptional,
		OutputSections: template.OutputSections,
		ChangeSummary:  &changeSummary,
		ChangedBy:      userID,
	}

	return s.repo.CreateVersion(ctx, version)
}

// isValidSlug 验证 Slug 格式
func isValidSlug(slug string) bool {
	if len(slug) < 3 || len(slug) > 100 {
		return false
	}
	// 必须以小写字母开头，只能包含小写字母、数字和连字符
	match, _ := regexp.MatchString(`^[a-z][a-z0-9-]*[a-z0-9]$`, slug)
	return match
}

// buildChangeSummary 构建变更摘要
func buildChangeSummary(updates map[string]interface{}) string {
	var changes []string

	if _, ok := updates["name"]; ok {
		changes = append(changes, "名称")
	}
	if _, ok := updates["description"]; ok {
		changes = append(changes, "描述")
	}
	if _, ok := updates["inputs_required"]; ok {
		changes = append(changes, "必填字段")
	}
	if _, ok := updates["inputs_optional"]; ok {
		changes = append(changes, "选填字段")
	}
	if _, ok := updates["output_sections"]; ok {
		changes = append(changes, "输出章节")
	}
	if _, ok := updates["icon"]; ok {
		changes = append(changes, "图标")
	}
	if _, ok := updates["category"]; ok {
		changes = append(changes, "分类")
	}
	if _, ok := updates["tags"]; ok {
		changes = append(changes, "标签")
	}

	if len(changes) == 0 {
		return "内容更新"
	}
	return "更新了" + strings.Join(changes, "、")
}

// applyUpdates 应用更新到模板
func applyUpdates(template *entity.CreativeTemplate, updates map[string]interface{}) {
	if v, ok := updates["name"].(string); ok {
		template.Name = v
	}
	if v, ok := updates["slug"].(string); ok {
		template.Slug = v
	}
	if v, ok := updates["description"].(string); ok {
		template.Description = v
	}
	if v, ok := updates["icon"].(string); ok {
		template.Icon = v
	}
	if v, ok := updates["category"].(entity.CreativeTemplateCategory); ok {
		template.Category = v
	}
	if v, ok := updates["tags"].(entity.StringArray); ok {
		template.Tags = v
	}
	if v, ok := updates["inputs_required"].(entity.JSON); ok {
		template.InputsRequired = v
	}
	if v, ok := updates["inputs_optional"].(entity.JSON); ok {
		template.InputsOptional = v
	}
	if v, ok := updates["output_sections"].(entity.JSON); ok {
		template.OutputSections = v
	}
	if v, ok := updates["workflow_id"].(*uuid.UUID); ok {
		template.WorkflowID = v
	}
	if v, ok := updates["example_input"].(entity.JSON); ok {
		template.ExampleInput = v
	}
	if v, ok := updates["example_output"].(*string); ok {
		template.ExampleOutput = v
	}
	if v, ok := updates["example_title"].(*string); ok {
		template.ExampleTitle = v
	}
	if v, ok := updates["example_description"].(*string); ok {
		template.ExampleDescription = v
	}
	if v, ok := updates["estimated_time"].(int); ok {
		template.EstimatedTime = v
	}
	if v, ok := updates["is_published"].(bool); ok {
		template.IsPublished = v
		if v && template.PublishedAt == nil {
			now := time.Now()
			template.PublishedAt = &now
		}
	}
	if v, ok := updates["is_featured"].(bool); ok {
		template.IsFeatured = v
	}
}
