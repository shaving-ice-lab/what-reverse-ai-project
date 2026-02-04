package service

import (
	"encoding/json"
	"fmt"
	"strconv"
	"strings"

	"github.com/xeipuuv/gojsonschema"
)

const (
	// AIPatchSchemaVersion 当前补丁协议版本
	AIPatchSchemaVersion = "1.0"
)

// AIPatchDocument AI 修改/增量更新协议
type AIPatchDocument struct {
	SchemaVersion string             `json:"schema_version"`
	Ops           []AIPatchOperation `json:"ops"`
}

// AIPatchOperation 补丁操作
type AIPatchOperation struct {
	Op    string      `json:"op"`
	Path  string      `json:"path"`
	Value interface{} `json:"value,omitempty"`
}

const aiPatchSchema = `{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "required": ["schema_version", "ops"],
  "properties": {
    "schema_version": {
      "type": "string",
      "pattern": "^[0-9]+\\.[0-9]+(\\.[0-9]+)?$"
    },
    "ops": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "required": ["op", "path"],
        "properties": {
          "op": {
            "type": "string",
            "enum": ["set", "delete", "merge", "append"]
          },
          "path": {
            "type": "string",
            "pattern": "^/.*"
          },
          "value": {}
        },
        "additionalProperties": false
      }
    }
  },
  "additionalProperties": false
}`

// ParseAIPatchDocument 解析补丁协议
func ParseAIPatchDocument(raw string) (*AIPatchDocument, error) {
	if err := validateAIPatchJSON(raw); err != nil {
		return nil, err
	}

	var patch AIPatchDocument
	if err := json.Unmarshal([]byte(raw), &patch); err != nil {
		return nil, err
	}

	if !IsSchemaVersionCompatible(patch.SchemaVersion) {
		return nil, fmt.Errorf("schema_version 不兼容: %s", patch.SchemaVersion)
	}

	return &patch, nil
}

// ValidateAIPatchDocument 校验补丁协议
func ValidateAIPatchDocument(patch AIPatchDocument) error {
	if !IsSchemaVersionCompatible(patch.SchemaVersion) {
		return fmt.Errorf("schema_version 不兼容: %s", patch.SchemaVersion)
	}

	payload, err := json.Marshal(patch)
	if err != nil {
		return err
	}

	return validateAIPatchJSON(string(payload))
}

// ApplyAIPatchDocument 应用补丁到协议
func ApplyAIPatchDocument(protocol AIOutputProtocol, patch AIPatchDocument) (AIOutputProtocol, error) {
	if err := ValidateAIPatchDocument(patch); err != nil {
		return AIOutputProtocol{}, err
	}

	payload, err := protocolToMap(protocol)
	if err != nil {
		return AIOutputProtocol{}, err
	}

	for _, op := range patch.Ops {
		updated, err := applyPatchOperation(payload, op)
		if err != nil {
			return AIOutputProtocol{}, err
		}
		payload = updated
	}

	updatedProtocol, err := mapToProtocol(payload)
	if err != nil {
		return AIOutputProtocol{}, err
	}

	return updatedProtocol, nil
}

func protocolToMap(protocol AIOutputProtocol) (map[string]interface{}, error) {
	raw, err := json.Marshal(protocol)
	if err != nil {
		return nil, err
	}

	var payload map[string]interface{}
	if err := json.Unmarshal(raw, &payload); err != nil {
		return nil, err
	}

	return payload, nil
}

func mapToProtocol(payload map[string]interface{}) (AIOutputProtocol, error) {
	raw, err := json.Marshal(payload)
	if err != nil {
		return AIOutputProtocol{}, err
	}

	parsed, err := ParseAIOutputProtocol(string(raw))
	if err != nil {
		return AIOutputProtocol{}, err
	}

	return *parsed, nil
}

func applyPatchOperation(root map[string]interface{}, op AIPatchOperation) (map[string]interface{}, error) {
	tokens, err := parseJSONPointer(op.Path)
	if err != nil {
		return nil, err
	}
	if len(tokens) == 0 {
		return nil, fmt.Errorf("patch path 不能为空")
	}

	var updated interface{}
	switch op.Op {
	case "set":
		if op.Value == nil {
			return nil, fmt.Errorf("set 操作缺少 value")
		}
		updated, err = applySet(root, tokens, op.Value)
	case "delete":
		updated, err = applyDelete(root, tokens)
	case "merge":
		if op.Value == nil {
			return nil, fmt.Errorf("merge 操作缺少 value")
		}
		updated, err = applyMerge(root, tokens, op.Value)
	case "append":
		if op.Value == nil {
			return nil, fmt.Errorf("append 操作缺少 value")
		}
		updated, err = applyAppend(root, tokens, op.Value)
	default:
		return nil, fmt.Errorf("未知操作: %s", op.Op)
	}
	if err != nil {
		return nil, err
	}

	updatedMap, ok := updated.(map[string]interface{})
	if !ok {
		return nil, fmt.Errorf("patch 结果不是对象")
	}

	return updatedMap, nil
}

func applySet(node interface{}, tokens []string, value interface{}) (interface{}, error) {
	if len(tokens) == 0 {
		return value, nil
	}

	token := tokens[0]
	if index, ok := parseArrayIndex(token); ok {
		arr := ensureSlice(node)
		for len(arr) <= index {
			arr = append(arr, nil)
		}
		updated, err := applySet(arr[index], tokens[1:], value)
		if err != nil {
			return nil, err
		}
		arr[index] = updated
		return arr, nil
	}

	obj := ensureMapNode(node)
	updated, err := applySet(obj[token], tokens[1:], value)
	if err != nil {
		return nil, err
	}
	obj[token] = updated
	return obj, nil
}

