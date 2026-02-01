# Editor Page Overrides (Workflow Editor)

> **PROJECT:** AgentFlow
> **Style:** Manus-inspired Dark AI Theme
> **Page Type:** Workflow Editor / Canvas

> ⚠️ **IMPORTANT:** Rules in this file **override** the Master file (`design-system/MASTER.md`).
> Only deviations from the Master are documented here. For all other rules, refer to the Master.

---

## Page-Specific Rules

### Layout

- **Layout:** Full viewport, no scroll
- **Structure:** Header (48px) + Main (Sidebar + Canvas + Panel)

```css
.editor-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #09090B;
  overflow: hidden;
}

.editor-main {
  display: flex;
  flex: 1;
  overflow: hidden;
}
```

### Editor Header/Toolbar

```css
.editor-header {
  height: 48px;
  background: #0F0F12;
  border-bottom: 1px solid #27272A;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
}

.editor-breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #A1A1AA;
}

.editor-breadcrumb-current {
  color: #FAFAFA;
  font-weight: 500;
}

.editor-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.editor-btn {
  background: #18181B;
  border: 1px solid #3F3F46;
  border-radius: 6px;
  padding: 6px 12px;
  color: #FAFAFA;
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 150ms ease;
}

.editor-btn:hover {
  background: #27272A;
}

.editor-btn-primary {
  background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%);
  border: none;
}

.editor-btn-primary:hover {
  box-shadow: 0 0 15px rgba(139, 92, 246, 0.4);
}
```

### Node Panel (Left Sidebar)

```css
.node-panel {
  width: 260px;
  background: #0F0F12;
  border-right: 1px solid #27272A;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.node-panel-header {
  padding: 16px;
  border-bottom: 1px solid #27272A;
}

.node-panel-search {
  background: #18181B;
  border: 1px solid #3F3F46;
  border-radius: 6px;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.node-panel-search input {
  background: transparent;
  border: none;
  color: #FAFAFA;
  font-size: 13px;
  flex: 1;
  outline: none;
}

.node-category {
  padding: 12px 16px 8px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #71717A;
}

.node-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  cursor: grab;
  transition: all 150ms ease;
}

.node-item:hover {
  background: #18181B;
}

.node-item:active {
  cursor: grabbing;
}

.node-item-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

/* Node type colors */
.node-item-icon.ai { background: rgba(139, 92, 246, 0.2); color: #A78BFA; }
.node-item-icon.logic { background: rgba(34, 211, 238, 0.2); color: #22D3EE; }
.node-item-icon.data { background: rgba(34, 197, 94, 0.2); color: #4ADE80; }
.node-item-icon.integration { background: rgba(251, 146, 60, 0.2); color: #FB923C; }
.node-item-icon.io { background: rgba(244, 114, 182, 0.2); color: #F472B6; }

.node-item-label {
  font-size: 13px;
  color: #FAFAFA;
}

.node-item-description {
  font-size: 11px;
  color: #71717A;
}
```

### Canvas Area

```css
.editor-canvas {
  flex: 1;
  background: #09090B;
  background-image: 
    radial-gradient(circle at 1px 1px, #27272A 1px, transparent 0);
  background-size: 24px 24px;
  position: relative;
}

/* React Flow customizations */
.react-flow__node {
  background: #18181B;
  border: 1px solid #3F3F46;
  border-radius: 8px;
  padding: 0;
  font-size: 13px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.4);
}

.react-flow__node.selected {
  border-color: #8B5CF6;
  box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.3), 0 4px 6px rgba(0, 0, 0, 0.4);
}

.react-flow__edge-path {
  stroke: #3F3F46;
  stroke-width: 2px;
}

.react-flow__edge.selected .react-flow__edge-path {
  stroke: #8B5CF6;
}

.react-flow__handle {
  width: 10px;
  height: 10px;
  background: #3F3F46;
  border: 2px solid #09090B;
}

.react-flow__handle:hover {
  background: #8B5CF6;
}

.react-flow__minimap {
  background: #18181B;
  border: 1px solid #27272A;
  border-radius: 8px;
}

.react-flow__controls {
  background: #18181B;
  border: 1px solid #27272A;
  border-radius: 8px;
  box-shadow: none;
}

.react-flow__controls-button {
  background: #18181B;
  border-bottom: 1px solid #27272A;
  color: #A1A1AA;
}

.react-flow__controls-button:hover {
  background: #27272A;
  color: #FAFAFA;
}
```

