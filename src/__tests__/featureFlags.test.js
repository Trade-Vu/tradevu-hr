/**
 * Unit tests for the featureFlags utility.
 * Tests flag resolution in DEV and PROD-like environments.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// We need to be able to control import.meta.env in tests
// Vitest supports this via vi.stubEnv

describe('featureFlags — isFeatureEnabled', () => {
  // We dynamically import to pick up env changes
  async function getFlags() {
    // Clear module cache so env changes take effect
    vi.resetModules();
    const { isFeatureEnabled } = await import('@/lib/featureFlags');
    return isFeatureEnabled;
  }

  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('returns false for an unknown flag and warns', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const isFeatureEnabled = await getFlags();
    expect(isFeatureEnabled('DOES_NOT_EXIST')).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Unknown flag'));
    consoleSpy.mockRestore();
  });

  it('DEV_ONLY flags (MOCK_CEO_LOGIN) are always false when not in DEV', async () => {
    vi.stubEnv('DEV', false);
    vi.stubEnv('PROD', true);
    const isFeatureEnabled = await getFlags();
    expect(isFeatureEnabled('MOCK_CEO_LOGIN')).toBe(false);
  });

  it('DEV_ONLY flags are true by default in DEV', async () => {
    vi.stubEnv('DEV', true);
    const isFeatureEnabled = await getFlags();
    expect(isFeatureEnabled('MOCK_CEO_LOGIN')).toBe(true);
  });

  it('CSV_IMPORT flag respects VITE_FEATURE_CSV_IMPORT=true', async () => {
    vi.stubEnv('DEV', true);
    vi.stubEnv('VITE_FEATURE_CSV_IMPORT', 'true');
    const isFeatureEnabled = await getFlags();
    expect(isFeatureEnabled('CSV_IMPORT')).toBe(true);
  });

  it('CSV_IMPORT flag is false when env var is not set (prod-safe default)', async () => {
    vi.stubEnv('DEV', false);
    vi.stubEnv('PROD', true);
    const isFeatureEnabled = await getFlags();
    expect(isFeatureEnabled('CSV_IMPORT')).toBe(false);
  });

  it('VITE_FEATURE_CSV_IMPORT=false explicitly disables the flag', async () => {
    vi.stubEnv('DEV', true);
    vi.stubEnv('VITE_FEATURE_CSV_IMPORT', 'false');
    const isFeatureEnabled = await getFlags();
    expect(isFeatureEnabled('CSV_IMPORT')).toBe(false);
  });
});
