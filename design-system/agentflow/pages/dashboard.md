# Dashboard Page Overrides (Workflow List)

> **PROJECT:** AgentFlow
> **Style:** Manus-inspired Dark AI Theme
> **Page Type:** Dashboard / Workflow Management

> ⚠️ **IMPORTANT:** Rules in this file **override** the Master file (`design-system/MASTER.md`).
> Only deviations from the Master are documented here. For all other rules, refer to the Master.

---

## Page-Specific Rules

### Layout

- **Max Width:** 1400px
- **Layout:** Sidebar (260px) + Main Content
- **Grid:** Responsive card grid (auto-fill, minmax(320px, 1fr))

```css
.dashboard-layout {
  display: flex;
  min-height: 100vh;
  background: #09090B;
}

.dashboard-main {
  flex: 1;
  padding: 24px 32px;
  overflow-y: auto;
}
```

### Page Header

```css
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.dashboard-title {
  font-size: 24px;
  font-weight: 600;
  color: #FAFAFA;
}

.dashboard-subtitle {
  font-size: 14px;
  color: #A1A1AA;
  margin-top: 4px;
}
```

### Workflow Card

```css
.workflow-card {
  background: #18181B;
  border: 1px solid #27272A;
  border-radius: 12px;
  padding: 20px;
  transition: all 200ms ease;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.workflow-card:hover {
  border-color: #8B5CF6;
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.15);
  transform: translateY(-2px);
}

.workflow-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.workflow-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(99, 102, 241, 0.2) 100%);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #A78BFA;
}

.workflow-title {
  font-size: 16px;
  font-weight: 600;
  color: #FAFAFA;
  margin-top: 12px;
}

.workflow-description {
  font-size: 14px;
  color: #A1A1AA;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.workflow-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 12px;
  color: #71717A;
}

.workflow-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 500;
}

.workflow-status.active {
  background: rgba(34, 197, 94, 0.15);
  color: #4ADE80;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.workflow-status.draft {
  background: rgba(161, 161, 170, 0.15);
  color: #A1A1AA;
  border: 1px solid rgba(161, 161, 170, 0.3);
}
```

### Create New Workflow Card

```css
.create-workflow-card {
  background: transparent;
  border: 2px dashed #3F3F46;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 200px;
  cursor: pointer;
  transition: all 200ms ease;
}

.create-workflow-card:hover {
  border-color: #8B5CF6;
  background: rgba(139, 92, 246, 0.05);
}

.create-icon {
  width: 48px;
  height: 48px;
  background: #27272A;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8B5CF6;
}

.create-text {
  font-size: 14px;
  font-weight: 500;
  color: #A1A1AA;
}
```

### Empty State

```css
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  text-align: center;
}

.empty-state-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(99, 102, 241, 0.15) 100%);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  color: #8B5CF6;
}

.empty-state-title {
  font-size: 18px;
  font-weight: 600;
  color: #FAFAFA;
  margin-bottom: 8px;
}

.empty-state-description {
  font-size: 14px;
  color: #A1A1AA;
  max-width: 400px;
  margin-bottom: 24px;
}
```

### Filter/Search Bar

```css
.search-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #18181B;
  border: 1px solid #3F3F46;
  border-radius: 8px;
  padding: 8px 16px;
  max-width: 320px;
}

.search-bar:focus-within {
  border-color: #8B5CF6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2);
}

.search-input {
  background: transparent;
  border: none;
  color: #FAFAFA;
  font-size: 14px;
  flex: 1;
  outline: none;
}

.filter-btn {
  background: #18181B;
  border: 1px solid #3F3F46;
  border-radius: 8px;
  padding: 8px 16px;
  color: #A1A1AA;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 150ms ease;
}

.filter-btn:hover {
  background: #27272A;
  color: #FAFAFA;
}
```

---

## Component Structure

```
Dashboard Page
├── Sidebar
│   ├── Logo
│   ├── Navigation Items
│   │   ├── Workflows (active)
│   │   ├── Templates
│   │   ├── Executions
│   │   └── Settings
│   └── User Profile
└── Main Content
    ├── Header
    │   ├── Title + Subtitle
    │   └── Actions (Search, Filter, Create)
    ├── Workflow Grid
    │   ├── Workflow Cards
    │   └── Create New Card
    └── Empty State (when no workflows)
```

---

## Animations

- Cards: Staggered fade in on load
- Card hover: Lift + glow (200ms)
- Create card hover: Border + background change (200ms)

```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.workflow-card {
  animation: fadeInUp 300ms ease-out;
  animation-fill-mode: both;
}

.workflow-card:nth-child(1) { animation-delay: 0ms; }
.workflow-card:nth-child(2) { animation-delay: 50ms; }
.workflow-card:nth-child(3) { animation-delay: 100ms; }
.workflow-card:nth-child(4) { animation-delay: 150ms; }
/* ... continue for more cards */
```
