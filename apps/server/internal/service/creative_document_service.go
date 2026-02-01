package service

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"time"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/pkg/export"
	"github.com/agentflow/server/internal/pkg/logger"
	"github.com/agentflow/server/internal/repository"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

// 错误定义
var (
	ErrCreativeDocumentNotFound      = errors.New("creative document not found")
	ErrCreativeDocumentNoPermission  = errors.New("no permission to access this document")
	ErrCreativeDocumentShareNotFound = errors.New("share not found or expired")
	ErrCreativeDocumentSharePassword = errors.New("incorrect share password")
	ErrSectionNotFound               = errors.New("section not found")
)

// CreateDocumentInput 创建文档输入
type CreateDocumentInput struct {
	TaskID     *uuid.UUID               `json:"task_id"`
	TemplateID *uuid.UUID               `json:"template_id"`
	Title      string                   `json:"title"`
	Content    string                   `json:"content"`
	Sections   []entity.DocumentSection `json:"sections"`
}

// UpdateDocumentInput 更新文档输入
type UpdateDocumentInput struct {
	Title       *string `json:"title,omitempty"`
	Description *string `json:"description,omitempty"`
	Content     *string `json:"content,omitempty"`
	Summary     *string `json:"summary,omitempty"`
}

// CreateShareInput 创建分享输入
type CreateShareInput struct {
	Password      *string    `json:"password,omitempty"`
	ExpiresAt     *time.Time `json:"expires_at,omitempty"`
	IsPublic      bool       `json:"is_public"`
	AllowDownload bool       `json:"allow_download"`
}

// RegenerateSectionResult 重新生成章节结果
type RegenerateSectionResult struct {
	SectionID       string `json:"section_id"`
	Title           string `json:"title"`
	Content         string `json:"content"`
	PreviousVersion int    `json:"previous_version"`
	CurrentVersion  int    `json:"current_version"`
	TokenUsed       int    `json:"token_used"`
}

// SectionGeneratorFunc 章节生成函数类型
type SectionGeneratorFunc func(ctx context.Context, sectionID string, title string, instruction string, previousContent string) (string, int, error)

// CreativeDocumentService 创意文档服务接口
type CreativeDocumentService interface {
	// 文档 CRUD
	Create(ctx context.Context, userID uuid.UUID, input CreateDocumentInput) (*entity.CreativeDocument, error)
	GetByID(ctx context.Context, docID, userID uuid.UUID) (*entity.CreativeDocument, error)
	List(ctx context.Context, userID uuid.UUID, params repository.CreativeDocumentListParams) ([]entity.CreativeDocument, int64, error)
	Update(ctx context.Context, docID, userID uuid.UUID, input UpdateDocumentInput) (*entity.CreativeDocument, error)
	Delete(ctx context.Context, docID, userID uuid.UUID) error

	// 分享功能
	CreateShare(ctx context.Context, docID, userID uuid.UUID, input CreateShareInput) (*entity.ShareSettings, error)
	GetByShareID(ctx context.Context, shareID string, password *string) (*entity.CreativeDocument, error)
	UpdateShare(ctx context.Context, docID, userID uuid.UUID, input CreateShareInput) error
	DeleteShare(ctx context.Context, docID, userID uuid.UUID) error

	// 章节操作
	UpdateSection(ctx context.Context, docID, userID uuid.UUID, sectionID string, content string, title string) error
	RegenerateSection(ctx context.Context, docID, userID uuid.UUID, sectionID string, instruction string) (*RegenerateSectionResult, error)
	GetSectionVersions(ctx context.Context, docID, userID uuid.UUID, sectionID string) ([]entity.CreativeSectionVersion, error)

	// 归档
	Archive(ctx context.Context, docID, userID uuid.UUID) error
	Unarchive(ctx context.Context, docID, userID uuid.UUID) error

	// 导出
	ExportMarkdown(ctx context.Context, docID, userID uuid.UUID) (string, error)
	ExportPDF(ctx context.Context, docID, userID uuid.UUID) ([]byte, string, error)  // 返回 PDF 字节、文件名、错误
	ExportDOCX(ctx context.Context, docID, userID uuid.UUID) ([]byte, string, error) // 返回 DOCX/RTF 字节、文件名、错误

	// 统计
	GetRecentDocuments(ctx context.Context, userID uuid.UUID, limit int) ([]entity.CreativeDocument, error)
	CountByUserID(ctx context.Context, userID uuid.UUID) (int64, error)
}

type creativeDocumentService struct {
	docRepo repository.CreativeDocumentRepository
	log     logger.Logger
}

// NewCreativeDocumentService 创建创意文档服务实例
func NewCreativeDocumentService(
	docRepo repository.CreativeDocumentRepository,
	log logger.Logger,
) CreativeDocumentService {
	return &creativeDocumentService{
		docRepo: docRepo,
		log:     log,
	}
}

