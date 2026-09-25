/**
 * Unit tests for ellipsifyMiddle, the defensive truncation used when rendering
 * error text that might echo back a raw path, token, or id (see AcceptInvite.jsx).
 */
import { describe, it, expect } from 'vitest';
import { ellipsifyMiddle } from '@/lib/utils';

describe('ellipsifyMiddle', () => {
  it('returns short text unchanged', () => {
    expect(ellipsifyMiddle('This invite link is invalid.', 160)).toBe('This invite link is invalid.');
  });

  it('returns empty string for null/undefined', () => {
    expect(ellipsifyMiddle(null)).toBe('');
    expect(ellipsifyMiddle(undefined)).toBe('');
  });

  it('truncates long text and keeps it under the max length', () => {
    const longId = 'Cannot GET /api/v1/auth/invite/' + '5e18be1dba3ef44711113c9a1968fbf06bd7b54da887037e02d6ea011b5d8384'.repeat(3);
    const result = ellipsifyMiddle(longId, 60);
    expect(result.length).toBeLessThanOrEqual(60);
    expect(result).toContain('…');
  });

  it('keeps both the start and end visible around the ellipsis', () => {
    const result = ellipsifyMiddle('START-'.repeat(20) + 'END', 30);
    expect(result.startsWith('START-')).toBe(true);
    expect(result.endsWith('END')).toBe(true);
  });
});
