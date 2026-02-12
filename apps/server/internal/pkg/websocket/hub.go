package websocket

import (
	"encoding/json"
	"sync"
	"sync/atomic"
	"time"

	"github.com/gorilla/websocket"
	"github.com/reverseai/server/internal/pkg/logger"
)

// 延迟监控指标
type LatencyMetrics struct {
	TotalMessages  int64 // 总消息数
	TotalLatencyMs int64 // 总延迟(毫秒)
	MaxLatencyMs   int64 // 最大延迟
	LastLatencyMs  int64 // 最近一次延迟
	OverThreshold  int64 // 超过阈值次数(>500ms)
}

// 延迟阈值 (500ms)
const LatencyThresholdMs = 500

// MessageType WebSocket 消息类型
type MessageType string

const (
	// 执行相关消息类型
	MessageTypeExecutionStarted       MessageType = "execution.started"
	MessageTypeExecutionCompleted     MessageType = "execution.completed"
	MessageTypeExecutionFailed        MessageType = "execution.failed"
	MessageTypeExecutionCancelled     MessageType = "execution.cancelled"
	MessageTypeExecutionNodeStarted   MessageType = "execution.node.started"
	MessageTypeExecutionNodeCompleted MessageType = "execution.node.completed"
	MessageTypeExecutionNodeFailed    MessageType = "execution.node.failed"
	MessageTypeExecutionLog           MessageType = "execution.log"
	MessageTypeExecutionProgress      MessageType = "execution.progress"

	// 系统消息类型
	MessageTypePing  MessageType = "ping"
	MessageTypePong  MessageType = "pong"
	MessageTypeError MessageType = "error"
)

// Message WebSocket 消息结构
type Message struct {
	Type      MessageType `json:"type"`
	Payload   interface{} `json:"payload"`
	Timestamp time.Time   `json:"timestamp"`
	SentAt    int64       `json:"sentAt,omitempty"` // 发送时间戳(毫秒)，用于延迟计算
}

// ExecutionPayload 执行事件载荷
type ExecutionPayload struct {
	ExecutionID    string                 `json:"executionId"`
	Status         string                 `json:"status,omitempty"`
	NodeID         string                 `json:"nodeId,omitempty"`
	NodeType       string                 `json:"nodeType,omitempty"`
	Inputs         map[string]interface{} `json:"inputs,omitempty"`
	Outputs        map[string]interface{} `json:"outputs,omitempty"`
	Error          string                 `json:"error,omitempty"`
	DurationMs     int                    `json:"durationMs,omitempty"`
	Progress       int                    `json:"progress,omitempty"`
	TotalNodes     int                    `json:"totalNodes,omitempty"`
	CompletedNodes int                    `json:"completedNodes,omitempty"`
}

// LogPayload 日志载荷
type LogPayload struct {
	ExecutionID string    `json:"executionId"`
	NodeID      string    `json:"nodeId,omitempty"`
	Level       string    `json:"level"`
	Message     string    `json:"message"`
	Timestamp   time.Time `json:"timestamp"`
}

// Client WebSocket 客户端
type Client struct {
	ID     string
	UserID string
	Conn   *websocket.Conn
	Hub    *Hub
	Send   chan []byte
	Rooms  map[string]bool // 订阅的房间
	mu     sync.RWMutex
}

// Hub WebSocket 连接管理中心
type Hub struct {
	// 所有已连接的客户端
	clients map[*Client]bool

	// 用户 ID 到客户端的映射
	userClients map[string][]*Client

	// 房间订阅 (executionId -> clients)
	rooms map[string]map[*Client]bool

	// 注册通道
	register chan *Client

	// 注销通道
	unregister chan *Client

	// 广播通道 (增大缓冲区以减少阻塞)
	broadcast chan *BroadcastMessage

	// 高优先级广播通道 (用于实时执行事件)
	priorityBroadcast chan *BroadcastMessage

	// 日志
	log logger.Logger

	// 延迟监控指标
	metrics *LatencyMetrics

	mu sync.RWMutex
}

// BroadcastMessage 广播消息
type BroadcastMessage struct {
	Room      string // 目标房间 (executionId)，为空则广播给所有人
	UserID    string // 目标用户，为空则广播给房间内所有人
	Message   []byte
	CreatedAt time.Time // 消息创建时间，用于延迟监控
	Priority  bool      // 是否高优先级(执行事件)
}

// NewHub 创建新的 Hub
func NewHub(log logger.Logger) *Hub {
	return &Hub{
		clients:           make(map[*Client]bool),
		userClients:       make(map[string][]*Client),
		rooms:             make(map[string]map[*Client]bool),
		register:          make(chan *Client),
		unregister:        make(chan *Client),
		broadcast:         make(chan *BroadcastMessage, 1024), // 增大缓冲区减少阻塞
		priorityBroadcast: make(chan *BroadcastMessage, 512),  // 高优先级通道
		log:               log,
		metrics:           &LatencyMetrics{},
	}
}

