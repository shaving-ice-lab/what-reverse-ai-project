package executor

import (
	"context"
	"fmt"
)

// NodeTypePageRender 页面渲染节点
const NodeTypePageRender NodeType = "page_render"

// PageRenderExecutor 定义一个页面的渲染逻辑（关联 UI Schema 页面 + 数据源查询）
type PageRenderExecutor struct{}

func NewPageRenderExecutor() *PageRenderExecutor {
	return &PageRenderExecutor{}
}

func (e *PageRenderExecutor) GetType() NodeType {
	return NodeTypePageRender
}

func (e *PageRenderExecutor) Execute(ctx context.Context, node *NodeDefinition, inputs map[string]interface{}, execCtx *ExecutionContext) (*NodeResult, error) {
	// Config:
	//   page_id: string — 页面标识
	//   title: string — 页面标题
	//   layout: string — 布局类型（dashboard / table / form / detail / custom）
	//   components: [{type, data_key, config}] — 页面组件列表
	//     type: data_table / chart / stats_card / form / detail_view / list / custom
	//     data_key: string — 从 inputs 中获取数据的 key
	//     config: {} — 组件配置

	pageID := getString(node.Config, "page_id")
	if pageID == "" {
		pageID = node.ID
	}
	title := getString(node.Config, "title")
	if title == "" {
		title = "Page"
	}
	layout := getString(node.Config, "layout")
	if layout == "" {
		layout = "dashboard"
	}

	// Build component data by binding inputs to component definitions
	componentsRaw, _ := node.Config["components"].([]interface{})
	renderedComponents := make([]map[string]interface{}, 0, len(componentsRaw))

	for i, compRaw := range componentsRaw {
		comp, ok := compRaw.(map[string]interface{})
		if !ok {
			continue
		}

		compType := getString(comp, "type")
		dataKey := getString(comp, "data_key")
		compConfig, _ := comp["config"].(map[string]interface{})
		if compConfig == nil {
			compConfig = map[string]interface{}{}
		}

		// Resolve data from inputs
		var data interface{}
		if dataKey != "" {
			data = inputs[dataKey]
		}
		// Fallback: try common keys
		if data == nil {
			if rows, ok := inputs["rows"]; ok {
				data = rows
			} else if output, ok := inputs["output"]; ok {
				data = output
			}
		}

		rendered := map[string]interface{}{
			"id":     fmt.Sprintf("%s_comp_%d", pageID, i),
			"type":   compType,
			"config": compConfig,
			"data":   data,
		}
		if label := getString(comp, "label"); label != "" {
			rendered["label"] = label
		}

		renderedComponents = append(renderedComponents, rendered)
	}

	// Build UI Schema output
	uiSchema := map[string]interface{}{
		"page_id":    pageID,
		"title":      title,
		"layout":     layout,
		"components": renderedComponents,
	}

	outputs := map[string]interface{}{
		"ui_schema":  uiSchema,
		"page_id":    pageID,
		"title":      title,
		"layout":     layout,
		"components": renderedComponents,
		"output":     uiSchema,
		"result":     uiSchema,
	}

	return &NodeResult{
		NodeID:  node.ID,
		Status:  NodeStatusCompleted,
		Outputs: outputs,
	}, nil
}
