import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateLeaveBalance,
  getConfirmedMonthsInYear,
  getElapsedMonthsPostConfirmation,
  roundLeaveDays,
  ROUNDING_POLICY,
  DEFAULT_LEAVE_CONFIG
} from '../lib/leaveEngine.js';

describe('Leave Engine - Rounding Policies', () => {
  it('rounds up to next whole day by default (ROUND_UP_WHOLE_DAY)', () => {
    assert.equal(roundLeaveDays(1.2), 2);
    assert.equal(roundLeaveDays(11.33), 12);
    assert.equal(roundLeaveDays(13.67), 14);
    assert.equal(roundLeaveDays(13.0), 13);
  });

  it('rounds to standard 2 decimal places when requested', () => {
    assert.equal(roundLeaveDays(1.6666667, ROUNDING_POLICY.TWO_DECIMAL_PLACES), 1.67);
    assert.equal(roundLeaveDays(13.333333, ROUNDING_POLICY.TWO_DECIMAL_PLACES), 13.33);
  });

  it('rounds to nearest half day', () => {
    assert.equal(roundLeaveDays(1.24, ROUNDING_POLICY.NEAREST_HALF_DAY), 1.0);
    assert.equal(roundLeaveDays(1.25, ROUNDING_POLICY.NEAREST_HALF_DAY), 1.5);
    assert.equal(roundLeaveDays(1.74, ROUNDING_POLICY.NEAREST_HALF_DAY), 1.5);
    assert.equal(roundLeaveDays(1.75, ROUNDING_POLICY.NEAREST_HALF_DAY), 2.0);
    assert.equal(roundLeaveDays(13.333, ROUNDING_POLICY.NEAREST_HALF_DAY), 13.5);
  });

  it('rounds up to the next half day', () => {
    assert.equal(roundLeaveDays(1.01, ROUNDING_POLICY.ROUND_UP_HALF_DAY), 1.5);
    assert.equal(roundLeaveDays(1.5, ROUNDING_POLICY.ROUND_UP_HALF_DAY), 1.5);
    assert.equal(roundLeaveDays(1.51, ROUNDING_POLICY.ROUND_UP_HALF_DAY), 2.0);
  });

  it('rounds down to the lower half day', () => {
    assert.equal(roundLeaveDays(1.49, ROUNDING_POLICY.ROUND_DOWN_HALF_DAY), 1.0);
    assert.equal(roundLeaveDays(1.5, ROUNDING_POLICY.ROUND_DOWN_HALF_DAY), 1.5);
    assert.equal(roundLeaveDays(1.99, ROUNDING_POLICY.ROUND_DOWN_HALF_DAY), 1.5);
  });

  it('rounds to nearest whole day', () => {
    assert.equal(roundLeaveDays(13.33, ROUNDING_POLICY.NEAREST_WHOLE_DAY), 13);
    assert.equal(roundLeaveDays(16.67, ROUNDING_POLICY.NEAREST_WHOLE_DAY), 17);
  });

  it('preserves unrounded floats when NO_ROUNDING is selected', () => {
    const raw = 10 / 3;
    assert.equal(roundLeaveDays(raw, ROUNDING_POLICY.NO_ROUNDING), raw);
  });

  it('safely handles non-numeric and NaN values', () => {
    assert.equal(roundLeaveDays(NaN), 0);
    assert.equal(roundLeaveDays(Infinity), 0);
    assert.equal(roundLeaveDays(null), 0);
    assert.equal(roundLeaveDays('invalid'), 0);
  });
});

describe('Leave Engine - Mid-Month Confirmation & Confirmed Months', () => {
  const leaveYear = 2026;

  it('includes confirmation month if confirmed on or before 15th', () => {
    const months = getConfirmedMonthsInYear('2026-03-12', leaveYear, 15);
    assert.equal(months, 10);
  });

  it('includes confirmation month if confirmed exactly on 15th', () => {
    const months = getConfirmedMonthsInYear('2026-03-15', leaveYear, 15);
    assert.equal(months, 10);
  });

  it('excludes confirmation month if confirmed after 15th (starts next month)', () => {
    const months = getConfirmedMonthsInYear('2026-03-16', leaveYear, 15);
    assert.equal(months, 9);
  });

  it('returns 1 confirmed month for December confirmation on or before 15th', () => {
    const months = getConfirmedMonthsInYear('2026-12-05', leaveYear, 15);
    assert.equal(months, 1);
  });

  it('returns 0 confirmed months for December confirmation after 15th', () => {
    const months = getConfirmedMonthsInYear('2026-12-20', leaveYear, 15);
    assert.equal(months, 0);
  });

  it('returns 12 confirmed months for employees confirmed in prior years', () => {
    const months = getConfirmedMonthsInYear('2024-06-10', leaveYear, 15);
    assert.equal(months, 12);
  });

  it('returns 0 confirmed months if confirmation is in a future year', () => {
    const months = getConfirmedMonthsInYear('2027-01-15', leaveYear, 15);
    assert.equal(months, 0);
  });

  it('returns 0 if confirmation date is missing or invalid', () => {
    assert.equal(getConfirmedMonthsInYear(null, leaveYear), 0);
    assert.equal(getConfirmedMonthsInYear('invalid-date', leaveYear), 0);
  });
});

