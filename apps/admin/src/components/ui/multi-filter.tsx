"use client";

import { Fragment, useState, type ReactNode } from "react";
import {
  Calendar,
  Check,
  ChevronDown,
  Filter,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "./button";
import { Input } from "./input";
import { Badge } from "./badge";
import { cn } from "@/lib/utils";

// ============================================
// Types
// ============================================

export type FilterOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  | "starts_with"
  | "ends_with"
  | "greater_than"
  | "less_than"
  | "between"
  | "in"
  | "not_in"
  | "is_empty"
  | "is_not_empty";

export interface FilterFieldOption {
  value: string;
  label: string;
}

export interface FilterField {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "multi-select" | "date" | "boolean";
  options?: FilterFieldOption[];
  operators?: FilterOperator[];
}

export interface FilterCondition {
  id: string;
  field: string;
  operator: FilterOperator;
  value: unknown;
}

export interface FilterGroup {
  id: string;
  logic: "and" | "or";
  conditions: FilterCondition[];
}

// ============================================
// Default Operators by Type
// ============================================

const defaultOperatorsByType: Record<FilterField["type"], FilterOperator[]> = {
  text: ["contains", "not_contains", "equals", "not_equals", "starts_with", "ends_with", "is_empty", "is_not_empty"],
  number: ["equals", "not_equals", "greater_than", "less_than", "between", "is_empty", "is_not_empty"],
  select: ["equals", "not_equals", "in", "not_in"],
  "multi-select": ["in", "not_in"],
  date: ["equals", "greater_than", "less_than", "between", "is_empty", "is_not_empty"],
  boolean: ["equals"],
};

const operatorLabels: Record<FilterOperator, string> = {
  equals: "Equals",
  not_equals: "Not equals",
  contains: "Contains",
  not_contains: "Does not contain",
  starts_with: "Starts with",
  ends_with: "Ends with",
  greater_than: "Greater than",
  less_than: "Less than",
  between: "Between",
  in: "In",
  not_in: "Not in",
  is_empty: "Is empty",
  is_not_empty: "Is not empty",
};

// ============================================
// Multi Filter Component
// ============================================

interface MultiFilterProps {
  fields: FilterField[];
  value: FilterGroup;
  onChange: (value: FilterGroup) => void;
  className?: string;
}

export function MultiFilter({ fields, value, onChange, className }: MultiFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const addCondition = () => {
    const firstField = fields[0];
    if (!firstField) return;

    const operators = firstField.operators || defaultOperatorsByType[firstField.type];
    const newCondition: FilterCondition = {
      id: `cond-${Date.now()}`,
      field: firstField.key,
      operator: operators[0],
      value: "",
    };

    onChange({
      ...value,
      conditions: [...value.conditions, newCondition],
    });
  };

  const updateCondition = (conditionId: string, updates: Partial<FilterCondition>) => {
    onChange({
      ...value,
      conditions: value.conditions.map((c) =>
        c.id === conditionId ? { ...c, ...updates } : c
      ),
    });
  };

  const removeCondition = (conditionId: string) => {
    onChange({
      ...value,
      conditions: value.conditions.filter((c) => c.id !== conditionId),
    });
  };

  const clearAll = () => {
    onChange({
      ...value,
      conditions: [],
    });
  };

  const activeCount = value.conditions.length;

  return (
    <div className={cn("relative", className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(activeCount > 0 && "border-brand-500/50")}
      >
        <Filter className="w-4 h-4 mr-1" />
        Filter
        {activeCount > 0 && (
          <Badge variant="default" size="sm" className="ml-1.5 h-5 px-1.5">
            {activeCount}
          </Badge>
        )}
        <ChevronDown className="w-3 h-3 ml-1" />
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full mt-2 left-0 z-50 min-w-[480px] p-4 bg-background-surface border border-border rounded-lg shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">Filter conditions</span>
                {activeCount > 0 && (
                  <Badge variant="outline" size="sm">
                    {activeCount} conditions
                  </Badge>
                )}
              </div>
              {activeCount > 0 && (
                <button
                  onClick={clearAll}
                  className="text-xs text-foreground-muted hover:text-destructive transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Conditions */}
            <div className="space-y-2 mb-3">
              {value.conditions.length === 0 ? (
                <div className="py-6 text-center text-sm text-foreground-muted">
                  No filter conditions
                </div>
              ) : (
                value.conditions.map((condition, index) => (
                  <FilterConditionRow
                    key={condition.id}
                    condition={condition}
                    fields={fields}
                    showLogic={index > 0}
                    logic={value.logic}
                    onLogicChange={(logic) => onChange({ ...value, logic })}
                    onChange={(updates) => updateCondition(condition.id, updates)}
                    onRemove={() => removeCondition(condition.id)}
                  />
                ))
              )}
            </div>

            {/* Add Condition */}
            <Button
              variant="ghost"
              size="sm"
              onClick={addCondition}
              className="w-full justify-start text-foreground-muted hover:text-foreground"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add filter condition
            </Button>

            {/* Footer */}
            <div className="flex justify-end gap-2 pt-3 mt-3 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={() => setIsOpen(false)}>
                Apply filters
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================
// Filter Condition Row
// ============================================

interface FilterConditionRowProps {
  condition: FilterCondition;
  fields: FilterField[];
  showLogic: boolean;
  logic: "and" | "or";
  onLogicChange: (logic: "and" | "or") => void;
  onChange: (updates: Partial<FilterCondition>) => void;
  onRemove: () => void;
}

function FilterConditionRow({
  condition,
  fields,
  showLogic,
  logic,
  onLogicChange,
  onChange,
  onRemove,
}: FilterConditionRowProps) {
  const field = fields.find((f) => f.key === condition.field);
  const operators = field?.operators || defaultOperatorsByType[field?.type || "text"];

  const handleFieldChange = (fieldKey: string) => {
    const newField = fields.find((f) => f.key === fieldKey);
    const newOperators = newField?.operators || defaultOperatorsByType[newField?.type || "text"];
    onChange({
      field: fieldKey,
      operator: newOperators[0],
      value: "",
    });
  };

  return (
    <div className="flex items-center gap-2">
      {/* Logic Selector */}
      {showLogic && (
        <button
          onClick={() => onLogicChange(logic === "and" ? "or" : "and")}
          className={cn(
            "shrink-0 w-10 h-8 flex items-center justify-center text-xs font-medium rounded border transition-colors",
            logic === "and"
              ? "bg-brand-500/10 border-brand-500/30 text-brand-500"
              : "bg-warning/10 border-warning/30 text-warning"
          )}
        >
          {logic === "and" ? "AND" : "OR"}
        </button>
      )}
      {!showLogic && <div className="w-10 shrink-0" />}

      {/* Field Selector */}
      <select
        value={condition.field}
        onChange={(e) => handleFieldChange(e.target.value)}
        className="h-8 px-2 text-sm bg-background border border-border rounded focus:outline-none focus:border-brand-500"
      >
        {fields.map((f) => (
          <option key={f.key} value={f.key}>
            {f.label}
          </option>
        ))}
      </select>

      {/* Operator Selector */}
      <select
        value={condition.operator}
        onChange={(e) => onChange({ operator: e.target.value as FilterOperator })}
        className="h-8 px-2 text-sm bg-background border border-border rounded focus:outline-none focus:border-brand-500"
      >
        {operators.map((op) => (
          <option key={op} value={op}>
            {operatorLabels[op]}
          </option>
        ))}
      </select>

      {/* Value Input */}
      {condition.operator !== "is_empty" && condition.operator !== "is_not_empty" && (
        <FilterValueInput
          field={field}
          operator={condition.operator}
          value={condition.value}
          onChange={(value) => onChange({ value })}
        />
      )}

      {/* Remove Button */}
      <button
        onClick={onRemove}
        className="shrink-0 p-1.5 text-foreground-muted hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

// ============================================
// Filter Value Input
// ============================================

interface FilterValueInputProps {
  field?: FilterField;
  operator: FilterOperator;
  value: unknown;
  onChange: (value: unknown) => void;
}

function FilterValueInput({ field, operator, value, onChange }: FilterValueInputProps) {
  if (!field) return null;

  // Multi-select values
  if (field.type === "select" && (operator === "in" || operator === "not_in")) {
    const selectedValues = Array.isArray(value) ? value : [];
    return (
      <MultiSelectInput
        options={field.options || []}
        value={selectedValues}
        onChange={onChange}
      />
    );
  }

  // Single select
  if (field.type === "select") {
    return (
      <select
        value={String(value || "")}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 h-8 px-2 text-sm bg-background border border-border rounded focus:outline-none focus:border-brand-500"
      >
        <option value="">Select...</option>
        {field.options?.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }

  // Boolean
  if (field.type === "boolean") {
    return (
      <select
        value={String(value || "")}
        onChange={(e) => onChange(e.target.value === "true")}
        className="flex-1 h-8 px-2 text-sm bg-background border border-border rounded focus:outline-none focus:border-brand-500"
      >
        <option value="true">Yes</option>
        <option value="false">No</option>
      </select>
    );
  }

  // Date
  if (field.type === "date") {
    return (
      <input
        type="date"
        value={String(value || "")}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 h-8 px-2 text-sm bg-background border border-border rounded focus:outline-none focus:border-brand-500"
      />
    );
  }

  // Number
  if (field.type === "number") {
    return (
      <input
        type="number"
        value={String(value || "")}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : "")}
        placeholder="Enter a number..."
        className="flex-1 h-8 px-2 text-sm bg-background border border-border rounded focus:outline-none focus:border-brand-500"
      />
    );
  }

  // Text (default)
  return (
    <input
      type="text"
      value={String(value || "")}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Enter keyword..."
      className="flex-1 h-8 px-2 text-sm bg-background border border-border rounded focus:outline-none focus:border-brand-500"
    />
  );
}

// ============================================
// Multi Select Input
// ============================================

interface MultiSelectInputProps {
  options: FilterFieldOption[];
  value: string[];
  onChange: (value: string[]) => void;
}

function MultiSelectInput({ options, value, onChange }: MultiSelectInputProps) {
  const [open, setOpen] = useState(false);

  const toggleOption = (optValue: string) => {
    if (value.includes(optValue)) {
      onChange(value.filter((v) => v !== optValue));
    } else {
      onChange([...value, optValue]);
    }
  };

  return (
    <div className="relative flex-1">
      <button
        onClick={() => setOpen(!open)}
        className="w-full h-8 px-2 flex items-center gap-2 text-sm text-left bg-background border border-border rounded focus:outline-none focus:border-brand-500"
      >
        <span className="flex-1 truncate">
          {value.length === 0
            ? "Select..."
            : `${value.length} selected`}
        </span>
        <ChevronDown className="w-3 h-3 text-foreground-muted" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-50" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-1 left-0 right-0 z-50 max-h-[200px] overflow-y-auto bg-background-surface border border-border rounded-lg shadow-lg">
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => toggleOption(opt.value)}
                className="w-full px-3 py-2 flex items-center gap-2 text-sm text-left hover:bg-background-hover"
              >
                <div
                  className={cn(
                    "w-4 h-4 rounded border flex items-center justify-center",
                    value.includes(opt.value)
                      ? "bg-brand-500 border-brand-500"
                      : "border-border"
                  )}
                >
                  {value.includes(opt.value) && (
                    <Check className="w-3 h-3 text-white" />
                  )}
                </div>
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================
// Active Filters Display
// ============================================

interface ActiveFiltersProps {
  fields: FilterField[];
  filters: FilterGroup;
  onRemove: (conditionId: string) => void;
  onClearAll: () => void;
}

export function ActiveFilters({ fields, filters, onRemove, onClearAll }: ActiveFiltersProps) {
  if (filters.conditions.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {filters.conditions.map((condition, index) => {
        const field = fields.find((f) => f.key === condition.field);
        const displayValue =
          field?.type === "select"
            ? field.options?.find((o) => o.value === condition.value)?.label || condition.value
            : condition.value;

        return (
          <Fragment key={condition.id}>
            {index > 0 && (
              <span className="text-xs text-foreground-muted">
                {filters.logic === "and" ? "AND" : "OR"}
              </span>
            )}
            <Badge
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5 pr-1"
            >
              <span className="text-foreground-muted">{field?.label || condition.field}</span>
              <span className="text-foreground-muted">{operatorLabels[condition.operator]}</span>
              <span className="text-foreground">{String(displayValue)}</span>
              <button
                onClick={() => onRemove(condition.id)}
                className="p-0.5 hover:bg-background-hover rounded"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          </Fragment>
        );
      })}
      <button
        onClick={onClearAll}
        className="text-xs text-foreground-muted hover:text-foreground transition-colors"
      >
        Clear all
      </button>
    </div>
  );
}

// ============================================
// Hook for Filter State Management
// ============================================

export function useMultiFilter(initialFilters?: FilterGroup) {
  const [filters, setFilters] = useState<FilterGroup>(
    initialFilters || {
      id: "root",
      logic: "and",
      conditions: [],
    }
  );

  const addCondition = (condition: Omit<FilterCondition, "id">) => {
    setFilters((prev) => ({
      ...prev,
      conditions: [
        ...prev.conditions,
        { ...condition, id: `cond-${Date.now()}` },
      ],
    }));
  };

  const removeCondition = (conditionId: string) => {
    setFilters((prev) => ({
      ...prev,
      conditions: prev.conditions.filter((c) => c.id !== conditionId),
    }));
  };

  const clearFilters = () => {
    setFilters((prev) => ({
      ...prev,
      conditions: [],
    }));
  };

  const applyFilters = <T,>(data: T[], getFieldValue: (item: T, field: string) => unknown): T[] => {
    if (filters.conditions.length === 0) return data;

    return data.filter((item) => {
      const results = filters.conditions.map((condition) => {
        const fieldValue = getFieldValue(item, condition.field);
        return evaluateCondition(fieldValue, condition.operator, condition.value);
      });

      return filters.logic === "and"
        ? results.every(Boolean)
        : results.some(Boolean);
    });
  };

  return {
    filters,
    setFilters,
    addCondition,
    removeCondition,
    clearFilters,
    applyFilters,
    hasFilters: filters.conditions.length > 0,
  };
}

function evaluateCondition(
  fieldValue: unknown,
  operator: FilterOperator,
  filterValue: unknown
): boolean {
  const strFieldValue = String(fieldValue ?? "").toLowerCase();
  const strFilterValue = String(filterValue ?? "").toLowerCase();

  switch (operator) {
    case "equals":
      return strFieldValue === strFilterValue;
    case "not_equals":
      return strFieldValue !== strFilterValue;
    case "contains":
      return strFieldValue.includes(strFilterValue);
    case "not_contains":
      return !strFieldValue.includes(strFilterValue);
    case "starts_with":
      return strFieldValue.startsWith(strFilterValue);
    case "ends_with":
      return strFieldValue.endsWith(strFilterValue);
    case "greater_than":
      return Number(fieldValue) > Number(filterValue);
    case "less_than":
      return Number(fieldValue) < Number(filterValue);
    case "in":
      return Array.isArray(filterValue) && filterValue.includes(String(fieldValue));
    case "not_in":
      return Array.isArray(filterValue) && !filterValue.includes(String(fieldValue));
    case "is_empty":
      return fieldValue === null || fieldValue === undefined || fieldValue === "";
    case "is_not_empty":
      return fieldValue !== null && fieldValue !== undefined && fieldValue !== "";
    default:
      return true;
  }
}
