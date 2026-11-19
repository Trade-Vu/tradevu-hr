import { describe, it, expect } from 'vitest';
import {
  calculateLeaveBalance,
  getConfirmedMonthsInYear,
  getElapsedMonthsPostConfirmation,
  roundLeaveDays,
  ROUNDING_POLICY,
  DEFAULT_LEAVE_CONFIG
} from '../lib/leaveEngine.js';

describe('Leave Engine - Rounding Policies', () => {
  it('rounds to standard 2 decimal places by default', () => {
    expect(roundLeaveDays(1.6666667, ROUNDING_POLICY.TWO_DECIMAL_PLACES)).toBe(1.67);
    expect(roundLeaveDays(13.333333, ROUNDING_POLICY.TWO_DECIMAL_PLACES)).toBe(13.33);
  });

  it('rounds to nearest half day', () => {
    expect(roundLeaveDays(1.24, ROUNDING_POLICY.NEAREST_HALF_DAY)).toBe(1.0);
    expect(roundLeaveDays(1.25, ROUNDING_POLICY.NEAREST_HALF_DAY)).toBe(1.5);
    expect(roundLeaveDays(1.74, ROUNDING_POLICY.NEAREST_HALF_DAY)).toBe(1.5);
    expect(roundLeaveDays(1.75, ROUNDING_POLICY.NEAREST_HALF_DAY)).toBe(2.0);
    expect(roundLeaveDays(13.333, ROUNDING_POLICY.NEAREST_HALF_DAY)).toBe(13.5);
  });

  it('rounds up to the next half day', () => {
    expect(roundLeaveDays(1.01, ROUNDING_POLICY.ROUND_UP_HALF_DAY)).toBe(1.5);
    expect(roundLeaveDays(1.5, ROUNDING_POLICY.ROUND_UP_HALF_DAY)).toBe(1.5);
    expect(roundLeaveDays(1.51, ROUNDING_POLICY.ROUND_UP_HALF_DAY)).toBe(2.0);
  });

  it('rounds down to the lower half day', () => {
    expect(roundLeaveDays(1.49, ROUNDING_POLICY.ROUND_DOWN_HALF_DAY)).toBe(1.0);
    expect(roundLeaveDays(1.5, ROUNDING_POLICY.ROUND_DOWN_HALF_DAY)).toBe(1.5);
    expect(roundLeaveDays(1.99, ROUNDING_POLICY.ROUND_DOWN_HALF_DAY)).toBe(1.5);
  });

  it('rounds to nearest whole day', () => {
    expect(roundLeaveDays(13.33, ROUNDING_POLICY.NEAREST_WHOLE_DAY)).toBe(13);
    expect(roundLeaveDays(16.67, ROUNDING_POLICY.NEAREST_WHOLE_DAY)).toBe(17);
  });

  it('preserves unrounded floats when NO_ROUNDING is selected', () => {
    const raw = 10 / 3;
    expect(roundLeaveDays(raw, ROUNDING_POLICY.NO_ROUNDING)).toBe(raw);
  });

  it('safely handles non-numeric and NaN values', () => {
    expect(roundLeaveDays(NaN)).toBe(0);
    expect(roundLeaveDays(Infinity)).toBe(0);
    expect(roundLeaveDays(null)).toBe(0);
    expect(roundLeaveDays('invalid')).toBe(0);
  });
});

