import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLeaveTypes } from "@/hooks/useLeaveTypesQuery";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "sonner";
import { extractErrorMessage, getRefId } from "@/lib/utils";
import { uploadToCloudinary } from "@/utils/cloudinary";
import {
  employeesApi,
  payrollApi,
  leaveApi,
  attendanceApi,
  documentsApi,
  onboardingApi,
  assetsApi,
  expensesApi,
  notificationsApi,
} from "@/api";

// Banner-worthy notification types shown on the self-service dashboard - other types
// (e.g. document/leave notifications) aren't rendered as dashboard banners.
const BANNER_NOTIFICATION_TYPES = ["PROMOTION", "STATUS_CHANGE"];

const listFrom = (response) => (Array.isArray(response) ? response : response?.data || []);

export default function useEmployeeSelfService() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const employeeId = getRefId(user?.employeeId) || getRefId(user?.employee) || null;
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadData, setUploadData] = useState({ name: "", category: "General", file: null });
  const [isUploadingToCloudinary, setIsUploadingToCloudinary] = useState(false);
  const [uploadingDocId, setUploadingDocId] = useState(null);
  const [hideBanner, setHideBanner] = useState(
    () => sessionStorage.getItem("hideOnboardingBanner") === "true",
  );

  const { data: employee, isLoading: isLoadingEmployee } = useQuery({
    queryKey: ["employee", employeeId],
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
        manager_name: emp.managerId?.fullName || "",
        manager_job_title: emp.managerId?.jobTitle || "",
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
    if (employee) setEditData(employee);
  }, [employee]);

  const { data: payrolls = [] } = useQuery({
    queryKey: ["my-payrolls", employee?.id],
    queryFn: async () =>
      listFrom(await payrollApi.getMyPayslips()).map((r) => ({
        ...r,
        id: r._id || r.id,
        month: r.payrollRunId?.month || r.month || "N/A",
        status: r.payrollRunId?.status || r.status || "draft",
        basic_salary: r.basicSalary || 0,
        net_salary: r.netPay || 0,
        total_earnings: r.grossPay || 0,
      })),
    enabled: !!employee,
  });
  const { data: leaveRequests = [] } = useQuery({
    queryKey: ["my-leaves", employee?.id],
    queryFn: async () =>
      listFrom(await leaveApi.getMyRequests()).map((l) => ({
        ...l,
        id: l._id || l.id,
        leave_type: l.leaveTypeId?.name || l.leave_type || "Leave",
        start_date: l.startDate || l.start_date,
        end_date: l.endDate || l.end_date,
        status: l.status,
      })),
    enabled: !!employee,
    initialData: [],
  });
  const { data: leaveTypes = [] } = useLeaveTypes();
  const { data: leaveBalances = [] } = useQuery({
    queryKey: ["my-leave-balances", employee?.id],
    queryFn: async () => {
      if (!employee?.id) return [];
      const response = await leaveApi.getBalances(employee.id);
      const normalized = Array.isArray(response) ? response : response?.data || response;
      if (normalized && Array.isArray(normalized.balances))
        return normalized.balances.map((balance) => ({
          ...balance,
          id: balance._id || balance.id,
          leaveTypeId: balance.leaveTypeId?._id || balance.leaveTypeId || balance.leaveType || "",
          leaveType: balance.leaveTypeId?.name || balance.leaveType?.name || "Leave",
          totalEntitled: balance.allocated ?? balance.totalEntitled ?? 0,
          used: balance.used ?? 0,
          pending: balance.pending ?? 0,
          available: balance.remaining ?? balance.available ?? 0,
        }));
      return Array.isArray(normalized) ? normalized : [];
    },
    enabled: !!employee?.id,
    initialData: [],
  });
  const { data: attendance = [] } = useQuery({
    queryKey: ["my-attendance", employee?.id],
    queryFn: async () =>
      listFrom(await attendanceApi.getMyAttendance()).map((a) => ({
        ...a,
        id: a._id || a.id,
        date: a.date,
        status: a.status,
        check_in: a.clockIn,
        check_out: a.clockOut,
      })),
    enabled: !!employee,
    initialData: [],
  });
  const { data: myTasks = [] } = useQuery({
    queryKey: ["my-onboarding-tasks", employee?.id],
    queryFn: async () =>
      listFrom(await onboardingApi.getMyTasks()).map((t) => ({
        ...t,
        id: t._id || t.id,
        isCompleted:
          t.status === "completed" ||
          t.status === "DONE" ||
          t.status === "approved" ||
          !!t.isCompleted,
      })),
    enabled: true,
  });
  const { data: assets = [] } = useQuery({
    queryKey: ["my-assets", employee?.id],
    queryFn: async () =>
      listFrom(await assetsApi.getMyAssets(employee.id)).map((a) => ({
        ...a,
        id: a._id || a.id,
        asset_name: a.name || a.asset_name,
        asset_type: a.type || a.asset_type,
        serial_number: a.serialNumber || a.serial_number,
      })),
    enabled: !!employee?.id,
    initialData: [],
  });
  const { data: expenses = [] } = useQuery({
    queryKey: ["my-expenses", employee?.id],
    queryFn: async () =>
      listFrom(await expensesApi.getMyExpenses()).map((e) => ({
        ...e,
        id: e._id || e.id,
        expense_type: e.expenseType || e.category || e.type || e.expense_type || "expense",
        amount: e.amount || 0,
        currency: e.currency || "NGN",
        date: e.date || e.createdAt,
        description: e.description || "",
      })),
    enabled: !!employee,
    initialData: [],
  });
  const { data: documents = [] } = useQuery({
    queryKey: ["my-documents", employeeId],
    queryFn: async () => {
      const response = await documentsApi.getMyDocuments();
      const raw = response?.data?.data || response?.data || response || [];
      return (Array.isArray(raw) ? raw : []).map((d) => ({
        ...d,
        id: d._id || d.id,
        document_name: d.name,
        category: d.category,
        file_name: d.name + (d.fileType ? `.${d.fileType}` : ""),
        file_url: d.fileUrl,
        fileUrl: d.fileUrl,
        currentVersion: d.currentVersion || 1,
        rejectionReason: d.rejectionReason,
        notes: d.notes,
      }));
    },
    enabled: !!employeeId,
    initialData: [],
  });

  const { data: dashboardNotifications = [] } = useQuery({
    queryKey: ["my-dashboard-notifications", employeeId],
    queryFn: async () => {
      const res = await notificationsApi.getMy({ isRead: false, limit: 50 });
      const list = res?.data || (Array.isArray(res) ? res : []);
      return list
        .filter((n) => BANNER_NOTIFICATION_TYPES.includes(n.type))
        .map((n) => ({ ...n, id: n._id || n.id }));
    },
    enabled: !!employeeId,
    initialData: [],
  });

  const invalidate = (key) => queryClient.invalidateQueries({ queryKey: key });
  const markNotificationReadMutation = useMutation({
    mutationFn: (id) => notificationsApi.markOneRead(id),
    onSuccess: () => invalidate(["my-dashboard-notifications", employeeId]),
  });
  const toggleTaskMutation = useMutation({
    mutationFn: ({ taskId, isCompleted }) =>
      onboardingApi.updateTask(taskId, { status: isCompleted ? "not_started" : "completed" }),
    onSuccess: () => {
      invalidate(["my-onboarding-tasks"]);
      invalidate(["onboarding-tasks"]);
      toast.success("Task updated!");
    },
    onError: (error) => toast.error(error.message || "Failed to update task"),
  });
  const completeAllMutation = useMutation({
    mutationFn: async (ids) => {
      for (const id of ids) await onboardingApi.updateTask(id, { status: "completed" });
    },
    onSuccess: () => {
      invalidate(["my-onboarding-tasks", employee?.id]);
      invalidate(["onboarding-tasks"]);
      setHideBanner(true);
      toast.success("All tasks marked as completed!");
    },
    onError: (error) => toast.error(`Failed to complete tasks: ${error.message}`),
  });
  const updateEmployeeMutation = useMutation({
    mutationFn: ({ id, data }) =>
      employeesApi.updateEmployee(id, {
        phone: data.phone,
        privateEmail: data.privateEmail,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        maritalStatus: data.maritalStatus,
        nationality: data.nationality,
        nationalId: data.nationalId,
        passportNumber: data.passportNumber,
      }),
    onSuccess: () => {
      invalidate(["employee", employeeId]);
      setIsEditing(false);
      toast.success("Profile updated successfully");
    },
    onError: (error) => toast.error(`Failed to update profile: ${error.message}`),
  });
  const submitProfileMutation = useMutation({
    mutationFn: () => employeesApi.submitForReview(employeeId),
    onSuccess: () => {
      invalidate(["employee", employeeId]);
      invalidate(["employees"]);
      // Pending-counts badge (Layout.jsx) updates live via usePendingApprovalsStream (SSE) now.
      toast.success("Profile submitted for review successfully! Awaiting CEO / HR approval.");
    },
    onError: (error) =>
      toast.error(extractErrorMessage(error, `Failed to submit profile: ${error.message}`)),
  });
  const uploadDocumentMutation = useMutation({
    mutationFn: (input) =>
      documentsApi.uploadDocument({
        employeeId: input.employeeId,
        name: input.name,
        category: input.category,
        fileUrl: input.fileUrl,
        fileType: input.fileType,
        visibilityLevel: input.visibilityLevel?.toLowerCase() || "employee",
      }),
    onSuccess: () => {
      invalidate(["my-documents", employeeId]);
      setIsUploadOpen(false);
      setUploadData({ name: "", category: "General", file: null });
      toast.success("Document uploaded successfully");
    },
    onError: (error) => toast.error(`Failed to upload document: ${error.message}`),
  });
  const fulfillDocMutation = useMutation({
    mutationFn: ({ docId, fileUrl, fileType, fileSize }) =>
      documentsApi.replaceDocumentVersion(docId, { fileUrl, fileType, fileSize }),
    onSuccess: () => {
      invalidate(["my-documents", employeeId]);
      setUploadingDocId(null);
      toast.success("Document submitted successfully and sent for HR review!");
    },
    onError: (error) => {
      setUploadingDocId(null);
      toast.error(error.message || "Failed to submit document");
    },
  });

  const handleCompleteAll = () => {
    const ids = myTasks.filter((task) => !task.isCompleted).map((task) => task.id);
    if (ids.length) completeAllMutation.mutate(ids);
    else setHideBanner(true);
  };
  const handleRemindLater = () => {
    sessionStorage.setItem("hideOnboardingBanner", "true");
    setHideBanner(true);
  };
  const handleSave = () => updateEmployeeMutation.mutate({ id: employee.id, data: editData });
  const handleFulfillDocument = async (doc, file) => {
    const docId = doc._id || doc.id;
    setUploadingDocId(docId);
    try {
      const result = await uploadToCloudinary(file);
      await fulfillDocMutation.mutateAsync({
        docId,
        fileUrl: result.secure_url,
        fileType: result.format || file.name.split(".").pop() || "PDF",
        fileSize: result.bytes || file.size || 0,
      });
    } catch (error) {
      setUploadingDocId(null);
      toast.error(`Upload failed: ${error.message || "Unknown error"}`);
    }
  };
  return {
    employee,
    employeeId,
    isLoadingEmployee,
    payrolls,
    leaveRequests,
    leaveTypes,
    leaveBalances,
    attendance,
    myTasks,
    assets,
    expenses,
    documents,
    dashboardNotifications,
    markNotificationReadMutation,
    isEditing,
    setIsEditing,
    editData,
    setEditData,
    isUploadOpen,
    setIsUploadOpen,
    uploadData,
    setUploadData,
    isUploadingToCloudinary,
    setIsUploadingToCloudinary,
    uploadingDocId,
    pendingTasksCount: myTasks.filter((task) => !task.isCompleted).length,
    hideBanner,
    toggleTaskMutation,
    completeAllMutation,
    updateEmployeeMutation,
    submitProfileMutation,
    uploadDocumentMutation,
    handleCompleteAll,
    handleRemindLater,
    handleSave,
    handleFulfillDocument,
    uploadToCloudinary,
  };
}
