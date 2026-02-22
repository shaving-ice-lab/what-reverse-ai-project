package service

import (
	"encoding/json"
	"fmt"
	"strings"
)

// thinkHeuristic provides multi-step intent-based tool execution when no LLM API key is configured.
// It parses user intent from keywords and executes a planned sequence of operations,
// enabling the core demo scenario (e.g., "build a fleet management system") without an external LLM.
func (e *agentEngine) thinkHeuristic(messages []map[string]interface{}, tools []map[string]interface{}) (string, *toolAction, error) {
	if len(messages) == 0 {
		return "I need more information to help you.", nil, nil
	}

	// Find the latest user message and count completed tool calls
	userMsg := ""
	completedTools := []string{}
	for i := len(messages) - 1; i >= 0; i-- {
		if msgStr(messages[i], "role") == "user" && userMsg == "" {
			userMsg = msgStr(messages[i], "content")
		}
	}
	for _, m := range messages {
		if msgStr(m, "role") == "assistant" {
			content := msgStr(m, "content")
			for _, marker := range []string{"get_workspace_info", "create_table", "insert_data", "generate_ui_schema"} {
				if strings.Contains(content, marker) {
					completedTools = append(completedTools, marker)
				}
			}
		}
	}

	wsID := getFieldFromMessages(messages, "workspace_id")
	userID := getFieldFromMessages(messages, "user_id")
	msgLower := strings.ToLower(userMsg)

	// Determine the execution plan based on completed steps
	stepsDone := len(completedTools)

	// Step 0: Always gather workspace info first
	if stepsDone == 0 {
		argsJSON, _ := json.Marshal(map[string]interface{}{
			"workspace_id":   wsID,
			"user_id":        userID,
			"include_tables": true,
			"include_stats":  false,
		})
		return "Let me check your workspace's current state first.",
			&toolAction{ToolName: "get_workspace_info", ToolArgs: argsJSON}, nil
	}

	// Detect intent from keywords to determine table schemas
	tables := e.detectTablesFromIntent(msgLower)

	// If no tables detected, provide guidance
	if len(tables) == 0 {
		return fmt.Sprintf("I understand you want to build something related to: %q. "+
			"I can help you create database tables and generate UI. "+
			"Try describing your app more specifically, e.g., 'I want a fleet management system with vehicles, drivers, and trips'. "+
			"For full AI-powered generation, configure OPENAI_API_KEY or OLLAMA_HOST.", userMsg), nil, nil
	}

	// Step 1..N: Create tables one by one
	if stepsDone <= len(tables) {
		tableIdx := stepsDone - 1
		if tableIdx < len(tables) {
			table := tables[tableIdx]
			argsJSON, _ := json.Marshal(map[string]interface{}{
				"workspace_id": wsID,
				"user_id":      userID,
				"name":         table.Name,
				"columns":      table.Columns,
			})
			return fmt.Sprintf("Creating table %q with %d columns...", table.Name, len(table.Columns)),
				&toolAction{ToolName: "create_table", ToolArgs: argsJSON}, nil
		}
	}

	// Step N+1: Insert sample data for the first table
	sampleStep := len(tables) + 1
	if stepsDone == sampleStep {
		if len(tables) > 0 {
			sampleRows := e.generateSampleRows(tables[0])
			argsJSON, _ := json.Marshal(map[string]interface{}{
				"workspace_id": wsID,
				"user_id":      userID,
				"table":        tables[0].Name,
				"rows":         sampleRows,
			})
			return fmt.Sprintf("Inserting sample data into %q...", tables[0].Name),
				&toolAction{ToolName: "insert_data", ToolArgs: argsJSON}, nil
		}
	}

	// Step N+2: Generate UI Schema
	uiStep := len(tables) + 2
	if stepsDone == uiStep {
		pages := e.generateUIPages(tables, msgLower)
		appName := e.extractAppName(msgLower)
		// Build navigation items from pages
		navItems := make([]map[string]interface{}, 0, len(pages))
		defaultPage := ""
		for _, p := range pages {
			pid, _ := p["id"].(string)
			title, _ := p["title"].(string)
			icon, _ := p["icon"].(string)
			if defaultPage == "" {
				defaultPage = pid
			}
			navItems = append(navItems, map[string]interface{}{
				"page_id": pid,
				"label":   title,
				"icon":    icon,
			})
		}
		uiSchema := map[string]interface{}{
			"app_schema_version": "2.0.0",
			"app_name":           appName,
			"default_page":       defaultPage,
			"navigation": map[string]interface{}{
				"type":  "sidebar",
				"items": navItems,
			},
			"pages": pages,
		}
		argsJSON, _ := json.Marshal(map[string]interface{}{
			"workspace_id": wsID,
			"user_id":      userID,
			"ui_schema":    uiSchema,
		})
		return "Generating UI pages for your application...",
			&toolAction{ToolName: "generate_ui_schema", ToolArgs: argsJSON}, nil
	}

	// Final answer
	tableNames := make([]string, len(tables))
	for i, t := range tables {
		tableNames[i] = t.Name
	}
	return fmt.Sprintf("Your application has been created! Here's what was built:\n"+
		"- **%d database tables**: %s\n"+
		"- **Sample data** inserted into %q\n"+
		"- **UI pages** generated with dashboard and data management views\n\n"+
		"You can view the results in the **Preview** tab or manage data in the **Database** tab.",
		len(tables), strings.Join(tableNames, ", "), tables[0].Name), nil, nil
}

