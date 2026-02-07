/**
 * Button ComponentTest
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@/test/utils";
import { Button } from "../button";

describe("Button", () => {
 it("ShouldcurrentlyRenderText", () => {
 render(<Button>ClickI</Button>);
 expect(screen.getByRole("button", { name: "ClickI" })).toBeInTheDocument();
 });

 it("ShouldcurrentlyApp variant", () => {
 const { rerender } = render(<Button variant="default">Default</Button>);
 expect(screen.getByRole("button")).toHaveClass("bg-brand-500");

 rerender(<Button variant="destructive">Delete</Button>);
 expect(screen.getByRole("button")).toHaveClass("text-destructive-400");

 rerender(<Button variant="outline">Outline</Button>);
 expect(screen.getByRole("button")).toHaveClass("border");

 rerender(<Button variant="ghost">Ghost</Button>);
 expect(screen.getByRole("button")).toHaveClass("bg-transparent");
 });

 it("ShouldcurrentlyApp size", () => {
 const { rerender } = render(<Button size="default">Default</Button>);
 expect(screen.getByRole("button")).toHaveClass("h-8");

 rerender(<Button size="sm">small</Button>);
 expect(screen.getByRole("button")).toHaveClass("h-7");

 rerender(<Button size="lg">large</Button>);
 expect(screen.getByRole("button")).toHaveClass("h-9");

 rerender(<Button size="icon">Icon</Button>);
 expect(screen.getByRole("button")).toHaveClass("h-8", "w-8");
 });

 it("ShouldatClicktimeTrigger onClick", () => {
 const handleClick = vi.fn();
 render(<Button onClick={handleClick}>Click</Button>);

 fireEvent.click(screen.getByRole("button"));
 expect(handleClick).toHaveBeenCalledTimes(1);
 });

 it("DisabletimenotShouldTrigger onClick", () => {
 const handleClick = vi.fn();
 render(
 <Button disabled onClick={handleClick}>
 Disable
 </Button>
 );

 fireEvent.click(screen.getByRole("button"));
 expect(handleClick).not.toHaveBeenCalled();
 });

 it("ShouldSupport asChild", () => {
 render(
 <Button asChild>
 <a href="/test">LinkButton</a>
 </Button>
 );
 expect(screen.getByRole("link", { name: "LinkButton" })).toBeInTheDocument();
 });

 it("Shouldcurrentlyand className", () => {
 render(<Button className="custom-class">Custom</Button>);
 expect(screen.getByRole("button")).toHaveClass("custom-class");
 });

 it("ShouldSupport type ", () => {
 render(<Button type="submit">Submit</Button>);
 expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
 });
});
