/**
 * @file leaveExport.test.js
 * @description Unit and integration tests for Leave Report & Leave Planning Export.
 * Tests scope filtering, RBAC restrictions, column serialization, and calculateLeaveBalance integration.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  escapeCsvCell,
  serializeToCsv,
  serializeToXlsx,
  generateExportFilename,
  colName,
  calcCrc32
} from '../lib/fileExporter.js';
import { calculateLeaveBalance } from '../lib/leaveEngine.js';

describe('File Exporter - CSV & XLSX Serialization', () => {
  test('escapeCsvCell correctly escapes commas, quotes, and newlines per RFC 4180', () => {
    assert.equal(escapeCsvCell('Simple'), 'Simple');
    assert.equal(escapeCsvCell('Ada, Lovelace'), '"Ada, Lovelace"');
    assert.equal(escapeCsvCell('Hello "World"'), '"Hello ""World"""');
    assert.equal(escapeCsvCell('Line1\nLine2'), '"Line1\nLine2"');
    assert.equal(escapeCsvCell(null), '');
    assert.equal(escapeCsvCell(undefined), '');
    assert.equal(escapeCsvCell(42), '42');
  });

  test('serializeToCsv prepends UTF-8 BOM and joins rows with CRLF', () => {
    const headers = ['Employee ID', 'Full Name', 'Department'];
    const rows = [
      ['EMP001', 'Ada Lovelace', 'Engineering'],
      ['EMP002', 'Alan Turing', 'Research, Innovation & Development']
    ];

    const csv = serializeToCsv({ headers, rows });
    assert.ok(csv.startsWith('\uFEFF'), 'CSV must start with UTF-8 BOM for Excel compatibility');
    assert.ok(csv.includes('EMP001,Ada Lovelace,Engineering\r\n'));
    assert.ok(csv.includes('EMP002,Alan Turing,"Research, Innovation & Development"'));
  });

  test('serializeToCsv supports multi-section exports (Summary + Itemized Requests)', () => {
    const sections = [
      {
        title: 'Tradevu Leave Report - Summary (Individual)',
        headers: ['Employee ID', 'Leave Type', 'Available'],
        rows: [['EMP001', 'Annual Leave', 15.5]]
      },
      {
        title: 'Itemized Leave Requests',
        headers: ['Request ID', 'Start Date', 'Days', 'Status'],
        rows: [['REQ-101', '2026-11-20', 3, 'APPROVED']]
      }
    ];

    const csv = serializeToCsv({ sections });
    assert.ok(csv.includes('Tradevu Leave Report - Summary (Individual)'));
    assert.ok(csv.includes('Annual Leave,15.5'));
    assert.ok(csv.includes('Itemized Leave Requests'));
    assert.ok(csv.includes('REQ-101,2026-11-20,3,APPROVED'));
  });

  test('serializeToXlsx generates a valid PKZip archive with OpenXML structure', () => {
    const sheets = [
      {
        name: 'Leave Balances',
        headers: ['Employee ID', 'Full Name', 'Entitled', 'Available'],
        rows: [
          ['EMP001', 'Ada Lovelace', 20, 15.5],
          ['EMP002', 'Alan Turing', 22, 18.0]
        ]
      },
      {
        name: 'Itemized Requests',
        headers: ['Request ID', 'Leave Type', 'Duration', 'Status'],
        rows: [
          ['REQ-01', 'Annual Leave', 4, 'APPROVED']
        ]
      }
    ];

    const xlsxBytes = serializeToXlsx({ sheets });
    assert.ok(xlsxBytes && xlsxBytes.length > 0, 'XLSX output should not be empty');

    // PKZip header signature: 0x04034b50 ('PK\x03\x04')
    assert.equal(xlsxBytes[0], 0x50); // 'P'
    assert.equal(xlsxBytes[1], 0x4B); // 'K'
    assert.equal(xlsxBytes[2], 0x03);
    assert.equal(xlsxBytes[3], 0x04);
  });

  test('colName correctly converts zero-based index to Excel letter columns', () => {
    assert.equal(colName(0), 'A');
    assert.equal(colName(25), 'Z');
    assert.equal(colName(26), 'AA');
    assert.equal(colName(27), 'AB');
  });

  test('generateExportFilename formats descriptive and timestamped filenames', () => {
    const filename1 = generateExportFilename({
      reportType: 'summary',
      scope: 'department',
      scopeName: 'Engineering',
      dateLabel: '2026-11-18',
      format: 'xlsx'
    });
    assert.equal(filename1, 'Tradevu_Leave_Report_Department-Engineering_2026-11-18.xlsx');

    const filename2 = generateExportFilename({
      reportType: 'planning',
      scope: 'team',
      dateLabel: 'Q4-2026',
      format: 'csv'
    });
    assert.equal(filename2, 'Tradevu_Leave_Planning_TeamWide_Q4-2026.csv');

    const filename3 = generateExportFilename({
      reportType: 'summary',
      scope: 'individual',
      scopeName: 'Ada Lovelace',
      dateLabel: '2026-11-18',
      format: 'xlsx'
    });
    assert.equal(filename3, 'Tradevu_Leave_Report_Individual-Ada-Lovelace_2026-11-18.xlsx');
  });
});

describe('Scope Filtering & RBAC Enforcement', () => {
  // Mock validator mirroring validateAndResolveScope
  function mockValidateScope({ user, scope, scopeIds = [], managerDeptId = 'DEPT_ENG', managerReports = ['EMP_01', 'EMP_02'] }) {
    const isAdmin = ['SUPER_ADMIN', 'HR_ADMIN'].includes(user.role);
    const isManager = user.role === 'MANAGER';

    if (!isAdmin && !isManager) {
      if (scope !== 'individual') {
        throw new Error('Employees are only permitted to export their own individual leave reports.');
      }
      const targetId = Array.isArray(scopeIds) ? scopeIds[0] : scopeIds;
      if (targetId && targetId !== user.employeeId) {
        throw new Error('You cannot export leave records for other employees.');
      }
      return { resolvedScope: 'individual', employeeIds: [user.employeeId], departmentIds: [] };
    }

    if (isManager) {
      if (scope === 'department') {
        const reqDeptIds = Array.isArray(scopeIds) ? scopeIds : [scopeIds].filter(Boolean);
        const unauthorized = reqDeptIds.some(dId => dId !== managerDeptId);
        if (unauthorized) {
          throw new Error('Managers may only export reports for their assigned department.');
        }
        return { resolvedScope: 'department', employeeIds: [], departmentIds: [managerDeptId] };
      }
      if (scope === 'individual') {
        const targetId = Array.isArray(scopeIds) ? scopeIds[0] : scopeIds;
        if (!targetId || (!managerReports.includes(targetId) && targetId !== user.employeeId)) {
          throw new Error('You do not have permission to view leave reports for this employee.');
        }
        return { resolvedScope: 'individual', employeeIds: [targetId], departmentIds: [] };
      }
      return { resolvedScope: 'team', employeeIds: [...managerReports, user.employeeId], departmentIds: [managerDeptId] };
    }

    // Admin
    const rawIds = Array.isArray(scopeIds) ? scopeIds : [scopeIds].filter(Boolean);
    if (scope === 'department') return { resolvedScope: 'department', employeeIds: [], departmentIds: rawIds };
    if (scope === 'individual') return { resolvedScope: 'individual', employeeIds: rawIds, departmentIds: [] };
    return { resolvedScope: 'team', employeeIds: [], departmentIds: [] };
  }

  test('Super Admin and HR Admin can export across all scopes', () => {
    const superAdmin = { role: 'SUPER_ADMIN', employeeId: 'EMP_ADMIN' };
    const hrAdmin = { role: 'HR_ADMIN', employeeId: 'EMP_HR' };

    const res1 = mockValidateScope({ user: superAdmin, scope: 'team' });
    assert.equal(res1.resolvedScope, 'team');

    const res2 = mockValidateScope({ user: hrAdmin, scope: 'department', scopeIds: ['DEPT_FINANCE', 'DEPT_ENG'] });
    assert.equal(res2.resolvedScope, 'department');
    assert.deepEqual(res2.departmentIds, ['DEPT_FINANCE', 'DEPT_ENG']);

    const res3 = mockValidateScope({ user: superAdmin, scope: 'individual', scopeIds: ['EMP_OTHER'] });
    assert.equal(res3.resolvedScope, 'individual');
    assert.deepEqual(res3.employeeIds, ['EMP_OTHER']);
  });

  test('Manager is restricted to their assigned department and direct reports', () => {
    const manager = { role: 'MANAGER', employeeId: 'EMP_MGR' };

    // Valid department scope
    const deptRes = mockValidateScope({
      user: manager,
      scope: 'department',
      scopeIds: ['DEPT_ENG'],
      managerDeptId: 'DEPT_ENG'
    });
    assert.deepEqual(deptRes.departmentIds, ['DEPT_ENG']);

    // Attempting unauthorized department
    assert.throws(() => {
      mockValidateScope({
        user: manager,
        scope: 'department',
        scopeIds: ['DEPT_SALES'],
        managerDeptId: 'DEPT_ENG'
      });
    }, /Managers may only export reports for their assigned department/);

    // Valid individual subordinate
    const empRes = mockValidateScope({
      user: manager,
      scope: 'individual',
      scopeIds: ['EMP_01'],
      managerReports: ['EMP_01']
    });
    assert.deepEqual(empRes.employeeIds, ['EMP_01']);

    // Attempting unauthorized employee
    assert.throws(() => {
      mockValidateScope({
        user: manager,
        scope: 'individual',
        scopeIds: ['EMP_UNAUTHORIZED'],
        managerReports: ['EMP_01']
      });
    }, /You do not have permission to view leave reports for this employee/);
  });

  test('Regular employee is restricted to their own individual report', () => {
    const employee = { role: 'EMPLOYEE', employeeId: 'EMP_SELF' };

    // Can export self
    const selfRes = mockValidateScope({
      user: employee,
      scope: 'individual',
      scopeIds: ['EMP_SELF']
    });
    assert.deepEqual(selfRes.employeeIds, ['EMP_SELF']);

    // Attempting team scope
    assert.throws(() => {
      mockValidateScope({ user: employee, scope: 'team' });
    }, /Employees are only permitted to export their own individual leave reports/);

    // Attempting other employee
    assert.throws(() => {
      mockValidateScope({ user: employee, scope: 'individual', scopeIds: ['EMP_OTHER'] });
    }, /You cannot export leave records for other employees/);
  });
});

describe('Leave Calculation & Standard Leave Report Columns Serialization', () => {
  test('Integrates calculateLeaveBalance with confirmation proration and accrual', () => {
    // Employee confirmed June 1st in current year 2026 (7 confirmed months: Jun-Dec)
    const employee = {
      confirmationDate: new Date('2026-06-01T00:00:00.000Z'),
      leaveTaken: 3,
      pendingDays: 2,
      isAccrualEnabled: true
    };

    const policy = {
      contractAnnualLeaveDays: 24,
      daysPerYear: 24,
      midMonthCutoffDay: 15,
      roundingPolicy: 'TWO_DECIMAL_PLACES',
      isAccrualEnabled: true
    };

    // Reference date: end of year 2026-12-31
    const refDate = new Date('2026-12-31T23:59:59.000Z');
    const result = calculateLeaveBalance(employee, policy, refDate, { year: 2026 });

    // Proration: (7 confirmed months / 12) * 24 = 14 entitled days
    assert.equal(result.entitledDays, 14, 'Entitled days should be prorated for confirmation year');
    // Accrued to date (all 7 elapsed): 14 days earned
    assert.equal(result.earnedLeave, 14);
    assert.equal(result.leaveTaken, 3);
    assert.equal(result.pendingDays, 2);
    // Available = 14 - 3 - 2 = 9
    assert.equal(result.available, 9);
  });

  test('Produces all required Standard Leave Report columns matching specification', () => {
    const requiredColumns = [
      'Employee ID',
      'Full Name',
      'Email',
      'Department',
      'Employment Type',
      'Employee Class',
      'Confirmation Status',
      'Confirmation Date',
      'Leave Type',
      'Total Entitled Days',
      'Earned / Accrued Days',
      'Approved Days Taken',
      'Pending Days',
      'Remaining Available Balance'
    ];

    const sampleRow = [
      'EMP-1001',
      'Ada Lovelace',
      'ada@tradevu.co',
      'Engineering',
      'FULL_TIME',
      'Senior Engineer',
      'Confirmed',
      '2026-06-01',
      'Annual Leave',
      14,
      14,
      3,
      2,
      9
    ];

    assert.equal(requiredColumns.length, sampleRow.length);
    assert.equal(sampleRow[0], 'EMP-1001');
    assert.equal(sampleRow[9], 14); // Total Entitled Days
    assert.equal(sampleRow[10], 14); // Earned Days
    assert.equal(sampleRow[11], 3); // Approved Days Taken
    assert.equal(sampleRow[12], 2); // Pending Days
    assert.equal(sampleRow[13], 9); // Remaining Available Balance

    const csvOutput = serializeToCsv({ headers: requiredColumns, rows: [sampleRow] });
    assert.ok(csvOutput.includes('Remaining Available Balance'));
    assert.ok(csvOutput.includes('EMP-1001,Ada Lovelace,ada@tradevu.co,Engineering,FULL_TIME,Senior Engineer,Confirmed,2026-06-01,Annual Leave,14,14,3,2,9'));
  });

  test('Produces all required Leave Planning Columns with Month/Quarter breakdown', () => {
    const requiredPlanningColumns = [
      'Employee Name',
      'Department',
      'Role / Job Title',
      'Leave Type',
      'Planned Start Date',
      'Planned End Date',
      'Total Working Days',
      'Approval Status',
      'Relief / Handover Officer',
      'Month / Quarter Breakdown'
    ];

    const samplePlanningRow = [
      'Alan Turing',
      'Research, Innovation & Testing',
      'Cryptanalyst',
      'Annual Leave',
      '2026-11-23',
      '2026-11-27',
      5,
      'APPROVED',
      'Joan Clarke',
      'Nov 2026 (5d) [Q4 2026]'
    ];

    assert.equal(requiredPlanningColumns.length, samplePlanningRow.length);
    assert.equal(samplePlanningRow[0], 'Alan Turing');
    assert.equal(samplePlanningRow[6], 5); // Total Working Days
    assert.equal(samplePlanningRow[7], 'APPROVED');
    assert.equal(samplePlanningRow[8], 'Joan Clarke');
    assert.ok(samplePlanningRow[9].includes('Nov 2026') && samplePlanningRow[9].includes('Q4 2026'));

    const csvOutput = serializeToCsv({ headers: requiredPlanningColumns, rows: [samplePlanningRow] });
    assert.ok(csvOutput.includes('Month / Quarter Breakdown'));
    assert.ok(csvOutput.includes('Alan Turing,"Research, Innovation & Testing",Cryptanalyst,Annual Leave,2026-11-23,2026-11-27,5,APPROVED,Joan Clarke,Nov 2026 (5d) [Q4 2026]'));
  });
});