// heuristicTable represents a table schema for heuristic generation
type heuristicTable struct {
	Name    string                   `json:"name"`
	Columns []map[string]interface{} `json:"columns"`
}

// detectTablesFromIntent parses user message to determine what tables to create
func (e *agentEngine) detectTablesFromIntent(msg string) []heuristicTable {
	// Fleet/vehicle management
	if containsAnyKeyword(msg, []string{"fleet", "vehicle", "车队", "车辆", "fleet management", "车队管理"}) {
		return []heuristicTable{
			{Name: "vehicles", Columns: []map[string]interface{}{
				{"name": "id", "type": "BIGINT", "primary_key": true, "auto_increment": true},
				{"name": "plate_number", "type": "VARCHAR(20)", "not_null": true, "unique": true},
				{"name": "brand", "type": "VARCHAR(50)"},
				{"name": "model", "type": "VARCHAR(50)"},
				{"name": "year", "type": "INT"},
				{"name": "status", "type": "VARCHAR(20)", "default": "'active'"},
				{"name": "mileage", "type": "DECIMAL(10,2)", "default": "0"},
				{"name": "created_at", "type": "TIMESTAMP", "default": "CURRENT_TIMESTAMP"},
			}},
			{Name: "drivers", Columns: []map[string]interface{}{
				{"name": "id", "type": "BIGINT", "primary_key": true, "auto_increment": true},
				{"name": "name", "type": "VARCHAR(100)", "not_null": true},
				{"name": "phone", "type": "VARCHAR(20)"},
				{"name": "license_number", "type": "VARCHAR(50)", "unique": true},
				{"name": "status", "type": "VARCHAR(20)", "default": "'available'"},
				{"name": "created_at", "type": "TIMESTAMP", "default": "CURRENT_TIMESTAMP"},
			}},
			{Name: "trips", Columns: []map[string]interface{}{
				{"name": "id", "type": "BIGINT", "primary_key": true, "auto_increment": true},
				{"name": "vehicle_id", "type": "BIGINT", "not_null": true},
				{"name": "driver_id", "type": "BIGINT", "not_null": true},
				{"name": "origin", "type": "VARCHAR(200)"},
				{"name": "destination", "type": "VARCHAR(200)"},
				{"name": "distance_km", "type": "DECIMAL(10,2)"},
				{"name": "status", "type": "VARCHAR(20)", "default": "'planned'"},
				{"name": "started_at", "type": "TIMESTAMP"},
				{"name": "completed_at", "type": "TIMESTAMP"},
				{"name": "created_at", "type": "TIMESTAMP", "default": "CURRENT_TIMESTAMP"},
			}},
		}
	}

	// Customer/feedback management
	if containsAnyKeyword(msg, []string{"feedback", "customer", "反馈", "客户", "survey", "调查"}) {
		return []heuristicTable{
			{Name: "customers", Columns: []map[string]interface{}{
				{"name": "id", "type": "BIGINT", "primary_key": true, "auto_increment": true},
				{"name": "name", "type": "VARCHAR(100)", "not_null": true},
				{"name": "email", "type": "VARCHAR(100)", "unique": true},
				{"name": "phone", "type": "VARCHAR(20)"},
				{"name": "created_at", "type": "TIMESTAMP", "default": "CURRENT_TIMESTAMP"},
			}},
			{Name: "feedbacks", Columns: []map[string]interface{}{
				{"name": "id", "type": "BIGINT", "primary_key": true, "auto_increment": true},
				{"name": "customer_id", "type": "BIGINT"},
				{"name": "category", "type": "VARCHAR(50)"},
				{"name": "title", "type": "VARCHAR(200)", "not_null": true},
				{"name": "content", "type": "TEXT"},
				{"name": "rating", "type": "INT"},
				{"name": "status", "type": "VARCHAR(20)", "default": "'pending'"},
				{"name": "created_at", "type": "TIMESTAMP", "default": "CURRENT_TIMESTAMP"},
			}},
			{Name: "responses", Columns: []map[string]interface{}{
				{"name": "id", "type": "BIGINT", "primary_key": true, "auto_increment": true},
				{"name": "feedback_id", "type": "BIGINT", "not_null": true},
				{"name": "responder_name", "type": "VARCHAR(100)"},
				{"name": "content", "type": "TEXT"},
				{"name": "created_at", "type": "TIMESTAMP", "default": "CURRENT_TIMESTAMP"},
			}},
		}
	}

	// Order/inventory/product management
	if containsAnyKeyword(msg, []string{"order", "inventory", "product", "订单", "库存", "商品", "ecommerce", "电商", "shop", "商店"}) {
		return []heuristicTable{
			{Name: "products", Columns: []map[string]interface{}{
				{"name": "id", "type": "BIGINT", "primary_key": true, "auto_increment": true},
				{"name": "name", "type": "VARCHAR(200)", "not_null": true},
				{"name": "sku", "type": "VARCHAR(50)", "unique": true},
				{"name": "price", "type": "DECIMAL(10,2)", "not_null": true},
				{"name": "stock", "type": "INT", "default": "0"},
				{"name": "category", "type": "VARCHAR(50)"},
				{"name": "status", "type": "VARCHAR(20)", "default": "'active'"},
				{"name": "created_at", "type": "TIMESTAMP", "default": "CURRENT_TIMESTAMP"},
			}},
			{Name: "orders", Columns: []map[string]interface{}{
				{"name": "id", "type": "BIGINT", "primary_key": true, "auto_increment": true},
				{"name": "customer_name", "type": "VARCHAR(100)", "not_null": true},
				{"name": "customer_email", "type": "VARCHAR(100)"},
				{"name": "total_amount", "type": "DECIMAL(10,2)"},
				{"name": "status", "type": "VARCHAR(20)", "default": "'pending'"},
				{"name": "created_at", "type": "TIMESTAMP", "default": "CURRENT_TIMESTAMP"},
			}},
			{Name: "order_items", Columns: []map[string]interface{}{
				{"name": "id", "type": "BIGINT", "primary_key": true, "auto_increment": true},
				{"name": "order_id", "type": "BIGINT", "not_null": true},
				{"name": "product_id", "type": "BIGINT", "not_null": true},
				{"name": "quantity", "type": "INT", "not_null": true},
				{"name": "unit_price", "type": "DECIMAL(10,2)", "not_null": true},
			}},
		}
	}

	// Task/project management
	if containsAnyKeyword(msg, []string{"task", "project", "todo", "任务", "项目", "待办"}) {
		return []heuristicTable{
			{Name: "projects", Columns: []map[string]interface{}{
				{"name": "id", "type": "BIGINT", "primary_key": true, "auto_increment": true},
				{"name": "name", "type": "VARCHAR(200)", "not_null": true},
				{"name": "description", "type": "TEXT"},
				{"name": "status", "type": "VARCHAR(20)", "default": "'active'"},
				{"name": "start_date", "type": "DATE"},
				{"name": "end_date", "type": "DATE"},
				{"name": "created_at", "type": "TIMESTAMP", "default": "CURRENT_TIMESTAMP"},
			}},
			{Name: "tasks", Columns: []map[string]interface{}{
				{"name": "id", "type": "BIGINT", "primary_key": true, "auto_increment": true},
				{"name": "project_id", "type": "BIGINT", "not_null": true},
				{"name": "title", "type": "VARCHAR(200)", "not_null": true},
				{"name": "description", "type": "TEXT"},
				{"name": "assignee", "type": "VARCHAR(100)"},
				{"name": "priority", "type": "VARCHAR(20)", "default": "'medium'"},
				{"name": "status", "type": "VARCHAR(20)", "default": "'todo'"},
				{"name": "due_date", "type": "DATE"},
				{"name": "created_at", "type": "TIMESTAMP", "default": "CURRENT_TIMESTAMP"},
			}},
		}
	}

	// Generic CRUD — try to extract entity name from the message
	if containsAnyKeyword(msg, []string{"manage", "管理", "system", "系统", "app", "应用", "build", "create", "做", "建"}) {
		entityName := extractEntityName(msg)
		if entityName != "" {
			return []heuristicTable{
				{Name: entityName + "s", Columns: []map[string]interface{}{
					{"name": "id", "type": "BIGINT", "primary_key": true, "auto_increment": true},
					{"name": "name", "type": "VARCHAR(200)", "not_null": true},
					{"name": "description", "type": "TEXT"},
					{"name": "status", "type": "VARCHAR(20)", "default": "'active'"},
					{"name": "created_at", "type": "TIMESTAMP", "default": "CURRENT_TIMESTAMP"},
					{"name": "updated_at", "type": "TIMESTAMP", "default": "CURRENT_TIMESTAMP"},
				}},
			}
		}
	}

	return nil
}

