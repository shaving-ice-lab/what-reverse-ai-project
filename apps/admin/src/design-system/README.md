# Admin Design System Specification

> Version: v1.0  
> Updated: 2026-02-03  
> Status: Active

This document defines the design system specification for `apps/admin`, ensuring visual consistency with `apps/web`.

---

## 1. Design System Reuse Strategy

### 1.1 Reuse Strategy

Currently adopting a **Copy Strategy**, copying core styles and components from `apps/web` to `apps/admin` and keeping them in sync.

**Rationale:**
- Admin project has high independence and requires rapid iteration
- Avoids introducing cross-project dependency complexity
- Components have customization needs specific to Admin scenarios

**Evolution Path:**
```
Current: Copy Strategy → Mid-term: packages/ui shared package → Long-term: Design System Monorepo
```

### 1.2 Sync Checklist

| Source | Target | Synced Content |
|--------|--------|----------------|
| `apps/web/src/app/globals.css` | `apps/admin/src/app/globals.css` | Theme variables, fonts, animations |
| `apps/web/src/components/ui/*` | `apps/admin/src/components/ui/*` | Base UI components |
| `apps/web/src/lib/utils.ts` | `apps/admin/src/lib/utils.ts` | Utility functions |

### 1.3 Version Comparison

| Component/Module | Web Version | Admin Version | Status |
|------------------|-------------|---------------|--------|
| globals.css | v1.0 | v1.0 | ✅ Synced |
| Button | v1.0 | v1.0 | ✅ Synced |
| Input | v1.0 | v1.0 | ✅ Synced |
| Table | v1.0 | v1.0 | ✅ Synced |
| Badge | v1.0 | v1.0 | ✅ Synced |
| Dialog | v1.0 | v1.0 | ✅ Synced |
| Card | v1.0 | v1.0 | ✅ Synced |

---

## 2. Color System

### 2.1 Brand Colors

```css
--color-brand-200: #1a3a2a;  /* Dark green background */
--color-brand-300: #1f4a35;  /* Secondary dark green */
--color-brand-400: #2a6348;  /* Medium green */
--color-brand-500: #3ECF8E;  /* Primary brand green */
--color-brand-600: #5fd9a3;  /* Bright green */
```

### 2.2 Background Colors

```css
--color-background: #111111;         /* Primary background */
--color-background-200: #181818;     /* Secondary background */
--color-background-studio: #0f0f0f;  /* Studio background */
--color-surface-75: #1a1a1a;         /* Card background - deep */
--color-surface-100: #1f1f1f;        /* Card background */
--color-surface-200: #242424;        /* Hover background */
--color-surface-300: #2b2b2b;        /* Active background */
```

### 2.3 Semantic Colors

```css
/* Success */
--color-success: #3ECF8E;
--color-success-200: #1a3a2a;

/* Warning */
--color-warning: #f59e0b;
--color-warning-200: #3b2e0a;
--color-warning-400: #d97706;

/* Error/Danger */
--color-destructive: #ef4444;
--color-destructive-200: #3b1818;
--color-destructive-400: #dc2626;
```

---

## 3. Typography System

### 3.1 Font Stack

```css
font-family: var(--font-mono); /* JetBrains Mono, monospace */
letter-spacing: 0.02em;
```

### 3.2 Font Size Specification

| Usage | Size | Line Height | Weight | CSS Class |
|-------|------|-------------|--------|-----------|
| Page Title | 1.25rem (20px) | 1.75rem | 600 | `.page-title` |
| Section Title | 1.125rem (18px) | 1.5rem | 600 | `.text-section-title` |
| Card Title | 13px | 1.25rem | 500 | `.page-panel-title` |
| Body Text | 13px | 1.25rem | 400 | Default |
| Description | 12px | 1rem | 400 | `.page-description` |
| Small Text | 11px | 0.875rem | 400 | `.text-small` |
| Category Label | 10px | 1rem | 500 | `.page-caption` |
| Table Header | 10px | 1rem | 500 | `.text-table-header` |

---

## 4. Icon System

### 4.1 Icon Library

Using **Lucide React** as the unified icon library.

