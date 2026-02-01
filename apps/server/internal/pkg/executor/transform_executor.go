package executor

import (
	"context"
	"encoding/json"
	"fmt"
	"sort"
	"strconv"
	"strings"
)

// NodeTypeTransform 数据转换节点类型
const NodeTypeTransform NodeType = "transform"

// TransformExecutor 数据转换节点执行器
type TransformExecutor struct{}

// NewTransformExecutor 创建数据转换执行器
func NewTransformExecutor() *TransformExecutor {
	return &TransformExecutor{}
}

func (e *TransformExecutor) GetType() NodeType {
	return NodeTypeTransform
}

func (e *TransformExecutor) Execute(ctx context.Context, node *NodeDefinition, inputs map[string]interface{}, execCtx *ExecutionContext) (*NodeResult, error) {
	transformType := getString(node.Config, "transformType")
	if transformType == "" {
		transformType = "jsonParse"
	}

	// 获取输入值
	var inputValue interface{}
	if v, ok := inputs["input"]; ok {
		inputValue = v
	} else if v, ok := inputs["value"]; ok {
		inputValue = v
	} else {
		// 使用第一个输入值
		for _, v := range inputs {
			inputValue = v
			break
		}
	}

	// 执行转换
	result, err := e.transform(transformType, inputValue, node.Config)
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

func (e *TransformExecutor) transform(transformType string, input interface{}, config map[string]interface{}) (interface{}, error) {
	switch transformType {
	case "jsonParse":
		return e.jsonParse(input)
	case "jsonStringify":
		return e.jsonStringify(input)
	case "toArray":
		return e.toArray(input)
	case "toObject":
		return e.toObject(input, config)
	case "toString":
		return e.toString(input)
	case "toNumber":
		return e.toNumber(input)
	case "toBoolean":
		return e.toBoolean(input)
	case "flatten":
		return e.flatten(input, config)
	case "pick":
		return e.pick(input, config)
	case "omit":
		return e.omit(input, config)
	case "map":
		return e.mapTransform(input, config)
	case "filter":
		return e.filter(input, config)
	case "sort":
		return e.sortArray(input, config)
	case "reverse":
		return e.reverse(input)
	case "unique":
		return e.unique(input)
	case "groupBy":
		return e.groupBy(input, config)
	default:
		return nil, fmt.Errorf("unknown transform type: %s", transformType)
	}
}

func (e *TransformExecutor) jsonParse(input interface{}) (interface{}, error) {
	str, ok := input.(string)
	if !ok {
		return input, nil // 已经是解析后的对象
	}

	var result interface{}
	if err := json.Unmarshal([]byte(str), &result); err != nil {
		return nil, fmt.Errorf("JSON parse error: %w", err)
	}
	return result, nil
}

func (e *TransformExecutor) jsonStringify(input interface{}) (interface{}, error) {
	bytes, err := json.Marshal(input)
	if err != nil {
		return nil, fmt.Errorf("JSON stringify error: %w", err)
	}
	return string(bytes), nil
}

func (e *TransformExecutor) toArray(input interface{}) (interface{}, error) {
	switch v := input.(type) {
	case []interface{}:
		return v, nil
	case string:
		// 尝试 JSON 解析
		var arr []interface{}
		if err := json.Unmarshal([]byte(v), &arr); err == nil {
			return arr, nil
		}
		// 按分隔符分割
		parts := strings.Split(v, ",")
		arr = make([]interface{}, len(parts))
		for i, p := range parts {
			arr[i] = strings.TrimSpace(p)
		}
		return arr, nil
	case map[string]interface{}:
		// 将对象的值转为数组
		arr := make([]interface{}, 0, len(v))
		for _, val := range v {
			arr = append(arr, val)
		}
		return arr, nil
	default:
		return []interface{}{input}, nil
	}
}

func (e *TransformExecutor) toObject(input interface{}, config map[string]interface{}) (interface{}, error) {
	switch v := input.(type) {
	case map[string]interface{}:
		return v, nil
	case string:
		var obj map[string]interface{}
		if err := json.Unmarshal([]byte(v), &obj); err != nil {
			return nil, fmt.Errorf("cannot convert string to object: %w", err)
		}
		return obj, nil
	case []interface{}:
		// 将数组转为对象（使用索引作为 key）
		keyField := getString(config, "keyField")
		valueField := getString(config, "valueField")

		obj := make(map[string]interface{})
		for i, item := range v {
			if keyField != "" && valueField != "" {
				if itemMap, ok := item.(map[string]interface{}); ok {
					if key, ok := itemMap[keyField].(string); ok {
						obj[key] = itemMap[valueField]
						continue
					}
				}
			}
			obj[strconv.Itoa(i)] = item
		}
		return obj, nil
	default:
		return map[string]interface{}{"value": input}, nil
	}
}

func (e *TransformExecutor) toString(input interface{}) (interface{}, error) {
	return fmt.Sprintf("%v", input), nil
}

func (e *TransformExecutor) toNumber(input interface{}) (interface{}, error) {
	switch v := input.(type) {
	case float64:
		return v, nil
	case float32:
		return float64(v), nil
	case int:
		return float64(v), nil
	case int64:
		return float64(v), nil
	case string:
		if num, err := strconv.ParseFloat(v, 64); err == nil {
			return num, nil
		}
		return nil, fmt.Errorf("cannot convert '%s' to number", v)
	case bool:
		if v {
			return float64(1), nil
		}
		return float64(0), nil
	default:
		return nil, fmt.Errorf("cannot convert %T to number", input)
	}
}

func (e *TransformExecutor) toBoolean(input interface{}) (interface{}, error) {
	return toBool(input), nil
}

func (e *TransformExecutor) flatten(input interface{}, config map[string]interface{}) (interface{}, error) {
	arr, ok := input.([]interface{})
	if !ok {
		return input, nil
	}

	depth := getInt(config, "depth", 1)
	return flattenArray(arr, depth), nil
}

func flattenArray(arr []interface{}, depth int) []interface{} {
	if depth == 0 {
		return arr
	}

	result := make([]interface{}, 0)
	for _, item := range arr {
		if subArr, ok := item.([]interface{}); ok {
			result = append(result, flattenArray(subArr, depth-1)...)
		} else {
			result = append(result, item)
		}
	}
	return result
}

func (e *TransformExecutor) pick(input interface{}, config map[string]interface{}) (interface{}, error) {
	obj, ok := input.(map[string]interface{})
	if !ok {
		return input, nil
	}

	fields := getStringArray(config, "fields")
	if len(fields) == 0 {
		return obj, nil
	}

	result := make(map[string]interface{})
	for _, field := range fields {
		if val, ok := obj[field]; ok {
			result[field] = val
		}
	}
	return result, nil
}

func (e *TransformExecutor) omit(input interface{}, config map[string]interface{}) (interface{}, error) {
	obj, ok := input.(map[string]interface{})
	if !ok {
		return input, nil
	}

	fields := getStringArray(config, "fields")
	if len(fields) == 0 {
		return obj, nil
	}

	// 创建要排除的字段 set
	omitSet := make(map[string]bool)
	for _, field := range fields {
		omitSet[field] = true
	}

	result := make(map[string]interface{})
	for key, val := range obj {
		if !omitSet[key] {
			result[key] = val
		}
	}
	return result, nil
}

func (e *TransformExecutor) mapTransform(input interface{}, config map[string]interface{}) (interface{}, error) {
	arr, ok := input.([]interface{})
	if !ok {
		return input, nil
	}

	expression := getString(config, "expression")
	if expression == "" {
		return arr, nil
	}

	result := make([]interface{}, len(arr))
	for i, item := range arr {
		// 简单的字段提取
		if strings.HasPrefix(expression, "item.") {
			field := strings.TrimPrefix(expression, "item.")
			if itemMap, ok := item.(map[string]interface{}); ok {
				result[i] = itemMap[field]
				continue
			}
		}
		result[i] = item
	}
	return result, nil
}

func (e *TransformExecutor) filter(input interface{}, config map[string]interface{}) (interface{}, error) {
	arr, ok := input.([]interface{})
	if !ok {
		return input, nil
	}

	expression := getString(config, "expression")
	if expression == "" {
		return arr, nil
	}

	result := make([]interface{}, 0)
	for _, item := range arr {
		// 简单的条件过滤
		if itemMap, ok := item.(map[string]interface{}); ok {
			// 解析简单条件如 "item.status == 'active'"
			if evaluateSimpleCondition(expression, itemMap) {
				result = append(result, item)
			}
		} else {
			result = append(result, item)
		}
	}
	return result, nil
}

func evaluateSimpleCondition(expression string, item map[string]interface{}) bool {
	// 简单实现：检查字段是否存在且不为空
	if strings.HasPrefix(expression, "item.") {
		parts := strings.SplitN(expression, " ", 3)
		if len(parts) >= 1 {
			field := strings.TrimPrefix(parts[0], "item.")
			val, exists := item[field]
			if !exists {
				return false
			}
			if len(parts) == 1 {
				return val != nil && val != ""
			}
			// TODO: 实现更复杂的条件比较
		}
	}
	return true
}

func (e *TransformExecutor) sortArray(input interface{}, config map[string]interface{}) (interface{}, error) {
	arr, ok := input.([]interface{})
	if !ok {
		return input, nil
	}

	sortKey := getString(config, "sortKey")
	sortOrder := getString(config, "sortOrder")
	if sortOrder == "" {
		sortOrder = "asc"
	}

	// 复制数组
	result := make([]interface{}, len(arr))
	copy(result, arr)

	sort.Slice(result, func(i, j int) bool {
		var vi, vj interface{}

		if sortKey != "" {
			if mi, ok := result[i].(map[string]interface{}); ok {
				vi = mi[sortKey]
			}
			if mj, ok := result[j].(map[string]interface{}); ok {
				vj = mj[sortKey]
			}
		} else {
			vi = result[i]
			vj = result[j]
		}

		less := compareLess(vi, vj)
		if sortOrder == "desc" {
			return !less
		}
		return less
	})

	return result, nil
}

func (e *TransformExecutor) reverse(input interface{}) (interface{}, error) {
	arr, ok := input.([]interface{})
	if !ok {
		return input, nil
	}

	result := make([]interface{}, len(arr))
	for i, item := range arr {
		result[len(arr)-1-i] = item
	}
	return result, nil
}

func (e *TransformExecutor) unique(input interface{}) (interface{}, error) {
	arr, ok := input.([]interface{})
	if !ok {
		return input, nil
	}

	seen := make(map[string]bool)
	result := make([]interface{}, 0)

	for _, item := range arr {
		key := fmt.Sprintf("%v", item)
		if !seen[key] {
			seen[key] = true
			result = append(result, item)
		}
	}
	return result, nil
}

func (e *TransformExecutor) groupBy(input interface{}, config map[string]interface{}) (interface{}, error) {
	arr, ok := input.([]interface{})
	if !ok {
		return input, nil
	}

	groupKey := getString(config, "groupKey")
	if groupKey == "" {
		return input, nil
	}

	result := make(map[string][]interface{})
	for _, item := range arr {
		if itemMap, ok := item.(map[string]interface{}); ok {
			key := fmt.Sprintf("%v", itemMap[groupKey])
			result[key] = append(result[key], item)
		}
	}
	return result, nil
}

// getStringArray 获取字符串数组配置
func getStringArray(config map[string]interface{}, key string) []string {
	if v, ok := config[key]; ok {
		switch arr := v.(type) {
		case []string:
			return arr
		case []interface{}:
			result := make([]string, len(arr))
			for i, item := range arr {
				result[i] = fmt.Sprintf("%v", item)
			}
			return result
		case string:
			return strings.Split(arr, ",")
		}
	}
	return nil
}