describe('Leave Engine - Mid-Month Confirmation & Confirmed Months', () => {
  const leaveYear = 2026;

  it('includes confirmation month if confirmed on or before 15th', () => {
    // Confirmed March 12: March through December = 10 months
    const months = getConfirmedMonthsInYear('2026-03-12', leaveYear, 15);
    expect(months).toBe(10);
  });

  it('includes confirmation month if confirmed exactly on 15th', () => {
    // Confirmed March 15: March through December = 10 months
    const months = getConfirmedMonthsInYear('2026-03-15', leaveYear, 15);
    expect(months).toBe(10);
  });

  it('excludes confirmation month if confirmed after 15th (starts next month)', () => {
    // Confirmed March 16: April through December = 9 months
    const months = getConfirmedMonthsInYear('2026-03-16', leaveYear, 15);
    expect(months).toBe(9);
  });

  it('returns 1 confirmed month for December confirmation on or before 15th', () => {
    const months = getConfirmedMonthsInYear('2026-12-05', leaveYear, 15);
    expect(months).toBe(1);
  });

  it('returns 0 confirmed months for December confirmation after 15th', () => {
    const months = getConfirmedMonthsInYear('2026-12-20', leaveYear, 15);
    expect(months).toBe(0);
  });

  it('returns 12 confirmed months for employees confirmed in prior years (post-confirmation)', () => {
    const months = getConfirmedMonthsInYear('2024-06-10', leaveYear, 15);
    expect(months).toBe(12);
  });

  it('returns 0 confirmed months if confirmation is in a future year', () => {
    const months = getConfirmedMonthsInYear('2027-01-15', leaveYear, 15);
    expect(months).toBe(0);
  });

  it('returns 0 if confirmation date is missing or invalid', () => {
    expect(getConfirmedMonthsInYear(null, leaveYear)).toBe(0);
    expect(getConfirmedMonthsInYear('invalid-date', leaveYear)).toBe(0);
  });
});

describe('Leave Engine - Rule 1: Confirmation-Year Proration Rule', () => {
  const policy = {
    contractAnnualLeaveDays: 24,
    roundingPolicy: ROUNDING_POLICY.TWO_DECIMAL_PLACES
  };

  it('Pre-confirmation: entitlement = 0 when confirmation date is in the future relative to referenceDate', () => {
    const result = calculateLeaveBalance(
      { confirmationDate: '2026-09-01' },
      policy,
      new Date('2026-04-15') // Reference date before confirmation
    );

    expect(result.isConfirmed).toBe(false);
    expect(result.isPreConfirmation).toBe(true);
    expect(result.entitledDays).toBe(0);
    expect(result.earnedLeave).toBe(0);
    expect(result.available).toBe(0);
  });

  it('Pre-confirmation: entitlement = 0 when confirmationDate is null/undefined', () => {
    const result = calculateLeaveBalance(
      { confirmationDate: null, employmentStatus: 'PROBATION' },
      policy,
      new Date('2026-06-15')
    );

    expect(result.isConfirmed).toBe(false);
    expect(result.isPreConfirmation).toBe(true);
    expect(result.entitledDays).toBe(0);
    expect(result.earnedLeave).toBe(0);
    expect(result.available).toBe(0);
  });

  it('Year of Confirmation: prorates entitlement as (Confirmed Months / 12) * Contract Days', () => {
    // Confirmed May 10, 2026 (<= 15th): May through Dec = 8 months
    // Prorated entitlement = (8 / 12) * 24 = 16 days
    const result = calculateLeaveBalance(
      { confirmationDate: '2026-05-10' },
      policy,
      new Date('2026-05-15')
    );

    expect(result.isConfirmationYear).toBe(true);
    expect(result.confirmedMonthsInYear).toBe(8);
    expect(result.contractAnnualLeaveDays).toBe(24);
    expect(result.entitledDays).toBe(16);
  });

  it('Year of Confirmation: prorates with mid-month cutoff after 15th', () => {
    // Confirmed May 20, 2026 (> 15th): June through Dec = 7 months
    // Prorated entitlement = (7 / 12) * 24 = 14 days
    const result = calculateLeaveBalance(
      { confirmationDate: '2026-05-20' },
      policy,
      new Date('2026-06-15')
    );

    expect(result.isConfirmationYear).toBe(true);
    expect(result.confirmedMonthsInYear).toBe(7);
    expect(result.entitledDays).toBe(14);
  });

  it('Post-Confirmation Years: receives 100% of Contract Days (Confirmed Months = 12)', () => {
    // Confirmed in 2025, evaluated in 2026
    const result = calculateLeaveBalance(
      { confirmationDate: '2025-08-10' },
      policy,
      new Date('2026-06-15')
    );

    expect(result.isPostConfirmationYear).toBe(true);
    expect(result.confirmedMonthsInYear).toBe(12);
    expect(result.entitledDays).toBe(24); // 100% of contract days
  });
});

