/**
 * Global test setup for Vitest + @testing-library/react
 * Runs before each test file.
 */
import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Auto-cleanup after each test to prevent DOM leaks
afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.clearAllMocks();
});
