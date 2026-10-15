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
  { name: 'INTERN', canManage: false, canApproveLeave: false },
  { name: 'TEAM MEMBER', canManage: false, canApproveLeave: false },
  { name: 'MID LEVEL TEAM MEMBER', canManage: false, canApproveLeave: false },
  { name: 'MID LEVEL MANAGER', canManage: true, canApproveLeave: true },
  { name: 'MANAGER', canManage: true, canApproveLeave: true },
  { name: 'SENIOR MANAGER', canManage: true, canApproveLeave: true },
  { name: 'EXECUTIVE MANAGER', canManage: true, canApproveLeave: true },
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
  if (typeof employeeClass === 'object' && employeeClass !== null) {
    const value = String(employeeClass.value || employeeClass.name || '').toUpperCase();
    const isMgr = /MANAGER/i.test(value);
    return {
      value,
      name: value,
      label: employeeClass.label || toTitleCase(value),
      canManage: typeof employeeClass.canManage === 'boolean' ? employeeClass.canManage : isMgr,
      canApproveLeave: typeof employeeClass.canApproveLeave === 'boolean' ? employeeClass.canApproveLeave : isMgr,
    };
  }
  const value = String(employeeClass || '').toUpperCase();
  const isMgr = /MANAGER/i.test(value);
  return {
    value,
    name: value,
    label: toTitleCase(value),
    canManage: isMgr,
    canApproveLeave: isMgr,
  };
};

export const normalizeEmployeeClasses = (classes, fallback = DEFAULT_EMPLOYEE_CLASSES) => {
  const source = Array.isArray(classes) && classes.length > 0 ? classes : fallback;
  return source.map(normalizeEmployeeClass).filter((option) => option.value);
};
