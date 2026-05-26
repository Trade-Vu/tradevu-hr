# PRD 01 — Platform Governance & Shared Infrastructure

## Version History
| Version | Description | Date |
|---------|-------------|------|
| 1.0 | First version of PRD | 20 May 2026 |

## Purpose
This document defines the shared operational standards, platform-wide infrastructure rules, and governance architecture for the HRIS platform.

This document exists to:
- stabilize implementation standards,
- prevent module fragmentation,
- support rapid future module expansion,
- improve AI-assisted implementation quality,
- establish reusable cross-platform infrastructure.

## Why This Document Exists
The HRIS platform is expected to continuously expand as additional HR operational briefs are introduced.

Without centralized governance:
- permissions become inconsistent,
- approvals become duplicated,
- audit trails become unreliable,
- notifications become fragmented,
- documents become unmanaged,
- module integration becomes difficult.

This document ensures all future modules inherit standardized infrastructure.

## Shared Infrastructure Components

| Shared Component | Responsibility |
|-----------------|----------------|
| Authentication & Identity | User authentication and access ownership |
| Permissions Engine | Role-based authorization |
| Employee Service | Central employee identity management |
| Approval Engine | Shared approval workflows |
| Notification Service | System notifications |
| Audit Logging | Operational traceability |
| File & Document Storage | Secure file handling |
| Search Infrastructure | Cross-platform search |
| Reporting Layer | Shared reporting/export systems |
| Activity Feed Infrastructure | Future engagement/event feeds |

## Section 1 — Permissions Governance

### Permissions Philosophy
The platform should use:
- role-based permissions,
- deny-by-default access,
- module-scoped authorization,
- explicit visibility rules.

Avoid:
- overly dynamic permission builders,
- unrestricted field-level customization,
- complex enterprise permission trees in MVP.

### Core Roles

| Role | Purpose |
|------|---------|
| Super Admin | Full system control |
| HR Admin | HR operations management |
| Finance Admin | Payroll oversight |
| Manager | Team oversight |
| Employee | Self-service access |

### Global Permission Rules

| Rule |
|------|
| Employees can only access their own personal data |
| Managers can only access direct-report team data |
| Managers cannot view salary/bank/tax information |
| HR Admins can access HR operational records |
| Finance Admins can access payroll-related records |
| Sensitive operations require audit logging |
| All permissions should be API-enforced, not frontend-only |

### Sensitive Data Categories

| Sensitive Data |
|---------------|
| Salary |
| Bank details |
| Tax identifiers |
| Pension information |
| Government IDs |
| Payroll records |
| Exit interview notes |

### Recommended Permission Architecture
Use: **RBAC (Role-Based Access Control)**

Avoid initially: ABAC, highly dynamic policy engines, custom permission builders.

## Section 2 — Employee State Architecture

### Employee States

| State | Description |
|-------|-------------|
| Draft | Employee profile created but incomplete |
| Pending Onboarding | Awaiting onboarding completion |
| Active | Fully active employee |
| Probation | Active but under probation |
| Suspended | Temporarily inactive |
| Resigned | Resignation submitted |
| Terminated | Employment ended involuntarily |
| Offboarded | Exit process completed |
| Archived | Historical inactive record |

### State Ownership
Only HR Admins and Super Admins should:
- modify employee status,
- confirm probation,
- archive employees,
- finalize offboarding.

Managers should NOT directly modify employment states.

### State Transition Governance
All transitions should:
- be timestamped,
- be audit logged,
- record actor,
- maintain historical traceability.

### Recommended State Flow
Draft → Pending Onboarding → Probation → Active → Resigned / Terminated → Offboarded → Archived

## Section 3 — Approval Engine Specification

### MVP Approval States

| State |
|-------|
| Draft |
| Pending Approval |
| Approved |
| Rejected |
| Cancelled |

### MVP Approval Chains

| Workflow | Approval Path |
|----------|--------------|
| Leave Requests | Employee → Manager → HR Admin |
| Payroll | HR Admin → Finance Admin |
| Policy Publishing | HR Admin → Super Admin |

### Approval Audit Requirements
Each approval event should store:
- actor, action, timestamp, comments, previous status, new status.

## Section 4 — Notification Framework

### MVP Notification Channels
- In-app
- Email

### Notification Categories
Approvals, Reminders, Payroll, Leave, Onboarding, Offboarding, Announcements, Celebrations, Policy Acknowledgments

### MVP Notification Events
- Leave submitted/approved/rejected
- Payroll approved
- Payslip released
- Employee onboarded
- Probation review due
- Policy acknowledgment required

## Section 5 — Audit Logging Standards

### Actions Requiring Mandatory Audit Logging
Salary updates, Payroll approvals, Attendance adjustments, Employee status changes, Leave approvals, Document uploads, Permission changes, Policy publication, Employee archival

### Audit Log Structure
Actor, Entity Type, Entity ID, Action, Previous Value, New Value, Timestamp, IP/Device Metadata (future optional)

### Audit Log Governance
- be immutable,
- never be hard deleted,
- remain searchable,
- support filtering.

## Section 6 — File & Document Standards

### Supported Document Categories
Employment Contracts, Government IDs, Certificates, Payroll Documents, Compliance Forms, Policy Documents, Exit Documents, Performance Documents (future)

### MVP File Requirements
uploads, categorization, previews, downloads, version history, timestamps.

### Security Requirements
permission-based visibility, encrypted storage, audit tracking, restricted downloads for sensitive files.

### Versioning Rules
- retain historical versions,
- preserve upload history,
- preserve uploader identity.
- Documents should NOT be overwritten destructively.

## Section 7 — Search Infrastructure Standards

### MVP Search Capabilities
Search by: title, employee name, employee ID, department, tags, category.

### Filtering Standards
Filter by: status, department, date, employee type, approval state.

Search results must respect permissions.

## Section 8 — Reporting Standards

### Standard Export Formats
CSV, Excel, PDF

### Shared Reporting Features
filtering, exports, date ranges, historical lookup.

## Section 9 — Activity Feed Infrastructure (Future)

### Future Feed Events
New hires, Birthdays, Promotions, Policy releases, Work anniversaries, Company announcements

## Section 10 — MVP Governance Rules

### What MVP SHOULD Prioritize
Stability, Clear workflows, Permissions, Auditability, Operational usability, Maintainable architecture

### What MVP SHOULD Avoid
Dynamic workflow builders, Complex automation engines, Social engagement systems, AI recommendation systems, Enterprise analytics, Biometric attendance, Multi-country payroll, Highly customizable permission engines

## Section 11 — Future Expansion Governance

Every new HR request must be classified as one of:
- New Module
- Submodule
- Shared Service Enhancement
- Workflow Extension
- Reporting Enhancement

Future modules should consume shared services, inherit governance standards, reuse approval/notification/audit infrastructure.
