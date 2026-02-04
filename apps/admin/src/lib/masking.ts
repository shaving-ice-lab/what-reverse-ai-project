/**
 * 敏感字段脱敏工具库
 * 提供邮箱、密钥、支付信息等敏感数据的脱敏处理
 */

// ===== 脱敏策略类型 =====

export type MaskingStrategy =
  | "email"
  | "phone"
  | "id_card"
  | "bank_card"
  | "api_key"
  | "secret"
  | "ip_address"
  | "name"
  | "partial"
  | "full";

export interface MaskingOptions {
  strategy: MaskingStrategy;
  showPrefix?: number;
  showSuffix?: number;
  maskChar?: string;
  preserveFormat?: boolean;
}

// ===== 脱敏函数 =====

/**
 * 邮箱脱敏
 * 示例: john.doe@example.com -> j***e@example.com
 */
export function maskEmail(email: string): string {
  if (!email || typeof email !== "string") return "";
  const [localPart, domain] = email.split("@");
  if (!domain) return maskPartial(email, 1, 1);

  if (localPart.length <= 2) {
    return `${localPart[0] || ""}***@${domain}`;
  }

  return `${localPart[0]}***${localPart[localPart.length - 1]}@${domain}`;
}

/**
 * 手机号脱敏
 * 示例: 13812345678 -> 138****5678
 */
export function maskPhone(phone: string): string {
  if (!phone || typeof phone !== "string") return "";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length < 7) return maskPartial(cleaned, 2, 2);

  const prefix = cleaned.slice(0, 3);
  const suffix = cleaned.slice(-4);
  return `${prefix}****${suffix}`;
}

/**
 * 身份证号脱敏
 * 示例: 110101199001011234 -> 110101********1234
 */
export function maskIdCard(idCard: string): string {
  if (!idCard || typeof idCard !== "string") return "";
  const cleaned = idCard.replace(/\s/g, "");
  if (cleaned.length < 8) return maskPartial(cleaned, 2, 2);

  const prefix = cleaned.slice(0, 6);
  const suffix = cleaned.slice(-4);
  const maskLength = cleaned.length - 10;
  return `${prefix}${"*".repeat(maskLength > 0 ? maskLength : 4)}${suffix}`;
}

/**
 * 银行卡号脱敏
 * 示例: 6222021234567890123 -> 6222 **** **** 0123
 */
export function maskBankCard(cardNumber: string, preserveFormat = true): string {
  if (!cardNumber || typeof cardNumber !== "string") return "";
  const cleaned = cardNumber.replace(/\s/g, "");
  if (cleaned.length < 8) return maskPartial(cleaned, 2, 2);

  const prefix = cleaned.slice(0, 4);
  const suffix = cleaned.slice(-4);

  if (preserveFormat) {
    return `${prefix} **** **** ${suffix}`;
  }

  return `${prefix}${"*".repeat(cleaned.length - 8)}${suffix}`;
}

/**
 * API 密钥脱敏
 * 示例: sk_live_1234567890abcdef -> sk_live_****cdef
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey || typeof apiKey !== "string") return "";
  if (apiKey.length <= 8) return "****";

  // 查找前缀（如 sk_live_, pk_test_ 等）
  const prefixMatch = apiKey.match(/^([a-z_]+_)/i);
  const prefix = prefixMatch ? prefixMatch[1] : "";
  const keyPart = prefix ? apiKey.slice(prefix.length) : apiKey;

  if (keyPart.length <= 4) {
    return `${prefix}****`;
  }

  const suffix = keyPart.slice(-4);
  return `${prefix}****${suffix}`;
}

/**
 * 通用密钥/Secret 脱敏
 * 示例: abcdef123456789xyz -> ****
 */
export function maskSecret(secret: string, showSuffix = 0): string {
  if (!secret || typeof secret !== "string") return "";
  if (showSuffix <= 0 || secret.length <= showSuffix) return "****";
  return `****${secret.slice(-showSuffix)}`;
}

/**
 * IP 地址脱敏
 * 示例: 192.168.1.100 -> 192.168.*.100
 */
export function maskIpAddress(ip: string): string {
  if (!ip || typeof ip !== "string") return "";

  // IPv4
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) {
    const parts = ip.split(".");
    return `${parts[0]}.${parts[1]}.*.${parts[3]}`;
  }

  // IPv6 简单处理
  if (ip.includes(":")) {
    const parts = ip.split(":");
    if (parts.length >= 4) {
      return `${parts[0]}:${parts[1]}:****:${parts[parts.length - 1]}`;
    }
  }

  return maskPartial(ip, 4, 4);
}

/**
 * 姓名脱敏
 * 示例: 张三 -> 张* | John Doe -> J*** D**
 */
export function maskName(name: string): string {
  if (!name || typeof name !== "string") return "";
  const trimmed = name.trim();
  if (trimmed.length === 0) return "";

  // 中文名
  if (/[\u4e00-\u9fa5]/.test(trimmed)) {
    if (trimmed.length === 1) return trimmed;
    if (trimmed.length === 2) return `${trimmed[0]}*`;
    return `${trimmed[0]}${"*".repeat(trimmed.length - 2)}${trimmed[trimmed.length - 1]}`;
  }

  // 英文名
  const parts = trimmed.split(/\s+/);
  return parts
    .map((part) => {
      if (part.length <= 1) return part;
      return `${part[0]}${"*".repeat(part.length - 1)}`;
    })
    .join(" ");
}