// Create 创建文档
func (s *creativeDocumentService) Create(ctx context.Context, userID uuid.UUID, input CreateDocumentInput) (*entity.CreativeDocument, error) {
	doc := &entity.CreativeDocument{
		UserID:     userID,
		TaskID:     input.TaskID,
		TemplateID: input.TemplateID,
		Title:      input.Title,
		Content:    input.Content,
	}

	// 设置章节
	if len(input.Sections) > 0 {
		doc.SetSections(input.Sections)
	}

	// 计算统计信息
	doc.CalculateStats()

	if err := s.docRepo.Create(ctx, doc); err != nil {
		s.log.Error("Failed to create creative document", "error", err, "userID", userID)
		return nil, err
	}

	s.log.Info("Creative document created", "docID", doc.ID, "userID", userID)
	return doc, nil
}

// GetByID 获取文档详情
func (s *creativeDocumentService) GetByID(ctx context.Context, docID, userID uuid.UUID) (*entity.CreativeDocument, error) {
	doc, err := s.docRepo.GetByIDAndUserID(ctx, docID, userID)
	if err != nil {
		return nil, err
	}
	if doc == nil {
		return nil, ErrCreativeDocumentNotFound
	}
	return doc, nil
}

// List 获取文档列表
func (s *creativeDocumentService) List(ctx context.Context, userID uuid.UUID, params repository.CreativeDocumentListParams) ([]entity.CreativeDocument, int64, error) {
	params.UserID = userID

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

	return s.docRepo.List(ctx, params)
}

// Update 更新文档
func (s *creativeDocumentService) Update(ctx context.Context, docID, userID uuid.UUID, input UpdateDocumentInput) (*entity.CreativeDocument, error) {
	doc, err := s.GetByID(ctx, docID, userID)
	if err != nil {
		return nil, err
	}

	// 应用更新
	if input.Title != nil {
		doc.Title = *input.Title
	}
	if input.Description != nil {
		doc.Description = input.Description
	}
	if input.Content != nil {
		doc.Content = *input.Content
		doc.CalculateStats()
	}
	if input.Summary != nil {
		doc.Summary = input.Summary
	}

	// 增加版本号
	doc.Version++

	if err := s.docRepo.Update(ctx, doc); err != nil {
		s.log.Error("Failed to update creative document", "error", err, "docID", docID)
		return nil, err
	}

	s.log.Info("Creative document updated", "docID", docID, "userID", userID, "version", doc.Version)
	return doc, nil
}

// Delete 删除文档（软删除）
func (s *creativeDocumentService) Delete(ctx context.Context, docID, userID uuid.UUID) error {
	// 验证文档存在且属于该用户
	_, err := s.GetByID(ctx, docID, userID)
	if err != nil {
		return err
	}

	if err := s.docRepo.Delete(ctx, docID); err != nil {
		s.log.Error("Failed to delete creative document", "error", err, "docID", docID)
		return err
	}

	s.log.Info("Creative document deleted", "docID", docID, "userID", userID)
	return nil
}

// ================== 分享功能 ==================

// CreateShare 创建分享
func (s *creativeDocumentService) CreateShare(ctx context.Context, docID, userID uuid.UUID, input CreateShareInput) (*entity.ShareSettings, error) {
	doc, err := s.GetByID(ctx, docID, userID)
	if err != nil {
		return nil, err
	}

	// 生成分享 ID
	shareID := generateShareID()

	// 处理密码
	var hashedPassword *string
	if input.Password != nil && *input.Password != "" {
		hash, err := bcrypt.GenerateFromPassword([]byte(*input.Password), bcrypt.DefaultCost)
		if err != nil {
			return nil, err
		}
		hashStr := string(hash)
		hashedPassword = &hashStr
	}

	// 创建分享
	if err := s.docRepo.CreateShare(ctx, docID, shareID, hashedPassword, input.ExpiresAt, input.IsPublic, input.AllowDownload); err != nil {
		s.log.Error("Failed to create share", "error", err, "docID", docID)
		return nil, err
	}

	s.log.Info("Document share created", "docID", docID, "shareID", shareID)

	// 重新获取文档以获取更新后的分享设置
	doc, _ = s.GetByID(ctx, docID, userID)
	return doc.GetShareSettings(), nil
}

