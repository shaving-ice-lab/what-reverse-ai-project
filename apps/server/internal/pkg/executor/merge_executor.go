package executor

import (
	"context"
	"fmt"
)

// NodeTypeMerge 数据合并节点类型
const NodeTypeMerge NodeType = "merge"

// MergeExecutor 数据合并节点执行器
type MergeExecutor struct{}

// NewMergeExecutor 创建数据合并执行器
func NewMergeExecutor() *MergeExecutor {
	return &MergeExecutor{}
}

func (e *MergeExecutor) GetType() NodeType {
	return NodeTypeMerge
}

func (e *MergeExecutor) Execute(ctx context.Context, node *NodeDefinition, inputs map[string]interface{}, execCtx *ExecutionContext) (*NodeResult, error) {
	mergeType := getString(node.Config, "mergeType")
	if mergeType == "" {
		mergeType = "concat"
	}

	inputCount := getInt(node.Config, "inputCount", 2)
	deep := getBool(node.Config, "deep")
	unique := getBool(node.Config, "unique")

	// 收集所有输入
	inputValues := make([]interface{}, 0, inputCount)
	for i := 0; i < inputCount; i++ {
		key := fmt.Sprintf("input-%d", i)
		if v, ok := inputs[key]; ok {
			inputValues = append(inputValues, v)
		} else if i == 0 {
			// 尝试使用默认输入名称
			if v, ok := inputs["input"]; ok {
				inputValues = append(inputValues, v)
			}
		}
	}

	// 如果没有收集到足够的输入，尝试从其他键获取
	if len(inputValues) < 2 {
		for key, val := range inputs {
			if key != "input" && !startsWithInputPrefix(key) {
				inputValues = append(inputValues, val)
			}
		}
	}

	var result interface{}
	var err error

	switch mergeType {
	case "concat":
		result, err = e.concat(inputValues)
	case "merge":
		result, err = e.mergeObjects(inputValues, deep)
	case "zip":
		result, err = e.zip(inputValues)
	case "union":
		result, err = e.union(inputValues)
	case "intersection":
		result, err = e.intersection(inputValues)
	case "difference":
		result, err = e.difference(inputValues)
	default:
		err = fmt.Errorf("unknown merge type: %s", mergeType)
	}

	if err != nil {
		return &NodeResult{
			NodeID: node.ID,
			Status: NodeStatusFailed,
			Error:  err,
		}, err
	}

	// 去重处理
	if unique {
		if arr, ok := result.([]interface{}); ok {
			result = uniqueArray(arr)
		}
	}

	outputs := map[string]interface{}{
		"result": result,
		"output": result,
	}

	return &NodeResult{
		NodeID:  node.ID,
		Status:  NodeStatusCompleted,
		Outputs: outputs,
	}, nil
}

func startsWithInputPrefix(s string) bool {
	return len(s) > 6 && s[:6] == "input-"
}

func (e *MergeExecutor) concat(inputs []interface{}) (interface{}, error) {
	result := make([]interface{}, 0)

	for _, input := range inputs {
		switch v := input.(type) {
		case []interface{}:
			result = append(result, v...)
		case nil:
			// 跳过 nil
		default:
			result = append(result, v)
		}
	}

	return result, nil
}

func (e *MergeExecutor) mergeObjects(inputs []interface{}, deep bool) (interface{}, error) {
	result := make(map[string]interface{})

	for _, input := range inputs {
		obj, ok := input.(map[string]interface{})
		if !ok {
			continue
		}

		for key, val := range obj {
			if deep {
				if existingObj, ok := result[key].(map[string]interface{}); ok {
					if newObj, ok := val.(map[string]interface{}); ok {
						merged, _ := e.mergeObjects([]interface{}{existingObj, newObj}, true)
						result[key] = merged
						continue
					}
				}
			}
			result[key] = val
		}
	}

	return result, nil
}

func (e *MergeExecutor) zip(inputs []interface{}) (interface{}, error) {
	if len(inputs) < 2 {
		return nil, fmt.Errorf("zip requires at least 2 inputs")
	}

	// 获取所有数组
	arrays := make([][]interface{}, 0, len(inputs))
	minLen := -1

	for _, input := range inputs {
		arr, ok := input.([]interface{})
		if !ok {
			continue
		}
		arrays = append(arrays, arr)
		if minLen < 0 || len(arr) < minLen {
			minLen = len(arr)
		}
	}

	if len(arrays) < 2 {
		return nil, fmt.Errorf("zip requires at least 2 arrays")
	}

	result := make([]interface{}, minLen)
	for i := 0; i < minLen; i++ {
		tuple := make([]interface{}, len(arrays))
		for j, arr := range arrays {
			tuple[j] = arr[i]
		}
		result[i] = tuple
	}

	return result, nil
}

func (e *MergeExecutor) union(inputs []interface{}) (interface{}, error) {
	seen := make(map[string]bool)
	result := make([]interface{}, 0)

	for _, input := range inputs {
		arr, ok := input.([]interface{})
		if !ok {
			continue
		}

		for _, item := range arr {
			key := fmt.Sprintf("%v", item)
			if !seen[key] {
				seen[key] = true
				result = append(result, item)
			}
		}
	}

	return result, nil
}

func (e *MergeExecutor) intersection(inputs []interface{}) (interface{}, error) {
	if len(inputs) < 2 {
		return nil, fmt.Errorf("intersection requires at least 2 inputs")
	}

	// 计算第一个数组的元素集合
	first, ok := inputs[0].([]interface{})
	if !ok {
		return []interface{}{}, nil
	}

	counts := make(map[string]int)
	for _, item := range first {
		key := fmt.Sprintf("%v", item)
		counts[key] = 1
	}

	// 检查其他数组
	for i := 1; i < len(inputs); i++ {
		arr, ok := inputs[i].([]interface{})
		if !ok {
			continue
		}

		current := make(map[string]bool)
		for _, item := range arr {
			key := fmt.Sprintf("%v", item)
			if counts[key] == i {
				current[key] = true
				counts[key] = i + 1
			}
		}
	}

	// 收集交集结果
	result := make([]interface{}, 0)
	for _, item := range first {
		key := fmt.Sprintf("%v", item)
		if counts[key] == len(inputs) {
			result = append(result, item)
			counts[key] = 0 // 避免重复添加
		}
	}

	return result, nil
}

func (e *MergeExecutor) difference(inputs []interface{}) (interface{}, error) {
	if len(inputs) < 2 {
		return nil, fmt.Errorf("difference requires at least 2 inputs")
	}

	first, ok := inputs[0].([]interface{})
	if !ok {
		return []interface{}{}, nil
	}

	// 收集其他数组的所有元素
	exclude := make(map[string]bool)
	for i := 1; i < len(inputs); i++ {
		arr, ok := inputs[i].([]interface{})
		if !ok {
			continue
		}
		for _, item := range arr {
			key := fmt.Sprintf("%v", item)
			exclude[key] = true
		}
	}

	// 过滤第一个数组
	result := make([]interface{}, 0)
	for _, item := range first {
		key := fmt.Sprintf("%v", item)
		if !exclude[key] {
			result = append(result, item)
		}
	}

	return result, nil
}

func uniqueArray(arr []interface{}) []interface{} {
	seen := make(map[string]bool)
	result := make([]interface{}, 0, len(arr))

	for _, item := range arr {
		key := fmt.Sprintf("%v", item)
		if !seen[key] {
			seen[key] = true
			result = append(result, item)
		}
	}

	return result
}
