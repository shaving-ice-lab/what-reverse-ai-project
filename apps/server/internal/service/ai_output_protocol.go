package service

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/xeipuuv/gojsonschema"
)

const (
	// AIOutputSchemaVersion 当前 AI 输出协议版本
	AIOutputSchemaVersion = "1.0"
)

// AppMetadata 应用元信息
type AppMetadata struct {
	Name        string   `json:"name"`
	Description string   `json:"description,omitempty"`
	Icon        string   `json:"icon,omitempty"`
	Tags        []string `json:"tags,omitempty"`
	Category    string   `json:"category,omitempty"`
	Version     string   `json:"version,omitempty"`
}

// AccessPolicy 访问策略
type AccessPolicy struct {
	AccessMode         string                 `json:"access_mode"`
	DataClassification string                 `json:"data_classification,omitempty"`
	RateLimit          map[string]interface{} `json:"rate_limit,omitempty"`
	AllowedOrigins     []string               `json:"allowed_origins,omitempty"`
	RequireCaptcha     bool                   `json:"require_captcha,omitempty"`
}

// AIOutputProtocol AI 输出协议
type AIOutputProtocol struct {
	SchemaVersion      string                 `json:"schema_version"`
	AppMetadata        AppMetadata            `json:"app_metadata"`
	WorkflowDefinition map[string]interface{} `json:"workflow_definition"`
	UISchema           map[string]interface{} `json:"ui_schema"`
	DBSchema           map[string]interface{} `json:"db_schema"`
	AccessPolicy       AccessPolicy           `json:"access_policy"`
}

const aiOutputProtocolSchema = `{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "required": ["schema_version", "app_metadata", "workflow_definition", "ui_schema", "db_schema", "access_policy"],
  "properties": {
    "schema_version": {
      "type": "string",
      "pattern": "^[0-9]+\\.[0-9]+(\\.[0-9]+)?$"
    },
    "app_metadata": {
      "type": "object",
      "required": ["name"],
      "properties": {
        "name": { "type": "string", "minLength": 1 },
        "description": { "type": "string" },
        "icon": { "type": "string" },
        "tags": { "type": "array", "items": { "type": "string" } },
        "category": { "type": "string" },
        "version": { "type": "string" }
      },
      "additionalProperties": true
    },
    "workflow_definition": {
      "type": "object",
      "required": ["name", "nodes", "edges"],
      "properties": {
        "name": { "type": "string" },
        "description": { "type": "string" },
        "nodes": { "type": "array" },
        "edges": { "type": "array" }
      },
      "additionalProperties": true
    },
    "ui_schema": { "type": "object" },
    "db_schema": { "type": "object" },
    "access_policy": {
      "type": "object",
      "required": ["access_mode"],
      "properties": {
        "access_mode": { "type": "string" },
        "data_classification": { "type": "string", "enum": ["public", "internal", "confidential", "restricted"] },
        "rate_limit": { "type": "object" },
        "allowed_origins": { "type": "array", "items": { "type": "string" } },
        "require_captcha": { "type": "boolean" }
      },
      "additionalProperties": true
    }
  },
  "additionalProperties": true
}`

// BuildAIOutputProtocol 构建 AI 输出协议
func BuildAIOutputProtocol(
	description string,
	workflowDefinition map[string]interface{},
	uiSchema map[string]interface{},
	dbSchema map[string]interface{},
) AIOutputProtocol {
	return AIOutputProtocol{
		SchemaVersion:      AIOutputSchemaVersion,
		AppMetadata:        buildAppMetadata(description, workflowDefinition),
		WorkflowDefinition: workflowDefinition,
		UISchema:           ensureMap(uiSchema),
		DBSchema:           ensureMap(dbSchema),
		AccessPolicy: AccessPolicy{
			AccessMode:         "private",
			DataClassification: DataClassificationPublic,
		},
	}
}

// ParseAIOutputProtocol 解析并校验 AI 输出协议
func ParseAIOutputProtocol(raw string) (*AIOutputProtocol, error) {
	if err := validateAIOutputProtocolJSON(raw); err != nil {
		return nil, err
	}

	var protocol AIOutputProtocol
	if err := json.Unmarshal([]byte(raw), &protocol); err != nil {
		return nil, err
	}

	if !IsSchemaVersionCompatible(protocol.SchemaVersion) {
		return nil, fmt.Errorf("schema_version 不兼容: %s", protocol.SchemaVersion)
	}

	return &protocol, nil
}

