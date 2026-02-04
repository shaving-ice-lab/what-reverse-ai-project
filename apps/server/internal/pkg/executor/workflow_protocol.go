package executor

import (
	"encoding/json"
	"strings"
)

// normalizeWorkflowDefinitionJSON aligns workflow nodes with protocol fields.
func normalizeWorkflowDefinitionJSON(raw []byte) ([]byte, error) {
	var payload map[string]interface{}
	if err := json.Unmarshal(raw, &payload); err != nil {
		return nil, err
	}
	normalizeWorkflowDefinitionMap(payload)
	return json.Marshal(payload)
}

// normalizeWorkflowDefinitionMap mutates payload in-place.
func normalizeWorkflowDefinitionMap(payload map[string]interface{}) {
	nodes := coerceMapSlice(payload["nodes"])
	if len(nodes) == 0 {
		return
	}
	for _, node := range nodes {
		normalizeNodeMap(node)
	}
}

func normalizeNodeMap(node map[string]interface{}) {
	if node == nil {
		return
	}

	data := mapFrom(node["data"])
	if data != nil {
		if node["label"] == nil && data["label"] != nil {
			node["label"] = data["label"]
		}
		if node["config"] == nil && data["config"] != nil {
			node["config"] = data["config"]
		}
		if node["inputs"] == nil && data["inputs"] != nil {
			node["inputs"] = data["inputs"]
		}
		if node["outputs"] == nil && data["outputs"] != nil {
			node["outputs"] = data["outputs"]
		}
	}

	config := mapFrom(node["config"])
	if config == nil && data != nil {
		config = mapFrom(data["config"])
		if config != nil {
			node["config"] = config
		}
	}
	if config != nil {
		normalizeConfigAliases(config)
		normalizeDBOperation(strings.ToLower(strings.TrimSpace(getString(node, "type"))), config)
	}
}

func normalizeConfigAliases(config map[string]interface{}) {
	if config == nil {
		return
	}
	if _, ok := config["maxTokens"]; !ok {
		if val, ok := config["max_tokens"]; ok {
			config["maxTokens"] = val
		}
	}
	if _, ok := config["outputSchema"]; !ok {
		if val, ok := config["output_schema"]; ok {
			config["outputSchema"] = val
		}
	}
	if _, ok := config["formId"]; !ok {
		if val, ok := config["form_id"]; ok {
			config["formId"] = val
		}
	}
	if _, ok := config["submitAction"]; !ok {
		if val, ok := config["submit_action"]; ok {
			config["submitAction"] = val
		}
	}
}

func normalizeDBOperation(nodeType string, config map[string]interface{}) {
	if config == nil {
		return
	}
	if _, ok := config["operation"]; ok {
		return
	}
	switch nodeType {
	case "db_select":
		config["operation"] = "select"
	case "db_insert":
		config["operation"] = "insert"
	case "db_update":
		config["operation"] = "update"
	case "db_delete":
		config["operation"] = "delete"
	case "db_migrate":
		config["operation"] = "migrate"
	}
}

func mapFrom(value interface{}) map[string]interface{} {
	if value == nil {
		return nil
	}
	if mapped, ok := value.(map[string]interface{}); ok {
		return mapped
	}
	return nil
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
