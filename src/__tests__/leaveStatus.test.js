/**
 * Unit tests for the leave status helpers.
 * The backend stores leave status as an uppercase enum and never formats it for display,
 * so these helpers own both the presentation casing and tolerance for the legacy lowercase
 * values older rows still carry.
 */
import { describe, it, expect } from 'vitest';
import {
  LEAVE_STATUS,
  formatLeaveStatus,
  getLeaveStatusBadgeClass,
  isPendingLeaveStatus,
  normalizeLeaveStatus,
} from '@/lib/leaveStatus';

describe('normalizeLeaveStatus', () => {
  it('uppercases legacy lowercase values', () => {
    expect(normalizeLeaveStatus('approved')).toBe(LEAVE_STATUS.APPROVED);
    expect(normalizeLeaveStatus('rejected')).toBe(LEAVE_STATUS.REJECTED);
    expect(normalizeLeaveStatus('cancelled')).toBe(LEAVE_STATUS.CANCELLED);
  });

  it('folds the legacy bare PENDING onto PENDING_APPROVAL', () => {
    expect(normalizeLeaveStatus('pending')).toBe(LEAVE_STATUS.PENDING_APPROVAL);
    expect(normalizeLeaveStatus('PENDING')).toBe(LEAVE_STATUS.PENDING_APPROVAL);
  });

  it('returns an empty string for missing values rather than throwing', () => {
    expect(normalizeLeaveStatus(undefined)).toBe('');
    expect(normalizeLeaveStatus(null)).toBe('');
  });
});

describe('formatLeaveStatus', () => {
  it('renders a canonical status as Title Case', () => {
    expect(formatLeaveStatus('APPROVED')).toBe('Approved');
    expect(formatLeaveStatus('REJECTED')).toBe('Rejected');
    expect(formatLeaveStatus('CANCELLED')).toBe('Cancelled');
  });

  it('spells out multi-word statuses', () => {
    expect(formatLeaveStatus('PENDING_APPROVAL')).toBe('Pending Approval');
    expect(formatLeaveStatus('NEEDS_INFORMATION')).toBe('Needs Information');
    expect(formatLeaveStatus('PENDING_HR')).toBe('Pending HR');
  });

  it('renders legacy lowercase rows the same way as canonical ones', () => {
    expect(formatLeaveStatus('approved')).toBe('Approved');
    expect(formatLeaveStatus('pending')).toBe('Pending Approval');
  });

  it('falls back to Title Case for an unrecognised status', () => {
    expect(formatLeaveStatus('SOME_NEW_STATE')).toBe('Some New State');
  });

  it('returns an empty string when there is no status', () => {
    expect(formatLeaveStatus(undefined)).toBe('');
  });
});

describe('getLeaveStatusBadgeClass', () => {
  it('gives legacy and canonical casings the same classes', () => {
    expect(getLeaveStatusBadgeClass('approved')).toBe(getLeaveStatusBadgeClass('APPROVED'));
    expect(getLeaveStatusBadgeClass('pending')).toBe(getLeaveStatusBadgeClass('PENDING_APPROVAL'));
  });

  it('distinguishes approved, rejected and pending', () => {
    const approved = getLeaveStatusBadgeClass('APPROVED');
    const rejected = getLeaveStatusBadgeClass('REJECTED');
    const pending = getLeaveStatusBadgeClass('PENDING_APPROVAL');
    expect(new Set([approved, rejected, pending]).size).toBe(3);
  });

  it('falls back to the pending style for an unknown status', () => {
    expect(getLeaveStatusBadgeClass('WAT')).toBe(getLeaveStatusBadgeClass('PENDING_APPROVAL'));
  });
});

describe('isPendingLeaveStatus', () => {
  it('treats every pending variant, in any casing, as pending', () => {
    expect(isPendingLeaveStatus('PENDING_APPROVAL')).toBe(true);
    expect(isPendingLeaveStatus('pending')).toBe(true);
    expect(isPendingLeaveStatus('PENDING_HR')).toBe(true);
  });

  it('does not treat finalized statuses as pending', () => {
    expect(isPendingLeaveStatus('APPROVED')).toBe(false);
    expect(isPendingLeaveStatus('rejected')).toBe(false);
    expect(isPendingLeaveStatus('CANCELLED')).toBe(false);
    expect(isPendingLeaveStatus(undefined)).toBe(false);
  });
});
