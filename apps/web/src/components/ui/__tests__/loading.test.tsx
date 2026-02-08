/**
 * Loading ComponentTest
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
 it("Should render correctly", () => {
 const { container } = render(<Spinner />);
 const svg = container.querySelector("svg");
 expect(svg).toBeInTheDocument();
 expect(svg).toHaveClass("animate-spin");
 });

 it("Should apply correct dimensions", () => {
 const { container, rerender } = render(<Spinner size="sm" />);
 expect(container.querySelector("svg")).toHaveClass("h-4", "w-4");

 rerender(<Spinner size="md" />);
 expect(container.querySelector("svg")).toHaveClass("h-5", "w-5");

 rerender(<Spinner size="lg" />);
 expect(container.querySelector("svg")).toHaveClass("h-6", "w-6");

 rerender(<Spinner size="xl" />);
 expect(container.querySelector("svg")).toHaveClass("h-8", "w-8");
 });

 it("ShouldSupportCustom className", () => {
 const { container } = render(<Spinner className="custom-spinner" />);
 expect(container.querySelector("svg")).toHaveClass("custom-spinner");
 });
});

describe("PageLoader", () => {
 it("Should render correctly", () => {
 const { container } = render(<PageLoader />);
 // PageLoader Contains Spinner (svg) andDefaultMessage
 expect(container.querySelector("svg")).toBeInTheDocument();
 expect(screen.getByText("Loading...")).toBeInTheDocument();
 });

 it("Should display custom message", () => {
 render(<PageLoader message="Data Loading..." />);
 expect(screen.getByText("Data Loading...")).toBeInTheDocument();
 });
});

describe("FullscreenLoader", () => {
 it("Should render correctly when visible=true", () => {
 const { container } = render(<FullscreenLoader visible={true} />);
 expect(container.querySelector("svg")).toBeInTheDocument();
 expect(screen.getByText("Loading...")).toBeInTheDocument();
 });

 it("Should not render when visible=false", () => {
 const { container } = render(<FullscreenLoader visible={false} />);
 expect(container.querySelector("svg")).not.toBeInTheDocument();
 });

 it("ShouldDisplayCustomMessage", () => {
 render(<FullscreenLoader visible={true} message="Processing..." />);
 expect(screen.getByText("Processing...")).toBeInTheDocument();
 });
});

describe("CardSkeleton", () => {
 it("Should render correctly", () => {
 const { container } = render(<CardSkeleton />);
 expect(container.querySelector(".animate-shimmer")).toBeInTheDocument();
 });
});

describe("ListSkeleton", () => {
 it("Should render specified number of items", () => {
 const { container } = render(<ListSkeleton rows={3} />);
 // Each row contains multiple animate-shimmer elements, verify by row count
 const rows = container.querySelectorAll(".flex.items-center.gap-3");
 expect(rows).toHaveLength(3);
 });

 it("DefaultRender5item", () => {
 const { container } = render(<ListSkeleton />);
 const rows = container.querySelectorAll(".flex.items-center.gap-3");
 expect(rows).toHaveLength(5);
 });
});
