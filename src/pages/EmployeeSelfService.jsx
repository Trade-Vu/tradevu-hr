import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { payrollApi } from "@/api";
import { PAGE_ROUTES } from "@/constants/pageRoutes";
import { isSuperAdmin } from "@/lib/roleUtils";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import EmployeeSelfServiceAlerts from "@/components/employee-self-service/EmployeeSelfServiceAlerts";
import EmployeeSelfServiceQuickStats from "@/components/employee-self-service/EmployeeSelfServiceQuickStats";
import EmployeeSelfServiceTabs from "@/components/employee-self-service/EmployeeSelfServiceTabs";
import useEmployeeSelfService from "@/hooks/employee-self-service/useEmployeeSelfService";
import { getSortedStatusHistory } from "@/components/employee-self-service/employeeSelfServiceUtils.jsx";
import OnboardingTab from "@/components/employee-self-service/tabs/OnboardingTab";
import ProfileTab from "@/components/employee-self-service/tabs/ProfileTab";
import PayslipsTab from "@/components/employee-self-service/tabs/PayslipsTab";
import LeaveTab from "@/components/employee-self-service/tabs/LeaveTab";
import AttendanceTab from "@/components/employee-self-service/tabs/AttendanceTab";
import AssetsTab from "@/components/employee-self-service/tabs/AssetsTab";
import ExpensesTab from "@/components/employee-self-service/tabs/ExpensesTab";
import DocumentsTab from "@/components/employee-self-service/tabs/DocumentsTab";
import JobHistoryTab from "@/components/employee-self-service/tabs/JobHistoryTab";

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } },
};

