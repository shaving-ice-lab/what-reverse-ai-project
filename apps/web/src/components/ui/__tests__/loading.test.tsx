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
 it("ShouldcurrentlyRender", () => {
 const { container } = render(<Spinner />);
 const svg = container.querySelector("svg");
 expect(svg).toBeInTheDocument();
 expect(svg).toHaveClass("animate-spin");
 });

 it("ShouldAppnot'sDimension", () => {
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
 it("ShouldcurrentlyRender", () => {
 const { container } = render(<PageLoader />);
 // PageLoader Contains Spinner (svg) andDefaultMessage
 expect(container.querySelector("svg")).toBeInTheDocument();
 expect(screen.getByText("Loading...")).toBeInTheDocument();
 });

 it("ShouldDisplayCustomMessage", () => {
 render(<PageLoader message="DataLoading..." />);
 expect(screen.getByText("DataLoading...")).toBeInTheDocument();
 });
});

describe("FullscreenLoader", () => {
 it("visible=true timeShouldcurrentlyRender", () => {
 const { container } = render(<FullscreenLoader visible={true} />);
 expect(container.querySelector("svg")).toBeInTheDocument();
 expect(screen.getByText("Loading...")).toBeInTheDocument();
 });

 it("visible=false timenotShouldRender", () => {
 const { container } = render(<FullscreenLoader visible={false} />);
 expect(container.querySelector("svg")).not.toBeInTheDocument();
 });

 it("ShouldDisplayCustomMessage", () => {
 render(<FullscreenLoader visible={true} message="Processing..." />);
 expect(screen.getByText("Processing...")).toBeInTheDocument();
 });
});

describe("CardSkeleton", () => {
 it("ShouldcurrentlyRender", () => {
 const { container } = render(<CardSkeleton />);
 expect(container.querySelector(".animate-shimmer")).toBeInTheDocument();
 });
});

describe("ListSkeleton", () => {
 it("ShouldRenderSpecifyCount'sitem", () => {
 const { container } = render(<ListSkeleton rows={3} />);
 // each1rowinhasmultiple animate-shimmer Element，byrow'sCountcomeVerify
 const rows = container.querySelectorAll(".flex.items-center.gap-3");
 expect(rows).toHaveLength(3);
 });

 it("DefaultRender5item", () => {
 const { container } = render(<ListSkeleton />);
 const rows = container.querySelectorAll(".flex.items-center.gap-3");
 expect(rows).toHaveLength(5);
 });
});
