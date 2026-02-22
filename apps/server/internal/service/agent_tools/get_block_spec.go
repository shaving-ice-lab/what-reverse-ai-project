package agent_tools

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/reverseai/server/internal/service"
)

type GetBlockSpecTool struct{}

func NewGetBlockSpecTool() *GetBlockSpecTool {
	return &GetBlockSpecTool{}
}

func (t *GetBlockSpecTool) Name() string { return "get_block_spec" }

func (t *GetBlockSpecTool) Description() string {
	return "Get the detailed configuration specification and example JSON for a specific block type. Use this before generating any block to ensure correct config structure. Available types: stats_card, data_table, form, chart, detail_view, markdown, image, hero, tabs_container, list, divider, custom_code, auth, file_upload, calendar, form_dialog."
}

func (t *GetBlockSpecTool) Parameters() json.RawMessage {
	return json.RawMessage(`{
		"type": "object",
		"properties": {
			"block_type": {
				"type": "string",
				"enum": ["stats_card", "data_table", "form", "chart", "detail_view", "markdown", "image", "hero", "tabs_container", "list", "divider", "custom_code", "auth", "file_upload", "calendar", "form_dialog"],
				"description": "The block type to get specification for"
			}
		},
		"required": ["block_type"]
	}`)
}

func (t *GetBlockSpecTool) RequiresConfirmation() bool { return false }

type getBlockSpecParams struct {
	BlockType string `json:"block_type"`
}

func (t *GetBlockSpecTool) Execute(ctx context.Context, params json.RawMessage) (*service.AgentToolResult, error) {
	var p getBlockSpecParams
	if err := json.Unmarshal(params, &p); err != nil {
		return &service.AgentToolResult{Success: false, Error: "invalid parameters: " + err.Error()}, nil
	}

	spec, ok := blockSpecs[p.BlockType]
	if !ok {
		return &service.AgentToolResult{
			Success: false,
			Error:   fmt.Sprintf("unknown block type %q. Available: stats_card, data_table, form, chart, detail_view, markdown, image, hero, tabs_container, list, divider, custom_code, auth, file_upload, calendar, form_dialog", p.BlockType),
		}, nil
	}

	return &service.AgentToolResult{
		Success: true,
		Output:  fmt.Sprintf("Block specification for %q:\n\n%s", p.BlockType, spec),
	}, nil
}

