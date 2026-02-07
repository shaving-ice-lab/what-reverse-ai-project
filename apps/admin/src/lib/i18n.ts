// ============================================
// Internationalization & Timezone Utilities
// ============================================

// ============================================
// Date/Time Formatting
// ============================================

export type DateFormatStyle = "full" | "long" | "medium" | "short" | "relative";

const DEFAULT_LOCALE = "en-US";
const DEFAULT_TIMEZONE = "America/New_York";

/**
 * Get the user's timezone from browser or fallback to default
 */
export function getUserTimezone(): string {
  if (typeof Intl !== "undefined") {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return DEFAULT_TIMEZONE;
    }
  }
  return DEFAULT_TIMEZONE;
}

/**
 * Get the user's locale from browser or fallback to default
 */
export function getUserLocale(): string {
  if (typeof navigator !== "undefined") {
    return navigator.language || DEFAULT_LOCALE;
  }
  return DEFAULT_LOCALE;
}

/**
 * Format a date with timezone support
 */
export function formatDate(
  date: Date | string | number,
  style: DateFormatStyle = "medium",
  options?: {
    locale?: string;
    timezone?: string;
    includeTime?: boolean;
  }
): string {
  const { locale = getUserLocale(), timezone = getUserTimezone(), includeTime = false } = options || {};
  const d = date instanceof Date ? date : new Date(date);

  if (isNaN(d.getTime())) {
    return "Invalid Date";
  }

  // Relative time for recent dates
  if (style === "relative") {
    return formatRelativeTime(d, locale);
  }

  const formatOptions: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
  };

  switch (style) {
    case "full":
      formatOptions.dateStyle = "full";
      if (includeTime) formatOptions.timeStyle = "long";
      break;
    case "long":
      formatOptions.dateStyle = "long";
      if (includeTime) formatOptions.timeStyle = "medium";
      break;
    case "medium":
      formatOptions.year = "numeric";
      formatOptions.month = "2-digit";
      formatOptions.day = "2-digit";
      if (includeTime) {
        formatOptions.hour = "2-digit";
        formatOptions.minute = "2-digit";
      }
      break;
    case "short":
      formatOptions.month = "2-digit";
      formatOptions.day = "2-digit";
      if (includeTime) {
        formatOptions.hour = "2-digit";
        formatOptions.minute = "2-digit";
      }
      break;
  }

  return new Intl.DateTimeFormat(locale, formatOptions).format(d);
}

/**
 * Format relative time (e.g., "3 minutes ago", "in 2 hours")
 */
export function formatRelativeTime(date: Date | string | number, locale = getUserLocale()): string {
  const d = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffSeconds = Math.round(diffMs / 1000);
  const diffMinutes = Math.round(diffSeconds / 60);
  const diffHours = Math.round(diffMinutes / 60);
  const diffDays = Math.round(diffHours / 24);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (Math.abs(diffSeconds) < 60) {
    return rtf.format(diffSeconds, "second");
  }
  if (Math.abs(diffMinutes) < 60) {
    return rtf.format(diffMinutes, "minute");
  }
  if (Math.abs(diffHours) < 24) {
    return rtf.format(diffHours, "hour");
  }
  if (Math.abs(diffDays) < 30) {
    return rtf.format(diffDays, "day");
  }

  // Fall back to absolute date for older dates
  return formatDate(d, "medium", { locale });
}

/**
 * Format datetime for display with timezone indicator
 */
export function formatDateTime(
  date: Date | string | number,
  options?: {
    locale?: string;
    timezone?: string;
    showTimezone?: boolean;
  }
): string {
  const { locale = getUserLocale(), timezone = getUserTimezone(), showTimezone = false } = options || {};
  const d = date instanceof Date ? date : new Date(date);

  const formatted = formatDate(d, "medium", { locale, timezone, includeTime: true });

  if (showTimezone) {
    const tzName = new Intl.DateTimeFormat(locale, {
      timeZone: timezone,
      timeZoneName: "short",
    })
      .formatToParts(d)
      .find((p) => p.type === "timeZoneName")?.value;

    return `${formatted} (${tzName || timezone})`;
  }

  return formatted;
}

// ============================================
// Number Formatting
// ============================================

/**
 * Format number with locale
 */
