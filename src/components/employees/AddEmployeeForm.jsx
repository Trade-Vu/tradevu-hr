import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Mail, Briefcase, Calendar, FileText } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { organizationsApi } from '@/api';
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

  const employeeClasses = normalizeEmployeeClasses(orgData?.employeeClasses);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    job_title: "",
    department_id: "",
    template_id: "",
    start_date: "",
    status: "not_started",
    progress_percentage: 0,
    employment_type: "FULL_TIME",
    employeeClass: "PERMANENT"
  });

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email?.trim() || '');
  const isFormValid = Boolean(
    formData.full_name?.trim() &&
    isEmailValid &&
    formData.start_date &&
    formData.job_title?.trim()
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    const submissionData = {
      ...formData,
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
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => handleChange("full_name", e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="">
                  Email *
                </Label>
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
                <Label htmlFor="start_date" className="">
                  Start Date *
                </Label>
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
                <Label htmlFor="job_title">Job Title *</Label>
                <Input
                  id="job_title"
                  value={formData.job_title}
                  onChange={(e) => handleChange("job_title", e.target.value)}
                  placeholder="Software Engineer"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department_id">Department</Label>
                <Select value={formData.department_id} onValueChange={(value) => handleChange("department_id", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
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
                <Label htmlFor="employeeClass">Employment Class</Label>
                <Select value={formData.employeeClass} onValueChange={(value) => handleChange("employeeClass", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
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
              <div className="flex items-center justify-between">
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
                  ? 'opacity-40 cursor-not-allowed filter blur-[1px] select-none hover:bg-primary' 
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