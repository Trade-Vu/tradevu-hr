import React, { useState } from "react";
import countryList from 'country-list';
import { employeesApi, approvalsApi, organizationsApi, documentsApi, leaveApi, attendanceApi, assetsApi } from "@/api";
import { useDepartments } from "@/hooks/useDepartmentsQuery";
import { normalizeEmployeeClasses } from "@/lib/formOptions";
import { useAuth } from "@/lib/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { PAGE_ROUTES } from "@/constants/pageRoutes";
import {
  ArrowLeft, Mail, Phone, Calendar, Briefcase, FileText, Building,
  User, DollarSign, Clock, Laptop, TrendingUp, StickyNote,
  Shield, Gift, MoreVertical, Edit, Save, MessageCircle, MessageSquare,
  CheckCircle, Plus, Trash2, Download, Printer, FileSpreadsheet, Upload, Star, X, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { extractErrorMessage, toTitleCase } from "@/lib/utils";

import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { format as dateFnsFormat } from "date-fns";
import { toast } from "sonner";

const format = (dateInput, formatStr) => {
  try {
    if (!dateInput) return 'N/A';
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return dateFnsFormat(date, formatStr);
  } catch (e) {
    return 'Invalid Date';
  }
};

const parseSafeDate = (d) => {
  if (!d) return '';
  const asNum = Number(d);
  const parsed = new Date(isNaN(asNum) ? d : asNum);
  return isNaN(parsed.getTime()) ? '' : parsed.toISOString().split('T')[0];
};

import { uploadToCloudinary } from "@/utils/cloudinary";
import OnboardingProgressWidget from "@/components/employee-detail/OnboardingProgressWidget";
import TaskManager from "@/components/employee-detail/TaskManager";
import { motion } from "framer-motion";

const menuItems = [
  { id: 'personal', label: 'Personal', icon: User },
  { id: 'job', label: 'Job Data & History', icon: Briefcase },
  { id: 'onboarding', label: 'Onboarding & Tasks', icon: CheckCircle },
  { id: 'contracts', label: 'Contracts', icon: FileText },
  { id: 'financial', label: 'Financial', icon: DollarSign },
  { id: 'attendance', label: 'Attendance', icon: Calendar },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'benefits', label: 'Benefits', icon: Gift },
  { id: 'assets', label: 'Assets', icon: Laptop },
  { id: 'performance', label: 'Performance', icon: TrendingUp },
  { id: 'notes', label: 'Notes', icon: StickyNote },
];

const mapEmployeeData = (e) => {
  if (!e) return null;
  const fullName = e.fullName || e.full_name || `${e.firstName || ''} ${e.lastName || ''}`.trim();
  return {
    ...e,
    id: e._id || e.id,
    full_name: fullName,
    fullName: fullName,
    private_email: e.privateEmail || e.private_email || '',
    job_title: e.jobTitle || e.job_title || 'N/A',
    department_name: e.department?.name || e.departmentId?.name || e.department_name || 'N/A',
    department_id: e.departmentId?._id || e.departmentId?.id || (typeof e.departmentId === 'string' ? e.departmentId : undefined),
    departmentId: e.departmentId?._id || e.departmentId?.id || (typeof e.departmentId === 'string' ? e.departmentId : undefined),
    manager_email: e.manager?.fullName || e.manager?.email || e.managerId?.fullName || e.managerId?.email || e.manager_email || 'Not assigned',
    manager_id: e.manager?.id || e.manager?._id || e.managerId?._id || e.managerId?.id || (typeof e.managerId === 'string' ? e.managerId : null),
    employment_status: e.employmentStatus || e.employment_status || 'ACTIVE',
    employment_type: e.employmentType || e.employment_type || 'FULL_TIME',
    employeeClass: e.employeeClass || e.employee_class || 'PERMANENT',
    start_date: parseSafeDate(e.hireDate || e.start_date),
    probation_start_date: parseSafeDate(e.probationStartDate || e.probation_start_date),
    probation_end_date: parseSafeDate(e.probationEndDate || e.probation_end_date),
    personal_info: {
      date_of_birth: parseSafeDate(e.personal_info?.date_of_birth || e.dateOfBirth),
      gender: e.personal_info?.gender || e.gender || '',
      marital_status: e.personal_info?.marital_status || e.maritalStatus || '',
      nationality: e.personal_info?.nationality || e.nationality || '',
      national_id: e.personal_info?.national_id || e.nationalId || '',
      iqama_number: e.personal_info?.iqama_number || e.passportNumber || e.iqamaNumber || ''
    },
    payroll_details: {
      basic_salary: e.payrollInfo?.basicSalary ?? e.payroll_details?.basic_salary ?? e.basicSalary ?? 0,
      bank_name: e.payrollInfo?.bankName ?? e.payroll_details?.bank_name ?? e.bankName ?? '',
      iban: e.payrollInfo?.iban ?? e.payroll_details?.iban ?? e.bankAccountNumber ?? '',
      gosi_number: e.payrollInfo?.gosiNumber ?? e.payroll_details?.gosi_number ?? e.pensionId ?? ''
    },
    contract_details: e.contract_details || {},
    promotion_history: e.promotionHistory || e.promotion_history || [],
    status_history: e.statusHistory || e.status_history || []
  };
};

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
    return <Badge className="text-blue-700 border-blue-200 bg-blue-50">{label}</Badge>;
  }
  if (s === 'DRAFT') {
    return <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">{label}</Badge>;
  }
  if (s === 'TERMINATED' || s === 'SUSPENDED' || s === 'OFFBOARDED' || s === 'RESIGNED') {
    return <Badge className="bg-rose-50 text-rose-700 border-rose-200">{label}</Badge>;
  }
  return <Badge className={isNew ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "bg-slate-50 text-slate-600 border-slate-200"}>{label}</Badge>;
};