export default function EmployeeSelfService() {
  const navigate = useNavigate();
  const { user, isLoadingAuth } = useAuth();
  const service = useEmployeeSelfService();
  const [activeTab, setActiveTab] = useState("profile");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const { employee, employeeId, isLoadingEmployee, leaveTypes, leaveBalances, attendance, myTasks, documents } =
    service;
  const isEditing = service.isEditing;
  const editData = service.editData;
  const uploadData = service.uploadData;
  const isDraft = employee?.employment_status === "DRAFT" || employee?.employmentStatus === "DRAFT";
  const isPendingApproval =
    employee?.employment_status === "PENDING_APPROVAL" ||
    employee?.employmentStatus === "PENDING_APPROVAL";
  const statusHistory = getSortedStatusHistory(employee);
  const rejectionRecord = statusHistory.find(
    (item) => item.previousStatus === "PENDING_APPROVAL" && item.newStatus === "DRAFT",
  );
  // Total remaining across every leave type the org has configured, not just annual/sick -
  // LeaveTab renders the full per-type breakdown via the shared LeaveBalances component.
  const totalLeaveRemaining = leaveBalances.reduce((sum, balance) => sum + (balance.available || 0), 0);
  const monthAttendance = attendance.filter((item) => {
    const date = new Date(item.date);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  });
  const setIsEditing = service.setIsEditing;
  const setEditData = service.setEditData;
  const submitForReview = async () => {
    const data = isEditing ? editData : employee || {};
    const missing = [
      ["phone", "Phone"],
      ["privateEmail", "Private Email"],
      ["dateOfBirth", "Date of Birth"],
      ["gender", "Gender"],
      ["maritalStatus", "Marital Status"],
      ["nationality", "Nationality"],
    ]
      .filter(([key]) => !data[key]?.toString().trim())
      .map(([, label]) => label);
    if (!data.nationalId?.trim() && !data.passportNumber?.trim())
      missing.push("National ID or Passport Number");
    if (missing.length) {
      toast.error(
        `Please complete the following required fields before submitting: ${missing.join(", ")}`,
      );
      if (!isEditing) setIsEditing(true);
      return;
    }
    try {
      if (isEditing)
        await service.updateEmployeeMutation.mutateAsync({ id: employee.id, data: editData });
      await service.submitProfileMutation.mutateAsync();
      setIsEditing(false);
    } catch (error) {
      console.error("Submit for review error:", error);
    }
  };
  const uploadDocument = async () => {
    try {
      service.setIsUploadingToCloudinary(true);
      const result = await service.uploadToCloudinary(uploadData.file);
      service.uploadDocumentMutation.mutate({
        employeeId,
        name: uploadData.name,
        category: uploadData.category || "Other",
        fileUrl: result.secure_url,
        fileType: result.format || uploadData.file.name.split(".").pop() || "pdf",
        visibilityLevel: "EMPLOYEE",
      });
    } catch (error) {
      toast.error(`Cloudinary upload failed: ${error.message || "Upload error"}`);
    } finally {
      service.setIsUploadingToCloudinary(false);
    }
  };
  const downloadPayslip = async (payroll) => {
    try {
      setIsGeneratingPdf(true);
      const blob = await payrollApi.downloadPayslipPdf(payroll.id);
      const url = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `Payslip_${payroll.month || payroll.id}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Payslip downloaded successfully");
    } catch (error) {
      toast.error(`Failed to download PDF payslip: ${error.message}`);
    } finally {
      setIsGeneratingPdf(false);
    }
  };
  if (user && isSuperAdmin(user)) return <Navigate to={PAGE_ROUTES.DASHBOARD} replace />;
  if (isLoadingAuth || (isLoadingEmployee && employeeId)) return <LoadingState />;
  if (!employee) return <EmptyProfile onBack={() => navigate(PAGE_ROUTES.HOME)} />;
  return (
    <div className="relative min-h-screen p-8 -m-4 md:-m-8 bg-gradient-to-br from-indigo-50 via-white to-blue-50 md:p-12">
      <motion.div className="mx-auto space-y-8 max-w-7xl" initial="hidden" animate="visible">
        <motion.div variants={itemVariants}>
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-4 border rounded-full shadow-sm bg-white/80 border-slate-200/60">
            <User className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-medium text-slate-700">Employee Self-Service</span>
          </div>
          <p className="text-lg text-slate-600">
            Manage your profile, view documents, and track your information
          </p>
        </motion.div>
        <EmployeeSelfServiceAlerts
          pendingTasksCount={service.pendingTasksCount}
          hideBanner={service.hideBanner}
          isDraft={isDraft}
          hasBeenRejected={Boolean(rejectionRecord)}
          rejectionReason={rejectionRecord?.reason}
          isPendingApproval={isPendingApproval}
          hasOnboardingTasks={service.pendingTasksCount > 0}
          isSubmittingProfile={service.submitProfileMutation.isPending}
          isCompletingTasks={service.completeAllMutation.isPending}
          onRemindLater={service.handleRemindLater}
          onViewTasks={() => navigate(PAGE_ROUTES.TASK_MANAGER)}
          onCompleteAll={service.handleCompleteAll}
          onSubmitForReview={submitForReview}
          onOpenOnboarding={() => setActiveTab("onboarding")}
        />
        <motion.div variants={itemVariants}>
          <EmployeeSelfServiceQuickStats
            stats={[
              {
                key: "leave",
                value: totalLeaveRemaining,
                label: "Leave Days Remaining",
                clickable: true,
              },
              {
                key: "attendance",
                value: monthAttendance.filter((item) => item.status === "present").length,
                label: "Days Present This Month",
              },
              { key: "assets", value: service.assets.length, label: "Assigned Assets" },
              {
                key: "expenses",
                value: service.expenses.filter((item) => item.status === "pending").length,
                label: "Pending Expenses",
              },
            ]}
            onLeaveClick={() => navigate(PAGE_ROUTES.LEAVE_MANAGEMENT)}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <div className="overflow-x-auto hidden-scrollbar">
              <EmployeeSelfServiceTabs pendingTasksCount={service.pendingTasksCount} />
            </div>
            <TabsContent value="onboarding">
              <OnboardingTab
                tasks={myTasks}
                pendingTasksCount={service.pendingTasksCount}
                isCompleting={service.completeAllMutation.isPending}
                onCompleteAll={service.handleCompleteAll}
                onOpenTaskManager={() => navigate(PAGE_ROUTES.TASK_MANAGER)}
                onToggleTask={service.toggleTaskMutation.mutate}
              />
            </TabsContent>
            <TabsContent value="profile">
              <ProfileTab
                employee={employee}
                isDraft={isDraft}
                isPendingApproval={isPendingApproval}
                isEditing={isEditing}
                editData={editData}
                isSaving={service.updateEmployeeMutation.isPending}
                isSubmitting={service.submitProfileMutation.isPending}
                onEdit={() => setIsEditing(true)}
                onCancel={() => {
                  setEditData(employee);
                  setIsEditing(false);
                }}
                onChange={(key, value) => setEditData((old) => ({ ...old, [key]: value }))}
                onSave={service.handleSave}
                onSubmit={submitForReview}
              />
            </TabsContent>
            <TabsContent value="payslips">
              <PayslipsTab
                payrolls={service.payrolls}
                isDownloading={isGeneratingPdf}
                onDownload={downloadPayslip}
              />
            </TabsContent>
            <TabsContent value="leave">
              <LeaveTab
                balances={leaveBalances}
                leaveTypes={leaveTypes}
                requests={service.leaveRequests}
                onOpenLeave={() => navigate(PAGE_ROUTES.LEAVE_MANAGEMENT)}
              />
            </TabsContent>
            <TabsContent value="attendance">
              <AttendanceTab attendance={attendance} />
            </TabsContent>
            <TabsContent value="assets">
              <AssetsTab assets={service.assets} />
            </TabsContent>
            <TabsContent value="expenses">
              <ExpensesTab expenses={service.expenses} />
            </TabsContent>
            <TabsContent value="documents">
              <DocumentsTab
                documents={documents}
                employeeId={employeeId}
                isOpen={service.isUploadOpen}
                onOpenChange={service.setIsUploadOpen}
                uploadData={uploadData}
                setUploadData={service.setUploadData}
                isUploading={service.isUploadingToCloudinary}
                isPending={service.uploadDocumentMutation.isPending}
                onUpload={uploadDocument}
                uploadingDocId={service.uploadingDocId}
                onFulfill={service.handleFulfillDocument}
              />
            </TabsContent>
            <TabsContent value="job-history">
              <JobHistoryTab employee={employee} statusHistory={statusHistory} />
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>
    </div>
  );
}
function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-600 rounded-full border-t-transparent animate-spin" />
        <p className="text-slate-600">Loading your profile...</p>
      </div>
    </div>
  );
}
function EmptyProfile({ onBack }) {
  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-slate-50/50">
      <div className="w-full max-w-md p-8 text-center bg-white border shadow-sm rounded-xl border-slate-200">
        <User className="w-12 h-12 mx-auto mb-4 text-amber-600" />
        <h3 className="mb-2 text-lg font-semibold text-slate-800">No Employee Profile Found</h3>
        <p className="mb-6 text-sm text-slate-500">
          Your account is not associated with an active employee record, or the profile could not be
          loaded.
        </p>
        <Button onClick={onBack} className="w-full">
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