### Custom Node Design

```css
.custom-node {
  min-width: 200px;
}

.custom-node-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-bottom: 1px solid #27272A;
  background: #0F0F12;
  border-radius: 8px 8px 0 0;
}

.custom-node-icon {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.custom-node-title {
  font-size: 13px;
  font-weight: 500;
  color: #FAFAFA;
}

.custom-node-body {
  padding: 12px;
}

.custom-node-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #71717A;
}

.custom-node-status.running {
  color: #22D3EE;
}

.custom-node-status.success {
  color: #4ADE80;
}

.custom-node-status.error {
  color: #F87171;
}
```

### Config Panel (Right Sidebar)

```css
.config-panel {
  width: 320px;
  background: #0F0F12;
  border-left: 1px solid #27272A;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.config-panel-header {
  padding: 16px;
  border-bottom: 1px solid #27272A;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.config-panel-title {
  font-size: 14px;
  font-weight: 600;
  color: #FAFAFA;
}

.config-panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.config-section {
  margin-bottom: 24px;
}

.config-section-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #71717A;
  margin-bottom: 12px;
}

.config-field {
  margin-bottom: 16px;
}

.config-label {
  font-size: 13px;
  font-weight: 500;
  color: #FAFAFA;
  margin-bottom: 6px;
  display: block;
}

.config-input {
  width: 100%;
  background: #18181B;
  border: 1px solid #3F3F46;
  border-radius: 6px;
  padding: 8px 12px;
  color: #FAFAFA;
  font-size: 13px;
}

.config-input:focus {
  border-color: #8B5CF6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2);
  outline: none;
}

.config-textarea {
  min-height: 100px;
  resize: vertical;
  font-family: 'JetBrains Mono', monospace;
}
```

### Execution Panel (Bottom)

```css
.execution-panel {
  background: #0F0F12;
  border-top: 1px solid #27272A;
  max-height: 300px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.execution-panel-header {
  padding: 12px 16px;
  border-bottom: 1px solid #27272A;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.execution-tabs {
  display: flex;
  gap: 4px;
}

.execution-tab {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  color: #A1A1AA;
  cursor: pointer;
  transition: all 150ms ease;
}

.execution-tab:hover {
  color: #FAFAFA;
}

.execution-tab.active {
  background: #27272A;
  color: #FAFAFA;
}

.execution-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: #A1A1AA;
  line-height: 1.6;
}

.log-line {
  padding: 4px 0;
}

.log-line.info { color: #A1A1AA; }
.log-line.success { color: #4ADE80; }
.log-line.warning { color: #FBBF24; }
.log-line.error { color: #F87171; }
```

---

## Component Structure

```
Editor Page
├── Header/Toolbar
│   ├── Back Button + Breadcrumb
│   ├── Workflow Name (editable)
│   └── Actions (Save, Run, Settings, Publish)
├── Main Area
│   ├── Node Panel (left, 260px)
│   │   ├── Search
│   │   └── Node Categories
│   │       ├── AI Nodes
│   │       ├── Logic Nodes
│   │       ├── Data Nodes
│   │       └── Integration Nodes
│   ├── Canvas (center, flex)
│   │   ├── React Flow Canvas
│   │   ├── Minimap
│   │   └── Controls
│   └── Config Panel (right, 320px, optional)
│       ├── Node Settings
│       ├── Input/Output Config
│       └── Test Section
└── Execution Panel (bottom, collapsible)
    ├── Tabs (Output, Logs, Variables)
    └── Content
```

---

## Node Colors by Type

| Category | Background | Icon Color |
|----------|------------|------------|
| AI/LLM | `rgba(139, 92, 246, 0.2)` | `#A78BFA` |
| Logic | `rgba(34, 211, 238, 0.2)` | `#22D3EE` |
| Data | `rgba(34, 197, 94, 0.2)` | `#4ADE80` |
| Integration | `rgba(251, 146, 60, 0.2)` | `#FB923C` |
| Input/Output | `rgba(244, 114, 182, 0.2)` | `#F472B6` |
| Code | `rgba(161, 161, 170, 0.2)` | `#A1A1AA` |

---

## Keyboard Shortcuts Display

```css
.shortcut-key {
  background: #27272A;
  border: 1px solid #3F3F46;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 11px;
  font-family: 'JetBrains Mono', monospace;
  color: #A1A1AA;
}
```