// blockSpecs contains the full configuration specification and example for each block type.
// Separated from system prompt to reduce token usage — LLM queries on-demand.
var blockSpecs = map[string]string{
	"stats_card": `## stats_card — KPI Metric Card

**config:**
- label (string, required): Display label for the metric
- value_key (string, required): Key in the aggregation result to display
- format (string): "number" | "currency" | "percent" — how to format the value
- color (string): "blue" | "green" | "amber" | "red" — card accent color
- icon (string): Lucide icon name (e.g., "Users", "DollarSign", "Package")

**data_source:**
- table (string, required): Source table name
- aggregation (array, required): [{"function": "count|sum|avg", "column": "*|column_name", "alias": "result_key"}]
- where (string, optional): SQL WHERE clause for filtering (e.g., "status = 'active'")

**Example:**
` + "```json" + `
{
  "id": "stat_active_users",
  "type": "stats_card",
  "config": {
    "label": "Active Users",
    "value_key": "count",
    "format": "number",
    "color": "green",
    "icon": "Users"
  },
  "data_source": {
    "table": "users",
    "aggregation": [{"function": "count", "column": "*", "alias": "count"}],
    "where": "status = 'active'"
  }
}
` + "```",

	"data_table": `## data_table — Full CRUD Data Table

**config:**
- table_name (string, required): Database table to display
- columns (array, required): Column definitions
  - key (string): Column name in database
  - label (string): Display header
  - type (string): "text" | "number" | "date" | "boolean" | "badge" | "lookup" — affects rendering
  - sortable (boolean): Enable column sorting
  - width (string): Column width CSS (e.g., "150px")
  - **lookup columns** (type = "lookup"): Display a value from a related table instead of the raw foreign key
    - lookup_table (string): Related table name
    - lookup_key (string): Column in related table to match against (usually "id")
    - display_key (string): Column in related table to display (e.g., "name", "plate_number")
- actions (array): ["create", "edit", "delete", "view"] — enabled row actions
- search_enabled (boolean): Show search bar
- search_key (string): Column to search in (e.g., "name"). If not set, searches all text columns with OR
- pagination (boolean): Enable pagination
- page_size (number): Rows per page (default 20)
- filters_enabled (boolean): Show filter builder UI
- row_click_action (object, optional): Navigate on row click
  - type (string): "navigate"
  - page_id (string): Target page
  - params (object): Map of URL param name → column name, e.g., {"record_id": "id"}
- status_actions (array, optional): Workflow actions that change a record's status. Each entry:
  - label (string): Button text (e.g., "Approve")
  - from_status (array of strings): Which status values show this button (e.g., ["Pending"])
  - to_status (string): New status value after action (e.g., "Approved")
  - status_column (string): Column that holds the status (e.g., "status")
  - color (string): "green" | "red" | "blue" | "amber" | "default"
  - confirm (boolean): Show confirmation dialog before executing
  - extra_fields (array, optional): Additional fields to collect on action
    - key (string): Column name
    - label (string): Display label
    - required (boolean)

**data_source:**
- table (string, required): Same as config.table_name
- order_by (array, optional): Default sort, e.g., [{"column": "created_at", "direction": "DESC"}]
- where (string, optional): SQL WHERE filter
- limit (number, optional): Max rows

**Example (basic table):**
` + "```json" + `
{
  "id": "table_orders",
  "type": "data_table",
  "config": {
    "table_name": "orders",
    "columns": [
      {"key": "id", "label": "ID", "type": "number"},
      {"key": "customer_name", "label": "Customer", "sortable": true},
      {"key": "total_amount", "label": "Total", "type": "number"},
      {"key": "status", "label": "Status", "type": "badge"},
      {"key": "created_at", "label": "Created", "type": "date"}
    ],
    "actions": ["create", "edit", "delete", "view"],
    "search_enabled": true,
    "search_key": "customer_name",
    "pagination": true,
    "page_size": 20
  },
  "data_source": {"table": "orders", "order_by": [{"column": "created_at", "direction": "DESC"}]}
}
` + "```" + `

**Example (with lookup columns and status_actions):**
` + "```json" + `
{
  "id": "reservations_table",
  "type": "data_table",
  "config": {
    "table_name": "reservations",
    "columns": [
      {"key": "reservation_no", "label": "Booking No.", "type": "text", "sortable": true},
      {"key": "applicant_name", "label": "Applicant", "type": "text"},
      {"key": "vehicle_id", "label": "Vehicle", "type": "lookup", "lookup_table": "vehicles", "lookup_key": "id", "display_key": "plate_number"},
      {"key": "status", "label": "Status", "type": "badge"}
    ],
    "actions": ["view", "edit", "delete"],
    "status_actions": [
      {"label": "Approve", "from_status": ["Pending"], "to_status": "Approved", "status_column": "status", "color": "green", "confirm": true},
      {"label": "Reject", "from_status": ["Pending"], "to_status": "Rejected", "status_column": "status", "color": "red", "confirm": true, "extra_fields": [{"key": "reject_reason", "label": "Reason", "required": true}]}
    ],
    "search_enabled": true,
    "search_key": "reservation_no",
    "pagination": true,
    "page_size": 15,
    "row_click_action": {"type": "navigate", "page_id": "reservation_detail", "params": {"record_id": "id"}}
  },
  "data_source": {"table": "reservations", "order_by": [{"column": "start_time", "direction": "DESC"}]}
}
` + "```",

	"form": `## form — Data Entry Form

**config:**
- title (string): Form heading
- description (string): Subtitle/instructions
- table_name (string, required): Target table for insert/update
- fields (array, required): Form field definitions
  - name (string): Column name in database
  - label (string): Display label
  - type (string): "text" | "number" | "email" | "textarea" | "select" | "checkbox" | "date" | "datetime" | "password" | "url" | "tel"
  - required (boolean): Validation
  - placeholder (string): Input placeholder
  - options (array of strings): For select type — dropdown options
  - default_value (any): Pre-filled value
- submit_label (string): Button text (default "Submit")
- mode (string): "create" | "edit" — edit mode reads record_id from page params
- record_id_param (string): Page param key for edit mode (e.g., "record_id")

**Example:**
` + "```json" + `
{
  "id": "form_new_order",
  "type": "form",
  "label": "New Order",
  "config": {
    "title": "Create Order",
    "description": "Fill in the order details",
    "table_name": "orders",
    "fields": [
      {"name": "customer_name", "label": "Customer", "type": "text", "required": true},
      {"name": "customer_email", "label": "Email", "type": "email"},
      {"name": "total_amount", "label": "Total", "type": "number", "required": true},
      {"name": "status", "label": "Status", "type": "select", "options": ["pending", "confirmed", "shipped", "delivered"]}
    ],
    "submit_label": "Create Order"
  }
}
` + "```",

	"chart": `## chart — Data Visualization

**config:**
- chart_type (string, required): "bar" | "line" | "pie" | "area"
- title (string): Chart heading
- x_key (string): Column for X axis / category
- y_key (string): Column for Y axis / value
- category_key (string): For pie charts — groups and counts by this column
- color (string): Primary color (hex, e.g., "#6366f1")
- height (number): Chart height in pixels

**data_source:**
- table (string, required): Source table
- columns (array, optional): Specific columns to fetch
- order_by (string, optional): Sort order
- limit (number, optional): Max rows

**Example (bar chart):**
` + "```json" + `
{
  "id": "chart_revenue",
  "type": "chart",
  "config": {
    "chart_type": "bar",
    "title": "Revenue by Product",
    "x_key": "name",
    "y_key": "price",
    "color": "#6366f1",
    "height": 300
  },
  "data_source": {"table": "products", "order_by": "price DESC", "limit": 10},
  "grid": {"col_span": 2}
}
` + "```" + `

**Example (pie chart — auto-aggregation):**
` + "```json" + `
{
  "id": "chart_status_dist",
  "type": "chart",
  "config": {
    "chart_type": "pie",
    "title": "Order Status Distribution",
    "category_key": "status"
  },
  "data_source": {"table": "orders"}
}
` + "```",

	"detail_view": `## detail_view — Single Record Display

**config:**
- table_name (string, required): Source table
- record_id_key (string): Column used as record identifier (default "id")
- record_id_param (string): Page param to read record ID from (e.g., "record_id")
- fields (array): Field display definitions
  - key (string): Column name
  - label (string): Display label
  - type (string): "text" | "number" | "date" | "boolean" | "badge"

Reads record_id from page parameters via record_id_param. Use with row_click_action in data_table to navigate to detail pages.

**Example:**
` + "```json" + `
{
  "id": "detail_order",
  "type": "detail_view",
  "config": {
    "table_name": "orders",
    "record_id_key": "id",
    "record_id_param": "record_id",
    "fields": [
      {"key": "customer_name", "label": "Customer"},
      {"key": "total_amount", "label": "Total", "type": "number"},
      {"key": "status", "label": "Status", "type": "badge"},
      {"key": "created_at", "label": "Created", "type": "date"}
    ]
  }
}
` + "```",

	"markdown": `## markdown — Static Rich Text

**config:**
- content (string, required): Markdown text content. Supports: bold, italic, inline code, links, code blocks, blockquotes, HR, ordered/unordered lists.

**Example:**
` + "```json" + `
{
  "id": "md_welcome",
  "type": "markdown",
  "config": {
    "content": "## Welcome to the Dashboard\n\nThis application helps you manage your business data.\n\n- View key metrics above\n- Manage records in the tables below\n- Use the sidebar to navigate between pages"
  }
}
` + "```",

	"image": `## image — Image Display

**config:**
- src (string, required): Image URL
- alt (string): Alt text
- width (string): CSS width (e.g., "100%", "300px")
- height (string): CSS height
- object_fit (string): "cover" | "contain" | "fill"
- caption (string): Caption below image
- link (string): URL to navigate on click

**Example:**
` + "```json" + `
{
  "id": "img_banner",
  "type": "image",
  "config": {
    "src": "/api/storage/banner.png",
    "alt": "Company Banner",
    "width": "100%",
    "object_fit": "cover",
    "caption": "Welcome to our platform"
  },
  "grid": {"col_span": 4}
}
` + "```",

	"hero": `## hero — Hero Banner Section

**config:**
- title (string, required): Main heading
- subtitle (string): Subheading
- description (string): Body text
- align (string): "left" | "center" | "right"
- size (string): "sm" | "md" | "lg"
- background_color (string): CSS color
- text_color (string): CSS color
- actions (array): CTA buttons [{label, href, variant: "default"|"outline"}]

**Example:**
` + "```json" + `
{
  "id": "hero_main",
  "type": "hero",
  "config": {
    "title": "Fleet Management System",
    "subtitle": "Track vehicles, drivers, and trips in real-time",
    "align": "center",
    "size": "lg",
    "actions": [
      {"label": "View Dashboard", "href": "#dashboard"},
      {"label": "Manage Vehicles", "href": "#vehicles", "variant": "outline"}
    ]
  },
  "grid": {"col_span": 4}
}
` + "```",

	"tabs_container": `## tabs_container — Tabbed Layout

**config:**
- tabs (array, required): Tab definitions
  - id (string): Unique tab ID
  - label (string): Tab label
  - blocks (array): Nested block objects (any block type)
- default_tab (string): ID of initially active tab

**Example:**
` + "```json" + `
{
  "id": "tabs_overview",
  "type": "tabs_container",
  "config": {
    "default_tab": "summary",
    "tabs": [
      {
        "id": "summary",
        "label": "Summary",
        "blocks": [
          {"id": "stat_total", "type": "stats_card", "config": {"label": "Total", "value_key": "count", "format": "number", "color": "blue"}, "data_source": {"table": "orders", "aggregation": [{"function": "count", "column": "*", "alias": "count"}]}}
        ]
      },
      {
        "id": "details",
        "label": "Details",
        "blocks": [
          {"id": "table_all", "type": "data_table", "config": {"table_name": "orders", "columns": [{"key": "id", "label": "ID"}, {"key": "status", "label": "Status", "type": "badge"}], "actions": ["view"], "pagination": true}}
        ]
      }
    ]
  },
  "grid": {"col_span": 4}
}
` + "```",

	"list": `## list — Scrollable Item List

**config:**
- table_name (string, required): Source table
- title_key (string, required): Column for item title
- subtitle_key (string): Column for subtitle
- description_key (string): Column for description text
- image_key (string): Column for image URL
- badge_key (string): Column for badge/status
- layout (string): "list" | "grid"
- columns (number): Grid columns (for grid layout)
- clickable (boolean): Enable click-to-expand
- empty_message (string): Message when no data
- click_action (object, optional): Navigate on click
  - page_id (string): Target page
  - param_key (string): URL param name
  - value_key (string): Column for param value

**data_source:**
- table (string, required)
- order_by, limit (optional)

**Example:**
` + "```json" + `
{
  "id": "list_recent",
  "type": "list",
  "label": "Recent Orders",
  "config": {
    "table_name": "orders",
    "title_key": "customer_name",
    "subtitle_key": "total_amount",
    "badge_key": "status",
    "clickable": true,
    "empty_message": "No orders yet"
  },
  "data_source": {"table": "orders", "order_by": "created_at DESC", "limit": 10}
}
` + "```",

	"divider": `## divider — Visual Separator

**config:**
- label (string, optional): Text label in the middle of the divider
- style (string): "solid" | "dashed" | "dotted"
- spacing (string): "sm" | "md" | "lg"

**Example:**
` + "```json" + `
{
  "id": "div_1",
  "type": "divider",
  "config": {"label": "Section 2", "style": "dashed", "spacing": "lg"}
}
` + "```",

	"custom_code": `## custom_code — Custom JavaScript Component (iframe sandbox)

**config:**
- code (string, required): JavaScript code that runs inside an iframe sandbox
- api_source (object, optional): Fetch data from backend API
  - path (string): API path
  - method (string): "GET" | "POST"
  - body (object): Request body
- min_height (number): Minimum iframe height in pixels
- max_height (number): Maximum iframe height in pixels

**Sandbox API:**
- ROOT: The root DOM element — set innerHTML or append children
- DATA: Object containing data fetched from api_source
- Custom events: ROOT.dispatchEvent(new CustomEvent('sandbox-data-update', {detail: newData}))
- Parent communication: window.parent.postMessage({__sandbox: true, type: 'ACTION_REQUEST', action: 'navigate', payload: {page: 'details'}}, '*')

**When to use:** Interactive widgets, custom visualizations (maps, timelines, Gantt), complex conditional rendering, anything built-in blocks cannot express.

**Example:**
` + "```json" + `
{
  "id": "custom_chart",
  "type": "custom_code",
  "config": {
    "code": "var items = DATA.items || [];\nvar html = '<div style=\"padding:16px\">';\nhtml += '<h3 style=\"margin:0 0 12px\">Custom View</h3>';\nhtml += '<ul>';\nitems.forEach(function(item) {\n  html += '<li style=\"padding:4px 0\">' + item.name + ' — <strong>' + item.status + '</strong></li>';\n});\nhtml += '</ul></div>';\nROOT.innerHTML = html;",
    "api_source": {"path": "/api/runtime/myapp/api/items", "method": "GET"},
    "min_height": 200,
    "max_height": 600
  }
}
` + "```",

	"auth": `## auth — Login/Register Authentication Block

**config:**
- show_register (boolean): Show registration tab (default true)
- redirect_page (string): Page ID to navigate after login

**Example:**
` + "```json" + `
{
  "id": "auth_block",
  "type": "auth",
  "config": {
    "show_register": true,
    "redirect_page": "dashboard"
  }
}
` + "```",

	"file_upload": `## file_upload — Drag-and-Drop File Upload

**config:**
- accept (string): Accepted file types (e.g., "image/*,.pdf")
- max_size_mb (number): Maximum file size in MB
- multiple (boolean): Allow multiple files
- prefix (string): Storage path prefix

**Example:**
` + "```json" + `
{
  "id": "upload_docs",
  "type": "file_upload",
  "config": {
    "accept": "image/*,.pdf,.doc,.docx",
    "max_size_mb": 10,
    "multiple": true,
    "prefix": "documents"
  }
}
` + "```",

	"calendar": `## calendar — Calendar Date View

**config:**
- table_name (string, required): Source table
- title_key (string, required): Column for event title display
- start_key (string, required): Column for event start date/datetime
- end_key (string, optional): Column for event end date/datetime (enables date range display)
- status_key (string, optional): Column for event status (used for color coding)
- default_view (string): "month" | "week" — initial calendar view
- detail_fields (array, optional): Fields shown in event detail popup on click
  - key (string): Column name
  - label (string): Display label
- status_colors (object, optional): Map of status value → CSS class string for custom coloring
  - e.g., {"Pending": "bg-amber-500/15 text-amber-700 border-amber-400/30", "Approved": "bg-emerald-500/15 text-emerald-700 border-emerald-400/30"}
- click_action (object, optional): Navigate on event click
  - type (string): "navigate"
  - page_id (string): Target page
  - param_key (string): URL param name for record ID

**data_source:**
- table (string, required)

**Example (simple):**
` + "```json" + `
{
  "id": "cal_events",
  "type": "calendar",
  "config": {
    "table_name": "events",
    "title_key": "title",
    "start_key": "event_date",
    "default_view": "month"
  },
  "data_source": {"table": "events"}
}
` + "```" + `

**Example (full-featured with date range, status colors, click navigation):**
` + "```json" + `
{
  "id": "reservation_calendar",
  "type": "calendar",
  "grid": {"col_span": 4},
  "config": {
    "table_name": "reservations",
    "title_key": "purpose",
    "start_key": "start_time",
    "end_key": "end_time",
    "status_key": "status",
    "default_view": "month",
    "detail_fields": [
      {"key": "reservation_no", "label": "Code"},
      {"key": "applicant_name", "label": "Applicant"},
      {"key": "start_location", "label": "From"},
      {"key": "end_location", "label": "To"},
      {"key": "priority", "label": "Priority"}
    ],
    "status_colors": {
      "Pending": "bg-amber-500/15 text-amber-700 border-amber-400/30",
      "Approved": "bg-emerald-500/15 text-emerald-700 border-emerald-400/30",
      "In Progress": "bg-blue-500/15 text-blue-700 border-blue-400/30",
      "Completed": "bg-slate-500/10 text-slate-600 border-slate-400/30"
    },
    "click_action": {"type": "navigate", "page_id": "reservation_detail", "param_key": "record_id"}
  },
  "data_source": {"table": "reservations"}
}
` + "```",

	"form_dialog": `## form_dialog — Modal Form (triggered by button)

**config:**
- trigger_label (string, required): Button text to open dialog
- trigger_variant (string): "default" | "outline" | "ghost"
- title (string): Dialog heading
- description (string): Dialog subtitle
- dialog_size (string): "sm" | "md" | "lg" — dialog width
- table_name (string, required): Target table
- fields (array, required): Form field definitions
  - key (string): Column name in database
  - label (string): Display label
  - type (string): "text" | "number" | "email" | "textarea" | "select" | "checkbox" | "date" | "datetime" | "password" | "url" | "tel"
  - required (boolean): Validation
  - placeholder (string): Input placeholder
  - default_value (any): Pre-filled value
  - options (array): For select type — static options as strings OR as [{label, value}] objects
    - Simple: ["Low", "Medium", "High"]
    - Rich: [{"label": "CEO Office", "value": "CEO Office"}, {"label": "Sales", "value": "Sales"}]
  - dynamic_options (object, optional): Load options from API instead of static list
    - api (string): API path to fetch options from
    - label_key (string): Key in response for display label
    - value_key (string): Key in response for option value
    - depends_on (array of strings, optional): Other field keys that trigger re-fetch when changed
- submit_label (string): Submit button text
- pre_submit_api (string, optional): API path to validate data before submission

**Example (simple):**
` + "```json" + `
{
  "id": "dialog_add_task",
  "type": "form_dialog",
  "config": {
    "trigger_label": "Add Task",
    "title": "New Task",
    "table_name": "tasks",
    "fields": [
      {"key": "title", "label": "Title", "type": "text", "required": true},
      {"key": "assignee", "label": "Assignee", "type": "text"},
      {"key": "priority", "label": "Priority", "type": "select", "options": ["Low", "Medium", "High"]},
      {"key": "due_date", "label": "Due Date", "type": "date"}
    ],
    "submit_label": "Create Task"
  }
}
` + "```" + `

**Example (with dynamic_options and depends_on):**
` + "```json" + `
{
  "id": "reservation_create_dialog",
  "type": "form_dialog",
  "config": {
    "table_name": "reservations",
    "title": "New Reservation",
    "description": "Fill in reservation details",
    "trigger_label": "New Booking",
    "dialog_size": "lg",
    "submit_label": "Submit Booking",
    "fields": [
      {"key": "applicant_name", "label": "Applicant", "type": "text", "required": true},
      {"key": "applicant_department", "label": "Dept", "type": "select", "required": true, "options": [
        {"label": "Sales", "value": "Sales"}, {"label": "Engineering", "value": "Engineering"}
      ]},
      {"key": "start_time", "label": "Start Time", "type": "datetime", "required": true},
      {"key": "end_time", "label": "End Time", "type": "datetime", "required": true},
      {"key": "requirements", "label": "Requirements", "type": "select",
        "dynamic_options": {"api": "/api/capability-tags", "label_key": "capability", "value_key": "capability"}
      },
      {"key": "vehicle_id", "label": "Assign Vehicle", "type": "select",
        "dynamic_options": {"api": "/api/match-vehicles", "depends_on": ["requirements", "start_time", "end_time"], "label_key": "plate_number", "value_key": "id"}
      },
      {"key": "status", "label": "", "type": "text", "default_value": "Pending"}
    ]
  }
}
` + "```",
}
