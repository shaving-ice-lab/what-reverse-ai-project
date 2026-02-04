package security

import (
	"encoding/json"
	"regexp"
	"strings"
)

// PIISanitizer PII数据脱敏器
type PIISanitizer struct {
	sensitiveFields   []string
	sensitivePatterns map[string]*regexp.Regexp
	maskChar          string
	redactedText      string
}

// SensitiveFieldConfig 敏感字段配置
type SensitiveFieldConfig struct {
	FieldName   string `json:"field_name"`
	MaskType    string `json:"mask_type"` // full, partial, hash
	Description string `json:"description"`
}

// DefaultSensitiveFields 默认敏感字段列表
var DefaultSensitiveFields = []SensitiveFieldConfig{
	// 个人身份信息
	{FieldName: "email", MaskType: "partial", Description: "电子邮箱"},
	{FieldName: "phone", MaskType: "partial", Description: "电话号码"},
	{FieldName: "mobile", MaskType: "partial", Description: "手机号码"},
	{FieldName: "real_name", MaskType: "partial", Description: "真实姓名"},
	{FieldName: "id_card", MaskType: "partial", Description: "身份证号"},
	{FieldName: "address", MaskType: "full", Description: "地址"},
	{FieldName: "birthday", MaskType: "full", Description: "生日"},

	// 网络信息
	{FieldName: "ip", MaskType: "partial", Description: "IP地址"},
	{FieldName: "ip_address", MaskType: "partial", Description: "IP地址"},
	{FieldName: "ip_hash", MaskType: "hash", Description: "IP哈希"},
	{FieldName: "user_agent", MaskType: "partial", Description: "用户代理"},
	{FieldName: "user_agent_hash", MaskType: "hash", Description: "用户代理哈希"},

	// 凭证信息
	{FieldName: "password", MaskType: "full", Description: "密码"},
	{FieldName: "api_key", MaskType: "partial", Description: "API密钥"},
	{FieldName: "secret", MaskType: "full", Description: "密钥"},
	{FieldName: "token", MaskType: "partial", Description: "令牌"},
	{FieldName: "authorization", MaskType: "full", Description: "授权信息"},
	{FieldName: "key_encrypted", MaskType: "full", Description: "加密密钥"},
	{FieldName: "secret_ref", MaskType: "full", Description: "密钥引用"},
	{FieldName: "db_password", MaskType: "full", Description: "数据库密码"},
	{FieldName: "private_key", MaskType: "full", Description: "私钥"},

	// 会话信息
	{FieldName: "session_id", MaskType: "partial", Description: "会话ID"},
	{FieldName: "refresh_token", MaskType: "full", Description: "刷新令牌"},
	{FieldName: "access_token", MaskType: "full", Description: "访问令牌"},
}

// SensitivePatterns 敏感数据正则模式
var SensitivePatterns = map[string]string{
	"email":       `[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}`,
	"phone_cn":    `1[3-9]\d{9}`,
	"id_card_cn":  `[1-9]\d{5}(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]`,
	"credit_card": `\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}`,
	"ipv4":        `\b(?:\d{1,3}\.){3}\d{1,3}\b`,
	"jwt":         `eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+`,
	"api_key":     `(sk|pk|api|key)[-_][a-zA-Z0-9]{20,}`,
}

// NewPIISanitizer 创建PII脱敏器
func NewPIISanitizer() *PIISanitizer {
	fields := make([]string, len(DefaultSensitiveFields))
	for i, f := range DefaultSensitiveFields {
		fields[i] = f.FieldName
	}

	patterns := make(map[string]*regexp.Regexp)
	for name, pattern := range SensitivePatterns {
		if re, err := regexp.Compile(pattern); err == nil {
			patterns[name] = re
		}
	}

	return &PIISanitizer{
		sensitiveFields:   fields,
		sensitivePatterns: patterns,
		maskChar:          "*",
		redactedText:      "[REDACTED]",
	}
}

// SanitizeMap 脱敏Map数据
func (s *PIISanitizer) SanitizeMap(data map[string]interface{}) map[string]interface{} {
	result := make(map[string]interface{})

	for key, value := range data {
		if s.isSensitiveField(key) {
			result[key] = s.maskValue(key, value)
		} else if nested, ok := value.(map[string]interface{}); ok {
			result[key] = s.SanitizeMap(nested)
		} else if arr, ok := value.([]interface{}); ok {
			result[key] = s.sanitizeArray(arr)
		} else if str, ok := value.(string); ok {
			result[key] = s.SanitizeString(str)
		} else {
			result[key] = value
		}
	}

	return result
}

// SanitizeJSON 脱敏JSON数据
func (s *PIISanitizer) SanitizeJSON(jsonData []byte) ([]byte, error) {
	var data map[string]interface{}
	if err := json.Unmarshal(jsonData, &data); err != nil {
		// 尝试作为数组处理
		var arr []interface{}
		if err := json.Unmarshal(jsonData, &arr); err != nil {
			return jsonData, nil // 非JSON数据，返回原始数据
		}
		sanitized := s.sanitizeArray(arr)
		return json.Marshal(sanitized)
	}

	sanitized := s.SanitizeMap(data)
	return json.Marshal(sanitized)
}

