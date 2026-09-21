import { describe, it, expect } from 'vitest';
import { isOnboardedStatus, isSeparatedStatus, isLeaveEligibleStatus } from '@/lib/employmentStatus';

describe('isOnboardedStatus', () => {
  it.each(['DRAFT', 'PENDING_APPROVAL', 'PENDING_ONBOARDING', 'ONGOING_ONBOARDING', 'pending_onboarding', undefined])(
    'treats %s as not onboarded',
    (status) => expect(isOnboardedStatus(status)).toBe(false),
  );

  it.each(['ACTIVE', 'PROBATION', 'ON_LEAVE', 'active'])('treats %s as onboarded', (status) => {
    expect(isOnboardedStatus(status)).toBe(true);
  });
});

describe('isLeaveEligibleStatus', () => {
  it.each(['TERMINATED', 'RESIGNED', 'OFFBOARDED', 'ARCHIVED', 'resigned'])('excludes former employees (%s)', (status) => {
    expect(isSeparatedStatus(status)).toBe(true);
    expect(isLeaveEligibleStatus(status)).toBe(false);
  });

  it.each(['DRAFT', 'PENDING_ONBOARDING'])('excludes not-yet-onboarded employees (%s)', (status) => {
    expect(isLeaveEligibleStatus(status)).toBe(false);
  });

  it.each(['ACTIVE', 'PROBATION', 'ON_LEAVE', 'SUSPENDED', 'notice_period'])('allows %s', (status) => {
    expect(isLeaveEligibleStatus(status)).toBe(true);
  });
});
