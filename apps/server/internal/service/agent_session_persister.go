package service

import (
	"context"
	"encoding/json"
	"time"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/repository"
	"github.com/google/uuid"
)

// agentSessionPersisterAdapter bridges AgentSessionPersister (service layer)
// with AgentSessionRepository (repository layer) to enable database persistence.
type agentSessionPersisterAdapter struct {
	repo repository.AgentSessionRepository
}

// NewAgentSessionPersisterAdapter creates a new adapter.
func NewAgentSessionPersisterAdapter(repo repository.AgentSessionRepository) AgentSessionPersister {
	return &agentSessionPersisterAdapter{repo: repo}
}

func (a *agentSessionPersisterAdapter) Save(session *AgentSession) error {
	if session == nil {
		return nil
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	sessionID, err := uuid.Parse(session.ID)
	if err != nil {
		sessionID = uuid.New()
	}
	workspaceID, _ := uuid.Parse(session.WorkspaceID)
	userID, _ := uuid.Parse(session.UserID)

	// entity.JSON is map[string]interface{}, so wrap arrays in a "data" key
	messagesMap := entity.JSON{"data": session.Messages}
	toolCallsMap := entity.JSON{"data": session.ToolCalls}
	var pendingMap entity.JSON
	if session.PendingAction != nil {
		pendingJSON, _ := json.Marshal(session.PendingAction)
		_ = json.Unmarshal(pendingJSON, &pendingMap)
	}

	dbSession := &entity.AgentSession{
		ID:            sessionID,
		WorkspaceID:   workspaceID,
		UserID:        userID,
		Status:        string(session.Status),
		Messages:      messagesMap,
		ToolCalls:     toolCallsMap,
		PendingAction: pendingMap,
		CreatedAt:     session.CreatedAt,
		UpdatedAt:     session.UpdatedAt,
	}

	// Try update first; if not found, create
	existing, err := a.repo.GetByID(ctx, sessionID)
	if err != nil || existing == nil {
		return a.repo.Create(ctx, dbSession)
	}
	return a.repo.Update(ctx, dbSession)
}

func (a *agentSessionPersisterAdapter) Load(sessionID string) (*AgentSession, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	id, err := uuid.Parse(sessionID)
	if err != nil {
		return nil, err
	}

	dbSession, err := a.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	return a.entityToSession(dbSession)
}

func (a *agentSessionPersisterAdapter) ListByWorkspace(workspaceID string) ([]*AgentSession, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	wsID, err := uuid.Parse(workspaceID)
	if err != nil {
		return nil, err
	}

	dbSessions, _, err := a.repo.ListByWorkspace(ctx, wsID, 1, 100)
	if err != nil {
		return nil, err
	}

	result := make([]*AgentSession, 0, len(dbSessions))
	for i := range dbSessions {
		s, err := a.entityToSession(&dbSessions[i])
		if err != nil {
			continue
		}
		result = append(result, s)
	}
	return result, nil
}

func (a *agentSessionPersisterAdapter) Remove(sessionID string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	id, err := uuid.Parse(sessionID)
	if err != nil {
		return err
	}
	return a.repo.Delete(ctx, id)
}

// entityToSession converts entity.AgentSession to service.AgentSession
func (a *agentSessionPersisterAdapter) entityToSession(e *entity.AgentSession) (*AgentSession, error) {
	// Convert messages
	var messages []AgentMessageEntry
	if e.Messages != nil {
		raw, _ := json.Marshal(e.Messages)
		// Messages is stored as a JSON map with a "data" wrapper or as a raw array
		// Try array first
		if err := json.Unmarshal(raw, &messages); err != nil {
			// Try unwrapping from map
			var wrapper map[string]json.RawMessage
			if err2 := json.Unmarshal(raw, &wrapper); err2 == nil {
				if data, ok := wrapper["data"]; ok {
					_ = json.Unmarshal(data, &messages)
				}
			}
		}
	}
	if messages == nil {
		messages = make([]AgentMessageEntry, 0)
	}

	// Convert tool calls
	var toolCalls []AgentToolCallRecord
	if e.ToolCalls != nil {
		raw, _ := json.Marshal(e.ToolCalls)
		if err := json.Unmarshal(raw, &toolCalls); err != nil {
			var wrapper map[string]json.RawMessage
			if err2 := json.Unmarshal(raw, &wrapper); err2 == nil {
				if data, ok := wrapper["data"]; ok {
					_ = json.Unmarshal(data, &toolCalls)
				}
			}
		}
	}
	if toolCalls == nil {
		toolCalls = make([]AgentToolCallRecord, 0)
	}

	// Convert pending action
	var pending *PendingAction
	if e.PendingAction != nil {
		raw, _ := json.Marshal(e.PendingAction)
		var p PendingAction
		if err := json.Unmarshal(raw, &p); err == nil && p.ActionID != "" {
			pending = &p
		}
	}

	return &AgentSession{
		ID:            e.ID.String(),
		WorkspaceID:   e.WorkspaceID.String(),
		UserID:        e.UserID.String(),
		Status:        AgentSessionStatus(e.Status),
		Messages:      messages,
		ToolCalls:     toolCalls,
		PendingAction: pending,
		CreatedAt:     e.CreatedAt,
		UpdatedAt:     e.UpdatedAt,
	}, nil
}
