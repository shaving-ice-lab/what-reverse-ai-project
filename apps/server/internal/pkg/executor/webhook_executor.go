package executor

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net"
	"strings"
	"time"
)

// WebhookExecutor Webhook 节点执行器
type WebhookExecutor struct{}

// NewWebhookExecutor 创建 Webhook 执行器
func NewWebhookExecutor() *WebhookExecutor {
	return &WebhookExecutor{}
}

func (e *WebhookExecutor) GetType() NodeType {
	return NodeTypeWebhook
}

func (e *WebhookExecutor) Execute(ctx context.Context, node *NodeDefinition, inputs map[string]interface{}, execCtx *ExecutionContext) (*NodeResult, error) {
	// Webhook 节点主要用于接收外部请求，这里处理的是收到请求后的数据处理
	// 实际的 HTTP 请求接收在 webhook handler 中处理

	// 获取 Webhook 请求数据
	method := getString(inputs, "method")
	if method == "" {
		method = "POST"
	}

	body := inputs["body"]
	headers := inputs["headers"]
	query := inputs["query"]
	remoteIP := getString(inputs, "remoteIP")

	// 获取配置
	config := node.Config
	requireSignature := getBool(config, "requireSignature")
	secret := getString(config, "secret")
	allowedMethods := getStringSlice(config, "allowedMethods")
	ipWhitelist := getStringSlice(config, "ipWhitelist")

	// 验证 HTTP 方法
	if len(allowedMethods) > 0 {
		methodAllowed := false
		for _, m := range allowedMethods {
			if strings.EqualFold(m, method) || strings.EqualFold(m, "ANY") {
				methodAllowed = true
				break
			}
		}
		if !methodAllowed {
			return &NodeResult{
				NodeID: node.ID,
				Status: NodeStatusFailed,
				Error:  fmt.Errorf("method not allowed: %s", method),
			}, fmt.Errorf("method not allowed: %s", method)
		}
	}

	// 验证 IP 白名单
	if len(ipWhitelist) > 0 && remoteIP != "" {
		ipAllowed := false
		for _, allowedIP := range ipWhitelist {
			if isIPAllowed(remoteIP, allowedIP) {
				ipAllowed = true
				break
			}
		}
		if !ipAllowed {
			return &NodeResult{
				NodeID: node.ID,
				Status: NodeStatusFailed,
				Error:  fmt.Errorf("IP not allowed: %s", remoteIP),
			}, fmt.Errorf("IP not allowed: %s", remoteIP)
		}
	}

	// 验证签名
	if requireSignature && secret != "" {
		signature := getString(inputs, "signature")
		rawBody := getString(inputs, "rawBody")

		if signature == "" {
			return &NodeResult{
				NodeID: node.ID,
				Status: NodeStatusFailed,
				Error:  fmt.Errorf("signature required but not provided"),
			}, fmt.Errorf("signature required but not provided")
		}

		if !verifySignature(rawBody, signature, secret) {
			return &NodeResult{
				NodeID: node.ID,
				Status: NodeStatusFailed,
				Error:  fmt.Errorf("invalid signature"),
			}, fmt.Errorf("invalid signature")
		}
	}

	// 构建输出
	outputs := map[string]interface{}{
		"method":    method,
		"body":      body,
		"headers":   headers,
		"query":     query,
		"remoteIP":  remoteIP,
		"timestamp": time.Now().Unix(),
		"validated": true,
	}

	// 如果 body 是 map，展开到输出中方便访问
	if bodyMap, ok := body.(map[string]interface{}); ok {
		for k, v := range bodyMap {
			outputs[k] = v
		}
	}

	return &NodeResult{
		NodeID:  node.ID,
		Status:  NodeStatusCompleted,
		Outputs: outputs,
	}, nil
}

// verifySignature 验证 HMAC-SHA256 签名
func verifySignature(payload, signature, secret string) bool {
	// 支持多种签名格式
	// GitHub: sha256=xxx
	// Stripe: xxx
	// Custom: xxx

	sig := signature
	if strings.HasPrefix(signature, "sha256=") {
		sig = strings.TrimPrefix(signature, "sha256=")
	}

	// 计算期望的签名
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(payload))
	expectedSig := hex.EncodeToString(mac.Sum(nil))

	// 使用恒定时间比较防止计时攻击
	return hmac.Equal([]byte(sig), []byte(expectedSig))
}

// isIPAllowed 检查 IP 是否在允许列表中
func isIPAllowed(clientIP, allowedIP string) bool {
	// 支持精确匹配和 CIDR 格式
	if clientIP == allowedIP {
		return true
	}

	// 尝试 CIDR 匹配
	_, network, err := net.ParseCIDR(allowedIP)
	if err != nil {
		// 不是 CIDR 格式，进行精确匹配
		return clientIP == allowedIP
	}

	ip := net.ParseIP(clientIP)
	if ip == nil {
		return false
	}

	return network.Contains(ip)
}

// getStringSlice 从 map 获取字符串切片
func getStringSlice(m map[string]interface{}, key string) []string {
	if val, ok := m[key]; ok {
		switch v := val.(type) {
		case []string:
			return v
		case []interface{}:
			result := make([]string, 0, len(v))
			for _, item := range v {
				if str, ok := item.(string); ok {
					str = strings.TrimSpace(str)
					if str != "" {
						result = append(result, str)
					}
				}
			}
			return result
		case string:
			v = strings.TrimSpace(v)
			if v != "" {
				return []string{v}
			}
		}
	}
	return nil
}

// WebhookTriggerData Webhook 触发数据
type WebhookTriggerData struct {
	Method    string                 `json:"method"`
	Headers   map[string]string      `json:"headers"`
	Query     map[string]string      `json:"query"`
	Body      interface{}            `json:"body"`
	RawBody   string                 `json:"rawBody"`
	Signature string                 `json:"signature"`
	RemoteIP  string                 `json:"remoteIP"`
	Timestamp time.Time              `json:"timestamp"`
	NodeID    string                 `json:"nodeId"`
	Extra     map[string]interface{} `json:"extra,omitempty"`
}

// ToInputs 转换为执行器输入
func (d *WebhookTriggerData) ToInputs() map[string]interface{} {
	inputs := map[string]interface{}{
		"method":    d.Method,
		"body":      d.Body,
		"rawBody":   d.RawBody,
		"signature": d.Signature,
		"remoteIP":  d.RemoteIP,
		"timestamp": d.Timestamp.Unix(),
	}

	// 转换 headers
	if d.Headers != nil {
		headers := make(map[string]interface{})
		for k, v := range d.Headers {
			headers[k] = v
		}
		inputs["headers"] = headers
	}

	// 转换 query
	if d.Query != nil {
		query := make(map[string]interface{})
		for k, v := range d.Query {
			query[k] = v
		}
		inputs["query"] = query
	}

	// 添加额外数据
	if d.Extra != nil {
		for k, v := range d.Extra {
			inputs[k] = v
		}
	}

	return inputs
}
