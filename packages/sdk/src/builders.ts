/**
 * 输入/输出字段构建器
 */

import type {
  DataType,
  InputFieldConfig,
  OutputFieldConfig,
  ValidationRule,
  ShowIfCondition,
  UIComponentType,
  SelectOption,
  ExtractDataTypeValue,
} from "./types";

// ===== 输入字段构建器 =====

/** 输入字段构建器 */
class InputBuilder<TType extends DataType, TValue = ExtractDataTypeValue<TType>> {
  protected config: InputFieldConfig<TValue, TType>;

  constructor(type: TType, label: string) {
    this.config = {
      type,
      label,
      required: false,
    };
  }

  /** 设置描述 */
  description(desc: string): this {
    this.config.description = desc;
    return this;
  }

  /** 设置默认值 */
  default(value: TValue): this {
    this.config.defaultValue = value;
    return this;
  }

  /** 标记为必填 */
  required(): this {
    this.config.required = true;
    return this;
  }

  /** 标记为可选 */
  optional(): this {
    this.config.required = false;
    return this;
  }

  /** 设置占位符 */
  placeholder(text: string): this {
    this.config.placeholder = text;
    return this;
  }

  /** 添加验证规则 */
  validate(rule: ValidationRule): this {
    if (!this.config.validation) {
      this.config.validation = [];
    }
    this.config.validation.push(rule);
    return this;
  }

  /** 设置最小值 */
  min(value: number, message?: string): this {
    return this.validate({
      type: "min",
      value,
      message: message || `值不能小于 ${value}`,
    });
  }

  /** 设置最大值 */
  max(value: number, message?: string): this {
    return this.validate({
      type: "max",
      value,
      message: message || `值不能大于 ${value}`,
    });
  }

  /** 设置最小长度 */
  minLength(length: number, message?: string): this {
    return this.validate({
      type: "minLength",
      value: length,
      message: message || `长度不能少于 ${length}`,
    });
  }

  /** 设置最大长度 */
  maxLength(length: number, message?: string): this {
    return this.validate({
      type: "maxLength",
      value: length,
      message: message || `长度不能超过 ${length}`,
    });
  }

  /** 设置正则验证 */
  pattern(regex: RegExp, message: string): this {
    return this.validate({
      type: "pattern",
      value: regex.source,
      message,
    });
  }

  /** 自定义验证 */
  custom(validator: (value: unknown) => boolean | Promise<boolean>, message: string): this {
    return this.validate({
      type: "custom",
      message,
      validator,
    });
  }

  /** 条件显示 */
  showIf(condition: ShowIfCondition): this {
    this.config.showIf = condition;
    return this;
  }

  /** 设置 UI 组件 */
  ui(component: UIComponentType): this {
    this.config.ui = component;
    return this;
  }

  /** 构建配置 */
  build(): InputFieldConfig<TValue, TType> {
    return { ...this.config };
  }
}

/** 字符串输入构建器 */
class StringInputBuilder extends InputBuilder<"string"> {
  constructor(label: string) {
    super("string", label);
  }

  /** 使用多行文本输入 */
  multiline(): this {
    return this.ui("textarea");
  }

  /** 使用代码编辑器 */
  code(language?: string): this {
    this.ui("code");
    if (language) {
      this.config.uiOptions = { ...(this.config.uiOptions ?? {}), language };
    }
    return this;
  }

  /** 邮箱格式验证 */
  email(message?: string): this {
    return this.pattern(
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message || "请输入有效的邮箱地址"
    );
  }

  /** URL 格式验证 */
  url(message?: string): this {
    return this.pattern(
      /^https?:\/\/.+/,
      message || "请输入有效的 URL"
    );
  }
}

/** 数字输入构建器 */
class NumberInputBuilder extends InputBuilder<"number"> {
  constructor(label: string) {
    super("number", label);
  }

  /** 使用滑块 */
  slider(min: number, max: number, step = 1): this {
    this.config.uiOptions = { ...(this.config.uiOptions ?? {}), step };
    return this.ui("slider").min(min).max(max);
  }