// Run 运行 Hub
func (h *Hub) Run() {
	// 启动延迟监控报告 goroutine
	go h.reportLatencyMetrics()

	for {
		select {
		// 优先处理高优先级消息(执行事件)
		case message := <-h.priorityBroadcast:
			h.broadcastMessageWithLatency(message)

		case client := <-h.register:
			h.registerClient(client)

		case client := <-h.unregister:
			h.unregisterClient(client)

		case message := <-h.broadcast:
			h.broadcastMessageWithLatency(message)
		}
	}
}

// reportLatencyMetrics 定期报告延迟指标
func (h *Hub) reportLatencyMetrics() {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		total := atomic.LoadInt64(&h.metrics.TotalMessages)
		if total == 0 {
			continue
		}

		avgLatency := atomic.LoadInt64(&h.metrics.TotalLatencyMs) / total
		maxLatency := atomic.LoadInt64(&h.metrics.MaxLatencyMs)
		overThreshold := atomic.LoadInt64(&h.metrics.OverThreshold)

		h.log.Info("WebSocket latency metrics",
			"totalMessages", total,
			"avgLatencyMs", avgLatency,
			"maxLatencyMs", maxLatency,
			"overThreshold500ms", overThreshold,
			"clientCount", h.GetClientCount(),
			"roomCount", h.GetRoomCount())
	}
}

// broadcastMessageWithLatency 广播消息并记录延迟
func (h *Hub) broadcastMessageWithLatency(msg *BroadcastMessage) {
	// 计算广播延迟
	if !msg.CreatedAt.IsZero() {
		latencyMs := time.Since(msg.CreatedAt).Milliseconds()

		// 更新指标
		atomic.AddInt64(&h.metrics.TotalMessages, 1)
		atomic.AddInt64(&h.metrics.TotalLatencyMs, latencyMs)
		atomic.StoreInt64(&h.metrics.LastLatencyMs, latencyMs)

		// 更新最大延迟
		for {
			current := atomic.LoadInt64(&h.metrics.MaxLatencyMs)
			if latencyMs <= current {
				break
			}
			if atomic.CompareAndSwapInt64(&h.metrics.MaxLatencyMs, current, latencyMs) {
				break
			}
		}

		// 检查是否超过阈值
		if latencyMs > LatencyThresholdMs {
			atomic.AddInt64(&h.metrics.OverThreshold, 1)
			h.log.Warn("WebSocket message latency exceeded threshold",
				"latencyMs", latencyMs,
				"thresholdMs", LatencyThresholdMs,
				"room", msg.Room)
		}
	}

	h.broadcastMessage(msg)
}

func (h *Hub) registerClient(client *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()

	h.clients[client] = true
	h.userClients[client.UserID] = append(h.userClients[client.UserID], client)

	h.log.Info("WebSocket client connected",
		"clientId", client.ID,
		"userId", client.UserID,
		"totalClients", len(h.clients))
}

func (h *Hub) unregisterClient(client *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if _, ok := h.clients[client]; ok {
		delete(h.clients, client)
		close(client.Send)

		// 从用户客户端列表中移除
		clients := h.userClients[client.UserID]
		for i, c := range clients {
			if c == client {
				h.userClients[client.UserID] = append(clients[:i], clients[i+1:]...)
				break
			}
		}

		// 从所有房间中移除
		for room := range client.Rooms {
			if roomClients, ok := h.rooms[room]; ok {
				delete(roomClients, client)
				if len(roomClients) == 0 {
					delete(h.rooms, room)
				}
			}
		}

		h.log.Info("WebSocket client disconnected",
			"clientId", client.ID,
			"userId", client.UserID,
			"totalClients", len(h.clients))
	}
}

func (h *Hub) broadcastMessage(msg *BroadcastMessage) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	// 如果指定了房间，只发送给房间内的客户端
	if msg.Room != "" {
		if roomClients, ok := h.rooms[msg.Room]; ok {
			for client := range roomClients {
				// 如果指定了用户 ID，只发送给该用户
				if msg.UserID != "" && client.UserID != msg.UserID {
					continue
				}
				select {
				case client.Send <- msg.Message:
				default:
					// 发送缓冲区满，关闭连接
					close(client.Send)
					delete(h.clients, client)
				}
			}
		}
		return
	}

	// 如果只指定了用户 ID，发送给该用户的所有连接
	if msg.UserID != "" {
		if clients, ok := h.userClients[msg.UserID]; ok {
			for _, client := range clients {
				select {
				case client.Send <- msg.Message:
				default:
					close(client.Send)
					delete(h.clients, client)
				}
			}
		}
		return
	}

	// 广播给所有人
	for client := range h.clients {
		select {
		case client.Send <- msg.Message:
		default:
			close(client.Send)
			delete(h.clients, client)
		}
	}
}