describe('Leave Engine - Rule 2: Earned Leave (Accrual) Rule & Toggle', () => {
  const policy = {
    contractAnnualLeaveDays: 24,
    isAccrualEnabled: true,
    roundingPolicy: ROUNDING_POLICY.TWO_DECIMAL_PLACES
  };

  it('calculates monthly accrual progressively: (Entitled Days / Confirmed Months) * Elapsed Months', () => {
    // Confirmed in previous year (2025) -> Confirmed months = 12, Entitled = 24 days.
    // Monthly accrual rate = 24 / 12 = 2 days/month.
    // Evaluated on June 20, 2026 (day >= 15th -> 6 elapsed months: Jan, Feb, Mar, Apr, May, Jun).
    const result = calculateLeaveBalance(
      { confirmationDate: '2025-10-15' },
      policy,
      new Date('2026-06-20')
    );

    expect(result.confirmedMonthsInYear).toBe(12);
    expect(result.elapsedMonthsInYear).toBe(6);
    expect(result.monthlyAccrualRate).toBe(2);
    expect(result.earnedLeave).toBe(12); // 2 * 6 = 12
    expect(result.available).toBe(12);
  });

  it('does not accrue the current month before the cutoff day (day < 15)', () => {
    // Evaluated on June 10, 2026 (day < 15th -> 5 elapsed months: Jan, Feb, Mar, Apr, May)
    const result = calculateLeaveBalance(
      { confirmationDate: '2025-10-15' },
      policy,
      new Date('2026-06-10')
    );

    expect(result.elapsedMonthsInYear).toBe(5);
    expect(result.earnedLeave).toBe(10); // 2 * 5 = 10
    expect(result.available).toBe(10);
  });

  it('clamps elapsed months so earned leave never exceeds Entitled Days', () => {
    // Evaluated at end of year or into next year
    const result = calculateLeaveBalance(
      { confirmationDate: '2025-10-15' },
      policy,
      new Date('2026-12-31')
    );

    expect(result.elapsedMonthsInYear).toBe(12);
    expect(result.earnedLeave).toBe(24);
    expect(result.earnedLeave).toBeLessThanOrEqual(result.entitledDays);
  });

  it('confirmation year accrual: only counts active confirmed months post-confirmation', () => {
    // Confirmed April 10, 2026 (<= 15th): Confirmed months = 9 (Apr to Dec).
    // Entitled = (9 / 12) * 24 = 18 days.
    // Monthly accrual rate = 18 / 9 = 2 days/month.
    // Evaluated on June 20, 2026: April, May, June = 3 active months elapsed.
    // Earned Leave = (18 / 9) * 3 = 6 days.
    const result = calculateLeaveBalance(
      { confirmationDate: '2026-04-10' },
      policy,
      new Date('2026-06-20')
    );

    expect(result.confirmedMonthsInYear).toBe(9);
    expect(result.entitledDays).toBe(18);
    expect(result.elapsedMonthsInYear).toBe(3);
    expect(result.earnedLeave).toBe(6);
    expect(result.available).toBe(6);
  });

  it('Manual Override Toggle (isAccrualEnabled: true) caps available balance at earned leave minus taken', () => {
    // Earned leave = 6 days, leave taken = 2 days -> Available = 4 days
    const result = calculateLeaveBalance(
      {
        confirmationDate: '2026-04-10',
        leaveTaken: 2,
        pending: 1,
        isAccrualEnabled: true
      },
      policy,
      new Date('2026-06-20')
    );

    expect(result.earnedLeave).toBe(6);
    expect(result.grossAvailable).toBe(4); // 6 - 2
    expect(result.available).toBe(3);      // 6 - 2 - 1
  });

  it('Manual Override Toggle (isAccrualEnabled: false) provides immediate access to full entitled days minus taken', () => {
    // Full entitled = 18 days, leave taken = 2 days -> Available = 16 days (not capped at 6)
    const result = calculateLeaveBalance(
      {
        confirmationDate: '2026-04-10',
        leaveTaken: 2,
        pending: 1,
        isAccrualEnabled: false
      },
      policy,
      new Date('2026-06-20')
    );

    expect(result.isAccrualEnabled).toBe(false);
    expect(result.entitledDays).toBe(18);
    expect(result.earnedLeave).toBe(6);
    expect(result.grossAvailable).toBe(16); // 18 - 2
    expect(result.available).toBe(15);      // 18 - 2 - 1
  });

  it('Employee-level override takes precedence over Policy-level setting', () => {
    // Policy has isAccrualEnabled = true, but Employee overrides to false
    const result = calculateLeaveBalance(
      {
        confirmationDate: '2026-04-10',
        leaveTaken: 0,
        isAccrualEnabled: false
      },
      { ...policy, isAccrualEnabled: true },
      new Date('2026-06-20')
    );

    expect(result.isAccrualEnabled).toBe(false);
    expect(result.available).toBe(18); // Full entitled, not capped at 6
  });
});