describe('Leave Engine - Rule 1: Confirmation-Year Proration Rule', () => {
  const policy = {
    contractAnnualLeaveDays: 24,
    roundingPolicy: ROUNDING_POLICY.TWO_DECIMAL_PLACES
  };

  it('Pre-confirmation: entitlement = 0 when confirmation date is in future relative to referenceDate', () => {
    const result = calculateLeaveBalance(
      { confirmationDate: '2026-09-01' },
      policy,
      new Date('2026-04-15')
    );

    assert.equal(result.isConfirmed, false);
    assert.equal(result.isPreConfirmation, true);
    assert.equal(result.entitledDays, 0);
    assert.equal(result.earnedLeave, 0);
    assert.equal(result.available, 0);
  });

  it('Pre-confirmation: entitlement = 0 when confirmationDate is null/undefined', () => {
    const result = calculateLeaveBalance(
      { confirmationDate: null, employmentStatus: 'PROBATION' },
      policy,
      new Date('2026-06-15')
    );

    assert.equal(result.isConfirmed, false);
    assert.equal(result.isPreConfirmation, true);
    assert.equal(result.entitledDays, 0);
    assert.equal(result.earnedLeave, 0);
    assert.equal(result.available, 0);
  });

  it('Year of Confirmation: prorates entitlement as (Confirmed Months / 12) * Contract Days', () => {
    const result = calculateLeaveBalance(
      { confirmationDate: '2026-05-10' },
      policy,
      new Date('2026-05-15')
    );

    assert.equal(result.isConfirmationYear, true);
    assert.equal(result.confirmedMonthsInYear, 8);
    assert.equal(result.contractAnnualLeaveDays, 24);
    assert.equal(result.entitledDays, 16);
  });

  it('Year of Confirmation: prorates with mid-month cutoff after 15th', () => {
    const result = calculateLeaveBalance(
      { confirmationDate: '2026-05-20' },
      policy,
      new Date('2026-06-15')
    );

    assert.equal(result.isConfirmationYear, true);
    assert.equal(result.confirmedMonthsInYear, 7);
    assert.equal(result.entitledDays, 14);
  });

  it('Post-Confirmation Years: receives 100% of Contract Days (Confirmed Months = 12)', () => {
    const result = calculateLeaveBalance(
      { confirmationDate: '2025-08-10' },
      policy,
      new Date('2026-06-15')
    );

    assert.equal(result.isPostConfirmationYear, true);
    assert.equal(result.confirmedMonthsInYear, 12);
    assert.equal(result.entitledDays, 24);
  });
});

