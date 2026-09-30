import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Edit, Save, X, Mail } from "lucide-react";
import { toast } from "sonner";

import { documentsApi, employeesApi } from "@/api";
import { useAuth } from "@/lib/AuthContext";
import { PAGE_ROUTES } from "@/constants/pageRoutes";
import { isOnboardedStatus, isSeparatedStatus } from "@/lib/employmentStatus";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import {
  menuItems,
  isEmployeeEligibleForHrAdmin,
  getEmployeeDirtyPayload,
} from "@/components/employee-detail/employeeDetailUtils";

import { useEmployeeDetailData } from "@/components/employee-detail/useEmployeeDetailData";

import EmployeeHeader from "@/components/employee-detail/EmployeeHeader";
import ProfileApprovalBanner from "@/components/employee-detail/ProfileApprovalBanner";
import EmployeeDetailDialogs from "@/components/employee-detail/EmployeeDetailDialogs";
import EmployeeDetailTabContent from "@/components/employee-detail/EmployeeDetailTabContent";

export { isEmployeeEligibleForHrAdmin };

export default function EmployeeDetail({ employeeIdProp, employeeDetail, onClose }) {
  const { id: routeId } = useParams();
  const employeeId = employeeIdProp || routeId;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isModal = Boolean(employeeIdProp);

  const [activeSection, setActiveSection] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [activeDialog, setActiveDialog] = useState(null);
  const [selectedHrAdminEmpId, setSelectedHrAdminEmpId] = useState('');
  const [selectedDocHistory, setSelectedDocHistory] = useState(null);

  const {
    employee,
    isLoading,
    isError,
    error,
    departments,
    employeeClasses,
    employees,
    attendance,
    shifts,
    leaveRequests,
    employeeLeaveBalances,
    salaryHistory,
    evaluations,
    documents,
    assets,
    leaveTypes,
    updateEmployeeMutation,
    requestCompensationUpdateMutation,
    suspendEmployeeMutation,
    requestPromotionMutation,
    requestOffboardingMutation,
    requestProbationMutation,
    reactivateEmployeeMutation,
    reassignHrMutation,
    createDocumentMutation,
    replaceDocumentVersionMutation,
    approveDocumentMutation,
    rejectDocumentMutation,
    deleteDocumentMutation,
    unassignAssetMutation,
  } = useEmployeeDetailData(employeeId, employeeDetail);

  const { data: documentHistory = [] } = useQuery({
    queryKey: ['document-history', selectedDocHistory?.id],
    queryFn: async () => {
      if (!selectedDocHistory?.id) return [];
      const res = await documentsApi.getDocumentHistory(selectedDocHistory.id);
      return res.data?.data?.history || res.data?.history || [];
    },
    enabled: Boolean(selectedDocHistory?.id),
    initialData: [],
  });

  useEffect(() => {
    if (employee && !isEditing) setEditData(employee);
  }, [employee, isEditing]);

  const canApprove = ['SUPER_ADMIN', 'HR_ADMIN', 'admin', 'CEO'].includes(user?.role) || Boolean(user?.isOrgOwner || user?.is_organization_owner);
  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || Boolean(user?.isOrgOwner || user?.is_organization_owner);
  const statusUpper = String(employee?.employment_status || employee?.employmentStatus || 'DRAFT').toUpperCase();
  const isEmployeeActive = statusUpper === 'ACTIVE' || Boolean(employee?.userActive || employee?.isUserActive || employee?.isActive);
  const isDraft = Boolean(employee && statusUpper === 'DRAFT');
  const isPendingApproval = Boolean(employee && statusUpper === 'PENDING_APPROVAL');
  const isPendingApprovalOrDraft = isDraft || isPendingApproval;
  const isSeparated = isSeparatedStatus(statusUpper);
  const isNotOnboarded = Boolean(employee && !isOnboardedStatus(statusUpper));
  const canResendInvite = (['SUPER_ADMIN', 'HR_ADMIN', 'admin'].includes(user?.role) || Boolean(user?.isOrgOwner || user?.is_organization_owner)) && isNotOnboarded && !isEmployeeActive && !isSeparated;

  const resendInviteMutation = useMutation({
    mutationFn: () => employeesApi.resendInvite(employee.id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['employee', employeeId] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['paginatedEmployees'] });
      if (data?.emailSent === false && data?.inviteUrl) {
        toast.warning(data.message, {
          action: {
            label: 'Copy Link',
            onClick: () => {
              navigator.clipboard?.writeText(data.inviteUrl);
              toast.success('Invite link copied to clipboard!');
            },
          },
          duration: 10000,
        });
      } else {
        toast.success(data?.message || `Invitation resent successfully to ${employee.email}!`);
      }
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to resend invitation.');
    },
  });

  const navigateToJobWithStatus = (status) => {
    setActiveSection('job');
    setIsEditing(true);
    setEditData(prev => ({ ...prev, employment_status: status }));
  };

  const handleOpenReassignDialog = () => {
    const defaultId = !employee?.isHrAdmin
      ? (employee?.id || '')
      : (employees.find(e => isEmployeeEligibleForHrAdmin(e) && !e.isHrAdmin && e.id !== employee?.id)?.id || '');
    setSelectedHrAdminEmpId(defaultId);
    setActiveDialog('reassign');
  };

  const dirtyPayload = useMemo(() => {
    return employee && isEditing ? getEmployeeDirtyPayload(employee, editData) : {};
  }, [employee, editData, isEditing]);

  const hasChanges = Object.keys(dirtyPayload).length > 0;

  const handleSave = () => {
    if (!hasChanges) {
      toast.info("No changes were made.");
      setIsEditing(false);
      return;
    }
    updateEmployeeMutation.mutate({ id: employee.id, data: editData, original: employee }, {
      onSuccess: () => setIsEditing(false)
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (isError || !employee) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="p-8 text-center bg-white border border-red-200 shadow rounded-xl">
          <h2 className="mb-2 text-xl font-semibold text-red-600">
            {isError ? "Error Loading Employee" : "Employee Not Found"}
          </h2>
          <p className="mb-4 text-slate-600">{error?.message || "The employee you're looking for doesn't exist or you don't have access."}</p>
          <Button onClick={() => isError ? window.location.reload() : navigate(PAGE_ROUTES.EMPLOYEES)}>
            {isError ? "Try Again" : "Return to Employees"}
          </Button>
        </div>
      </div>
    );
  }

  const cardContent = (
    <Card className={`border-slate-200/60 overflow-hidden ${isModal ? 'shadow-none border-0 h-full rounded-none flex flex-col bg-white flex-1 min-h-0' : 'shadow-xl shadow-slate-200/40 rounded-2xl bg-white/70 backdrop-blur-md'}`}>
      <EmployeeHeader
        employee={employee}
        user={user}
        isSuperAdmin={isSuperAdmin}
        onReassignHrAdmin={handleOpenReassignDialog}
        onPromote={() => setActiveDialog('promote')}
        onSuspend={() => setActiveDialog('suspend')}
        onProbation={() => setActiveDialog('probation')}
        onOffboard={() => setActiveDialog('offboard')}
        onReactivate={() => setActiveDialog('reactivate')}
        onResendInvite={() => resendInviteMutation.mutate()}
        isResendingInvite={resendInviteMutation.isPending}
      />

      <div className={`flex ${isModal ? 'flex-1 overflow-hidden' : ''} bg-white`}>
        <div className={`w-64 border-r border-slate-200/60 bg-slate-50/50 p-4 shrink-0 ${isModal ? 'overflow-y-auto' : ''}`}>
          <div className="space-y-1.5">
            {menuItems.map(item => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm font-medium ${isActive
                    ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 border border-transparent'
                    }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className={`flex-1 p-8 ${isModal ? 'overflow-y-auto' : ''}`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">
              {menuItems.find(m => m.id === activeSection)?.label}
            </h2>
            <div className="flex items-center gap-2">
              {canResendInvite && !isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => resendInviteMutation.mutate()}
                  disabled={resendInviteMutation.isPending}
                  className="gap-1.5 text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                >
                  <Mail className="w-4 h-4 text-indigo-600" />
                  {resendInviteMutation.isPending ? "Resending..." : "Resend Invite"}
                </Button>
              )}
              {isEditing && (
                <>
                  {hasChanges && (
                    <span className="text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full animate-in fade-in">
                      Unsaved changes
                    </span>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      if (employee) setEditData(employee);
                    }}
                    className="gap-2"
                    disabled={updateEmployeeMutation.isPending}
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </Button>
                </>
              )}
              <Button
                variant={isEditing && hasChanges ? "default" : "outline"}
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                className={`gap-2 transition-all ${
                  isEditing && hasChanges 
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm font-medium" 
                    : ""
                }`}
                disabled={updateEmployeeMutation.isPending}
              >
                {isEditing ? (
                  <>
                    <Save className="w-4 h-4" />
                    {updateEmployeeMutation.isPending ? 'Saving...' : 'Save'}
                  </>
                ) : (
                  <>
                    <Edit className="w-4 h-4" />
                    Edit
                  </>
                )}
              </Button>
            </div>
          </div>

          {canApprove && isPendingApprovalOrDraft && (
            <ProfileApprovalBanner
              isDraft={isDraft}
              employeeId={employeeId}
              onRequestRevision={() => setActiveDialog('reject')}
              queryClient={queryClient}
              onResendInvite={() => resendInviteMutation.mutate()}
              isResendingInvite={resendInviteMutation.isPending}
            />
          )}

          <EmployeeDetailTabContent
            activeSection={activeSection}
            employee={employee}
            employeeId={employeeId}
            isEditing={isEditing}
            editData={editData}
            setEditData={setEditData}
            navigateToJobWithStatus={navigateToJobWithStatus}
            departments={departments}
            employeeClasses={employeeClasses}
            employees={employees}
            isSuperAdmin={isSuperAdmin}
            handleOpenReassignDialog={handleOpenReassignDialog}
            shifts={shifts}
            employeeLeaveBalances={employeeLeaveBalances}
            leaveTypes={leaveTypes}
            leaveRequests={leaveRequests}
            user={user}
            salaryHistory={salaryHistory}
            requestCompensationUpdateMutation={requestCompensationUpdateMutation}
            documents={documents}
            canApprove={canApprove}
            createDocumentMutation={createDocumentMutation}
            approveDocumentMutation={approveDocumentMutation}
            rejectDocumentMutation={rejectDocumentMutation}
            replaceDocumentVersionMutation={replaceDocumentVersionMutation}
            deleteDocumentMutation={deleteDocumentMutation}
            documentHistory={documentHistory}
            selectedDocHistory={selectedDocHistory}
            setSelectedDocHistory={setSelectedDocHistory}
            assets={assets}
            unassignAssetMutation={unassignAssetMutation}
            evaluations={evaluations}
          />
        </div>
      </div>
    </Card>
  );

  return (
    <>
      {isModal ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="h-[85vh] flex flex-col relative bg-white w-full rounded-2xl overflow-hidden"
        >
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute z-50 transition-all border rounded-full shadow-sm top-4 right-4 text-slate-400 hover:text-white hover:bg-slate-800 bg-slate-900/50 backdrop-blur-sm border-slate-700"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
          {cardContent}
        </motion.div>
      ) : (
        <div className="min-h-screen p-4">
          <motion.div
            className="mx-auto space-y-6 max-w-7xl"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Button variant="ghost" onClick={() => navigate(PAGE_ROUTES.EMPLOYEES)} className="gap-2 text-slate-600 hover:text-slate-900">
              <ArrowLeft className="w-4 h-4" /> Back to Employees
            </Button>
            {cardContent}
          </motion.div>
        </div>
      )}

      <EmployeeDetailDialogs
        employee={employee}
        employees={employees}
        departments={departments}
        employeeClasses={employeeClasses}
        employeeId={employeeId}
        queryClient={queryClient}
        activeDialog={activeDialog}
        onCloseDialog={() => setActiveDialog(null)}
        selectedHrAdminEmpId={selectedHrAdminEmpId}
        setSelectedHrAdminEmpId={setSelectedHrAdminEmpId}
        mutations={{
          reassignHr: reassignHrMutation,
          requestPromotion: requestPromotionMutation,
          suspendEmployee: suspendEmployeeMutation,
          requestOffboarding: requestOffboardingMutation,
          requestProbation: requestProbationMutation,
          reactivateEmployee: reactivateEmployeeMutation,
        }}
      />
    </>
  );
}