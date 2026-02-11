package executor

import (
	"context"
	"encoding/json"
	"fmt"
	"regexp"
	"strings"
)

// NodeTypeFormSubmit 表单提交节点
const NodeTypeFormSubmit NodeType = "form_submit"

// FormSubmitExecutor 接收 UI Schema 表单提交，校验输入，传递给下游节点
type FormSubmitExecutor struct{}

func NewFormSubmitExecutor() *FormSubmitExecutor {
	return &FormSubmitExecutor{}
}

func (e *FormSubmitExecutor) GetType() NodeType {
	return NodeTypeFormSubmit
}

func (e *FormSubmitExecutor) Execute(ctx context.Context, node *NodeDefinition, inputs map[string]interface{}, execCtx *ExecutionContext) (*NodeResult, error) {
	// Config:
	//   fields: [{name, type, required, min, max, pattern, label}]
	//   form_data_key: string (key in inputs that contains the form data, default "form_data")
	formDataKey := getString(node.Config, "form_data_key")
	if formDataKey == "" {
		formDataKey = "form_data"
	}

	// Get form data from inputs
	formData, _ := getFormData(inputs, formDataKey)
	if formData == nil {
		formData = make(map[string]interface{})
		// If no form_data key, treat all inputs as form data
		for k, v := range inputs {
			formData[k] = v
		}
	}

	// Validate fields if schema defined
	fieldsRaw, hasFields := node.Config["fields"]
	if hasFields {
		fields, ok := fieldsRaw.([]interface{})
		if !ok {
			return nil, fmt.Errorf("fields must be an array")
		}
		errors := validateFormFields(fields, formData)
		if len(errors) > 0 {
			return &NodeResult{
				NodeID: node.ID,
				Status: NodeStatusFailed,
				Outputs: map[string]interface{}{
					"valid":  false,
					"errors": errors,
					"output": map[string]interface{}{"valid": false, "errors": errors},
				},
				Error: fmt.Errorf("validation failed: %s", strings.Join(errors, "; ")),
			}, fmt.Errorf("form validation failed")
		}
	}

	// Pass validated data downstream
	outputs := map[string]interface{}{
		"valid":     true,
		"data":      formData,
		"output":    formData,
		"result":    formData,
		"form_data": formData,
	}

	return &NodeResult{
		NodeID:  node.ID,
		Status:  NodeStatusCompleted,
		Outputs: outputs,
	}, nil
}

func getFormData(inputs map[string]interface{}, key string) (map[string]interface{}, bool) {
	raw, ok := inputs[key]
	if !ok {
		return nil, false
	}
	switch v := raw.(type) {
	case map[string]interface{}:
		return v, true
	case string:
		var parsed map[string]interface{}
		if err := json.Unmarshal([]byte(v), &parsed); err == nil {
			return parsed, true
		}
	}
	return nil, false
}

func validateFormFields(fields []interface{}, data map[string]interface{}) []string {
	var errors []string
	for _, f := range fields {
		field, ok := f.(map[string]interface{})
		if !ok {
			continue
		}
		name := getString(field, "name")
		if name == "" {
			continue
		}
		label := getString(field, "label")
		if label == "" {
			label = name
		}
		required := getBool(field, "required")
		fieldType := getString(field, "type")

		value, exists := data[name]

		if required && (!exists || value == nil || value == "") {
			errors = append(errors, fmt.Sprintf("%s is required", label))
			continue
		}
		if !exists || value == nil {
			continue
		}

		strVal := fmt.Sprintf("%v", value)

		// Type validation
		switch fieldType {
		case "number", "integer":
			if _, err := fmt.Sscanf(strVal, "%f", new(float64)); err != nil {
				errors = append(errors, fmt.Sprintf("%s must be a number", label))
			}
		case "email":
			if !strings.Contains(strVal, "@") || !strings.Contains(strVal, ".") {
				errors = append(errors, fmt.Sprintf("%s must be a valid email", label))
			}
		}

		// Pattern validation
		if pattern := getString(field, "pattern"); pattern != "" {
			if matched, _ := regexp.MatchString(pattern, strVal); !matched {
				errors = append(errors, fmt.Sprintf("%s format is invalid", label))
			}
		}

		// Min/max length
		if minLen := getInt(field, "min_length", 0); minLen > 0 && len(strVal) < minLen {
			errors = append(errors, fmt.Sprintf("%s must be at least %d characters", label, minLen))
		}
		if maxLen := getInt(field, "max_length", 0); maxLen > 0 && len(strVal) > maxLen {
			errors = append(errors, fmt.Sprintf("%s must be at most %d characters", label, maxLen))
		}
	}
	return errors
}
