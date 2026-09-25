import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Mail, Briefcase, Calendar, FileText, UserCheck } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { organizationsApi, employeesApi } from '@/api';
import { normalizeEmployeeClasses } from '@/lib/formOptions';
import { toast } from 'sonner';

export default function AddEmployeeForm({ templates = [], departments = [], onSubmit, onCancel, isSubmitting }) {
  const { data: orgData } = useQuery({
    queryKey: ['organization', 'me'],
    queryFn: async () => {
      const res = await organizationsApi.getMyOrganization();
      return res?.data || res;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: rawEmployees = [], isLoading: loadingEmployees } = useQuery({
    queryKey: ['allEmployees'],
    queryFn: async () => {
      const res = await employeesApi.getAllEmployees();
      return Array.isArray(res) ? res : res?.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const allEmployees = useMemo(() => {
    return (Array.isArray(rawEmployees) ? rawEmployees : []).map(emp => ({
      ...emp,
      id: String(emp._id || emp.id),
      fullName: emp.fullName || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.email,
      jobTitle: emp.jobTitle || emp.job_title || '',
      departmentId: emp.departmentId?._id || emp.departmentId?.id || emp.departmentId,
      status: (emp.employmentStatus || emp.status || '').toUpperCase(),
    }));
  }, [rawEmployees]);

  const employeeClasses = normalizeEmployeeClasses(orgData?.employeeClasses);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    job_title: "",
    department_id: "",
    manager_id: "",
    template_id: "",
    start_date: "",
    status: "not_started",
    progress_percentage: 0,
    employment_type: "FULL_TIME",
    employeeClass: ""
  });

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email?.trim() || '');
  const isFormValid = Boolean(
    formData.full_name?.trim() &&
    isEmailValid &&
    formData.start_date &&
    formData.job_title?.trim() &&
    formData.department_id &&
    formData.employeeClass
  );

  const selectedDepartment = useMemo(() => {
    if (!formData.department_id) return null;
    return departments.find(d => String(d.id || d._id) === String(formData.department_id)) || null;
  }, [departments, formData.department_id]);

  const selectedDeptHead = useMemo(() => {
    if (!selectedDepartment?.managerId) return null;
    const head = selectedDepartment.managerId;
    const headId = String(head._id || head.id || (typeof head === 'string' ? head : ''));
    if (!headId) return null;
    const existing = allEmployees.find(e => e.id === headId);
    if (existing) return existing;
    if (typeof head === 'object') {
      return {
        id: headId,
        fullName: head.fullName || head.name || 'Department Head',
        jobTitle: head.jobTitle || 'Department Head',
      };
    }
    return null;
  }, [selectedDepartment, allEmployees]);

  const managerOptions = useMemo(() => {
    if (!formData.department_id) return [];

    const headId = selectedDeptHead?.id;
    const eligible = allEmployees.filter(emp => {
      const empDeptId = emp.departmentId ? String(emp.departmentId) : '';
      const isSameDept = empDeptId && empDeptId === String(formData.department_id);
      const isHead = headId && emp.id === headId;
      const isInactive = ['TERMINATED', 'OFFBOARDED', 'ARCHIVED'].includes(emp.status);
      return (isSameDept || isHead) && !isInactive;
    });

    if (selectedDeptHead && !eligible.some(e => e.id === selectedDeptHead.id)) {
      eligible.push(selectedDeptHead);
    }

    return eligible.map(emp => {
      const isHead = headId && emp.id === headId;
      let label = emp.fullName;
      if (emp.jobTitle) label += ` (${emp.jobTitle})`;
      if (isHead) label += ` - Head of Dept`;
      return {
        value: emp.id,
        label,
      };
    });
  }, [allEmployees, formData.department_id, selectedDeptHead]);

  const handleDepartmentChange = (deptId) => {
    setFormData(prev => {
      const newDept = departments.find(d => String(d.id || d._id) === String(deptId));
      const head = newDept?.managerId;
      const headId = head ? String(head._id || head.id || (typeof head === 'string' ? head : '')) : null;

      const isValidManager = allEmployees.some(emp => {
        const empDeptId = emp.departmentId ? String(emp.departmentId) : '';
        const isSameDept = empDeptId && empDeptId === String(deptId);
        const isHead = headId && emp.id === headId;
        return (isSameDept || isHead) && emp.id === String(prev.manager_id);
      });

      return {
        ...prev,
        department_id: deptId,
        manager_id: isValidManager ? prev.manager_id : "",
      };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    const submissionData = {
      ...formData,
      manager_id: formData.manager_id && formData.manager_id !== 'none' ? formData.manager_id : undefined,
      template_id: formData.template_id && formData.template_id !== 'none' ? formData.template_id : undefined,
    };
    onSubmit(submissionData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="max-w-3xl mx-auto shadow-lg border-slate-200">
      <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardTitle className="flex items-center gap-2 text-2xl">
          <UserPlus className="w-6 h-6 text-blue-600" />
          New Employee Information
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <UserPlus className="w-5 h-5" />
              Personal Information
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between h-5">
                  <Label htmlFor="full_name">Full Name *</Label>
                </div>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => handleChange("full_name", e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between h-5">
                  <Label htmlFor="email">Email *</Label>
                </div>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="john@company.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between h-5">
                  <Label htmlFor="start_date">Start Date *</Label>
                </div>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleChange("start_date", e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Job Information */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <Briefcase className="w-5 h-5" />
              Job Details
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between h-5">
                  <Label htmlFor="job_title">Job Title *</Label>
                </div>
                <Input
                  id="job_title"
                  value={formData.job_title}
                  onChange={(e) => handleChange("job_title", e.target.value)}
                  placeholder="Software Engineer"
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between h-5">
                  <Label htmlFor="department_id">Department *</Label>
                </div>
                <Select value={formData.department_id} onValueChange={handleDepartmentChange}>
                  <SelectTrigger id="department_id">
                    <SelectValue placeholder="Select department *" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between h-5">
                  <Label htmlFor="manager_id">Reports To (Manager)</Label>
                  <span className="text-xs text-slate-400">Optional</span>
                </div>
                <Select
                  value={formData.manager_id || 'none'}
                  onValueChange={(value) => handleChange("manager_id", value === 'none' ? '' : value)}
                  disabled={!formData.department_id || loadingEmployees}
                >
                  <SelectTrigger id="manager_id">
                    <SelectValue
                      placeholder={
                        !formData.department_id
                          ? "Select department first"
                          : loadingEmployees
                            ? "Loading managers..."
                            : managerOptions.length === 0
                              ? "No employees in this department yet"
                              : "Select manager (optional)"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      {formData.department_id && selectedDeptHead
                        ? `Default: ${selectedDeptHead.fullName} (Dept Head)`
                        : "No direct manager"}
                    </SelectItem>
                    {managerOptions.map((mgr) => (
                      <SelectItem key={mgr.value} value={mgr.value}>
                        {mgr.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.department_id && managerOptions.length === 0 && !loadingEmployees && (
                  <p className="text-xs text-slate-500">
                    This department currently has no existing members. You can leave this blank.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between h-5">
                  <Label htmlFor="employeeClass">Employment Class *</Label>
                </div>
                <Select value={formData.employeeClass} onValueChange={(value) => handleChange("employeeClass", value)}>
                  <SelectTrigger id="employeeClass">
                    <SelectValue placeholder="Select class *" />
                  </SelectTrigger>
                  <SelectContent>
                    {employeeClasses.map(cls => (
                      <SelectItem key={cls.value} value={cls.value}>{cls.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Onboarding Template */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <FileText className="w-5 h-5" />
              Onboarding Template
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between h-5">
                <Label htmlFor="template_id">Select Template</Label>
                <span className="text-xs text-slate-400">Optional</span>
              </div>
              <Select 
                value={formData.template_id} 
                onValueChange={(value) => handleChange("template_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a template (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No template (Assign default tasks)</SelectItem>
                  {templates.map((template) => {
                    const deptLabel = template.department || template.role_type || 'All Departments';
                    return (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name} ({deptLabel})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <p className="text-sm text-slate-500">
                Templates automatically create tasks and document requests for the employee. If omitted, default tasks are assigned.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={onCancel} isLoading={isSubmitting}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              isLoading={isSubmitting}
              disabled={!isFormValid || isSubmitting}
              className={`transition-all duration-200 ${
                !isFormValid 
                ? 'opacity-90 cursor-not-allowed filter  select-none hover:bg-primary'
                : 'shadow-md hover:shadow-lg'
              }`}
            >
              {isSubmitting ? "Creating..." : "Create Employee"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}