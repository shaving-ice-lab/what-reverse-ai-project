/**
 * Vitest TestSettingsFile
 */

import React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Make React available globally for JSX
globalThis.React = React;

// eachTestafterClean up
afterEach(() => {
 cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
 writable: true,
 value: vi.fn().mockImplementation((query) => ({
 matches: false,
 media: query,
 onchange: null,
 addListener: vi.fn(),
 removeListener: vi.fn(),
 addEventListener: vi.fn(),
 removeEventListener: vi.fn(),
 dispatchEvent: vi.fn(),
 })),
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
 observe = vi.fn();
 unobserve = vi.fn();
 disconnect = vi.fn();
} as unknown as typeof globalThis.ResizeObserver;

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
 readonly root = null;
 readonly rootMargin = "0px";
 readonly thresholds = [0];
 observe = vi.fn();
 unobserve = vi.fn();
 disconnect = vi.fn();
 takeRecords = vi.fn().mockReturnValue([]);
 constructor(_callback?: IntersectionObserverCallback, _options?: IntersectionObserverInit) {}
} as unknown as typeof globalThis.IntersectionObserver;

// Mock localStorage
const localStorageMock = {
 getItem: vi.fn(),
 setItem: vi.fn(),
 removeItem: vi.fn(),
 clear: vi.fn(),
 length: 0,
 key: vi.fn(),
};
Object.defineProperty(window, "localStorage", { value: localStorageMock });

// Mock scrollTo
window.scrollTo = vi.fn();

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 0));
global.cancelAnimationFrame = vi.fn((id) => clearTimeout(id));

// Mock fetch
global.fetch = vi.fn();
