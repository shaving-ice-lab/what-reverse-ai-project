package agent_tools

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/google/uuid"

	"github.com/reverseai/server/internal/service"
	"github.com/reverseai/server/internal/vmruntime"
)

type AttemptCompletionTool struct {
	workspaceService service.WorkspaceService
	vmStore          *vmruntime.VMStore
}

func NewAttemptCompletionTool(workspaceService service.WorkspaceService, vmStore *vmruntime.VMStore) *AttemptCompletionTool {
	return &AttemptCompletionTool{workspaceService: workspaceService, vmStore: vmStore}
}

func (t *AttemptCompletionTool) Name() string { return "attempt_completion" }

func (t *AttemptCompletionTool) Description() string {
	return "Validate and present the final result of your work. Call this when you believe all tasks are complete. The tool validates: 1) UI schema exists and is valid, 2) all table references point to existing tables, 3) navigation consistency, 4) no empty pages. If validation fails, you will receive specific error details to fix. You MUST call this before providing your final answer."
}

func (t *AttemptCompletionTool) Parameters() json.RawMessage {
	return json.RawMessage(`{
		"type": "object",
		"properties": {
			"workspace_id": {"type": "string", "description": "Workspace ID"},
			"user_id": {"type": "string", "description": "User ID"},
			"summary": {"type": "string", "description": "Brief summary of what was accomplished (shown to user)"}
		},
		"required": ["workspace_id", "user_id", "summary"]
	}`)
}

func (t *AttemptCompletionTool) RequiresConfirmation() bool { return false }

type attemptCompletionParams struct {
	WorkspaceID string `json:"workspace_id"`
	UserID      string `json:"user_id"`
	Summary     string `json:"summary"`
}

