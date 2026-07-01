import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Mail, Briefcase, Calendar, FileText } from "lucide-react";


import { useQuery } from '@tanstack/react-query';
import { gql } from 'graphql-request';
import { gqlClient } from '@/api/graphqlClient';
import { useAuth } from '@/lib/AuthContext';

const GET_ORGANIZATION = gql`
  query GetOrganization($id: ID!) {
    organization(id: $id) {
      id
      employeeClasses
    }
  }
`;

export default function AddEmployeeForm({ templates, departments, onSubmit, onCancel, isSubmitting }) {
  const { user } = useAuth();
  
  const { data: orgData } = useQuery({
    queryKey: ['organization', user?.organizationId],
    queryFn: async () => {
      if (!user?.organizationId) return null;
      const res = await gqlClient.request(GET_ORGANIZATION, { id: user.organizationId });
      return res.organization;
    },
    enabled: !!user?.organizationId
  });

  const employeeClasses = orgData?.employeeClasses || ["Permanent", "Probationary", "Contract", "Consultant", "Intern", "Managerial"];

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    job_title: "",
    department_id: "",
    template_id: "",
    start_date: "",
    status: "not_started",
    progress_percentage: 0,
    employment_type: "full_time",
    employeeClass: "Permanent"
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.template_id) {
      alert("Please select an onboarding template.");
      return;
    }
    const submissionData = {
      ...formData
    };
    onSubmit(submissionData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="max-w-3xl mx-auto border-slate-200 shadow-lg">
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
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Personal Information
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
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
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
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
                <Label htmlFor="start_date" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
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
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Job Details
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
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
                      <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Onboarding Template */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Onboarding Template
            </h3>
            <div className="space-y-2">
              <Label htmlFor="template_id">Select Template *</Label>
              <Select value={formData.template_id} onValueChange={(value) => handleChange("template_id", value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} - {template.role_type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-slate-500">
                Templates automatically create tasks and document requests for the employee
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
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {isSubmitting ? "Creating..." : "Create Employee"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}