// SanitizeString 脱敏字符串中的敏感信息
func (s *PIISanitizer) SanitizeString(str string) string {
	result := str

	for _, re := range s.sensitivePatterns {
		result = re.ReplaceAllStringFunc(result, func(match string) string {
			return s.maskString(match)
		})
	}

	return result
}

// SanitizeForLog 为日志脱敏数据
func (s *PIISanitizer) SanitizeForLog(data interface{}) interface{} {
	switch v := data.(type) {
	case map[string]interface{}:
		return s.SanitizeMap(v)
	case string:
		return s.SanitizeString(v)
	case []byte:
		sanitized, _ := s.SanitizeJSON(v)
		return string(sanitized)
	default:
		return data
	}
}

// MaskEmail 脱敏邮箱
func (s *PIISanitizer) MaskEmail(email string) string {
	if email == "" {
		return ""
	}

	parts := strings.Split(email, "@")
	if len(parts) != 2 {
		return s.redactedText
	}

	local := parts[0]
	domain := parts[1]

	if len(local) <= 2 {
		return local[0:1] + "***@" + domain
	}

	return local[0:2] + "***@" + domain
}

// MaskPhone 脱敏手机号
func (s *PIISanitizer) MaskPhone(phone string) string {
	if len(phone) < 7 {
		return s.redactedText
	}

	// 保留前3位和后4位
	return phone[0:3] + "****" + phone[len(phone)-4:]
}

// MaskIP 脱敏IP地址
func (s *PIISanitizer) MaskIP(ip string) string {
	parts := strings.Split(ip, ".")
	if len(parts) != 4 {
		return s.redactedText
	}

	// 保留前两段，后两段脱敏
	return parts[0] + "." + parts[1] + ".***.***"
}

// MaskAPIKey 脱敏API密钥
func (s *PIISanitizer) MaskAPIKey(key string) string {
	if len(key) <= 8 {
		return "***"
	}

	prefix := key[:7]
	suffix := key[len(key)-4:]
	return prefix + "..." + suffix
}

// MaskIDCard 脱敏身份证号
func (s *PIISanitizer) MaskIDCard(idCard string) string {
	if len(idCard) < 10 {
		return s.redactedText
	}

	// 保留前6位和后4位
	return idCard[0:6] + "********" + idCard[len(idCard)-4:]
}

// isSensitiveField 检查字段是否敏感
func (s *PIISanitizer) isSensitiveField(fieldName string) bool {
	fieldLower := strings.ToLower(fieldName)

	for _, sensitive := range s.sensitiveFields {
		if strings.Contains(fieldLower, sensitive) || sensitive == fieldLower {
			return true
		}
	}

	return false
}

// maskValue 对值进行脱敏
func (s *PIISanitizer) maskValue(fieldName string, value interface{}) interface{} {
	fieldLower := strings.ToLower(fieldName)

	str, ok := value.(string)
	if !ok {
		return s.redactedText
	}

	// 根据字段类型选择脱敏方式
	switch {
	case strings.Contains(fieldLower, "email"):
		return s.MaskEmail(str)
	case strings.Contains(fieldLower, "phone") || strings.Contains(fieldLower, "mobile"):
		return s.MaskPhone(str)
	case strings.Contains(fieldLower, "ip"):
		if strings.Contains(fieldLower, "hash") {
			return s.maskString(str)
		}
		return s.MaskIP(str)
	case strings.Contains(fieldLower, "api_key") || strings.Contains(fieldLower, "token"):
		return s.MaskAPIKey(str)
	case strings.Contains(fieldLower, "id_card"):
		return s.MaskIDCard(str)
	case strings.Contains(fieldLower, "password") || strings.Contains(fieldLower, "secret"):
		return s.redactedText
	default:
		return s.maskString(str)
	}
}

// maskString 通用字符串脱敏
func (s *PIISanitizer) maskString(str string) string {
	length := len(str)

	if length <= 4 {
		return strings.Repeat(s.maskChar, length)
	}

	if length <= 8 {
		return str[0:1] + strings.Repeat(s.maskChar, length-2) + str[length-1:]
	}

	// 保留前2个和后2个字符
	return str[0:2] + strings.Repeat(s.maskChar, length-4) + str[length-2:]
}

// sanitizeArray 脱敏数组
func (s *PIISanitizer) sanitizeArray(arr []interface{}) []interface{} {
	result := make([]interface{}, len(arr))

	for i, item := range arr {
		switch v := item.(type) {
		case map[string]interface{}:
			result[i] = s.SanitizeMap(v)
		case string:
			result[i] = s.SanitizeString(v)
		case []interface{}:
			result[i] = s.sanitizeArray(v)
		default:
			result[i] = item
		}
	}

	return result
}

// GetSensitiveFieldsConfig 获取敏感字段配置
func GetSensitiveFieldsConfig() []SensitiveFieldConfig {
	return DefaultSensitiveFields
}

// IsSensitiveField 检查字段是否敏感（全局函数）
func IsSensitiveField(fieldName string) bool {
	sanitizer := NewPIISanitizer()
	return sanitizer.isSensitiveField(fieldName)
}
