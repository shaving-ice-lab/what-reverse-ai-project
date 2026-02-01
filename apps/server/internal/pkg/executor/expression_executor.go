package executor

import (
	"context"
	"fmt"
	"regexp"
	"strconv"
	"strings"
)

// NodeTypeExpression 表达式节点类型
const NodeTypeExpression NodeType = "expression"

// ExpressionExecutor 表达式计算节点执行器
type ExpressionExecutor struct{}

// NewExpressionExecutor 创建表达式执行器
func NewExpressionExecutor() *ExpressionExecutor {
	return &ExpressionExecutor{}
}

func (e *ExpressionExecutor) GetType() NodeType {
	return NodeTypeExpression
}

func (e *ExpressionExecutor) Execute(ctx context.Context, node *NodeDefinition, inputs map[string]interface{}, execCtx *ExecutionContext) (*NodeResult, error) {
	expression := getString(node.Config, "expression")
	if expression == "" {
		return &NodeResult{
			NodeID: node.ID,
			Status: NodeStatusFailed,
			Error:  fmt.Errorf("expression is required"),
		}, fmt.Errorf("expression is required")
	}

	outputName := getString(node.Config, "outputName")
	if outputName == "" {
		outputName = "result"
	}

	// 首先进行变量插值
	expression = interpolateVariables(expression, inputs, execCtx)

	// 计算表达式
	result, err := evaluateExpression(expression, inputs, execCtx)
	if err != nil {
		return &NodeResult{
			NodeID: node.ID,
			Status: NodeStatusFailed,
			Error:  err,
		}, err
	}

	outputs := map[string]interface{}{
		"result":   result,
		"output":   result,
		outputName: result,
	}

	return &NodeResult{
		NodeID:  node.ID,
		Status:  NodeStatusCompleted,
		Outputs: outputs,
	}, nil
}

// evaluateExpression 计算表达式
func evaluateExpression(expr string, inputs map[string]interface{}, execCtx *ExecutionContext) (interface{}, error) {
	expr = strings.TrimSpace(expr)

	// 处理字符串字面量
	if (strings.HasPrefix(expr, "'") && strings.HasSuffix(expr, "'")) ||
		(strings.HasPrefix(expr, "\"") && strings.HasSuffix(expr, "\"")) {
		return expr[1 : len(expr)-1], nil
	}

	// 处理数字字面量
	if num, err := strconv.ParseFloat(expr, 64); err == nil {
		return num, nil
	}

	// 处理布尔字面量
	if expr == "true" {
		return true, nil
	}
	if expr == "false" {
		return false, nil
	}

	// 处理 null
	if expr == "null" || expr == "nil" {
		return nil, nil
	}

	// 处理变量引用
	if isVariableRef(expr) {
		return resolveVariable(expr, inputs, execCtx)
	}

	// 处理数学运算
	if result, ok := evaluateMathExpression(expr, inputs, execCtx); ok {
		return result, nil
	}

	// 处理比较运算
	if result, ok := evaluateComparisonExpression(expr, inputs, execCtx); ok {
		return result, nil
	}

	// 处理逻辑运算
	if result, ok := evaluateLogicalExpression(expr, inputs, execCtx); ok {
		return result, nil
	}

	// 处理字符串连接
	if result, ok := evaluateStringConcatenation(expr, inputs, execCtx); ok {
		return result, nil
	}

	// 处理三元运算符
	if result, ok := evaluateTernaryExpression(expr, inputs, execCtx); ok {
		return result, nil
	}

	// 如果都不匹配，返回原始表达式
	return expr, nil
}

// isVariableRef 检查是否是变量引用
func isVariableRef(expr string) bool {
	// 匹配 input.xxx, inputs.xxx, ctx.xxx, $xxx 等格式
	patterns := []string{
		`^input\.`,
		`^inputs\.`,
		`^ctx\.`,
		`^\$[a-zA-Z_]`,
		`^[a-zA-Z_][a-zA-Z0-9_]*$`,
	}
	for _, pattern := range patterns {
		if matched, _ := regexp.MatchString(pattern, expr); matched {
			return true
		}
	}
	return false
}

