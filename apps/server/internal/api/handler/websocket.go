package handler

import (
	"net/http"

	"github.com/agentflow/server/internal/config"
	"github.com/agentflow/server/internal/pkg/websocket"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	ws "github.com/gorilla/websocket"
	"github.com/labstack/echo/v4"
)

var upgrader = ws.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// 在生产环境中应该检查 Origin
		return true
	},
}

// WebSocketHandler WebSocket 处理器
type WebSocketHandler struct {
	hub    *websocket.Hub
	jwtCfg *config.JWTConfig
}

// NewWebSocketHandler 创建 WebSocket 处理器
func NewWebSocketHandler(hub *websocket.Hub, jwtCfg *config.JWTConfig) *WebSocketHandler {
	return &WebSocketHandler{
		hub:    hub,
		jwtCfg: jwtCfg,
	}
}

// HandleConnection 处理 WebSocket 连接
// @Summary WebSocket 连接
// @Tags WebSocket
// @Param token query string true "JWT Token"
// @Success 101 "Switching Protocols"
// @Router /ws [get]
func (h *WebSocketHandler) HandleConnection(c echo.Context) error {
	// 从查询参数获取 Token
	tokenString := c.QueryParam("token")
	if tokenString == "" {
		return errorResponse(c, http.StatusUnauthorized, "UNAUTHORIZED", "Token is required")
	}

	// 验证 Token
	userID, err := h.validateToken(tokenString)
	if err != nil {
		return errorResponse(c, http.StatusUnauthorized, "INVALID_TOKEN", "Invalid or expired token")
	}

	// 升级 HTTP 连接为 WebSocket
	conn, err := upgrader.Upgrade(c.Response(), c.Request(), nil)
	if err != nil {
		return err
	}

	// 创建客户端
	clientID := uuid.New().String()
	client := websocket.NewClient(clientID, userID, conn, h.hub)

	// 注册客户端
	h.hub.Register(client)

	// 启动读写协程
	go client.WritePump()
	go client.ReadPump()

	return nil
}

func (h *WebSocketHandler) validateToken(tokenString string) (string, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		return []byte(h.jwtCfg.Secret), nil
	})

	if err != nil || !token.Valid {
		return "", err
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return "", jwt.ErrInvalidKey
	}

	userID, ok := claims["user_id"].(string)
	if !ok {
		return "", jwt.ErrInvalidKey
	}

	return userID, nil
}

// GetHub 获取 Hub 实例
func (h *WebSocketHandler) GetHub() *websocket.Hub {
	return h.hub
}
