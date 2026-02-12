package service

import (
	"context"
	"fmt"
	"io"
	"mime"
	"os"
	"path/filepath"
	"strings"

	"github.com/google/uuid"
	"github.com/reverseai/server/internal/domain/entity"
	"github.com/reverseai/server/internal/repository"
)

// WorkspaceStorageService 文件存储服务接口
type WorkspaceStorageService interface {
	Upload(ctx context.Context, workspaceID uuid.UUID, ownerID *uuid.UUID, file io.Reader, fileName string, fileSize int64, prefix string) (*entity.StorageObject, error)
	GetObject(ctx context.Context, workspaceID uuid.UUID, objectID uuid.UUID) (*entity.StorageObject, error)
	ListObjects(ctx context.Context, workspaceID uuid.UUID, prefix string, page, pageSize int) ([]entity.StorageObject, int64, error)
	DeleteObject(ctx context.Context, workspaceID uuid.UUID, objectID uuid.UUID) error
	GetPublicURL(objectID uuid.UUID) string
	GetStoragePath(objectID uuid.UUID) string
}

type workspaceStorageService struct {
	repo     repository.StorageObjectRepository
	basePath string
	baseURL  string
}

// NewWorkspaceStorageService 创建文件存储服务
// basePath: 本地存储根目录 (e.g. "data/storage")
// baseURL: 公开访问 URL 前缀 (e.g. "/storage/files")
func NewWorkspaceStorageService(repo repository.StorageObjectRepository, basePath, baseURL string) WorkspaceStorageService {
	if basePath == "" {
		basePath = "data/storage"
	}
	if baseURL == "" {
		baseURL = "/storage/files"
	}
	return &workspaceStorageService{
		repo:     repo,
		basePath: basePath,
		baseURL:  strings.TrimRight(baseURL, "/"),
	}
}

func (s *workspaceStorageService) Upload(ctx context.Context, workspaceID uuid.UUID, ownerID *uuid.UUID, file io.Reader, fileName string, fileSize int64, prefix string) (*entity.StorageObject, error) {
	objectID := uuid.New()

	// Determine file extension and MIME type
	ext := filepath.Ext(fileName)
	mimeType := mime.TypeByExtension(ext)
	if mimeType == "" {
		mimeType = "application/octet-stream"
	}

	// Create directory structure: basePath/workspaceID/
	dir := filepath.Join(s.basePath, workspaceID.String())
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return nil, fmt.Errorf("failed to create storage directory: %w", err)
	}

	// Write file: objectID.ext
	storageName := objectID.String() + ext
	storagePath := filepath.Join(dir, storageName)
	dst, err := os.Create(storagePath)
	if err != nil {
		return nil, fmt.Errorf("failed to create file: %w", err)
	}
	defer dst.Close()

	written, err := io.Copy(dst, file)
	if err != nil {
		os.Remove(storagePath)
		return nil, fmt.Errorf("failed to write file: %w", err)
	}
	if fileSize <= 0 {
		fileSize = written
	}

	obj := &entity.StorageObject{
		ID:          objectID,
		WorkspaceID: workspaceID,
		OwnerID:     ownerID,
		FileName:    fileName,
		MimeType:    mimeType,
		FileSize:    fileSize,
		StoragePath: storagePath,
		PublicURL:   s.GetPublicURL(objectID),
		Prefix:      prefix,
	}

	if err := s.repo.Create(ctx, obj); err != nil {
		os.Remove(storagePath)
		return nil, fmt.Errorf("failed to save storage object: %w", err)
	}

	return obj, nil
}

func (s *workspaceStorageService) GetObject(ctx context.Context, workspaceID uuid.UUID, objectID uuid.UUID) (*entity.StorageObject, error) {
	obj, err := s.repo.GetByID(ctx, objectID)
	if err != nil {
		return nil, err
	}
	if obj.WorkspaceID != workspaceID {
		return nil, fmt.Errorf("storage object not found in workspace")
	}
	return obj, nil
}

func (s *workspaceStorageService) ListObjects(ctx context.Context, workspaceID uuid.UUID, prefix string, page, pageSize int) ([]entity.StorageObject, int64, error) {
	if pageSize <= 0 {
		pageSize = 50
	}
	if pageSize > 500 {
		pageSize = 500
	}
	if page <= 0 {
		page = 1
	}
	return s.repo.ListByWorkspace(ctx, workspaceID, prefix, page, pageSize)
}

func (s *workspaceStorageService) DeleteObject(ctx context.Context, workspaceID uuid.UUID, objectID uuid.UUID) error {
	obj, err := s.repo.GetByID(ctx, objectID)
	if err != nil {
		return err
	}
	if obj.WorkspaceID != workspaceID {
		return fmt.Errorf("storage object not found in workspace")
	}

	// Delete file from disk
	if obj.StoragePath != "" {
		os.Remove(obj.StoragePath)
	}

	return s.repo.Delete(ctx, objectID)
}

func (s *workspaceStorageService) GetPublicURL(objectID uuid.UUID) string {
	return fmt.Sprintf("%s/%s", s.baseURL, objectID.String())
}

func (s *workspaceStorageService) GetStoragePath(objectID uuid.UUID) string {
	return filepath.Join(s.basePath, objectID.String())
}
