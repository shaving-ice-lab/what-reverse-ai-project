package service

import (
	"fmt"
	"sort"
	"strconv"
	"strings"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/pkg/uischema"
)

func buildUISchemaFromWorkflow(definition entity.JSON) (entity.JSON, bool) {
	nodes := coerceNodeList(definition["nodes"])
	if len(nodes) == 0 {
		return nil, false
	}

	inputBlocks := make([]map[string]interface{}, 0)
	seenKeys := make(map[string]struct{})
	var triggerNode map[string]interface{}

	for _, node := range nodes {
		nodeType := strings.ToLower(strings.TrimSpace(getString(node["type"])))
		switch nodeType {
		case "start":
			if triggerNode == nil {
				triggerNode = node
			}
			inputBlocks = append(inputBlocks, buildInputBlocksFromStartNode(node, seenKeys)...)
		case "input":
			if block := buildInputBlockFromInputNode(node, seenKeys); block != nil {
				inputBlocks = append(inputBlocks, block)
			}
		}
	}

	if len(inputBlocks) == 0 {
		return nil, false
	}

	formID := "form"
	if triggerNode != nil {
		if value := strings.TrimSpace(getNodeStringValue(triggerNode, "form_id", "formId")); value != "" {
			formID = value
		}
	}
	submitAction := buildSubmitAction(triggerNode)

	schema := entity.JSON{
		"schema_version": uischema.CurrentSchemaVersion,
		"layout": map[string]interface{}{
			"type": "single_column",
		},
		"blocks": []map[string]interface{}{
			{
				"id":       formID,
				"type":     "form",
				"label":    "App 表单",
				"children": inputBlocks,
			},
		},
		"actions": []map[string]interface{}{
			submitAction,
		},
		"result_view": map[string]interface{}{
			"type": "markdown",
			"props": map[string]interface{}{
				"content": "### 运行结果\n\n{{output}}",
			},
		},
	}

	return schema, true
}

func buildOutputSchemaFromWorkflow(definition entity.JSON) map[string]interface{} {
	nodes := coerceNodeList(definition["nodes"])
	if len(nodes) == 0 {
		return nil
	}

	items := make([]map[string]interface{}, 0)
	seen := make(map[string]struct{})

	for _, node := range nodes {
		if strings.ToLower(strings.TrimSpace(getString(node["type"]))) != "output" {
			continue
		}
		nodeID := strings.TrimSpace(getString(node["id"]))
		if nodeID == "" {
			continue
		}
		config := getNodeConfig(node)
		label := getNodeLabel(node)
		outputType := getString(config["outputType"])
		if outputType == "" {
			outputType = "text"
		}
		title := getString(config["title"])
		if title == "" {
			title = label
		}
		key := "output:" + nodeID
		if _, exists := seen[key]; exists {
			continue
		}
		seen[key] = struct{}{}
		item := map[string]interface{}{
			"node_id": nodeID,
			"label":   label,
			"title":   title,
			"type":    outputType,
		}
		if template := getString(config["template"]); template != "" {
			item["template"] = template
		}
		items = append(items, item)
	}

	if len(items) == 0 {
		for _, node := range nodes {
			if strings.ToLower(strings.TrimSpace(getString(node["type"]))) != "end" {
				continue
			}
			nodeID := strings.TrimSpace(getString(node["id"]))
			outputs := coerceMapSlice(getNodeData(node)["outputs"])
			for _, output := range outputs {
				outputID := strings.TrimSpace(getString(output["id"]))
				label := strings.TrimSpace(getString(output["label"]))
				source := strings.TrimSpace(getString(output["source"]))
				key := "end:" + nodeID + ":" + outputID
				if _, exists := seen[key]; exists {
					continue
				}
				seen[key] = struct{}{}
				item := map[string]interface{}{
					"node_id": nodeID,
					"id":      outputID,
					"label":   label,
					"source":  source,
				}
				if outputType := getString(output["type"]); outputType != "" {
					item["type"] = outputType
				}
				items = append(items, item)
			}
		}
	}

	if len(items) == 0 {
		return nil
	}

	return map[string]interface{}{
		"version": "1.0",
		"items":   items,
	}
}