// generateSampleRows creates sample data for a table
func (e *agentEngine) generateSampleRows(table heuristicTable) []map[string]interface{} {
	switch table.Name {
	case "vehicles":
		return []map[string]interface{}{
			{"plate_number": "京A12345", "brand": "Toyota", "model": "Camry", "year": 2023, "status": "active", "mileage": 15000},
			{"plate_number": "京B67890", "brand": "Honda", "model": "Civic", "year": 2022, "status": "active", "mileage": 28000},
			{"plate_number": "京C11111", "brand": "Ford", "model": "Transit", "year": 2024, "status": "maintenance", "mileage": 5000},
			{"plate_number": "沪A22222", "brand": "BYD", "model": "Tang", "year": 2024, "status": "active", "mileage": 3200},
			{"plate_number": "粤B33333", "brand": "Tesla", "model": "Model 3", "year": 2023, "status": "active", "mileage": 12000},
		}
	case "customers":
		return []map[string]interface{}{
			{"name": "Alice Wang", "email": "alice@example.com", "phone": "13800001111"},
			{"name": "Bob Li", "email": "bob@example.com", "phone": "13800002222"},
			{"name": "Carol Zhang", "email": "carol@example.com", "phone": "13800003333"},
		}
	case "products":
		return []map[string]interface{}{
			{"name": "Wireless Mouse", "sku": "WM-001", "price": 29.99, "stock": 150, "category": "Electronics"},
			{"name": "USB-C Cable", "sku": "UC-002", "price": 9.99, "stock": 500, "category": "Accessories"},
			{"name": "Mechanical Keyboard", "sku": "MK-003", "price": 89.99, "stock": 75, "category": "Electronics"},
		}
	case "projects":
		return []map[string]interface{}{
			{"name": "Website Redesign", "description": "Redesign the company website", "status": "active", "start_date": "2026-01-01", "end_date": "2026-03-31"},
			{"name": "Mobile App MVP", "description": "Build the first version of mobile app", "status": "active", "start_date": "2026-02-01", "end_date": "2026-06-30"},
		}
	default:
		return []map[string]interface{}{
			{"name": "Sample Item 1", "description": "First sample record", "status": "active"},
			{"name": "Sample Item 2", "description": "Second sample record", "status": "active"},
			{"name": "Sample Item 3", "description": "Third sample record", "status": "draft"},
		}
	}
}

