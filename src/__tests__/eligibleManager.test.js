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

  it('allows CEO via SUPER_ADMIN role (when not org owner) or CEO title', () => {
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

  it('strictly excludes organisation owner from manager eligibility', () => {
    expect(
      isEligibleManager({
        ...baseActiveManager,
        isOrgOwner: true,
      })
    ).toBe(false);

    expect(
      isEligibleManager({
        ...baseActiveManager,
        is_organization_owner: true,
      })
    ).toBe(false);

    expect(
      isEligibleManager({
        userActive: true,
        status: 'ACTIVE',
        role: 'SUPER_ADMIN',
        jobTitle: 'Chief Executive Officer',
        isOrgOwner: true,
      })
    ).toBe(false);
  });

  it('allows managers in PENDING_ONBOARDING status even if user account is not yet active', () => {
    expect(
      isEligibleManager({
        ...baseActiveManager,
        status: 'PENDING_ONBOARDING',
        userActive: false,
      })
    ).toBe(true);

    expect(
      isEligibleManager({
        ...baseActiveManager,
        employmentStatus: 'pending_onboarding',
        userActive: false,
      })
    ).toBe(true);
  });

  it('rejects users without active user account (when not in PENDING_ONBOARDING)', () => {
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
    'ONGOING_ONBOARDING',
    'SUSPENDED',
    'TERMINATED',
    'RESIGNED',
    'OFFBOARDED',
    'ARCHIVED',
    'draft',
    'ongoing_onboarding',
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

  it('rejects employee with non-manager class (e.g. TEAM MEMBER) and non-manager title even if role is MANAGER', () => {
    expect(
      isEligibleManager({
        userActive: true,
        status: 'ACTIVE',
        role: 'MANAGER',
        jobTitle: 'Developer',
        employeeClass: 'TEAM MEMBER',
      })
    ).toBe(false);

    expect(
      isEligibleManager({
        userActive: true,
        status: 'ACTIVE',
        role: 'MANAGER',
        jobTitle: 'Senior Software Engineer',
        employeeClass: 'TEAM MEMBER',
      })
    ).toBe(false);
  });

  it('allows employee with non-manager class if their job title explicitly has Manager or they are CEO', () => {
    expect(
      isEligibleManager({
        userActive: true,
        status: 'ACTIVE',
        role: 'MANAGER',
        jobTitle: 'Engineering Manager',
        employeeClass: 'TEAM MEMBER',
      })
    ).toBe(true);

    expect(
      isEligibleManager({
        userActive: true,
        status: 'ACTIVE',
        role: 'SUPER_ADMIN',
        jobTitle: 'Founder',
        employeeClass: 'TEAM MEMBER',
      })
    ).toBe(true);
  });
});
