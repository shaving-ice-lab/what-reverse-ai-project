package service

import (
	"encoding/json"
	"sync"
	"time"
)

// AgentSessionStatus 会话状态
type AgentSessionStatus string

const (
	AgentSessionRunning   AgentSessionStatus = "running"
	AgentSessionPaused    AgentSessionStatus = "paused"
	AgentSessionCompleted AgentSessionStatus = "completed"
	AgentSessionFailed    AgentSessionStatus = "failed"
)

// SessionPhase tracks where in the planning→execution lifecycle a session is
type SessionPhase string

const (
	SessionPhasePlanning  SessionPhase = "planning"  // LLM asks clarifying questions, no construction tools
	SessionPhaseConfirmed SessionPhase = "confirmed" // User confirmed plan, ready to execute
	SessionPhaseExecuting SessionPhase = "executing" // Actively running tools per plan
	SessionPhaseCompleted SessionPhase = "completed" // All plan steps done
)

// AgentMessageEntry 会话消息
type AgentMessageEntry struct {
	Role      string                 `json:"role"` // user, assistant, system, tool
	Content   string                 `json:"content"`
	Timestamp time.Time              `json:"timestamp"`
	Metadata  map[string]interface{} `json:"metadata,omitempty"`
}

// AgentToolCallRecord 工具调用记录
type AgentToolCallRecord struct {
	Step      int              `json:"step"`
	ToolName  string           `json:"tool_name"`
	Args      json.RawMessage  `json:"args"`
	Result    *AgentToolResult `json:"result"`
	Timestamp time.Time        `json:"timestamp"`
}

// AgentPlanStep represents a single step in an execution plan
type AgentPlanStep struct {
	ID          string `json:"id"`
	Description string `json:"description"`
	Tool        string `json:"tool,omitempty"`
	Status      string `json:"status"` // pending, in_progress, completed, failed
	Note        string `json:"note,omitempty"`
	GroupID     string `json:"group_id,omitempty"`
}

// PlanGroup groups related plan steps (e.g., "Data Layer", "UI Layer")
type PlanGroup struct {
	ID    string `json:"id"`
	Label string `json:"label"`
	Icon  string `json:"icon,omitempty"` // emoji or icon name for frontend
}

// AgentPlan represents a session-level execution plan
type AgentPlan struct {
	Title   string          `json:"title"`
	Status  string          `json:"status"`            // draft, confirmed, in_progress, completed
	Summary string          `json:"summary,omitempty"` // requirements summary from Q&A
	Groups  []PlanGroup     `json:"groups,omitempty"`
	Steps   []AgentPlanStep `json:"steps"`
}

// PendingAction 待确认操作
type PendingAction struct {
	ActionID string          `json:"action_id"`
	ToolName string          `json:"tool_name"`
	ToolArgs json.RawMessage `json:"tool_args"`
	Step     int             `json:"step"`
}

// AgentSession Agent 会话
type AgentSession struct {
	mu             sync.RWMutex
	ID             string                `json:"id"`
	WorkspaceID    string                `json:"workspace_id"`
	UserID         string                `json:"user_id"`
	PersonaID      string                `json:"persona_id"`
	Phase          SessionPhase          `json:"phase"`
	ComplexityHint RequestComplexity     `json:"complexity_hint,omitempty"` // set once on first planning message
	Status         AgentSessionStatus    `json:"status"`
	Messages       []AgentMessageEntry   `json:"messages"`
	ToolCalls      []AgentToolCallRecord `json:"tool_calls"`
	PendingAction  *PendingAction        `json:"pending_action,omitempty"`
	Plan           *AgentPlan            `json:"plan,omitempty"`
	CreatedAt      time.Time             `json:"created_at"`
	UpdatedAt      time.Time             `json:"updated_at"`
}

// AddMessage 添加消息
func (s *AgentSession) AddMessage(msg AgentMessageEntry) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.Messages = append(s.Messages, msg)
	s.UpdatedAt = time.Now()
}

// GetMessages 获取消息列表
func (s *AgentSession) GetMessages() []AgentMessageEntry {
	s.mu.RLock()
	defer s.mu.RUnlock()
	result := make([]AgentMessageEntry, len(s.Messages))
	copy(result, s.Messages)
	return result
}

// AddToolCall 添加工具调用记录
func (s *AgentSession) AddToolCall(record AgentToolCallRecord) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.ToolCalls = append(s.ToolCalls, record)
	s.UpdatedAt = time.Now()
}

// SetPendingAction 设置待确认操作
func (s *AgentSession) SetPendingAction(action *PendingAction) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.PendingAction = action
	s.UpdatedAt = time.Now()
}

// GetPendingAction 获取待确认操作
func (s *AgentSession) GetPendingAction() *PendingAction {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.PendingAction
}

// ClearPendingAction 清除待确认操作
func (s *AgentSession) ClearPendingAction() {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.PendingAction = nil
	s.UpdatedAt = time.Now()
}

// SetComplexityHint stores the one-time complexity classification for the planning phase.
// Should only be set once when the first user message arrives in planning phase.
func (s *AgentSession) SetComplexityHint(hint RequestComplexity) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.ComplexityHint = hint
	s.UpdatedAt = time.Now()
}

// GetComplexityHint returns the stored complexity classification (empty string if not yet set).
func (s *AgentSession) GetComplexityHint() RequestComplexity {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.ComplexityHint
}

// SetPhase updates the session lifecycle phase
func (s *AgentSession) SetPhase(phase SessionPhase) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.Phase = phase
	s.UpdatedAt = time.Now()
}

