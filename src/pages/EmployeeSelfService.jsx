import React, { useState, useEffect } from "react";
import countryList from 'country-list';
import { PAGE_ROUTES } from "@/constants/pageRoutes";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  employeesApi,
  payrollApi,
  leaveApi,
  attendanceApi,
  documentsApi,
  onboardingApi,
  assetsApi,
  expensesApi,
} from "@/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { 
  User, Calendar, DollarSign, FileText, Laptop, 
  TrendingUp, Download, Edit, Save, Clock, CheckCircle,
  Plane, Receipt, Shield, Upload, Eye, Send
} from "lucide-react";
import { useNavigate, Navigate } from "react-router-dom";
import { format } from "date-fns";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "sonner";
import { uploadToCloudinary } from "@/utils/cloudinary";
import { motion } from "framer-motion";
import { isSuperAdmin } from "@/lib/roleUtils";
const formatStatusDate = (d) => {
  if (!d) return 'N/A';
  const num = Number(d);
  const parsed = !isNaN(num) && num > 0 ? new Date(num) : new Date(d);
  return isNaN(parsed.getTime()) ? 'N/A' : parsed.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const renderStatusHistoryBadge = (status, isNew = false) => {
  if (!status || status === 'N/A' || status === 'INITIAL') {
    return <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200">{status === 'INITIAL' ? 'Initial' : 'N/A'}</Badge>;
  }
  const label = String(status).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const s = String(status).toUpperCase();
  if (s === 'ACTIVE') {
    return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">{label}</Badge>;
  }
  if (s === 'PROBATION') {
    return <Badge className="bg-amber-50 text-amber-700 border-amber-200">{label}</Badge>;
  }
  if (s === 'PENDING_APPROVAL' || s === 'PENDING_ONBOARDING' || s === 'ONGOING_ONBOARDING') {
    return <Badge className="bg-blue-50 text-blue-700 border-blue-200">{label}</Badge>;
  }
  if (s === 'DRAFT') {
    return <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">{label}</Badge>;
  }
  if (s === 'TERMINATED' || s === 'SUSPENDED' || s === 'OFFBOARDED' || s === 'RESIGNED') {
    return <Badge className="bg-rose-50 text-rose-700 border-rose-200">{label}</Badge>;
  }
  return <Badge className={isNew ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "bg-slate-50 text-slate-600 border-slate-200"}>{label}</Badge>;
};

export default function EmployeeSelfService() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isLoadingAuth } = useAuth();

  // SUPER_ADMIN should only have an adminView and cannot access employee view
  if (user && isSuperAdmin(user)) {
    return <Navigate to={PAGE_ROUTES.DASHBOARD} replace />;
  }

  const employeeId =
    user?.employeeId?._id ||
    user?.employeeId?.id ||
    user?.employee?._id ||
    user?.employee?.id ||
    (typeof user?.employeeId === 'string' ? user?.employeeId : null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadData, setUploadData] = useState({ name: '', category: 'General', file: null });
  const [isUploadingToCloudinary, setIsUploadingToCloudinary] = useState(false);
  const [uploadingDocId, setUploadingDocId] = useState(null);

  const { data: employee, isLoading: isLoadingEmployee } = useQuery({
    queryKey: ['employee', employeeId],
    queryFn: async () => {
      if (!employeeId) return null;
      const emp = await employeesApi.getEmployeeById(employeeId);
      if (!emp) return null;
      return {
        ...emp,
        id: emp._id || emp.id,
        full_name: emp.fullName,
        job_title: emp.jobTitle,
        department_id: emp.department?.name || emp.departmentId?.name || emp.departmentId,
        start_date: emp.hireDate,
        employment_status: emp.employmentStatus,
        promotion_history: emp.promotionHistory || [],
        status_history: emp.statusHistory || emp.status_history || [],
        statusHistory: emp.statusHistory || emp.status_history || [],
      };
    },
    enabled: !!employeeId,
  });

  useEffect(() => {
    if (employee) {
      setEditData(employee);
    }
  }, [employee]);

  const { data: payrolls = [] } = useQuery({
    queryKey: ['my-payrolls', employee?.id],
    queryFn: async () => {
      const res = await payrollApi.getMyPayslips();
      const list = Array.isArray(res) ? res : res?.data || [];
      return list.map(r => ({
        ...r,
        id: r._id || r.id,
        month: r.payrollRunId?.month || r.month || 'N/A',
        status: r.payrollRunId?.status || r.status || 'draft',
        basic_salary: r.basicSalary || 0,
        net_salary: r.netPay || 0,
        total_earnings: r.grossPay || 0,
      }));
    },
    enabled: !!employee,
  });

  const { data: leaveRequests = [] } = useQuery({
    queryKey: ['my-leaves', employee?.id],
    queryFn: async () => {
      const res = await leaveApi.getMyRequests();
      const list = Array.isArray(res) ? res : res?.data || [];
      return list.map(l => ({
        ...l,
        id: l._id || l.id,
        leave_type: l.leaveTypeId?.name || l.leave_type || 'Leave',
        start_date: l.startDate || l.start_date,
        end_date: l.endDate || l.end_date,
        status: l.status,
      }));
    },
    enabled: !!employee,
    initialData: [],
  });

  const { data: leaveBalances = [] } = useQuery({
    queryKey: ['my-leave-balances', employee?.id],
    queryFn: async () => {
      if (!employee?.id) return [];
      const res = await leaveApi.getBalances(employee.id);
      const normalized = Array.isArray(res) ? res : res?.data || res;
      if (normalized && Array.isArray(normalized.balances)) {
        return normalized.balances.map((balance) => ({
          ...balance,
          id: balance._id || balance.id,
          leaveTypeId: balance.leaveTypeId?._id || balance.leaveTypeId || balance.leaveType || '',
          leaveType: balance.leaveTypeId?.name || balance.leaveType?.name || 'Leave',
          allocatedDays: balance.allocated ?? balance.totalEntitled ?? 0,
          usedDays: balance.used ?? 0,
          remainingDays: balance.remaining ?? balance.available ?? 0,
        }));
      }
      return Array.isArray(normalized) ? normalized : [];
    },
    enabled: !!employee?.id,
    initialData: [],
  });

  const annualBalance = leaveBalances.find(b => b.leaveTypeId?.name?.toLowerCase().includes('annual') || b.leaveType?.toLowerCase().includes('annual'));
  const sickBalance = leaveBalances.find(b => b.leaveTypeId?.name?.toLowerCase().includes('sick') || b.leaveType?.toLowerCase().includes('sick'));

  const annualLeaveTotal = annualBalance?.allocatedDays ?? employee?.leave_balances?.annual_leave_total ?? 21;
  const annualLeaveUsed = annualBalance?.usedDays ?? employee?.leave_balances?.annual_leave_used ?? 0;
  const annualLeaveRemaining = annualLeaveTotal - annualLeaveUsed;

  const sickLeaveTotal = sickBalance?.allocatedDays ?? employee?.leave_balances?.sick_leave_total ?? 30;
  const sickLeaveUsed = sickBalance?.usedDays ?? employee?.leave_balances?.sick_leave_used ?? 0;
  const sickLeaveRemaining = sickLeaveTotal - sickLeaveUsed;

  const { data: attendance = [] } = useQuery({
    queryKey: ['my-attendance', employee?.id],
    queryFn: async () => {
      const res = await attendanceApi.getMyAttendance();
      const list = Array.isArray(res) ? res : res?.data || [];
      return list.map(a => ({
        ...a,
        id: a._id || a.id,
        date: a.date,
        status: a.status,
        check_in: a.clockIn,
        check_out: a.clockOut,
      }));
    },
    enabled: !!employee,
    initialData: [],
  });

  const [activeTab, setActiveTab] = useState('profile');

  const { data: myTasks = [] } = useQuery({
    queryKey: ['my-onboarding-tasks', employee?.id],
    queryFn: async () => {
      const res = await onboardingApi.getMyTasks();
      const list = Array.isArray(res) ? res : res?.data || [];
      return list.map(t => ({
        ...t,
        id: t._id || t.id,
        isCompleted: t.status === 'completed' || t.status === 'DONE' || t.status === 'approved' || !!t.isCompleted,
      }));
    },
    enabled: true,
  });

  const pendingTasksCount = myTasks.filter(t => !t.isCompleted).length;

  const [hideBanner, setHideBanner] = useState(() => {
    return sessionStorage.getItem('hideOnboardingBanner') === 'true';
  });

  const toggleTaskMutation = useMutation({
    mutationFn: async ({ taskId, isCompleted }) => {
      const nextStatus = isCompleted ? 'not_started' : 'completed';
      return await onboardingApi.updateTask(taskId, { status: nextStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-onboarding-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['onboarding-tasks'] });
      toast.success("Task updated!");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update task");
    }
  });

  const completeAllMutation = useMutation({
    mutationFn: async (taskIds) => {
      for (const id of taskIds) {
        await onboardingApi.updateTask(id, { status: 'completed' });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-onboarding-tasks', employee?.id] });
      queryClient.invalidateQueries({ queryKey: ['onboarding-tasks'] });
      setHideBanner(true);
      toast.success("All tasks marked as completed!");
    },
    onError: (error) => {
      toast.error("Failed to complete tasks: " + error.message);
      console.error(error);
    },
  });

  const handleCompleteAll = () => {
    const pendingTaskIds = myTasks.filter(t => !t.isCompleted).map(t => t.id);
    if (pendingTaskIds.length > 0) {
      completeAllMutation.mutate(pendingTaskIds);
    } else {
      setHideBanner(true);
    }
  };

  const handleRemindLater = () => {
    sessionStorage.setItem('hideOnboardingBanner', 'true');
    setHideBanner(true);
  };

  const { data: assets = [] } = useQuery({
    queryKey: ['my-assets', employee?.id],
    queryFn: async () => {
      if (!employee?.id) return [];
      const res = await assetsApi.getMyAssets(employee.id);
      const list = Array.isArray(res) ? res : res?.data || [];
      return list.map(a => ({
        ...a,
        id: a._id || a.id,
        asset_name: a.name || a.asset_name,
        asset_type: a.type || a.asset_type,
        serial_number: a.serialNumber || a.serial_number,
        status: a.status,
      }));
    },
    enabled: !!employee?.id,
    initialData: [],
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['my-expenses', employee?.id],
    queryFn: async () => {
      const res = await expensesApi.getMyExpenses();
      const list = Array.isArray(res) ? res : res?.data || [];
      return list.map(e => ({
        ...e,
        id: e._id || e.id,
        expense_type: e.category || e.type || e.expense_type || 'expense',
        amount: e.amount || 0,
        date: e.date || e.createdAt,
        description: e.description || '',
        status: e.status,
      }));
    },
    enabled: !!employee,
    initialData: [],
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['my-documents', employeeId],
    queryFn: async () => {
      if (!employeeId) return [];
      const res = await documentsApi.getMyDocuments();
      const raw = res?.data?.data || res?.data || res || [];
      const list = Array.isArray(raw) ? raw : [];
      return list.map(d => ({
        ...d,
        id: d._id || d.id,
        document_name: d.name,
        category: d.category,
        file_name: d.name + (d.fileType ? '.' + d.fileType : ''),
        file_url: d.fileUrl,
        fileUrl: d.fileUrl,
        fileType: d.fileType,
        currentVersion: d.currentVersion || 1,
        status: d.status,
        rejectionReason: d.rejectionReason,
        notes: d.notes,
      }));
    },
    enabled: !!employeeId,
    initialData: [],
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const payload = {
        phone: data.phone,
        privateEmail: data.privateEmail,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        maritalStatus: data.maritalStatus,
        nationality: data.nationality,
        nationalId: data.nationalId,
        passportNumber: data.passportNumber,
      };
      return employeesApi.updateEmployee(id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee', employeeId] });
      setIsEditing(false);
      toast.success("Profile updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update profile: " + error.message);
      console.error(error);
    },
  });

  const submitProfileMutation = useMutation({
    mutationFn: async () => {
      return employeesApi.submitForReview(employeeId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee', employeeId] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['pending-approvals-counts'] });
      queryClient.invalidateQueries({ queryKey: ['pending-counts'] });
      toast.success("Profile submitted for review successfully! Awaiting CEO / HR approval.");
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error, "Failed to submit profile: " + error.message));
      console.error(error);
    },
  });

  console.log({ employee })

  const isDraft = employee?.employment_status === 'DRAFT' || employee?.employmentStatus === 'DRAFT';
  const isPendingApproval = employee?.employment_status === 'PENDING_APPROVAL' || employee?.employmentStatus === 'PENDING_APPROVAL';

  const handleSubmitForReview = async () => {
    const dataToCheck = isEditing ? editData : (employee || {});
    const missing = [];
    if (!dataToCheck.phone?.trim()) missing.push("Phone");
    if (!dataToCheck.privateEmail?.trim()) missing.push("Private Email");
    if (!dataToCheck.dateOfBirth) missing.push("Date of Birth");
    if (!dataToCheck.gender) missing.push("Gender");
    if (!dataToCheck.maritalStatus) missing.push("Marital Status");
    if (!dataToCheck.nationality) missing.push("Nationality");
    if (!dataToCheck.nationalId?.trim() && !dataToCheck.passportNumber?.trim()) {
      missing.push("National ID or Passport Number");
    }

    if (missing.length > 0) {
      toast.error(`Please complete the following required fields before submitting: ${missing.join(', ')}`);
      if (!isEditing) setIsEditing(true);
      return;
    }

    try {
      if (isEditing) {
        const payload = {
          phone: editData.phone,
          privateEmail: editData.privateEmail,
          dateOfBirth: editData.dateOfBirth,
          gender: editData.gender,
          maritalStatus: editData.maritalStatus,
          nationality: editData.nationality,
          nationalId: editData.nationalId,
          passportNumber: editData.passportNumber,
        };
        await employeesApi.updateEmployee(employee.id, payload);
      }
      await submitProfileMutation.mutateAsync();
      setIsEditing(false);
    } catch (err) {
      console.error("Submit for review error:", err);
    }
  };

  const uploadDocumentMutation = useMutation({
    mutationFn: async (input) => {
      return documentsApi.uploadDocument({
        employeeId: input.employeeId,
        name: input.name,
        category: input.category,
        fileUrl: input.fileUrl,
        fileType: input.fileType,
        visibilityLevel: input.visibilityLevel?.toLowerCase() || 'employee',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-documents', employeeId] });
      setIsUploadOpen(false);
      setUploadData({ name: '', category: 'General', file: null });
      toast.success("Document uploaded successfully");
    },
    onError: (error) => {
      toast.error("Failed to upload document: " + error.message);
      console.error(error);
    },
  });

  const fulfillDocMutation = useMutation({
    mutationFn: async ({ docId, fileUrl, fileType, fileSize }) => {
      return documentsApi.replaceDocumentVersion(docId, {
        fileUrl,
        fileType,
        fileSize,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-documents', employeeId] });
      setUploadingDocId(null);
      toast.success("Document submitted successfully and sent for HR review!");
    },
    onError: (err) => {
      setUploadingDocId(null);
      toast.error(err.message || "Failed to submit document");
    },
  });

  const handleFulfillDocument = async (doc, file) => {
    const docId = doc._id || doc.id;
    setUploadingDocId(docId);
    try {
      const result = await uploadToCloudinary(file);
      await fulfillDocMutation.mutateAsync({
        docId,
        fileUrl: result.secure_url,
        fileType: result.format || file.name.split('.').pop() || 'PDF',
        fileSize: result.bytes || file.size || 0,
      });
    } catch (err) {
      setUploadingDocId(null);
      toast.error("Upload failed: " + (err.message || "Unknown error"));
    }
  };

  const handleSave = () => {
    updateEmployeeMutation.mutate({ id: employee.id, data: editData });
  };

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleDownloadPayslip = async (payroll) => {
    try {
      setIsGeneratingPdf(true);
      const blob = await payrollApi.downloadPayslipPdf(payroll.id);
      const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `Payslip_${payroll.month || payroll.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Payslip downloaded successfully");
    } catch (error) {
      toast.error("Failed to download PDF payslip: " + error.message);
      console.error(error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (isLoadingAuth || (isLoadingEmployee && employeeId)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50/50 p-4">
        <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-slate-200 max-w-md w-full">
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">No Employee Profile Found</h3>
          <p className="text-slate-500 text-sm mb-6">
            Your account is not associated with an active employee record, or the profile could not be loaded.
          </p>
          <Button onClick={() => navigate(PAGE_ROUTES.HOME)} className="w-full">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const thisMonthAttendance = attendance.filter(a => {
    const d = new Date(a.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  const rawStatusHistory = employee?.status_history || employee?.statusHistory || [];
  const sortedStatusHistory = Array.isArray(rawStatusHistory)
    ? [...rawStatusHistory].sort((a, b) => {
        const dateB = new Date(Number(b.createdAt || b.date) || b.createdAt || b.date || 0);
        const dateA = new Date(Number(a.createdAt || a.date) || a.createdAt || a.date || 0);
        return dateB - dateA;
      })
    : [];
  const rejectionRecord = sortedStatusHistory.find(h =>
    (h.previousStatus === 'PENDING_APPROVAL' || h.from === 'PENDING_APPROVAL') &&
    (h.newStatus === 'DRAFT' || h.to === 'DRAFT')
  );
  const hasBeenRejected = !!rejectionRecord;

  return (
    <>
      {!hideBanner && pendingTasksCount > 0 && (
        <>
          <div className="absolute top-0 left-0 right-0 bg-[#F4F5F7] border-b border-[#DFE1E6] py-5 px-4 md:px-8 flex flex-col xl:flex-row items-center justify-between text-base text-[#172B4D] shadow-sm z-50 rounded-none">
            <div className="flex-1 mb-3 xl:mb-0 pr-4 font-medium">
              You have {pendingTasksCount} pending onboarding {pendingTasksCount === 1 ? 'task' : 'tasks'} to complete. Review your assigned tasks to ensure your profile and onboarding are fully set up.
              <span className="text-[#0052CC] hover:underline cursor-pointer ml-2" onClick={() => navigate(PAGE_ROUTES.TASK_MANAGER)}>View task list</span>
            </div>
            <div className="flex items-center gap-2 whitespace-nowrap font-medium text-sm">
              <button className="px-4 py-2 rounded text-[#5E6C84] hover:text-[#172B4D] hover:bg-slate-200/50 transition-colors" onClick={handleRemindLater}>
                Remind me later
              </button>
              <button className="px-4 py-2 rounded border border-[#DFE1E6] text-[#172B4D] hover:bg-slate-200/50 transition-colors bg-transparent" onClick={() => navigate(PAGE_ROUTES.TASK_MANAGER)}>
                Only view tasks
              </button>
              <button 
                className="px-4 py-2 rounded bg-white border border-[#DFE1E6] text-[#172B4D] hover:bg-slate-100 transition-colors shadow-sm disabled:opacity-50" 
                onClick={handleCompleteAll}
                disabled={completeAllMutation.isPending}
              >
                {completeAllMutation.isPending ? "Completing..." : "Accept & Complete all"}
              </button>
            </div>
          </div>
          <div className="h-28 xl:h-20 w-full" />
        </>
      )}
      <div className="-m-4 md:-m-8 min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-8 md:p-12 border-0 rounded-none">
        <motion.div 
        className="max-w-7xl mx-auto space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants}>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md rounded-full shadow-sm mb-4 border border-slate-200/60">
            <User className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-medium text-slate-700">Employee Self-Service</span>
          </div>
          
          <p className="text-lg text-slate-600">
            Manage your profile, view documents, and track your information
          </p>
        </motion.div>

          {isDraft && (
          <motion.div 
            variants={itemVariants} 
              className="bg-yellow-50/90 backdrop-blur-md border border-yellow-200/80 text-yellow-900 rounded-2xl p-5 mb-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
          >
              <div>
                <h3 className="font-semibold text-lg flex items-center gap-2 text-yellow-900">
                  <span className="w-2.5 h-2.5 bg-yellow-500 rounded-full inline-block animate-pulse"></span>
                  {hasBeenRejected ? "Action Required: Profile Revisions Requested" : "Action Required: Complete & Submit Profile"}
                </h3>
                {hasBeenRejected && (
                  <div className="mt-2.5 p-3 bg-white/80 rounded-xl border border-yellow-200">
                    <p className="text-xs font-semibold uppercase tracking-wider text-yellow-900 mb-0.5">Feedback / Rejection Reason:</p>
                    <p className="text-sm text-yellow-800">{rejectionRecord.reason || "Please review and update your information."}</p>
                  </div>
                )}
                <p className="mt-2 text-sm text-yellow-700">
                  Please complete your personal details below and submit your profile for review so the CEO / HR Admin can approve and activate your account.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  className="bg-yellow-600 hover:bg-yellow-700 text-white font-medium shadow-sm"
                  onClick={handleSubmitForReview}
                  disabled={submitProfileMutation.isPending}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {submitProfileMutation.isPending ? "Submitting..." : "Submit for Review"}
                </Button>
              </div>
          </motion.div>
        )}

          {isPendingApproval && (
            <motion.div variants={itemVariants} className="bg-blue-50/90 backdrop-blur-md border border-blue-200/80 text-blue-900 rounded-2xl p-5 mb-6 shadow-sm">
              <h3 className="font-semibold text-lg flex items-center gap-2 text-blue-950">
                <span className="w-2.5 h-2.5 bg-blue-500 rounded-full inline-block animate-pulse"></span>
                Profile Submitted & In Review
            </h3>
              <p className="mt-1 text-sm text-blue-800">
                Your profile details have been submitted and are currently awaiting CEO / HR Admin approval. Once approved, your account will be fully activated.
            </p>
          </motion.div>
        )}

        {(pendingTasksCount > 0 || ['PENDING_ONBOARDING', 'ONGOING_ONBOARDING', 'DRAFT'].includes(employee?.employment_status)) && myTasks.length > 0 && (
          <motion.div 
            variants={itemVariants} 
            className="bg-indigo-50/80 backdrop-blur-md border border-indigo-200/60 text-indigo-800 rounded-2xl p-5 mb-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
          >
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2 text-indigo-950">
                <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full inline-block animate-pulse"></span>
                Action Required: Onboarding Tasks ({pendingTasksCount} pending)
              </h3>
              <p className="mt-1 text-sm text-indigo-700">
                You have {pendingTasksCount} onboarding {pendingTasksCount === 1 ? 'task' : 'tasks'} assigned to you. Review and complete them to finalize your account setup.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button 
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm"
                onClick={() => setActiveTab('onboarding')}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                View Tasks Checklist
              </Button>
            </div>
          </motion.div>
        )}

        {/* Quick Stats */}
        <motion.div variants={itemVariants} className="grid md:grid-cols-4 gap-6">
          <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
            <Card 
              className="border-slate-200/60 bg-white/70 backdrop-blur-md shadow-sm rounded-2xl overflow-hidden cursor-pointer hover:border-indigo-300 transition-colors"
              onClick={() => navigate(PAGE_ROUTES.LEAVE_MANAGEMENT)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 bg-indigo-100/50 rounded-xl flex items-center justify-center border border-indigo-200/50">
                    <Calendar className="w-6 h-6 text-indigo-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-slate-900 mt-4">
                  {annualLeaveRemaining}
                </p>
                <p className="text-sm text-slate-600 font-medium mt-1">Leave Days Remaining</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
            <Card className="border-slate-200/60 bg-white/70 backdrop-blur-md shadow-sm rounded-2xl overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 bg-emerald-100/50 rounded-xl flex items-center justify-center border border-emerald-200/50">
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-slate-900 mt-4">
                  {thisMonthAttendance.filter(a => a.status === 'present').length}
                </p>
                <p className="text-sm text-slate-600 font-medium mt-1">Days Present This Month</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
            <Card className="border-slate-200/60 bg-white/70 backdrop-blur-md shadow-sm rounded-2xl overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 bg-blue-100/50 rounded-xl flex items-center justify-center border border-blue-200/50">
                    <Laptop className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-slate-900 mt-4">{assets.length}</p>
                <p className="text-sm text-slate-600 font-medium mt-1">Assigned Assets</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
            <Card className="border-slate-200/60 bg-white/70 backdrop-blur-md shadow-sm rounded-2xl overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 bg-amber-100/50 rounded-xl flex items-center justify-center border border-amber-200/50">
                    <Receipt className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-slate-900 mt-4">
                  {expenses.filter(e => e.status === 'pending').length}
                </p>
                <p className="text-sm text-slate-600 font-medium mt-1">Pending Expenses</p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Main Content Tabs */}
        <motion.div variants={itemVariants}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-white/70 backdrop-blur-md border border-slate-200/60 p-1 rounded-2xl">
            <TabsTrigger value="profile">
              <User className="w-4 h-4 mr-2" />
              My Profile
            </TabsTrigger>
            <TabsTrigger value="onboarding">
              <CheckCircle className="w-4 h-4 mr-2" />
              Onboarding & Tasks {pendingTasksCount > 0 ? `(${pendingTasksCount})` : ''}
            </TabsTrigger>
            <TabsTrigger value="payslips">
              <DollarSign className="w-4 h-4 mr-2" />
              Payslips
            </TabsTrigger>
            <TabsTrigger value="leave">
              <Plane className="w-4 h-4 mr-2" />
              Leave
            </TabsTrigger>
            <TabsTrigger value="attendance">
              <Clock className="w-4 h-4 mr-2" />
              Attendance
            </TabsTrigger>
            <TabsTrigger value="assets">
              <Laptop className="w-4 h-4 mr-2" />
              Assets
            </TabsTrigger>
            <TabsTrigger value="expenses">
              <Receipt className="w-4 h-4 mr-2" />
              Expenses
            </TabsTrigger>
            <TabsTrigger value="documents" className="rounded-full data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Documents</TabsTrigger>
            <TabsTrigger value="job-history" className="rounded-full data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Job History</TabsTrigger>
          </TabsList>

          {/* Onboarding & Tasks Tab */}
          <TabsContent value="onboarding">
            <Card className="border-slate-200/60 bg-white/70 backdrop-blur-md shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-slate-200/60 pb-5">
                <div className="flex flex-wrap justify-between items-center gap-4">
                  <div>
                    <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-indigo-600" />
                      My Onboarding Checklist & Tasks
                    </CardTitle>
                    <p className="text-sm text-slate-500 mt-1">
                      {myTasks.length - pendingTasksCount} of {myTasks.length} onboarding tasks completed
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {pendingTasksCount > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCompleteAll}
                        disabled={completeAllMutation.isPending}
                        className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-medium"
                      >
                        {completeAllMutation.isPending ? "Completing..." : "Complete all tasks"}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={() => navigate(PAGE_ROUTES.TASK_MANAGER)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
                    >
                      Open Task Manager
                    </Button>
                  </div>
                </div>
                {myTasks.length > 0 && (
                  <div className="mt-5 space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
                      <span>Overall Onboarding Completion</span>
                      <span className="text-indigo-600 font-bold">{Math.round(((myTasks.length - pendingTasksCount) / myTasks.length) * 100)}%</span>
                    </div>
                    <Progress 
                      value={Math.round(((myTasks.length - pendingTasksCount) / myTasks.length) * 100)} 
                      className="h-2.5 bg-slate-100" 
                    />
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-6">
                {myTasks.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h4 className="text-lg font-medium text-slate-700">No onboarding tasks assigned</h4>
                    <p className="text-sm text-slate-500 mt-1">All onboarding checklist items have been cleared or verified.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myTasks.map((t) => {
                      const isCompleted = Boolean(t.isCompleted || t.status === 'completed' || t.status === 'DONE' || t.status === 'approved');
                      return (
                        <div
                          key={t.id}
                          className={`p-4 rounded-xl border transition-all ${
                            isCompleted 
                              ? 'bg-slate-50/70 border-slate-200/80 opacity-80' 
                              : 'bg-white border-slate-200 shadow-sm hover:border-indigo-300'
                          }`}
                        >
                          <div className="flex items-start gap-3.5">
                            <Checkbox
                              checked={isCompleted}
                              onCheckedChange={() => toggleTaskMutation.mutate({ taskId: t.id, isCompleted })}
                              className="mt-1"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <h4 className={`font-semibold text-base ${isCompleted ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                                  {t.title}
                                </h4>
                                {t.category && (
                                  <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 text-xs">
                                    {t.category}
                                  </Badge>
                                )}
                                {isCompleted ? (
                                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs font-semibold">
                                    {t.status === 'approved' ? 'Verified & Approved' : 'Completed'}
                                  </Badge>
                                ) : (
                                  <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs font-semibold">
                                    Pending
                                  </Badge>
                                )}
                              </div>
                              {t.description && (
                                <p className="text-sm text-slate-600 mb-2 leading-relaxed">{t.description}</p>
                              )}
                              {t.dueDate && (
                                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Due by: {format(new Date(t.dueDate), 'MMM d, yyyy')}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card className="border-slate-200/60 bg-white/70 backdrop-blur-md shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-slate-200">
                    <div className="flex flex-wrap justify-between items-center gap-3">
                      <div className="flex items-center gap-2">
                        <CardTitle>Personal Information</CardTitle>
                        {isDraft && (
                          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                            Draft Profile
                          </Badge>
                        )}
                        {isPendingApproval && (
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                            Pending Approval
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {isEditing ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditData(employee);
                                setIsEditing(false);
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              isLoading={updateEmployeeMutation.isPending}
                              onClick={handleSave}
                            >
                              <Save className="w-4 h-4 mr-1.5" />
                              Save Draft
                            </Button>
                            {isDraft && (
                              <Button
                                size="sm"
                                className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                                isLoading={submitProfileMutation.isPending}
                                onClick={handleSubmitForReview}
                              >
                                <Send className="w-4 h-4 mr-1.5" />
                                Submit for Review
                              </Button>
                            )}
                      </>
                    ) : (
                      <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsEditing(true)}
                              >
                                <Edit className="w-4 h-4 mr-1.5" />
                                Edit Profile
                              </Button>
                              {isDraft && (
                                <Button
                                  size="sm"
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                                  isLoading={submitProfileMutation.isPending}
                                  onClick={handleSubmitForReview}
                                >
                                  <Send className="w-4 h-4 mr-1.5" />
                                  Submit for Review
                                </Button>
                              )}
                      </>
                    )}
                      </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input value={employee.full_name} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={employee.email} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone {employee.employment_status === 'DRAFT' && <span className="text-red-500">*</span>}</Label>
                    <Input
                      value={isEditing ? (editData.phone || '') : (employee.phone || '')}
                      onChange={(e) => setEditData(prev => ({ ...prev, phone: e.target.value }))}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Job Title</Label>
                    <Input value={employee.job_title} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Input value={employee.department_id || 'Not assigned'} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input value={employee.start_date ? format(isNaN(Number(employee.start_date)) ? new Date(employee.start_date) : new Date(Number(employee.start_date)), 'MMM dd, yyyy') : ''} disabled />
                  </div>
                  {!isEditing && (
                    <>
                      <div className="space-y-2">
                        <Label>Private Email {employee.employment_status === 'DRAFT' && <span className="text-red-500">*</span>}</Label>
                        <Input value={employee.privateEmail || 'Not provided'} disabled />
                      </div>
                      <div className="space-y-2">
                        <Label>Date of Birth {employee.employment_status === 'DRAFT' && <span className="text-red-500">*</span>}</Label>
                        <Input value={employee.dateOfBirth ? format(isNaN(Number(employee.dateOfBirth)) ? new Date(employee.dateOfBirth) : new Date(Number(employee.dateOfBirth)), 'MMM dd, yyyy') : 'Not provided'} disabled />
                      </div>
                      <div className="space-y-2">
                        <Label>Gender {employee.employment_status === 'DRAFT' && <span className="text-red-500">*</span>}</Label>
                        <Input value={employee.gender || 'Not provided'} disabled />
                      </div>
                      <div className="space-y-2">
                        <Label>Marital Status {employee.employment_status === 'DRAFT' && <span className="text-red-500">*</span>}</Label>
                        <Input value={employee.maritalStatus || 'Not provided'} disabled />
                      </div>
                      <div className="space-y-2">
                        <Label>Nationality {employee.employment_status === 'DRAFT' && <span className="text-red-500">*</span>}</Label>
                        <Input value={employee.nationality || 'Not provided'} disabled />
                      </div>
                      <div className="space-y-2">
                        <Label>National ID Number {employee.employment_status === 'DRAFT' && <span className="text-red-500">*</span>}</Label>
                        <Input value={employee.nationalId || 'Not provided'} disabled />
                      </div>
                      <div className="space-y-2">
                        <Label>Passport Number {employee.employment_status === 'DRAFT' && <span className="text-red-500">*</span>}</Label>
                        <Input value={employee.passportNumber || 'Not provided'} disabled />
                      </div>
                    </>
                  )}
                  {isEditing && (
                    <>
                      <div className="space-y-2">
                        <Label>Private Email {employee.employment_status === 'DRAFT' && <span className="text-red-500">*</span>}</Label>
                        <Input
                          type="email"
                          value={editData.privateEmail || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, privateEmail: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Date of Birth {employee.employment_status === 'DRAFT' && <span className="text-red-500">*</span>}</Label>
                        <Input
                          type="date"
                          value={editData.dateOfBirth ? (isNaN(Number(editData.dateOfBirth)) ? new Date(editData.dateOfBirth) : new Date(Number(editData.dateOfBirth))).toISOString().split('T')[0] : ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Gender {employee.employment_status === 'DRAFT' && <span className="text-red-500">*</span>}</Label>
                        <select
                          className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
                          value={editData.gender || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, gender: e.target.value }))}
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Marital Status {employee.employment_status === 'DRAFT' && <span className="text-red-500">*</span>}</Label>
                        <select
                          className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
                          value={editData.maritalStatus || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, maritalStatus: e.target.value }))}
                        >
                          <option value="">Select Status</option>
                          <option value="Single">Single</option>
                          <option value="Married">Married</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Nationality {employee.employment_status === 'DRAFT' && <span className="text-red-500">*</span>}</Label>
                        <select
                          className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
                          value={editData.nationality || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, nationality: e.target.value }))}
                        >
                          <option value="">Select Nationality</option>
                          {countryList.getNames().map(country => (
                            <option key={country} value={country}>{country}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>National ID Number {employee.employment_status === 'DRAFT' && <span className="text-red-500">*</span>}</Label>
                        <Input
                          value={editData.nationalId || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, nationalId: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Passport Number {employee.employment_status === 'DRAFT' && <span className="text-red-500">*</span>}</Label>
                        <Input
                          value={editData.passportNumber || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, passportNumber: e.target.value }))}
                        />
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payslips Tab */}
          <TabsContent value="payslips">
            <Card className="border-slate-200/60 bg-white/70 backdrop-blur-md shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-slate-200">
                <CardTitle>My Payslips</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {payrolls.length === 0 ? (
                  <div className="text-center py-12">
                    <DollarSign className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                    <p className="text-slate-500">No payslips available</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {payrolls.map(payroll => (
                      <div key={payroll.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {format(new Date(payroll.month + '-01'), 'MMMM yyyy')}
                          </p>
                          <p className="text-sm text-slate-600">
                            Net Salary: {payroll.net_salary.toLocaleString()} SAR
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Badge className={
                            payroll.status === 'paid' ? 'bg-green-100 text-green-700' :
                            payroll.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                            'bg-yellow-100 text-yellow-700'
                          }>
                            {payroll.status}
                          </Badge>
                          <Button size="sm" variant="outline" disabled={isGeneratingPdf} onClick={() => handleDownloadPayslip(payroll)}>
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leave Tab */}
          <TabsContent value="leave">
            <div className="grid md:grid-cols-2 gap-6">
              <Card 
                className="border-slate-200/60 bg-white/70 backdrop-blur-md shadow-sm rounded-2xl overflow-hidden cursor-pointer hover:border-indigo-300 transition-colors"
                onClick={() => navigate(PAGE_ROUTES.LEAVE_MANAGEMENT)}
              >
                <CardHeader className="border-b border-slate-200">
                  <CardTitle>Leave Balance</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-slate-600">Annual Leave</p>
                      <p className="text-3xl font-bold text-blue-700">
                        {annualLeaveRemaining}
                      </p>
                      <p className="text-xs text-slate-500">
                        {annualLeaveUsed} used of {annualLeaveTotal}
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-slate-600">Sick Leave</p>
                      <p className="text-3xl font-bold text-green-700">
                        {sickLeaveRemaining}
                      </p>
                      <p className="text-xs text-slate-500">
                        {sickLeaveUsed} used of {sickLeaveTotal}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="border-slate-200/60 bg-white/70 backdrop-blur-md shadow-sm rounded-2xl overflow-hidden cursor-pointer hover:border-indigo-300 transition-colors"
                onClick={() => navigate(PAGE_ROUTES.LEAVE_MANAGEMENT)}
              >
                <CardHeader className="border-b border-slate-200">
                  <CardTitle>Leave History</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {leaveRequests.length === 0 ? (
                    <div className="text-center py-8">
                      <Plane className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                      <p className="text-slate-500">No leave requests</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {leaveRequests.slice(0, 5).map(leave => (
                        <div key={leave.id} className="p-3 bg-slate-50 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-slate-900">{leave.leave_type.replace('_', ' ')}</p>
                              <p className="text-xs text-slate-500">
                                {format(new Date(leave.start_date), 'MMM d')} - {format(new Date(leave.end_date), 'MMM d')}
                              </p>
                            </div>
                            <Badge className={
                              leave.status === 'approved' ? 'bg-green-100 text-green-700' :
                              leave.status === 'rejected' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }>
                              {leave.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Attendance Tab */}
          <TabsContent value="attendance">
            <Card className="border-slate-200/60 bg-white/70 backdrop-blur-md shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-slate-200">
                <CardTitle>My Attendance - {format(new Date(), 'MMMM yyyy')}</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 bg-green-50 rounded-lg text-center">
                    <p className="text-3xl font-bold text-green-700">
                      {thisMonthAttendance.filter(a => a.status === 'present').length}
                    </p>
                    <p className="text-sm text-slate-600">Present</p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg text-center">
                    <p className="text-3xl font-bold text-red-700">
                      {thisMonthAttendance.filter(a => a.status === 'absent').length}
                    </p>
                    <p className="text-sm text-slate-600">Absent</p>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg text-center">
                    <p className="text-3xl font-bold text-yellow-700">
                      {thisMonthAttendance.filter(a => a.status === 'late').length}
                    </p>
                    <p className="text-sm text-slate-600">Late</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg text-center">
                    <p className="text-3xl font-bold text-blue-700">
                      {thisMonthAttendance.filter(a => a.status === 'leave').length}
                    </p>
                    <p className="text-sm text-slate-600">On Leave</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Assets Tab */}
          <TabsContent value="assets">
            <Card className="border-slate-200/60 bg-white/70 backdrop-blur-md shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-slate-200">
                <CardTitle>Assigned Assets</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {assets.length === 0 ? (
                  <div className="text-center py-12">
                    <Laptop className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                    <p className="text-slate-500">No assets assigned</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {assets.map(asset => (
                      <div key={asset.id} className="p-4 bg-slate-50 rounded-lg">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Laptop className="w-6 h-6 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-slate-900">{asset.asset_name}</p>
                            <p className="text-sm text-slate-600 capitalize">{asset.asset_type}</p>
                            {asset.serial_number && (
                              <p className="text-xs text-slate-500">S/N: {asset.serial_number}</p>
                            )}
                            <Badge className="mt-2">{asset.status}</Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Expenses Tab */}
          <TabsContent value="expenses">
            <Card className="border-slate-200/60 bg-white/70 backdrop-blur-md shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-slate-200">
                <CardTitle>My Expense Claims</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {expenses.length === 0 ? (
                  <div className="text-center py-12">
                    <Receipt className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                    <p className="text-slate-500">No expense claims</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {expenses.map(expense => (
                      <div key={expense.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-semibold text-slate-900 capitalize">{expense.expense_type.replace('_', ' ')}</p>
                          <p className="text-sm text-slate-600">
                            {format(new Date(expense.date), 'MMM dd, yyyy')} • {expense.amount} SAR
                          </p>
                          <p className="text-xs text-slate-500">{expense.description}</p>
                        </div>
                        <Badge className={
                          expense.status === 'approved' ? 'bg-green-100 text-green-700' :
                          expense.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          expense.status === 'reimbursed' ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                        }>
                          {expense.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <Card className="border-slate-200/60 bg-white/70 backdrop-blur-md shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-slate-200 flex flex-row items-center justify-between">
                <CardTitle>My Documents</CardTitle>
                <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Document
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Upload Document</DialogTitle>
                      <DialogDescription className="sr-only">Upload a document to your profile</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Document Name</Label>
                        <Input 
                          placeholder="e.g. Passport, Resume, Degree"
                          value={uploadData.name}
                          onChange={(e) => setUploadData(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <select
                          className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950"
                          value={uploadData.category}
                          onChange={(e) => setUploadData(prev => ({ ...prev, category: e.target.value }))}
                        >
                          <option value="Employment Contract">Employment Contract</option>
                          <option value="Offer Letter">Offer Letter</option>
                          <option value="Government ID">Government ID</option>
                          <option value="Passport Photograph">Passport Photograph</option>
                          <option value="Tax Forms">Tax Forms</option>
                          <option value="Bank Details">Bank Details</option>
                          <option value="Educational Certificates">Educational Certificates</option>
                          <option value="Certificates & Qualifications">Certificates & Qualifications</option>
                          <option value="Compliance Forms">Compliance Forms</option>
                          <option value="Guarantor Documents">Guarantor Documents</option>
                          <option value="Payroll Support Documents">Payroll Support Documents</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>File</Label>
                        <Input 
                          type="file"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              setUploadData(prev => ({ ...prev, file: e.target.files[0] }));
                            }
                          }}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsUploadOpen(false)}>Cancel</Button>
                      <Button 
                        disabled={!uploadData.name || !uploadData.file || isUploadingToCloudinary || uploadDocumentMutation.isPending}
                        onClick={async () => {
                          try {
                            setIsUploadingToCloudinary(true);
                            const result = await uploadToCloudinary(uploadData.file);
                            
                            uploadDocumentMutation.mutate({
                              employeeId,
                              name: uploadData.name,
                              category: uploadData.category || 'Other',
                              fileUrl: result.secure_url,
                              fileType: result.format || uploadData.file.name.split('.').pop() || 'pdf',
                              visibilityLevel: 'EMPLOYEE'
                            });
                          } catch (error) {
                            toast.error("Cloudinary upload failed: " + (error.message || "Upload error"));
                          } finally {
                            setIsUploadingToCloudinary(false);
                          }
                        }}
                      >
                        {(isUploadingToCloudinary || uploadDocumentMutation.isPending) ? "Uploading..." : "Upload Document"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {(() => {
                  const isPendingUpload = (d) => String(d.status).toLowerCase() === 'pending_upload' || (!d.fileUrl && !d.file_url);
                  const isRejected = (d) => String(d.status).toLowerCase() === 'rejected';

                  const requestedDocs = documents.filter(d => isPendingUpload(d));
                  const rejectedDocs = documents.filter(d => isRejected(d));
                  const uploadedDocs = documents.filter(d => !isPendingUpload(d) && !isRejected(d));

                  if (documents.length === 0) {
                    return (
                      <div className="text-center py-12">
                        <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                        <p className="text-slate-500 font-medium">No documents required or uploaded yet</p>
                        <p className="text-xs text-slate-400 mt-1">When HR requests documents from you, they will appear here.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-6">
                      {/* Section 1: Requested by HR (Awaiting Upload) */}
                      {requestedDocs.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-amber-500" />
                            <h3 className="font-semibold text-slate-800 text-sm uppercase tracking-wide">
                              Requested by HR — Action Required ({requestedDocs.length})
                            </h3>
                          </div>
                          <div className="grid md:grid-cols-2 gap-4">
                            {requestedDocs.map(doc => {
                              const docId = doc.id;
                              const isUploadingThis = uploadingDocId === docId;

                              return (
                                <div key={docId} className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl shadow-sm flex flex-col justify-between">
                                  <div>
                                    <div className="flex items-start justify-between">
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                                          <FileText className="w-5 h-5 text-amber-600" />
                                        </div>
                                        <div>
                                          <h4 className="font-semibold text-slate-900">{doc.document_name}</h4>
                                          <p className="text-xs text-slate-500">{doc.category || 'General'}</p>
                                        </div>
                                      </div>
                                      <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                                        Upload Needed
                                      </Badge>
                                    </div>
                                    {doc.notes && (
                                      <p className="text-xs text-slate-600 mt-2 p-2 bg-white/70 rounded border border-amber-100">
                                        <strong>HR Note:</strong> {doc.notes}
                                      </p>
                                    )}
                                  </div>
                                  <div className="mt-4 pt-3 border-t border-amber-200/60">
                                    <input
                                      type="file"
                                      id={`file-req-${docId}`}
                                      className="hidden"
                                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                      onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                          handleFulfillDocument(doc, e.target.files[0]);
                                        }
                                      }}
                                    />
                                    <Button
                                      size="sm"
                                      className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                                      onClick={() => document.getElementById(`file-req-${docId}`).click()}
                                      disabled={isUploadingThis}
                                    >
                                      {isUploadingThis ? (
                                        <>Uploading & Submitting...</>
                                      ) : (
                                        <>
                                          <Upload className="w-4 h-4 mr-2" />
                                          Submit Requested Document
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Section 2: Revisions Needed */}
                      {rejectedDocs.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-rose-500" />
                            <h3 className="font-semibold text-slate-800 text-sm uppercase tracking-wide">
                              Revisions Needed ({rejectedDocs.length})
                            </h3>
                          </div>
                          <div className="grid md:grid-cols-2 gap-4">
                            {rejectedDocs.map(doc => {
                              const docId = doc.id;
                              const isUploadingThis = uploadingDocId === docId;

                              return (
                                <div key={docId} className="p-4 bg-rose-50/70 border border-rose-200 rounded-xl shadow-sm flex flex-col justify-between">
                                  <div>
                                    <div className="flex items-start justify-between">
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center">
                                          <FileText className="w-5 h-5 text-rose-600" />
                                        </div>
                                        <div>
                                          <h4 className="font-semibold text-slate-900">{doc.document_name}</h4>
                                          <p className="text-xs text-slate-500">{doc.category || 'General'}</p>
                                        </div>
                                      </div>
                                      <Badge variant="outline" className="bg-rose-100 text-rose-800 border-rose-300">
                                        Rejected
                                      </Badge>
                                    </div>
                                    {doc.rejectionReason && (
                                      <p className="text-xs text-rose-700 mt-2 p-2 bg-white/70 rounded border border-rose-200">
                                        <strong>Reason for Rejection:</strong> {doc.rejectionReason}
                                      </p>
                                    )}
                                  </div>
                                  <div className="mt-4 pt-3 border-t border-rose-200/60">
                                    <input
                                      type="file"
                                      id={`file-rej-${docId}`}
                                      className="hidden"
                                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                      onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                          handleFulfillDocument(doc, e.target.files[0]);
                                        }
                                      }}
                                    />
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="w-full border-rose-300 text-rose-700 hover:bg-rose-100"
                                      onClick={() => document.getElementById(`file-rej-${docId}`).click()}
                                      disabled={isUploadingThis}
                                    >
                                      {isUploadingThis ? "Uploading Revision..." : "Re-upload Corrected Document"}
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Section 3: Uploaded Documents */}
                      {uploadedDocs.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                            <h3 className="font-semibold text-slate-800 text-sm uppercase tracking-wide">
                              My Uploaded Documents ({uploadedDocs.length})
                            </h3>
                          </div>
                          <div className="space-y-3">
                            {uploadedDocs.map(doc => {
                              const docId = doc.id;
                              const isApproved = String(doc.status).toLowerCase() === 'approved';
                              const fileUrl = doc.file_url || doc.fileUrl;
                              const isUploadingThis = uploadingDocId === docId;

                              return (
                                <div key={docId} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200/70 rounded-xl hover:bg-slate-100/60 transition-colors">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isApproved ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                                      <FileText className="w-5 h-5" />
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <p className="font-medium text-slate-900">{doc.document_name}</p>
                                        <Badge variant="secondary" className="text-xs">v{doc.currentVersion || 1}</Badge>
                                      </div>
                                      <p className="text-xs text-slate-500">{doc.category || 'General'} • {doc.file_name || 'Document'}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge className={isApproved ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-blue-50 text-blue-700 border-blue-200"}>
                                      {isApproved ? 'Approved' : 'Under Review'}
                                    </Badge>
                                    {fileUrl && (
                                      <>
                                        <Button size="sm" variant="outline" asChild>
                                          <a href={fileUrl} target="_blank" rel="noopener noreferrer" title="Preview">
                                            <Eye className="w-4 h-4" />
                                          </a>
                                        </Button>
                                        <Button size="sm" variant="outline" asChild>
                                          <a href={fileUrl} download title="Download">
                                            <Download className="w-4 h-4" />
                                          </a>
                                        </Button>
                                      </>
                                    )}
                                    <input
                                      type="file"
                                      id={`replace-ver-${docId}`}
                                      className="hidden"
                                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                      onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                          handleFulfillDocument(doc, e.target.files[0]);
                                        }
                                      }}
                                    />
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-xs text-slate-600 hover:text-slate-900"
                                      onClick={() => document.getElementById(`replace-ver-${docId}`).click()}
                                      disabled={isUploadingThis}
                                      title="Upload a new version of this document"
                                    >
                                      <Upload className="w-3.5 h-3.5 mr-1" />
                                      {isUploadingThis ? "Uploading..." : "New Version"}
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Job History Tab */}
          <TabsContent value="job-history" className="mt-6">
            <Card className="border-none shadow-xl shadow-slate-200/40 rounded-2xl overflow-hidden bg-white/60 backdrop-blur-xl">
              <CardHeader className="border-b border-slate-100 bg-white/50 pb-6 pt-8 px-8">
                <CardTitle className="text-xl text-slate-800">Lifecycle & History</CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-12">
                <div className="space-y-4">
                  <h4 className="font-medium text-slate-800 text-lg">Promotion History</h4>
                  {employee?.promotion_history && employee.promotion_history.length > 0 ? (
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                          <tr>
                            <th className="px-6 py-4 font-medium">Date</th>
                            <th className="px-6 py-4 font-medium">Previous Role</th>
                            <th className="px-6 py-4 font-medium">New Role</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {employee.promotion_history.map(ph => (
                            <tr key={ph.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4 text-slate-600">{new Date(ph.createdAt).toLocaleDateString()}</td>
                              <td className="px-6 py-4 text-slate-600">
                                <div className="font-medium text-slate-800">{ph.previousTitle}</div>
                                <div className="text-xs text-slate-500 mt-1">{ph.previousGrade}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="font-medium text-indigo-700">{ph.newTitle}</div>
                                <div className="text-xs text-indigo-500/70 mt-1">{ph.newGrade}</div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-8 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 text-center text-slate-500">
                      <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p>No promotion history found.</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-slate-800 text-lg">Status History</h4>
                  {sortedStatusHistory && sortedStatusHistory.length > 0 ? (
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="px-6 py-4 font-medium text-slate-600">Date</th>
                            <th className="px-6 py-4 font-medium text-slate-600">Previous Status</th>
                            <th className="px-6 py-4 font-medium text-slate-600">New Status</th>
                            <th className="px-6 py-4 font-medium text-slate-600">Reason</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {sortedStatusHistory.map((sh, idx) => {
                            const rawDate = sh.createdAt || sh.date || sh.timestamp || sh.updatedAt;
                            const prevStatus = sh.previousStatus || sh.from || 'N/A';
                            const newStatus = sh.newStatus || sh.to || 'N/A';
                            return (
                              <tr key={sh.id || sh._id || `sh-${idx}`} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 text-slate-600 font-mono text-xs">{formatStatusDate(rawDate)}</td>
                                <td className="px-6 py-4 text-slate-600">
                                  {renderStatusHistoryBadge(prevStatus, false)}
                                </td>
                                <td className="px-6 py-4">
                                  {renderStatusHistoryBadge(newStatus, true)}
                                </td>
                                <td className="px-6 py-4 text-slate-600 text-xs">{sh.reason || 'N/A'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-8 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 text-center text-slate-500">
                      <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p>No status history found.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </motion.div>
        </motion.div>
      </div>
    </>
  );
}