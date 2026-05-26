# PRD 02 — Employee Core Module

## Version History
| Version | Description | Date |
|---------|-------------|------|
| 1.0 | First version of PRD | 20 May 2026 |

## Overview
This module serves as the:
- central employee source of truth,
- organizational hierarchy engine,
- employment status controller,
- employee profile manager.

All other operational modules consume this module.

## Product Goals
- centralize employee data,
- support employee lifecycle tracking,
- reduce manual HR operations,
- establish organizational structure,
- support scalable future HR modules,
- maintain auditability and compliance.

## Module Scope

### Included In MVP
Employee records, Employment information, Department assignment, Reporting hierarchy, Employee statuses, Employment history, Promotion tracking, Probation tracking, Employee document references, Employee search/filtering, Employee profile permissions, Audit logging

### Excluded From This Module
Payroll processing, Leave management, Attendance tracking, Recruitment workflows, Performance reviews, Learning systems, Asset management, Expense management

## Employee Data Architecture

### Section A — Personal Information
Full Name, Preferred Name, Email Address, Phone Number, Date of Birth, Gender, Marital Status, Residential Address, Emergency Contact, Next of Kin, Guarantor Details, Employee Photo

### Section B — Employment Information
Employee ID, Hire Date, Employment Type, Job Title, Department, Reporting Manager, Grade Level, Compensation Level, Work Location, Employment Status, Probation Start Date, Probation End Date

### Section C — Payroll & Financial References (Sensitive)
Bank Name, Bank Account Number, Pension Information, Tax Identification Number, Compensation History Reference
**Managers should NOT access this section.**

### Section D — Documents
Employment Contract, Government ID, Certificates, Compliance Forms, Offer Letter, Promotion Letter, Exit Documents

## Employee ID Rules
Format: `EMP-000001`
- auto-generated, immutable, unique, searchable.
- Employee IDs should NEVER be recycled.

## Employee Types
Full-time, Contract, Intern, Consultant, Temporary Staff

## Department Architecture
Fields: Department Name, Department Code, Department Head, Active Status

## Organizational Hierarchy
- Each employee may have one direct reporting manager.
- Managers may have multiple direct reports.
- Employees cannot report to themselves.
- Circular reporting structures are invalid.

## Employee Status Architecture

| Status | Payroll Eligible | Leave Eligible | Attendance Eligible |
|--------|-----------------|----------------|-------------------|
| Draft | No | No | No |
| Pending Onboarding | No | No | No |
| Probation | Yes | Configurable | Yes |
| Active | Yes | Yes | Yes |
| Suspended | No | No | No |
| Resigned | Final payroll only | No | No |
| Terminated | No | No | No |
| Offboarded | No | No | No |
| Archived | No | No | No |

## Employee Lifecycle Workflows

### Workflow 1 — Employee Creation
1. HR Admin creates employee record
2. System generates Employee ID
3. Employee profile enters Draft state
4. Required fields completed
5. Documents uploaded
6. Reporting manager assigned
7. Employee moved to Pending Onboarding

### Workflow 2 — Employee Activation
1. Onboarding completed
2. Probation dates confirmed
3. HR Admin activates employee
4. Status becomes Probation OR Active

### Workflow 3 — Promotion Management
Update job title, compensation level, grade level. Upload promotion letter. Record effective date. Maintain history.

### Workflow 4 — Probation Confirmation
1. Probation reminder triggered
2. Manager review conducted
3. HR Admin confirms probation
4. Employee status updated to Active

### Workflow 5 — Employee Suspension
Mark Suspended, disable payroll/leave/attendance eligibility, generate audit log.

### Workflow 6 — Employee Exit
Exit Types: Resignation, Termination, Retirement, Contract Expiration
Flow: Exit initiated → Resigned/Terminated → Offboarding triggered → Final payroll → Offboarded → Archived

## Search & Filtering
Search: employee name, employee ID, email, department, job title.
Filters: Employment Status, Department, Employment Type, Grade Level, Manager, Hire Date.

## Permissions Matrix

### HR Admin
Can: create employees, edit records, manage statuses, upload documents, assign departments/managers, archive employees.

### Manager
Can: view direct-report profiles, view team org data, track probation progress.
Cannot: view payroll details, view tax information, edit employment records.

### Employee
Can: view own profile, request profile updates, upload permitted documents.
Cannot: directly edit official HR-controlled fields.

## Profile Update Requests
Employees can request updates for: address, phone number, emergency contacts, next of kin.
Approval Flow: Employee → HR Admin. Changes should NOT apply automatically.

## API Expectations
Create Employee, Update Employee, Get Employee, Search Employees, Update Employee Status, Assign Manager, Upload Employee Document, Get Employee History

## Backend Priority Order
**Phase 1:** Authentication, Roles & Permissions, Employee Database Schema, Employee CRUD APIs, Employee Status Engine
**Phase 2:** Reporting hierarchy, Search & filtering, Employee documents, Audit logging, Notifications
**Phase 3:** Promotion history, Probation workflows, Profile update approvals, Historical reporting