// generateUIPages creates UI page definitions based on detected tables
func (e *agentEngine) generateUIPages(tables []heuristicTable, msg string) []map[string]interface{} {
	statsColors := []string{"blue", "green", "amber", "red"}
	statsIcons := []string{"Database", "Users", "Package", "Activity"}

	// Dashboard page with stats cards for each table
	statsBlocks := make([]map[string]interface{}, 0, len(tables))
	for i, t := range tables {
		statsBlocks = append(statsBlocks, map[string]interface{}{
			"id":   fmt.Sprintf("stat_%s", t.Name),
			"type": "stats_card",
			"config": map[string]interface{}{
				"label":     "Total " + toTitleCase(strings.ReplaceAll(t.Name, "_", " ")),
				"value_key": "count",
				"format":    "number",
				"color":     statsColors[i%len(statsColors)],
				"icon":      statsIcons[i%len(statsIcons)],
			},
			"data_source": map[string]interface{}{
				"table":       t.Name,
				"aggregation": []map[string]interface{}{{"function": "count", "column": "*", "alias": "count"}},
			},
		})
	}

	dashBlocks := make([]map[string]interface{}, 0, len(statsBlocks)+2)
	dashBlocks = append(dashBlocks, statsBlocks...)

	// Add a chart block for the first table with a numeric column
	for _, t := range tables {
		var nameCol, numCol string
		for _, col := range t.Columns {
			cn, _ := col["name"].(string)
			if cn == "" || cn == "id" {
				continue
			}
			colType := inferColumnDisplayType(cn, col)
			if nameCol == "" && (cn == "name" || cn == "title" || cn == "label" || cn == "category") {
				nameCol = cn
			}
			if numCol == "" && colType == "number" {
				numCol = cn
			}
		}
		if nameCol != "" && numCol != "" {
			dashBlocks = append(dashBlocks, map[string]interface{}{
				"id":   fmt.Sprintf("chart_%s", t.Name),
				"type": "chart",
				"config": map[string]interface{}{
					"title":      toTitleCase(strings.ReplaceAll(t.Name, "_", " ")) + " Overview",
					"chart_type": "bar",
					"x_key":      nameCol,
					"y_key":      numCol,
					"height":     200,
					"color":      "#6366f1",
				},
				"data_source": map[string]interface{}{
					"table": t.Name,
					"limit": 10,
				},
				"grid": map[string]interface{}{"col_span": 2},
			})
			break
		}
	}

	// Add a recent items list for the first table
	if len(tables) > 0 {
		t := tables[0]
		var titleKey string
		for _, col := range t.Columns {
			cn, _ := col["name"].(string)
			if cn == "name" || cn == "title" {
				titleKey = cn
				break
			}
		}
		if titleKey == "" && len(t.Columns) > 1 {
			cn, _ := t.Columns[1]["name"].(string)
			titleKey = cn
		}
		if titleKey != "" {
			dashBlocks = append(dashBlocks, map[string]interface{}{
				"id":    "recent_items",
				"type":  "list",
				"label": "Recent " + toTitleCase(strings.ReplaceAll(t.Name, "_", " ")),
				"config": map[string]interface{}{
					"table_name": t.Name,
					"title_key":  titleKey,
					"clickable":  true,
					"layout":     "list",
				},
				"data_source": map[string]interface{}{
					"table": t.Name,
					"limit": 5,
				},
				"grid": map[string]interface{}{"col_span": 2},
			})
		}
	}

	pages := []map[string]interface{}{
		{
			"id":     "dashboard",
			"title":  "Dashboard",
			"route":  "/dashboard",
			"icon":   "LayoutDashboard",
			"blocks": dashBlocks,
		},
	}

	// CRUD pages for each table
	tableIcons := []string{"FileText", "Users", "Package", "Truck", "ShoppingCart", "Star"}
	for i, t := range tables {
		// Build column configs from table columns with auto-inferred types
		columns := make([]map[string]interface{}, 0, len(t.Columns))
		for _, col := range t.Columns {
			colName, _ := col["name"].(string)
			if colName == "" {
				continue
			}
			colType := inferColumnDisplayType(colName, col)
			entry := map[string]interface{}{
				"key":   colName,
				"label": toTitleCase(strings.ReplaceAll(colName, "_", " ")),
			}
			if colType != "" {
				entry["type"] = colType
			}
			columns = append(columns, entry)
		}

		// Build form fields from non-auto columns
		formFields := make([]map[string]interface{}, 0)
		for _, col := range t.Columns {
			colName, _ := col["name"].(string)
			if colName == "" || colName == "id" || colName == "created_at" || colName == "updated_at" || colName == "deleted_at" {
				continue
			}
			colType := inferColumnDisplayType(colName, col)
			fieldType := "text"
			switch colType {
			case "number":
				fieldType = "number"
			case "boolean":
				fieldType = "checkbox"
			case "date":
				fieldType = "date"
			}
			formFields = append(formFields, map[string]interface{}{
				"name":     colName,
				"label":    toTitleCase(strings.ReplaceAll(colName, "_", " ")),
				"type":     fieldType,
				"required": colName == "name" || colName == "title" || colName == "email",
			})
		}

		// Determine search key
		searchKey := ""
		for _, col := range t.Columns {
			cn, _ := col["name"].(string)
			if cn == "name" || cn == "title" || cn == "email" || cn == "label" || cn == "username" {
				searchKey = cn
				break
			}
		}

		tableConfig := map[string]interface{}{
			"table_name":      t.Name,
			"columns":         columns,
			"actions":         []string{"create", "edit", "delete", "view"},
			"search_enabled":  true,
			"pagination":      true,
			"filters_enabled": true,
			"page_size":       20,
		}
		if searchKey != "" {
			tableConfig["search_key"] = searchKey
		}

		blocks := []map[string]interface{}{
			{
				"id":     fmt.Sprintf("table_%s", t.Name),
				"type":   "data_table",
				"config": tableConfig,
			},
		}

		// Add a form block if there are editable fields
		if len(formFields) > 0 {
			blocks = append(blocks, map[string]interface{}{
				"id":    fmt.Sprintf("form_%s", t.Name),
				"type":  "form",
				"label": "Add " + toTitleCase(strings.ReplaceAll(t.Name, "_", " ")),
				"config": map[string]interface{}{
					"title":        "New " + toTitleCase(strings.ReplaceAll(t.Name, "_", " ")),
					"table_name":   t.Name,
					"fields":       formFields,
					"submit_label": "Create",
				},
			})
		}

		pages = append(pages, map[string]interface{}{
			"id":     t.Name,
			"title":  toTitleCase(strings.ReplaceAll(t.Name, "_", " ")),
			"route":  "/" + t.Name,
			"icon":   tableIcons[i%len(tableIcons)],
			"blocks": blocks,
		})
	}

	return pages
}