export default function EmployeeDetail({ employeeIdProp, employeeDetail, onClose }) {
  const { employeeId: paramId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const employeeId = employeeIdProp || employeeDetail?.id || employeeDetail?._id || paramId || urlParams.get('id');
  const isModal = !!employeeIdProp || !!employeeDetail;
  const [activeSection, setActiveSection] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const { user } = useAuth();
  const [showDocDialog, setShowDocDialog] = useState(false);
  const [showAssetDialog, setShowAssetDialog] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [docForm, setDocForm] = useState({ document_name: '', file_url: '', file_name: '', file_type: 'PDF', file_size: 0, category: 'Employment Contract', visibility_level: 'hr_only' });
  const [showReplaceDialog, setShowReplaceDialog] = useState(false);
  const [docToReplace, setDocToReplace] = useState(null);
  const [replaceForm, setReplaceForm] = useState({ file_url: '', file_name: '', file_type: 'PDF', file_size: 0 });
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [selectedDocHistory, setSelectedDocHistory] = useState(null);
  const [docCategoryFilter, setDocCategoryFilter] = useState('All');
  const [docSearchQuery, setDocSearchQuery] = useState('');
  const [assetToRemove, setAssetToRemove] = useState(null);

  const { data: orgData } = useQuery({
    queryKey: ['organization', user?.organizationId],
    queryFn: async () => {
      if (!user?.organizationId) return null;
      const res = await organizationsApi.getMyOrganization();
      return res.data?.data || res.data || res;
    },
    enabled: !!user?.organizationId
  });

  const employeeClasses = normalizeEmployeeClasses(orgData?.employeeClasses);

  const { data: departmentsData } = useDepartments();
  const departments = departmentsData || [];

  const [showPromoteDialog, setShowPromoteDialog] = useState(false);
  const [promoteForm, setPromoteForm] = useState({ jobTitle: '', departmentId: '', employeeClass: '', isHeadOfDepartment: false, effectiveDate: new Date().toISOString().split('T')[0] });

  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [suspendForm, setSuspendForm] = useState({ startDate: '', endDate: '', reason: '', superAdminApproved: false });

  const [showOffboardDialog, setShowOffboardDialog] = useState(false);
  const [offboardForm, setOffboardForm] = useState({ type: 'RESIGNATION', exitDate: '', reason: '' });

  const [showProbationDialog, setShowProbationDialog] = useState(false);
  const [probationForm, setProbationForm] = useState({ startDate: '', endDate: '' });

  const [showRejectProfileDialog, setShowRejectProfileDialog] = useState(false);
  const [rejectProfileReason, setRejectProfileReason] = useState('');
  const [isApprovingProfile, setIsApprovingProfile] = useState(false);
  const [isRejectingProfile, setIsRejectingProfile] = useState(false);

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
    enabled: !!employeeId
  });

  const canApprove = ['SUPER_ADMIN', 'HR_ADMIN', 'admin', 'CEO'].includes(user?.role) || user?.isOrgOwner || user?.is_organization_owner;
  const isDraft = Boolean(employee && (
    employee.employment_status === 'DRAFT' ||
    employee.employmentStatus === 'DRAFT' ||
    employee.employment_status === 'draft'
  ));
  const isPendingApproval = Boolean(employee && (
    employee.employment_status === 'PENDING_APPROVAL' ||
    employee.employmentStatus === 'PENDING_APPROVAL' ||
    employee.employment_status === 'pending_approval'
  ));
  const isPendingApprovalOrDraft = isDraft || isPendingApproval;

  const { data: employees = [] } = useQuery({
    queryKey: ['all-employees'],
    queryFn: async () => {
      const res = await employeesApi.getEmployees({ limit: 500 });
      const list = Array.isArray(res) ? res : res?.data || [];
      return (Array.isArray(list) ? list : []).map(emp => ({
        ...emp,
        id: emp._id || emp.id,
        full_name: emp.fullName || emp.full_name,
        job_title: emp.jobTitle || emp.job_title,
      }));
    },
  });

  const { data: shifts = [] } = useQuery({
    queryKey: ['shifts'],
    queryFn: async () => [],
    initialData: [],
  });

  const { data: assets = [] } = useQuery({
    queryKey: ['employee-assets', employeeId],
    queryFn: async () => {
      if (!employeeId) return [];
      const res = await assetsApi.getMyAssets(employeeId);
      const rawList = res.data?.data?.data || res.data?.data || res.data || [];
      return Array.isArray(rawList) ? rawList : [];
    },
    enabled: !!employeeId,
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
        file_name: d.name + '.' + (d.fileType || 'pdf')
      }));
    },
    enabled: !!employeeId,
    initialData: [],
  });

  const { data: documentHistory = [] } = useQuery({
    queryKey: ['document-history', selectedDocHistory?.id],
    queryFn: async () => {
      if (!selectedDocHistory?.id) return [];
      const res = await documentsApi.getDocumentHistory(selectedDocHistory.id);
      const data = res.data?.data || res.data;
      return data?.history || [];
    },
    enabled: !!selectedDocHistory?.id,
    initialData: [],
  });

  const { data: leaveTypes = [] } = useQuery({
    queryKey: ['leave-types'],
    queryFn: async () => {
      const res = await leaveApi.getLeaveTypes();
      const list = Array.isArray(res) ? res : res?.data || [];
      return list.map(type => ({ ...type, id: type.id || type._id }));
    },
    initialData: [],
  });

  const { data: employeeLeaveBalances = [] } = useQuery({
    queryKey: ['employee-leave-balances', employeeId],
    queryFn: async () => {
      if (!employeeId) return [];
      const res = await leaveApi.getBalances(employeeId);
      const item = Array.isArray(res) ? res : res?.data || res;
      const balances = Array.isArray(item?.balances) ? item.balances : [];
      return balances.map(balance => ({
        leaveTypeId: balance.leaveTypeId?._id || balance.leaveTypeId || '',
        leaveType: balance.leaveTypeId?.name || 'Leave',
        total: balance.allocated ?? 0,
        used: balance.used ?? 0,
        remaining: balance.remaining ?? 0,
      }));
    },
    enabled: !!employeeId,
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
    enabled: !!employeeId,
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
    enabled: !!employeeId,
    initialData: [],
  });

  const { data: evaluations = [] } = useQuery({
    queryKey: ['employee-evaluations', employeeId],
    queryFn: async () => [],
    enabled: !!employeeId,
    initialData: [],
  });

  React.useEffect(() => {
    if (employee && !isEditing) {
      setEditData(employee);
    }
  }, [employee, isEditing]);

  const { data: salaryHistory = [] } = useQuery({
    queryKey: ['salary-history', employeeId],
    queryFn: async () => {
      return employee?.salaryHistory || [];
    },
    enabled: !!employeeId,
    initialData: [],
  });

  const handleExportAttendance = () => {
    const csvContent = "data:text/csv;charset=utf-8,Date,Check In,Check Out,Status\n"
      + attendance.map(a => `${a.date},${a.check_in},${a.check_out},${a.status}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const a = document.createElement("a");
    a.href = encodedUri;
    a.download = `${employee?.full_name}_attendance_${format(new Date(), 'yyyy-MM')}.csv`;
  };

  const [compForm, setCompForm] = useState({ basicSalary: '', housing: '', transport: '', food: '', other: '', reason: '' });
  const [showCompDialog, setShowCompDialog] = useState(false);

  const requestCompensationUpdateMutation = useMutation({
    mutationFn: async (input) => {
      const allowancesObj = {
        housing: parseFloat(input.housing) || 0,
        transport: parseFloat(input.transport) || 0,
        food: parseFloat(input.food) || 0,
        other: parseFloat(input.other) || 0
      };
      return await employeesApi.updateEmployee(employeeId, {
        basicSalary: parseFloat(input.basicSalary) || 0,
        allowances: allowancesObj
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['employee', employeeId]);
      queryClient.invalidateQueries(['salary-history', employeeId]);
      setShowCompDialog(false);
      setCompForm({ basicSalary: '', housing: '', transport: '', food: '', other: '', reason: '' });
      toast.success("Compensation updated successfully.");
    },
    onError: (err) => {
      console.error(err);
      toast.error(extractErrorMessage(err, "Failed to update compensation."));
    }
  });

  const suspendEmployeeMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return await employeesApi.updateEmployee(id, {
        employmentStatus: 'SUSPENDED'
      });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['employee', variables.id]);
      toast.success("Employee suspended successfully.");
    },
    onError: (err) => {
      console.error(err);
      toast.error(extractErrorMessage(err, "Failed to suspend employee."));
    }
  });

  const requestPromotionMutation = useMutation({
    mutationFn: async (input) => {
      return await employeesApi.updateEmployee(employeeId, {
        jobTitle: input.newJobTitle || undefined,
        departmentId: input.newDepartmentId || undefined,
        employeeClass: input.newEmployeeClass || undefined,
        effectiveDate: input.effectiveDate || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['employee', employeeId]);
      setShowPromoteDialog(false);
      setPromoteForm({ jobTitle: '', departmentId: '', employeeClass: '', isHeadOfDepartment: false, effectiveDate: new Date().toISOString().split('T')[0] });
      toast.success("Promotion updated successfully.");
    },
    onError: (err) => {
      console.error(err);
      toast.error(extractErrorMessage(err, "Failed to update promotion."));
    }
  });

  const requestOffboardingMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const statusMap = {
        RESIGNATION: 'RESIGNED',
        TERMINATION: 'TERMINATED',
        RETIREMENT: 'OFFBOARDED',
      };
      const employmentStatus = statusMap[data.type] || 'OFFBOARDED';
      return await employeesApi.updateEmployee(id, {
        employmentStatus,
        endDate: data.exitDate ? new Date(data.exitDate).toISOString() : undefined,
      });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['employee', variables.id]);
      toast.success("Offboarding processed successfully.");
    },
    onError: (err) => {
      console.error(err);
      toast.error(extractErrorMessage(err, "Failed to process offboarding."));
    }
  });

  const requestProbationMutation = useMutation({
    mutationFn: async ({ data }) => {
      return await employeesApi.updateEmployee(employeeId, {
        employmentStatus: 'PROBATION',
        probationStartDate: data.startDate || undefined,
        probationEndDate: data.endDate || undefined
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['employee', employeeId]);
      toast.success("Probation updated successfully.");
    },
    onError: (err) => {
      console.error(err);
      toast.error(extractErrorMessage(err, "Failed to update probation."));
    }
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const input = {
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
        employeeClass: data.employeeClass || undefined
      };

      Object.keys(input).forEach(key => input[key] === undefined && delete input[key]);

      return await employeesApi.updateEmployee(id, input);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['employee', employeeId] });
      setIsEditing(false);
      toast.success("Saved successfully");
    },
    onError: (error) => {
      console.error(error);
      toast.error(extractErrorMessage(error, "Failed to save data."));
    }
  });

  const createDocumentMutation = useMutation({
    mutationFn: async (data) => {
      return await documentsApi.uploadDocument({
        employeeId,
        name: data.document_name,
        category: data.category || 'General',
        fileUrl: data.file_url || '',
        fileType: data.file_type || 'PDF',
        fileSize: data.file_size || 0,
      });
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['employee-documents', employeeId] });
      setShowDocDialog(false);
      setDocForm({ document_name: '', file_url: '', file_name: '', file_type: 'PDF', file_size: 0, category: 'Employment Contract', visibility_level: 'hr_only' });
      toast.success("Document uploaded successfully.");
    },
    onError: (err) => {
      console.error(err);
      toast.error(extractErrorMessage(err, "Failed to upload document."));
    }
  });

  const replaceDocumentVersionMutation = useMutation({
    mutationFn: async ({ id, fileUrl, fileType, fileSize }) => {
      return await documentsApi.replaceDocumentVersion(id, {
        fileUrl,
        fileType: fileType || 'PDF',
        fileSize: fileSize || 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-documents', employeeId] });
      setShowReplaceDialog(false);
      setDocToReplace(null);
      setReplaceForm({ file_url: '', file_name: '', file_type: 'PDF', file_size: 0 });
      toast.success("Document replaced successfully.");
    },
    onError: (err) => {
      console.error(err);
      toast.error(extractErrorMessage(err, "Failed to replace document."));
    }
  });

  const approveDocumentMutation = useMutation({
    mutationFn: async ({ id, notes }) => {
      return await documentsApi.approveDocument(id, notes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-documents', employeeId] });
      toast.success("Document approved successfully.");
    },
    onError: (err) => {
      console.error(err);
      toast.error(extractErrorMessage(err, "Failed to approve document."));
    }
  });

  const rejectDocumentMutation = useMutation({
    mutationFn: async ({ id, notes }) => {
      return await documentsApi.rejectDocument(id, notes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-documents', employeeId] });
      toast.success("Document marked as rejected.");
    },
    onError: (err) => {
      console.error(err);
      toast.error(extractErrorMessage(err, "Failed to reject document."));
    }
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (id) => {
      return await documentsApi.deleteDocument(id);
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['employee-documents', employeeId] });
      toast.success("Document deleted successfully.");
    },
    onError: (err) => {
      console.error(err);
      toast.error(extractErrorMessage(err, "Failed to delete document."));
    }
  });

  const unassignAssetMutation = useMutation({
    mutationFn: async (assetId) => {
      // Mocked for now
      return { assetId };
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['employee-assets', employeeId] });
      setAssetToRemove(null);
    },
  });

  const createCommLogMutation = useMutation({
    mutationFn: async (data) => {
      return { data };
    }
  });

  const handleSave = () => {
    updateEmployeeMutation.mutate({ id: employee.id, data: editData });
  };

  const handleSendEmail = async (email, type = 'work') => {
    await createCommLogMutation.mutateAsync({
      organization_id: user?.organization_id,
      employee_id: employee.id,
      employee_name: employee.full_name,
      sent_by: user?.email,
      communication_type: 'email',
      recipient: email,
      subject: 'Communication from HR',
      message: 'Email sent via employee profile',
      sent_date: new Date().toISOString(),
    });
    window.location.href = `mailto:${email}`;
  };

  const handleSendSMS = async (phone) => {
    await createCommLogMutation.mutateAsync({
      organization_id: user?.organization_id,
      employee_id: employee.id,
      employee_name: employee.full_name,
      sent_by: user?.email,
      communication_type: 'sms',
      recipient: phone,
      message: 'SMS sent via employee profile',
      sent_date: new Date().toISOString(),
    });
    window.location.href = `sms:${phone}`;
  };

  const handleSendWhatsApp = async (phone) => {
    await createCommLogMutation.mutateAsync({
      organization_id: user?.organization_id,
      employee_id: employee.id,
      employee_name: employee.full_name,
      sent_by: user?.email,
      communication_type: 'whatsapp',
      recipient: phone,
      message: 'WhatsApp message sent via employee profile',
      sent_date: new Date().toISOString(),
    });
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  const handleDocUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const result = await uploadToCloudinary(file);
      setDocForm(prev => ({
        ...prev,
        file_url: result.secure_url,
        file_name: file.name,
        file_type: result.format || 'PDF',
        file_size: result.bytes || 0
      }));
    } catch (error) {
      console.error("Error uploading to Cloudinary:", error);
      alert("Failed to upload file");
    }
    setUploadingFile(false);
  };

  const handleReplaceDocUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const result = await uploadToCloudinary(file);
      setReplaceForm(prev => ({
        ...prev,
        file_url: result.secure_url,
        file_name: file.name,
        file_type: result.format || 'PDF',
        file_size: result.bytes || 0
      }));
    } catch (error) {
      console.error("Error uploading to Cloudinary:", error);
      alert("Failed to upload file");
    }
    setUploadingFile(false);
  };

  const handlePrintAttendance = () => {
    window.print();
  };

  const handleExportPDF = () => {
    alert('PDF export feature coming soon');
  };

  const handleExportExcel = () => {
    const csvData = thisMonthAttendance.map(record =>
      `${format(new Date(record.date), 'yyyy-MM-dd')},${record.status},${record.check_in || ''},${record.check_out || ''}`
    ).join('\n');

    const blob = new Blob([`Date,Status,Check In,Check Out\n${csvData}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.download = `${employee.full_name}_attendance_${format(new Date(), 'yyyy-MM')}.csv`;
    a.click();
  };

  if (isLoading || !employee) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
      </div>
    );
  }

  const thisMonthAttendance = attendance.filter(a => {
    const recordDate = new Date(a.date);
    const now = new Date();
    return recordDate.getMonth() === now.getMonth() && recordDate.getFullYear() === now.getFullYear();
  });

  const presentDays = thisMonthAttendance.filter(a => a.status === 'present' || a.status === 'remote').length;
  const absentDays = thisMonthAttendance.filter(a => a.status === 'absent').length;
  const lateDays = thisMonthAttendance.filter(a => a.status === 'late').length;
  const leaveDays = thisMonthAttendance.filter(a => a.status === 'leave').length;

  const PremiumField = ({ icon: Icon, label, value, action }) => (
    <div className="relative flex items-start gap-4 p-4 transition-colors border rounded-2xl bg-slate-50/50 border-slate-100/60 hover:bg-slate-50">
      <div className="flex items-center justify-center w-10 h-10 bg-white border shadow-sm rounded-xl border-slate-100 shrink-0">
        <Icon className="w-5 h-5 text-indigo-500" />
      </div>
      <div className="pt-0.5 flex-1 pr-12">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
        <div className="font-medium break-words text-slate-900">{value}</div>
      </div>
      {action && <div className="absolute -translate-y-1/2 right-4 top-1/2">{action}</div>}
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'personal':
        return (
          <div className="space-y-6">
            <OnboardingProgressWidget
              employeeId={employeeId}
              employee={employee}
              onCompleteAction={() => {
                setActiveSection('job');
                setIsEditing(true);
                setEditData(prev => ({ ...prev, employment_status: 'PROBATION' }));
              }}
              onSetToActive={() => {
                setActiveSection('job');
                setIsEditing(true);
                setEditData(prev => ({ ...prev, employment_status: 'ACTIVE' }));
              }}
              onBeginOffboarding={() => {
                setActiveSection('job');
                setIsEditing(true);
                setEditData(prev => ({ ...prev, employment_status: 'OFFBOARDED' }));
              }}
            />
            <div>
              <h3 className="mb-5 text-lg font-semibold text-slate-900">About</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {isEditing ? (
                  <>
                    <div className="space-y-2">
                      <Label>Date of Birth</Label>
                      <Input
                        type="date"
                        value={editData.personal_info?.date_of_birth || ''}
                        onChange={(e) => setEditData(prev => ({
                          ...prev,
                          personal_info: { ...prev.personal_info, date_of_birth: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Gender</Label>
                      <Select
                        value={(editData.personal_info?.gender || '').toLowerCase()}
                        onValueChange={(value) => setEditData(prev => ({
                          ...prev,
                          personal_info: { ...prev.personal_info, gender: value }
                        }))}
                      >
                        <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Nationality</Label>
                      <Select
                        value={editData.personal_info?.nationality || ''}
                        onValueChange={(value) => setEditData(prev => ({
                          ...prev,
                          personal_info: { ...prev.personal_info, nationality: value }
                        }))}
                      >
                        <SelectTrigger><SelectValue placeholder="Select nationality" /></SelectTrigger>
                        <SelectContent>
                          {countryList.getNames().map(country => (
                            <SelectItem key={country} value={country}>{country}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Marital Status</Label>
                      <Select
                        value={(editData.personal_info?.marital_status || '').toLowerCase()}
                        onValueChange={(value) => setEditData(prev => ({
                          ...prev,
                          personal_info: { ...prev.personal_info, marital_status: value }
                        }))}
                      >
                        <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single">Single</SelectItem>
                          <SelectItem value="married">Married</SelectItem>
                          <SelectItem value="divorced">Divorced</SelectItem>
                          <SelectItem value="widowed">Widowed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>National ID Number</Label>
                      <Input
                        value={editData.personal_info?.national_id || ''}
                        onChange={(e) => setEditData(prev => ({
                          ...prev,
                          personal_info: { ...prev.personal_info, national_id: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Iqama Number</Label>
                      <Input
                        value={editData.personal_info?.iqama_number || ''}
                        onChange={(e) => setEditData(prev => ({
                          ...prev,
                          personal_info: { ...prev.personal_info, iqama_number: e.target.value }
                        }))}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <PremiumField icon={Calendar} label="Birthday" value={employee.personal_info?.date_of_birth ? format(new Date(employee.personal_info.date_of_birth), 'dd MMM yyyy') : 'Not set'} />
                    <PremiumField icon={User} label="Gender" value={toTitleCase(employee.personal_info?.gender) || 'Not set'} />
                    <PremiumField icon={User} label="Nationality" value={employee.personal_info?.nationality || 'Not set'} />
                    <PremiumField icon={User} label="Marital Status" value={toTitleCase(employee.personal_info?.marital_status) || 'Not set'} />
                    <PremiumField icon={Shield} label="National ID Number" value={employee.personal_info?.national_id || 'Not set'} />
                    <PremiumField icon={Shield} label="Iqama Number" value={employee.personal_info?.iqama_number || 'Not set'} />
                  </>
                )}
              </div>
            </div>

            <div className="pt-8 border-t border-slate-100">
              <h3 className="mb-5 text-lg font-semibold text-slate-900">Contact</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <PremiumField
                  icon={Mail}
                  label="Work Email"
                  value={employee.email}
                  action={
                    <Button size="icon" variant="ghost" className="w-8 h-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50" onClick={() => handleSendEmail(employee.email, 'work')}>
                      <Mail className="w-4 h-4" />
                    </Button>
                  }
                />

                {isEditing ? (
                  <div className="col-span-1 space-y-2 md:col-span-2">
                    <Label>Private Email</Label>
                    <Input
                      type="email"
                      value={editData.private_email || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, private_email: e.target.value }))}
                      placeholder="personal@email.com"
                    />
                  </div>
                ) : employee.private_email ? (
                  <PremiumField
                    icon={Mail}
                    label="Private Email"
                    value={employee.private_email}
                    action={
                      <Button size="icon" variant="ghost" className="w-8 h-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50" onClick={() => handleSendEmail(employee.private_email, 'private')}>
                        <Mail className="w-4 h-4" />
                      </Button>
                    }
                  />
                ) : null}

                <PremiumField
                  icon={Phone}
                  label="Mobile No."
                  value={employee.phone || 'Not set'}
                  action={
                    employee.phone && (
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="w-8 h-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50" onClick={() => handleSendSMS(employee.phone)} title="Send SMS">
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="w-8 h-8 text-slate-400 hover:text-green-600 hover:bg-green-50" onClick={() => handleSendWhatsApp(employee.phone)} title="Send WhatsApp">
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    )
                  }
                />
              </div>
            </div>
          </div>
        );

      case 'job':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-900">Job Information</h3>
            {isEditing ? (
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Job Title</Label>
                  <Input
                    value={editData.job_title || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, job_title: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select
                    value={editData.department_id || ''}
                    onValueChange={(value) => setEditData(prev => ({ ...prev, department_id: value }))}
                  >
                    <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                    <SelectContent>
                      {departments.map((department) => (
                        <SelectItem key={department.id} value={department.id}>{department.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Employment Class</Label>
                  <Select
                    value={editData.employeeClass || 'PERMANENT'}
                    onValueChange={(value) => setEditData(prev => ({ ...prev, employeeClass: value }))}
                  >
                    <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                    <SelectContent>
                      {employeeClasses.map((employeeClass) => (
                        <SelectItem key={employeeClass.value} value={employeeClass.value}>{employeeClass.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Employment Status</Label>
                  <Select
                    value={editData.employment_status || 'ACTIVE'}
                    onValueChange={(value) => setEditData(prev => ({ ...prev, employment_status: value }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="PENDING_APPROVAL">Pending Approval</SelectItem>
                      <SelectItem value="PENDING_ONBOARDING">Pending Onboarding</SelectItem>
                      <SelectItem value="ONGOING_ONBOARDING">Ongoing Onboarding</SelectItem>
                      <SelectItem value="PROBATION">Probation</SelectItem>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="SUSPENDED">Suspended</SelectItem>
                      <SelectItem value="RESIGNED">Resigned</SelectItem>
                      <SelectItem value="TERMINATED">Terminated</SelectItem>
                      <SelectItem value="OFFBOARDED">Offboarded</SelectItem>
                      <SelectItem value="ARCHIVED">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={editData.start_date || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, start_date: e.target.value }))}
                  />
                </div>
                {editData.employment_status === 'PROBATION' && (
                  <>
                    <div className="space-y-2">
                      <Label>Probation Start Date</Label>
                      <Input
                        type="date"
                        value={editData.probation_start_date || ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, probation_start_date: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Probation End Date</Label>
                      <Input
                        type="date"
                        value={editData.probation_end_date || ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, probation_end_date: e.target.value }))}
                      />
                    </div>
                  </>
                )}
                {editData.employment_status !== employee.employment_status && (
                  <div className="space-y-2 md:col-span-2">
                    <Label>Reason for Status Change</Label>
                    <Input
                      placeholder="e.g. Performance review, promotion, probation completion..."
                      value={editData.status_change_reason || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, status_change_reason: e.target.value }))}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Reports To (Manager)</Label>
                  <Select
                    value={editData.manager_id || ''}
                    onValueChange={(value) => setEditData(prev => ({ ...prev, manager_id: value === 'NONE' ? '' : value }))}
                  >
                    <SelectTrigger><SelectValue placeholder="Select manager" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">No Manager</SelectItem>
                      {employees.filter(e => e.id !== employee.id).map(emp => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.full_name} - {emp.job_title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <PremiumField icon={Briefcase} label="Job Title" value={employee.job_title} />
                <PremiumField icon={Building} label="Department" value={employee.department_name || employee.department_id || 'Not assigned'} />
                <PremiumField icon={FileText} label="Employment Type" value={employee.employment_type?.replace('_', ' ')} />
                <PremiumField icon={Shield} label="Employee Class" value={employee.employeeClass || 'Permanent'} />
                <PremiumField icon={CheckCircle} label="Employment Status" value={<Badge className="text-green-700 bg-green-100 hover:bg-green-200">{employee.employment_status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Badge>} />
                <PremiumField icon={Calendar} label="Start Date" value={employee.start_date ? format(new Date(employee.start_date), 'MMM dd, yyyy') : 'Not set'} />
                <PremiumField icon={User} label="Reports To" value={employee.manager_email || 'Not assigned'} />
              </div>
            )}

            {!isEditing && (
              <div className="pt-8 mt-8 border-t border-slate-100">
                <div className="mb-8 space-y-4">
                  <h4 className="font-medium text-slate-800">Promotion History</h4>
                  {employee.promotion_history && employee.promotion_history.length > 0 ? (
                    <div className="overflow-hidden border rounded-lg border-slate-200">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500">
                          <tr>
                            <th className="px-4 py-3 font-medium">Date</th>
                            <th className="px-4 py-3 font-medium">Previous</th>
                            <th className="px-4 py-3 font-medium">New</th>
                            <th className="px-4 py-3 font-medium">Approved By</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {employee.promotion_history.map(ph => (
                            <tr key={ph.id} className="hover:bg-slate-50/50">
                              <td className="px-4 py-3 text-slate-600">{new Date(ph.createdAt).toLocaleDateString()}</td>
                              <td className="px-4 py-3 text-slate-600">
                                <div>{ph.previousTitle}</div>
                                <div className="text-xs text-slate-400">{ph.previousGrade}</div>
                              </td>
                              <td className="px-4 py-3 font-medium text-slate-900">
                                <div>{ph.newTitle}</div>
                                <div className="text-xs text-slate-500">{ph.newGrade}</div>
                              </td>
                              <td className="px-4 py-3 text-slate-500">{ph.approvedBy || 'System'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-4 text-sm border rounded-lg border-slate-200 bg-slate-50 text-slate-500">
                      No promotion history found.
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-slate-800">Status History</h4>
                  {employee.status_history && employee.status_history.length > 0 ? (
                    <div className="overflow-hidden bg-white border rounded-lg shadow-sm border-slate-200">
                      <table className="w-full text-sm text-left">
                        <thead className="border-b bg-slate-50 border-slate-200">
                          <tr>
                            <th className="px-4 py-3 font-medium text-slate-700">Date</th>
                            <th className="px-4 py-3 font-medium text-slate-700">Previous Status</th>
                            <th className="px-4 py-3 font-medium text-slate-700">New Status</th>
                            <th className="px-4 py-3 font-medium text-slate-700">Reason</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {[...employee.status_history]
                            .sort((a, b) => {
                              const dateB = new Date(Number(b.createdAt || b.date) || b.createdAt || b.date || 0);
                              const dateA = new Date(Number(a.createdAt || a.date) || a.createdAt || a.date || 0);
                              return dateB - dateA;
                            })
                            .map((sh, idx) => {
                              const rawDate = sh.createdAt || sh.date || sh.timestamp || sh.updatedAt;
                              const prevStatus = sh.previousStatus || sh.from || 'N/A';
                              const newStatus = sh.newStatus || sh.to || 'N/A';
                              return (
                                <tr key={sh.id || sh._id || `sh-${idx}`} className="transition-colors bg-white hover:bg-slate-50">
                                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{formatStatusDate(rawDate)}</td>
                                  <td className="px-4 py-3 text-slate-600">
                                    {renderStatusHistoryBadge(prevStatus, false)}
                                  </td>
                                  <td className="px-4 py-3">
                                    {renderStatusHistoryBadge(newStatus, true)}
                                  </td>
                                  <td className="px-4 py-3 text-xs text-slate-600">{sh.reason || 'N/A'}</td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-4 text-sm border rounded-lg border-slate-200 bg-slate-50 text-slate-500">
                      No status history found.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      case 'contracts':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-900">Contract Details</h3>
            {isEditing ? (
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Contract Type</Label>
                  <Select
                    value={editData.contract_details?.contract_type || ''}
                    onValueChange={(value) => setEditData(prev => ({
                      ...prev,
                      contract_details: { ...prev.contract_details, contract_type: value }
                    }))}
                  >
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="indefinite">Indefinite</SelectItem>
                      <SelectItem value="fixed_term">Fixed Term</SelectItem>
                      <SelectItem value="probation">Probation</SelectItem>
                      <SelectItem value="internship">Internship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Assigned Shift</Label>
                  <Select
                    value={editData.work_schedule?.shift_id || ''}
                    onValueChange={(value) => setEditData(prev => ({
                      ...prev,
                      work_schedule: { ...prev.work_schedule, shift_id: value }
                    }))}
                  >
                    <SelectTrigger><SelectValue placeholder="Select shift" /></SelectTrigger>
                    <SelectContent>
                      {shifts.map(shift => (
                        <SelectItem key={shift.id} value={shift.id}>
                          {shift.shift_name} ({shift.start_time} - {shift.end_time})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Contract Start Date</Label>
                  <Input
                    type="date"
                    value={editData.contract_details?.contract_start_date || ''}
                    onChange={(e) => setEditData(prev => ({
                      ...prev,
                      contract_details: { ...prev.contract_details, contract_start_date: e.target.value }
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contract End Date</Label>
                  <Input
                    type="date"
                    value={editData.contract_details?.contract_end_date || ''}
                    onChange={(e) => setEditData(prev => ({
                      ...prev,
                      contract_details: { ...prev.contract_details, contract_end_date: e.target.value }
                    }))}
                  />
                </div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <PremiumField icon={FileText} label="Contract Type" value={employee.contract_details?.contract_type || 'Not set'} />
                <PremiumField icon={Clock} label="Assigned Shift" value={shifts.find(s => s.id === employee.work_schedule?.shift_id)?.shift_name || 'Not assigned'} />
                <PremiumField icon={Calendar} label="Contract Start" value={employee.contract_details?.contract_start_date ? format(new Date(employee.contract_details.contract_start_date), 'MMM dd, yyyy') : 'Not set'} />
                <PremiumField icon={Calendar} label="Contract End" value={employee.contract_details?.contract_end_date ? format(new Date(employee.contract_details.contract_end_date), 'MMM dd, yyyy') : 'Not set'} />
              </div>
            )}

            <div className="pt-6 border-t">
              <h3 className="text-lg font-semibold text-slate-900">Leave Balance</h3>
              {/*
                Read-only: driven by the org's actual configured leave types and this
                employee's real LeaveBalance record (GET /leave/balances/:employeeId), not
                the old employee.leave_balances field (which the Employee schema never had -
                it always rendered fabricated 21/30 defaults). There's currently no backend
                endpoint for an admin to directly set/adjust a balance - it only changes via
                the leave approval flow - so this is display-only.
              */}
              {(() => {
                const rows = employeeLeaveBalances.length > 0
                  ? employeeLeaveBalances.map(balance => ({
                      key: balance.leaveTypeId,
                      name: balance.leaveType,
                      total: balance.total,
                      used: balance.used,
                      remaining: balance.remaining,
                    }))
                  : leaveTypes.map(type => ({ key: type.id, name: type.name, total: 0, used: 0, remaining: 0 }));
                const colors = [
                  { bg: 'bg-blue-50', text: 'text-blue-700' },
                  { bg: 'bg-green-50', text: 'text-green-700' },
                  { bg: 'bg-purple-50', text: 'text-purple-700' },
                  { bg: 'bg-amber-50', text: 'text-amber-700' },
                  { bg: 'bg-rose-50', text: 'text-rose-700' },
                  { bg: 'bg-cyan-50', text: 'text-cyan-700' },
                ];
                if (rows.length === 0) {
                  return <p className="mt-3 text-sm text-slate-500">No leave types configured for this organization.</p>;
                }
                return (
                  <div className="grid gap-6 mt-4 md:grid-cols-3">
                    {rows.map((row, index) => {
                      const color = colors[index % colors.length];
                      return (
                        <div key={row.key} className={`p-6 rounded-xl text-center ${color.bg}`}>
                          <p className={`text-3xl font-bold ${color.text}`}>{row.remaining}</p>
                          <p className="mt-2 text-sm text-slate-600">{row.name}</p>
                          <p className="text-xs text-slate-500">
                            {row.used} used of {row.total}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              <div className="pt-6">
                <h4 className="mb-3 font-semibold text-slate-900">Leave History</h4>
                {leaveRequests.length === 0 ? (
                  <div className="py-8 text-center">
                    <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-slate-500">No leave requests</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {leaveRequests.map(leave => (
                      <div key={leave.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-50">
                        <div>
                          <p className="font-medium text-slate-900">{leave.leave_type.replace('_', ' ')}</p>
                          <p className="text-sm text-slate-500">
                            {format(new Date(leave.start_date), 'MMM d')} - {format(new Date(leave.end_date), 'MMM d, yyyy')} ({leave.total_days} days)
                          </p>
                        </div>
                        <Badge className={
                          leave.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                            leave.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                        }>
                          {toTitleCase(leave.status)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'financial':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Financial & Banking Details</h3>
              {!isEditing && ['HR_ADMIN', 'SUPER_ADMIN'].includes(user?.role) && (
                <Button onClick={() => setShowCompDialog(true)} className="text-white bg-slate-900 hover:bg-slate-800">
                  Request Compensation Update
                </Button>
              )}
            </div>

            <Dialog open={showCompDialog} onOpenChange={setShowCompDialog}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Request Compensation Update</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>New Basic Salary (NGN)</Label>
                    <Input
                      type="number"
                      value={compForm.basicSalary}
                      onChange={(e) => setCompForm({ ...compForm, basicSalary: e.target.value })}
                      placeholder="e.g. 500000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Housing Allowance</Label>
                    <Input type="number" value={compForm.housing} onChange={(e) => setCompForm({ ...compForm, housing: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Transport Allowance</Label>
                    <Input type="number" value={compForm.transport} onChange={(e) => setCompForm({ ...compForm, transport: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Reason for Update</Label>
                    <Input
                      value={compForm.reason}
                      onChange={(e) => setCompForm({ ...compForm, reason: e.target.value })}
                      placeholder="e.g. Annual Review, Promotion"
                    />
                  </div>
                  <Button
                    onClick={() => requestCompensationUpdateMutation.mutate(compForm)}
                    disabled={requestCompensationUpdateMutation.isPending || !compForm.basicSalary || !compForm.reason}
                    className="w-full text-white bg-slate-900"
                  >
                    {requestCompensationUpdateMutation.isPending ? 'Submitting...' : 'Submit Request'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {isEditing ? (
              <>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Bank Name</Label>
                    <Input
                      value={editData.payroll_details?.bank_name || ''}
                      onChange={(e) => setEditData(prev => ({
                        ...prev,
                        payroll_details: { ...prev.payroll_details, bank_name: e.target.value }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>IBAN / Account Number</Label>
                    <Input
                      value={editData.payroll_details?.iban || ''}
                      onChange={(e) => setEditData(prev => ({
                        ...prev,
                        payroll_details: { ...prev.payroll_details, iban: e.target.value }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>GOSI / Pension Number</Label>
                    <Input
                      value={editData.payroll_details?.gosi_number || ''}
                      onChange={(e) => setEditData(prev => ({
                        ...prev,
                        payroll_details: { ...prev.payroll_details, gosi_number: e.target.value }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Pension Administrator</Label>
                    <Input
                      value={editData.pensionAdministrator || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, pensionAdministrator: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>HMO Plan</Label>
                    <Select value={editData.hmoPlan || ''} onValueChange={(val) => setEditData(prev => ({ ...prev, hmoPlan: val }))}>
                      <SelectTrigger><SelectValue placeholder="Select Plan" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Bronze">Bronze</SelectItem>
                        <SelectItem value="Silver">Silver</SelectItem>
                        <SelectItem value="Gold">Gold</SelectItem>
                        <SelectItem value="Platinum">Platinum</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>HMO Provider</Label>
                    <Input
                      value={editData.hmoProvider || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, hmoProvider: e.target.value }))}
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="p-4 rounded-lg bg-green-50">
                    <p className="mb-1 text-sm text-slate-600">Basic Salary</p>
                    <p className="text-2xl font-bold text-green-700">
                      {employee.payroll_details?.basic_salary?.toLocaleString() || 0} NGN
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-blue-50">
                    <p className="mb-1 text-sm text-slate-600">Total Compensation</p>
                    <p className="text-2xl font-bold text-blue-700">
                      {((employee.payroll_details?.basic_salary || 0) +
                        Object.values(employee.payroll_details?.allowances || {}).reduce((sum, val) => sum + (val || 0), 0)
                      ).toLocaleString()} NGN
                    </p>
                  </div>
                </div>
                <div>
                  <h4 className="mb-3 font-semibold text-slate-900">Allowances</h4>
                  <div className="grid gap-3 md:grid-cols-2">
                    {Object.entries(employee.payroll_details?.allowances || {}).map(([key, value]) => (
                      value > 0 && (
                        <div key={key} className="flex justify-between p-3 rounded-lg bg-slate-50">
                          <span className="capitalize text-slate-600">{key}</span>
                          <span className="font-medium">{value.toLocaleString()} NGN</span>
                        </div>
                      )
                    ))}
                    {Object.values(employee.payroll_details?.allowances || {}).every(val => !val) && (
                      <p className="text-sm text-slate-500">No allowances currently set.</p>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="mb-3 font-semibold text-slate-900">Banking Information</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between p-3 rounded-lg bg-slate-50">
                      <span className="text-slate-600">Bank Name</span>
                      <span className="font-medium">{employee.payroll_details?.bank_name || 'Not set'}</span>
                    </div>
                    <div className="flex justify-between p-3 rounded-lg bg-slate-50">
                      <span className="text-slate-600">Account Number</span>
                      <span className="font-mono font-medium">{employee.payroll_details?.iban || 'Not set'}</span>
                    </div>
                    <div className="flex justify-between p-3 rounded-lg bg-slate-50">
                      <span className="text-slate-600">Pension / Tax ID</span>
                      <span className="font-medium">{employee.payroll_details?.gosi_number || 'Not set'}</span>
                    </div>
                    <div className="flex justify-between p-3 rounded-lg bg-slate-50">
                      <span className="text-slate-600">Pension Administrator</span>
                      <span className="font-medium">{employee.pensionAdministrator || 'Not set'}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-6">
                  <h4 className="mb-3 font-semibold text-slate-900">Health Insurance (HMO)</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between p-3 rounded-lg bg-slate-50">
                      <span className="text-slate-600">HMO Plan</span>
                      <span className="font-medium">{employee.hmoPlan || 'Not set'}</span>
                    </div>
                    <div className="flex justify-between p-3 rounded-lg bg-slate-50">
                      <span className="text-slate-600">HMO Provider</span>
                      <span className="font-medium">{employee.hmoProvider || 'Not set'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <h4 className="mb-3 font-semibold text-slate-900">Salary History</h4>
                  <div className="overflow-hidden bg-white border rounded-lg border-slate-200">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Effective Date</TableHead>
                          <TableHead>Basic Salary</TableHead>
                          <TableHead>Allowances</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {salaryHistory.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="py-4 text-center text-slate-500">No salary history recorded.</TableCell>
                          </TableRow>
                        ) : (
                          salaryHistory.map(history => {
                            const parsedAllowances = history.allowances ? JSON.parse(history.allowances) : {};
                            const allowanceTotal = Object.values(parsedAllowances).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
                            return (
                              <TableRow key={history.id}>
                                <TableCell>{format(new Date(history.effectiveDate), 'MMM d, yyyy')}</TableCell>
                                <TableCell>{history.basicSalary.toLocaleString()} NGN</TableCell>
                                <TableCell>{allowanceTotal > 0 ? `${allowanceTotal.toLocaleString()} NGN` : '-'}</TableCell>
                                <TableCell>{history.reason}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className={
                                    history.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                      history.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                  }>
                                    {history.status}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </>
            )}
          </div>
        );

      case 'attendance':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Attendance Overview</h3>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handlePrintAttendance}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>
                <Button size="sm" variant="outline" onClick={handleExportPDF}>
                  <Download className="w-4 h-4 mr-2" />
                  PDF
                </Button>
                <Button size="sm" variant="outline" onClick={handleExportExcel}>
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Excel
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <div className="p-4 text-center rounded-lg bg-green-50">
                <p className="text-3xl font-bold text-green-700">{presentDays}</p>
                <p className="mt-1 text-sm text-slate-600">Present</p>
              </div>
              <div className="p-4 text-center rounded-lg bg-red-50">
                <p className="text-3xl font-bold text-red-700">{absentDays}</p>
                <p className="mt-1 text-sm text-slate-600">Absent</p>
              </div>
              <div className="p-4 text-center rounded-lg bg-yellow-50">
                <p className="text-3xl font-bold text-yellow-700">{lateDays}</p>
                <p className="mt-1 text-sm text-slate-600">Late</p>
              </div>
              <div className="p-4 text-center rounded-lg bg-blue-50">
                <p className="text-3xl font-bold text-blue-700">{leaveDays}</p>
                <p className="mt-1 text-sm text-slate-600">On Leave</p>
              </div>
            </div>

            <div className="pt-6 border-t">
              <h3 className="mb-4 text-lg font-semibold text-slate-900">Attendance Calendar - {format(new Date(), 'MMMM yyyy')}</h3>
              {thisMonthAttendance.length === 0 ? (
                <div className="py-8 text-center">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-slate-500">No attendance records this month</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {thisMonthAttendance.map(record => (
                    <div key={record.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="font-medium text-slate-900">{format(new Date(record.date), 'EEEE, MMM d')}</p>
                          <p className="text-xs text-slate-500">
                            {record.check_in && record.check_out && `${record.check_in} - ${record.check_out}`}
                          </p>
                        </div>
                      </div>
                      <Badge className={
                        record.status === 'present' ? 'bg-green-100 text-green-700' :
                          record.status === 'absent' ? 'bg-red-100 text-red-700' :
                            record.status === 'late' ? 'bg-yellow-100 text-yellow-700' :
                              record.status === 'leave' ? 'bg-blue-100 text-blue-700' :
                                'bg-slate-100 text-slate-700'
                      }>
                        {record.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'documents': {
        const filteredDocs = documents.filter(doc => {
          const matchesSearch = doc.document_name.toLowerCase().includes(docSearchQuery.toLowerCase());
          const matchesCategory = docCategoryFilter === 'All' || doc.category === docCategoryFilter;
          return matchesSearch && matchesCategory;
        });

        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Documents</h3>
              <Dialog open={showDocDialog} onOpenChange={setShowDocDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Document
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Upload Document</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    createDocumentMutation.mutate(docForm);
                  }} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="document_name">Document Name</Label>
                      <Input id="document_name" value={docForm.document_name} onChange={(e) => setDocForm(prev => ({ ...prev, document_name: e.target.value }))} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <select id="category" value={docForm.category} onChange={(e) => setDocForm(prev => ({ ...prev, category: e.target.value }))} className="flex items-center justify-between w-full h-10 px-3 py-2 text-sm bg-white border rounded-md border-slate-200">
                        <option value="Employment Contract">Employment Contract</option>
                        <option value="Offer Letter">Offer Letter</option>
                        <option value="Government ID">Government ID</option>
                        <option value="Passport Photograph">Passport Photograph</option>
                        <option value="Certificates & Qualifications">Certificates & Qualifications</option>
                        <option value="Compliance Forms">Compliance Forms</option>
                        <option value="Guarantor Documents">Guarantor Documents</option>
                        <option value="Promotion Letters">Promotion Letters</option>
                        <option value="Payroll Support Documents">Payroll Support Documents</option>
                        <option value="Exit Documents">Exit Documents</option>
                        <option value="Miscellaneous HR Documents">Miscellaneous HR Documents</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="visibility_level">Visibility Level</Label>
                      <select id="visibility_level" value={docForm.visibility_level} onChange={(e) => setDocForm(prev => ({ ...prev, visibility_level: e.target.value }))} className="flex items-center justify-between w-full h-10 px-3 py-2 text-sm bg-white border rounded-md border-slate-200">
                        <option value="hr_only">HR Admin / Super Admin (Private)</option>
                        <option value="employee">Employee & HR</option>
                        <option value="manager">Manager, Employee & HR</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="doc-upload">File</Label>
                      <input type="file" onChange={handleDocUpload} className="hidden" id="doc-upload" />
                      <Button type="button" variant="outline" className="w-full" onClick={() => document.getElementById('doc-upload').click()} disabled={uploadingFile}>
                        <Upload className="w-4 h-4 mr-2" />
                        {uploadingFile ? 'Uploading...' : docForm.file_url ? 'Change File' : 'Upload File'}
                      </Button>
                      {docForm.file_name && <p className="text-sm text-slate-500">Selected file: {docForm.file_name}</p>}
                    </div>
                    <div className="flex justify-end gap-3">
                      <Button type="button" variant="outline" onClick={() => setShowDocDialog(false)}>Cancel</Button>
                      <Button type="submit" isLoading={createDocumentMutation.isPending} disabled={!docForm.file_url || !docForm.document_name}>
                        {createDocumentMutation.isPending ? 'Adding...' : 'Add Document'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="flex gap-4 mb-6">
              <Input placeholder="Search documents..." value={docSearchQuery} onChange={(e) => setDocSearchQuery(e.target.value)} className="max-w-xs" />
              <select value={docCategoryFilter} onChange={(e) => setDocCategoryFilter(e.target.value)} className="flex items-center justify-between w-64 h-10 px-3 py-2 text-sm bg-white border rounded-md border-slate-200">
                <option value="All">All Categories</option>
                <option value="Employment Contract">Employment Contract</option>
                <option value="Offer Letter">Offer Letter</option>
                <option value="Government ID">Government ID</option>
                <option value="Passport Photograph">Passport Photograph</option>
                <option value="Certificates & Qualifications">Certificates & Qualifications</option>
                <option value="Compliance Forms">Compliance Forms</option>
                <option value="Guarantor Documents">Guarantor Documents</option>
                <option value="Promotion Letters">Promotion Letters</option>
                <option value="Payroll Support Documents">Payroll Support Documents</option>
                <option value="Exit Documents">Exit Documents</option>
                <option value="Miscellaneous HR Documents">Miscellaneous HR Documents</option>
              </select>
            </div>

            {filteredDocs.length === 0 ? (
              <div className="py-12 text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500">No documents match.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredDocs.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{doc.document_name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{doc.category}</Badge>
                          <Badge variant="secondary" className="bg-slate-200 text-slate-700">{doc.visibilityLevel === 'hr_only' ? 'HR Only' : doc.visibilityLevel === 'manager' ? 'Manager+' : 'Employee+'}</Badge>
                          <Badge variant="secondary" className="text-blue-700 bg-blue-100">v{doc.currentVersion || 1}</Badge>
                          {doc.status && (
                            <Badge variant="secondary" className={
                              doc.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                              doc.status === 'rejected' ? 'bg-rose-100 text-rose-800' :
                              doc.status === 'pending_upload' ? 'bg-amber-100 text-amber-800' :
                              doc.status === 'EXPIRING_SOON' ? 'bg-amber-100 text-amber-700' :
                              doc.status === 'EXPIRED' ? 'bg-red-100 text-red-700' :
                              'bg-blue-100 text-blue-700'
                            }>
                              {doc.status === 'pending_upload' ? 'Awaiting Upload' : doc.status}
                            </Badge>
                          )}
                        </div>
                        {doc.rejectionReason && (
                          <p className="mt-1 text-xs text-rose-600">Rejection reason: {doc.rejectionReason}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {canApprove && doc.status !== 'approved' && doc.status !== 'pending_upload' && doc.file_url && (
                        <Button size="sm" variant="ghost" className="h-8 px-2 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" onClick={() => approveDocumentMutation.mutate({ id: doc.id })} disabled={approveDocumentMutation.isPending}>
                          Approve
                        </Button>
                      )}
                      {canApprove && doc.status !== 'rejected' && doc.status !== 'pending_upload' && doc.file_url && (
                        <Button size="sm" variant="ghost" className="h-8 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50" onClick={() => {
                          const reason = window.prompt("Enter rejection reason (optional):");
                          if (reason !== null) {
                            rejectDocumentMutation.mutate({ id: doc.id, notes: reason });
                          }
                        }} disabled={rejectDocumentMutation.isPending}>
                          Reject
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => { setSelectedDocHistory(doc); setShowHistoryDialog(true); }}>
                        History
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { setDocToReplace(doc); setShowReplaceDialog(true); }}>
                        Replace
                      </Button>
                      {doc.file_url && (
                        <>
                          <Button size="sm" variant="ghost" asChild>
                            <a href={doc.file_url} target="_blank" rel="noopener noreferrer" title="Preview">
                              <Eye className="w-4 h-4" />
                            </a>
                          </Button>
                          <Button size="sm" variant="ghost" asChild>
                            <a href={doc.file_url} download title="Download">
                              <Download className="w-4 h-4" />
                            </a>
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => deleteDocumentMutation.mutate(doc.id)} disabled={deleteDocumentMutation.isPending}>
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Replace Document Dialog */}
            <Dialog open={showReplaceDialog} onOpenChange={setShowReplaceDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Replace Document Version</DialogTitle>
                </DialogHeader>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (docToReplace) {
                    replaceDocumentVersionMutation.mutate({
                      id: docToReplace.id,
                      fileUrl: replaceForm.file_url,
                      fileType: replaceForm.file_type,
                      fileSize: replaceForm.file_size
                    });
                  }
                }} className="space-y-4">
                  <div className="space-y-2">
                    <p className="mb-2 text-sm text-slate-600">Replacing: <strong>{docToReplace?.document_name}</strong> (Current v{docToReplace?.currentVersion || 1})</p>
                    <Label htmlFor="replace-upload">New File</Label>
                    <input type="file" onChange={handleReplaceDocUpload} className="hidden" id="replace-upload" />
                    <Button type="button" variant="outline" className="w-full" onClick={() => document.getElementById('replace-upload').click()} disabled={uploadingFile}>
                      <Upload className="w-4 h-4 mr-2" />
                      {uploadingFile ? 'Uploading...' : replaceForm.file_url ? 'Change File' : 'Upload New Version'}
                    </Button>
                    {replaceForm.file_name && <p className="text-sm text-slate-500">Selected file: {replaceForm.file_name}</p>}
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => { setShowReplaceDialog(false); setReplaceForm({ file_url: '', file_name: '', file_type: 'PDF', file_size: 0 }); }}>Cancel</Button>
                    <Button type="submit" isLoading={replaceDocumentVersionMutation.isPending} disabled={!replaceForm.file_url}>
                      {replaceDocumentVersionMutation.isPending ? 'Replacing...' : 'Upload New Version'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            {/* Document History Dialog */}
            <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Version History: {selectedDocHistory?.document_name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                  {documentHistory.length === 0 ? (
                    <p className="py-4 text-sm text-center text-slate-500">No previous versions.</p>
                  ) : (
                    <div className="space-y-3">
                      {documentHistory.map(hist => (
                        <div key={hist.id} className="flex items-center justify-between p-3 border rounded-lg border-slate-200">
                          <div>
                            <p className="font-medium">Version {hist.version}</p>
                            <p className="text-xs text-slate-500">Uploaded {format(!isNaN(Number(hist.createdAt)) ? new Date(Number(hist.createdAt)) : new Date(hist.createdAt), 'PPpp')}</p>
                          </div>
                          <Button size="sm" variant="outline" asChild>
                            <a href={hist.fileUrl} target="_blank" rel="noopener noreferrer">View</a>
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        );
      }

      case 'benefits':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-900">Employee Benefits</h3>
            {isEditing ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="health_insurance"
                    checked={editData.benefits?.health_insurance || false}
                    onCheckedChange={(checked) => setEditData(prev => ({
                      ...prev,
                      benefits: { ...prev.benefits, health_insurance: checked }
                    }))}
                  />
                  <Label htmlFor="health_insurance">Health Insurance</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="life_insurance"
                    checked={editData.benefits?.life_insurance || false}
                    onCheckedChange={(checked) => setEditData(prev => ({
                      ...prev,
                      benefits: { ...prev.benefits, life_insurance: checked }
                    }))}
                  />
                  <Label htmlFor="life_insurance">Life Insurance</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="dental_insurance"
                    checked={editData.benefits?.dental_insurance || false}
                    onCheckedChange={(checked) => setEditData(prev => ({
                      ...prev,
                      benefits: { ...prev.benefits, dental_insurance: checked }
                    }))}
                  />
                  <Label htmlFor="dental_insurance">Dental Insurance</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="gym_membership"
                    checked={editData.benefits?.gym_membership || false}
                    onCheckedChange={(checked) => setEditData(prev => ({
                      ...prev,
                      benefits: { ...prev.benefits, gym_membership: checked }
                    }))}
                  />
                  <Label htmlFor="gym_membership">Gym Membership</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="transportation"
                    checked={editData.benefits?.transportation || false}
                    onCheckedChange={(checked) => setEditData(prev => ({
                      ...prev,
                      benefits: { ...prev.benefits, transportation: checked }
                    }))}
                  />
                  <Label htmlFor="transportation">Transportation</Label>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {Object.entries(employee.benefits || {}).map(([key, value]) => (
                  typeof value === 'boolean' && value && (
                    <div key={key} className="flex items-center gap-3 p-4 rounded-lg bg-green-50">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium capitalize text-slate-900">{key.replace('_', ' ')}</span>
                    </div>
                  )
                ))}
                {!employee.benefits || Object.values(employee.benefits).every(v => !v) && (
                  <div className="col-span-2 py-8 text-center">
                    <Gift className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-slate-500">No benefits assigned</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 'assets':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Assigned Assets</h3>
            </div>

            {assets.length === 0 ? (
              <div className="py-12 text-center">
                <Laptop className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500">No assets assigned</p>
              </div>
            ) : (
              <div className="space-y-3">
                {assets.map(asset => (
                  <div key={asset.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                        <Laptop className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{asset.asset_name}</p>
                        <p className="text-sm text-slate-500">{asset.asset_type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="text-green-700 bg-green-100">{asset.assignment_status || 'Active'}</Badge>
                      <Dialog open={assetToRemove?.id === asset.id} onOpenChange={(open) => !open && setAssetToRemove(null)}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="ghost" onClick={() => setAssetToRemove(asset)}>
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Return Asset</DialogTitle>
                          </DialogHeader>
                          <p>Are you sure you want to return "{assetToRemove?.asset_name}" from {employee.full_name}?</p>
                          <div className="flex justify-end gap-3 mt-4">
                            <Button variant="outline" onClick={() => setAssetToRemove(null)}>Cancel</Button>
                            <Button onClick={() => unassignAssetMutation.mutate(assetToRemove.id)} disabled={unassignAssetMutation.isPending}>
                              {unassignAssetMutation.isPending ? 'Returning...' : 'Return Asset'}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'performance':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-900">Performance Evaluations</h3>

            {evaluations.length === 0 ? (
              <div className="py-12 text-center">
                <TrendingUp className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500">No performance evaluations yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {evaluations.map(evaluation => (
                  <div key={evaluation.id} className="p-5 border rounded-lg bg-slate-50 border-slate-200">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-slate-900">{evaluation.period}</h4>
                          <Badge variant="outline" className="capitalize">
                            {evaluation.evaluation_type.replace('_', ' ')}
                          </Badge>
                          <Badge className={
                            evaluation.status === 'reviewed' ? 'bg-green-100 text-green-700' :
                              evaluation.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                                'bg-yellow-100 text-yellow-700'
                          }>
                            {evaluation.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-500">Evaluated by: {evaluation.evaluator_email}</p>
                      </div>
                      {evaluation.overall_rating > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${i < evaluation.overall_rating
                                    ? 'fill-yellow-500 text-yellow-500'
                                    : 'text-gray-300'
                                  }`}
                              />
                            ))}
                          </div>
                          <span className="font-semibold text-slate-900">{evaluation.overall_rating}/5</span>
                        </div>
                      )}
                    </div>

                    {evaluation.competencies && Object.keys(evaluation.competencies).length > 0 && (
                      <div className="mb-3">
                        <p className="mb-2 text-sm font-medium text-slate-700">Competencies:</p>
                        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                          {Object.entries(evaluation.competencies).map(([key, value]) => (
                            value > 0 && (
                              <div key={key} className="flex items-center justify-between text-sm">
                                <span className="capitalize text-slate-600">{key.replace('_', ' ')}:</span>
                                <span className="font-medium text-slate-900">{value}/5</span>
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                    )}

                    {evaluation.strengths && (
                      <div className="mb-3">
                        <p className="mb-1 text-sm font-medium text-slate-700">Strengths:</p>
                        <p className="text-sm text-slate-600">{evaluation.strengths}</p>
                      </div>
                    )}

                    {evaluation.areas_for_improvement && (
                      <div className="mb-3">
                        <p className="mb-1 text-sm font-medium text-slate-700">Areas for Improvement:</p>
                        <p className="text-sm text-slate-600">{evaluation.areas_for_improvement}</p>
                      </div>
                    )}

                    {evaluation.document_url && (
                      <div className="flex items-center gap-2 pt-3 mt-3 border-t border-slate-200">
                        <FileText className="w-4 h-4 text-slate-500" />
                        <a
                          href={evaluation.document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          View Supporting Document
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'notes':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Notes</h3>
            {isEditing ? (
              <Textarea
                value={editData.notes || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))}
                rows={10}
                placeholder="Add notes about this employee..."
                className="w-full"
              />
            ) : (
              <div className="p-4 bg-slate-50 rounded-lg min-h-[200px]">
                <p className="whitespace-pre-wrap text-slate-700">{employee.notes || 'No notes yet'}</p>
              </div>
            )}
          </div>
        );

      case 'onboarding':
        return (
          <div className="space-y-6">
            <OnboardingProgressWidget
              employeeId={employeeId}
              employee={employee}
              onCompleteAction={() => {
                setActiveSection('job');
                setIsEditing(true);
                setEditData(prev => ({ ...prev, employment_status: 'PROBATION' }));
              }}
              onSetToActive={() => {
                setActiveSection('job');
                setIsEditing(true);
                setEditData(prev => ({ ...prev, employment_status: 'ACTIVE' }));
              }}
              onBeginOffboarding={() => {
                setActiveSection('job');
                setIsEditing(true);
                setEditData(prev => ({ ...prev, employment_status: 'OFFBOARDED' }));
              }}
            />
            <TaskManager employeeId={employeeId} tasks={employee.onboardingTasks || []} />
          </div>
        );

      default:
        return (
          <div className="py-12 text-center">
            <p className="text-slate-500">Section under development</p>
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="p-8 text-center bg-white border border-red-200 shadow rounded-xl">
          <h2 className="mb-2 text-xl font-semibold text-red-600">Error Loading Employee</h2>
          <p className="mb-4 text-slate-600">{error?.message || "Failed to fetch employee details"}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="p-8 text-center bg-white border shadow rounded-xl border-slate-200">
          <h2 className="mb-2 text-xl font-semibold text-slate-800">Employee Not Found</h2>
          <p className="mb-4 text-slate-600">The employee you're looking for doesn't exist or you don't have access.</p>
        </div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 }
    }
  };

  const content = (
    <motion.div variants={itemVariants} className={`w-full ${isModal ? 'h-full flex flex-col flex-1 min-h-0' : ''}`}>
      <Card className={`border-slate-200/60 overflow-hidden ${isModal ? 'shadow-none border-0 h-full rounded-none flex flex-col bg-white flex-1 min-h-0' : 'shadow-xl shadow-slate-200/40 rounded-2xl bg-white/70 backdrop-blur-md'}`}>
        <div className="relative text-white border-b bg-slate-900 border-slate-800">
          {/* Subtle background pattern/gradient */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 w-64 h-64 -mt-20 -mr-20 rounded-full bg-indigo-500/10 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -mb-20 -ml-20 rounded-full w-80 h-80 bg-blue-500/10 blur-3xl"></div>
          </div>

          <div className="relative z-10 flex flex-col items-start justify-between gap-4 p-6 md:flex-row md:items-center md:p-8">
            <div className="flex items-center gap-5">
              <div className="flex items-center justify-center w-20 h-20 overflow-hidden border shadow-xl bg-slate-800 rounded-2xl border-slate-700 shrink-0">
                {employee.avatar_url ? (
                  <img src={employee.avatar_url} alt={employee.full_name} className="object-cover w-full h-full" />
                ) : (
                  <span className="text-3xl font-bold text-indigo-400">
                    {employee.full_name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white">{employee.full_name}</h2>
                <div className="flex items-center gap-3 mt-1.5 text-slate-400 flex-wrap">
                  <span className="flex items-center gap-1.5 text-sm"><Briefcase className="w-4 h-4" /> {employee.job_title}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                  <span className="flex items-center gap-1.5 text-sm"><Mail className="w-4 h-4" /> {employee.email}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* <Button variant="outline" className="hidden bg-transparent border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 sm:flex">
                <MessageSquare className="w-4 h-4 mr-2" /> Message
              </Button> */}
              {['HR_ADMIN', 'SUPER_ADMIN'].includes(user?.role) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-800">
                      <MoreVertical className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Employee Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {employee.employment_status === 'ACTIVE' && (
                      <DropdownMenuItem onClick={() => {
                        setPromoteForm({ jobTitle: employee.job_title || '', departmentId: employee.department_id || '' });
                        setShowPromoteDialog(true);
                      }}>
                        Promote Employee
                      </DropdownMenuItem>
                    )}
                    {employee.employment_status !== 'SUSPENDED' && (
                      <DropdownMenuItem onClick={() => setShowSuspendDialog(true)} className="text-amber-600 focus:text-amber-600 focus:bg-amber-50">
                        Suspend Employee
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => setShowProbationDialog(true)}>
                      Place on Probation
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowOffboardDialog(true)} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                      Offboard Employee
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>

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
              <Button
                variant="outline"
                onClick={() => {
                  if (isEditing) {
                    handleSave();
                  } else {
                    setIsEditing(true);
                  }
                }}
                className="gap-2"
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

            {canApprove && isPendingApprovalOrDraft && (
              <div className="mb-6">
                <Card className="overflow-hidden border-blue-200 shadow-sm bg-blue-50/90 rounded-xl">
                  <CardContent className="flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center">
                    <div>
                      <h3 className="flex items-center gap-2 font-semibold text-blue-950">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
                        {isDraft ? "Draft Employee Profile" : "Pending Profile Approval"}
                      </h3>
                      <p className="mt-1 text-sm text-blue-800">
                        {isDraft
                          ? "This employee profile is currently in Draft status. You can review their details and approve/activate their profile to change their status to Active."
                          : "This employee has completed their profile data and submitted it for review. Approve to activate their profile, or request revisions."}
                      </p>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0">
                      <Button
                        variant="outline"
                        className="text-red-700 border-red-200 hover:bg-red-50 hover:text-red-800"
                        onClick={() => setShowRejectProfileDialog(true)}
                      >
                        Request Revision
                      </Button>
                      <Button
                        className="text-white bg-blue-600 shadow-sm hover:bg-blue-700"
                        disabled={isApprovingProfile}
                        onClick={async () => {
                          try {
                            setIsApprovingProfile(true);
                            await approvalsApi.approveEmployee(employeeId);
                            toast.success("Employee profile approved and activated!");
                            queryClient.invalidateQueries({ queryKey: ['employee', employeeId] });
                            queryClient.invalidateQueries({ queryKey: ['employees'] });
                            // Pending-counts badge (Layout.jsx) updates live via usePendingApprovalsStream (SSE) now.
                          } catch (err) {
                            toast.error(extractErrorMessage(err, "Failed to approve employee data."));
                            console.error(err);
                          } finally {
                            setIsApprovingProfile(false);
                          }
                        }}
                      >
                        {isApprovingProfile ? "Approving..." : "Approve & Activate Profile"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}



            {renderContent()}
          </div>
        </div>
      </Card>

      <Dialog open={showPromoteDialog} onOpenChange={setShowPromoteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Promote Employee</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>New Job Title</Label>
              <Input
                value={promoteForm.jobTitle}
                onChange={(e) => setPromoteForm({ ...promoteForm, jobTitle: e.target.value })}
                placeholder="e.g. Senior Software Engineer"
              />
              {employee.job_title && <p className="mt-1 text-xs text-slate-500">Current: {employee.job_title}</p>}
            </div>
            <div className="space-y-2">
              <Label>New Department</Label>
              <Select
                value={promoteForm.departmentId}
                onValueChange={(value) => setPromoteForm({ ...promoteForm, departmentId: value })}
              >
                <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                <SelectContent>
                  {departments.map(dept => (
                    <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {employee.department_name && <p className="mt-1 text-xs text-slate-500">Current: {employee.department_name}</p>}
            </div>

            <div className="space-y-2">
              <Label>New Class</Label>
              <Select
                value={promoteForm.employeeClass}
                onValueChange={(value) => setPromoteForm({ ...promoteForm, employeeClass: value })}
              >
                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  {employeeClasses.map((employeeClass) => (
                    <SelectItem key={employeeClass.value} value={employeeClass.value}>{employeeClass.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {employee.employeeClass && <p className="mt-1 text-xs text-slate-500">Current: {employee.employeeClass}</p>}
            </div>
            <div className="flex items-center mt-4 space-x-2">
              <Checkbox
                id="isHead"
                checked={promoteForm.isHeadOfDepartment}
                onCheckedChange={(checked) => setPromoteForm({ ...promoteForm, isHeadOfDepartment: checked })}
              />
              <label htmlFor="isHead" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Appoint as Head of Department
              </label>
            </div>
            <div className="space-y-2">
              <Label>Effective Date</Label>
              <Input
                type="date"
                value={promoteForm.effectiveDate}
                onChange={(e) => setPromoteForm({ ...promoteForm, effectiveDate: e.target.value })}
              />
            </div>

            <Button
              onClick={() => {
                requestPromotionMutation.mutate({
                  employeeId: employee.id,
                  newJobTitle: promoteForm.jobTitle || undefined,
                  newDepartmentId: promoteForm.departmentId || undefined,
                  newEmployeeClass: promoteForm.employeeClass || undefined,
                  isHeadOfDepartment: promoteForm.isHeadOfDepartment,
                  effectiveDate: promoteForm.effectiveDate
                });
              }}
              disabled={requestPromotionMutation.isPending || (!promoteForm.jobTitle && !promoteForm.employeeClass)}
              className="w-full text-white bg-indigo-600 hover:bg-indigo-700"
            >
              {requestPromotionMutation.isPending ? 'Requesting...' : 'Confirm Promotion'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Suspend Employee</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input type="date" value={suspendForm.startDate} onChange={e => setSuspendForm({ ...suspendForm, startDate: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input type="date" value={suspendForm.endDate} onChange={e => setSuspendForm({ ...suspendForm, endDate: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea value={suspendForm.reason} onChange={e => setSuspendForm({ ...suspendForm, reason: e.target.value })} placeholder="Reason for suspension..." />
            </div>
            <div className="flex items-center py-2 space-x-2">
              <Checkbox id="sa-approve" checked={suspendForm.superAdminApproved} onCheckedChange={c => setSuspendForm({ ...suspendForm, superAdminApproved: !!c })} />
              <Label htmlFor="sa-approve">Super Admin Approved</Label>
            </div>
            <Button
              onClick={() => {
                if (!suspendForm.superAdminApproved) return toast.error('Super Admin approval is required.');
                if (!suspendForm.startDate || !suspendForm.endDate || !suspendForm.reason) return toast.error('Please fill all fields.');
                suspendEmployeeMutation.mutate({
                  id: employee.id,
                  data: {
                    startDate: suspendForm.startDate,
                    endDate: suspendForm.endDate,
                    reason: suspendForm.reason,
                    superAdminApproved: suspendForm.superAdminApproved
                  }
                });
                setShowSuspendDialog(false);
              }}
              disabled={suspendEmployeeMutation.isPending || !suspendForm.superAdminApproved}
              className="w-full text-white bg-amber-600 hover:bg-amber-700"
            >
              Confirm Suspension
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showOffboardDialog} onOpenChange={setShowOffboardDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Offboard Employee</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Exit Type</Label>
              <Select value={offboardForm.type} onValueChange={v => setOffboardForm({ ...offboardForm, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="RESIGNATION">Resigned</SelectItem>
                  <SelectItem value="TERMINATION">Terminated / Fired</SelectItem>
                  <SelectItem value="RETIREMENT">Retirement</SelectItem>
                  <SelectItem value="CONTRACT_EXPIRATION">Contract Expiration</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Exit Date</Label>
              <Input type="date" value={offboardForm.exitDate} onChange={e => setOffboardForm({ ...offboardForm, exitDate: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea value={offboardForm.reason} onChange={e => setOffboardForm({ ...offboardForm, reason: e.target.value })} placeholder="Reason for leaving..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOffboardDialog(false)}>Cancel</Button>
            <Button
              className="text-white bg-red-600 hover:bg-red-700"
              onClick={() => {
                requestOffboardingMutation.mutate({
                  id: employee.id,
                  data: {
                    exitType: offboardForm.type,
                    exitDate: offboardForm.exitDate,
                    reason: offboardForm.reason
                  }
                }, {
                  onSuccess: () => setShowOffboardDialog(false)
                });
              }}
              disabled={requestOffboardingMutation.isPending}
            >
              {requestOffboardingMutation.isPending ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showProbationDialog} onOpenChange={setShowProbationDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Place on Probation</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={probationForm.startDate}
                onChange={(e) => setProbationForm({ ...probationForm, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={probationForm.endDate}
                onChange={(e) => setProbationForm({ ...probationForm, endDate: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProbationDialog(false)}>Cancel</Button>
            <Button
              className="text-white bg-indigo-600 hover:bg-indigo-700"
              onClick={() => {
                requestProbationMutation.mutate({
                  data: {
                    employeeId: employee.id,
                    startDate: probationForm.startDate,
                    endDate: probationForm.endDate
                  }
                }, {
                  onSuccess: () => setShowProbationDialog(false)
                });
              }}
              disabled={requestProbationMutation.isPending}
            >
              {requestProbationMutation.isPending ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRejectProfileDialog} onOpenChange={setShowRejectProfileDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request Profile Revision</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-slate-600">
              Provide feedback for the employee on what details need to be corrected or updated. Their profile status will return to Draft.
            </p>
            <div className="space-y-2">
              <Label>Reason for Revision</Label>
              <Textarea
                placeholder="e.g. Please provide a clear national ID number and valid private email..."
                value={rejectProfileReason}
                onChange={(e) => setRejectProfileReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectProfileDialog(false)}>Cancel</Button>
            <Button
              className="text-white bg-red-600 hover:bg-red-700"
              disabled={isRejectingProfile}
              onClick={async () => {
                try {
                  setIsRejectingProfile(true);
                  await approvalsApi.rejectEmployee(employeeId, rejectProfileReason);
                  toast.success("Revision requested and profile returned to draft.");
                  setShowRejectProfileDialog(false);
                  setRejectProfileReason('');
                  queryClient.invalidateQueries({ queryKey: ['employee', employeeId] });
                  queryClient.invalidateQueries({ queryKey: ['employees'] });
                  // Pending-counts badge (Layout.jsx) updates live via usePendingApprovalsStream (SSE) now.
                } catch (err) {
                  toast.error(extractErrorMessage(err, "Failed to request profile revision."));
                  console.error(err);
                } finally {
                  setIsRejectingProfile(false);
                }
              }}
            >
              {isRejectingProfile ? "Submitting..." : "Send Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );

  if (isModal) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="h-[85vh] flex flex-col relative bg-white w-full rounded-2xl overflow-hidden"
      >
        {onClose && (
          <Button variant="ghost" size="icon" className="absolute z-50 transition-all border rounded-full shadow-sm top-4 right-4 text-slate-400 hover:text-white hover:bg-slate-800 bg-slate-900/50 backdrop-blur-sm border-slate-700" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        )}
        {content}
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-indigo-50 via-white to-blue-50 md:p-8">
      <motion.div
        className="mx-auto space-y-6 max-w-7xl"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <Button variant="ghost" onClick={() => navigate(PAGE_ROUTES.EMPLOYEES)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Employees
          </Button>
        </motion.div>
        {content}
      </motion.div>
    </div>
  );
}