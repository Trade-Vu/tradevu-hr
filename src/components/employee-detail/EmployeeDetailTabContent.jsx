import React from "react";
import PersonalTab from "./tabs/PersonalTab";
import JobDataTab from "./tabs/JobDataTab";
import ContractsTab from "./tabs/ContractsTab";
import FinancialTab from "./tabs/FinancialTab";
import AttendanceTab from "./tabs/AttendanceTab";
import DocumentsTab from "./tabs/DocumentsTab";
import BenefitsTab from "./tabs/BenefitsTab";
import AssetsTab from "./tabs/AssetsTab";
import PerformanceTab from "./tabs/PerformanceTab";
import NotesTab from "./tabs/NotesTab";
import OnboardingTab from "./tabs/OnboardingTab";

export default function EmployeeDetailTabContent({
  activeSection,
  employee,
  employeeId,
  isEditing,
  editData,
  setEditData,
  navigateToJobWithStatus,
  departments,
  employeeClasses,
  employees,
  isSuperAdmin,
  handleOpenReassignDialog,
  shifts,
  employeeLeaveBalances,
  leaveTypes,
  leaveRequests,
  user,
  salaryHistory,
  requestCompensationUpdateMutation,
  documents,
  canApprove,
  createDocumentMutation,
  approveDocumentMutation,
  rejectDocumentMutation,
  replaceDocumentVersionMutation,
  deleteDocumentMutation,
  documentHistory,
  selectedDocHistory,
  setSelectedDocHistory,
  assets,
  unassignAssetMutation,
  evaluations,
}) {
  switch (activeSection) {
    case "personal":
      return (
        <PersonalTab
          employee={employee}
          employeeId={employeeId}
          isEditing={isEditing}
          editData={editData}
          setEditData={setEditData}
          onNavigateToJobWithStatus={navigateToJobWithStatus}
          onSendEmail={(email) => { window.location.href = `mailto:${email}`; }}
          onSendSMS={(phone) => { window.location.href = `sms:${phone}`; }}
          onSendWhatsApp={(phone) => { window.open(`https://wa.me/${phone.replace(/[^0-9]/g, "")}`, "_blank"); }}
        />
      );
    case "job":
      return (
        <JobDataTab
          employee={employee}
          isEditing={isEditing}
          editData={editData}
          setEditData={setEditData}
          departments={departments}
          employeeClasses={employeeClasses}
          employees={employees}
          isSuperAdmin={isSuperAdmin}
          onReassignHrAdmin={handleOpenReassignDialog}
        />
      );
    case "contracts":
      return (
        <ContractsTab
          employee={employee}
          isEditing={isEditing}
          editData={editData}
          setEditData={setEditData}
          shifts={shifts}
          employeeLeaveBalances={employeeLeaveBalances}
          leaveTypes={leaveTypes}
          leaveRequests={leaveRequests}
        />
      );
    case "financial":
      return (
        <FinancialTab
          employee={employee}
          isEditing={isEditing}
          editData={editData}
          setEditData={setEditData}
          user={user}
          salaryHistory={salaryHistory}
          onRequestCompensationUpdate={(formData, cb) =>
            requestCompensationUpdateMutation.mutate(formData, { onSuccess: cb })
          }
          isRequestingComp={requestCompensationUpdateMutation.isPending}
        />
      );
    case "attendance":
      return <AttendanceTab employee={employee} attendance={employee?.attendance || []} />;
    case "documents":
      return (
        <DocumentsTab
          documents={documents}
          canApprove={canApprove}
          onCreateDocument={(data, cb) => createDocumentMutation.mutate(data, { onSuccess: cb })}
          isCreatingDoc={createDocumentMutation.isPending}
          onApproveDocument={(id) => approveDocumentMutation.mutate(id)}
          isApprovingDoc={approveDocumentMutation.isPending}
          onRejectDocument={(data) => rejectDocumentMutation.mutate(data)}
          isRejectingDoc={rejectDocumentMutation.isPending}
          onReplaceDocument={(data, cb) => replaceDocumentVersionMutation.mutate(data, { onSuccess: cb })}
          isReplacingDoc={replaceDocumentVersionMutation.isPending}
          onDeleteDocument={(id) => deleteDocumentMutation.mutate(id)}
          isDeletingDoc={deleteDocumentMutation.isPending}
          documentHistory={documentHistory}
          selectedDocHistory={selectedDocHistory}
          setSelectedDocHistory={setSelectedDocHistory}
        />
      );
    case "benefits":
      return <BenefitsTab employee={employee} isEditing={isEditing} editData={editData} setEditData={setEditData} />;
    case "assets":
      return (
        <AssetsTab
          employee={employee}
          assets={assets}
          onUnassignAsset={(id, cb) => unassignAssetMutation.mutate(id, { onSuccess: cb })}
          isUnassigning={unassignAssetMutation.isPending}
        />
      );
    case "performance":
      return <PerformanceTab evaluations={evaluations} />;
    case "notes":
      return <NotesTab employee={employee} isEditing={isEditing} editData={editData} setEditData={setEditData} />;
    case "onboarding":
      return (
        <OnboardingTab
          employee={employee}
          employeeId={employeeId}
          onNavigateToJobWithStatus={navigateToJobWithStatus}
        />
      );
    default:
      return <div className="py-12 text-center text-slate-500">Section under development</div>;
  }
}