// resolveVariable 解析变量引用
func resolveVariable(expr string, inputs map[string]interface{}, execCtx *ExecutionContext) (interface{}, error) {
	// 处理 input.xxx 或 inputs.xxx
	if strings.HasPrefix(expr, "input.") || strings.HasPrefix(expr, "inputs.") {
		key := strings.TrimPrefix(strings.TrimPrefix(expr, "inputs."), "input.")
		if v, ok := inputs[key]; ok {
			return v, nil
		}
		return nil, fmt.Errorf("input variable '%s' not found", key)
	}

	// 处理 ctx.xxx
	if strings.HasPrefix(expr, "ctx.") {
		key := strings.TrimPrefix(expr, "ctx.")
		if execCtx != nil {
			if v, ok := execCtx.Variables[key]; ok {
				return v, nil
			}
		}
		return nil, fmt.Errorf("context variable '%s' not found", key)
	}

	// 处理 $xxx
	if strings.HasPrefix(expr, "$") {
		key := strings.TrimPrefix(expr, "$")
		if v, ok := inputs[key]; ok {
			return v, nil
		}
		if execCtx != nil {
			if v, ok := execCtx.Variables[key]; ok {
				return v, nil
			}
		}
		return nil, fmt.Errorf("variable '%s' not found", key)
	}

	// 直接变量名
	if v, ok := inputs[expr]; ok {
		return v, nil
	}
	if execCtx != nil {
		if v, ok := execCtx.Variables[expr]; ok {
			return v, nil
		}
	}

	return nil, fmt.Errorf("variable '%s' not found", expr)
}

// evaluateMathExpression 计算数学表达式
func evaluateMathExpression(expr string, inputs map[string]interface{}, execCtx *ExecutionContext) (interface{}, bool) {
	// 支持基本的数学运算: +, -, *, /, %
	operators := []string{"+", "-", "*", "/", "%"}

	for _, op := range operators {
		parts := splitByOperator(expr, op)
		if len(parts) == 2 {
			left, err1 := evaluateExpression(strings.TrimSpace(parts[0]), inputs, execCtx)
			right, err2 := evaluateExpression(strings.TrimSpace(parts[1]), inputs, execCtx)

			if err1 != nil || err2 != nil {
				continue
			}

			leftNum, ok1 := toNumber(left)
			rightNum, ok2 := toNumber(right)

			if !ok1 || !ok2 {
				continue
			}

			switch op {
			case "+":
				return leftNum + rightNum, true
			case "-":
				return leftNum - rightNum, true
			case "*":
				return leftNum * rightNum, true
			case "/":
				if rightNum == 0 {
					return nil, false
				}
				return leftNum / rightNum, true
			case "%":
				if rightNum == 0 {
					return nil, false
				}
				return float64(int64(leftNum) % int64(rightNum)), true
			}
		}
	}

	return nil, false
}

// evaluateComparisonExpression 计算比较表达式
func evaluateComparisonExpression(expr string, inputs map[string]interface{}, execCtx *ExecutionContext) (interface{}, bool) {
	// 支持比较运算: ==, !=, >, <, >=, <=
	operators := []string{"===", "!==", "==", "!=", ">=", "<=", ">", "<"}

	for _, op := range operators {
		if idx := strings.Index(expr, op); idx != -1 {
			left := strings.TrimSpace(expr[:idx])
			right := strings.TrimSpace(expr[idx+len(op):])

			leftVal, err1 := evaluateExpression(left, inputs, execCtx)
			rightVal, err2 := evaluateExpression(right, inputs, execCtx)

			if err1 != nil || err2 != nil {
				continue
			}

			switch op {
			case "==", "===":
				return compareEqual(leftVal, rightVal), true
			case "!=", "!==":
				return !compareEqual(leftVal, rightVal), true
			case ">":
				return compareGreater(leftVal, rightVal), true
			case "<":
				return compareLess(leftVal, rightVal), true
			case ">=":
				return compareGreater(leftVal, rightVal) || compareEqual(leftVal, rightVal), true
			case "<=":
				return compareLess(leftVal, rightVal) || compareEqual(leftVal, rightVal), true
			}
		}
	}

	return nil, false
}

