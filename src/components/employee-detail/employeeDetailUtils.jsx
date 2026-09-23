import React from "react";
import { format as dateFnsFormat } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  User, Briefcase, CheckCircle, FileText, DollarSign,
  Calendar, Gift, Laptop, TrendingUp, StickyNote
} from "lucide-react";

export const format = (dateInput, formatStr) => {
  try {
    if (!dateInput) return 'N/A';
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return dateFnsFormat(date, formatStr);
  } catch (e) {
    return 'Invalid Date';
  }
};

export const parseSafeDate = (d) => {
  if (!d) return '';
  const asNum = Number(d);
  const parsed = new Date(isNaN(asNum) ? d : asNum);
  return isNaN(parsed.getTime()) ? '' : parsed.toISOString().split('T')[0];
};

export const menuItems = [
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

export const isEmployeeEligibleForHrAdmin = (e) => {
  if (!e) return false;
  const status = (e.employmentStatus || e.employment_status || '').toUpperCase();
  const onboardingStatus = (e.onboardingStatus || e.onboarding_status || '').toUpperCase();
  const progress = e.onboardingProgress ?? e.onboarding_progress ?? 0;
  const isActive = status === 'ACTIVE';
  const hasFinishedOnboarding = onboardingStatus === 'COMPLETED' || progress === 100;
  return Boolean(isActive && hasFinishedOnboarding);
};

export const mapEmployeeData = (e) => {
  if (!e) return null;
  const fullName = e.fullName || e.full_name || `${e.firstName || ''} ${e.lastName || ''}`.trim();
  const rawRole = e.role || e.systemRole || 'EMPLOYEE';
  const isEligible = isEmployeeEligibleForHrAdmin(e);
  return {
    ...e,
    id: e._id || e.id,
    full_name: fullName,
    fullName: fullName,
    role: rawRole,
    systemRole: rawRole,
    isHrAdmin: Boolean(e.isHrAdmin || rawRole === 'HR_ADMIN'),
    isSuperAdmin: Boolean(e.isSuperAdmin || rawRole === 'SUPER_ADMIN' || e.isOrgOwner),
    isEligibleForHrAdmin: isEligible,
    onboarding_status: e.onboardingStatus || e.onboarding_status || 'NOT_STARTED',
    onboarding_progress: e.onboardingProgress ?? e.onboarding_progress ?? 0,
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
      gosi_number: e.payrollInfo?.gosiNumber ?? e.payroll_details?.gosi_number ?? e.pensionId ?? '',
      pay_grade: e.payrollInfo?.payGrade ?? ''
    },
    allowances: Array.isArray(e.allowances) ? e.allowances : [],
    contract_details: e.contract_details || {},
    promotion_history: e.promotionHistory || e.promotion_history || [],
    status_history: e.statusHistory || e.status_history || []
  };
};

