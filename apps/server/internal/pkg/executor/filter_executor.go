package executor

import (
	"context"
	"fmt"
	"regexp"
	"strconv"
	"strings"
)

// NodeTypeFilter 数据筛选节点类型
const NodeTypeFilter NodeType = "filter"

// FilterExecutor 数据筛选节点执行器
type FilterExecutor struct{}

// NewFilterExecutor 创建数据筛选执行器
func NewFilterExecutor() *FilterExecutor {
	return &FilterExecutor{}
}

func (e *FilterExecutor) GetType() NodeType {
	return NodeTypeFilter
}

func (e *FilterExecutor) Execute(ctx context.Context, node *NodeDefinition, inputs map[string]interface{}, execCtx *ExecutionContext) (*NodeResult, error) {
	filterType := getString(node.Config, "filterType")
	if filterType == "" {
		filterType = "condition"
	}

	invert := getBool(node.Config, "invert")

	// 获取输入数组
	var inputArray []interface{}
	if v, ok := inputs["input"]; ok {
		if arr, ok := v.([]interface{}); ok {
			inputArray = arr
		}
	}
	if inputArray == nil {
		if v, ok := inputs["array"]; ok {
			if arr, ok := v.([]interface{}); ok {
				inputArray = arr
			}
		}
	}
	if inputArray == nil {
		if v, ok := inputs["items"]; ok {
			if arr, ok := v.([]interface{}); ok {
				inputArray = arr
			}
		}
	}

	if inputArray == nil {
		return &NodeResult{
			NodeID:  node.ID,
			Status:  NodeStatusCompleted,
			Outputs: map[string]interface{}{"result": []interface{}{}, "output": []interface{}{}, "count": 0},
		}, nil
	}

	var result []interface{}
	var err error

	switch filterType {
	case "condition":
		result, err = e.filterByCondition(inputArray, node.Config)
	case "field":
		result, err = e.filterByField(inputArray, node.Config)
	case "type":
		result, err = e.filterByType(inputArray, node.Config)
	case "notNull":
		result, err = e.filterNotNull(inputArray)
	case "range":
		result, err = e.filterByRange(inputArray, node.Config)
	case "contains":
		result, err = e.filterByContains(inputArray, node.Config)
	case "regex":
		result, err = e.filterByRegex(inputArray, node.Config)
	default:
		err = fmt.Errorf("unknown filter type: %s", filterType)
	}

	if err != nil {
		return &NodeResult{
			NodeID: node.ID,
			Status: NodeStatusFailed,
			Error:  err,
		}, err
	}

	// 反转结果
	if invert {
		inverted := make([]interface{}, 0)
		resultSet := make(map[int]bool)
		for i, item := range inputArray {
			for _, r := range result {
				if item == r {
					resultSet[i] = true
					break
				}
			}
		}
		for i, item := range inputArray {
			if !resultSet[i] {
				inverted = append(inverted, item)
			}
		}
		result = inverted
	}

	outputs := map[string]interface{}{
		"result":        result,
		"output":        result,
		"count":         len(result),
		"originalCount": len(inputArray),
		"filteredCount": len(inputArray) - len(result),
	}

	return &NodeResult{
		NodeID:  node.ID,
		Status:  NodeStatusCompleted,
		Outputs: outputs,
	}, nil
}

func (e *FilterExecutor) filterByCondition(arr []interface{}, config map[string]interface{}) ([]interface{}, error) {
	condition := getString(config, "condition")
	if condition == "" {
		return arr, nil
	}

	result := make([]interface{}, 0)
	for _, item := range arr {
		if evaluateFilterCondition(condition, item) {
			result = append(result, item)
		}
	}

	return result, nil
}

func evaluateFilterCondition(condition string, item interface{}) bool {
	itemMap, ok := item.(map[string]interface{})
	if !ok {
		return false
	}

	// 简单的条件解析
	// 支持格式: field == value, field != value, field > value 等
	parts := parseCondition(condition)
	if len(parts) != 3 {
		return false
	}

	field, op, valueStr := parts[0], parts[1], parts[2]
	fieldValue, exists := itemMap[field]
	if !exists {
		return false
	}

	return compareValues(fieldValue, op, valueStr)
}

func parseCondition(condition string) []string {
	operators := []string{"===", "!==", "==", "!=", ">=", "<=", ">", "<"}
	for _, op := range operators {
		if idx := strings.Index(condition, op); idx > 0 {
			field := strings.TrimSpace(condition[:idx])
			value := strings.TrimSpace(condition[idx+len(op):])
			return []string{field, op, value}
		}
	}
	return nil
}

func compareValues(fieldValue interface{}, op, valueStr string) bool {
	// 去除引号
	valueStr = strings.Trim(valueStr, "'\"")

	// 数字比较
	if fieldNum, ok := toNumber(fieldValue); ok {
		if valueNum, err := strconv.ParseFloat(valueStr, 64); err == nil {
			switch op {
			case "==", "===":
				return fieldNum == valueNum
			case "!=", "!==":
				return fieldNum != valueNum
			case ">":
				return fieldNum > valueNum
			case "<":
				return fieldNum < valueNum
			case ">=":
				return fieldNum >= valueNum
			case "<=":
				return fieldNum <= valueNum
			}
		}
	}

	// 字符串比较
	fieldStr := fmt.Sprintf("%v", fieldValue)
	switch op {
	case "==", "===":
		return fieldStr == valueStr
	case "!=", "!==":
		return fieldStr != valueStr
	case ">":
		return fieldStr > valueStr
	case "<":
		return fieldStr < valueStr
	case ">=":
		return fieldStr >= valueStr
	case "<=":
		return fieldStr <= valueStr
	}

	return false
}

