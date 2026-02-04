package uischema

import (
	"encoding/json"
	"errors"
	"fmt"
	"reflect"
	"regexp"
	"strconv"
	"strings"

	"github.com/agentflow/server/internal/domain/entity"
)

const CurrentSchemaVersion = "1.0.0"

var (
	ErrInvalidSchema = errors.New("ui schema is invalid")
	ErrInvalidInputs = errors.New("ui inputs validation failed")
)

var allowedBlockTypes = map[string]struct{}{
	"form":     {},
	"input":    {},
	"select":   {},
	"table":    {},
	"card":     {},
	"chart":    {},
	"markdown": {},
}

var allowedResultViewTypes = map[string]struct{}{
	"text":     {},
	"markdown": {},
	"table":    {},
	"card":     {},
	"chart":    {},
}

var allowedLayoutTypes = map[string]struct{}{
	"single_column": {},
	"grid":          {},
}

var forbiddenPropKeys = map[string]struct{}{
	"html":                       {},
	"dangerouslysetinnerhtml":    {},
	"dangerously_set_innerhtml":  {},
	"dangerously_set_inner_html": {},
	"innerhtml":                  {},
	"script":                     {},
	"raw_html":                   {},
	"rawhtml":                    {},
	"inline_style":               {},
	"inline-style":               {},
	"inlinestyle":                {},
	"style":                      {},
}

type Schema struct {
	SchemaVersion string      `json:"schema_version"`
	Layout        *Layout     `json:"layout,omitempty"`
	Blocks        []Block     `json:"blocks,omitempty"`
	Actions       []Action    `json:"actions,omitempty"`
	ResultView    *ResultView `json:"result_view,omitempty"`
}

type Layout struct {
	Type  string                 `json:"type"`
	Props map[string]interface{} `json:"props,omitempty"`
}

type Block struct {
	ID         string                 `json:"id"`
	Type       string                 `json:"type"`
	Label      string                 `json:"label,omitempty"`
	InputKey   string                 `json:"input_key,omitempty"`
	Props      map[string]interface{} `json:"props,omitempty"`
	Validation *ValidationRules       `json:"validation,omitempty"`
	Children   []Block                `json:"children,omitempty"`
}

type Action struct {
	ID    string                 `json:"id"`
	Type  string                 `json:"type"`
	Label string                 `json:"label,omitempty"`
	Props map[string]interface{} `json:"props,omitempty"`
}

type ResultView struct {
	Type  string                 `json:"type"`
	Props map[string]interface{} `json:"props,omitempty"`
}

type ValidationRules struct {
	Required bool          `json:"required,omitempty"`
	Min      *float64      `json:"min,omitempty"`
	Max      *float64      `json:"max,omitempty"`
	Enum     []interface{} `json:"enum,omitempty"`
	Pattern  string        `json:"pattern,omitempty"`
	Message  string        `json:"message,omitempty"`
}

type FieldError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

type InputMapping struct {
	UIKey     string `json:"ui_key"`
	TargetKey string `json:"target_key"`
	Type      string `json:"type,omitempty"`
}

type InputValidationError struct {
	Errors []FieldError `json:"errors"`
}

func (e InputValidationError) Error() string {
	return ErrInvalidInputs.Error()
}

func Normalize(raw entity.JSON) (*Schema, error) {
	if len(raw) == 0 {
		return nil, nil
	}

	if isLegacySchema(raw) {
		legacy, err := normalizeLegacySchema(raw)
		if err != nil {
			return nil, err
		}
		if err := Validate(legacy); err != nil {
			return nil, err
		}
		return legacy, nil
	}

	var schema Schema
	if err := mapToStruct(raw, &schema); err != nil {
		return nil, ErrInvalidSchema
	}
	if strings.TrimSpace(schema.SchemaVersion) == "" {
		schema.SchemaVersion = CurrentSchemaVersion
	}
	ensureLayoutDefaults(&schema)
	if err := Validate(&schema); err != nil {
		return nil, err
	}
	return &schema, nil
}

func NormalizeMap(raw entity.JSON) (entity.JSON, error) {
	schema, err := Normalize(raw)
	if err != nil {
		return nil, err
	}
	if schema == nil {
		return nil, nil
	}
	return toJSONMap(schema)
}