```tsx
import { Users, Settings, ChevronRight } from "lucide-react";
```

### 4.2 Icon Sizes

| Scenario | Size | CSS Class |
|----------|------|-----------|
| Inside Button | 16px (w-4 h-4) | Default |
| Navigation Item | 16px | - |
| Page Header | 16px | - |
| Status Icon | 20px (w-5 h-5) | - |
| Empty State | 24px (w-6 h-6) | - |
| Large Icon | 32px (w-8 h-8) | - |

---

## 5. Grid & Spacing

### 5.1 Grid System

- Max page width: `1280px`
- Padding: `24px` (px-6)
- Card gap: `16px` (gap-4) or `24px` (gap-6)

### 5.2 Spacing Specification

| Token | Value | Usage |
|-------|-------|-------|
| spacing-1 | 4px | Compact spacing |
| spacing-2 | 8px | Element inner spacing |
| spacing-3 | 12px | Small component spacing |
| spacing-4 | 16px | Standard spacing |
| spacing-5 | 20px | Section spacing |
| spacing-6 | 24px | Page padding |
| spacing-8 | 32px | Large section spacing |

---

## 6. Border Radius Specification

| Token | Value | Usage |
|-------|-------|-------|
| radius-sm | 4px | Small buttons, badges |
| radius-md | 6px | Inputs, buttons |
| radius-lg | 8px | Cards, modals |
| radius-xl | 12px | Large cards |
| radius-full | 9999px | Avatars, tags |

---

## 7. Border Specification

```css
--color-border: #2a2a2a;        /* Default border */
--color-border-muted: #242424;  /* Muted border */
--color-border-strong: #3a3a3a; /* Strong border */
```

---

## 8. Shadow Specification

```css
/* Card shadow */
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);

/* Hover shadow */
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);

/* Modal shadow */
box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);

/* Brand glow */
box-shadow: 0 0 20px rgba(62, 207, 142, 0.3);
```

---

## 9. Animation Specification

### 9.1 Transition Duration

| Scenario | Duration | Easing |
|----------|----------|--------|
| Micro-interaction | 150ms | ease |
| State Change | 200ms | ease-out |
| Enter Animation | 300ms | ease-out |
| Complex Animation | 500ms | ease-in-out |

### 9.2 Preset Animations

```css
.animate-fadeIn      /* Fade in */
.animate-fadeInUp    /* Fade in and slide up */
.animate-scale-in    /* Scale in */
.animate-shimmer     /* Skeleton shimmer */
.animate-pulse-soft  /* Soft pulse */
```

---

## 10. Component Index

### 10.1 Base Components

| Component | Path | Description |
|-----------|------|-------------|
| Button | `components/ui/button.tsx` | Button (multiple variants) |
| Input | `components/ui/input.tsx` | Input field |
| Badge | `components/ui/badge.tsx` | Badge |
| Card | `components/ui/card.tsx` | Card container |
| Dialog | `components/ui/dialog.tsx` | Dialog/Modal |
| Table | `components/ui/table.tsx` | Table |
| Switch | `components/ui/switch.tsx` | Switch toggle |
| Pagination | `components/ui/pagination.tsx` | Pagination |

### 10.2 Layout Components

| Component | Path | Description |
|-----------|------|-------------|
| PageContainer | `components/dashboard/page-layout.tsx` | Page container |
| PageHeader | `components/dashboard/page-layout.tsx` | Page header |
| SettingsSection | `components/dashboard/page-layout.tsx` | Settings section |
| AdminShell | `components/layout/admin-shell.tsx` | Admin shell |

### 10.3 State Components

| Component | Path | Description |
|-----------|------|-------------|
| LoadingState | `components/ui/data-states.tsx` | Loading state |
| EmptyState | `components/ui/data-states.tsx` | Empty state |
| ErrorState | `components/ui/data-states.tsx` | Error state |
| WarningState | `components/ui/data-states.tsx` | Warning state |
| Skeleton | `components/ui/data-states.tsx` | Skeleton loader |

---

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2026-02-03 | v1.0 | Initial version, defined color/typography/icon/grid/animation specs |
