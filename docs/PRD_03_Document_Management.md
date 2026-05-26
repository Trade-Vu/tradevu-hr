# PRD 03 — Employee Document Management

## Version History
| Version | Description | Date |
|---------|-------------|------|
| 1.0 | First version of PRD | 20 May 2026 |

## Overview
Centralized, secure, and auditable document handling across the employee lifecycle.

Supports: employee records, onboarding, offboarding, compliance tracking, payroll references, future HR workflows.

## Product Goals
- centralize employee-related documents,
- reduce manual file handling,
- improve document retrieval,
- maintain secure storage,
- support auditability,
- provide version history,
- support future compliance workflows.

## Included In MVP
Employee document uploads, Document categorization, Document previews, Secure downloads, Version history, Employee-linked documents, Upload audit trails, Permission-based visibility, Search & filtering, Document replacement/versioning, Document metadata tracking

## Excluded From MVP
OCR processing, AI document classification, Digital signatures, External document verification, Automated compliance expiration workflows, Bulk upload automation, Workflow-based document approvals

## Document Categories
Employment Contract, Offer Letter, Government ID, Passport Photograph, Certificates & Qualifications, Compliance Forms, Guarantor Documents, Promotion Letters, Payroll Support Documents, Exit Documents, Miscellaneous HR Documents

## Document Metadata Structure
Document ID, Document Name, Employee ID, Category, Uploaded By, Upload Timestamp, Current Version, File Type, File Size, Visibility Level, Status

## Document Statuses
- **Active**: Current approved version
- **Archived**: Historical version
- **Deleted**: Soft-deleted document

## Supported File Types
PDF, JPG, JPEG, PNG, DOCX

## File Naming
System-generated: `EMP-000014_CONTRACT_V2.pdf`

## Versioning Rules
- create new versions on replacement,
- preserve previous versions,
- preserve uploader history,
- preserve timestamps.

### Version Visibility
- HR Admin / Super Admin: All versions
- Employee: Current approved version only
- Manager: Only permitted versions

## Sensitive Documents
Government IDs, Payroll documents, Tax records, Pension documents, Exit interview documents.
**Managers should NOT access these by default.**

## Employee Upload Flow
1. Employee selects category
2. Uploads file
3. Metadata generated
4. Audit log created
5. HR Admin notified if review required

## HR Upload / Replacement Flow
1. Existing document selected
2. New version uploaded
3. Previous version archived
4. New version marked active
5. Audit log created

## Search Capabilities
Search by: employee name, employee ID, document category, upload date, uploader, filename.
Filter by: Category, Upload Date, Employee, Department, Visibility, Status.

## Audit Events
Document uploaded, replaced, archived, downloaded, visibility changed, deleted.

## Security
- encrypted storage,
- secure retrieval,
- permission validation,
- private file access,
- downloads require authentication,
- public URLs should not expose sensitive files.

## API Expectations
Upload Document, Replace Document Version, Get Employee Documents, Download Document, Search Documents, Archive Document, Delete Document (Soft Delete), Get Document History

## Backend Priority
**Phase 1:** Storage architecture, File upload service, Employee-document linking, Permission validation, Metadata storage
**Phase 2:** Version history, Search & filtering, Audit logging, Download handling, Secure retrieval
**Phase 3:** Reporting, Notification hooks, Compliance readiness improvements
