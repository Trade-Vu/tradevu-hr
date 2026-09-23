import React, { useMemo } from "react";
import {
  Briefcase, Building, FileText, Shield, CheckCircle,
  Calendar, User, ShieldCheck
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  PremiumField,
  format,
  formatStatusDate,
  renderStatusHistoryBadge,
  isEmployeeEligibleForHrAdmin
} from "../employeeDetailUtils";

const EMPLOYMENT_STATUS_OPTIONS = [
  { value: "DRAFT", label: "Draft" },
  { value: "PENDING_APPROVAL", label: "Pending Approval" },
  { value: "PENDING_ONBOARDING", label: "Pending Onboarding" },
  { value: "ONGOING_ONBOARDING", label: "Ongoing Onboarding" },
  { value: "PROBATION", label: "Probation" },
  { value: "ACTIVE", label: "Active" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "RESIGNED", label: "Resigned" },
  { value: "TERMINATED", label: "Terminated" },
  { value: "OFFBOARDED", label: "Offboarded" },
  { value: "ARCHIVED", label: "Archived" },
];

function FormField({ label, className = "", children }) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function FormInput({ label, value, onChange, type = "text", placeholder, className = "" }) {
  return (
    <FormField label={label} className={className}>
      <Input
        type={type}
        placeholder={placeholder}
        value={value || ''}
        onChange={onChange}
      />
    </FormField>
  );
}

function FormSelect({ label, value, onValueChange, placeholder, options = [], className = "" }) {
  return (
    <FormField label={label} className={className}>
      <Select value={value || ''} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormField>
  );
}

