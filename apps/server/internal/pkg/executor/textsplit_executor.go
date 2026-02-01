package executor

import (
	"context"
	"fmt"
	"strings"
)

// NodeTypeTextSplit 文本分割节点类型
const NodeTypeTextSplit NodeType = "textsplit"

// TextSplitExecutor 文本分割/合并节点执行器
type TextSplitExecutor struct{}

// NewTextSplitExecutor 创建文本分割执行器
func NewTextSplitExecutor() *TextSplitExecutor {
	return &TextSplitExecutor{}
}

func (e *TextSplitExecutor) GetType() NodeType {
	return NodeTypeTextSplit
}

func (e *TextSplitExecutor) Execute(ctx context.Context, node *NodeDefinition, inputs map[string]interface{}, execCtx *ExecutionContext) (*NodeResult, error) {
	mode := getString(node.Config, "mode")
	if mode == "" {
		mode = "split"
	}

	var result interface{}
	var err error

	switch mode {
	case "split":
		result, err = e.split(inputs, node.Config)
	case "join":
		result, err = e.join(inputs, node.Config)
	case "splitLines":
		result, err = e.splitLines(inputs, node.Config)
	case "splitParagraphs":
		result, err = e.splitParagraphs(inputs, node.Config)
	case "chunk":
		result, err = e.chunk(inputs, node.Config)
	default:
		err = fmt.Errorf("unknown mode: %s", mode)
	}

	if err != nil {
		return &NodeResult{
			NodeID: node.ID,
			Status: NodeStatusFailed,
			Error:  err,
		}, err
	}

	outputs := map[string]interface{}{
		"result": result,
		"output": result,
	}

	// 添加统计信息
	if arr, ok := result.([]interface{}); ok {
		outputs["count"] = len(arr)
	} else if str, ok := result.(string); ok {
		outputs["length"] = len(str)
	}

	return &NodeResult{
		NodeID:  node.ID,
		Status:  NodeStatusCompleted,
		Outputs: outputs,
	}, nil
}

func (e *TextSplitExecutor) getInputText(inputs map[string]interface{}) string {
	if v, ok := inputs["input"]; ok {
		return fmt.Sprintf("%v", v)
	}
	if v, ok := inputs["text"]; ok {
		return fmt.Sprintf("%v", v)
	}
	if v, ok := inputs["value"]; ok {
		return fmt.Sprintf("%v", v)
	}
	for _, v := range inputs {
		return fmt.Sprintf("%v", v)
	}
	return ""
}

func (e *TextSplitExecutor) getInputArray(inputs map[string]interface{}) []interface{} {
	if v, ok := inputs["input"]; ok {
		if arr, ok := v.([]interface{}); ok {
			return arr
		}
	}
	if v, ok := inputs["array"]; ok {
		if arr, ok := v.([]interface{}); ok {
			return arr
		}
	}
	if v, ok := inputs["items"]; ok {
		if arr, ok := v.([]interface{}); ok {
			return arr
		}
	}
	return nil
}

func (e *TextSplitExecutor) split(inputs map[string]interface{}, config map[string]interface{}) (interface{}, error) {
	text := e.getInputText(inputs)
	separator := getString(config, "separator")
	if separator == "" {
		separator = ","
	}

	// 处理转义字符
	separator = unescapeSeparator(separator)

	keepEmpty := getBool(config, "keepEmpty")
	trim := getBool(config, "trim")

	parts := strings.Split(text, separator)
	result := make([]interface{}, 0, len(parts))

	for _, part := range parts {
		if trim {
			part = strings.TrimSpace(part)
		}
		if keepEmpty || part != "" {
			result = append(result, part)
		}
	}

	return result, nil
}

func (e *TextSplitExecutor) join(inputs map[string]interface{}, config map[string]interface{}) (interface{}, error) {
	arr := e.getInputArray(inputs)
	if arr == nil {
		return "", nil
	}

	separator := getString(config, "joinSeparator")
	if separator == "" {
		separator = ","
	}

	// 处理转义字符
	separator = unescapeSeparator(separator)

	parts := make([]string, len(arr))
	for i, item := range arr {
		parts[i] = fmt.Sprintf("%v", item)
	}

	return strings.Join(parts, separator), nil
}

func (e *TextSplitExecutor) splitLines(inputs map[string]interface{}, config map[string]interface{}) (interface{}, error) {
	text := e.getInputText(inputs)
	keepEmpty := getBool(config, "keepEmpty")
	trim := getBool(config, "trim")

	// 统一换行符
	text = strings.ReplaceAll(text, "\r\n", "\n")
	text = strings.ReplaceAll(text, "\r", "\n")

	lines := strings.Split(text, "\n")
	result := make([]interface{}, 0, len(lines))

	for _, line := range lines {
		if trim {
			line = strings.TrimSpace(line)
		}
		if keepEmpty || line != "" {
			result = append(result, line)
		}
	}

	return result, nil
}

func (e *TextSplitExecutor) splitParagraphs(inputs map[string]interface{}, config map[string]interface{}) (interface{}, error) {
	text := e.getInputText(inputs)
	keepEmpty := getBool(config, "keepEmpty")
	trim := getBool(config, "trim")

	// 统一换行符
	text = strings.ReplaceAll(text, "\r\n", "\n")
	text = strings.ReplaceAll(text, "\r", "\n")

	// 按连续空行分割段落
	paragraphs := strings.Split(text, "\n\n")
	result := make([]interface{}, 0, len(paragraphs))

	for _, para := range paragraphs {
		if trim {
			para = strings.TrimSpace(para)
		}
		if keepEmpty || para != "" {
			result = append(result, para)
		}
	}

	return result, nil
}

func (e *TextSplitExecutor) chunk(inputs map[string]interface{}, config map[string]interface{}) (interface{}, error) {
	text := e.getInputText(inputs)
	chunkSize := getInt(config, "chunkSize", 1000)
	chunkOverlap := getInt(config, "chunkOverlap", 0)

	if chunkSize <= 0 {
		return nil, fmt.Errorf("chunk size must be positive")
	}

	if chunkOverlap >= chunkSize {
		return nil, fmt.Errorf("chunk overlap must be less than chunk size")
	}

	result := make([]interface{}, 0)
	runes := []rune(text)
	length := len(runes)

	if length == 0 {
		return result, nil
	}

	step := chunkSize - chunkOverlap
	if step <= 0 {
		step = chunkSize
	}

	for i := 0; i < length; i += step {
		end := i + chunkSize
		if end > length {
			end = length
		}

		chunk := string(runes[i:end])
		result = append(result, map[string]interface{}{
			"text":  chunk,
			"start": i,
			"end":   end,
			"index": len(result),
		})

		if end >= length {
			break
		}
	}

	return result, nil
}

// unescapeSeparator 处理转义字符
func unescapeSeparator(s string) string {
	s = strings.ReplaceAll(s, "\\n", "\n")
	s = strings.ReplaceAll(s, "\\t", "\t")
	s = strings.ReplaceAll(s, "\\r", "\r")
	return s
}
