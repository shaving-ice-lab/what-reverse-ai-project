// ============================================
// Internationalization & Timezone Utilities
// ============================================

// ============================================
// Date/Time Formatting
// ============================================

export type DateFormatStyle = "full" | "long" | "medium" | "short" | "relative";

const DEFAULT_LOCALE = "zh-CN";
const DEFAULT_TIMEZONE = "Asia/Shanghai";

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
    return "无效日期";
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
 * Format relative time (e.g., "3 分钟前", "2 小时后")
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
    currency = "CNY",
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
  currency = "CNY",
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
  // Use a simple approach for Chinese
  if (locale.startsWith("zh")) {
    const unitMap: Record<string, string> = {
      day: "天",
      hour: "小时",
      minute: "分钟",
      second: "秒",
    };
    return `${value}${unitMap[unit] || unit}`;
  }

  // Use Intl for other locales
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
  "zh-CN": {
    "common.loading": "加载中...",
    "common.error": "发生错误",
    "common.retry": "重试",
    "common.cancel": "取消",
    "common.confirm": "确认",
    "common.save": "保存",
    "common.delete": "删除",
    "common.edit": "编辑",
    "common.create": "创建",
    "common.search": "搜索",
    "common.filter": "筛选",
    "common.export": "导出",
    "common.import": "导入",
    "common.all": "全部",
    "common.none": "无",
    "common.yes": "是",
    "common.no": "否",
    "status.active": "活跃",
    "status.inactive": "非活跃",
    "status.suspended": "已暂停",
    "status.pending": "待处理",
    "status.completed": "已完成",
    "status.failed": "失败",
    "user.role.admin": "管理员",
    "user.role.user": "普通用户",
    "user.status.active": "活跃",
    "user.status.suspended": "已暂停",
    "ticket.priority.low": "低",
    "ticket.priority.medium": "中",
    "ticket.priority.high": "高",
    "ticket.priority.urgent": "紧急",
  },
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
};

/**
 * Simple translation function
 */
export function t(key: string, locale = getUserLocale()): string {
  const lang = locale.split("-")[0];
  const fullLocale = translations[locale] ? locale : lang;
  return translations[fullLocale]?.[key] || translations["zh-CN"]?.[key] || key;
}

/**
 * Get supported locales
 */
export function getSupportedLocales(): { code: string; name: string }[] {
  return [
    { code: "zh-CN", name: "简体中文" },
    { code: "en", name: "English" },
  ];
}

/**
 * Get common timezones
 */
export function getCommonTimezones(): { value: string; label: string }[] {
  return [
    { value: "Asia/Shanghai", label: "中国标准时间 (UTC+8)" },
    { value: "Asia/Tokyo", label: "日本标准时间 (UTC+9)" },
    { value: "Asia/Singapore", label: "新加坡时间 (UTC+8)" },
    { value: "America/New_York", label: "美国东部时间 (UTC-5/-4)" },
    { value: "America/Los_Angeles", label: "美国太平洋时间 (UTC-8/-7)" },
    { value: "Europe/London", label: "英国时间 (UTC+0/+1)" },
    { value: "Europe/Paris", label: "中欧时间 (UTC+1/+2)" },
    { value: "UTC", label: "协调世界时 (UTC)" },
  ];
}
