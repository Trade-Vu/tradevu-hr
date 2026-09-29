import { toTitleCase } from './utils';

export const normalizeDepartment = (department) => ({
  ...department,
  id: department.id || department._id,
  label: department.name || department.title || 'Unnamed Department',
});

export const DEFAULT_EMPLOYMENT_TYPES = [
  'PERMANENT',
  'PROBATIONARY',
  'CONTRACT',
  'CONSULTANT',
];

export const DEFAULT_EMPLOYEE_CLASSES = [
  'INTERN',
  'TEAM MEMBER',
  'MID LEVEL TEAM MEMBER',
  'MID LEVEL MANAGER',
  'MANAGER',
  'SENIOR MANAGER',
  'EXECUTIVE MANAGER',
];

export const normalizeEmploymentType = (employmentType) => {
  const value = String(employmentType?.value || employmentType || '').toUpperCase();
  return {
    value,
    label: toTitleCase(value),
  };
};

export const normalizeEmploymentTypes = (types, fallback = DEFAULT_EMPLOYMENT_TYPES) => {
  const source = Array.isArray(types) && types.length > 0 ? types : fallback;
  return source.map(normalizeEmploymentType).filter((option) => option.value);
};

export const normalizeEmployeeClass = (employeeClass) => {
  const value = String(employeeClass?.value || employeeClass || '').toUpperCase();
  return {
    value,
    label: toTitleCase(value),
  };
};

export const normalizeEmployeeClasses = (classes, fallback = DEFAULT_EMPLOYEE_CLASSES) => {
  const source = Array.isArray(classes) && classes.length > 0 ? classes : fallback;
  return source.map(normalizeEmployeeClass).filter((option) => option.value);
};