// extractAppName tries to extract an application name from the user message
func (e *agentEngine) extractAppName(msg string) string {
	patterns := map[string]string{
		"fleet":     "Fleet Management",
		"车队":        "Fleet Management",
		"vehicle":   "Vehicle Management",
		"feedback":  "Feedback System",
		"反馈":        "Feedback System",
		"order":     "Order Management",
		"订单":        "Order Management",
		"product":   "Product Management",
		"商品":        "Product Management",
		"inventory": "Inventory System",
		"库存":        "Inventory System",
		"task":      "Task Management",
		"任务":        "Task Management",
		"project":   "Project Management",
		"项目":        "Project Management",
		"customer":  "Customer Management",
		"客户":        "Customer Management",
	}
	for keyword, name := range patterns {
		if strings.Contains(msg, keyword) {
			return name
		}
	}
	return "My Application"
}

// containsAnyKeyword checks if s contains any of the keywords
func containsAnyKeyword(s string, keywords []string) bool {
	for _, k := range keywords {
		if strings.Contains(s, k) {
			return true
		}
	}
	return false
}

// inferColumnDisplayType infers the frontend display type for a data_table column
func inferColumnDisplayType(colName string, col map[string]interface{}) string {
	nameLower := strings.ToLower(colName)
	sqlType := strings.ToUpper(fmt.Sprintf("%v", col["type"]))

	// Date columns
	if strings.HasSuffix(nameLower, "_at") || strings.HasSuffix(nameLower, "_date") ||
		nameLower == "created" || nameLower == "updated" || nameLower == "date" ||
		strings.Contains(sqlType, "TIMESTAMP") || strings.Contains(sqlType, "DATE") {
		return "date"
	}

	// Boolean columns
	if strings.HasPrefix(nameLower, "is_") || strings.HasPrefix(nameLower, "has_") ||
		nameLower == "active" || nameLower == "enabled" || nameLower == "verified" ||
		strings.Contains(sqlType, "BOOL") {
		return "boolean"
	}

	// Badge/status columns
	if nameLower == "status" || nameLower == "state" || nameLower == "role" ||
		nameLower == "priority" || nameLower == "type" || nameLower == "category" {
		return "badge"
	}

	// Number columns
	if strings.Contains(sqlType, "INT") || strings.Contains(sqlType, "DECIMAL") ||
		strings.Contains(sqlType, "FLOAT") || strings.Contains(sqlType, "DOUBLE") ||
		strings.Contains(sqlType, "NUMERIC") ||
		nameLower == "price" || nameLower == "amount" || nameLower == "quantity" ||
		nameLower == "count" || nameLower == "total" || nameLower == "mileage" ||
		nameLower == "distance" || nameLower == "weight" || nameLower == "age" ||
		nameLower == "score" || nameLower == "rating" || nameLower == "cost" ||
		strings.HasSuffix(nameLower, "_count") || strings.HasSuffix(nameLower, "_total") ||
		strings.HasSuffix(nameLower, "_amount") || strings.HasSuffix(nameLower, "_price") ||
		strings.HasSuffix(nameLower, "_qty") || strings.HasSuffix(nameLower, "_size") ||
		strings.HasSuffix(nameLower, "_score") || strings.HasSuffix(nameLower, "_rate") {
		return "number"
	}

	return ""
}

// toTitleCase capitalizes the first letter of each word (replacement for deprecated strings.Title)
func toTitleCase(s string) string {
	words := strings.Fields(s)
	for i, w := range words {
		if len(w) > 0 {
			words[i] = strings.ToUpper(w[:1]) + w[1:]
		}
	}
	return strings.Join(words, " ")
}

// extractEntityName tries to extract a noun/entity name for generic CRUD
func extractEntityName(msg string) string {
	// Remove common verbs and noise words
	noise := []string{"i want", "i need", "please", "help me", "build", "create", "make",
		"a", "an", "the", "to", "for", "with", "management", "system", "app",
		"我想", "我要", "帮我", "做一个", "建一个", "管理", "系统", "应用"}
	result := msg
	for _, n := range noise {
		result = strings.ReplaceAll(result, n, " ")
	}
	result = strings.TrimSpace(result)
	words := strings.Fields(result)
	if len(words) > 0 {
		// Take the first meaningful word
		w := strings.ToLower(words[0])
		if len(w) > 2 {
			return w
		}
	}
	return ""
}