  /** 设置整数 */
  integer(): this {
    return this.custom(
      (v) => Number.isInteger(v),
      "必须是整数"
    );
  }

  /** 设置正数 */
  positive(): this {
    return this.min(0, "必须是正数");
  }
}

/** 布尔输入构建器 */
class BooleanInputBuilder extends InputBuilder<"boolean"> {
  constructor(label: string) {
    super("boolean", label);
    this.default(false);
  }

  /** 使用开关组件 */
  switch(): this {
    return this.ui("switch");
  }
}

/** 对象输入构建器 */
class ObjectInputBuilder extends InputBuilder<"object"> {
  constructor(label: string) {
    super("object", label);
  }

  /** 使用 JSON 编辑器 */
  json(): this {
    return this.ui("json");
  }
}

/** 数组输入构建器 */
class ArrayInputBuilder extends InputBuilder<"array"> {
  constructor(label: string) {
    super("array", label);
    this.default([]);
  }
}

/** 选择输入构建器 */
class SelectInputBuilder<T extends string | number> extends InputBuilder<"any", T> {
  constructor(label: string, options: SelectOption<T>[]) {
    super("any", label);
    this.config.options = options;
    this.ui("select");
  }

  /** 允许多选 */
  multiple(): this {
    return this.ui("multiselect");
  }
}

// ===== 输入字段工厂 =====

export const input = {
  /** 字符串输入 */
  string: (label: string) => new StringInputBuilder(label),
  /** 多行文本输入 */
  textarea: (label: string) => new StringInputBuilder(label).multiline(),

  /** 数字输入 */
  number: (label: string) => new NumberInputBuilder(label),

  /** 布尔输入 */
  boolean: (label: string) => new BooleanInputBuilder(label),

  /** 对象输入 */
  object: (label: string) => new ObjectInputBuilder(label),

  /** 数组输入 */
  array: (label: string) => new ArrayInputBuilder(label),

  /** 选择输入 */
  select: <T extends string | number>(label: string, options: SelectOption<T>[]) =>
    new SelectInputBuilder(label, options),

  /** 文件输入 */
  file: (label: string) => new InputBuilder("file", label),

  /** 图片输入 */
  image: (label: string) => new InputBuilder("image", label),

  /** JSON 输入 */
  json: <T = Record<string, unknown>>(label: string) =>
    new InputBuilder<"json", T>("json", label).ui("json"),

  /** 任意类型输入 */
  any: (label: string) => new InputBuilder("any", label),
};

// ===== 输出字段构建器 =====

/** 输出字段构建器 */
class OutputBuilder<TType extends DataType> {
  private config: OutputFieldConfig<TType>;

  constructor(type: TType, label: string) {
    this.config = {
      type,
      label,
      optional: false,
    };
  }

  /** 设置描述 */
  description(desc: string): this {
    this.config.description = desc;
    return this;
  }

  /** 标记为可选输出 */
  optional(): this {
    this.config.optional = true;
    return this;
  }

  /** 构建配置 */
  build(): OutputFieldConfig<TType> {
    return { ...this.config };
  }
}

// ===== 输出字段工厂 =====

export const output = {
  /** 字符串输出 */
  string: (label: string) => new OutputBuilder("string", label),

  /** 数字输出 */
  number: (label: string) => new OutputBuilder("number", label),

  /** 布尔输出 */
  boolean: (label: string) => new OutputBuilder("boolean", label),

  /** 对象输出 */
  object: (label: string) => new OutputBuilder("object", label),

  /** 数组输出 */
  array: (label: string) => new OutputBuilder("array", label),

  /** 文件输出 */
  file: (label: string) => new OutputBuilder("file", label),

  /** 图片输出 */
  image: (label: string) => new OutputBuilder("image", label),

  /** JSON 输出 */
  json: (label: string) => new OutputBuilder("json", label),

  /** 任意类型输出 */
  any: (label: string) => new OutputBuilder("any", label),
};
