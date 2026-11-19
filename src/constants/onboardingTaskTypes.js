export const TASK_INPUT_TYPES = {
  CHECKBOX: 'checkbox',
  INPUT: 'input',
  MULTI_SELECT: 'multi_select',
  FILE_UPLOAD: 'file_upload',
  DOCUMENT_SIGNING: 'document_signing',
};

export const TASK_INPUT_TYPE_LABELS = {
  [TASK_INPUT_TYPES.CHECKBOX]: 'Checkbox / Acknowledgment',
  [TASK_INPUT_TYPES.INPUT]: 'Single Input Response',
  [TASK_INPUT_TYPES.MULTI_SELECT]: 'Choice / Multi-Select',
  [TASK_INPUT_TYPES.FILE_UPLOAD]: 'File Upload / Evidence',
  [TASK_INPUT_TYPES.DOCUMENT_SIGNING]: 'Template Download & Re-upload',
};

export const SINGLE_INPUT_SUBTYPES = {
  TEXT: 'text',
  NUMBER: 'number',
  DATE: 'date',
  SHORT_ANSWER: 'short_answer',
};

export const SINGLE_INPUT_SUBTYPE_LABELS = {
  [SINGLE_INPUT_SUBTYPES.TEXT]: 'Text (e.g. Emergency Contact Name)',
  [SINGLE_INPUT_SUBTYPES.NUMBER]: 'Number (e.g. Laptop Serial No / Phone)',
  [SINGLE_INPUT_SUBTYPES.DATE]: 'Date (e.g. Completion Date)',
  [SINGLE_INPUT_SUBTYPES.SHORT_ANSWER]: 'Short Answer / Paragraph',
};

export const TASK_OWNER_ROLES = {
  EMPLOYEE: 'EMPLOYEE',
  MANAGER: 'MANAGER',
  HR_ADMIN: 'HR_ADMIN',
};

export const TASK_OWNER_ROLE_LABELS = {
  [TASK_OWNER_ROLES.EMPLOYEE]: 'Employee (New Hire)',
  [TASK_OWNER_ROLES.MANAGER]: 'Manager / Team Lead',
  [TASK_OWNER_ROLES.HR_ADMIN]: 'HR Administrator',
};

export const COMPLETION_RULES = {
  AUTO_ON_SUBMIT: 'auto_on_submit',
  REQUIRES_HR_REVIEW: 'requires_hr_review',
  MANUAL_CHECK: 'manual_check',
};

export const COMPLETION_RULE_LABELS = {
  [COMPLETION_RULES.AUTO_ON_SUBMIT]: 'Auto-complete upon response/upload',
  [COMPLETION_RULES.REQUIRES_HR_REVIEW]: 'Requires HR review after submission',
  [COMPLETION_RULES.MANUAL_CHECK]: 'Manual checkbox confirmation',
};