func buildInputMappingWarnings(uiSchema entity.JSON, workflowDefinition entity.JSON) map[string]interface{} {
	if len(uiSchema) == 0 || len(workflowDefinition) == 0 {
		return nil
	}
	schema, err := uischema.Normalize(uiSchema)
	if err != nil || schema == nil {
		return nil
	}

	mappings := uischema.CollectInputMappings(schema)
	if len(mappings) == 0 {
		return nil
	}

	workflowKeys := collectWorkflowInputKeys(workflowDefinition)
	workflowSet := make(map[string]struct{}, len(workflowKeys))
	for _, key := range workflowKeys {
		workflowSet[key] = struct{}{}
	}

	targetCounts := make(map[string]int)
	mappingItems := make([]map[string]interface{}, 0, len(mappings))
	for _, mapping := range mappings {
		target := strings.TrimSpace(mapping.TargetKey)
		if target == "" {
			continue
		}
		targetCounts[target]++
		item := map[string]interface{}{
			"ui_key":     mapping.UIKey,
			"target_key": target,
		}
		if mapping.Type != "" {
			item["type"] = mapping.Type
		}
		mappingItems = append(mappingItems, item)
	}
	if len(mappingItems) == 0 {
		return nil
	}

	missingInWorkflow := make([]string, 0)
	for target := range targetCounts {
		if _, ok := workflowSet[target]; !ok {
			missingInWorkflow = append(missingInWorkflow, target)
		}
	}
	missingInSchema := make([]string, 0)
	for key := range workflowSet {
		if _, ok := targetCounts[key]; !ok {
			missingInSchema = append(missingInSchema, key)
		}
	}

	duplicateTargets := make([]string, 0)
	for target, count := range targetCounts {
		if count > 1 {
			duplicateTargets = append(duplicateTargets, target)
		}
	}

	if len(missingInWorkflow) == 0 && len(missingInSchema) == 0 && len(duplicateTargets) == 0 {
		return nil
	}

	sort.Strings(missingInWorkflow)
	sort.Strings(missingInSchema)
	sort.Strings(duplicateTargets)

	result := map[string]interface{}{
		"mappings": mappingItems,
	}
	if len(missingInWorkflow) > 0 {
		result["missing_in_workflow"] = missingInWorkflow
	}
	if len(missingInSchema) > 0 {
		result["missing_in_schema"] = missingInSchema
	}
	if len(duplicateTargets) > 0 {
		result["duplicate_targets"] = duplicateTargets
	}

	return result
}

func collectWorkflowInputKeys(definition entity.JSON) []string {
	nodes := coerceNodeList(definition["nodes"])
	if len(nodes) == 0 {
		return nil
	}

	seen := make(map[string]struct{})
	keys := make([]string, 0)
	for _, node := range nodes {
		nodeType := strings.ToLower(strings.TrimSpace(getString(node["type"])))
		switch nodeType {
		case "start":
			blocks := buildInputBlocksFromStartNode(node, seen)
			for _, block := range blocks {
				key := strings.TrimSpace(getString(block["input_key"]))
				if key == "" {
					key = strings.TrimSpace(getString(block["id"]))
				}
				if key == "" {
					continue
				}
				keys = append(keys, key)
			}
		case "input":
			if block := buildInputBlockFromInputNode(node, seen); block != nil {
				key := strings.TrimSpace(getString(block["input_key"]))
				if key == "" {
					key = strings.TrimSpace(getString(block["id"]))
				}
				if key == "" {
					continue
				}
				keys = append(keys, key)
			}
		}
	}

	return keys
}

func buildInputBlocksFromStartNode(node map[string]interface{}, seenKeys map[string]struct{}) []map[string]interface{} {
	data := getNodeData(node)
	inputs := coerceMapSlice(data["inputs"])
	if len(inputs) == 0 {
		return nil
	}

	blocks := make([]map[string]interface{}, 0, len(inputs))
	for _, input := range inputs {
		inputKey := strings.TrimSpace(getString(input["id"]))
		if inputKey == "" {
			inputKey = strings.TrimSpace(getString(input["name"]))
		}
		if inputKey == "" {
			continue
		}
		if _, exists := seenKeys[inputKey]; exists {
			continue
		}
		seenKeys[inputKey] = struct{}{}

		label := strings.TrimSpace(getString(input["label"]))
		inputType := strings.TrimSpace(getString(input["type"]))
		blockType := normalizeInputBlockType(inputType)
		props := map[string]interface{}{}
		validation := map[string]interface{}{}
		if rules, ok := input["validation"].(map[string]interface{}); ok {
			for key, value := range rules {
				validation[key] = value
			}
		}

		if placeholder := strings.TrimSpace(getString(input["placeholder"])); placeholder != "" {
			props["placeholder"] = placeholder
		}
		if defaultValue, ok := input["default"]; ok && defaultValue != nil {
			props["default"] = defaultValue
		}
		if defaultValue, ok := input["defaultValue"]; ok && defaultValue != nil {
			props["default"] = defaultValue
		}

		if inputType != "" {
			props["type"] = inputType
		}

		if required, ok := toBoolValue(input["required"]); ok && required {
			validation["required"] = true
		}
		if min, ok := toFloatValue(input["min"]); ok {
			validation["min"] = min
		}
		if max, ok := toFloatValue(input["max"]); ok {
			validation["max"] = max
		}
		if pattern := strings.TrimSpace(getString(input["pattern"])); pattern != "" {
			validation["pattern"] = pattern
		}

		if options, enum := normalizeOptions(input["options"]); len(options) > 0 {
			props["options"] = options
			if len(enum) > 0 {
				validation["enum"] = enum
			}
		}

		block := map[string]interface{}{
			"id":        inputKey,
			"type":      blockType,
			"label":     label,
			"input_key": inputKey,
		}
		applyOptionalMap(block, "props", props)
		applyOptionalMap(block, "validation", validation)
		blocks = append(blocks, block)
	}

	return blocks
}