func Validate(schema *Schema) error {
	if schema == nil {
		return nil
	}

	if strings.TrimSpace(schema.SchemaVersion) == "" {
		return ErrInvalidSchema
	}

	ensureLayoutDefaults(schema)
	if schema.Layout != nil {
		if err := validateLayout(schema.Layout); err != nil {
			return err
		}
	}

	for i := range schema.Blocks {
		if err := validateBlock(&schema.Blocks[i]); err != nil {
			return err
		}
	}

	for i := range schema.Actions {
		if err := validateAction(&schema.Actions[i]); err != nil {
			return err
		}
	}

	if schema.ResultView != nil {
		if err := validateResultView(schema.ResultView); err != nil {
			return err
		}
	}

	return nil
}

func MapInputs(schema *Schema, inputs map[string]interface{}) (map[string]interface{}, *InputValidationError, error) {
	if schema == nil {
		return inputs, nil, nil
	}

	if inputs == nil {
		inputs = map[string]interface{}{}
	}

	inputBlocks := collectInputBlocks(schema.Blocks)
	if len(inputBlocks) == 0 {
		return map[string]interface{}{}, nil, nil
	}

	mapped := map[string]interface{}{}
	var errs []FieldError

	for _, block := range inputBlocks {
		uiKey := strings.TrimSpace(block.ID)
		if uiKey == "" {
			continue
		}
		targetKey := strings.TrimSpace(block.InputKey)
		if targetKey == "" {
			targetKey = uiKey
		}

		value, ok := inputs[uiKey]
		if !ok && targetKey != uiKey {
			if alt, altOK := inputs[targetKey]; altOK {
				value = alt
				ok = true
			}
		}

		if !ok || value == nil {
			if block.Validation != nil && block.Validation.Required {
				errs = append(errs, FieldError{
					Field:   uiKey,
					Message: buildValidationMessage(block, "为必填项"),
				})
			}
			continue
		}

		if block.Validation != nil {
			if msg := validateValue(block, value); msg != "" {
				errs = append(errs, FieldError{
					Field:   uiKey,
					Message: msg,
				})
				continue
			}
		}

		mapped[targetKey] = value
	}

	if len(errs) > 0 {
		return nil, &InputValidationError{Errors: errs}, nil
	}

	return mapped, nil, nil
}

func CollectInputMappings(schema *Schema) []InputMapping {
	if schema == nil {
		return nil
	}
	inputBlocks := collectInputBlocks(schema.Blocks)
	if len(inputBlocks) == 0 {
		return nil
	}

	mappings := make([]InputMapping, 0, len(inputBlocks))
	for _, block := range inputBlocks {
		uiKey := strings.TrimSpace(block.ID)
		if uiKey == "" {
			continue
		}
		targetKey := strings.TrimSpace(block.InputKey)
		if targetKey == "" {
			targetKey = uiKey
		}
		mappings = append(mappings, InputMapping{
			UIKey:     uiKey,
			TargetKey: targetKey,
			Type:      normalizeType(block.Type),
		})
	}

	return mappings
}

func ensureLayoutDefaults(schema *Schema) {
	if schema.Layout == nil {
		schema.Layout = &Layout{Type: "single_column"}
		return
	}
	if strings.TrimSpace(schema.Layout.Type) == "" {
		schema.Layout.Type = "single_column"
	}
}

func validateLayout(layout *Layout) error {
	normalized := normalizeType(layout.Type)
	if normalized == "" {
		return ErrInvalidSchema
	}
	if normalized == "stack" {
		normalized = "single_column"
	}
	if _, ok := allowedLayoutTypes[normalized]; !ok {
		return ErrInvalidSchema
	}
	layout.Type = normalized
	if hasForbiddenProps(layout.Props) {
		return ErrInvalidSchema
	}
	return nil
}

func validateBlock(block *Block) error {
	if block == nil {
		return ErrInvalidSchema
	}
	if strings.TrimSpace(block.ID) == "" {
		return ErrInvalidSchema
	}
	normalized := normalizeType(block.Type)
	if normalized == "" {
		return ErrInvalidSchema
	}
	if _, ok := allowedBlockTypes[normalized]; !ok {
		return ErrInvalidSchema
	}
	block.Type = normalized
	if hasForbiddenProps(block.Props) {
		return ErrInvalidSchema
	}
	if block.Validation != nil {
		if block.Validation.Pattern != "" {
			if _, err := regexp.Compile(block.Validation.Pattern); err != nil {
				return ErrInvalidSchema
			}
		}
	}
	for i := range block.Children {
		if err := validateBlock(&block.Children[i]); err != nil {
			return err
		}
	}
	return nil
}