/**
 * 部分脱敏
 * 保留前 N 位和后 M 位
 */
export function maskPartial(
  value: string,
  showPrefix = 2,
  showSuffix = 2,
  maskChar = "*"
): string {
  if (!value || typeof value !== "string") return "";
  if (value.length <= showPrefix + showSuffix) {
    return maskChar.repeat(value.length);
  }

  const prefix = value.slice(0, showPrefix);
  const suffix = value.slice(-showSuffix);
  const maskLength = value.length - showPrefix - showSuffix;
  return `${prefix}${maskChar.repeat(maskLength)}${suffix}`;
}

/**
 * 完全脱敏
 */
export function maskFull(value: string, maskChar = "*", length?: number): string {
  if (!value || typeof value !== "string") return "";
  const maskLength = length ?? value.length;
  return maskChar.repeat(Math.min(maskLength, 8));
}

// ===== 统一脱敏入口 =====

/**
 * 根据策略脱敏数据
 */
export function maskValue(value: string, options: MaskingOptions): string {
  if (!value) return "";

  switch (options.strategy) {
    case "email":
      return maskEmail(value);
    case "phone":
      return maskPhone(value);
    case "id_card":
      return maskIdCard(value);
    case "bank_card":
      return maskBankCard(value, options.preserveFormat);
    case "api_key":
      return maskApiKey(value);
    case "secret":
      return maskSecret(value, options.showSuffix);
    case "ip_address":
      return maskIpAddress(value);
    case "name":
      return maskName(value);
    case "partial":
      return maskPartial(value, options.showPrefix, options.showSuffix, options.maskChar);
    case "full":
      return maskFull(value, options.maskChar);
    default:
      return value;
  }
}

// ===== 字段脱敏配置 =====

export interface FieldMaskingConfig {
  field: string;
  strategy: MaskingStrategy;
  options?: Partial<MaskingOptions>;
}

/**
 * 默认字段脱敏配置
 */
export const DEFAULT_FIELD_MASKING: FieldMaskingConfig[] = [
  { field: "email", strategy: "email" },
  { field: "phone", strategy: "phone" },
  { field: "mobile", strategy: "phone" },
  { field: "id_card", strategy: "id_card" },
  { field: "id_number", strategy: "id_card" },
  { field: "bank_card", strategy: "bank_card" },
  { field: "card_number", strategy: "bank_card" },
  { field: "api_key", strategy: "api_key" },
  { field: "secret_key", strategy: "secret" },
  { field: "access_token", strategy: "secret" },
  { field: "refresh_token", strategy: "secret" },
  { field: "password", strategy: "full" },
  { field: "ip_address", strategy: "ip_address" },
  { field: "ip", strategy: "ip_address" },
  { field: "name", strategy: "name" },
  { field: "real_name", strategy: "name" },
];

/**
 * 根据字段名获取脱敏配置
 */
export function getFieldMaskingConfig(fieldName: string): FieldMaskingConfig | undefined {
  const lowerField = fieldName.toLowerCase();
  return DEFAULT_FIELD_MASKING.find((config) =>
    lowerField.includes(config.field) || config.field.includes(lowerField)
  );
}

/**
 * 自动脱敏对象中的敏感字段
 */
export function maskSensitiveFields<T extends Record<string, unknown>>(
  obj: T,
  customConfig?: FieldMaskingConfig[]
): T {
  const config = customConfig || DEFAULT_FIELD_MASKING;
  const result = { ...obj };

  for (const key of Object.keys(result)) {
    const value = result[key];
    if (typeof value !== "string") continue;

    const fieldConfig = config.find((c) => {
      const lowerKey = key.toLowerCase();
      return lowerKey.includes(c.field) || c.field.includes(lowerKey);
    });

    if (fieldConfig) {
      (result as Record<string, unknown>)[key] = maskValue(value, {
        strategy: fieldConfig.strategy,
        ...fieldConfig.options,
      });
    }
  }

  return result;
}

// ===== 显示控制 =====

export interface MaskedValue {
  masked: string;
  original: string;
  isMasked: boolean;
}

/**
 * 创建可切换显示的脱敏值
 */
export function createMaskedValue(
  value: string,
  options: MaskingOptions
): MaskedValue {
  return {
    masked: maskValue(value, options),
    original: value,
    isMasked: true,
  };
}

/**
 * 检查用户是否有权查看敏感数据
 */
export function canViewSensitiveData(
  userRole: string,
  fieldType: MaskingStrategy
): boolean {
  // 超级管理员可以查看所有敏感数据
  if (userRole === "super_admin") return true;

  // 财务角色可以查看支付相关数据
  if (userRole === "finance") {
    return ["bank_card", "partial"].includes(fieldType);
  }

  // 运维角色可以查看密钥和 IP
  if (userRole === "ops") {
    return ["api_key", "secret", "ip_address"].includes(fieldType);
  }

  // 其他角色默认不能查看敏感数据
  return false;
}