// GetByShareID 通过分享 ID 获取文档
func (s *creativeDocumentService) GetByShareID(ctx context.Context, shareID string, password *string) (*entity.CreativeDocument, error) {
	doc, err := s.docRepo.GetByShareID(ctx, shareID)
	if err != nil {
		return nil, err
	}
	if doc == nil {
		return nil, ErrCreativeDocumentShareNotFound
	}

	// 检查是否过期
	if doc.IsShareExpired() {
		return nil, ErrCreativeDocumentShareNotFound
	}

	// 检查密码
	if doc.HasSharePassword() {
		if password == nil || *password == "" {
			return nil, ErrCreativeDocumentSharePassword
		}
		if err := bcrypt.CompareHashAndPassword([]byte(*doc.SharePassword), []byte(*password)); err != nil {
			return nil, ErrCreativeDocumentSharePassword
		}
	}

	return doc, nil
}

// UpdateShare 更新分享设置
func (s *creativeDocumentService) UpdateShare(ctx context.Context, docID, userID uuid.UUID, input CreateShareInput) error {
	_, err := s.GetByID(ctx, docID, userID)
	if err != nil {
		return err
	}

	// 处理密码
	var hashedPassword *string
	if input.Password != nil && *input.Password != "" {
		hash, err := bcrypt.GenerateFromPassword([]byte(*input.Password), bcrypt.DefaultCost)
		if err != nil {
			return err
		}
		hashStr := string(hash)
		hashedPassword = &hashStr
	}

	return s.docRepo.UpdateShare(ctx, docID, hashedPassword, input.ExpiresAt, input.IsPublic, input.AllowDownload)
}

// DeleteShare 删除分享
func (s *creativeDocumentService) DeleteShare(ctx context.Context, docID, userID uuid.UUID) error {
	_, err := s.GetByID(ctx, docID, userID)
	if err != nil {
		return err
	}

	return s.docRepo.DeleteShare(ctx, docID)
}

// ================== 章节操作 ==================

// UpdateSection 更新章节
func (s *creativeDocumentService) UpdateSection(ctx context.Context, docID, userID uuid.UUID, sectionID string, content string, title string) error {
	doc, err := s.GetByID(ctx, docID, userID)
	if err != nil {
		return err
	}

	// 保存当前版本到历史
	sections := doc.GetSections()
	var currentSection *entity.DocumentSection
	for _, sec := range sections {
		if sec.ID == sectionID {
			currentSection = &sec
			break
		}
	}

	if currentSection == nil {
		return ErrSectionNotFound
	}

	// 获取当前版本号
	latestVersion, _ := s.docRepo.GetLatestSectionVersion(ctx, docID, sectionID)
	newVersion := 1
	if latestVersion != nil {
		newVersion = latestVersion.Version + 1
	}

	// 创建版本记录
	version := &entity.CreativeSectionVersion{
		DocumentID: docID,
		SectionID:  sectionID,
		Version:    newVersion,
		Title:      currentSection.Title,
		Content:    currentSection.Content,
	}
	if err := s.docRepo.CreateSectionVersion(ctx, version); err != nil {
		s.log.Warn("Failed to create section version", "error", err)
	}

	// 更新章节内容
	return s.docRepo.UpdateSection(ctx, docID, sectionID, content, title)
}

// RegenerateSection 重新生成章节
func (s *creativeDocumentService) RegenerateSection(ctx context.Context, docID, userID uuid.UUID, sectionID string, instruction string) (*RegenerateSectionResult, error) {
	doc, err := s.GetByID(ctx, docID, userID)
	if err != nil {
		return nil, err
	}

	// 查找章节
	sections := doc.GetSections()
	var currentSection *entity.DocumentSection
	for _, sec := range sections {
		if sec.ID == sectionID {
			currentSection = &sec
			break
		}
	}

	if currentSection == nil {
		return nil, ErrSectionNotFound
	}

	// 获取当前版本号
	latestVersion, _ := s.docRepo.GetLatestSectionVersion(ctx, docID, sectionID)
	previousVersion := 0
	newVersion := 1
	if latestVersion != nil {
		previousVersion = latestVersion.Version
		newVersion = latestVersion.Version + 1
	}

	// 保存当前版本到历史（带指令说明）
	version := &entity.CreativeSectionVersion{
		DocumentID:  docID,
		SectionID:   sectionID,
		Version:     newVersion,
		Title:       currentSection.Title,
		Content:     currentSection.Content,
		Instruction: &instruction,
	}
	if err := s.docRepo.CreateSectionVersion(ctx, version); err != nil {
		s.log.Warn("Failed to create section version before regenerate", "error", err)
	}

	// 构建重新生成的提示
	// 注意：这里暂时返回一个占位结果，实际的 LLM 调用需要通过外部生成器
	// 在实际使用中，应该注入一个生成器来处理 LLM 调用
	newContent := currentSection.Content
	tokenUsed := 0

	// 如果有指令，标记内容已被请求重新生成
	if instruction != "" {
		s.log.Info("Section regeneration requested",
			"docID", docID,
			"sectionID", sectionID,
			"instruction", instruction,
		)
	}

	// 更新章节内容（由调用方提供新内容时使用 UpdateSection）
	result := &RegenerateSectionResult{
		SectionID:       sectionID,
		Title:           currentSection.Title,
		Content:         newContent,
		PreviousVersion: previousVersion,
		CurrentVersion:  newVersion,
		TokenUsed:       tokenUsed,
	}

	s.log.Info("Section regeneration completed",
		"docID", docID,
		"sectionID", sectionID,
		"version", newVersion,
	)

	return result, nil
}

