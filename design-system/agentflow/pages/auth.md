# Auth Page Overrides (Login/Register)

> **PROJECT:** AgentFlow
> **Style:** Manus-inspired Dark AI Theme
> **Page Type:** Authentication

> ⚠️ **IMPORTANT:** Rules in this file **override** the Master file (`design-system/MASTER.md`).
> Only deviations from the Master are documented here. For all other rules, refer to the Master.

---

## Page-Specific Rules

### Layout

- **Max Width:** 400px (form container)
- **Layout:** Centered vertically and horizontally
- **Background:** Full-screen mesh gradient background

```css
.auth-background {
  background-color: #09090b;
  background-image:
    radial-gradient(at 0% 0%, hsla(268, 90%, 55%, 0.2) 0px, transparent 50%),
    radial-gradient(at 100% 100%, hsla(189, 100%, 56%, 0.15) 0px, transparent 50%),
    radial-gradient(at 50% 50%, hsla(268, 90%, 55%, 0.1) 0px, transparent 50%);
  min-height: 100vh;
}
```

### Form Card

```css
.auth-card {
  background: rgba(24, 24, 27, 0.9);
  backdrop-filter: blur(16px);
  border: 1px solid #27272a;
  border-radius: 16px;
  padding: 32px;
  width: 100%;
  max-width: 400px;
}
```

### Typography Overrides

- **Logo/Brand:** 24px, font-weight 700
- **Heading:** 20px "Welcome back" / "Create account"
- **Subheading:** 14px, text-secondary color

### Input Fields

```css
.auth-input {
  background: #0f0f12;
  border: 1px solid #3f3f46;
  border-radius: 8px;
  padding: 12px 16px;
  color: #fafafa;
  font-size: 14px;
  width: 100%;
}

.auth-input:focus {
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2);
}

.auth-label {
  font-size: 14px;
  font-weight: 500;
  color: #fafafa;
  margin-bottom: 8px;
}
```

### Submit Button

```css
.auth-submit {
  background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
  color: white;
  width: 100%;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  transition: all 200ms ease;
  cursor: pointer;
}

.auth-submit:hover {
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.4);
  transform: translateY(-1px);
}

.auth-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
```

### Social Login Buttons

```css
.social-btn {
  background: #18181b;
  border: 1px solid #3f3f46;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #fafafa;
  font-size: 14px;
  font-weight: 500;
  transition: all 200ms ease;
  cursor: pointer;
}

.social-btn:hover {
  background: #27272a;
  border-color: #52525b;
}
```

### Divider

```css
.auth-divider {
  display: flex;
  align-items: center;
  gap: 16px;
  color: #71717a;
  font-size: 12px;
}

.auth-divider::before,
.auth-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #3f3f46;
}
```

### Links

```css
.auth-link {
  color: #8b5cf6;
  font-size: 14px;
  text-decoration: none;
  transition: color 150ms ease;
}

.auth-link:hover {
  color: #a78bfa;
}
```

---

## Component Structure

```
Auth Page
├── Background (mesh gradient)
└── Card Container (glass effect)
    ├── Logo/Brand
    ├── Heading ("Welcome back" / "Create account")
    ├── Subheading
    ├── Social Login Buttons (GitHub, Google)
    ├── Divider ("or continue with")
    ├── Form
    │   ├── Email Input
    │   ├── Password Input
    │   └── Submit Button
    ├── Footer Links (Forgot password / Sign up)
    └── Terms Text (small, muted)
```

---

## Animations

- Form card: Fade in + slide up on mount (300ms)
- Input focus: Smooth border color transition (200ms)
- Button hover: Glow effect (200ms)
- Error shake: Subtle horizontal shake on validation error

```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.auth-card {
  animation: fadeInUp 300ms ease-out;
}
```
