/**
 * EmptyState 组件测试
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@/test/utils";
import {
  EmptyState,
  SearchEmpty,
  WorkflowEmpty,
  ApiKeyEmpty,
  ErrorEmpty,
} from "../empty-state";

describe("EmptyState", () => {
  it("应该正确渲染标题", () => {
    render(<EmptyState title="没有数据" />);
    expect(screen.getByText("没有数据")).toBeInTheDocument();
  });

  it("应该渲染描述文本", () => {
    render(<EmptyState title="标题" description="这是描述" />);
    expect(screen.getByText("这是描述")).toBeInTheDocument();
  });

  it("应该渲染操作按钮", () => {
    const handleClick = vi.fn();
    render(
      <EmptyState
        title="空状态"
        action={{ label: "添加", onClick: handleClick }}
      />
    );

    const button = screen.getByRole("button", { name: /添加/ });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("应该渲染次要操作按钮", () => {
    const handlePrimary = vi.fn();
    const handleSecondary = vi.fn();
    render(
      <EmptyState
        title="空状态"
        action={{ label: "主要", onClick: handlePrimary }}
        secondaryAction={{ label: "次要", onClick: handleSecondary }}
      />
    );

    expect(screen.getByRole("button", { name: /主要/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "次要" })).toBeInTheDocument();
  });

  it("应该应用不同的尺寸", () => {
    const { rerender } = render(
      <EmptyState title="测试" size="sm" />
    );
    // EmptyState 外层 div 含有 size 对应的 padding class
    expect(screen.getByText("测试").closest("div[class*='py-']")).toBeTruthy();

    // sm -> py-8, md -> py-12, lg -> py-16
    const getContainer = () => screen.getByText("测试").parentElement!;

    expect(getContainer()).toHaveClass("py-8");

    rerender(<EmptyState title="测试" size="md" />);
    expect(getContainer()).toHaveClass("py-12");

    rerender(<EmptyState title="测试" size="lg" />);
    expect(getContainer()).toHaveClass("py-16");
  });
});

describe("SearchEmpty", () => {
  it("应该显示搜索词", () => {
    render(<SearchEmpty query="测试关键词" />);
    expect(screen.getByText(/没有找到.*测试关键词/)).toBeInTheDocument();
  });

  it("应该显示清除按钮", () => {
    const handleClear = vi.fn();
    render(<SearchEmpty query="测试" onClear={handleClear} />);

    const button = screen.getByRole("button", { name: /清除搜索/ });
    fireEvent.click(button);
    expect(handleClear).toHaveBeenCalledTimes(1);
  });
});

describe("WorkflowEmpty", () => {
  it("应该正确渲染", () => {
    render(<WorkflowEmpty />);
    expect(screen.getByText("还没有工作流")).toBeInTheDocument();
  });

  it("应该显示创建按钮", () => {
    const handleCreate = vi.fn();
    render(<WorkflowEmpty onCreateClick={handleCreate} />);

    const button = screen.getByRole("button", { name: /创建工作流/ });
    fireEvent.click(button);
    expect(handleCreate).toHaveBeenCalledTimes(1);
  });
});

describe("ApiKeyEmpty", () => {
  it("应该正确渲染", () => {
    render(<ApiKeyEmpty />);
    expect(screen.getByText("还没有 API 密钥")).toBeInTheDocument();
  });

  it("应该显示添加按钮", () => {
    const handleAdd = vi.fn();
    render(<ApiKeyEmpty onAddClick={handleAdd} />);

    const button = screen.getByRole("button", { name: /添加密钥/ });
    fireEvent.click(button);
    expect(handleAdd).toHaveBeenCalledTimes(1);
  });
});

describe("ErrorEmpty", () => {
  it("应该显示默认错误消息", () => {
    render(<ErrorEmpty />);
    expect(screen.getByText("加载失败")).toBeInTheDocument();
  });

  it("应该显示自定义错误消息", () => {
    render(<ErrorEmpty title="自定义错误" description="详细描述" />);
    expect(screen.getByText("自定义错误")).toBeInTheDocument();
    expect(screen.getByText("详细描述")).toBeInTheDocument();
  });

  it("应该显示重试按钮", () => {
    const handleRetry = vi.fn();
    render(<ErrorEmpty onRetry={handleRetry} />);

    const button = screen.getByRole("button", { name: /重试/ });
    fireEvent.click(button);
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });
});