export function formatNumber(
  value: number,
  options?: {
    locale?: string;
    style?: "decimal" | "percent" | "currency";
    currency?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string {
  const {
    locale = getUserLocale(),
    style = "decimal",
    currency = "USD",
    minimumFractionDigits,
    maximumFractionDigits,
  } = options || {};

  const formatOptions: Intl.NumberFormatOptions = {
    style,
    minimumFractionDigits,
    maximumFractionDigits,
  };

  if (style === "currency") {
    formatOptions.currency = currency;
  }

  return new Intl.NumberFormat(locale, formatOptions).format(value);
}

/**
 * Format currency
 */
export function formatCurrency(
  value: number,
  currency = "USD",
  locale = getUserLocale()
): string {
  return formatNumber(value, {
    locale,
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Format percentage
 */
export function formatPercent(
  value: number,
  decimals = 1,
  locale = getUserLocale()
): string {
  return formatNumber(value / 100, {
    locale,
    style: "percent",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format compact number (e.g., 1.2K, 3.4M)
 */
export function formatCompactNumber(value: number, locale = getUserLocale()): string {
  return new Intl.NumberFormat(locale, {
    notation: "compact",
    compactDisplay: "short",
  }).format(value);
}

// ============================================
// Duration Formatting
// ============================================

/**
 * Format duration in milliseconds to human readable
 */
export function formatDuration(
  ms: number,
  options?: {
    locale?: string;
    style?: "narrow" | "short" | "long";
  }
): string {
  const { locale = getUserLocale(), style = "short" } = options || {};

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const parts: string[] = [];

  if (days > 0) {
    parts.push(formatDurationUnit(days, "day", locale, style));
  }
  if (hours % 24 > 0) {
    parts.push(formatDurationUnit(hours % 24, "hour", locale, style));
  }
  if (minutes % 60 > 0) {
    parts.push(formatDurationUnit(minutes % 60, "minute", locale, style));
  }
  if (seconds % 60 > 0 || parts.length === 0) {
    parts.push(formatDurationUnit(seconds % 60, "second", locale, style));
  }

  // Return first 2 significant units
  return parts.slice(0, 2).join(" ");
}

function formatDurationUnit(
  value: number,
  unit: Intl.RelativeTimeFormatUnit,
  locale: string,
  style: "narrow" | "short" | "long"
): string {
  // Use Intl for all locales
  const formatter = new Intl.NumberFormat(locale, {
    style: "unit",
    unit,
    unitDisplay: style,
  });
  return formatter.format(value);
}

// ============================================
// Translation Strings (Simplified)
// ============================================

const translations: Record<string, Record<string, string>> = {
  en: {
    "common.loading": "Loading...",
    "common.error": "An error occurred",
    "common.retry": "Retry",
    "common.cancel": "Cancel",
    "common.confirm": "Confirm",
    "common.save": "Save",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.create": "Create",
    "common.search": "Search",
    "common.filter": "Filter",
    "common.export": "Export",
    "common.import": "Import",
    "common.all": "All",
    "common.none": "None",
    "common.yes": "Yes",
    "common.no": "No",
    "status.active": "Active",
    "status.inactive": "Inactive",
    "status.suspended": "Suspended",
    "status.pending": "Pending",
    "status.completed": "Completed",
    "status.failed": "Failed",
    "user.role.admin": "Admin",
    "user.role.user": "User",
    "user.status.active": "Active",
    "user.status.suspended": "Suspended",
    "ticket.priority.low": "Low",
    "ticket.priority.medium": "Medium",
    "ticket.priority.high": "High",
    "ticket.priority.urgent": "Urgent",
  },
  "zh-CN": {
    "common.loading": "Loading...",
    "common.error": "An error occurred",
    "common.retry": "Retry",
    "common.cancel": "Cancel",
    "common.confirm": "Confirm",
    "common.save": "Save",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.create": "Create",
    "common.search": "Search",
    "common.filter": "Filter",
    "common.export": "Export",
    "common.import": "Import",
    "common.all": "All",
    "common.none": "None",
    "common.yes": "Yes",
    "common.no": "No",
    "status.active": "Active",
    "status.inactive": "Inactive",
    "status.suspended": "Suspended",
    "status.pending": "Pending",
    "status.completed": "Completed",
    "status.failed": "Failed",
    "user.role.admin": "Admin",
    "user.role.user": "User",
    "user.status.active": "Active",
    "user.status.suspended": "Suspended",
    "ticket.priority.low": "Low",
    "ticket.priority.medium": "Medium",
    "ticket.priority.high": "High",
    "ticket.priority.urgent": "Urgent",
  },
};

/**
 * Simple translation function
 */
export function t(key: string, locale = getUserLocale()): string {
  const lang = locale.split("-")[0];
  const fullLocale = translations[locale] ? locale : lang;
  return translations[fullLocale]?.[key] || translations["en"]?.[key] || key;
}

/**
 * Get supported locales
 */
export function getSupportedLocales(): { code: string; name: string }[] {
  return [
    { code: "en", name: "English" },
    { code: "zh-CN", name: "Simplified Chinese" },
  ];
}

/**
 * Get common timezones
 */
export function getCommonTimezones(): { value: string; label: string }[] {
  return [
    { value: "Asia/Shanghai", label: "China Standard Time (UTC+8)" },
    { value: "Asia/Tokyo", label: "Japan Standard Time (UTC+9)" },
    { value: "Asia/Singapore", label: "Singapore Time (UTC+8)" },
    { value: "America/New_York", label: "US Eastern Time (UTC-5/-4)" },
    { value: "America/Los_Angeles", label: "US Pacific Time (UTC-8/-7)" },
    { value: "Europe/London", label: "UK Time (UTC+0/+1)" },
    { value: "Europe/Paris", label: "Central European Time (UTC+1/+2)" },
    { value: "UTC", label: "Coordinated Universal Time (UTC)" },
  ];
}
