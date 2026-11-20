import { describe, it, expect } from 'vitest';
import { checkEmployeeFolderAccess } from '../lib/companyLibraryUtils.js';
import {
  formatBytes,
  getFileExtension,
  getFileTypeBadge,
  validateAssetFile,
  ALLOWED_COMPANY_ASSET_EXTENSIONS,
  MAX_ASSET_SIZE_BYTES,
} from '../lib/fileFormatUtils.js';

describe('Company Library Permission Resolver (checkEmployeeFolderAccess)', () => {
  it('allows access to public folders for any employee or unassigned user', () => {
    const publicFolder = {
      id: 'f1',
      name: 'Public Handbook',
      isPublic: true,
      allowedClasses: [],
      allowedEmploymentTypes: [],
      allowedDepartmentIds: [],
    };

    expect(checkEmployeeFolderAccess(publicFolder, null)).toBe(true);
    expect(checkEmployeeFolderAccess(publicFolder, { employeeClass: 'INTERN' })).toBe(true);
    expect(checkEmployeeFolderAccess(publicFolder, { employeeClass: 'EXECUTIVE MANAGER' })).toBe(true);
  });

  it('allows access when non-public folder has no specific criteria configured', () => {
    const unconstrainedFolder = {
      id: 'f2',
      name: 'General Resources',
      isPublic: false,
      allowedClasses: [],
      allowedEmploymentTypes: [],
      allowedDepartmentIds: [],
    };

    expect(checkEmployeeFolderAccess(unconstrainedFolder, { employeeClass: 'TEAM MEMBER' })).toBe(true);
  });

  it('rejects unauthenticated or missing employee records on restricted folders', () => {
    const restrictedFolder = {
      id: 'f3',
      name: 'Management Documents',
      isPublic: false,
      allowedClasses: ['MANAGER', 'EXECUTIVE MANAGER'],
      allowedEmploymentTypes: [],
      allowedDepartmentIds: [],
    };

    expect(checkEmployeeFolderAccess(restrictedFolder, null)).toBe(false);
    expect(checkEmployeeFolderAccess(restrictedFolder, undefined)).toBe(false);
  });

  it('correctly filters by employeeClass with case-insensitivity', () => {
    const managerFolder = {
      id: 'f4',
      name: 'Management Playbook',
      isPublic: false,
      allowedClasses: ['MANAGER', 'SENIOR MANAGER'],
      allowedEmploymentTypes: [],
      allowedDepartmentIds: [],
    };

    expect(checkEmployeeFolderAccess(managerFolder, { employeeClass: 'Manager' })).toBe(true);
    expect(checkEmployeeFolderAccess(managerFolder, { employeeClass: 'SENIOR MANAGER' })).toBe(true);
    expect(checkEmployeeFolderAccess(managerFolder, { employeeClass: 'INTERN' })).toBe(false);
    expect(checkEmployeeFolderAccess(managerFolder, { employeeClass: 'TEAM MEMBER' })).toBe(false);
  });

  it('correctly filters by employmentType with case-insensitivity', () => {
    const permanentOnlyFolder = {
      id: 'f5',
      name: 'Permanent Staff Benefits',
      isPublic: false,
      allowedClasses: [],
      allowedEmploymentTypes: ['FULL_TIME', 'PERMANENT'],
      allowedDepartmentIds: [],
    };

    expect(checkEmployeeFolderAccess(permanentOnlyFolder, { employmentType: 'FULL_TIME' })).toBe(true);
    expect(checkEmployeeFolderAccess(permanentOnlyFolder, { employmentType: 'permanent' })).toBe(true);
    expect(checkEmployeeFolderAccess(permanentOnlyFolder, { employmentType: 'CONTRACT' })).toBe(false);
    expect(checkEmployeeFolderAccess(permanentOnlyFolder, { employmentType: 'INTERN' })).toBe(false);
  });

  it('correctly filters by departmentId', () => {
    const engineeringFolder = {
      id: 'f6',
      name: 'Engineering Onboarding',
      isPublic: false,
      allowedClasses: [],
      allowedEmploymentTypes: [],
      allowedDepartmentIds: ['dept-eng-101'],
    };

    expect(checkEmployeeFolderAccess(engineeringFolder, { departmentId: 'dept-eng-101' })).toBe(true);
    expect(checkEmployeeFolderAccess(engineeringFolder, { departmentId: 'dept-sales-202' })).toBe(false);
    expect(checkEmployeeFolderAccess(engineeringFolder, { departmentId: null })).toBe(false);
  });

  it('enforces compound multi-attribute rules (Class AND Type AND Department)', () => {
    const strictFolder = {
      id: 'f7',
      name: 'Senior Full-Time Engineering Guidelines',
      isPublic: false,
      allowedClasses: ['SENIOR MANAGER', 'EXECUTIVE MANAGER'],
      allowedEmploymentTypes: ['FULL_TIME'],
      allowedDepartmentIds: ['dept-eng-101'],
    };

    // Satisfies all dimensions
    expect(
      checkEmployeeFolderAccess(strictFolder, {
        employeeClass: 'SENIOR MANAGER',
        employmentType: 'FULL_TIME',
        departmentId: 'dept-eng-101',
      })
    ).toBe(true);

    // Mismatched class
    expect(
      checkEmployeeFolderAccess(strictFolder, {
        employeeClass: 'INTERN',
        employmentType: 'FULL_TIME',
        departmentId: 'dept-eng-101',
      })
    ).toBe(false);

    // Mismatched employment type
    expect(
      checkEmployeeFolderAccess(strictFolder, {
        employeeClass: 'SENIOR MANAGER',
        employmentType: 'CONTRACT',
        departmentId: 'dept-eng-101',
      })
    ).toBe(false);

    // Mismatched department
    expect(
      checkEmployeeFolderAccess(strictFolder, {
        employeeClass: 'SENIOR MANAGER',
        employmentType: 'FULL_TIME',
        departmentId: 'dept-marketing',
      })
    ).toBe(false);
  });

  it('allows access to specific individual users in allowedUserIds even when attribute rules do not match', () => {
    const executiveOnlyFolder = {
      id: 'f8',
      name: 'Board Strategy',
      isPublic: false,
      allowedClasses: ['EXECUTIVE MANAGER'],
      allowedEmploymentTypes: ['FULL_TIME'],
      allowedDepartmentIds: [],
      allowedUserIds: ['user-special-777'],
    };

    // Employee is an intern and contract, but has allowed userId
    expect(
      checkEmployeeFolderAccess(
        executiveOnlyFolder,
        { userId: 'user-special-777', employeeClass: 'INTERN', employmentType: 'CONTRACT' },
        { _id: 'user-special-777' }
      )
    ).toBe(true);

    // Another employee not in allowedUserIds and failing attribute check
    expect(
      checkEmployeeFolderAccess(
        executiveOnlyFolder,
        { userId: 'user-other-999', employeeClass: 'INTERN', employmentType: 'CONTRACT' },
        { _id: 'user-other-999' }
      )
    ).toBe(false);
  });

  it('allows access when folder only targets specific users with no attribute rules', () => {
    const userTargetedFolder = {
      id: 'f9',
      name: 'Confidential Audit',
      isPublic: false,
      allowedClasses: [],
      allowedEmploymentTypes: [],
      allowedDepartmentIds: [],
      allowedUserIds: ['user-auditor-101'],
    };

    expect(
      checkEmployeeFolderAccess(
        userTargetedFolder,
        { userId: 'user-auditor-101' },
        { _id: 'user-auditor-101' }
      )
    ).toBe(true);

    expect(
      checkEmployeeFolderAccess(
        userTargetedFolder,
        { userId: 'user-regular-202' },
        { _id: 'user-regular-202' }
      )
    ).toBe(false);
  });
});

