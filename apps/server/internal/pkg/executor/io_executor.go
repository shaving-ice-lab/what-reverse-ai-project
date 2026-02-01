package executor

import (
	"context"
	"fmt"
)

// NodeTypeInput 和 NodeTypeOutput 在 types.go 中定义
const (
	NodeTypeInput  NodeType = "input"
	NodeTypeOutput NodeType = "output"
)

// InputExecutor 用户输入节点执行器
type InputExecutor struct{}

// NewInputExecutor 创建输入节点执行器
func NewInputExecutor() *InputExecutor {
	return &InputExecutor{}
}

func (e *InputExecutor) GetType() NodeType {
	return NodeTypeInput
}

func (e *InputExecutor) Execute(ctx context.Context, node *NodeDefinition, inputs map[string]interface{}, execCtx *ExecutionContext) (*NodeResult, error) {
	// 从配置获取输入参数名
	inputName := getString(node.Config, "name")
	if inputName == "" {
		inputName = "input"
	}

	// 获取输入类型
	inputType := getString(node.Config, "inputType")
	if inputType == "" {
		inputType = "text"
	}

	// 获取默认值
	defaultValue := node.Config["defaultValue"]

	// 获取是否必填
	required := getBool(node.Config, "required")

	// 从执行上下文的变量中获取用户输入
	// 用户输入在执行开始时通过 inputs 参数传入
	var value interface{}

	// 首先检查 inputs 参数
	if v, ok := inputs[inputName]; ok {
		value = v
	} else if v, ok := execCtx.Variables[inputName]; ok {
		// 然后检查执行上下文变量
		value = v
	} else if defaultValue != nil {
		// 使用默认值
		value = defaultValue
	}

	// 检查必填
	if required && value == nil {
		return &NodeResult{
			NodeID: node.ID,
			Status: NodeStatusFailed,
			Error:  fmt.Errorf("required input '%s' is missing", inputName),
		}, fmt.Errorf("required input '%s' is missing", inputName)
	}

	// 类型转换和验证
	convertedValue, err := convertInputValue(value, inputType, node.Config)
	if err != nil {
		return &NodeResult{
			NodeID: node.ID,
			Status: NodeStatusFailed,
			Error:  err,
		}, err
	}

	// 设置输出
	outputs := map[string]interface{}{
		"value":   convertedValue,
		"output":  convertedValue,
		inputName: convertedValue,
	}

	return &NodeResult{
		NodeID:  node.ID,
		Status:  NodeStatusCompleted,
		Outputs: outputs,
	}, nil
}

// convertInputValue 转换输入值为指定类型
func convertInputValue(value interface{}, inputType string, config map[string]interface{}) (interface{}, error) {
	if value == nil {
		return nil, nil
	}

	switch inputType {
	case "text", "textarea", "password", "email", "url":
		return fmt.Sprintf("%v", value), nil
	case "number":
		return toFloat64(value)
	case "boolean":
		return toBool(value), nil
	case "select":
		// 验证选项值
		if options, ok := config["options"].([]interface{}); ok {
			strValue := fmt.Sprintf("%v", value)
			for _, opt := range options {
				if optMap, ok := opt.(map[string]interface{}); ok {
					if optMap["value"] == strValue {
						return strValue, nil
					}
				}
			}
			return nil, fmt.Errorf("invalid option value: %v", value)
		}
		return value, nil
	default:
		return value, nil
	}
}

// OutputExecutor 输出展示节点执行器
type OutputExecutor struct{}

// NewOutputExecutor 创建输出节点执行器
func NewOutputExecutor() *OutputExecutor {
	return &OutputExecutor{}
}

func (e *OutputExecutor) GetType() NodeType {
	return NodeTypeOutput
}

func (e *OutputExecutor) Execute(ctx context.Context, node *NodeDefinition, inputs map[string]interface{}, execCtx *ExecutionContext) (*NodeResult, error) {
	// 获取输出类型
	outputType := getString(node.Config, "outputType")
	if outputType == "" {
		outputType = "text"
	}

	// 获取标题
	title := getString(node.Config, "title")
	if title == "" {
		title = "输出结果"
	}

	// 获取模板
	template := getString(node.Config, "template")

	// 获取最大长度
	maxLength := getInt(node.Config, "maxLength", 0)

	// 是否显示时间戳
	showTimestamp := getBool(node.Config, "showTimestamp")

	// 获取输入值
	var outputValue interface{}
	if v, ok := inputs["input"]; ok {
		outputValue = v
	} else if v, ok := inputs["value"]; ok {
		outputValue = v
	} else {
		// 使用第一个输入值
		for _, v := range inputs {
			outputValue = v
			break
		}
	}

	// 如果有模板，进行变量插值
	if template != "" {
		outputValue = interpolateVariables(template, inputs, execCtx)
	}

	// 格式化输出
	formattedOutput, err := formatOutput(outputValue, outputType, maxLength)
	if err != nil {
		return &NodeResult{
			NodeID: node.ID,
			Status: NodeStatusFailed,
			Error:  err,
		}, err
	}

	// 构建输出
	outputs := map[string]interface{}{
		"value":         formattedOutput,
		"output":        formattedOutput,
		"type":          outputType,
		"title":         title,
		"showTimestamp": showTimestamp,
	}

	return &NodeResult{
		NodeID:  node.ID,
		Status:  NodeStatusCompleted,
		Outputs: outputs,
	}, nil
}

// formatOutput 格式化输出值
func formatOutput(value interface{}, outputType string, maxLength int) (interface{}, error) {
	if value == nil {
		return nil, nil
	}

	switch outputType {
	case "text":
		strValue := fmt.Sprintf("%v", value)
		if maxLength > 0 && len(strValue) > maxLength {
			strValue = strValue[:maxLength] + "..."
		}
		return strValue, nil
	case "json":
		// 保持原始 JSON 结构
		return value, nil
	case "table":
		// 表格格式化（保持原数据，由前端渲染）
		return value, nil
	case "markdown":
		strValue := fmt.Sprintf("%v", value)
		if maxLength > 0 && len(strValue) > maxLength {
			strValue = strValue[:maxLength] + "..."
		}
		return strValue, nil
	case "html":
		// HTML 需要安全处理（由前端处理）
		return value, nil
	case "image":
		// 图片 URL 或 base64
		return value, nil
	case "file":
		// 文件信息
		return value, nil
	default:
		return value, nil
	}
}