describe('Leave Engine - Guard Clauses & Edge Cases', () => {
  const policy = {
    contractAnnualLeaveDays: 20,
    roundingPolicy: ROUNDING_POLICY.TWO_DECIMAL_PLACES
  };

  it('handles division-by-zero safely when Confirmed Months in Year === 0', () => {
    // Confirmed Dec 20, 2026 (> 15th): Confirmed Months = 0.
    const result = calculateLeaveBalance(
      { confirmationDate: '2026-12-20' },
      policy,
      new Date('2026-12-25')
    );

    expect(result.confirmedMonthsInYear).toBe(0);
    expect(result.entitledDays).toBe(0);
    expect(result.monthlyAccrualRate).toBe(0);
    expect(result.earnedLeave).toBe(0);
    expect(result.available).toBe(0);
    expect(Number.isFinite(result.available)).toBe(true);
    expect(isNaN(result.available)).toBe(false);
  });

  it('handles zero contract leave days without error', () => {
    const result = calculateLeaveBalance(
      { confirmationDate: '2025-01-01' },
      { contractAnnualLeaveDays: 0 },
      new Date('2026-06-15')
    );

    expect(result.contractAnnualLeaveDays).toBe(0);
    expect(result.entitledDays).toBe(0);
    expect(result.earnedLeave).toBe(0);
    expect(result.available).toBe(0);
  });

  it('floors available balance at 0 by default when leave taken exceeds earned leave', () => {
    const result = calculateLeaveBalance(
      {
        confirmationDate: '2025-01-01',
        leaveTaken: 30 // Exceeds entitlement of 20
      },
      policy,
      new Date('2026-06-15')
    );

    expect(result.available).toBe(0);
  });

  it('allows negative balance when allowNegativeBalance is true', () => {
    const result = calculateLeaveBalance(
      {
        confirmationDate: '2025-01-01',
        leaveTaken: 15
      },
      { ...policy, isAccrualEnabled: true, allowNegativeBalance: true },
      new Date('2026-06-15') // Earned leave is 10 days
    );

    expect(result.earnedLeave).toBe(10);
    expect(result.available).toBe(-5); // 10 - 15 = -5
  });

  it('supports employee.probationEndDate as confirmationDate fallback', () => {
    const result = calculateLeaveBalance(
      { probationEndDate: '2025-06-15' },
      policy,
      new Date('2026-06-15')
    );

    expect(result.isConfirmed).toBe(true);
    expect(result.entitledDays).toBe(20);
  });
});
