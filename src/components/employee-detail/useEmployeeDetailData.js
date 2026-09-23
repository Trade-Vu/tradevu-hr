import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  employeesApi,
  organizationsApi,
  documentsApi,
  leaveApi,
  attendanceApi,
  payrollApi,
} from "@/api";
import { useDepartments } from "@/hooks/useDepartmentsQuery";
import { useLeaveTypes } from "@/hooks/useLeaveTypesQuery";
import { normalizeEmployeeClasses } from "@/lib/formOptions";
import { useAuth } from "@/lib/AuthContext";
import { extractErrorMessage } from "@/lib/utils";
import {
  mapEmployeeData,
  parseSafeDate,
  format,
  isEmployeeEligibleForHrAdmin,
  getEmployeeDirtyPayload,
} from "./employeeDetailUtils";

export function useEmployeeDetailData(employeeId, employeeDetail) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: orgData } = useQuery({
    queryKey: ['organization', user?.organizationId],
    queryFn: async () => {
      if (!user?.organizationId) return null;
      const res = await organizationsApi.getMyOrganization();
      return res.data?.data || res.data || res;
    },
    enabled: Boolean(user?.organizationId)
  });
  const employeeClasses = normalizeEmployeeClasses(orgData?.employeeClasses);

  const { data: departmentsData } = useDepartments();
  const departments = departmentsData || [];

  const { data: employee, isLoading, isError, error } = useQuery({
    queryKey: ['employee', employeeId],
    queryFn: async () => {
      if (!employeeId) return null;
      const res = await employeesApi.getEmployeeById(employeeId);
      const raw = res.data?.data || res.data || res;
      if (!raw) throw new Error("Employee not found");
      return mapEmployeeData(raw);
    },
    initialData: employeeDetail ? mapEmployeeData(employeeDetail) : undefined,
    enabled: Boolean(employeeId)
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['all-employees'],
    queryFn: async () => {
      const list = await employeesApi.getAllEmployees();
      return list.map(emp => ({
        ...emp,
        id: emp._id || emp.id,
        full_name: emp.fullName || emp.full_name,
        job_title: emp.jobTitle || emp.job_title,
        employment_status: emp.employmentStatus || emp.employment_status,
        onboarding_status: emp.onboardingStatus || emp.onboarding_status,
        onboarding_progress: emp.onboardingProgress ?? emp.onboarding_progress ?? 0,
        isEligibleForHrAdmin: isEmployeeEligibleForHrAdmin(emp),
        isHrAdmin: Boolean(emp.isHrAdmin || emp.role === 'HR_ADMIN' || emp.systemRole === 'HR_ADMIN'),
      }));
    },
  });

  const { data: shifts = [] } = useQuery({ queryKey: ['shifts'], queryFn: async () => [], initialData: [] });

  const { data: assets = [] } = useQuery({
    queryKey: ['employee-assets', employeeId],
    queryFn: async () => {
      if (!employeeId) return [];
      const res = await assetsApi.getMyAssets(employeeId);
      const rawList = res.data?.data?.data || res.data?.data || res.data || [];
      return Array.isArray(rawList) ? rawList : [];
    },
    enabled: Boolean(employeeId),
    initialData: [],
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['employee-documents', employeeId],
    queryFn: async () => {
      if (!employeeId) return [];
      const res = await documentsApi.getDocuments({ employeeId, limit: 100 });
      const rawList = res.data?.data?.data || res.data?.data || res.data || [];
      return (Array.isArray(rawList) ? rawList : []).map(d => ({
        ...d,
        id: d._id || d.id,
        document_name: d.name,
        file_url: d.fileUrl,
        file_name: `${d.name}.${d.fileType || 'pdf'}`
      }));
    },
    enabled: Boolean(employeeId),
    initialData: [],
  });

  const { data: leaveTypes = [] } = useLeaveTypes();

  const { data: employeeLeaveBalances = [] } = useQuery({
    queryKey: ['employee-leave-balances', employeeId],
    queryFn: async () => {
      if (!employeeId) return [];
      const res = await leaveApi.getBalances(employeeId);
      const item = Array.isArray(res) ? res : res?.data || res;
      return (Array.isArray(item?.balances) ? item.balances : []).map(balance => ({
        leaveTypeId: balance.leaveTypeId?._id || balance.leaveTypeId || '',
        leaveType: balance.leaveTypeId?.name || 'Leave',
        total: balance.allocated ?? 0,
        used: balance.used ?? 0,
        remaining: balance.remaining ?? 0,
      }));
    },
    enabled: Boolean(employeeId),
    initialData: [],
  });

  const { data: leaveRequests = [] } = useQuery({
    queryKey: ['employee-leaves', employeeId],
    queryFn: async () => {
      if (!employeeId) return [];
      const res = await leaveApi.getAllRequests({ employeeId, limit: 100 });
      const rawList = res.data?.data?.data || res.data?.data || res.data || [];
      return (Array.isArray(rawList) ? rawList : []).map(l => ({
        ...l,
        id: l._id || l.id,
        start_date: l.startDate,
        end_date: l.endDate,
        leave_type: l.leaveTypeId?.name || l.leaveType || 'Leave'
      }));
    },
    enabled: Boolean(employeeId),
    initialData: [],
  });

  const { data: attendance = [] } = useQuery({
    queryKey: ['employee-attendance', employeeId],
    queryFn: async () => {
      if (!employeeId) return [];
      const res = await attendanceApi.getAllAttendance({ employeeId, limit: 100 });
      const rawList = res.data?.data?.data || res.data?.data || res.data || [];
      return (Array.isArray(rawList) ? rawList : []).map(a => ({
        ...a,
        id: a._id || a.id,
        date: parseSafeDate(a.date),
        check_in: a.clockIn ? format(a.clockIn, 'HH:mm') : '--:--',
        check_out: a.clockOut ? format(a.clockOut, 'HH:mm') : '--:--'
      }));
    },
    enabled: Boolean(employeeId),
    initialData: [],
  });

  const { data: evaluations = [] } = useQuery({
    queryKey: ['employee-evaluations', employeeId],
    queryFn: async () => [],
    enabled: Boolean(employeeId),
    initialData: [],
  });

  const { data: salaryHistory = [] } = useQuery({
    queryKey: ['salary-history', employeeId],
    queryFn: async () => {
      const res = await payrollApi.getSalaryHistory(employeeId);
      return Array.isArray(res) ? res : res?.data || [];
    },
    enabled: Boolean(employeeId),
    initialData: [],
  });

  // Mutations
  const updateEmployeeMutation = useMutation({
    mutationFn: async ({ id, data, original }) => {
      let input;
      if (original) {
        input = getEmployeeDirtyPayload(original, data);
      } else {
        input = {
          privateEmail: data.private_email || undefined,
          phone: data.phone || undefined,
          dateOfBirth: data.personal_info?.date_of_birth || undefined,
          gender: data.personal_info?.gender || undefined,
          maritalStatus: data.personal_info?.marital_status || undefined,
          nationality: data.personal_info?.nationality || undefined,
          nationalId: data.personal_info?.national_id || undefined,
          passportNumber: data.personal_info?.iqama_number || undefined,
          jobTitle: data.job_title || undefined,
          departmentId: data.department_id || data.departmentId || undefined,
          managerId: data.manager_id || data.managerId || undefined,
          employmentType: data.employment_type || undefined,
          employmentStatus: data.employment_status || undefined,
          reason: data.status_change_reason || undefined,
          hireDate: data.start_date || undefined,
          probationStartDate: data.probation_start_date || undefined,
          probationEndDate: data.probation_end_date || undefined,
          basicSalary: data.payroll_details?.basic_salary !== undefined ? Number(data.payroll_details.basic_salary) : undefined,
          bankName: data.payroll_details?.bank_name || undefined,
          iban: data.payroll_details?.iban || undefined,
          payGrade: data.payroll_details?.pay_grade || undefined,
          salaryChangeReason: data.payroll_details?.salary_change_reason || undefined,
          allowances: Array.isArray(data.allowances) ? data.allowances : undefined,
          employeeClass: data.employeeClass || undefined
        };
        Object.keys(input).forEach(k => input[k] === undefined && delete input[k]);
      }

      if (Object.keys(input).length === 0) {
        return { noChanges: true };
      }

      return await employeesApi.updateEmployee(id, input);
    },
    onSuccess: async (res) => {
      if (res?.noChanges) {
        toast.info("No changes were detected.");
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ['employee', employeeId] });
      await queryClient.invalidateQueries({ queryKey: ['all-employees'] });
      toast.success("Saved successfully");
    },
    onError: (err) => toast.error(extractErrorMessage(err, "Failed to save data."))
  });

  const requestCompensationUpdateMutation = useMutation({
    mutationFn: async (input) => {
      const legacyToType = { housing: 'housing', transport: 'transport', food: 'meal', other: 'other' };
      const allowances = Object.entries(legacyToType)
        .map(([formKey, type]) => ({ type, mode: 'fixed', value: parseFloat(input[formKey]) || 0, taxable: true }))
        .filter(a => a.value > 0);
      return await employeesApi.updateEmployee(employeeId, {
        basicSalary: parseFloat(input.basicSalary) || 0,
        allowances,
        salaryChangeReason: input.reason,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['employee', employeeId]);
      queryClient.invalidateQueries(['salary-history', employeeId]);
      toast.success("Compensation updated successfully.");
    },
    onError: (err) => toast.error(extractErrorMessage(err, "Failed to update compensation."))
  });

  const suspendEmployeeMutation = useMutation({
    mutationFn: ({ id }) => employeesApi.updateEmployee(id, { employmentStatus: 'SUSPENDED' }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries(['employee', vars.id]);
      toast.success("Employee suspended successfully.");
    },
    onError: (err) => toast.error(extractErrorMessage(err, "Failed to suspend employee."))
  });

  const requestPromotionMutation = useMutation({
    mutationFn: (input) => employeesApi.updateEmployee(employeeId, {
      jobTitle: input.newJobTitle || undefined,
      departmentId: input.newDepartmentId || undefined,
      employeeClass: input.newEmployeeClass || undefined,
      effectiveDate: input.effectiveDate || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['employee', employeeId]);
      toast.success("Promotion updated successfully.");
    },
    onError: (err) => toast.error(extractErrorMessage(err, "Failed to update promotion."))
  });

  const requestOffboardingMutation = useMutation({
    mutationFn: ({ id, data }) => {
      const statusMap = { RESIGNATION: 'RESIGNED', TERMINATION: 'TERMINATED', RETIREMENT: 'OFFBOARDED' };
      return employeesApi.updateEmployee(id, {
        employmentStatus: statusMap[data.exitType] || 'OFFBOARDED',
        endDate: data.exitDate ? new Date(data.exitDate).toISOString() : undefined,
      });
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries(['employee', vars.id]);
      toast.success("Offboarding processed successfully.");
    },
    onError: (err) => toast.error(extractErrorMessage(err, "Failed to process offboarding."))
  });

  const requestProbationMutation = useMutation({
    mutationFn: ({ data }) => employeesApi.updateEmployee(employeeId, {
      employmentStatus: 'PROBATION',
      probationStartDate: data.startDate || undefined,
      probationEndDate: data.endDate || undefined
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['employee', employeeId]);
      toast.success("Probation updated successfully.");
    },
    onError: (err) => toast.error(extractErrorMessage(err, "Failed to update probation."))
  });

  const reassignHrMutation = useMutation({
    mutationFn: (targetEmpId) => employeesApi.reassignHrAdmin(targetEmpId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['employee', employeeId] });
      queryClient.invalidateQueries({ queryKey: ['all-employees'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(res?.data?.message || res?.message || "HR Admin reassigned successfully");
    },
    onError: (err) => toast.error(extractErrorMessage(err, "Failed to reassign HR Admin"))
  });

  const createDocumentMutation = useMutation({
    mutationFn: (data) => documentsApi.uploadDocument({
      employeeId,
      name: data.document_name,
      category: data.category || 'General',
      fileUrl: data.file_url || '',
      fileType: data.file_type || 'PDF',
      fileSize: data.file_size || 0
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-documents', employeeId] });
      toast.success("Document uploaded successfully.");
    },
    onError: (err) => toast.error(extractErrorMessage(err, "Failed to upload document."))
  });

  const replaceDocumentVersionMutation = useMutation({
    mutationFn: ({ id, fileUrl, fileType, fileSize }) => documentsApi.replaceDocumentVersion(id, {
      fileUrl,
      fileType: fileType || 'PDF',
      fileSize: fileSize || 0
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-documents', employeeId] });
      toast.success("Document replaced successfully.");
    },
    onError: (err) => toast.error(extractErrorMessage(err, "Failed to replace document."))
  });

  const approveDocumentMutation = useMutation({
    mutationFn: (id) => documentsApi.approveDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-documents', employeeId] });
      toast.success("Document approved successfully.");
    },
    onError: (err) => toast.error(extractErrorMessage(err, "Failed to approve document."))
  });

  const rejectDocumentMutation = useMutation({
    mutationFn: ({ id, notes }) => documentsApi.rejectDocument(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-documents', employeeId] });
      toast.success("Document marked as rejected.");
    },
    onError: (err) => toast.error(extractErrorMessage(err, "Failed to reject document."))
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: (id) => documentsApi.deleteDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-documents', employeeId] });
      toast.success("Document deleted successfully.");
    },
    onError: (err) => toast.error(extractErrorMessage(err, "Failed to delete document."))
  });

  const unassignAssetMutation = useMutation({
    mutationFn: async (assetId) => ({ assetId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-assets', employeeId] });
      toast.success("Asset returned.");
    },
  });

  return {
    employee,
    isLoading,
    isError,
    error,
    departments,
    employeeClasses,
    employees,
    shifts,
    assets,
    documents,
    leaveTypes,
    employeeLeaveBalances,
    leaveRequests,
    attendance,
    evaluations,
    salaryHistory,
    updateEmployeeMutation,
    requestCompensationUpdateMutation,
    suspendEmployeeMutation,
    requestPromotionMutation,
    requestOffboardingMutation,
    requestProbationMutation,
    reassignHrMutation,
    createDocumentMutation,
    replaceDocumentVersionMutation,
    approveDocumentMutation,
    rejectDocumentMutation,
    deleteDocumentMutation,
    unassignAssetMutation,
  };
}
