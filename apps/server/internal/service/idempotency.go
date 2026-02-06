package service

import (
	"context"
	"errors"
	"strings"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/repository"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

const (
	idempotencyStatusProcessing = "processing"
	idempotencyStatusCompleted  = "completed"
	idempotencyStatusFailed     = "failed"
)

var (
	ErrIdempotencyConflict   = errors.New("idempotency key conflict")
	ErrIdempotencyInProgress = errors.New("idempotency request in progress")
)

type idempotencyScope struct {
	WorkspaceID *uuid.UUID
}

type idempotencyStartResult struct {
	Record *entity.IdempotencyKey
	Replay bool
}

func beginIdempotency(ctx context.Context, repo repository.IdempotencyKeyRepository, ownerID uuid.UUID, key, action, requestHash string, scope idempotencyScope) (*idempotencyStartResult, error) {
	trimmed := strings.TrimSpace(key)
	if trimmed == "" || repo == nil {
		return nil, nil
	}
	record, err := repo.GetByKey(ctx, ownerID, action, trimmed)
	if err == nil {
		if record.RequestHash != "" && record.RequestHash != requestHash {
			return nil, ErrIdempotencyConflict
		}
		if record.Status == idempotencyStatusCompleted && record.ResourceID != nil {
			return &idempotencyStartResult{Record: record, Replay: true}, nil
		}
		if record.Status == idempotencyStatusProcessing {
			if record.ResourceID != nil {
				return &idempotencyStartResult{Record: record, Replay: true}, nil
			}
			return nil, ErrIdempotencyInProgress
		}
		if record.Status == idempotencyStatusFailed {
			record.Status = idempotencyStatusProcessing
			record.RequestHash = requestHash
			if scope.WorkspaceID != nil {
				record.WorkspaceID = scope.WorkspaceID
			}
			if err := repo.Update(ctx, record); err != nil {
				return nil, err
			}
			return &idempotencyStartResult{Record: record}, nil
		}
		return &idempotencyStartResult{Record: record}, nil
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	record = &entity.IdempotencyKey{
		OwnerUserID:    ownerID,
		IdempotencyKey: trimmed,
		Action:         action,
		WorkspaceID:    scope.WorkspaceID,
		RequestHash:    requestHash,
		Status:         idempotencyStatusProcessing,
	}
	if err := repo.Create(ctx, record); err != nil {
		if isDuplicateKeyError(err) {
			existing, err := repo.GetByKey(ctx, ownerID, action, trimmed)
			if err != nil {
				return nil, err
			}
			if existing.RequestHash != "" && existing.RequestHash != requestHash {
				return nil, ErrIdempotencyConflict
			}
			if existing.Status == idempotencyStatusCompleted && existing.ResourceID != nil {
				return &idempotencyStartResult{Record: existing, Replay: true}, nil
			}
			if existing.Status == idempotencyStatusProcessing {
				if existing.ResourceID != nil {
					return &idempotencyStartResult{Record: existing, Replay: true}, nil
				}
				return nil, ErrIdempotencyInProgress
			}
			return &idempotencyStartResult{Record: existing}, nil
		}
		return nil, err
	}
	return &idempotencyStartResult{Record: record}, nil
}

func completeIdempotency(ctx context.Context, repo repository.IdempotencyKeyRepository, record *entity.IdempotencyKey, resourceType string, resourceID uuid.UUID) {
	if record == nil || repo == nil {
		return
	}
	record.Status = idempotencyStatusCompleted
	record.ResourceType = resourceType
	record.ResourceID = &resourceID
	_ = repo.Update(ctx, record)
}

func failIdempotency(ctx context.Context, repo repository.IdempotencyKeyRepository, record *entity.IdempotencyKey) {
	if record == nil || repo == nil {
		return
	}
	record.Status = idempotencyStatusFailed
	_ = repo.Update(ctx, record)
}

func isDuplicateKeyError(err error) bool {
	if err == nil {
		return false
	}
	msg := strings.ToLower(err.Error())
	return strings.Contains(msg, "duplicate entry") ||
		strings.Contains(msg, "duplicate key") ||
		strings.Contains(msg, "unique constraint")
}