export const formatStatusDate = (d) => {
  if (!d) return 'N/A';
  const num = Number(d);
  const parsed = !isNaN(num) && num > 0 ? new Date(num) : new Date(d);
  return isNaN(parsed.getTime()) ? 'N/A' : parsed.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

export const renderStatusHistoryBadge = (status, isNew = false) => {
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

export const PremiumField = ({ icon: Icon, label, value, action }) => (
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

export const getEmployeeDirtyPayload = (original, current) => {
  if (!original || !current) return {};
  const dirty = {};

  // 1. Contact / Core fields
  const origPhone = (original.phone || '').trim();
  const currPhone = (current.phone || '').trim();
  if (origPhone !== currPhone) {
    dirty.phone = currPhone;
  }

  const origPrivateEmail = (original.private_email || original.privateEmail || '').trim();
  const currPrivateEmail = (current.private_email || current.privateEmail || '').trim();
  if (origPrivateEmail !== currPrivateEmail) {
    dirty.privateEmail = currPrivateEmail;
  }

  // 2. Personal Info
  const origDob = parseSafeDate(original.personal_info?.date_of_birth || original.dateOfBirth);
  const currDob = parseSafeDate(current.personal_info?.date_of_birth);
  if (origDob !== currDob) {
    dirty.dateOfBirth = currDob || null;
  }

  const origGender = (original.personal_info?.gender || original.gender || '').toLowerCase();
  const currGender = (current.personal_info?.gender || '').toLowerCase();
  if (origGender !== currGender) {
    dirty.gender = current.personal_info?.gender;
  }

  const origMarital = (original.personal_info?.marital_status || original.maritalStatus || '').toLowerCase();
  const currMarital = (current.personal_info?.marital_status || '').toLowerCase();
  if (origMarital !== currMarital) {
    dirty.maritalStatus = current.personal_info?.marital_status;
  }

  const origNationality = (original.personal_info?.nationality || original.nationality || '').trim();
  const currNationality = (current.personal_info?.nationality || '').trim();
  if (origNationality !== currNationality) {
    dirty.nationality = current.personal_info?.nationality;
  }

  const origNationalId = (original.personal_info?.national_id || original.nationalId || '').trim();
  const currNationalId = (current.personal_info?.national_id || '').trim();
  if (origNationalId !== currNationalId) {
    dirty.nationalId = current.personal_info?.national_id;
  }

  const origIqama = (original.personal_info?.iqama_number || original.passportNumber || '').trim();
  const currIqama = (current.personal_info?.iqama_number || '').trim();
  if (origIqama !== currIqama) {
    dirty.passportNumber = current.personal_info?.iqama_number;
  }

  // 3. Job Data
  const origJobTitle = (original.job_title || original.jobTitle || '').trim();
  const currJobTitle = (current.job_title || '').trim();
  if (origJobTitle !== currJobTitle) {
    dirty.jobTitle = currJobTitle;
  }

  const origDept = (original.department_id || original.departmentId || '').toString();
  const currDept = (current.department_id || '').toString();
  if (origDept !== currDept) {
    dirty.departmentId = currDept || null;
  }

  const origManager = (original.manager_id || original.managerId || '').toString();
  const currManager = current.manager_id === 'NONE' ? '' : (current.manager_id || '').toString();
  if (origManager !== currManager) {
    dirty.managerId = currManager || null;
  }

  const origEmploymentType = (original.employment_type || original.employmentType || '').toUpperCase();
  const currEmploymentType = (current.employment_type || '').toUpperCase();
  if (origEmploymentType !== currEmploymentType) {
    dirty.employmentType = current.employment_type;
  }

  const origEmploymentStatus = (original.employment_status || original.employmentStatus || '').toUpperCase();
  const currEmploymentStatus = (current.employment_status || '').toUpperCase();
  if (origEmploymentStatus !== currEmploymentStatus) {
    dirty.employmentStatus = current.employment_status;
    if (current.status_change_reason) {
      dirty.reason = current.status_change_reason;
    }
  }

  const origEmployeeClass = (original.employeeClass || original.employee_class || '').toUpperCase();
  const currEmployeeClass = (current.employeeClass || '').toUpperCase();
  if (origEmployeeClass !== currEmployeeClass) {
    dirty.employeeClass = current.employeeClass;
  }

  const origStartDate = parseSafeDate(original.start_date || original.hireDate);
  const currStartDate = parseSafeDate(current.start_date);
  if (origStartDate !== currStartDate) {
    dirty.hireDate = currStartDate || null;
  }

  const origProbationStart = parseSafeDate(original.probation_start_date || original.probationStartDate);
  const currProbationStart = parseSafeDate(current.probation_start_date);
  if (origProbationStart !== currProbationStart) {
    dirty.probationStartDate = currProbationStart || null;
  }

  const origProbationEnd = parseSafeDate(original.probation_end_date || original.probationEndDate);
  const currProbationEnd = parseSafeDate(current.probation_end_date);
  if (origProbationEnd !== currProbationEnd) {
    dirty.probationEndDate = currProbationEnd || null;
  }

  // 4. Payroll Details
  const origSalary = Number(original.payroll_details?.basic_salary ?? original.payrollInfo?.basicSalary ?? 0);
  const currSalary = Number(current.payroll_details?.basic_salary ?? 0);
  if (origSalary !== currSalary) {
    dirty.basicSalary = currSalary;
    if (current.payroll_details?.salary_change_reason) {
      dirty.salaryChangeReason = current.payroll_details.salary_change_reason;
    }
  }

  const origBank = (original.payroll_details?.bank_name || original.payrollInfo?.bankName || '').trim();
  const currBank = (current.payroll_details?.bank_name || '').trim();
  if (origBank !== currBank) {
    dirty.bankName = currBank;
  }

  const origIban = (original.payroll_details?.iban || original.payrollInfo?.iban || '').trim();
  const currIban = (current.payroll_details?.iban || '').trim();
  if (origIban !== currIban) {
    dirty.iban = currIban;
  }

  const origPayGrade = (original.payroll_details?.pay_grade || original.payrollInfo?.payGrade || '').trim();
  const currPayGrade = (current.payroll_details?.pay_grade || '').trim();
  if (origPayGrade !== currPayGrade) {
    dirty.payGrade = currPayGrade;
  }

  // 5. Allowances
  const origAllowances = JSON.stringify(original.allowances || []);
  const currAllowances = JSON.stringify(current.allowances || []);
  if (origAllowances !== currAllowances && Array.isArray(current.allowances)) {
    dirty.allowances = current.allowances;
  }

  // Clean out any undefined values
  Object.keys(dirty).forEach(k => dirty[k] === undefined && delete dirty[k]);

  return dirty;
};

