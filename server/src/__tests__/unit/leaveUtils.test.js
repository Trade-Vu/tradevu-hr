import { describe, it, expect } from 'vitest';
import { calculateBusinessDays } from '../../utils/leaveUtils.js';

describe('leaveUtils', () => {
  describe('calculateBusinessDays', () => {
    it('calculates days correctly when start and end are the same day (weekday)', () => {
      // Wednesday
      const start = new Date('2023-11-01');
      const end = new Date('2023-11-01');
      expect(calculateBusinessDays(start, end)).toBe(1);
    });

    it('calculates days correctly across a single weekend', () => {
      // Friday to Monday (should be 2 days: Friday and Monday)
      const start = new Date('2023-11-03');
      const end = new Date('2023-11-06');
      expect(calculateBusinessDays(start, end)).toBe(2);
    });

    it('returns 0 when start and end are on a weekend', () => {
      // Saturday to Sunday
      const start = new Date('2023-11-04');
      const end = new Date('2023-11-05');
      expect(calculateBusinessDays(start, end)).toBe(0);
    });

    it('calculates a full week accurately', () => {
      // Monday to Sunday (should be 5 days)
      const start = new Date('2023-11-06');
      const end = new Date('2023-11-12');
      expect(calculateBusinessDays(start, end)).toBe(5);
    });

    it('handles multiple weeks properly', () => {
      // Monday to next Friday (12 days total, 10 business days)
      const start = new Date('2023-11-06');
      const end = new Date('2023-11-17');
      expect(calculateBusinessDays(start, end)).toBe(10);
    });

    it('throws or handles inverted dates gracefully if expected', () => {
      // If end is before start, the loop won't run, should return 0
      const start = new Date('2023-11-06');
      const end = new Date('2023-11-01');
      expect(calculateBusinessDays(start, end)).toBe(0);
    });
  });
});