// evaluateLogicalExpression 计算逻辑表达式
func evaluateLogicalExpression(expr string, inputs map[string]interface{}, execCtx *ExecutionContext) (interface{}, bool) {
	// 支持逻辑运算: &&, ||, !
	if strings.Contains(expr, "&&") {
		parts := strings.SplitN(expr, "&&", 2)
		if len(parts) == 2 {
			left, _ := evaluateExpression(strings.TrimSpace(parts[0]), inputs, execCtx)
			right, _ := evaluateExpression(strings.TrimSpace(parts[1]), inputs, execCtx)
			return toBool(left) && toBool(right), true
		}
	}

	if strings.Contains(expr, "||") {
		parts := strings.SplitN(expr, "||", 2)
		if len(parts) == 2 {
			left, _ := evaluateExpression(strings.TrimSpace(parts[0]), inputs, execCtx)
			right, _ := evaluateExpression(strings.TrimSpace(parts[1]), inputs, execCtx)
			return toBool(left) || toBool(right), true
		}
	}

	if strings.HasPrefix(expr, "!") {
		val, err := evaluateExpression(strings.TrimSpace(expr[1:]), inputs, execCtx)
		if err == nil {
			return !toBool(val), true
		}
	}

	return nil, false
}

// evaluateStringConcatenation 计算字符串连接
func evaluateStringConcatenation(expr string, inputs map[string]interface{}, execCtx *ExecutionContext) (interface{}, bool) {
	// 使用 ++ 或 concat 进行字符串连接
	if strings.Contains(expr, "++") {
		parts := strings.Split(expr, "++")
		var result strings.Builder
		for _, part := range parts {
			val, err := evaluateExpression(strings.TrimSpace(part), inputs, execCtx)
			if err != nil {
				continue
			}
			result.WriteString(fmt.Sprintf("%v", val))
		}
		return result.String(), true
	}

	return nil, false
}

// evaluateTernaryExpression 计算三元表达式
func evaluateTernaryExpression(expr string, inputs map[string]interface{}, execCtx *ExecutionContext) (interface{}, bool) {
	// 支持 condition ? trueValue : falseValue
	qIdx := strings.Index(expr, "?")
	cIdx := strings.LastIndex(expr, ":")

	if qIdx > 0 && cIdx > qIdx {
		condition := strings.TrimSpace(expr[:qIdx])
		trueVal := strings.TrimSpace(expr[qIdx+1 : cIdx])
		falseVal := strings.TrimSpace(expr[cIdx+1:])

		condResult, err := evaluateExpression(condition, inputs, execCtx)
		if err != nil {
			return nil, false
		}

		if toBool(condResult) {
			result, _ := evaluateExpression(trueVal, inputs, execCtx)
			return result, true
		} else {
			result, _ := evaluateExpression(falseVal, inputs, execCtx)
			return result, true
		}
	}

	return nil, false
}

// splitByOperator 按运算符分割（考虑括号）
func splitByOperator(expr string, op string) []string {
	// 简单实现：找到第一个运算符位置
	idx := strings.LastIndex(expr, op)
	if idx > 0 && idx < len(expr)-len(op) {
		return []string{expr[:idx], expr[idx+len(op):]}
	}
	return nil
}

// toNumber 转换为数字
func toNumber(val interface{}) (float64, bool) {
	switch v := val.(type) {
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
	case string:
		if num, err := strconv.ParseFloat(v, 64); err == nil {
			return num, true
		}
	}
	return 0, false
}

// compareEqual 比较相等
func compareEqual(a, b interface{}) bool {
	return fmt.Sprintf("%v", a) == fmt.Sprintf("%v", b)
}

// compareGreater 比较大于
func compareGreater(a, b interface{}) bool {
	aNum, ok1 := toNumber(a)
	bNum, ok2 := toNumber(b)
	if ok1 && ok2 {
		return aNum > bNum
	}
	return fmt.Sprintf("%v", a) > fmt.Sprintf("%v", b)
}

// compareLess 比较小于
func compareLess(a, b interface{}) bool {
	aNum, ok1 := toNumber(a)
	bNum, ok2 := toNumber(b)
	if ok1 && ok2 {
		return aNum < bNum
	}
	return fmt.Sprintf("%v", a) < fmt.Sprintf("%v", b)
}
