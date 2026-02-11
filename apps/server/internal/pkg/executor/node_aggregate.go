package executor

import (
	"context"
	"fmt"
	"math"
	"strings"
)

// NodeTypeAggregate 聚合计算节点
const NodeTypeAggregate NodeType = "aggregate"

// AggregateExecutor 对数据进行聚合计算（SUM / AVG / COUNT / MIN / MAX / GROUP BY）
type AggregateExecutor struct{}

func NewAggregateExecutor() *AggregateExecutor {
	return &AggregateExecutor{}
}

func (e *AggregateExecutor) GetType() NodeType {
	return NodeTypeAggregate
}

func (e *AggregateExecutor) Execute(ctx context.Context, node *NodeDefinition, inputs map[string]interface{}, execCtx *ExecutionContext) (*NodeResult, error) {
	// Config:
	//   data_key: string — key in inputs for the data array (default: "rows")
	//   aggregations: [{function, column, alias}]
	//     function: count / sum / avg / min / max
	//     column: string — column name to aggregate
	//     alias: string — output alias
	//   group_by: []string — columns to group by

	dataKey := getString(node.Config, "data_key")
	if dataKey == "" {
		dataKey = "rows"
	}

	rawData := inputs[dataKey]
	if rawData == nil {
		rawData = inputs["output"]
	}
	if rawData == nil {
		rawData = inputs["result"]
	}

	rows, ok := toRowSlice(rawData)
	if !ok || len(rows) == 0 {
		return &NodeResult{
			NodeID: node.ID,
			Status: NodeStatusCompleted,
			Outputs: map[string]interface{}{
				"result": []interface{}{},
				"output": []interface{}{},
				"count":  0,
			},
		}, nil
	}

	aggsRaw, _ := node.Config["aggregations"].([]interface{})
	groupByRaw, _ := node.Config["group_by"].([]interface{})

	groupByCols := make([]string, 0, len(groupByRaw))
	for _, g := range groupByRaw {
		groupByCols = append(groupByCols, fmt.Sprintf("%v", g))
	}

	type aggDef struct {
		Function string
		Column   string
		Alias    string
	}
	aggs := make([]aggDef, 0, len(aggsRaw))
	for _, a := range aggsRaw {
		am, ok := a.(map[string]interface{})
		if !ok {
			continue
		}
		fn := strings.ToLower(getString(am, "function"))
		col := getString(am, "column")
		alias := getString(am, "alias")
		if alias == "" {
			alias = fmt.Sprintf("%s_%s", fn, col)
		}
		aggs = append(aggs, aggDef{Function: fn, Column: col, Alias: alias})
	}

	// If no aggregations defined, just count
	if len(aggs) == 0 {
		aggs = append(aggs, aggDef{Function: "count", Column: "*", Alias: "count"})
	}

	// Group rows
	groups := groupRows(rows, groupByCols)

	// Compute aggregations per group
	results := make([]map[string]interface{}, 0, len(groups))
	for _, group := range groups {
		row := make(map[string]interface{})

		// Add group-by values
		if len(group.rows) > 0 {
			for _, col := range groupByCols {
				row[col] = group.rows[0][col]
			}
		}

		// Compute aggregation
		for _, agg := range aggs {
			row[agg.Alias] = computeAgg(agg.Function, agg.Column, group.rows)
		}

		results = append(results, row)
	}

	outputs := map[string]interface{}{
		"result":      results,
		"output":      results,
		"count":       len(results),
		"total_rows":  len(rows),
		"group_count": len(groups),
	}

	return &NodeResult{
		NodeID:  node.ID,
		Status:  NodeStatusCompleted,
		Outputs: outputs,
	}, nil
}

type rowGroup struct {
	key  string
	rows []map[string]interface{}
}

func groupRows(rows []map[string]interface{}, groupByCols []string) []rowGroup {
	if len(groupByCols) == 0 {
		return []rowGroup{{key: "__all__", rows: rows}}
	}

	groupMap := map[string]*rowGroup{}
	var keys []string

	for _, row := range rows {
		parts := make([]string, len(groupByCols))
		for i, col := range groupByCols {
			parts[i] = fmt.Sprintf("%v", row[col])
		}
		key := strings.Join(parts, "||")

		if g, ok := groupMap[key]; ok {
			g.rows = append(g.rows, row)
		} else {
			groupMap[key] = &rowGroup{key: key, rows: []map[string]interface{}{row}}
			keys = append(keys, key)
		}
	}

	// Maintain insertion order
	result := make([]rowGroup, 0, len(keys))
	for _, k := range keys {
		result = append(result, *groupMap[k])
	}
	return result
}

func computeAgg(fn, column string, rows []map[string]interface{}) interface{} {
	switch fn {
	case "count":
		return len(rows)
	case "sum":
		var sum float64
		for _, row := range rows {
			v, _ := toFloat64(row[column])
			sum += v
		}
		return sum
	case "avg":
		if len(rows) == 0 {
			return 0.0
		}
		var sum float64
		for _, row := range rows {
			v, _ := toFloat64(row[column])
			sum += v
		}
		return sum / float64(len(rows))
	case "min":
		if len(rows) == 0 {
			return nil
		}
		minVal := math.MaxFloat64
		for _, row := range rows {
			v, _ := toFloat64(row[column])
			if v < minVal {
				minVal = v
			}
		}
		return minVal
	case "max":
		if len(rows) == 0 {
			return nil
		}
		maxVal := -math.MaxFloat64
		for _, row := range rows {
			v, _ := toFloat64(row[column])
			if v > maxVal {
				maxVal = v
			}
		}
		return maxVal
	case "distinct_count":
		seen := map[string]bool{}
		for _, row := range rows {
			seen[fmt.Sprintf("%v", row[column])] = true
		}
		return len(seen)
	case "values":
		vals := make([]interface{}, 0, len(rows))
		for _, row := range rows {
			vals = append(vals, row[column])
		}
		return vals
	default:
		return nil
	}
}

func toRowSlice(data interface{}) ([]map[string]interface{}, bool) {
	switch v := data.(type) {
	case []map[string]interface{}:
		return v, true
	case []interface{}:
		rows := make([]map[string]interface{}, 0, len(v))
		for _, item := range v {
			if row, ok := item.(map[string]interface{}); ok {
				rows = append(rows, row)
			}
		}
		return rows, len(rows) > 0
	default:
		return nil, false
	}
}