func (e *FilterExecutor) filterByField(arr []interface{}, config map[string]interface{}) ([]interface{}, error) {
	field := getString(config, "field")
	operator := getString(config, "operator")
	value := config["value"]

	if field == "" {
		return arr, nil
	}

	result := make([]interface{}, 0)
	for _, item := range arr {
		itemMap, ok := item.(map[string]interface{})
		if !ok {
			continue
		}

		fieldValue, exists := itemMap[field]
		if !exists {
			continue
		}

		if matchFieldValue(fieldValue, operator, value) {
			result = append(result, item)
		}
	}

	return result, nil
}

func matchFieldValue(fieldValue interface{}, operator string, targetValue interface{}) bool {
	if operator == "" || operator == "exists" {
		return fieldValue != nil
	}

	targetStr := fmt.Sprintf("%v", targetValue)
	return compareValues(fieldValue, operator, targetStr)
}

func (e *FilterExecutor) filterByType(arr []interface{}, config map[string]interface{}) ([]interface{}, error) {
	targetType := getString(config, "targetType")
	if targetType == "" {
		return arr, nil
	}

	result := make([]interface{}, 0)
	for _, item := range arr {
		if matchType(item, targetType) {
			result = append(result, item)
		}
	}

	return result, nil
}

func matchType(value interface{}, targetType string) bool {
	switch targetType {
	case "string":
		_, ok := value.(string)
		return ok
	case "number":
		_, ok := toNumber(value)
		return ok
	case "boolean":
		_, ok := value.(bool)
		return ok
	case "object":
		_, ok := value.(map[string]interface{})
		return ok
	case "array":
		_, ok := value.([]interface{})
		return ok
	case "null":
		return value == nil
	default:
		return false
	}
}

func (e *FilterExecutor) filterNotNull(arr []interface{}) ([]interface{}, error) {
	result := make([]interface{}, 0)
	for _, item := range arr {
		if item != nil {
			if str, ok := item.(string); ok && str == "" {
				continue
			}
			result = append(result, item)
		}
	}
	return result, nil
}

func (e *FilterExecutor) filterByRange(arr []interface{}, config map[string]interface{}) ([]interface{}, error) {
	field := getString(config, "field")
	minValue := getFloat(config, "minValue", 0)
	maxValue := getFloat(config, "maxValue", 0)
	hasMin := config["minValue"] != nil
	hasMax := config["maxValue"] != nil

	result := make([]interface{}, 0)
	for _, item := range arr {
		var numValue float64
		var ok bool

		if field != "" {
			if itemMap, mapOk := item.(map[string]interface{}); mapOk {
				numValue, ok = toNumber(itemMap[field])
			}
		} else {
			numValue, ok = toNumber(item)
		}

		if !ok {
			continue
		}

		inRange := true
		if hasMin && numValue < minValue {
			inRange = false
		}
		if hasMax && numValue > maxValue {
			inRange = false
		}

		if inRange {
			result = append(result, item)
		}
	}

	return result, nil
}

func (e *FilterExecutor) filterByContains(arr []interface{}, config map[string]interface{}) ([]interface{}, error) {
	field := getString(config, "field")
	searchValue := getString(config, "value")
	caseSensitive := getBool(config, "caseSensitive")

	if !caseSensitive {
		searchValue = strings.ToLower(searchValue)
	}

	result := make([]interface{}, 0)
	for _, item := range arr {
		var strValue string

		if field != "" {
			if itemMap, ok := item.(map[string]interface{}); ok {
				strValue = fmt.Sprintf("%v", itemMap[field])
			}
		} else {
			strValue = fmt.Sprintf("%v", item)
		}

		if !caseSensitive {
			strValue = strings.ToLower(strValue)
		}

		if strings.Contains(strValue, searchValue) {
			result = append(result, item)
		}
	}

	return result, nil
}

func (e *FilterExecutor) filterByRegex(arr []interface{}, config map[string]interface{}) ([]interface{}, error) {
	field := getString(config, "field")
	pattern := getString(config, "pattern")

	if pattern == "" {
		return arr, nil
	}

	re, err := regexp.Compile(pattern)
	if err != nil {
		return nil, fmt.Errorf("invalid regex pattern: %w", err)
	}

	result := make([]interface{}, 0)
	for _, item := range arr {
		var strValue string

		if field != "" {
			if itemMap, ok := item.(map[string]interface{}); ok {
				strValue = fmt.Sprintf("%v", itemMap[field])
			}
		} else {
			strValue = fmt.Sprintf("%v", item)
		}

		if re.MatchString(strValue) {
			result = append(result, item)
		}
	}

	return result, nil
}