func buildInputBlockFromInputNode(node map[string]interface{}, seenKeys map[string]struct{}) map[string]interface{} {
	config := getNodeConfig(node)
	inputKey := strings.TrimSpace(getString(config["name"]))
	if inputKey == "" {
		inputKey = strings.TrimSpace(getString(config["input_key"]))
	}
	if inputKey == "" {
		inputKey = strings.TrimSpace(getString(node["id"]))
	}
	if inputKey == "" {
		return nil
	}
	if _, exists := seenKeys[inputKey]; exists {
		return nil
	}
	seenKeys[inputKey] = struct{}{}

	label := strings.TrimSpace(getString(config["label"]))
	if label == "" {
		label = getNodeLabel(node)
	}
	inputType := strings.TrimSpace(getString(config["inputType"]))
	if inputType == "" {
		inputType = strings.TrimSpace(getString(config["type"]))
	}
	blockType := normalizeInputBlockType(inputType)

	props := map[string]interface{}{}
	validation := map[string]interface{}{}

	if inputType != "" {
		props["type"] = inputType
	}
	if placeholder := strings.TrimSpace(getString(config["placeholder"])); placeholder != "" {
		props["placeholder"] = placeholder
	}
	if defaultValue, ok := config["defaultValue"]; ok && defaultValue != nil {
		props["default"] = defaultValue
	}
	if rules, ok := config["validation"].(map[string]interface{}); ok {
		for key, value := range rules {
			validation[key] = value
		}
		if min, ok := toFloatValue(rules["min"]); ok {
			validation["min"] = min
		}
		if max, ok := toFloatValue(rules["max"]); ok {
			validation["max"] = max
		}
		if pattern := strings.TrimSpace(getString(rules["pattern"])); pattern != "" {
			validation["pattern"] = pattern
		}
	}
	if required, ok := toBoolValue(config["required"]); ok && required {
		validation["required"] = true
	}

	if options, enum := normalizeOptions(config["options"]); len(options) > 0 {
		props["options"] = options
		if len(enum) > 0 {
			validation["enum"] = enum
		}
	}

	block := map[string]interface{}{
		"id":        inputKey,
		"type":      blockType,
		"label":     label,
		"input_key": inputKey,
	}
	applyOptionalMap(block, "props", props)
	applyOptionalMap(block, "validation", validation)
	return block
}

func normalizeInputBlockType(inputType string) string {
	switch strings.ToLower(strings.TrimSpace(inputType)) {
	case "select", "dropdown":
		return "select"
	default:
		return "input"
	}
}

func normalizeOptions(raw interface{}) ([]interface{}, []interface{}) {
	switch value := raw.(type) {
	case []interface{}:
		options := make([]interface{}, 0, len(value))
		enum := make([]interface{}, 0, len(value))
		for _, item := range value {
			switch opt := item.(type) {
			case map[string]interface{}:
				label := getString(opt["label"])
				val := opt["value"]
				if val == nil {
					val = label
				}
				options = append(options, map[string]interface{}{
					"label": label,
					"value": val,
				})
				enum = append(enum, val)
			default:
				strValue := strings.TrimSpace(getString(opt))
				if strValue == "" && opt != nil {
					strValue = strings.TrimSpace(getString(opt))
				}
				if strValue != "" {
					options = append(options, map[string]interface{}{
						"label": strValue,
						"value": strValue,
					})
					enum = append(enum, strValue)
				}
			}
		}
		return options, enum
	case []string:
		options := make([]interface{}, 0, len(value))
		enum := make([]interface{}, 0, len(value))
		for _, item := range value {
			trimmed := strings.TrimSpace(item)
			if trimmed == "" {
				continue
			}
			options = append(options, map[string]interface{}{
				"label": trimmed,
				"value": trimmed,
			})
			enum = append(enum, trimmed)
		}
		return options, enum
	default:
		return nil, nil
	}
}

