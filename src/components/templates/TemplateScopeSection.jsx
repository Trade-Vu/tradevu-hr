import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Layers, Briefcase, Building2 } from "lucide-react";

export default function TemplateScopeSection({
  formData,
  setFormData,
  resolvedEmployeeClasses = [],
  resolvedEmploymentTypes = [],
  departments = [],
}) {
  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-2xs space-y-5">
      <div className="flex items-start gap-3 pb-3 border-b border-slate-100">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5">
          <Layers className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-900 tracking-tight font-heading">
            Template Scope & Targeting Rules
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure generic onboarding tracks that apply to specific Employee Classes, Employment Types, or Departments.
          </p>
        </div>
      </div>

      <div className="grid gap-4.5">
        {/* Template Name */}
        <div className="space-y-1.5">
          <Label htmlFor="template-name" className="text-xs font-semibold text-slate-700">
            Template Name <span className="text-rose-500">*</span>
          </Label>
          <Input
            id="template-name"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., General Employee Onboarding, Engineering Track, or Intern Program"
            required
            className="h-10 text-xs sm:text-sm bg-white border-slate-200 rounded-lg px-3.5 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 placeholder:text-slate-400 transition-all shadow-2xs"
          />
        </div>

        {/* 3-Column Targeting Dropdown Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          {/* Employee Class Targeting */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-700 flex items-center gap-1.5 h-5">
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
              <span>Employee Class</span>
            </Label>
            <Select
              value={formData.employeeClass}
              onValueChange={(val) => setFormData((prev) => ({ ...prev, employeeClass: val }))}
            >
              <SelectTrigger className="h-10 text-xs bg-white border-slate-200 rounded-lg px-3 focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all shadow-2xs w-full">
                <SelectValue placeholder="All Employee Classes" />
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="All Classes">All Employee Classes</SelectItem>
                {resolvedEmployeeClasses.map((cls) => (
                  <SelectItem key={cls} value={cls}>
                    {cls}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Employment Type Targeting */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-700 flex items-center gap-1.5 h-5">
              <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
              <span>Employment Type</span>
            </Label>
            <Select
              value={formData.employmentType}
              onValueChange={(val) => setFormData((prev) => ({ ...prev, employmentType: val }))}
            >
              <SelectTrigger className="h-10 text-xs bg-white border-slate-200 rounded-lg px-3 focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all shadow-2xs w-full">
                <SelectValue placeholder="All Employment Types" />
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="All Types">All Employment Types</SelectItem>
                {resolvedEmploymentTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Target Department */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-700 flex items-center gap-1.5 h-5">
              <Building2 className="w-3.5 h-3.5 text-indigo-500" />
              <span>Department</span>
            </Label>
            {departments.length > 0 ? (
              <Select
                value={formData.department}
                onValueChange={(val) =>
                  setFormData((prev) => ({ ...prev, department: val, role_type: val }))
                }
              >
                <SelectTrigger className="h-10 text-xs bg-white border-slate-200 rounded-lg px-3 focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all shadow-2xs w-full">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="All Departments">All Departments</SelectItem>
                  {departments.map((dept) => {
                    const deptName = typeof dept === "string" ? dept : dept.name;
                    return (
                      <SelectItem key={deptName} value={deptName}>
                        {deptName}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="template-department"
                value={formData.department}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, department: e.target.value, role_type: e.target.value }))
                }
                placeholder="e.g. All Departments"
                className="h-10 text-xs bg-white border-slate-200 rounded-lg px-3.5 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 placeholder:text-slate-400 transition-all shadow-2xs"
              />
            )}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label htmlFor="template-description" className="text-xs font-semibold text-slate-700">
            Description
          </Label>
          <Textarea
            id="template-description"
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Describe the scope, journey, or objectives for this onboarding track..."
            rows={3}
            className="text-xs bg-white border-slate-200 rounded-lg p-3 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 placeholder:text-slate-400 transition-all shadow-2xs resize-none min-h-[76px]"
          />
        </div>
      </div>
    </div>
  );
}
