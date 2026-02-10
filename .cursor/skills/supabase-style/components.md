# Supabase 组件详细参考

完整的 Supabase 风格组件代码示例。

## Navigation 导航组件

### Top Navigation Bar

```tsx
export function TopNav() {
  return (
    <header className="sticky top-0 z-50 h-14 border-b border-border bg-background-studio/95 backdrop-blur supports-[backdrop-filter]:bg-background-studio/60">
      <div className="flex h-full items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center gap-6">
          <a href="/" className="flex items-center gap-2">
            <svg className="h-6 w-6 text-brand-500" viewBox="0 0 24 24">
              {/* Supabase logo SVG */}
            </svg>
            <span className="font-semibold text-foreground">App Name</span>
          </a>

          {/* Breadcrumb / Project Selector */}
          <div className="hidden md:flex items-center gap-2 text-sm">
            <span className="text-foreground-muted">/</span>
            <button className="flex items-center gap-1 text-foreground-light hover:text-foreground">
              Project Name
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          <button className="p-2 text-foreground-light hover:text-foreground hover:bg-surface-100 rounded-md">
            <Bell className="w-5 h-5" />
          </button>
          <button className="p-2 text-foreground-light hover:text-foreground hover:bg-surface-100 rounded-md">
            <HelpCircle className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-sm font-medium text-background">
            U
          </div>
        </div>
      </div>
    </header>
  )
}
```

### Sidebar Navigation

```tsx
const navItems = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: Database, label: 'Database', href: '/database' },
  { icon: Key, label: 'Authentication', href: '/auth' },
  { icon: HardDrive, label: 'Storage', href: '/storage' },
  { icon: Zap, label: 'Edge Functions', href: '/functions' },
  { icon: Settings, label: 'Settings', href: '/settings' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 border-r border-border bg-background-studio min-h-screen">
      <nav className="p-2 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <a
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                isActive
                  ? 'bg-surface-200 text-foreground'
                  : 'text-foreground-light hover:text-foreground hover:bg-surface-100'
              )}
            >
              <item.icon className={cn('w-4 h-4', isActive && 'text-brand-500')} />
              {item.label}
            </a>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
        <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-foreground-light hover:text-foreground hover:bg-surface-100 rounded-md">
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
```

## Form 表单组件

### Input with Label

```tsx
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  description?: string
  error?: string
}

export function Input({ label, description, error, className, ...props }: InputProps) {
  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium text-foreground-light">{label}</label>}
      <input
        className={cn(
          'flex h-10 w-full rounded-md border bg-surface-200 px-3 py-2 text-sm text-foreground',
          'placeholder:text-foreground-muted',
          'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-0 focus:border-brand-500',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error ? 'border-destructive-400' : 'border-border',
          className
        )}
        {...props}
      />
      {description && !error && <p className="text-xs text-foreground-muted">{description}</p>}
      {error && <p className="text-xs text-destructive-400">{error}</p>}
    </div>
  )
}
```

### Select Dropdown

```tsx
export function Select({ label, options, ...props }) {
  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium text-foreground-light">{label}</label>}
      <div className="relative">
        <select
          className="flex h-10 w-full appearance-none rounded-md border border-border bg-surface-200 px-3 py-2 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted pointer-events-none" />
      </div>
    </div>
  )
}
```

### Textarea

```tsx
export function Textarea({ label, ...props }) {
  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium text-foreground-light">{label}</label>}
      <textarea
        className="flex min-h-[120px] w-full rounded-md border border-border bg-surface-200 px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 resize-none"
        {...props}
      />
    </div>
  )
}
```

### Toggle / Switch

```tsx
export function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors',
          checked ? 'bg-brand-500' : 'bg-surface-300'
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transition-transform',
            checked ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </button>
      {label && <span className="text-sm text-foreground-light">{label}</span>}
    </label>
  )
}
```

### Checkbox

```tsx
export function Checkbox({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <button
        role="checkbox"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'flex h-4 w-4 items-center justify-center rounded border transition-colors',
          checked
            ? 'bg-brand-500 border-brand-500'
            : 'border-border-strong bg-surface-200 hover:border-foreground-muted'
        )}
      >
        {checked && <Check className="h-3 w-3 text-background" />}
      </button>
      {label && <span className="text-sm text-foreground-light">{label}</span>}
    </label>
  )
}
```

## Data Display 数据展示

### Stats Card