func getNodeLabel(node map[string]interface{}) string {
	if label := strings.TrimSpace(getString(node["label"])); label != "" {
		return label
	}
	data := getNodeData(node)
	return strings.TrimSpace(getString(data["label"]))
}

func getNodeData(node map[string]interface{}) map[string]interface{} {
	if node == nil {
		return nil
	}
	if data, ok := node["data"].(map[string]interface{}); ok {
		return data
	}
	return nil
}

func getNodeConfig(node map[string]interface{}) map[string]interface{} {
	if node == nil {
		return nil
	}
	if config, ok := node["config"].(map[string]interface{}); ok {
		return config
	}
	if data, ok := node["data"].(map[string]interface{}); ok {
		if config, ok := data["config"].(map[string]interface{}); ok {
			return config
		}
	}
	return nil
}

func getNodeValue(node map[string]interface{}, keys ...string) interface{} {
	if node == nil {
		return nil
	}
	for _, key := range keys {
		if val, ok := node[key]; ok && val != nil {
			return val
		}
		if data := getNodeData(node); data != nil {
			if val, ok := data[key]; ok && val != nil {
				return val
			}
		}
		if config := getNodeConfig(node); config != nil {
			if val, ok := config[key]; ok && val != nil {
				return val
			}
		}
	}
	return nil
}

func getNodeStringValue(node map[string]interface{}, keys ...string) string {
	for _, key := range keys {
		if val := strings.TrimSpace(getString(getNodeValue(node, key))); val != "" {
			return val
		}
	}
	return ""
}

func buildSubmitAction(node map[string]interface{}) map[string]interface{} {
	action := map[string]interface{}{
		"id":    "submit",
		"type":  "submit",
		"label": "运行",
	}
	if node == nil {
		return action
	}
	raw := getNodeValue(node, "submit_action", "submitAction")
	switch typed := raw.(type) {
	case map[string]interface{}:
		if value := strings.TrimSpace(getString(typed["id"])); value != "" {
			action["id"] = value
		}
		if value := strings.TrimSpace(getString(typed["type"])); value != "" {
			action["type"] = value
		}
		if value := strings.TrimSpace(getString(typed["label"])); value != "" {
			action["label"] = value
		}
	case string:
		if value := strings.TrimSpace(typed); value != "" {
			action["label"] = value
		}
	}
	return action
}

func coerceNodeList(raw interface{}) []map[string]interface{} {
	return coerceMapSlice(raw)
}

func coerceMapSlice(raw interface{}) []map[string]interface{} {
	switch value := raw.(type) {
	case []map[string]interface{}:
		return value
	case []interface{}:
		items := make([]map[string]interface{}, 0, len(value))
		for _, item := range value {
			if mapped, ok := item.(map[string]interface{}); ok {
				items = append(items, mapped)
			}
		}
		return items
	default:
		return nil
	}
}

func applyOptionalMap(target map[string]interface{}, key string, value map[string]interface{}) {
	if len(value) == 0 {
		return
	}
	target[key] = value
}

func getString(raw interface{}) string {
	switch value := raw.(type) {
	case nil:
		return ""
	case string:
		return value
	case []byte:
		return string(value)
	case fmt.Stringer:
		return value.String()
	default:
		return strings.TrimSpace(fmt.Sprintf("%v", value))
	}
}

func toBoolValue(value interface{}) (bool, bool) {
	switch v := value.(type) {
	case bool:
		return v, true
	case string:
		trimmed := strings.ToLower(strings.TrimSpace(v))
		if trimmed == "true" || trimmed == "1" || trimmed == "yes" {
			return true, true
		}
		if trimmed == "false" || trimmed == "0" || trimmed == "no" {
			return false, true
		}
		return false, false
	default:
		return false, false
	}
}

func toFloatValue(value interface{}) (float64, bool) {
	switch v := value.(type) {
	case float64:
		return v, true
	case float32:
		return float64(v), true
	case int:
		return float64(v), true
	case int64:
		return float64(v), true
	case string:
		parsed, err := strconv.ParseFloat(strings.TrimSpace(v), 64)
		if err != nil {
			return 0, false
		}
		return parsed, true
	default:
		return 0, false
	}
}
