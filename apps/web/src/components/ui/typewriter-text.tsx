"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

export interface TypewriterTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** 要显示的文本数组，会循环显示 */
  texts: string[];
  /** 打字速度（毫秒/字符） */
  typingSpeed?: number;
  /** 删除速度（毫秒/字符） */
  deletingSpeed?: number;
  /** 文本显示完成后的等待时间 */
  pauseDuration?: number;
  /** 是否循环播放 */
  loop?: boolean;
  /** 光标样式 */
  cursorStyle?: "bar" | "underscore" | "block" | "none";
  /** 光标颜色 */
  cursorColor?: string;
  /** 是否在完成后保持显示 */
  keepCursor?: boolean;
  /** 打字完成的回调 */
  onComplete?: () => void;
  /** 每次文本切换的回调 */
  onTextChange?: (index: number) => void;
}

export function TypewriterText({
  texts,
  typingSpeed = 80,
  deletingSpeed = 50,
  pauseDuration = 2000,
  loop = true,
  cursorStyle = "bar",
  cursorColor = "hsl(var(--primary))",
  keepCursor = true,
  onComplete,
  onTextChange,
  className,
  ...props
}: TypewriterTextProps) {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const currentText = texts[currentIndex] || "";

  useEffect(() => {
    if (isComplete) return;

    let timeout: NodeJS.Timeout;

    if (isPaused) {
      timeout = setTimeout(() => {
        setIsPaused(false);
        if (loop || currentIndex < texts.length - 1) {
          setIsDeleting(true);
        } else {
          setIsComplete(true);
          onComplete?.();
        }
      }, pauseDuration);
    } else if (isDeleting) {
      if (displayText === "") {
        setIsDeleting(false);
        const nextIndex = (currentIndex + 1) % texts.length;
        setCurrentIndex(nextIndex);
        onTextChange?.(nextIndex);
      } else {
        timeout = setTimeout(() => {
          setDisplayText((prev) => prev.slice(0, -1));
        }, deletingSpeed);
      }
    } else {
      if (displayText === currentText) {
        setIsPaused(true);
      } else {
        timeout = setTimeout(() => {
          setDisplayText((prev) => currentText.slice(0, prev.length + 1));
        }, typingSpeed);
      }
    }

    return () => clearTimeout(timeout);
  }, [
    displayText,
    currentIndex,
    currentText,
    isDeleting,
    isPaused,
    isComplete,
    texts,
    typingSpeed,
    deletingSpeed,
    pauseDuration,
    loop,
    onComplete,
    onTextChange,
  ]);

  const cursorClass = {
    bar: "inline-block w-[3px] h-[1em] ml-1 animate-blink",
    underscore: "inline-block w-[0.6em] h-[3px] ml-0.5 align-bottom animate-blink",
    block: "inline-block w-[0.6em] h-[1em] ml-0.5 opacity-70 animate-blink",
    none: "hidden",
  };

  const showCursor = keepCursor || !isComplete;

  return (
    <span className={cn("relative", className)} {...props}>
      <span>{displayText}</span>
      {showCursor && (
        <span
          className={cn(cursorClass[cursorStyle])}
          style={{ backgroundColor: cursorColor }}
        />
      )}
      <style jsx>{`
        @keyframes blink {
          0%, 50% {
            opacity: 1;
          }
          51%, 100% {
            opacity: 0;
          }
        }
        .animate-blink {
          animation: blink 1s infinite;
        }
      `}</style>
    </span>
  );
}

// 简单的单次打字效果
export interface TypeOnceProps extends React.HTMLAttributes<HTMLSpanElement> {
  text: string;
  speed?: number;
  delay?: number;
  onComplete?: () => void;
}

export function TypeOnce({
  text,
  speed = 50,
  delay = 0,
  onComplete,
  className,
  ...props
}: TypeOnceProps) {
  const [displayText, setDisplayText] = useState("");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const delayTimeout = setTimeout(() => {
      setStarted(true);
    }, delay);

    return () => clearTimeout(delayTimeout);
  }, [delay]);

  useEffect(() => {
    if (!started) return;

    if (displayText === text) {
      onComplete?.();
      return;
    }

    const timeout = setTimeout(() => {
      setDisplayText(text.slice(0, displayText.length + 1));
    }, speed);

    return () => clearTimeout(timeout);
  }, [displayText, text, speed, started, onComplete]);

  return (
    <span className={className} {...props}>
      {displayText}
    </span>
  );
}

// 带高亮的打字效果
export interface TypewriterHighlightProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** 前缀文本（固定不变） */
  prefix?: string;
  /** 要打字显示的高亮文本数组 */
  highlights: string[];
  /** 后缀文本（固定不变） */
  suffix?: string;
  /** 高亮文本的样式类 */
  highlightClassName?: string;
  /** 打字速度 */
  typingSpeed?: number;
  /** 删除速度 */
  deletingSpeed?: number;
  /** 暂停时间 */
  pauseDuration?: number;
}

export function TypewriterHighlight({
  prefix = "",
  highlights,
  suffix = "",
  highlightClassName = "text-primary",
  typingSpeed = 80,
  deletingSpeed = 50,
  pauseDuration = 2000,
  className,
  ...props
}: TypewriterHighlightProps) {
  return (
    <span className={className} {...props}>
      {prefix}
      <TypewriterText
        texts={highlights}
        typingSpeed={typingSpeed}
        deletingSpeed={deletingSpeed}
        pauseDuration={pauseDuration}
        className={highlightClassName}
        loop
      />
      {suffix}
    </span>
  );
}