function HistoryTable({ title, columns, data = [], emptyText, rowKey }) {
  return (
    <div className="space-y-4">
      <h4 className="font-medium text-slate-800">{title}</h4>
      {data && data.length > 0 ? (
        <div className="overflow-hidden bg-white border rounded-lg shadow-sm border-slate-200">
          <table className="w-full text-sm text-left">
            <thead className="border-b bg-slate-50 border-slate-200 text-slate-700">
              <tr>
                {columns.map((col, idx) => (
                  <th key={idx} className={`px-4 py-3 font-medium ${col.headerClassName || ''}`}>
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((item, rowIdx) => (
                <tr key={rowKey ? rowKey(item, rowIdx) : rowIdx} className="transition-colors hover:bg-slate-50/50">
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className={`px-4 py-3 ${col.className || ''}`}>
                      {col.render ? col.render(item, rowIdx) : item[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-4 text-sm border rounded-lg border-slate-200 bg-slate-50 text-slate-500">
          {emptyText}
        </div>
      )}
    </div>
  );
}

export default function JobDataTab({
  employee,
  isEditing,
  editData,
  setEditData,
  departments = [],
  employeeClasses = [],
  employees = [],
  isSuperAdmin,
  onReassignHrAdmin,
}) {
  const isEligibleForHr = isEmployeeEligibleForHrAdmin(employee);

  const departmentOptions = useMemo(
    () => departments.map(d => ({ value: d.id, label: d.name })),
    [departments]
  );

  const managerOptions = useMemo(() => [
    { value: "NONE", label: "No Manager" },
    ...employees
      .filter(e => e.id !== employee.id)
      .map(emp => ({
        value: emp.id,
        label: `${emp.full_name} - ${emp.job_title}`
      }))
  ], [employees, employee.id]);

  const readOnlyFields = [
    { icon: Briefcase, label: "Job Title", value: employee.job_title },
    { icon: Building, label: "Department", value: employee.department_name || employee.department_id || 'Not assigned' },
    { icon: FileText, label: "Employment Type", value: employee.employment_type?.replace('_', ' ') },
    { icon: Shield, label: "Employee Class", value: employee.employeeClass || 'Permanent' },
    {
      icon: CheckCircle,
      label: "Employment Status",
      value: (
        <Badge className="text-green-700 bg-green-100 hover:bg-green-200">
          {employee.employment_status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </Badge>
      )
    },
    {
      icon: Calendar,
      label: "Start Date",
      value: employee.start_date ? format(new Date(employee.start_date), 'MMM dd, yyyy') : 'Not set'
    },
    { icon: User, label: "Reports To", value: employee.manager_email || 'Not assigned' },
    {
      icon: ShieldCheck,
      label: "System Role",
      value: (
        <Badge className={employee.isHrAdmin ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : employee.isSuperAdmin ? 'bg-purple-100 text-purple-800 border-purple-200' : 'bg-slate-100 text-slate-700 border-slate-200'}>
          {employee.isHrAdmin ? 'HR Admin' : employee.isSuperAdmin ? 'Super Admin' : 'Employee'}
        </Badge>
      )
    },
  ];

  const promotionColumns = [
    {
      header: "Date",
      className: "text-slate-600",
      render: (ph) => new Date(ph.createdAt).toLocaleDateString(),
    },
    {
      header: "Previous",
      className: "text-slate-600",
      render: (ph) => (
        <div>
          <div>{ph.previousTitle}</div>
          <div className="text-xs text-slate-400">{ph.previousGrade}</div>
        </div>
      ),
    },
    {
      header: "New",
      className: "font-medium text-slate-900",
      render: (ph) => (
        <div>
          <div>{ph.newTitle}</div>
          <div className="text-xs text-slate-500">{ph.newGrade}</div>
        </div>
      ),
    },
    {
      header: "Approved By",
      className: "text-slate-500",
      render: (ph) => ph.approvedBy || 'System',
    },
  ];

  const statusColumns = [
    {
      header: "Date",
      className: "font-mono text-xs text-slate-600",
      render: (sh) => formatStatusDate(sh.createdAt || sh.date || sh.timestamp || sh.updatedAt),
    },
    {
      header: "Previous Status",
      className: "text-slate-600",
      render: (sh) => renderStatusHistoryBadge(sh.previousStatus || sh.from || 'N/A', false),
    },
    {
      header: "New Status",
      render: (sh) => renderStatusHistoryBadge(sh.newStatus || sh.to || 'N/A', true),
    },
    {
      header: "Reason",
      className: "text-xs text-slate-600",
      render: (sh) => sh.reason || 'N/A',
    },
  ];

  const sortedStatusHistory = useMemo(() => {
    if (!employee.status_history || employee.status_history.length === 0) return [];
    return [...employee.status_history].sort((a, b) => {
      const dateB = new Date(Number(b.createdAt || b.date) || b.createdAt || b.date || 0);
      const dateA = new Date(Number(a.createdAt || a.date) || a.createdAt || a.date || 0);
      return dateB - dateA;
    });
  }, [employee.status_history]);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-900">Job Information</h3>

      {isEditing ? (
        <div className="grid gap-6 md:grid-cols-2">
          <FormInput
            label="Job Title"
            value={editData.job_title}
            onChange={(e) => setEditData(prev => ({ ...prev, job_title: e.target.value }))}
          />

          <FormSelect
            label="Department"
            placeholder="Select department"
            value={editData.department_id}
            onValueChange={(value) => setEditData(prev => ({ ...prev, department_id: value }))}
            options={departmentOptions}
          />

          <FormSelect
            label="Employment Class"
            placeholder="Select class"
            value={editData.employeeClass || 'PERMANENT'}
            onValueChange={(value) => setEditData(prev => ({ ...prev, employeeClass: value }))}
            options={employeeClasses}
          />

          <FormSelect
            label="Employment Status"
            value={editData.employment_status || 'ACTIVE'}
            onValueChange={(value) => setEditData(prev => ({ ...prev, employment_status: value }))}
            options={EMPLOYMENT_STATUS_OPTIONS}
          />

          <FormInput
            label="Start Date"
            type="date"
            value={editData.start_date}
            onChange={(e) => setEditData(prev => ({ ...prev, start_date: e.target.value }))}
          />

          {editData.employment_status === 'PROBATION' && (
            <>
              <FormInput
                label="Probation Start Date"
                type="date"
                value={editData.probation_start_date}
                onChange={(e) => setEditData(prev => ({ ...prev, probation_start_date: e.target.value }))}
              />
              <FormInput
                label="Probation End Date"
                type="date"
                value={editData.probation_end_date}
                onChange={(e) => setEditData(prev => ({ ...prev, probation_end_date: e.target.value }))}
              />
            </>
          )}

          {editData.employment_status !== employee.employment_status && (
            <FormInput
              label="Reason for Status Change"
              placeholder="e.g. Performance review, promotion, probation completion..."
              className="md:col-span-2"
              value={editData.status_change_reason}
              onChange={(e) => setEditData(prev => ({ ...prev, status_change_reason: e.target.value }))}
            />
          )}

          <FormSelect
            label="Reports To (Manager)"
            placeholder="Select manager"
            value={editData.manager_id}
            onValueChange={(value) => setEditData(prev => ({ ...prev, manager_id: value === 'NONE' ? '' : value }))}
            options={managerOptions}
          />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {readOnlyFields.map((field, idx) => (
            <PremiumField key={idx} icon={field.icon} label={field.label} value={field.value} />
          ))}

          {(isSuperAdmin && isEligibleForHr) && <div className="md:col-span-2 mt-2">
            <div className="p-4 rounded-xl border border-slate-200/80 bg-gradient-to-r from-slate-50 to-indigo-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-lg shrink-0 ${employee.isHrAdmin ? 'bg-emerald-100 text-emerald-700' : employee.isSuperAdmin ? 'bg-purple-100 text-purple-700' : 'bg-indigo-100 text-indigo-700'}`}>
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-semibold text-slate-900">System Role & Permissions</h4>
                    <Badge className={employee.isHrAdmin ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : employee.isSuperAdmin ? 'bg-purple-100 text-purple-800 border-purple-200' : 'bg-slate-100 text-slate-700 border-slate-200'}>
                      {employee.isHrAdmin ? 'HR Admin' : employee.isSuperAdmin ? 'Super Admin' : 'Employee'}
                    </Badge>
                    {!employee.isHrAdmin && !employee.isSuperAdmin && (
                      <Badge variant="outline" className={isEligibleForHr ? "text-emerald-700 border-emerald-200 bg-emerald-50 text-[10px]" : "text-amber-700 border-amber-200 bg-amber-50 text-[10px]"}>
                        {isEligibleForHr ? "Eligible for HR Admin" : "Ineligible for HR Admin (Requires ACTIVE & Completed Onboarding)"}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {employee.isHrAdmin
                      ? 'Has full administrative authority across Human Resources, workforce management, onboarding, leaves, and departments.'
                      : employee.isSuperAdmin
                        ? 'Organization Owner / Super Admin with full workspace controls.'
                        : isEligibleForHr
                          ? 'Active employee with completed onboarding. Eligible to be assigned as HR Admin.'
                          : `Standard employee workspace. Ineligible to be HR Admin: must be ACTIVE and have finished onboarding on the platform (Current status: ${employee.employment_status || 'Inactive'}, Onboarding: ${employee.onboarding_status || 'Incomplete'}).`}
                  </p>
                </div>
              </div>
              {isSuperAdmin && !employee.isSuperAdmin && isEligibleForHr && (
                <Button
                  size="sm"
                  variant={employee.isHrAdmin ? "outline" : "default"}
                  className={
                    employee.isHrAdmin
                      ? "border-slate-300 text-slate-700 hover:bg-slate-100 shrink-0"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 shadow-sm"
                  }
                  onClick={onReassignHrAdmin}
                >
                  <ShieldCheck className="w-4 h-4 mr-1.5" />
                  {employee.isHrAdmin ? 'Reassign HR Admin' : 'Reassign as HR Admin'}
                </Button>
              )}
            </div>
          </div>}
        </div>
      )}

      {!isEditing && (
        <div className="pt-8 mt-8 border-t border-slate-100 space-y-8">
          <HistoryTable
            title="Promotion History"
            columns={promotionColumns}
            data={employee.promotion_history}
            emptyText="No promotion history found."
            rowKey={(ph) => ph.id}
          />

          <HistoryTable
            title="Status History"
            columns={statusColumns}
            data={sortedStatusHistory}
            emptyText="No status history found."
            rowKey={(sh, idx) => sh.id || sh._id || `sh-${idx}`}
          />
        </div>
      )}
    </div>
  );
}
