import { describe, it, expect } from 'vitest';
import { isEligibleManager } from '@/lib/roleUtils';

describe('isEligibleManager', () => {
  const baseActiveManager = {
    userActive: true,
    status: 'ACTIVE',
    role: 'MANAGER',
    jobTitle: 'General Manager',
  };

  it('allows active manager with MANAGER role', () => {
    expect(isEligibleManager(baseActiveManager)).toBe(true);
  });

  it('allows active user with Manager in job title even if role is EMPLOYEE', () => {
    expect(
      isEligibleManager({
        userActive: true,
        status: 'ACTIVE',
        role: 'EMPLOYEE',
        jobTitle: 'Engineering Manager',
      })
    ).toBe(true);
    expect(
      isEligibleManager({
        isUserActive: true,
        status: 'ACTIVE',
        role: 'EMPLOYEE',
        jobTitle: 'Product Manager',
      })
    ).toBe(true);
  });

  it('allows CEO via SUPER_ADMIN role or isOrgOwner or CEO title', () => {
    expect(
      isEligibleManager({
        userActive: true,
        status: 'ACTIVE',
        role: 'SUPER_ADMIN',
        jobTitle: 'Managing Partner',
      })
    ).toBe(true);

    expect(
      isEligibleManager({
        userActive: true,
        status: 'ACTIVE',
        role: 'EMPLOYEE',
        isOrgOwner: true,
      })
    ).toBe(true);

    expect(
      isEligibleManager({
        userActive: true,
        status: 'ACTIVE',
        role: 'EMPLOYEE',
        jobTitle: 'CEO',
      })
    ).toBe(true);

    expect(
      isEligibleManager({
        userActive: true,
        status: 'ACTIVE',
        role: 'EMPLOYEE',
        jobTitle: 'Chief Executive Officer',
      })
    ).toBe(true);
  });

  it('rejects users without active user account', () => {
    expect(
      isEligibleManager({
        ...baseActiveManager,
        userActive: false,
        isUserActive: false,
      })
    ).toBe(false);

    expect(
      isEligibleManager({
        ...baseActiveManager,
        userActive: undefined,
        isUserActive: undefined,
      })
    ).toBe(false);
  });

  it.each([
    'DRAFT',
    'PENDING_APPROVAL',
    'PENDING_ONBOARDING',
    'ONGOING_ONBOARDING',
    'SUSPENDED',
    'TERMINATED',
    'RESIGNED',
    'OFFBOARDED',
    'ARCHIVED',
    'draft',
    'pending_onboarding',
    'suspended',
  ])('rejects disallowed status: %s', (status) => {
    expect(
      isEligibleManager({
        ...baseActiveManager,
        status,
      })
    ).toBe(false);
    expect(
      isEligibleManager({
        ...baseActiveManager,
        employmentStatus: status,
      })
    ).toBe(false);
  });

  it('rejects users without Manager in role/title and not CEO', () => {
    expect(
      isEligibleManager({
        userActive: true,
        status: 'ACTIVE',
        role: 'EMPLOYEE',
        jobTitle: 'Frontend Engineer',
      })
    ).toBe(false);

    expect(
      isEligibleManager({
        userActive: true,
        status: 'ACTIVE',
        role: 'EMPLOYEE',
        jobTitle: 'Tech Lead',
      })
    ).toBe(false);

    expect(
      isEligibleManager({
        userActive: true,
        status: 'ACTIVE',
        role: 'EMPLOYEE',
        jobTitle: 'Supervisor',
      })
    ).toBe(false);

    expect(
      isEligibleManager({
        userActive: true,
        status: 'ACTIVE',
        role: 'HR_ADMIN',
        jobTitle: 'People Operations Specialist',
      })
    ).toBe(false);
  });
});