describe('File Formatting & Validation Utilities', () => {
  it('formats bytes into clean human-readable units', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(2.5 * 1024 * 1024)).toBe('2.5 MB');
    expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
  });

  it('extracts file extensions accurately', () => {
    expect(getFileExtension('Offer_Letter.pdf')).toBe('pdf');
    expect(getFileExtension('Annual_Report.2026.final.docx')).toBe('docx');
    expect(getFileExtension('spreadsheet.XLSX')).toBe('xlsx');
    expect(getFileExtension('noextension')).toBe('');
  });

  it('returns appropriate color/badges for document types', () => {
    expect(getFileTypeBadge('pdf').label).toBe('PDF');
    expect(getFileTypeBadge('docx').label).toBe('Word');
    expect(getFileTypeBadge('xlsx').label).toBe('Excel / CSV');
    expect(getFileTypeBadge('png').label).toBe('Image');
  });

  it('validates file sizes and extensions', () => {
    const validFile = { name: 'Handbook.pdf', size: 2 * 1024 * 1024 };
    expect(validateAssetFile(validFile).valid).toBe(true);

    const oversizedFile = { name: 'HugeArchive.zip', size: 30 * 1024 * 1024 };
    expect(validateAssetFile(oversizedFile).valid).toBe(false);
    expect(validateAssetFile(oversizedFile).error).toContain('too large');

    const unsupportedFile = { name: 'script.exe', size: 500 };
    expect(validateAssetFile(unsupportedFile).valid).toBe(false);
    expect(validateAssetFile(unsupportedFile).error).toContain('Unsupported file format');
  });
});
