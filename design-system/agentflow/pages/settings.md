# Settings Page Overrides

> **PROJECT:** AgentFlow
> **Style:** Manus-inspired Dark AI Theme
> **Page Type:** Settings / Preferences

> ⚠️ **IMPORTANT:** Rules in this file **override** the Master file (`design-system/MASTER.md`).
> Only deviations from the Master are documented here. For all other rules, refer to the Master.

---

## Page-Specific Rules

### Layout

- **Max Width:** 1200px
- **Layout:** Sidebar Navigation (240px) + Content Area

```css
.settings-layout {
  display: flex;
  min-height: 100vh;
  background: #09090B;
}

.settings-sidebar {
  width: 240px;
  background: #0F0F12;
  border-right: 1px solid #27272A;
  padding: 24px 16px;
}

.settings-content {
  flex: 1;
  padding: 32px 48px;
  max-width: 800px;
}
```

### Settings Navigation

```css
.settings-nav-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #71717A;
  padding: 8px 12px;
  margin-top: 16px;
}

.settings-nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 14px;
  color: #A1A1AA;
  cursor: pointer;
  transition: all 150ms ease;
}

.settings-nav-item:hover {
  background: #18181B;
  color: #FAFAFA;
}

.settings-nav-item.active {
  background: rgba(139, 92, 246, 0.15);
  color: #FAFAFA;
  border: 1px solid rgba(139, 92, 246, 0.3);
}

.settings-nav-icon {
  width: 20px;
  height: 20px;
  color: inherit;
}
```

### Page Header

```css
.settings-header {
  margin-bottom: 32px;
}

.settings-title {
  font-size: 24px;
  font-weight: 600;
  color: #FAFAFA;
}

.settings-description {
  font-size: 14px;
  color: #A1A1AA;
  margin-top: 8px;
}
```

### Settings Section

```css
.settings-section {
  background: #18181B;
  border: 1px solid #27272A;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
}

.settings-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.settings-section-title {
  font-size: 16px;
  font-weight: 600;
  color: #FAFAFA;
}

.settings-section-description {
  font-size: 13px;
  color: #A1A1AA;
  margin-top: 4px;
}
```

### Form Fields

```css
.settings-field {
  margin-bottom: 20px;
}

.settings-field:last-child {
  margin-bottom: 0;
}

.settings-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #FAFAFA;
  margin-bottom: 8px;
}

.settings-label-description {
  font-size: 13px;
  color: #71717A;
  font-weight: 400;
  margin-top: 2px;
}

.settings-input {
  width: 100%;
  background: #0F0F12;
  border: 1px solid #3F3F46;
  border-radius: 8px;
  padding: 10px 14px;
  color: #FAFAFA;
  font-size: 14px;
  transition: all 200ms ease;
}

.settings-input:focus {
  border-color: #8B5CF6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2);
  outline: none;
}

.settings-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.settings-select {
  appearance: none;
  background-image: url("data:image/svg+xml,..."); /* chevron icon */
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 40px;
}
```

### Toggle/Switch

```css
.settings-toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 1px solid #27272A;
}

.settings-toggle-row:last-child {
  border-bottom: none;
}

.settings-toggle-info {
  flex: 1;
}

.settings-toggle-label {
  font-size: 14px;
  font-weight: 500;
  color: #FAFAFA;
}

.settings-toggle-description {
  font-size: 13px;
  color: #71717A;
  margin-top: 2px;
}

.settings-switch {
  width: 44px;
  height: 24px;
  background: #3F3F46;
  border-radius: 12px;
  position: relative;
  cursor: pointer;
  transition: all 200ms ease;
}

.settings-switch.active {
  background: #8B5CF6;
}

.settings-switch::after {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  background: #FAFAFA;
  border-radius: 50%;
  top: 2px;
  left: 2px;
  transition: all 200ms ease;
}

.settings-switch.active::after {
  left: 22px;
}
```

### API Keys Section

```css
.api-key-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.api-key-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #0F0F12;
  border: 1px solid #27272A;
  border-radius: 8px;
  padding: 12px 16px;
}

.api-key-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.api-key-icon {
  width: 36px;
  height: 36px;
  background: #18181B;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #A1A1AA;
}

.api-key-name {
  font-size: 14px;
  font-weight: 500;
  color: #FAFAFA;
}

.api-key-value {
  font-size: 13px;
  font-family: 'JetBrains Mono', monospace;
  color: #71717A;
}

.api-key-actions {
  display: flex;
  gap: 8px;
}

.api-key-btn {
  background: transparent;
  border: none;
  color: #A1A1AA;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 150ms ease;
}

.api-key-btn:hover {
  background: #27272A;
  color: #FAFAFA;
}

.api-key-btn.delete:hover {
  background: rgba(239, 68, 68, 0.15);
  color: #F87171;
}
```

### Add API Key Dialog

```css
.add-key-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border: 2px dashed #3F3F46;
  border-radius: 8px;
  color: #A1A1AA;
  font-size: 14px;
  cursor: pointer;
  transition: all 200ms ease;
  width: 100%;
  justify-content: center;
}

.add-key-trigger:hover {
  border-color: #8B5CF6;
  color: #FAFAFA;
  background: rgba(139, 92, 246, 0.05);
}
```

### Danger Zone

```css
.danger-zone {
  background: rgba(239, 68, 68, 0.05);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 12px;
  padding: 24px;
}

.danger-zone-title {
  font-size: 16px;
  font-weight: 600;
  color: #F87171;
  margin-bottom: 8px;
}

.danger-zone-description {
  font-size: 13px;
  color: #A1A1AA;
  margin-bottom: 16px;
}

.danger-btn {
  background: transparent;
  border: 1px solid #EF4444;
  color: #EF4444;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: all 200ms ease;
}

.danger-btn:hover {
  background: #EF4444;
  color: #FAFAFA;
}
```

---

## Component Structure

```
Settings Page
├── Sidebar
│   ├── Back to Dashboard
│   ├── Account Section
│   │   ├── Profile
│   │   └── Preferences
│   ├── Configuration Section
│   │   ├── API Keys
│   │   └── Local LLM
│   └── Danger Zone
│       └── Delete Account
└── Content Area
    ├── Page Header (Title + Description)
    └── Settings Sections
        ├── Section 1 (Card)
        ├── Section 2 (Card)
        └── ...
```

---

## Settings Navigation Items

| Item | Icon | Path |
|------|------|------|
| Profile | `User` | `/settings/profile` |
| Preferences | `Settings` | `/settings` |
| API Keys | `Key` | `/settings/api-keys` |
| Local LLM | `Cpu` | `/settings/local-llm` |
| Billing | `CreditCard` | `/settings/billing` |

---

## Save Actions

```css
.settings-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 24px;
  border-top: 1px solid #27272A;
  margin-top: 24px;
}

.settings-save-btn {
  background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%);
  color: white;
  padding: 10px 24px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: all 200ms ease;
  border: none;
}

.settings-save-btn:hover {
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.4);
}

.settings-cancel-btn {
  background: transparent;
  border: 1px solid #3F3F46;
  color: #FAFAFA;
  padding: 10px 24px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: all 150ms ease;
}

.settings-cancel-btn:hover {
  background: #27272A;
}
```
