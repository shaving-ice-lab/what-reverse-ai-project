/**
 * EmptyState ComponentTest
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
 it("ShouldcurrentlyRenderTitle", () => {
 render(<EmptyState title="NoData" />);
 expect(screen.getByText("NoData")).toBeInTheDocument();
 });

 it("ShouldRenderDescriptionText", () => {
 render(<EmptyState title="Title" description="thisisDescription" />);
 expect(screen.getByText("thisisDescription")).toBeInTheDocument();
 });

 it("ShouldRenderActionButton", () => {
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

 it("ShouldRendertimesneedActionButton", () => {
 const handlePrimary = vi.fn();
 const handleSecondary = vi.fn();
 render(
 <EmptyState
 title="Empty State"
 action={{ label: "mainneed", onClick: handlePrimary }}
 secondaryAction={{ label: "timesneed", onClick: handleSecondary }}
 />
 );

 expect(screen.getByRole("button", { name: /mainneed/ })).toBeInTheDocument();
 expect(screen.getByRole("button", { name: "timesneed" })).toBeInTheDocument();
 });

 it("ShouldAppnot'sDimension", () => {
 const { rerender } = render(
 <EmptyState title="Test" size="sm" />
 );
 // EmptyState outside div has size forshould's padding class
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
 it("ShouldDisplaySearch", () => {
 render(<SearchEmpty query="TestKeywords" />);
 expect(screen.getByText(/Noto.*TestKeywords/)).toBeInTheDocument();
 });

 it("ShouldDisplayClearButton", () => {
 const handleClear = vi.fn();
 render(<SearchEmpty query="Test" onClear={handleClear} />);

 const button = screen.getByRole("button", { name: /ClearSearch/ });
 fireEvent.click(button);
 expect(handleClear).toHaveBeenCalledTimes(1);
 });
});

describe("WorkflowEmpty", () => {
 it("ShouldcurrentlyRender", () => {
 render(<WorkflowEmpty />);
 expect(screen.getByText("Not yetWorkflow")).toBeInTheDocument();
 });

 it("ShouldDisplayCreateButton", () => {
 const handleCreate = vi.fn();
 render(<WorkflowEmpty onCreateClick={handleCreate} />);

 const button = screen.getByRole("button", { name: /CreateWorkflow/ });
 fireEvent.click(button);
 expect(handleCreate).toHaveBeenCalledTimes(1);
 });
});

describe("ApiKeyEmpty", () => {
 it("ShouldcurrentlyRender", () => {
 render(<ApiKeyEmpty />);
 expect(screen.getByText("Not yet API Key")).toBeInTheDocument();
 });

 it("ShouldDisplayAddButton", () => {
 const handleAdd = vi.fn();
 render(<ApiKeyEmpty onAddClick={handleAdd} />);

 const button = screen.getByRole("button", { name: /AddKey/ });
 fireEvent.click(button);
 expect(handleAdd).toHaveBeenCalledTimes(1);
 });
});

describe("ErrorEmpty", () => {
 it("ShouldDisplayDefaultErrorMessage", () => {
 render(<ErrorEmpty />);
 expect(screen.getByText("LoadFailed")).toBeInTheDocument();
 });

 it("ShouldDisplayCustomErrorMessage", () => {
 render(<ErrorEmpty title="CustomError" description="DetailedDescription" />);
 expect(screen.getByText("CustomError")).toBeInTheDocument();
 expect(screen.getByText("DetailedDescription")).toBeInTheDocument();
 });

 it("ShouldDisplayRetryButton", () => {
 const handleRetry = vi.fn();
 render(<ErrorEmpty onRetry={handleRetry} />);

 const button = screen.getByRole("button", { name: /Retry/ });
 fireEvent.click(button);
 expect(handleRetry).toHaveBeenCalledTimes(1);
 });
});