// Subscribe 订阅房间 (执行 ID)
func (h *Hub) Subscribe(client *Client, room string) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if _, ok := h.rooms[room]; !ok {
		h.rooms[room] = make(map[*Client]bool)
	}
	h.rooms[room][client] = true

	client.mu.Lock()
	client.Rooms[room] = true
	client.mu.Unlock()

	h.log.Debug("Client subscribed to room",
		"clientId", client.ID,
		"room", room)
}

// Unsubscribe 取消订阅房间
func (h *Hub) Unsubscribe(client *Client, room string) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if roomClients, ok := h.rooms[room]; ok {
		delete(roomClients, client)
		if len(roomClients) == 0 {
			delete(h.rooms, room)
		}
	}

	client.mu.Lock()
	delete(client.Rooms, room)
	client.mu.Unlock()
}

// SendToRoom 发送消息到房间
func (h *Hub) SendToRoom(room string, msg *Message) error {
	// 添加发送时间戳
	msg.SentAt = time.Now().UnixMilli()

	data, err := json.Marshal(msg)
	if err != nil {
		return err
	}

	broadcastMsg := &BroadcastMessage{
		Room:      room,
		Message:   data,
		CreatedAt: time.Now(),
		Priority:  false,
	}

	// 非阻塞发送，防止 channel 满时阻塞
	select {
	case h.broadcast <- broadcastMsg:
	default:
		h.log.Warn("Broadcast channel full, dropping message",
			"room", room,
			"queueSize", len(h.broadcast))
	}
	return nil
}

// SendToRoomPriority 发送高优先级消息到房间(用于执行事件)
func (h *Hub) SendToRoomPriority(room string, msg *Message) error {
	// 添加发送时间戳
	msg.SentAt = time.Now().UnixMilli()

	data, err := json.Marshal(msg)
	if err != nil {
		return err
	}

	broadcastMsg := &BroadcastMessage{
		Room:      room,
		Message:   data,
		CreatedAt: time.Now(),
		Priority:  true,
	}

	// 优先发送到高优先级通道
	select {
	case h.priorityBroadcast <- broadcastMsg:
	default:
		// 高优先级通道满，尝试普通通道
		select {
		case h.broadcast <- broadcastMsg:
		default:
			h.log.Warn("All broadcast channels full, dropping priority message",
				"room", room)
		}
	}
	return nil
}

// SendToUser 发送消息给用户
func (h *Hub) SendToUser(userID string, msg *Message) error {
	// 添加发送时间戳
	msg.SentAt = time.Now().UnixMilli()

	data, err := json.Marshal(msg)
	if err != nil {
		return err
	}

	broadcastMsg := &BroadcastMessage{
		UserID:    userID,
		Message:   data,
		CreatedAt: time.Now(),
	}

	select {
	case h.broadcast <- broadcastMsg:
	default:
		h.log.Warn("Broadcast channel full, dropping user message",
			"userId", userID)
	}
	return nil
}

// BroadcastExecutionEvent 广播执行事件 (使用高优先级通道)
func (h *Hub) BroadcastExecutionEvent(executionID string, msgType MessageType, payload *ExecutionPayload) {
	msg := &Message{
		Type:      msgType,
		Payload:   payload,
		Timestamp: time.Now(),
	}

	// 执行事件使用高优先级发送，确保低延迟
	if err := h.SendToRoomPriority(executionID, msg); err != nil {
		h.log.Error("Failed to broadcast execution event",
			"executionId", executionID,
			"type", msgType,
			"error", err)
	}
}

// GetClientCount 获取客户端数量
func (h *Hub) GetClientCount() int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.clients)
}

// GetRoomCount 获取房间数量
func (h *Hub) GetRoomCount() int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.rooms)
}

// Register 注册客户端
func (h *Hub) Register(client *Client) {
	h.register <- client
}

// Unregister 注销客户端
func (h *Hub) Unregister(client *Client) {
	h.unregister <- client
}

// GetLatencyMetrics 获取延迟指标
func (h *Hub) GetLatencyMetrics() map[string]int64 {
	total := atomic.LoadInt64(&h.metrics.TotalMessages)
	avgLatency := int64(0)
	if total > 0 {
		avgLatency = atomic.LoadInt64(&h.metrics.TotalLatencyMs) / total
	}

	return map[string]int64{
		"totalMessages":      total,
		"avgLatencyMs":       avgLatency,
		"maxLatencyMs":       atomic.LoadInt64(&h.metrics.MaxLatencyMs),
		"lastLatencyMs":      atomic.LoadInt64(&h.metrics.LastLatencyMs),
		"overThreshold500ms": atomic.LoadInt64(&h.metrics.OverThreshold),
	}
}

// ResetLatencyMetrics 重置延迟指标
func (h *Hub) ResetLatencyMetrics() {
	atomic.StoreInt64(&h.metrics.TotalMessages, 0)
	atomic.StoreInt64(&h.metrics.TotalLatencyMs, 0)
	atomic.StoreInt64(&h.metrics.MaxLatencyMs, 0)
	atomic.StoreInt64(&h.metrics.LastLatencyMs, 0)
	atomic.StoreInt64(&h.metrics.OverThreshold, 0)
}