func (t *AttemptCompletionTool) Execute(ctx context.Context, params json.RawMessage) (*service.AgentToolResult, error) {
	var p attemptCompletionParams
	if err := json.Unmarshal(params, &p); err != nil {
		return &service.AgentToolResult{Success: false, Error: "invalid parameters: " + err.Error()}, nil
	}

	wsID, err := uuid.Parse(p.WorkspaceID)
	if err != nil {
		return &service.AgentToolResult{Success: false, Error: "invalid workspace_id"}, nil
	}
	userID, err := uuid.Parse(p.UserID)
	if err != nil {
		return &service.AgentToolResult{Success: false, Error: "invalid user_id"}, nil
	}

	var issues []string

	// 1. Check UI Schema exists
	versions, _, err := t.workspaceService.ListVersions(ctx, wsID, userID, 1, 1)
	if err != nil {
		return &service.AgentToolResult{Success: false, Error: fmt.Sprintf("failed to get versions: %v", err)}, nil
	}

	if len(versions) == 0 || versions[0].UISchema == nil || len(versions[0].UISchema) == 0 {
		issues = append(issues, "NO_UI_SCHEMA: No UI schema found. Call generate_ui_schema to create one.")
		return &service.AgentToolResult{
			Success: false,
			Error:   "Validation failed with 1 issue",
			Output:  formatIssues(issues),
		}, nil
	}

	schema := versions[0].UISchema

	// 2. Check pages exist
	pages, _ := schema["pages"].([]interface{})
	if len(pages) == 0 {
		issues = append(issues, "NO_PAGES: UI schema has no pages. Add at least one page.")
	}

	// 3. Collect all table references from blocks (recursively, including tabs_container)
	tableRefs := make(map[string]bool)
	pageIDs := make(map[string]bool)
	emptyPages := []string{}

	// collectTableRefs recursively extracts table references from blocks
	var collectTableRefs func(blocks []interface{})
	collectTableRefs = func(blocks []interface{}) {
		for _, b := range blocks {
			block, ok := b.(map[string]interface{})
			if !ok {
				continue
			}
			// Check data_source.table
			if ds, ok := block["data_source"].(map[string]interface{}); ok {
				if table, ok := ds["table"].(string); ok && table != "" {
					tableRefs[table] = true
				}
			}
			// Check config.table_name
			if cfg, ok := block["config"].(map[string]interface{}); ok {
				if table, ok := cfg["table_name"].(string); ok && table != "" {
					tableRefs[table] = true
				}
				// Recurse into tabs_container nested blocks
				if tabs, ok := cfg["tabs"].([]interface{}); ok {
					for _, tab := range tabs {
						tabObj, ok := tab.(map[string]interface{})
						if !ok {
							continue
						}
						if nestedBlocks, ok := tabObj["blocks"].([]interface{}); ok {
							collectTableRefs(nestedBlocks)
						}
					}
				}
			}
		}
	}

	for _, p := range pages {
		page, ok := p.(map[string]interface{})
		if !ok {
			continue
		}
		pid, _ := page["id"].(string)
		if pid != "" {
			pageIDs[pid] = true
		}

		blocks, _ := page["blocks"].([]interface{})
		if len(blocks) == 0 {
			title, _ := page["title"].(string)
			if title == "" {
				title = pid
			}
			emptyPages = append(emptyPages, title)
		}

		collectTableRefs(blocks)
	}

	// 4. Validate empty pages
	if len(emptyPages) > 0 {
		issues = append(issues, fmt.Sprintf("EMPTY_PAGES: Pages with no blocks: %s. Add blocks or remove these pages.", strings.Join(emptyPages, ", ")))
	}

	// 5. Check navigation consistency
	if nav, ok := schema["navigation"].(map[string]interface{}); ok {
		if items, ok := nav["items"].([]interface{}); ok {
			for _, item := range items {
				navItem, ok := item.(map[string]interface{})
				if !ok {
					continue
				}
				navPageID, _ := navItem["page_id"].(string)
				if navPageID != "" && !pageIDs[navPageID] {
					label, _ := navItem["label"].(string)
					issues = append(issues, fmt.Sprintf("NAV_ORPHAN: Navigation item %q references page_id=%q which does not exist in pages[].", label, navPageID))
				}
			}
		}
	}

	// 6. Check default_page exists
	if defaultPage, ok := schema["default_page"].(string); ok && defaultPage != "" {
		if !pageIDs[defaultPage] {
			issues = append(issues, fmt.Sprintf("INVALID_DEFAULT_PAGE: default_page=%q does not exist in pages[]. Set it to an existing page ID.", defaultPage))
		}
	}

	// 7. Validate table references against actual database
	var existingSet map[string]bool
	if len(tableRefs) > 0 {
		existingTables, err := t.vmStore.ListTables(ctx, p.WorkspaceID)
		if err == nil {
			existingSet = make(map[string]bool, len(existingTables))
			for _, tbl := range existingTables {
				existingSet[tbl.Name] = true
			}
			for ref := range tableRefs {
				if !existingSet[ref] {
					issues = append(issues, fmt.Sprintf("MISSING_TABLE: Block references table %q but it does not exist in the database. Create it with create_table first.", ref))
				}
			}
		}
	}

	// 8. Evidence requirements (Phase 4.2 — from Oh-My-OpenCode Sisyphus)
	// Check that tables referenced by UI actually have data (evidence of insert_data)
	if existingSet != nil {
		for ref := range tableRefs {
			if !existingSet[ref] {
				continue // already flagged as missing
			}
			result, qErr := t.vmStore.ExecuteSQL(ctx, p.WorkspaceID, fmt.Sprintf("SELECT COUNT(*) as cnt FROM \"%s\"", ref))
			if qErr == nil && result != nil && len(result.Rows) > 0 {
				row := result.Rows[0]
				cnt := 0
				if v, ok := row["cnt"]; ok {
					switch n := v.(type) {
					case float64:
						cnt = int(n)
					case int64:
						cnt = int(n)
					case int:
						cnt = n
					}
				}
				if cnt == 0 {
					issues = append(issues, fmt.Sprintf("EMPTY_TABLE: Table %q exists but has 0 rows. Insert sample data so the UI has something to display.", ref))
				}
			}
		}
	}

	// Return result
	if len(issues) > 0 {
		return &service.AgentToolResult{
			Success: false,
			Error:   fmt.Sprintf("Validation failed with %d issue(s). Fix these and call attempt_completion again.", len(issues)),
			Output:  formatIssues(issues),
		}, nil
	}

	// All checks passed
	pageCount := len(pages)
	tableCount := len(tableRefs)
	appName, _ := schema["app_name"].(string)
	if appName == "" {
		appName = "Application"
	}

	return &service.AgentToolResult{
		Success: true,
		Output: fmt.Sprintf("Validation passed. %s is ready with %d page(s) referencing %d table(s).\n\n%s",
			appName, pageCount, tableCount, p.Summary),
		Data: map[string]interface{}{
			"app_name":    appName,
			"page_count":  pageCount,
			"table_count": tableCount,
			"valid":       true,
		},
	}, nil
}

func formatIssues(issues []string) string {
	var sb strings.Builder
	sb.WriteString("Completion validation issues:\n")
	for i, issue := range issues {
		sb.WriteString(fmt.Sprintf("%d. %s\n", i+1, issue))
	}
	return sb.String()
}
