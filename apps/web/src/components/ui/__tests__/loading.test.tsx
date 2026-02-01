/**
 * Loading 组件测试
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/utils";
import {
  Spinner,
  PageLoader,
  ButtonSpinner,
  FullscreenLoader,
  CardSkeleton,
  ListSkeleton,
  TableSkeleton,
} from "../loading";

describe("Spinner", () => {
  it("应该正确渲染", () => {
    render(<Spinner />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("应该应用不同的尺寸", () => {
    const { rerender } = render(<Spinner size="sm" />);
    expect(screen.getByRole("status").querySelector("svg")).toHaveClass("h-4", "w-4");

    rerender(<Spinner size="md" />);
    expect(screen.getByRole("status").querySelector("svg")).toHaveClass("h-6", "w-6");

    rerender(<Spinner size="lg" />);
    expect(screen.getByRole("status").querySelector("svg")).toHaveClass("h-8", "w-8");
  });

  it("应该支持自定义 className", () => {
    render(<Spinner className="custom-spinner" />);
    expect(screen.getByRole("status")).toHaveClass("custom-spinner");
  });
});

describe("PageLoader", () => {
  it("应该正确渲染", () => {
    render(<PageLoader />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("应该显示自定义消息", () => {
    render(<PageLoader message="加载中..." />);
    expect(screen.getByText("加载中...")).toBeInTheDocument();
  });
});

describe("ButtonSpinner", () => {
  it("应该正确渲染", () => {
    render(<ButtonSpinner />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});

describe("FullscreenLoader", () => {
  it("应该正确渲染", () => {
    render(<FullscreenLoader />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("应该显示标题和消息", () => {
    render(<FullscreenLoader title="请稍候" message="正在处理..." />);
    expect(screen.getByText("请稍候")).toBeInTheDocument();
    expect(screen.getByText("正在处理...")).toBeInTheDocument();
  });
});

describe("CardSkeleton", () => {
  it("应该正确渲染", () => {
    const { container } = render(<CardSkeleton />);
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });
});

describe("ListSkeleton", () => {
  it("应该渲染指定数量的项目", () => {
    const { container } = render(<ListSkeleton count={5} />);
    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(5);
  });

  it("默认渲染3个项目", () => {
    const { container } = render(<ListSkeleton />);
    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(3);
  });
});

describe("TableSkeleton", () => {
  it("应该渲染指定数量的行", () => {
    const { container } = render(<TableSkeleton rows={5} cols={4} />);
    // 包括表头行
    const rows = container.querySelectorAll("tr");
    expect(rows).toHaveLength(6); // 1 header + 5 body rows
  });
});
