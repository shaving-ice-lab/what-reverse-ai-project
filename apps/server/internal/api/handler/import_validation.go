package handler

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/xeipuuv/gojsonschema"
)

const workflowImportSchema = `{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["workflow"],
  "properties": {
    "workflow": {
      "type": "object",
      "required": ["name"],
      "properties": {
        "name": { "type": "string", "minLength": 1 },
        "description": { "type": ["string", "null"] },
        "icon": { "type": "string" },
        "definition": {
          "type": "object",
          "required": ["nodes", "edges"],
          "properties": {
            "nodes": {
              "type": "array",
              "items": {
                "type": "object",
                "required": ["id"],
                "properties": {
                  "id": { "type": "string", "minLength": 1 }
                }
              }
            },
            "edges": {
              "type": "array",
              "items": {
                "type": "object",
                "required": ["source", "target"],
                "properties": {
                  "source": { "type": "string", "minLength": 1 },
                  "target": { "type": "string", "minLength": 1 }
                }
              }
            }
          }
        },
        "variables": { "type": "object" },
        "trigger_type": { "type": "string" },
        "trigger_config": { "type": "object" },
        "nodes": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["id"],
            "properties": {
              "id": { "type": "string", "minLength": 1 }
            }
          }
        },
        "edges": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["source", "target"],
            "properties": {
              "source": { "type": "string", "minLength": 1 },
              "target": { "type": "string", "minLength": 1 }
            }
          }
        }
      },
      "anyOf": [
        { "required": ["definition"] },
        { "required": ["nodes", "edges"] }
      ]
    },
    "folder_id": { "type": ["string", "null"] }
  }
}`

const appSchemaImportSchema = `{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "ui_schema": { "type": "object" },
    "db_schema": { "type": "object" },
    "config_json": { "type": "object" },
    "workflow_id": { "type": "string" },
    "source": { "type": "string" },
    "changelog": { "type": "string" }
  },
  "anyOf": [
    { "required": ["ui_schema"] },
    { "required": ["db_schema"] },
    { "required": ["config_json"] }
  ]
}`

func validateJSONSchemaPayload(payload interface{}, schema string) error {
	raw, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	schemaLoader := gojsonschema.NewStringLoader(schema)
	documentLoader := gojsonschema.NewBytesLoader(raw)
	result, err := gojsonschema.Validate(schemaLoader, documentLoader)
	if err != nil {
		return err
	}
	if result.Valid() {
		return nil
	}

	errs := make([]string, 0, len(result.Errors()))
	for _, e := range result.Errors() {
		errs = append(errs, e.String())
	}
	return fmt.Errorf("JSON Schema 校验失败: %s", strings.Join(errs, "; "))
}
