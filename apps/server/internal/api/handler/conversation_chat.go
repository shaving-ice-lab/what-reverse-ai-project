package handler

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/agentflow/server/internal/api/middleware"
	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/pkg/security"
	"github.com/agentflow/server/internal/service"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

// ConversationChatHandler 对话聊天处理器
type ConversationChatHandler struct {
	conversationService service.ConversationService
	aiService           service.AIAssistantService
}

// NewConversationChatHandler 创建对话聊天处理器
func NewConversationChatHandler(
	conversationService service.ConversationService,
	aiService service.AIAssistantService,
) *ConversationChatHandler {
	return &ConversationChatHandler{
		conversationService: conversationService,
		aiService:           aiService,
	}
}

// ChatRequest 聊天请求
type ConversationChatRequest struct {
	Message      string `json:"message" validate:"required"`
	Model        string `json:"model"`
	SystemPrompt string `json:"system_prompt"`

	// AI 参数设置（可覆盖对话默认设置）
	Temperature      *float64 `json:"temperature"`       // 0.0-2.0
	MaxTokens        *int     `json:"max_tokens"`        // 最大生成 token 数
	TopP             *float64 `json:"top_p"`             // 0.0-1.0
	TopK             *int     `json:"top_k"`             // Top-K 采样
	FrequencyPenalty *float64 `json:"frequency_penalty"` // -2.0-2.0
	PresencePenalty  *float64 `json:"presence_penalty"`  // -2.0-2.0
}

// AIParameters AI 参数
type AIParameters struct {
	Temperature      float64 `json:"temperature"`
	MaxTokens        int     `json:"max_tokens"`
	TopP             float64 `json:"top_p"`
	TopK             int     `json:"top_k"`
	FrequencyPenalty float64 `json:"frequency_penalty"`
	PresencePenalty  float64 `json:"presence_penalty"`
}

// mergeAIParameters 合并 AI 参数（请求参数 > 对话设置 > 默认值）
func mergeAIParameters(conv *entity.Conversation, req *ConversationChatRequest) AIParameters {
	params := AIParameters{
		Temperature:      1.0,
		MaxTokens:        4096,
		TopP:             1.0,
		TopK:             0,
		FrequencyPenalty: 0.0,
		PresencePenalty:  0.0,
	}

	// 应用对话设置
	if conv.Temperature != nil {
		params.Temperature = *conv.Temperature
	}
	if conv.MaxTokens != nil {
		params.MaxTokens = *conv.MaxTokens
	}
	if conv.TopP != nil {
		params.TopP = *conv.TopP
	}
	if conv.TopK != nil {
		params.TopK = *conv.TopK
	}
	if conv.FrequencyPenalty != nil {
		params.FrequencyPenalty = *conv.FrequencyPenalty
	}
	if conv.PresencePenalty != nil {
		params.PresencePenalty = *conv.PresencePenalty
	}

	// 应用请求参数
	if req.Temperature != nil {
		params.Temperature = *req.Temperature
	}
	if req.MaxTokens != nil {
		params.MaxTokens = *req.MaxTokens
	}
	if req.TopP != nil {
		params.TopP = *req.TopP
	}
	if req.TopK != nil {
		params.TopK = *req.TopK
	}
	if req.FrequencyPenalty != nil {
		params.FrequencyPenalty = *req.FrequencyPenalty
	}
	if req.PresencePenalty != nil {
		params.PresencePenalty = *req.PresencePenalty
	}

	return params
}

// ChatResponse 聊天响应
type ConversationChatResponse struct {
	MessageID        string `json:"message_id"`
	Content          string `json:"content"`
	Model            string `json:"model"`
	TokenUsage       int    `json:"token_usage"`
	PromptTokens     int    `json:"prompt_tokens"`
	CompletionTokens int    `json:"completion_tokens"`
}

// Chat 对话聊天 - 非流式
// POST /api/v1/conversations/:id/chat
func (h *ConversationChatHandler) Chat(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	conversationID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "对话 ID 无效")
	}

	var req ConversationChatRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	if req.Message == "" {
		return errorResponse(c, http.StatusBadRequest, "MESSAGE_REQUIRED", "消息不能为空")
	}

	ctx := c.Request().Context()

	// 验证对话存在且属于当前用户
	conversation, err := h.conversationService.GetByID(ctx, conversationID, uid)
	if err != nil {
		switch err {
		case service.ErrConversationNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "对话不存在")
		case service.ErrConversationUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问此对话")
		default:
			return errorResponse(c, http.StatusInternalServerError, "GET_FAILED", "获取对话失败")
		}
	}

	// 保存用户消息
	userMessage, err := h.conversationService.AddMessage(ctx, conversationID, uid, service.AddMessageRequest{
		Role:    entity.MessageRoleUser,
		Content: req.Message,
	})
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "SAVE_MESSAGE_FAILED", "保存消息失败")
	}

	// 调用 AI 服务
	model := req.Model
	if model == "" {
		model = conversation.Model
	}

	aiResponse, err := h.aiService.Chat(ctx, uid, conversationID.String(), req.Message)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "AI_CHAT_FAILED", "AI 对话失败")
	}
	review := security.ReviewAIOutput(aiResponse.Message)
	if !review.Allowed {
		return errorResponse(c, http.StatusUnprocessableEntity, "AI_OUTPUT_BLOCKED", "AI 输出包含不安全内容，已拦截")
	}

	// 保存 AI 回复
	aiMessage, err := h.conversationService.AddMessage(ctx, conversationID, uid, service.AddMessageRequest{
		Role:    entity.MessageRoleAssistant,
		Content: aiResponse.Message,
		Model:   model,
	})
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "SAVE_MESSAGE_FAILED", "保存消息失败")
	}

	return successResponse(c, map[string]interface{}{
		"user_message": map[string]interface{}{
			"id":         userMessage.ID,
			"content":    userMessage.Content,
			"created_at": userMessage.CreatedAt,
		},
		"ai_message": ConversationChatResponse{
			MessageID: aiMessage.ID.String(),
			Content:   aiResponse.Message,
			Model:     model,
		},
		"suggestions": aiResponse.Suggestions,
		"actions":     aiResponse.Actions,
	})
}

