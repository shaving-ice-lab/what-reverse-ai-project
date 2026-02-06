/**
 * Loading 组件测试
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/utils";
import {
  Spinner,
  PageLoader,
  FullscreenLoader,
  CardSkeleton,
  ListSkeleton,
} from "../loading";

describe("Spinner", () => {
  it("应该正确渲染", () => {
    const { container } = render(<Spinner />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass("animate-spin");
  });

  it("应该应用不同的尺寸", () => {
    const { container, rerender } = render(<Spinner size="sm" />);
    expect(container.querySelector("svg")).toHaveClass("h-4", "w-4");

    rerender(<Spinner size="md" />);
    expect(container.querySelector("svg")).toHaveClass("h-5", "w-5");

    rerender(<Spinner size="lg" />);
    expect(container.querySelector("svg")).toHaveClass("h-6", "w-6");

    rerender(<Spinner size="xl" />);
    expect(container.querySelector("svg")).toHaveClass("h-8", "w-8");
  });

  it("应该支持自定义 className", () => {
    const { container } = render(<Spinner className="custom-spinner" />);
    expect(container.querySelector("svg")).toHaveClass("custom-spinner");
  });
});

describe("PageLoader", () => {
  it("应该正确渲染", () => {
    const { container } = render(<PageLoader />);
    // PageLoader 包含 Spinner (svg) 和默认消息
    expect(container.querySelector("svg")).toBeInTheDocument();
    expect(screen.getByText("加载中...")).toBeInTheDocument();
  });

  it("应该显示自定义消息", () => {
    render(<PageLoader message="数据加载中..." />);
    expect(screen.getByText("数据加载中...")).toBeInTheDocument();
  });
});

describe("FullscreenLoader", () => {
  it("visible=true 时应该正确渲染", () => {
    const { container } = render(<FullscreenLoader visible={true} />);
    expect(container.querySelector("svg")).toBeInTheDocument();
    expect(screen.getByText("加载中...")).toBeInTheDocument();
  });

  it("visible=false 时不应该渲染", () => {
    const { container } = render(<FullscreenLoader visible={false} />);
    expect(container.querySelector("svg")).not.toBeInTheDocument();
  });

  it("应该显示自定义消息", () => {
    render(<FullscreenLoader visible={true} message="正在处理..." />);
    expect(screen.getByText("正在处理...")).toBeInTheDocument();
  });
});

describe("CardSkeleton", () => {
  it("应该正确渲染", () => {
    const { container } = render(<CardSkeleton />);
    expect(container.querySelector(".animate-shimmer")).toBeInTheDocument();
  });
});

describe("ListSkeleton", () => {
  it("应该渲染指定数量的项目", () => {
    const { container } = render(<ListSkeleton rows={3} />);
    // 每一行内有多个 animate-shimmer 元素，按行的容器数量来验证
    const rows = container.querySelectorAll(".flex.items-center.gap-3");
    expect(rows).toHaveLength(3);
  });

  it("默认渲染5个项目", () => {
    const { container } = render(<ListSkeleton />);
    const rows = container.querySelectorAll(".flex.items-center.gap-3");
    expect(rows).toHaveLength(5);
  });
});
