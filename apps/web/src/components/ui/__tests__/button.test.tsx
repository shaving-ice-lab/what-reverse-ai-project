/**
 * Button 组件测试
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@/test/utils";
import { Button } from "../button";

describe("Button", () => {
  it("应该正确渲染文本", () => {
    render(<Button>点击我</Button>);
    expect(screen.getByRole("button", { name: "点击我" })).toBeInTheDocument();
  });

  it("应该正确应用 variant", () => {
    const { rerender } = render(<Button variant="default">默认</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-brand-500");

    rerender(<Button variant="destructive">删除</Button>);
    expect(screen.getByRole("button")).toHaveClass("text-destructive-400");

    rerender(<Button variant="outline">轮廓</Button>);
    expect(screen.getByRole("button")).toHaveClass("border");

    rerender(<Button variant="ghost">幽灵</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-transparent");
  });

  it("应该正确应用 size", () => {
    const { rerender } = render(<Button size="default">默认</Button>);
    expect(screen.getByRole("button")).toHaveClass("h-8");

    rerender(<Button size="sm">小</Button>);
    expect(screen.getByRole("button")).toHaveClass("h-7");

    rerender(<Button size="lg">大</Button>);
    expect(screen.getByRole("button")).toHaveClass("h-9");

    rerender(<Button size="icon">图标</Button>);
    expect(screen.getByRole("button")).toHaveClass("h-8", "w-8");
  });

  it("应该在点击时触发 onClick", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>点击</Button>);

    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("禁用时不应该触发 onClick", () => {
    const handleClick = vi.fn();
    render(
      <Button disabled onClick={handleClick}>
        禁用
      </Button>
    );

    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("应该支持 asChild", () => {
    render(
      <Button asChild>
        <a href="/test">链接按钮</a>
      </Button>
    );
    expect(screen.getByRole("link", { name: "链接按钮" })).toBeInTheDocument();
  });

  it("应该正确合并 className", () => {
    render(<Button className="custom-class">自定义</Button>);
    expect(screen.getByRole("button")).toHaveClass("custom-class");
  });

  it("应该支持 type 属性", () => {
    render(<Button type="submit">提交</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });
});
