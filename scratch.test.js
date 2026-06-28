import { describe, it, expect, vi } from 'vitest';
describe('test', () => {
  it('test', () => {
    vi.stubEnv('VITE_TEST_VAR', undefined);
    expect(import.meta.env.VITE_TEST_VAR).toBeUndefined();
  });
});