func applyDelete(node interface{}, tokens []string) (interface{}, error) {
	if len(tokens) == 0 {
		return nil, fmt.Errorf("delete path 不能为空")
	}

	token := tokens[0]
	if len(tokens) == 1 {
		if index, ok := parseArrayIndex(token); ok {
			arr, ok := node.([]interface{})
			if !ok {
				return nil, fmt.Errorf("delete 目标不是数组")
			}
			if index < 0 || index >= len(arr) {
				return nil, fmt.Errorf("delete 索引越界")
			}
			return append(arr[:index], arr[index+1:]...), nil
		}
		obj, ok := node.(map[string]interface{})
		if !ok {
			return nil, fmt.Errorf("delete 目标不是对象")
		}
		delete(obj, token)
		return obj, nil
	}

	if index, ok := parseArrayIndex(token); ok {
		arr, ok := node.([]interface{})
		if !ok || index < 0 || index >= len(arr) {
			return nil, fmt.Errorf("delete 路径无效")
		}
		updated, err := applyDelete(arr[index], tokens[1:])
		if err != nil {
			return nil, err
		}
		arr[index] = updated
		return arr, nil
	}

	obj, ok := node.(map[string]interface{})
	if !ok {
		return nil, fmt.Errorf("delete 路径无效")
	}
	child, ok := obj[token]
	if !ok {
		return nil, fmt.Errorf("delete 路径不存在")
	}
	updated, err := applyDelete(child, tokens[1:])
	if err != nil {
		return nil, err
	}
	obj[token] = updated
	return obj, nil
}

func applyMerge(node interface{}, tokens []string, value interface{}) (interface{}, error) {
	if len(tokens) == 0 {
		target := ensureMapNode(node)
		patch, ok := value.(map[string]interface{})
		if !ok {
			return nil, fmt.Errorf("merge value 必须是对象")
		}
		return deepMerge(target, patch), nil
	}

	token := tokens[0]
	if index, ok := parseArrayIndex(token); ok {
		arr := ensureSlice(node)
		for len(arr) <= index {
			arr = append(arr, nil)
		}
		updated, err := applyMerge(arr[index], tokens[1:], value)
		if err != nil {
			return nil, err
		}
		arr[index] = updated
		return arr, nil
	}

	obj := ensureMapNode(node)
	updated, err := applyMerge(obj[token], tokens[1:], value)
	if err != nil {
		return nil, err
	}
	obj[token] = updated
	return obj, nil
}

func applyAppend(node interface{}, tokens []string, value interface{}) (interface{}, error) {
	if len(tokens) == 0 {
		arr := ensureSlice(node)
		return append(arr, coerceInterfaceSlice(value)...), nil
	}

	token := tokens[0]
	if index, ok := parseArrayIndex(token); ok {
		arr := ensureSlice(node)
		for len(arr) <= index {
			arr = append(arr, nil)
		}
		updated, err := applyAppend(arr[index], tokens[1:], value)
		if err != nil {
			return nil, err
		}
		arr[index] = updated
		return arr, nil
	}

	obj := ensureMapNode(node)
	updated, err := applyAppend(obj[token], tokens[1:], value)
	if err != nil {
		return nil, err
	}
	obj[token] = updated
	return obj, nil
}

func parseJSONPointer(path string) ([]string, error) {
	if path == "" {
		return nil, fmt.Errorf("path 不能为空")
	}
	if !strings.HasPrefix(path, "/") {
		return nil, fmt.Errorf("path 必须以 / 开头")
	}

	rawTokens := strings.Split(path[1:], "/")
	tokens := make([]string, 0, len(rawTokens))
	for _, token := range rawTokens {
		unescaped := strings.ReplaceAll(strings.ReplaceAll(token, "~1", "/"), "~0", "~")
		tokens = append(tokens, unescaped)
	}
	return tokens, nil
}

func parseArrayIndex(token string) (int, bool) {
	if token == "-" {
		return -1, false
	}
	index, err := strconv.Atoi(token)
	if err != nil || index < 0 {
		return -1, false
	}
	return index, true
}

func ensureMapNode(node interface{}) map[string]interface{} {
	if node == nil {
		return map[string]interface{}{}
	}
	if obj, ok := node.(map[string]interface{}); ok {
		return obj
	}
	return map[string]interface{}{}
}

func ensureSlice(node interface{}) []interface{} {
	if node == nil {
		return []interface{}{}
	}
	if arr, ok := node.([]interface{}); ok {
		return arr
	}
	return []interface{}{}
}

func coerceInterfaceSlice(value interface{}) []interface{} {
	switch typed := value.(type) {
	case []interface{}:
		return typed
	default:
		return []interface{}{value}
	}
}

func deepMerge(target map[string]interface{}, patch map[string]interface{}) map[string]interface{} {
	for key, value := range patch {
		if value == nil {
			target[key] = nil
			continue
		}
		if childPatch, ok := value.(map[string]interface{}); ok {
			if childTarget, ok := target[key].(map[string]interface{}); ok {
				target[key] = deepMerge(childTarget, childPatch)
			} else {
				target[key] = deepMerge(map[string]interface{}{}, childPatch)
			}
			continue
		}
		target[key] = value
	}
	return target
}

func validateAIPatchJSON(raw string) error {
	schemaLoader := gojsonschema.NewStringLoader(aiPatchSchema)
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

	return fmt.Errorf("AI 补丁协议校验失败: %s", strings.Join(errs, "; "))
}
