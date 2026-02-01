"use client";

/**
 * MagneticButton - 磁性按钮组件
 * 
 * 鼠标悬停时会产生磁性吸附效果，按钮会跟随鼠标移动
 * 支持自定义强度、缩放效果和子元素
 */

import { useState, useRef, useCallback, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  strength?: number; // 磁性强度，默认 0.3
  scale?: number; // 悬停时的缩放，默认 1.05
  disabled?: boolean;
  onClick?: () => void;
}

export function MagneticButton({
  children,
  className,
  strength = 0.3,
  scale = 1.05,
  disabled = false,
  onClick,
}: MagneticButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!buttonRef.current || disabled) return;

      const rect = buttonRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = (e.clientX - centerX) * strength;
      const deltaY = (e.clientY - centerY) * strength;

      setPosition({ x: deltaX, y: deltaY });
    },
    [strength, disabled]
  );

  const handleMouseEnter = useCallback(() => {
    if (!disabled) {
      setIsHovered(true);
    }
  }, [disabled]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setPosition({ x: 0, y: 0 });
  }, []);

  return (
    <button
      ref={buttonRef}
      onClick={onClick}
      disabled={disabled}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "relative transition-transform duration-200 ease-out",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      style={{
        transform: `translate(${position.x}px, ${position.y}px) scale(${
          isHovered && !disabled ? scale : 1
        })`,
      }}
    >
      {children}
    </button>
  );
}

/**
 * MagneticWrapper - 磁性包装器
 * 
 * 可以将任何元素包装成具有磁性效果的元素
 */
interface MagneticWrapperProps {
  children: ReactNode;
  className?: string;
  strength?: number;
  scale?: number;
  as?: "div" | "span" | "a";
  href?: string;
}

export function MagneticWrapper({
  children,
  className,
  strength = 0.3,
  scale = 1.05,
  as: Component = "div",
  href,
}: MagneticWrapperProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!ref.current) return;

      const rect = ref.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = (e.clientX - centerX) * strength;
      const deltaY = (e.clientY - centerY) * strength;

      setPosition({ x: deltaX, y: deltaY });
    },
    [strength]
  );

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setPosition({ x: 0, y: 0 });
  }, []);

  const style = {
    transform: `translate(${position.x}px, ${position.y}px) scale(${
      isHovered ? scale : 1
    })`,
  };

  if (Component === "a" && href) {
    return (
      <a
        href={href}
        ref={ref as any}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={cn(
          "inline-block transition-transform duration-200 ease-out",
          className
        )}
        style={style}
      >
        {children}
      </a>
    );
  }

  return (
    <Component
      ref={ref as any}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "inline-block transition-transform duration-200 ease-out",
        className
      )}
      style={style}
    >
      {children}
    </Component>
  );
}

export default MagneticButton;
