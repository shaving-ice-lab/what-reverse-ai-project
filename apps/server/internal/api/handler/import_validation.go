package handler

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/xeipuuv/gojsonschema"
)

const appSchemaImportSchema = `{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "ui_schema": { "type": "object" },
    "db_schema": { "type": "object" },
    "config_json": { "type": "object" },
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
