"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

export interface TypewriterTextProps extends React.HTMLAttributes<HTMLSpanElement> {
 /** needDisplay'sTextcountgroup, willLoopDisplay */
 texts: string[];
 /** charSpeed(s/Character) */
 typingSpeed?: number;
 /** DeleteSpeed(s/Character) */
 deletingSpeed?: number;
 /** TextDisplayDoneafter'setcpendingTime */
 pauseDuration?: number;
 /** isnoLoopPlay */
 loop?: boolean;
 /** style */
 cursorStyle?: "bar" | "underscore" | "block" | "none";
 /** Color */
 cursorColor?: string;
 /** isnoatDoneafterMaintainDisplay */
 keepCursor?: boolean;
 /** charDone'sCallback */
 onComplete?: () => void;
 /** eachtimesTextSwitch'sCallback */
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

// Simple'stimescharEffect
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

// Highlight'scharEffect
export interface TypewriterHighlightProps extends React.HTMLAttributes<HTMLSpanElement> {
 /** beforeText(Fixednot) */
 prefix?: string;
 /** needcharDisplay'sHighlightTextcountgroup */
 highlights: string[];
 /** afterText(Fixednot) */
 suffix?: string;
 /** HighlightText'sstyle */
 highlightClassName?: string;
 /** charSpeed */
 typingSpeed?: number;
 /** DeleteSpeed */
 deletingSpeed?: number;
 /** PauseTime */
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
