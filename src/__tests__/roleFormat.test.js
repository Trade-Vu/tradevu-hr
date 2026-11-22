import { describe, it, expect } from 'vitest';
import { formatRole } from '@/lib/roleUtils';

describe('formatRole', () => {
  it('formats known system and approval roles into Title Case display strings', () => {
    expect(formatRole('LINE_MANAGER')).toBe('Line Manager');
    expect(formatRole('HEAD_OF_DEPARTMENT')).toBe('Head Of Department');
    expect(formatRole('HR_ADMIN')).toBe('HR Admin');
    expect(formatRole('SUPER_ADMIN')).toBe('Super Admin');
    expect(formatRole('FINANCE_ADMIN')).toBe('Finance Admin');
    expect(formatRole('MANAGER')).toBe('Manager');
    expect(formatRole('EMPLOYEE')).toBe('Employee');
  });

  it('handles lowercase, mixed-case, and padded inputs', () => {
    expect(formatRole('line_manager')).toBe('Line Manager');
    expect(formatRole('head_of_department ')).toBe('Head Of Department');
    expect(formatRole('hr_admin')).toBe('HR Admin');
  });

  it('formats custom or arbitrary snake_case roles gracefully', () => {
    expect(formatRole('PROJECT_LEAD')).toBe('Project Lead');
    expect(formatRole('operations_lead')).toBe('Operations Lead');
  });

  it('handles empty, null, or undefined values safely', () => {
    expect(formatRole('')).toBe('');
    expect(formatRole(null)).toBe('');
    expect(formatRole(undefined)).toBe('');
  });
});
