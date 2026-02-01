"use client";

/**
 * 搜索高亮文本组件
 * 将搜索关键词在文本中高亮显示
 */

import { Fragment, useMemo } from "react";
import { cn } from "@/lib/utils";

interface HighlightTextProps {
  text: string;
  search: string;
  className?: string;
  highlightClassName?: string;
  caseSensitive?: boolean;
}

export function HighlightText({
  text,
  search,
  className,
  highlightClassName = "bg-yellow-200 dark:bg-yellow-900/50 text-yellow-900 dark:text-yellow-100 rounded px-0.5",
  caseSensitive = false,
}: HighlightTextProps) {
  const parts = useMemo(() => {
    if (!search.trim()) {
      return [{ text, highlight: false }];
    }

    const regex = new RegExp(
      `(${escapeRegExp(search)})`,
      caseSensitive ? "g" : "gi"
    );
    
    const splitParts = text.split(regex);
    
    return splitParts.map((part, index) => ({
      text: part,
      highlight: index % 2 === 1, // 奇数索引是匹配的部分
    }));
  }, [text, search, caseSensitive]);

  return (
    <span className={className}>
      {parts.map((part, index) => (
        <Fragment key={index}>
          {part.highlight ? (
            <mark className={highlightClassName}>{part.text}</mark>
          ) : (
            part.text
          )}
        </Fragment>
      ))}
    </span>
  );
}

// 转义正则特殊字符
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * 高亮多个关键词
 */
interface MultiHighlightTextProps {
  text: string;
  searches: string[];
  className?: string;
  highlightClassName?: string;
  caseSensitive?: boolean;
}

export function MultiHighlightText({
  text,
  searches,
  className,
  highlightClassName = "bg-yellow-200 dark:bg-yellow-900/50 text-yellow-900 dark:text-yellow-100 rounded px-0.5",
  caseSensitive = false,
}: MultiHighlightTextProps) {
  const parts = useMemo(() => {
    const validSearches = searches.filter((s) => s.trim());
    if (validSearches.length === 0) {
      return [{ text, highlight: false }];
    }

    const escapedSearches = validSearches.map(escapeRegExp);
    const regex = new RegExp(
      `(${escapedSearches.join("|")})`,
      caseSensitive ? "g" : "gi"
    );
    
    const splitParts = text.split(regex);
    
    return splitParts.map((part, index) => ({
      text: part,
      highlight: index % 2 === 1,
    }));
  }, [text, searches, caseSensitive]);

  return (
    <span className={className}>
      {parts.map((part, index) => (
        <Fragment key={index}>
          {part.highlight ? (
            <mark className={highlightClassName}>{part.text}</mark>
          ) : (
            part.text
          )}
        </Fragment>
      ))}
    </span>
  );
}