func validateAction(action *Action) error {
	if action == nil {
		return ErrInvalidSchema
	}
	if strings.TrimSpace(action.ID) == "" {
		return ErrInvalidSchema
	}
	if strings.TrimSpace(action.Type) == "" {
		return ErrInvalidSchema
	}
	if hasForbiddenProps(action.Props) {
		return ErrInvalidSchema
	}
	return nil
}

func validateResultView(view *ResultView) error {
	if view == nil {
		return ErrInvalidSchema
	}
	normalized := normalizeType(view.Type)
	if normalized == "" {
		return ErrInvalidSchema
	}
	if _, ok := allowedResultViewTypes[normalized]; !ok {
		return ErrInvalidSchema
	}
	view.Type = normalized
	if hasForbiddenProps(view.Props) {
		return ErrInvalidSchema
	}
	return nil
}

func collectInputBlocks(blocks []Block) []Block {
	var inputs []Block
	for _, block := range blocks {
		if isInputBlock(block.Type) {
			inputs = append(inputs, block)
		}
		if len(block.Children) > 0 {
			inputs = append(inputs, collectInputBlocks(block.Children)...)
		}
	}
	return inputs
}

func isInputBlock(blockType string) bool {
	switch normalizeType(blockType) {
	case "input", "select":
		return true
	default:
		return false
	}
}

func validateValue(block Block, value interface{}) string {
	rules := block.Validation
	if rules == nil {
		return ""
	}

	if len(rules.Enum) > 0 {
		if !valueInEnum(value, rules.Enum) {
			return buildValidationMessage(block, "取值不在允许范围内")
		}
	}

	if rules.Pattern != "" {
		if strValue, ok := value.(string); ok {
			re, err := regexp.Compile(rules.Pattern)
			if err == nil && !re.MatchString(strValue) {
				return buildValidationMessage(block, "格式不符合要求")
			}
		}
	}

	if rules.Min != nil || rules.Max != nil {
		if num, ok := toFloat(value); ok {
			if rules.Min != nil && num < *rules.Min {
				return buildValidationMessage(block, fmt.Sprintf("最小值为 %v", trimFloat(*rules.Min)))
			}
			if rules.Max != nil && num > *rules.Max {
				return buildValidationMessage(block, fmt.Sprintf("最大值为 %v", trimFloat(*rules.Max)))
			}
		} else if length, ok := lengthOf(value); ok {
			if rules.Min != nil && float64(length) < *rules.Min {
				return buildValidationMessage(block, fmt.Sprintf("最小长度为 %v", trimFloat(*rules.Min)))
			}
			if rules.Max != nil && float64(length) > *rules.Max {
				return buildValidationMessage(block, fmt.Sprintf("最大长度为 %v", trimFloat(*rules.Max)))
			}
		}
	}

	return ""
}

func buildValidationMessage(block Block, suffix string) string {
	if block.Validation != nil {
		if msg := strings.TrimSpace(block.Validation.Message); msg != "" {
			return msg
		}
	}
	label := strings.TrimSpace(block.Label)
	if label == "" {
		label = strings.TrimSpace(block.ID)
	}
	if label == "" {
		label = "输入"
	}
	return fmt.Sprintf("%s%s", label, suffix)
}

func valueInEnum(value interface{}, enum []interface{}) bool {
	for _, candidate := range enum {
		if valuesEqual(value, candidate) {
			return true
		}
	}
	return false
}

func valuesEqual(a, b interface{}) bool {
	if a == nil || b == nil {
		return a == b
	}
	if af, ok := toFloat(a); ok {
		if bf, ok2 := toFloat(b); ok2 {
			return af == bf
		}
	}
	if as, ok := a.(string); ok {
		if bs, ok2 := b.(string); ok2 {
			return as == bs
		}
	}
	return reflect.DeepEqual(a, b)
}

func toFloat(value interface{}) (float64, bool) {
	switch v := value.(type) {
	case float64:
		return v, true
	case float32:
		return float64(v), true
	case int:
		return float64(v), true
	case int64:
		return float64(v), true
	case int32:
		return float64(v), true
	case json.Number:
		parsed, err := v.Float64()
		if err != nil {
			return 0, false
		}
		return parsed, true
	case string:
		parsed, err := strconv.ParseFloat(strings.TrimSpace(v), 64)
		if err != nil {
			return 0, false
		}
		return parsed, true
	default:
		return 0, false
	}
}

