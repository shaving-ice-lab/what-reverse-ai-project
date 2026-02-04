package security

import "strings"

// MaskingRule 脱敏展示规则
type MaskingRule struct {
	FieldName   string `json:"field_name"`
	MaskType    string `json:"mask_type"`
	Description string `json:"description"`
	Example     string `json:"example"`
	Masked      string `json:"masked"`
}

// GetMaskingRules 获取脱敏展示规则
func GetMaskingRules() []MaskingRule {
	sanitizer := NewPIISanitizer()
	rules := make([]MaskingRule, 0, len(DefaultSensitiveFields))
	for _, cfg := range DefaultSensitiveFields {
		example := maskingExampleForField(cfg.FieldName)
		masked := sanitizeExample(sanitizer, cfg.FieldName, example)
		rules = append(rules, MaskingRule{
			FieldName:   cfg.FieldName,
			MaskType:    cfg.MaskType,
			Description: cfg.Description,
			Example:     example,
			Masked:      masked,
		})
	}
	return rules
}

func sanitizeExample(sanitizer *PIISanitizer, fieldName, example string) string {
	input := map[string]interface{}{
		fieldName: example,
	}
	output := sanitizer.SanitizeMap(input)
	masked, ok := output[fieldName].(string)
	if ok && masked != "" {
		return masked
	}
	return "[REDACTED]"
}

func maskingExampleForField(fieldName string) string {
	switch strings.ToLower(fieldName) {
	case "email":
		return "alex@example.com"
	case "phone", "mobile":
		return "13812345678"
	case "real_name":
		return "Alex Chen"
	case "id_card":
		return "110105199001011234"
	case "address":
		return "88 Example Rd, City"
	case "ip", "ip_address":
		return "192.168.1.88"
	case "user_agent":
		return "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
	case "api_key":
		return "sk-abc1234567890xyz"
	case "secret", "token", "authorization":
		return "secret_value_1234567890"
	case "key_encrypted", "secret_ref", "db_password", "private_key":
		return "enc-example-value-123456"
	case "session_id":
		return "sess_1234567890"
	case "refresh_token", "access_token":
		return "token_abcdefghijklmnopqrstuvwxyz"
	default:
		return "sensitive_value_123456"
	}
}