// ParseOrRepairAIOutputProtocol 解析协议，必要时进行自动修复
func ParseOrRepairAIOutputProtocol(raw string, description string) (*AIOutputProtocol, bool, error) {
	lastErr := error(nil)
	if protocol, err := ParseAIOutputProtocol(raw); err == nil {
		return protocol, false, nil
	} else {
		lastErr = err
	}

	sanitized := sanitizeAIOutputRaw(raw)
	if sanitized != raw {
		if protocol, err := ParseAIOutputProtocol(sanitized); err == nil {
			return protocol, true, nil
		} else {
			lastErr = err
		}
	}

	if extracted, ok := extractFirstJSONObject(sanitized); ok {
		if protocol, err := ParseAIOutputProtocol(extracted); err == nil {
			return protocol, true, nil
		} else {
			lastErr = err
		}

		if protocol, err := repairAIOutputProtocol(extracted, description); err == nil {
			return protocol, true, nil
		} else {
			lastErr = err
		}
	}

	if protocol, err := repairAIOutputProtocol(sanitized, description); err == nil {
		return protocol, true, nil
	} else {
		lastErr = err
	}

	if lastErr == nil {
		lastErr = fmt.Errorf("AI 输出协议解析失败")
	}
	return nil, false, lastErr
}

// ValidateAIOutputProtocol 校验协议结构
func ValidateAIOutputProtocol(protocol AIOutputProtocol) error {
	if !IsSchemaVersionCompatible(protocol.SchemaVersion) {
		return fmt.Errorf("schema_version 不兼容: %s", protocol.SchemaVersion)
	}

	payload, err := json.Marshal(protocol)
	if err != nil {
		return err
	}

	return validateAIOutputProtocolJSON(string(payload))
}

// IsSchemaVersionCompatible 校验 schema_version 兼容性（按主版本向前兼容）
func IsSchemaVersionCompatible(version string) bool {
	if version == "" {
		return false
	}

	currentMajor := strings.Split(AIOutputSchemaVersion, ".")[0]
	versionMajor := strings.Split(version, ".")[0]
	return currentMajor == versionMajor
}

func sanitizeAIOutputRaw(raw string) string {
	trimmed := strings.TrimSpace(raw)
	if strings.HasPrefix(trimmed, "```") {
		lines := strings.Split(trimmed, "\n")
		if len(lines) > 0 {
			lines = lines[1:]
		}
		if len(lines) > 0 {
			last := strings.TrimSpace(lines[len(lines)-1])
			if strings.HasPrefix(last, "```") {
				lines = lines[:len(lines)-1]
			}
		}
		trimmed = strings.TrimSpace(strings.Join(lines, "\n"))
	}
	return trimmed
}

func extractFirstJSONObject(raw string) (string, bool) {
	start := strings.Index(raw, "{")
	end := strings.LastIndex(raw, "}")
	if start == -1 || end == -1 || end <= start {
		return "", false
	}
	return raw[start : end+1], true
}

func repairAIOutputProtocol(raw string, description string) (*AIOutputProtocol, error) {
	if strings.TrimSpace(raw) == "" {
		return nil, fmt.Errorf("AI 输出内容为空")
	}

	var payload map[string]interface{}
	if err := json.Unmarshal([]byte(raw), &payload); err != nil {
		return nil, err
	}

	protocol := buildProtocolFromMap(payload, description)
	if err := ValidateAIOutputProtocol(protocol); err != nil {
		return nil, err
	}

	return &protocol, nil
}

func buildProtocolFromMap(payload map[string]interface{}, description string) AIOutputProtocol {
	var workflowDefinition map[string]interface{}
	if workflow, ok := payload["workflow_definition"].(map[string]interface{}); ok {
		workflowDefinition = workflow
	} else if hasWorkflowShape(payload) {
		workflowDefinition = payload
	}

	var uiSchema map[string]interface{}
	if ui, ok := payload["ui_schema"].(map[string]interface{}); ok {
		uiSchema = ui
	}

	var dbSchema map[string]interface{}
	if db, ok := payload["db_schema"].(map[string]interface{}); ok {
		dbSchema = db
	}

	protocol := BuildAIOutputProtocol(description, workflowDefinition, uiSchema, dbSchema)

	if rawMeta, ok := payload["app_metadata"].(map[string]interface{}); ok {
		protocol.AppMetadata = mergeAppMetadata(protocol.AppMetadata, rawMeta)
	}

	if rawPolicy, ok := payload["access_policy"].(map[string]interface{}); ok {
		protocol.AccessPolicy = mergeAccessPolicy(protocol.AccessPolicy, rawPolicy)
	}

	if version, ok := payload["schema_version"].(string); ok && strings.TrimSpace(version) != "" {
		protocol.SchemaVersion = version
	}

	return protocol
}