```tsx
export function StatsCard({ title, value, change, icon: Icon }) {
  const isPositive = change >= 0

  return (
    <div className="bg-surface-100 border border-border rounded-lg p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground-light">{title}</p>
        {Icon && <Icon className="w-4 h-4 text-foreground-muted" />}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <p className="text-2xl font-semibold text-foreground">{value}</p>
        <span
          className={cn(
            'text-sm font-medium',
            isPositive ? 'text-brand-500' : 'text-destructive-400'
          )}
        >
          {isPositive ? '+' : ''}
          {change}%
        </span>
      </div>
    </div>
  )
}
```

### Data Table

```tsx
export function DataTable({ columns, data }) {
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-surface-200 border-b border-border">
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-left text-xs font-medium text-foreground-light uppercase tracking-wider"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.map((row, i) => (
            <tr key={i} className="bg-background-200 hover:bg-surface-100 transition-colors">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-sm text-foreground">
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

### Empty State

```tsx
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="rounded-full bg-surface-200 p-4 mb-4">
        <Icon className="w-8 h-8 text-foreground-muted" />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-2">{title}</h3>
      <p className="text-sm text-foreground-light max-w-sm mb-6">{description}</p>
      {action && (
        <button className="bg-brand-500 hover:bg-brand-600 text-background px-4 py-2 rounded-md font-medium transition-colors">
          {action.label}
        </button>
      )}
    </div>
  )
}
```

## Feedback 反馈组件

### Toast / Notification

```tsx
export function Toast({ type = 'info', title, message, onClose }) {
  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
  }
  const colors = {
    success: 'text-brand-500',
    error: 'text-destructive-400',
    warning: 'text-warning-400',
    info: 'text-foreground-light',
  }
  const Icon = icons[type]

  return (
    <div className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg bg-surface-100 border border-border shadow-lg animate-slide-in">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <Icon className={cn('h-5 w-5 mt-0.5', colors[type])} />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">{title}</p>
            {message && <p className="mt-1 text-sm text-foreground-light">{message}</p>}
          </div>
          <button onClick={onClose} className="text-foreground-muted hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
```

### Alert Banner

```tsx
export function Alert({ type = 'info', children }) {
  const styles = {
    info: 'bg-surface-200 border-border text-foreground-light',
    success: 'bg-brand-200 border-brand-400 text-brand-500',
    warning: 'bg-warning-200 border-warning-400 text-warning-400',
    error: 'bg-destructive-200 border-destructive-400 text-destructive-400',
  }

  return <div className={cn('rounded-md border p-4 text-sm', styles[type])}>{children}</div>
}
```

### Loading Spinner

```tsx
export function Spinner({ size = 'md' }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }

  return (
    <svg
      className={cn('animate-spin text-brand-500', sizes[size])}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}
```

### Badge

```tsx
export function Badge({ variant = 'default', children }) {
  const variants = {
    default: 'bg-surface-300 text-foreground-light',
    brand: 'bg-brand-200 text-brand-500',
    success: 'bg-brand-200 text-brand-500',
    warning: 'bg-warning-200 text-warning-400',
    destructive: 'bg-destructive-200 text-destructive-400',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[variant]
      )}
    >
      {children}
    </span>
  )
}
```

## Overlay 覆盖层组件

### Modal / Dialog

```tsx
export function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />

      {/* Content */}
      <div className="relative bg-surface-100 border border-border rounded-lg w-full max-w-lg shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-medium text-foreground">{title}</h2>
          <button onClick={onClose} className="text-foreground-muted hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-border bg-surface-75">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
```

### Dropdown Menu

```tsx
export function DropdownMenu({ trigger, items }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}>{trigger}</button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-56 z-50 bg-surface-100 border border-border rounded-md shadow-lg py-1 animate-fade-in">
            {items.map((item, i) =>
              item.separator ? (
                <div key={i} className="my-1 border-t border-border" />
              ) : (
                <button
                  key={i}
                  onClick={() => {
                    item.onClick?.()
                    setOpen(false)
                  }}
                  className={cn(
                    'w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground-light hover:text-foreground hover:bg-surface-200',
                    item.destructive && 'text-destructive-400 hover:text-destructive'
                  )}
                >
                  {item.icon && <item.icon className="w-4 h-4" />}
                  {item.label}
                </button>
              )
            )}
          </div>
        </>
      )}
    </div>
  )
}
```

### Tooltip

```tsx
export function Tooltip({ children, content }) {
  return (
    <div className="relative group">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-surface-300 border border-border rounded-md text-xs text-foreground whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
        {content}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-surface-300" />
      </div>
    </div>
  )
}
```
