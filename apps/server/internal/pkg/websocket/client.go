package websocket

import (
	"encoding/json"
	"time"

	"github.com/gorilla/websocket"
)

const (
	// 写入超时时间 (降低以提高响应性)
	writeWait = 5 * time.Second

	// 读取 Pong 消息超时时间
	pongWait = 60 * time.Second

	// Ping 消息发送间隔
	pingPeriod = (pongWait * 9) / 10

	// 消息最大大小
	maxMessageSize = 512 * 1024 // 512KB

	// 批量消息最大数量 (限制批量以减少延迟)
	maxBatchSize = 10
)

// NewClient 创建新的客户端
func NewClient(id, userID string, conn *websocket.Conn, hub *Hub) *Client {
	return &Client{
		ID:     id,
		UserID: userID,
		Conn:   conn,
		Hub:    hub,
		Send:   make(chan []byte, 256),
		Rooms:  make(map[string]bool),
	}
}

// ReadPump 读取消息泵
func (c *Client) ReadPump() {
	defer func() {
		c.Hub.unregister <- c
		c.Conn.Close()
	}()

	c.Conn.SetReadLimit(maxMessageSize)
	c.Conn.SetReadDeadline(time.Now().Add(pongWait))
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				c.Hub.log.Error("WebSocket read error",
					"clientId", c.ID,
					"error", err)
			}
			break
		}

		c.handleMessage(message)
	}
}

// WritePump 写入消息泵 (优化版: 立即发送，限制批量大小)
func (c *Client) WritePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				// Hub 关闭了通道
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			// 立即发送第一条消息，确保低延迟
			if err := c.Conn.WriteMessage(websocket.TextMessage, message); err != nil {
				return
			}

			// 限制批量发送数量，避免延迟累积
			// 只在有待发送消息时才批量处理
			n := len(c.Send)
			if n > maxBatchSize {
				n = maxBatchSize
			}
			
		batchLoop:
			for i := 0; i < n; i++ {
				select {
				case msg := <-c.Send:
					c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
					if err := c.Conn.WriteMessage(websocket.TextMessage, msg); err != nil {
						return
					}
				default:
					// 队列为空，退出批量发送循环
					break batchLoop
				}
			}

		case <-ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// ClientMessage 客户端发送的消息
type ClientMessage struct {
	Type    string          `json:"type"`
	Payload json.RawMessage `json:"payload"`
}

// SubscribePayload 订阅载荷
type SubscribePayload struct {
	ExecutionID string `json:"executionId"`
}

func (c *Client) handleMessage(data []byte) {
	var msg ClientMessage
	if err := json.Unmarshal(data, &msg); err != nil {
		c.Hub.log.Error("Failed to unmarshal client message",
			"clientId", c.ID,
			"error", err)
		return
	}

	switch msg.Type {
	case "ping":
		c.sendPong()

	case "subscribe":
		var payload SubscribePayload
		if err := json.Unmarshal(msg.Payload, &payload); err != nil {
			c.Hub.log.Error("Failed to unmarshal subscribe payload",
				"clientId", c.ID,
				"error", err)
			return
		}
		if payload.ExecutionID != "" {
			c.Hub.Subscribe(c, payload.ExecutionID)
		}

	case "unsubscribe":
		var payload SubscribePayload
		if err := json.Unmarshal(msg.Payload, &payload); err != nil {
			return
		}
		if payload.ExecutionID != "" {
			c.Hub.Unsubscribe(c, payload.ExecutionID)
		}
	}
}

func (c *Client) sendPong() {
	msg := &Message{
		Type:      MessageTypePong,
		Payload:   nil,
		Timestamp: time.Now(),
	}

	data, _ := json.Marshal(msg)
	select {
	case c.Send <- data:
	default:
		// 发送缓冲区满
	}
}

// SendMessage 发送消息给客户端
func (c *Client) SendMessage(msg *Message) error {
	data, err := json.Marshal(msg)
	if err != nil {
		return err
	}

	select {
	case c.Send <- data:
		return nil
	default:
		return nil // 缓冲区满，丢弃消息
	}
}