func hasWorkflowShape(payload map[string]interface{}) bool {
	_, hasNodes := payload["nodes"]
	_, hasEdges := payload["edges"]
	_, hasName := payload["name"]
	return hasNodes && hasEdges && hasName
}

func mergeAppMetadata(current AppMetadata, raw map[string]interface{}) AppMetadata {
	if name, ok := raw["name"].(string); ok && strings.TrimSpace(name) != "" {
		current.Name = name
	}
	if description, ok := raw["description"].(string); ok {
		current.Description = description
	}
	if icon, ok := raw["icon"].(string); ok {
		current.Icon = icon
	}
	if tags := coerceStringSliceValue(raw["tags"]); len(tags) > 0 {
		current.Tags = tags
	}
	if category, ok := raw["category"].(string); ok {
		current.Category = category
	}
	if version, ok := raw["version"].(string); ok {
		current.Version = version
	}
	return current
}

func mergeAccessPolicy(current AccessPolicy, raw map[string]interface{}) AccessPolicy {
	if accessMode, ok := raw["access_mode"].(string); ok && strings.TrimSpace(accessMode) != "" {
		current.AccessMode = accessMode
	}
	if dataClassification, ok := raw["data_classification"].(string); ok && strings.TrimSpace(dataClassification) != "" {
		current.DataClassification = dataClassification
	}
	if rateLimit, ok := raw["rate_limit"].(map[string]interface{}); ok {
		current.RateLimit = rateLimit
	}
	if origins := coerceStringSliceValue(raw["allowed_origins"]); len(origins) > 0 {
		current.AllowedOrigins = origins
	}
	if requireCaptcha, ok := raw["require_captcha"].(bool); ok {
		current.RequireCaptcha = requireCaptcha
	}
	return current
}

func coerceStringSliceValue(value interface{}) []string {
	switch typed := value.(type) {
	case []string:
		return typed
	case []interface{}:
		result := make([]string, 0, len(typed))
		for _, item := range typed {
			if s, ok := item.(string); ok && strings.TrimSpace(s) != "" {
				result = append(result, s)
			}
		}
		return result
	default:
		return nil
	}
}

func buildAppMetadata(description string, workflowDefinition map[string]interface{}) AppMetadata {
	name := deriveAppName(description, workflowDefinition)
	metadata := AppMetadata{
		Name: name,
	}

	if trimmed := strings.TrimSpace(description); trimmed != "" {
		metadata.Description = trimmed
	}

	return metadata
}

func deriveAppName(description string, workflowDefinition map[string]interface{}) string {
	if workflowDefinition != nil {
		if name, ok := workflowDefinition["name"].(string); ok && strings.TrimSpace(name) != "" {
			return truncateRunes(name, 24)
		}
	}

	trimmed := strings.TrimSpace(description)
	if trimmed == "" {
		return "AI 应用"
	}

	return truncateRunes(trimmed, 24)
}

func truncateRunes(text string, limit int) string {
	runes := []rune(text)
	if len(runes) <= limit {
		return text
	}
	return string(runes[:limit]) + "..."
}

func ensureMap(input map[string]interface{}) map[string]interface{} {
	if input == nil {
		return map[string]interface{}{}
	}
	return input
}

func validateAIOutputProtocolJSON(raw string) error {
	schemaLoader := gojsonschema.NewStringLoader(aiOutputProtocolSchema)
	documentLoader := gojsonschema.NewStringLoader(raw)
	result, err := gojsonschema.Validate(schemaLoader, documentLoader)
	if err != nil {
		return err
	}
	if result.Valid() {
		return nil
	}

	errs := make([]string, 0, len(result.Errors()))
	for _, e := range result.Errors() {
		errs = append(errs, e.String())
	}

	return fmt.Errorf("AI 输出协议校验失败: %s", strings.Join(errs, "; "))
}
