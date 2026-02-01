package service

import (
	"context"
	"errors"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/repository"
	"github.com/google/uuid"
)

var (
	ErrFolderNotFound     = errors.New("folder not found")
	ErrFolderUnauthorized = errors.New("unauthorized to access this folder")
)

// FolderService 文件夹服务接口
type FolderService interface {
	Create(ctx context.Context, userID uuid.UUID, req CreateFolderRequest) (*entity.Folder, error)
	GetByID(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*entity.Folder, error)
	List(ctx context.Context, userID uuid.UUID) ([]entity.Folder, error)
	Update(ctx context.Context, id uuid.UUID, userID uuid.UUID, req UpdateFolderRequest) (*entity.Folder, error)
	Delete(ctx context.Context, id uuid.UUID, userID uuid.UUID) error
	MoveWorkflow(ctx context.Context, workflowID uuid.UUID, folderID *uuid.UUID, userID uuid.UUID) error
	BatchMoveWorkflows(ctx context.Context, workflowIDs []uuid.UUID, folderID *uuid.UUID, userID uuid.UUID) (int, error)
}

// CreateFolderRequest 创建文件夹请求
type CreateFolderRequest struct {
	Name     string     `json:"name" validate:"required,max=100"`
	Icon     string     `json:"icon"`
	Color    string     `json:"color"`
	ParentID *uuid.UUID `json:"parent_id"`
}

// UpdateFolderRequest 更新文件夹请求
type UpdateFolderRequest struct {
	Name      *string `json:"name"`
	Icon      *string `json:"icon"`
	Color     *string `json:"color"`
	SortOrder *int    `json:"sort_order"`
}

type folderService struct {
	folderRepo   repository.FolderRepository
	workflowRepo repository.WorkflowRepository
}

// NewFolderService 创建文件夹服务实例
func NewFolderService(folderRepo repository.FolderRepository, workflowRepo repository.WorkflowRepository) FolderService {
	return &folderService{
		folderRepo:   folderRepo,
		workflowRepo: workflowRepo,
	}
}

func (s *folderService) Create(ctx context.Context, userID uuid.UUID, req CreateFolderRequest) (*entity.Folder, error) {
	folder := &entity.Folder{
		UserID:   userID,
		Name:     req.Name,
		Icon:     req.Icon,
		Color:    req.Color,
		ParentID: req.ParentID,
	}

	// 设置默认值
	if folder.Icon == "" {
		folder.Icon = "📁"
	}
	if folder.Color == "" {
		folder.Color = "#3ECF8E"
	}

	// 如果有父文件夹，验证父文件夹属于同一用户
	if req.ParentID != nil {
		parent, err := s.folderRepo.GetByID(ctx, *req.ParentID)
		if err != nil {
			return nil, ErrFolderNotFound
		}
		if parent.UserID != userID {
			return nil, ErrFolderUnauthorized
		}
	}

	if err := s.folderRepo.Create(ctx, folder); err != nil {
		return nil, err
	}

	return folder, nil
}

func (s *folderService) GetByID(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*entity.Folder, error) {
	folder, err := s.folderRepo.GetByID(ctx, id)
	if err != nil {
		return nil, ErrFolderNotFound
	}

	// 检查权限
	if folder.UserID != userID {
		return nil, ErrFolderUnauthorized
	}

	// 获取工作流数量
	count, err := s.folderRepo.CountWorkflowsInFolder(ctx, id)
	if err == nil {
		folder.WorkflowCount = int(count)
	}

	return folder, nil
}

func (s *folderService) List(ctx context.Context, userID uuid.UUID) ([]entity.Folder, error) {
	return s.folderRepo.ListWithCount(ctx, userID)
}

func (s *folderService) Update(ctx context.Context, id uuid.UUID, userID uuid.UUID, req UpdateFolderRequest) (*entity.Folder, error) {
	folder, err := s.folderRepo.GetByID(ctx, id)
	if err != nil {
		return nil, ErrFolderNotFound
	}

	// 检查权限
	if folder.UserID != userID {
		return nil, ErrFolderUnauthorized
	}

	// 不允许修改系统文件夹
	if folder.IsSystem {
		return nil, errors.New("cannot modify system folder")
	}

	// 更新字段
	if req.Name != nil {
		folder.Name = *req.Name
	}
	if req.Icon != nil {
		folder.Icon = *req.Icon
	}
	if req.Color != nil {
		folder.Color = *req.Color
	}
	if req.SortOrder != nil {
		folder.SortOrder = *req.SortOrder
	}

	if err := s.folderRepo.Update(ctx, folder); err != nil {
		return nil, err
	}

	return folder, nil
}

func (s *folderService) Delete(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	folder, err := s.folderRepo.GetByID(ctx, id)
	if err != nil {
		return ErrFolderNotFound
	}

	// 检查权限
	if folder.UserID != userID {
		return ErrFolderUnauthorized
	}

	// 不允许删除系统文件夹
	if folder.IsSystem {
		return errors.New("cannot delete system folder")
	}

	// 删除文件夹（工作流的 folder_id 会被设为 NULL，由数据库外键处理）
	return s.folderRepo.Delete(ctx, id)
}

func (s *folderService) MoveWorkflow(ctx context.Context, workflowID uuid.UUID, folderID *uuid.UUID, userID uuid.UUID) error {
	// 获取工作流
	workflow, err := s.workflowRepo.GetByID(ctx, workflowID)
	if err != nil {
		return ErrWorkflowNotFound
	}

	// 检查工作流权限
	if workflow.UserID != userID {
		return ErrUnauthorized
	}

	// 如果指定了文件夹，验证文件夹存在且属于同一用户
	if folderID != nil {
		folder, err := s.folderRepo.GetByID(ctx, *folderID)
		if err != nil {
			return ErrFolderNotFound
		}
		if folder.UserID != userID {
			return ErrFolderUnauthorized
		}
	}

	// 更新工作流的文件夹ID
	workflow.FolderID = folderID
	return s.workflowRepo.Update(ctx, workflow)
}

func (s *folderService) BatchMoveWorkflows(ctx context.Context, workflowIDs []uuid.UUID, folderID *uuid.UUID, userID uuid.UUID) (int, error) {
	// 如果指定了文件夹，验证文件夹存在且属于同一用户
	if folderID != nil {
		folder, err := s.folderRepo.GetByID(ctx, *folderID)
		if err != nil {
			return 0, ErrFolderNotFound
		}
		if folder.UserID != userID {
			return 0, ErrFolderUnauthorized
		}
	}

	successCount := 0
	for _, workflowID := range workflowIDs {
		workflow, err := s.workflowRepo.GetByID(ctx, workflowID)
		if err != nil {
			continue
		}
		if workflow.UserID != userID {
			continue
		}

		workflow.FolderID = folderID
		if err := s.workflowRepo.Update(ctx, workflow); err == nil {
			successCount++
		}
	}

	return successCount, nil
}
