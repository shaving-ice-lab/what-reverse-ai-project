package executor

import (
	"context"
	"fmt"
	"regexp"
)

// NodeTypeRegex 正则提取节点类型
const NodeTypeRegex NodeType = "regex"

// RegexExecutor 正则提取节点执行器
type RegexExecutor struct{}

// NewRegexExecutor 创建正则提取执行器
func NewRegexExecutor() *RegexExecutor {
	return &RegexExecutor{}
}

func (e *RegexExecutor) GetType() NodeType {
	return NodeTypeRegex
}

func (e *RegexExecutor) Execute(ctx context.Context, node *NodeDefinition, inputs map[string]interface{}, execCtx *ExecutionContext) (*NodeResult, error) {
	pattern := getString(node.Config, "pattern")
	if pattern == "" {
		return &NodeResult{
			NodeID: node.ID,
			Status: NodeStatusFailed,
			Error:  fmt.Errorf("regex pattern is required"),
		}, fmt.Errorf("regex pattern is required")
	}

	flags := getString(node.Config, "flags")
	extractMode := getString(node.Config, "extractMode")
	if extractMode == "" {
		extractMode = "all"
	}

	// 获取输入文本
	var inputText string
	if v, ok := inputs["input"]; ok {
		inputText = fmt.Sprintf("%v", v)
	} else if v, ok := inputs["text"]; ok {
		inputText = fmt.Sprintf("%v", v)
	} else if v, ok := inputs["value"]; ok {
		inputText = fmt.Sprintf("%v", v)
	} else {
		// 使用第一个输入值
		for _, v := range inputs {
			inputText = fmt.Sprintf("%v", v)
			break
		}
	}

	// 编译正则表达式
	re, err := compileRegex(pattern, flags)
	if err != nil {
		return &NodeResult{
			NodeID: node.ID,
			Status: NodeStatusFailed,
			Error:  err,
		}, err
	}

	// 执行提取
	result, err := e.extract(re, inputText, extractMode, node.Config)
	if err != nil {
		return &NodeResult{
			NodeID: node.ID,
			Status: NodeStatusFailed,
			Error:  err,
		}, err
	}

	outputs := map[string]interface{}{
		"result":  result,
		"output":  result,
		"matches": result,
	}

	// 添加匹配信息
	if matches, ok := result.([]interface{}); ok {
		outputs["count"] = len(matches)
		outputs["hasMatch"] = len(matches) > 0
	} else if matched, ok := result.(bool); ok {
		outputs["hasMatch"] = matched
	} else {
		outputs["hasMatch"] = result != nil
	}

	return &NodeResult{
		NodeID:  node.ID,
		Status:  NodeStatusCompleted,
		Outputs: outputs,
	}, nil
}

func compileRegex(pattern, flags string) (*regexp.Regexp, error) {
	// Go 正则不支持 flags，但我们可以处理一些常见的
	regexPattern := pattern

	// 处理多行和忽略大小写
	var prefix string
	if containsFlag(flags, "i") {
		prefix += "(?i)"
	}
	if containsFlag(flags, "m") {
		prefix += "(?m)"
	}
	if containsFlag(flags, "s") {
		prefix += "(?s)"
	}

	if prefix != "" {
		regexPattern = prefix + pattern
	}

	return regexp.Compile(regexPattern)
}

func containsFlag(flags, flag string) bool {
	for _, f := range flags {
		if string(f) == flag {
			return true
		}
	}
	return false
}

func (e *RegexExecutor) extract(re *regexp.Regexp, text, mode string, config map[string]interface{}) (interface{}, error) {
	switch mode {
	case "test":
		return re.MatchString(text), nil

	case "first":
		match := re.FindString(text)
		if match == "" {
			return nil, nil
		}
		return match, nil

	case "all":
		matches := re.FindAllString(text, -1)
		if matches == nil {
			return []interface{}{}, nil
		}
		result := make([]interface{}, len(matches))
		for i, m := range matches {
			result[i] = m
		}
		return result, nil

	case "groups":
		return e.extractGroups(re, text, config)

	default:
		return e.extractAll(re, text)
	}
}

func (e *RegexExecutor) extractAll(re *regexp.Regexp, text string) (interface{}, error) {
	matches := re.FindAllStringSubmatch(text, -1)
	if matches == nil {
		return []interface{}{}, nil
	}

	result := make([]interface{}, len(matches))
	for i, match := range matches {
		if len(match) == 1 {
			result[i] = match[0]
		} else {
			// 包含分组
			groups := make(map[string]interface{})
			groups["match"] = match[0]
			for j := 1; j < len(match); j++ {
				groups[fmt.Sprintf("group%d", j)] = match[j]
			}
			result[i] = groups
		}
	}
	return result, nil
}

func (e *RegexExecutor) extractGroups(re *regexp.Regexp, text string, config map[string]interface{}) (interface{}, error) {
	groupNames := getStringArray(config, "groupNames")

	matches := re.FindAllStringSubmatch(text, -1)
	if matches == nil {
		return []interface{}{}, nil
	}

	result := make([]interface{}, len(matches))
	for i, match := range matches {
		groups := make(map[string]interface{})
		groups["match"] = match[0]

		for j := 1; j < len(match); j++ {
			// 使用配置的分组名称或默认名称
			var name string
			if j-1 < len(groupNames) && groupNames[j-1] != "" {
				name = groupNames[j-1]
			} else {
				name = fmt.Sprintf("group%d", j)
			}
			groups[name] = match[j]
		}
		result[i] = groups
	}
	return result, nil
}

// ReplaceExecutor 正则替换执行器（作为 Regex 的扩展）
type ReplaceExecutor struct{}

// NewReplaceExecutor 创建正则替换执行器
func NewReplaceExecutor() *ReplaceExecutor {
	return &ReplaceExecutor{}
}

func (e *ReplaceExecutor) GetType() NodeType {
	return "replace"
}

func (e *ReplaceExecutor) Execute(ctx context.Context, node *NodeDefinition, inputs map[string]interface{}, execCtx *ExecutionContext) (*NodeResult, error) {
	pattern := getString(node.Config, "pattern")
	replacement := getString(node.Config, "replacement")
	flags := getString(node.Config, "flags")
	replaceAll := getBool(node.Config, "replaceAll")

	// 获取输入文本
	var inputText string
	if v, ok := inputs["input"]; ok {
		inputText = fmt.Sprintf("%v", v)
	} else if v, ok := inputs["text"]; ok {
		inputText = fmt.Sprintf("%v", v)
	} else if v, ok := inputs["value"]; ok {
		inputText = fmt.Sprintf("%v", v)
	}

	var result string
	var err error

	if pattern != "" {
		// 正则替换
		re, compileErr := compileRegex(pattern, flags)
		if compileErr != nil {
			return &NodeResult{
				NodeID: node.ID,
				Status: NodeStatusFailed,
				Error:  compileErr,
			}, compileErr
		}

		if replaceAll {
			result = re.ReplaceAllString(inputText, replacement)
		} else {
			// 只替换第一个
			loc := re.FindStringIndex(inputText)
			if loc != nil {
				result = inputText[:loc[0]] + replacement + inputText[loc[1]:]
			} else {
				result = inputText
			}
		}
	} else {
		result = inputText
		err = fmt.Errorf("pattern is required for replace")
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
		"value":  result,
	}

	return &NodeResult{
		NodeID:  node.ID,
		Status:  NodeStatusCompleted,
		Outputs: outputs,
	}, nil
}
