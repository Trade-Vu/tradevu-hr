/**
 * Global test setup for Vitest + @testing-library/react
 * Runs before each test file.
 */
import '@testing-library/jest-dom';
import { beforeAll, afterEach, afterAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from './mocks/server.js';

// Polyfill ResizeObserver for Radix UI components
if (typeof global.ResizeObserver === 'undefined') {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// Setup MSW before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Auto-cleanup after each test to prevent DOM leaks and reset MSW handlers
afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.clearAllMocks();
  server.resetHandlers();
});

// Clean up MSW after all tests
afterAll(() => server.close());
