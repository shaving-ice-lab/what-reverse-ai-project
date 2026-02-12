package service

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/reverseai/server/internal/domain/entity"
	"github.com/reverseai/server/internal/repository"
)

// WorkspaceRLSService RLS 策略服务接口
type WorkspaceRLSService interface {
	CreatePolicy(ctx context.Context, workspaceID uuid.UUID, tableName, column, matchField, operation, description string) (*entity.RLSPolicy, error)
	ListPolicies(ctx context.Context, workspaceID uuid.UUID) ([]entity.RLSPolicy, error)
	GetActivePoliciesForTable(ctx context.Context, workspaceID uuid.UUID, tableName string) ([]entity.RLSPolicy, error)
	UpdatePolicy(ctx context.Context, workspaceID uuid.UUID, policyID uuid.UUID, enabled *bool, column, matchField, operation, description *string) (*entity.RLSPolicy, error)
	DeletePolicy(ctx context.Context, workspaceID uuid.UUID, policyID uuid.UUID) error
}

type workspaceRLSService struct {
	repo repository.RLSPolicyRepository
}

func NewWorkspaceRLSService(repo repository.RLSPolicyRepository) WorkspaceRLSService {
	return &workspaceRLSService{repo: repo}
}

func (s *workspaceRLSService) CreatePolicy(ctx context.Context, workspaceID uuid.UUID, tableName, column, matchField, operation, description string) (*entity.RLSPolicy, error) {
	if tableName == "" || column == "" {
		return nil, fmt.Errorf("table_name and column are required")
	}
	if matchField == "" {
		matchField = "app_user_id"
	}
	if operation == "" {
		operation = "all"
	}

	policy := &entity.RLSPolicy{
		ID:          uuid.New(),
		WorkspaceID: workspaceID,
		TblName:     tableName,
		Column:      column,
		MatchField:  matchField,
		Operation:   operation,
		Enabled:     true,
		Description: description,
	}

	if err := s.repo.Create(ctx, policy); err != nil {
		return nil, fmt.Errorf("failed to create RLS policy: %w", err)
	}
	return policy, nil
}

func (s *workspaceRLSService) ListPolicies(ctx context.Context, workspaceID uuid.UUID) ([]entity.RLSPolicy, error) {
	return s.repo.ListByWorkspace(ctx, workspaceID)
}

func (s *workspaceRLSService) GetActivePoliciesForTable(ctx context.Context, workspaceID uuid.UUID, tableName string) ([]entity.RLSPolicy, error) {
	return s.repo.ListByTable(ctx, workspaceID, tableName)
}

func (s *workspaceRLSService) UpdatePolicy(ctx context.Context, workspaceID uuid.UUID, policyID uuid.UUID, enabled *bool, column, matchField, operation, description *string) (*entity.RLSPolicy, error) {
	policy, err := s.repo.GetByID(ctx, policyID)
	if err != nil {
		return nil, err
	}
	if policy.WorkspaceID != workspaceID {
		return nil, fmt.Errorf("policy not found in workspace")
	}

	if enabled != nil {
		policy.Enabled = *enabled
	}
	if column != nil {
		policy.Column = *column
	}
	if matchField != nil {
		policy.MatchField = *matchField
	}
	if operation != nil {
		policy.Operation = *operation
	}
	if description != nil {
		policy.Description = *description
	}

	if err := s.repo.Update(ctx, policy); err != nil {
		return nil, fmt.Errorf("failed to update RLS policy: %w", err)
	}
	return policy, nil
}

func (s *workspaceRLSService) DeletePolicy(ctx context.Context, workspaceID uuid.UUID, policyID uuid.UUID) error {
	policy, err := s.repo.GetByID(ctx, policyID)
	if err != nil {
		return err
	}
	if policy.WorkspaceID != workspaceID {
		return fmt.Errorf("policy not found in workspace")
	}
	return s.repo.Delete(ctx, policyID)
}