// StreamChat 对话聊天 - 流式 (SSE)
// POST /api/v1/conversations/:id/chat/stream
func (h *ConversationChatHandler) StreamChat(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	conversationID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "对话 ID 无效")
	}

	var req ConversationChatRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	if req.Message == "" {
		return errorResponse(c, http.StatusBadRequest, "MESSAGE_REQUIRED", "消息不能为空")
	}

	ctx := c.Request().Context()

	// 验证对话存在且属于当前用户
	conversation, err := h.conversationService.GetByID(ctx, conversationID, uid)
	if err != nil {
		switch err {
		case service.ErrConversationNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "对话不存在")
		case service.ErrConversationUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问此对话")
		default:
			return errorResponse(c, http.StatusInternalServerError, "GET_FAILED", "获取对话失败")
		}
	}

	// 保存用户消息
	_, err = h.conversationService.AddMessage(ctx, conversationID, uid, service.AddMessageRequest{
		Role:    entity.MessageRoleUser,
		Content: req.Message,
	})
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "SAVE_MESSAGE_FAILED", "保存消息失败")
	}

	// 设置 SSE 响应头
	c.Response().Header().Set("Content-Type", "text/event-stream")
	c.Response().Header().Set("Cache-Control", "no-cache")
	c.Response().Header().Set("Connection", "keep-alive")
	c.Response().WriteHeader(http.StatusOK)

	// 获取响应写入器
	w := c.Response().Writer
	flusher, ok := w.(http.Flusher)
	if !ok {
		return errorResponse(c, http.StatusInternalServerError, "STREAM_NOT_SUPPORTED", "不支持流式响应")
	}

	// 模拟流式响应（实际应该调用 LLM 的流式 API）
	model := req.Model
	if model == "" {
		model = conversation.Model
	}

	// 调用 AI 服务获取响应
	aiResponse, err := h.aiService.Chat(ctx, uid, conversationID.String(), req.Message)
	if err != nil {
		sendSSEError(w, flusher, "AI 对话失败")
		return nil
	}
	review := security.ReviewAIOutput(aiResponse.Message)
	if !review.Allowed {
		sendSSEError(w, flusher, "AI 输出包含不安全内容，已拦截")
		return nil
	}

	// 模拟流式输出（实际生产环境应该使用真正的流式 API）
	content := aiResponse.Message
	chunkSize := 10 // 每次发送的字符数

	for i := 0; i < len(content); i += chunkSize {
		end := i + chunkSize
		if end > len(content) {
			end = len(content)
		}
		chunk := content[i:end]

		// 发送 SSE 数据
		data := map[string]string{"content": chunk}
		jsonData, _ := json.Marshal(data)
		fmt.Fprintf(w, "data: %s\n\n", jsonData)
		flusher.Flush()

		// 检查客户端是否断开
		select {
		case <-ctx.Done():
			return nil
		default:
		}
	}

	// 发送完成信号
	fmt.Fprintf(w, "data: [DONE]\n\n")
	flusher.Flush()

	// 保存完整的 AI 回复
	h.conversationService.AddMessage(context.Background(), conversationID, uid, service.AddMessageRequest{
		Role:    entity.MessageRoleAssistant,
		Content: content,
		Model:   model,
	})

	return nil
}

// sendSSEError 发送 SSE 错误
func sendSSEError(w http.ResponseWriter, flusher http.Flusher, message string) {
	data := map[string]string{"error": message}
	jsonData, _ := json.Marshal(data)
	fmt.Fprintf(w, "data: %s\n\n", jsonData)
	fmt.Fprintf(w, "data: [DONE]\n\n")
	flusher.Flush()
}

// readSSEResponse 读取 SSE 响应
func readSSEResponse(resp *http.Response) (<-chan string, <-chan error) {
	contentChan := make(chan string)
	errChan := make(chan error, 1)

	go func() {
		defer close(contentChan)
		defer close(errChan)

		scanner := bufio.NewScanner(resp.Body)
		for scanner.Scan() {
			line := scanner.Text()
			if len(line) > 6 && line[:6] == "data: " {
				data := line[6:]
				if data == "[DONE]" {
					return
				}
				var chunk map[string]string
				if err := json.Unmarshal([]byte(data), &chunk); err == nil {
					if content, ok := chunk["content"]; ok {
						contentChan <- content
					}
					if errMsg, ok := chunk["error"]; ok {
						errChan <- fmt.Errorf(errMsg)
						return
					}
				}
			}
		}
		if err := scanner.Err(); err != nil {
			errChan <- err
		}
	}()

	return contentChan, errChan
}
