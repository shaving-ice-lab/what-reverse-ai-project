/**
 * Empty State Component Test
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
 it("Should render title correctly", () => {
 render(<EmptyState title="No Data" />);
 expect(screen.getByText("No Data")).toBeInTheDocument();
 });

 it("Should render description text", () => {
 render(<EmptyState title="Title" description="This is a description" />);
 expect(screen.getByText("This is a description")).toBeInTheDocument();
 });

 it("Should render action button", () => {
 const handleClick = vi.fn();
 render(
 <EmptyState
 title="Empty State"
 action={{ label: "Add", onClick: handleClick }}
 />
 );

 const button = screen.getByRole("button", { name: /Add/ });
 expect(button).toBeInTheDocument();

 fireEvent.click(button);
 expect(handleClick).toHaveBeenCalledTimes(1);
 });

 it("Should render multiple action buttons", () => {
 const handlePrimary = vi.fn();
 const handleSecondary = vi.fn();
 render(
 <EmptyState
 title="Empty State"
 action={{ label: "Primary", onClick: handlePrimary }}
 secondaryAction={{ label: "Secondary", onClick: handleSecondary }}
 />
 );

 expect(screen.getByRole("button", { name: /Primary/ })).toBeInTheDocument();
 expect(screen.getByRole("button", { name: "Secondary" })).toBeInTheDocument();
 });

 it("Should apply correct dimensions", () => {
 const { rerender } = render(
 <EmptyState title="Test" size="sm" />
 );
 // EmptyState container should have padding class based on size
 expect(screen.getByText("Test").closest("div[class*='py-']")).toBeTruthy();

 // sm -> py-8, md -> py-12, lg -> py-16
 const getContainer = () => screen.getByText("Test").parentElement!;

 expect(getContainer()).toHaveClass("py-8");

 rerender(<EmptyState title="Test" size="md" />);
 expect(getContainer()).toHaveClass("py-12");

 rerender(<EmptyState title="Test" size="lg" />);
 expect(getContainer()).toHaveClass("py-16");
 });
});

describe("SearchEmpty", () => {
 it("Should display search query", () => {
 render(<SearchEmpty query="Test Keywords" />);
 expect(screen.getByText(/Test Keywords/)).toBeInTheDocument();
 });

 it("Should display clear button", () => {
 const handleClear = vi.fn();
 render(<SearchEmpty query="Test" onClear={handleClear} />);

 const button = screen.getByRole("button", { name: /Clear Search/ });
 fireEvent.click(button);
 expect(handleClear).toHaveBeenCalledTimes(1);
 });
});

describe("WorkflowEmpty", () => {
 it("Should render correctly", () => {
 render(<WorkflowEmpty />);
 expect(screen.getByText("No Workflows Yet")).toBeInTheDocument();
 });

 it("Should display create button", () => {
 const handleCreate = vi.fn();
 render(<WorkflowEmpty onCreateClick={handleCreate} />);

 const button = screen.getByRole("button", { name: /Create Workflow/ });
 fireEvent.click(button);
 expect(handleCreate).toHaveBeenCalledTimes(1);
 });
});

describe("ApiKeyEmpty", () => {
 it("Should render correctly", () => {
 render(<ApiKeyEmpty />);
 expect(screen.getByText("No API Keys Yet")).toBeInTheDocument();
 });

 it("Should display add button", () => {
 const handleAdd = vi.fn();
 render(<ApiKeyEmpty onAddClick={handleAdd} />);

 const button = screen.getByRole("button", { name: /Add Key/ });
 fireEvent.click(button);
 expect(handleAdd).toHaveBeenCalledTimes(1);
 });
});

describe("ErrorEmpty", () => {
 it("Should display default error message", () => {
 render(<ErrorEmpty />);
 expect(screen.getByText("Loading Failed")).toBeInTheDocument();
 });

 it("Should display custom error message", () => {
 render(<ErrorEmpty title="Custom Error" description="Detailed Description" />);
 expect(screen.getByText("Custom Error")).toBeInTheDocument();
 expect(screen.getByText("Detailed Description")).toBeInTheDocument();
 });

 it("Should display retry button", () => {
 const handleRetry = vi.fn();
 render(<ErrorEmpty onRetry={handleRetry} />);

 const button = screen.getByRole("button", { name: /Retry/ });
 fireEvent.click(button);
 expect(handleRetry).toHaveBeenCalledTimes(1);
 });
});
