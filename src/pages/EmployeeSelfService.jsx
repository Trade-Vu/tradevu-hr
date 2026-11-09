import React, { useState, useEffect } from "react";
import { useNavigate, Navigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { User, ArrowLeft, LayoutDashboard } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { payrollApi } from "@/api";
import { PAGE_ROUTES } from "@/constants/pageRoutes";
import { isSuperAdmin } from "@/lib/roleUtils";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import EmployeeSelfServiceAlerts from "@/components/employee-self-service/EmployeeSelfServiceAlerts";
import EmployeeDashboardHeader from "@/components/employee-self-service/EmployeeDashboardHeader";
import EmployeeSelfServiceTabs from "@/components/employee-self-service/EmployeeSelfServiceTabs";
import useEmployeeSelfService from "@/hooks/employee-self-service/useEmployeeSelfService";
import { getSortedStatusHistory } from "@/components/employee-self-service/employeeSelfServiceUtils.jsx";
import OverviewTab from "@/components/employee-self-service/tabs/OverviewTab";
import ProfileTab from "@/components/employee-self-service/tabs/ProfileTab";
import PayslipsTab from "@/components/employee-self-service/tabs/PayslipsTab";
import AssetsTab from "@/components/employee-self-service/tabs/AssetsTab";
import DocumentsTab from "@/components/employee-self-service/tabs/DocumentsTab";
import JobHistoryTab from "@/components/employee-self-service/tabs/JobHistoryTab";

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } },
};

export default function EmployeeSelfService() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isLoadingAuth } = useAuth();
  const service = useEmployeeSelfService();

  const dossierTabs = ["profile", "documents", "payslips", "assets", "job-history"];
  const validTabs = ["overview", ...dossierTabs];

  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(
    validTabs.includes(tabParam) ? tabParam : "overview"
  );

  useEffect(() => {
    const current = searchParams.get("tab");
    // Seamless redirect for workflow tabs that live in dedicated sidebar pages
    if (current === "leave") {
      navigate(PAGE_ROUTES.LEAVE_MANAGEMENT, { replace: true });
      return;
    }
    if (current === "expenses") {
      navigate(PAGE_ROUTES.EXPENSES, { replace: true });
      return;
    }
    if (current === "attendance") {
      navigate(PAGE_ROUTES.ATTENDANCE, { replace: true });
      return;
    }
    if (current === "onboarding") {
      navigate(PAGE_ROUTES.TASK_MANAGER, { replace: true });
      return;
    }
    if (current && validTabs.includes(current) && current !== activeTab) {
      setActiveTab(current);
    } else if (!current && activeTab !== "overview") {
      setActiveTab("overview");
    }
  }, [searchParams]);

  const handleTabChange = (newTab) => {
    if (newTab === "leave") {
      navigate(PAGE_ROUTES.LEAVE_MANAGEMENT);
      return;
    }
    if (newTab === "expenses") {
      navigate(PAGE_ROUTES.EXPENSES);
      return;
    }
    if (newTab === "attendance") {
      navigate(PAGE_ROUTES.ATTENDANCE);
      return;
    }
    if (newTab === "onboarding") {
      navigate(PAGE_ROUTES.TASK_MANAGER);
      return;
    }

    setActiveTab(newTab);
    setSearchParams(
      (prev) => {
        const updated = new URLSearchParams(prev);
        if (newTab === "overview") {
          updated.delete("tab");
        } else {
          updated.set("tab", newTab);
        }
        return updated;
      },
      { replace: true }
    );
  };

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
    <div className="relative min-h-screen p-8 -m-4 md:-m-8">
      <motion.div className="mx-auto space-y-8 max-w-7xl" initial="hidden" animate="visible">
        <motion.div variants={itemVariants}>
          <EmployeeDashboardHeader
            user={user}
            employee={employee}
            pendingTasksCount={service.pendingTasksCount}
            isDraft={isDraft}
            isPendingApproval={isPendingApproval}
            onNavigateTab={handleTabChange}
          />
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
          onOpenOnboarding={() => handleTabChange("onboarding")}
          notifications={service.dashboardNotifications}
          onDismissNotification={(id) => service.markNotificationReadMutation.mutate(id)}
        />
        <motion.div variants={itemVariants}>
          {activeTab === "overview" ? (
            <OverviewTab
              employee={employee}
              totalLeaveRemaining={totalLeaveRemaining}
              monthAttendance={monthAttendance}
              latestPayroll={service.payrolls?.[0] || null}
              pendingTasksCount={service.pendingTasksCount}
              leaveRequests={service.leaveRequests}
              expenses={service.expenses}
              payrolls={service.payrolls}
              onNavigateTab={handleTabChange}
              onDownloadPayslip={downloadPayslip}
              isLoading={isLoadingEmployee}
            />
          ) : (
            <div className="space-y-6">
              {/* Dossier Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/70 shadow-xs">
                <div>
                  <button
                    onClick={() => handleTabChange("overview")}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-2 cursor-pointer group"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
                    <span>Back to Overview Dashboard</span>
                  </button>
                  <h2 className="text-xl sm:text-2xl font-bold font-heading text-slate-900 tracking-tight">
                    My Profile & Records
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Manage your personal information, employment documents, payslips, and company assets.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTabChange("overview")}
                    className="text-xs h-9 rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5 font-medium cursor-pointer"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-slate-500" />
                    <span>Dashboard</span>
                  </Button>
                </div>
              </div>

              {/* Dossier Tabs */}
              <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
                <div className="overflow-x-auto hidden-scrollbar">
                  <EmployeeSelfServiceTabs />
                </div>

                <TabsContent value="profile" className="mt-0 outline-none">
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

                <TabsContent value="documents" className="mt-0 outline-none">
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

                <TabsContent value="payslips" className="mt-0 outline-none">
                  <PayslipsTab
                    payrolls={service.payrolls}
                    isDownloading={isGeneratingPdf}
                    onDownload={downloadPayslip}
                  />
                </TabsContent>

                <TabsContent value="assets" className="mt-0 outline-none">
                  <AssetsTab assets={service.assets} />
                </TabsContent>

                <TabsContent value="job-history" className="mt-0 outline-none">
                  <JobHistoryTab employee={employee} statusHistory={statusHistory} />
                </TabsContent>
              </Tabs>
            </div>
          )}
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