// GetPhase returns the current session phase
func (s *AgentSession) GetPhase() SessionPhase {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.Phase
}

// SetPlan stores an execution plan in the session
func (s *AgentSession) SetPlan(plan *AgentPlan) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.Plan = plan
	s.UpdatedAt = time.Now()
}

// GetPlan returns the current plan (nil if none)
func (s *AgentSession) GetPlan() *AgentPlan {
	s.mu.RLock()
	defer s.mu.RUnlock()
	if s.Plan == nil {
		return nil
	}
	// Return a copy
	cp := *s.Plan
	cp.Steps = make([]AgentPlanStep, len(s.Plan.Steps))
	copy(cp.Steps, s.Plan.Steps)
	cp.Groups = make([]PlanGroup, len(s.Plan.Groups))
	copy(cp.Groups, s.Plan.Groups)
	return &cp
}

// ConfirmPlan transitions the plan from draft to confirmed
func (s *AgentSession) ConfirmPlan() bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.Plan == nil || s.Plan.Status != "draft" {
		return false
	}
	s.Plan.Status = "confirmed"
	s.Phase = SessionPhaseConfirmed
	s.UpdatedAt = time.Now()
	return true
}

// UpdatePlanStep updates a specific step's status and note. Returns false if step not found.
func (s *AgentSession) UpdatePlanStep(stepID, status, note string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.Plan == nil {
		return false
	}
	for i := range s.Plan.Steps {
		if s.Plan.Steps[i].ID == stepID {
			s.Plan.Steps[i].Status = status
			if note != "" {
				s.Plan.Steps[i].Note = note
			}
			s.UpdatedAt = time.Now()
			return true
		}
	}
	return false
}

// AgentSessionManager 会话管理器（内存缓存 + 可选持久化）
type AgentSessionManager struct {
	mu       sync.RWMutex
	sessions map[string]*AgentSession
	repo     AgentSessionPersister
}

// AgentSessionPersister 可选的持久化接口（由 Repository 实现）
type AgentSessionPersister interface {
	Save(session *AgentSession) error
	Load(sessionID string) (*AgentSession, error)
	ListByWorkspace(workspaceID string) ([]*AgentSession, error)
	Remove(sessionID string) error
}

// NewAgentSessionManager 创建会话管理器
func NewAgentSessionManager() *AgentSessionManager {
	return &AgentSessionManager{
		sessions: make(map[string]*AgentSession),
	}
}

// SetPersister 设置持久化后端（可在 server.go 初始化时注入）
func (m *AgentSessionManager) SetPersister(repo AgentSessionPersister) {
	m.repo = repo
}

// GetOrCreate 获取或创建会话
func (m *AgentSessionManager) GetOrCreate(sessionID, workspaceID, userID, personaID string) *AgentSession {
	m.mu.Lock()
	defer m.mu.Unlock()

	if s, ok := m.sessions[sessionID]; ok {
		return s
	}

	// Try to load from persistent storage
	if m.repo != nil {
		if s, err := m.repo.Load(sessionID); err == nil && s != nil {
			m.sessions[sessionID] = s
			return s
		}
	}

	now := time.Now()
	s := &AgentSession{
		ID:          sessionID,
		WorkspaceID: workspaceID,
		UserID:      userID,
		PersonaID:   personaID,
		Phase:       SessionPhasePlanning,
		Status:      AgentSessionRunning,
		Messages:    make([]AgentMessageEntry, 0),
		ToolCalls:   make([]AgentToolCallRecord, 0),
		CreatedAt:   now,
		UpdatedAt:   now,
	}
	m.sessions[sessionID] = s

	// Persist new session
	if m.repo != nil {
		_ = m.repo.Save(s)
	}

	return s
}

// Persist 将会话写入持久化存储（在每次 status 变更、消息追加后调用）
func (m *AgentSessionManager) Persist(sessionID string) {
	if m.repo == nil {
		return
	}
	m.mu.RLock()
	s, ok := m.sessions[sessionID]
	m.mu.RUnlock()
	if ok {
		_ = m.repo.Save(s)
	}
}

// Get 获取会话
func (m *AgentSessionManager) Get(sessionID string) (*AgentSession, bool) {
	m.mu.RLock()
	s, ok := m.sessions[sessionID]
	m.mu.RUnlock()
	if ok {
		return s, true
	}

	// Try persistent storage
	if m.repo != nil {
		if s, err := m.repo.Load(sessionID); err == nil && s != nil {
			m.mu.Lock()
			m.sessions[sessionID] = s
			m.mu.Unlock()
			return s, true
		}
	}
	return nil, false
}

// List 列出工作空间的所有会话
func (m *AgentSessionManager) List(workspaceID string) []*AgentSession {
	// Prefer persistent storage for full listing
	if m.repo != nil {
		if sessions, err := m.repo.ListByWorkspace(workspaceID); err == nil {
			return sessions
		}
	}

	m.mu.RLock()
	defer m.mu.RUnlock()

	result := make([]*AgentSession, 0)
	for _, s := range m.sessions {
		if s.WorkspaceID == workspaceID {
			result = append(result, s)
		}
	}
	return result
}

// Delete 删除会话
func (m *AgentSessionManager) Delete(sessionID string) bool {
	m.mu.Lock()
	_, ok := m.sessions[sessionID]
	if ok {
		delete(m.sessions, sessionID)
	}
	m.mu.Unlock()

	if m.repo != nil {
		_ = m.repo.Remove(sessionID)
		return true
	}
	return ok
}

// Count 返回会话数量
func (m *AgentSessionManager) Count() int {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return len(m.sessions)
}
