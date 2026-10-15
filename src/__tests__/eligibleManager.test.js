import { describe, it, expect } from 'vitest';
import { isEligibleManager, formatManagerOption } from '@/lib/roleUtils';

describe('isEligibleManager', () => {
  const baseActiveManager = {
    userActive: true,
    status: 'ACTIVE',
    role: 'MANAGER',
    employeeClass: 'MANAGER',
    jobTitle: 'General Manager',
  };

  it('allows active manager with managerial employee class', () => {
    expect(isEligibleManager(baseActiveManager)).toBe(true);
  });

  it('rejects active user with Manager in job title if role is EMPLOYEE and class is not manager', () => {
    expect(
      isEligibleManager({
        userActive: true,
        status: 'ACTIVE',
        role: 'EMPLOYEE',
        jobTitle: 'Engineering Manager',
      })
    ).toBe(false);
    expect(
      isEligibleManager({
        isUserActive: true,
        status: 'ACTIVE',
        role: 'EMPLOYEE',
        jobTitle: 'Product Manager',
      })
    ).toBe(false);
  });

  it('allows CEO via SUPER_ADMIN role (when not org owner) but rejects EMPLOYEE role with CEO title', () => {
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
    ).toBe(false);

    expect(
      isEligibleManager({
        userActive: true,
        status: 'ACTIVE',
        role: 'EMPLOYEE',
        jobTitle: 'Chief Executive Officer',
      })
    ).toBe(false);
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

  it('rejects employee with non-manager class even if job title has Manager, but allows SUPER_ADMIN (CEO)', () => {
    expect(
      isEligibleManager({
        userActive: true,
        status: 'ACTIVE',
        role: 'MANAGER',
        jobTitle: 'Engineering Manager',
        employeeClass: 'TEAM MEMBER',
      })
    ).toBe(false);

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

  it('allows employee with custom class if classConfigs specifies canManage: true', () => {
    const customClasses = [
      { name: 'TEAM LEAD', value: 'TEAM LEAD', canManage: true },
      { name: 'PRINCIPAL', value: 'PRINCIPAL', canManage: false },
    ];

    expect(
      isEligibleManager(
        {
          userActive: true,
          status: 'ACTIVE',
          role: 'EMPLOYEE',
          employeeClass: 'TEAM LEAD',
        },
        customClasses
      )
    ).toBe(true);

    expect(
      isEligibleManager(
        {
          userActive: true,
          status: 'ACTIVE',
          role: 'EMPLOYEE',
          employeeClass: 'PRINCIPAL',
        },
        customClasses
      )
    ).toBe(false);
  });

  it('strictly rejects user if they have no employeeClass assigned (even with MANAGER role)', () => {
    expect(
      isEligibleManager({
        userActive: true,
        status: 'ACTIVE',
        role: 'MANAGER',
        employeeClass: '',
        jobTitle: 'General Manager',
      })
    ).toBe(false);

    expect(
      isEligibleManager({
        userActive: true,
        status: 'ACTIVE',
        role: 'MANAGER',
        jobTitle: 'General Manager',
      })
    ).toBe(false);
  });

  describe('formatManagerOption', () => {
    const departments = [
      { id: 'dept-eng', name: 'Engineering', managerId: 'mgr-1' },
      { id: 'dept-sales', name: 'Sales', managerId: { id: 'mgr-2' } },
    ];

    it('formats label with full name, job title, and department', () => {
      const option = formatManagerOption(
        {
          id: 'mgr-3',
          fullName: 'Alice Smith',
          jobTitle: 'Engineering Manager',
          departmentId: 'dept-eng',
        },
        departments
      );

      expect(option).toEqual({
        value: 'mgr-3',
        label: 'Alice Smith — Engineering Manager • Engineering',
      });
    });

    it('appends (Head of Dept) when managerId matches department head', () => {
      const option = formatManagerOption(
        {
          id: 'mgr-1',
          fullName: 'Bob Johnson',
          jobTitle: 'VP of Engineering',
          departmentId: 'dept-eng',
        },
        departments
      );

      expect(option).toEqual({
        value: 'mgr-1',
        label: 'Bob Johnson — VP of Engineering • Engineering (Head of Dept)',
      });
    });

    it('handles missing job title and empty departments fallback', () => {
      const option = formatManagerOption({
        _id: 'emp-99',
        fullName: 'Charlie Brown',
      });

      expect(option).toEqual({
        value: 'emp-99',
        label: 'Charlie Brown • General',
      });
    });
  });
});