func lengthOf(value interface{}) (int, bool) {
	if value == nil {
		return 0, false
	}
	rv := reflect.ValueOf(value)
	switch rv.Kind() {
	case reflect.String, reflect.Slice, reflect.Array, reflect.Map:
		return rv.Len(), true
	default:
		return 0, false
	}
}

func trimFloat(value float64) string {
	return strings.TrimRight(strings.TrimRight(fmt.Sprintf("%.2f", value), "0"), ".")
}

func hasForbiddenProps(props map[string]interface{}) bool {
	for key := range props {
		normalized := normalizeType(key)
		if _, ok := forbiddenPropKeys[normalized]; ok {
			return true
		}
	}
	return false
}

func normalizeType(value string) string {
	return strings.ToLower(strings.TrimSpace(value))
}

func mapToStruct(raw entity.JSON, target interface{}) error {
	if raw == nil {
		return errors.New("empty schema")
	}
	payload, err := json.Marshal(raw)
	if err != nil {
		return err
	}
	if err := json.Unmarshal(payload, target); err != nil {
		return err
	}
	return nil
}

func toJSONMap(value interface{}) (entity.JSON, error) {
	bytes, err := json.Marshal(value)
	if err != nil {
		return nil, err
	}
	var result entity.JSON
	if err := json.Unmarshal(bytes, &result); err != nil {
		return nil, err
	}
	return result, nil
}

type legacySchema struct {
	Version string        `json:"version"`
	Type    string        `json:"type"`
	Title   string        `json:"title"`
	Fields  []legacyField `json:"fields"`
	Submit  legacySubmit  `json:"submit"`
}

type legacyField struct {
	ID          string        `json:"id"`
	Type        string        `json:"type"`
	Label       string        `json:"label"`
	Placeholder string        `json:"placeholder"`
	Required    bool          `json:"required"`
	Options     []interface{} `json:"options"`
}

type legacySubmit struct {
	Label string `json:"label"`
}

func isLegacySchema(raw entity.JSON) bool {
	if raw == nil {
		return false
	}
	if _, ok := raw["schema_version"]; ok {
		return false
	}
	if _, ok := raw["fields"]; ok {
		return true
	}
	return false
}

func normalizeLegacySchema(raw entity.JSON) (*Schema, error) {
	var legacy legacySchema
	if err := mapToStruct(raw, &legacy); err != nil {
		return nil, ErrInvalidSchema
	}

	formTitle := strings.TrimSpace(legacy.Title)
	if formTitle == "" {
		formTitle = "Form"
	}

	children := make([]Block, 0, len(legacy.Fields))
	for idx, field := range legacy.Fields {
		fieldID := strings.TrimSpace(field.ID)
		if fieldID == "" {
			fieldID = fmt.Sprintf("field_%d", idx+1)
		}
		fieldType := normalizeLegacyFieldType(field.Type)
		props := map[string]interface{}{}
		if strings.TrimSpace(field.Placeholder) != "" {
			props["placeholder"] = field.Placeholder
		}
		if len(field.Options) > 0 {
			props["options"] = field.Options
		}
		validation := &ValidationRules{
			Required: field.Required,
		}
		children = append(children, Block{
			ID:         fieldID,
			Type:       fieldType,
			Label:      field.Label,
			InputKey:   fieldID,
			Props:      props,
			Validation: validation,
		})
	}

	var blocks []Block
	if len(children) > 0 {
		blocks = append(blocks, Block{
			ID:       "form",
			Type:     "form",
			Label:    formTitle,
			Children: children,
		})
	}

	var actions []Action
	submitLabel := strings.TrimSpace(legacy.Submit.Label)
	if submitLabel == "" {
		submitLabel = "Submit"
	}
	actions = append(actions, Action{
		ID:    "submit",
		Type:  "submit",
		Label: submitLabel,
	})

	schema := &Schema{
		SchemaVersion: CurrentSchemaVersion,
		Layout:        &Layout{Type: "single_column"},
		Blocks:        blocks,
		Actions:       actions,
	}

	return schema, nil
}

func normalizeLegacyFieldType(value string) string {
	switch normalizeType(value) {
	case "select", "dropdown":
		return "select"
	default:
		return "input"
	}
}