describe('Leave Engine - Rule 2: Earned Leave (Accrual) Rule & Toggle', () => {
  const policy = {
    contractAnnualLeaveDays: 24,
    isAccrualEnabled: true,
    roundingPolicy: ROUNDING_POLICY.TWO_DECIMAL_PLACES
  };

  it('calculates monthly accrual progressively', () => {
    const result = calculateLeaveBalance(
      { confirmationDate: '2025-10-15' },
      policy,
      new Date('2026-06-20')
    );

    assert.equal(result.confirmedMonthsInYear, 12);
    assert.equal(result.elapsedMonthsInYear, 6);
    assert.equal(result.monthlyAccrualRate, 2);
    assert.equal(result.earnedLeave, 12);
    assert.equal(result.available, 12);
  });

  it('does not accrue current month before cutoff day (day < 15)', () => {
    const result = calculateLeaveBalance(
      { confirmationDate: '2025-10-15' },
      policy,
      new Date('2026-06-10')
    );

    assert.equal(result.elapsedMonthsInYear, 5);
    assert.equal(result.earnedLeave, 10);
    assert.equal(result.available, 10);
  });

  it('clamps elapsed months so earned leave never exceeds Entitled Days', () => {
    const result = calculateLeaveBalance(
      { confirmationDate: '2025-10-15' },
      policy,
      new Date('2026-12-31')
    );

    assert.equal(result.elapsedMonthsInYear, 12);
    assert.equal(result.earnedLeave, 24);
    assert.ok(result.earnedLeave <= result.entitledDays);
  });

  it('confirmation year accrual: only counts active confirmed months post-confirmation', () => {
    const result = calculateLeaveBalance(
      { confirmationDate: '2026-04-10' },
      policy,
      new Date('2026-06-20')
    );

    assert.equal(result.confirmedMonthsInYear, 9);
    assert.equal(result.entitledDays, 18);
    assert.equal(result.elapsedMonthsInYear, 3);
    assert.equal(result.earnedLeave, 6);
    assert.equal(result.available, 6);
  });

  it('Manual Override Toggle (isAccrualEnabled: true) caps available balance at earned leave minus taken', () => {
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

    assert.equal(result.earnedLeave, 6);
    assert.equal(result.grossAvailable, 4);
    assert.equal(result.available, 3);
  });

  it('Manual Override Toggle (isAccrualEnabled: false) provides immediate access to full entitled days minus taken', () => {
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

    assert.equal(result.isAccrualEnabled, false);
    assert.equal(result.entitledDays, 18);
    assert.equal(result.earnedLeave, 6);
    assert.equal(result.grossAvailable, 16);
    assert.equal(result.available, 15);
  });

  it('Employee-level override takes precedence over Policy-level setting', () => {
    const result = calculateLeaveBalance(
      {
        confirmationDate: '2026-04-10',
        leaveTaken: 0,
        isAccrualEnabled: false
      },
      { ...policy, isAccrualEnabled: true },
      new Date('2026-06-20')
    );

    assert.equal(result.isAccrualEnabled, false);
    assert.equal(result.available, 18);
  });
});

describe('Leave Engine - Guard Clauses & Edge Cases', () => {
  const policy = {
    contractAnnualLeaveDays: 20,
    roundingPolicy: ROUNDING_POLICY.TWO_DECIMAL_PLACES
  };

  it('handles division-by-zero safely when Confirmed Months in Year === 0', () => {
    const result = calculateLeaveBalance(
      { confirmationDate: '2026-12-20' },
      policy,
      new Date('2026-12-25')
    );

    assert.equal(result.confirmedMonthsInYear, 0);
    assert.equal(result.entitledDays, 0);
    assert.equal(result.monthlyAccrualRate, 0);
    assert.equal(result.earnedLeave, 0);
    assert.equal(result.available, 0);
    assert.ok(Number.isFinite(result.available));
    assert.ok(!isNaN(result.available));
  });

  it('handles zero contract leave days without error', () => {
    const result = calculateLeaveBalance(
      { confirmationDate: '2025-01-01' },
      { contractAnnualLeaveDays: 0 },
      new Date('2026-06-15')
    );

    assert.equal(result.contractAnnualLeaveDays, 0);
    assert.equal(result.entitledDays, 0);
    assert.equal(result.earnedLeave, 0);
    assert.equal(result.available, 0);
  });

  it('floors available balance at 0 by default when leave taken exceeds earned leave', () => {
    const result = calculateLeaveBalance(
      {
        confirmationDate: '2025-01-01',
        leaveTaken: 30
      },
      policy,
      new Date('2026-06-15')
    );

    assert.equal(result.available, 0);
  });

  it('allows negative balance when allowNegativeBalance is true', () => {
    const result = calculateLeaveBalance(
      {
        confirmationDate: '2025-01-01',
        leaveTaken: 15
      },
      { ...policy, isAccrualEnabled: true, allowNegativeBalance: true },
      new Date('2026-06-15')
    );

    assert.equal(result.earnedLeave, 10);
    assert.equal(result.available, -5);
  });

  it('supports employee.probationEndDate as confirmationDate fallback', () => {
    const result = calculateLeaveBalance(
      { probationEndDate: '2025-06-15' },
      policy,
      new Date('2026-06-15')
    );

    assert.equal(result.isConfirmed, true);
    assert.equal(result.entitledDays, 20);
  });
});