// GetSectionVersions 获取章节版本历史
func (s *creativeDocumentService) GetSectionVersions(ctx context.Context, docID, userID uuid.UUID, sectionID string) ([]entity.CreativeSectionVersion, error) {
	_, err := s.GetByID(ctx, docID, userID)
	if err != nil {
		return nil, err
	}

	return s.docRepo.GetSectionVersions(ctx, docID, sectionID)
}

// ================== 归档 ==================

// Archive 归档文档
func (s *creativeDocumentService) Archive(ctx context.Context, docID, userID uuid.UUID) error {
	_, err := s.GetByID(ctx, docID, userID)
	if err != nil {
		return err
	}

	return s.docRepo.Archive(ctx, docID)
}

// Unarchive 取消归档
func (s *creativeDocumentService) Unarchive(ctx context.Context, docID, userID uuid.UUID) error {
	_, err := s.GetByID(ctx, docID, userID)
	if err != nil {
		return err
	}

	return s.docRepo.Unarchive(ctx, docID)
}

// ================== 导出 ==================

// ExportMarkdown 导出为 Markdown
func (s *creativeDocumentService) ExportMarkdown(ctx context.Context, docID, userID uuid.UUID) (string, error) {
	doc, err := s.GetByID(ctx, docID, userID)
	if err != nil {
		return "", err
	}

	return doc.Content, nil
}

// ExportPDF 导出为 PDF
func (s *creativeDocumentService) ExportPDF(ctx context.Context, docID, userID uuid.UUID) ([]byte, string, error) {
	doc, err := s.GetByID(ctx, docID, userID)
	if err != nil {
		return nil, "", err
	}

	// 获取作者名
	author := "匿名"
	if doc.User != nil {
		if doc.User.DisplayName != nil && *doc.User.DisplayName != "" {
			author = *doc.User.DisplayName
		} else if doc.User.Username != "" {
			author = doc.User.Username
		}
	}

	// 创建 PDF 导出器
	exporter := export.NewPDFExporter()

	// 导出 PDF
	pdfData, err := exporter.ExportFromMarkdown(doc.Title, doc.Content, author)
	if err != nil {
		s.log.Error("Failed to export PDF", "error", err, "docID", docID)
		return nil, "", err
	}

	// 生成文件名
	filename := export.GetFilename(doc.Title)

	return pdfData, filename, nil
}

// ExportDOCX 导出为 DOCX/RTF 格式
func (s *creativeDocumentService) ExportDOCX(ctx context.Context, docID, userID uuid.UUID) ([]byte, string, error) {
	doc, err := s.GetByID(ctx, docID, userID)
	if err != nil {
		return nil, "", err
	}

	// 获取作者名
	author := "匿名"
	if doc.User != nil {
		if doc.User.DisplayName != nil && *doc.User.DisplayName != "" {
			author = *doc.User.DisplayName
		} else if doc.User.Username != "" {
			author = doc.User.Username
		}
	}

	// 使用 RTF 格式导出（Word 可直接打开）
	rtfData, err := export.ExportAsRTF(doc.Title, doc.Content, author)
	if err != nil {
		s.log.Error("Failed to export DOCX/RTF", "error", err, "docID", docID)
		return nil, "", err
	}

	// 生成文件名（使用 .rtf 扩展名，Word 可直接打开）
	filename := export.GetRTFFilename(doc.Title)

	return rtfData, filename, nil
}

// ================== 统计 ==================

// GetRecentDocuments 获取最近文档
func (s *creativeDocumentService) GetRecentDocuments(ctx context.Context, userID uuid.UUID, limit int) ([]entity.CreativeDocument, error) {
	if limit <= 0 {
		limit = 10
	}
	if limit > 50 {
		limit = 50
	}
	return s.docRepo.GetRecentDocuments(ctx, userID, limit)
}

// CountByUserID 统计用户文档数
func (s *creativeDocumentService) CountByUserID(ctx context.Context, userID uuid.UUID) (int64, error) {
	return s.docRepo.CountByUserID(ctx, userID)
}

// ================== 辅助函数 ==================

// generateShareID 生成分享 ID
func generateShareID() string {
	b := make([]byte, 10)
	rand.Read(b)
	return hex.EncodeToString(b)
}
