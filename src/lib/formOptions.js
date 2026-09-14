import { toTitleCase } from './utils';

export const normalizeDepartment = (department) => ({
  ...department,
  id: department.id || department._id,
  label: department.name || department.title || 'Unnamed Department',
});

export const normalizeEmployeeClass = (employeeClass) => {
  const value = String(employeeClass?.value || employeeClass || '').toUpperCase();
  return {
    value,
    label: toTitleCase(value),
  };
};

export const normalizeEmployeeClasses = (classes, fallback = ['PERMANENT', 'PROBATIONARY', 'CONTRACT', 'CONSULTANT', 'INTERN', 'MANAGERIAL']) => {
  const source = Array.isArray(classes) && classes.length > 0 ? classes : fallback;
  return source.map(normalizeEmployeeClass).filter((option) => option.value);
};
