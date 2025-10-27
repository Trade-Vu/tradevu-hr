import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, Calendar, Briefcase, Building2 } from "lucide-react";
import { format } from "date-fns";

export default function EmployeeInfo({ employee }) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Basic Information */}
      <Card className="border-slate-200">
        <CardHeader className="border-b border-slate-200 bg-slate-50">
          <CardTitle className="text-lg">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-slate-400 mt-0.5" />
            <div>
              <p className="text-sm text-slate-500">Email</p>
              <p className="font-medium text-slate-900">{employee.email}</p>
            </div>
          </div>
          {employee.phone && (
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-500">Phone</p>
                <p className="font-medium text-slate-900">{employee.phone}</p>
              </div>
            </div>
          )}
          <div className="flex items-start gap-3">
            <Briefcase className="w-5 h-5 text-slate-400 mt-0.5" />
            <div>
              <p className="text-sm text-slate-500">Job Title</p>
              <p className="font-medium text-slate-900">{employee.job_title}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
            <div>
              <p className="text-sm text-slate-500">Start Date</p>
              <p className="font-medium text-slate-900">
                {format(new Date(employee.start_date), "MMMM d, yyyy")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Onboarding Status */}
      <Card className="border-slate-200">
        <CardHeader className="border-b border-slate-200 bg-slate-50">
          <CardTitle className="text-lg">Onboarding Status</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div>
            <p className="text-sm text-slate-500">Current Status</p>
            <p className="font-medium text-slate-900 capitalize">
              {employee.status.replace('_', ' ')}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Progress</p>
            <p className="font-medium text-slate-900">{employee.progress_percentage || 0}%</p>
          </div>
          {employee.welcome_sent && (
            <div>
              <p className="text-sm text-slate-500">Welcome Email</p>
              <p className="font-medium text-green-600">Sent ✓</p>
            </div>
          )}
          {employee.onboarding_completed_date && (
            <div>
              <p className="text-sm text-slate-500">Completion Date</p>
              <p className="font-medium text-slate-900">
                {format(new Date(employee.onboarding_completed_date), "MMMM d, yyyy")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Personal Information */}
      {employee.personal_info && (
        <Card className="border-slate-200 md:col-span-2">
          <CardHeader className="border-b border-slate-200 bg-slate-50">
            <CardTitle className="text-lg">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="p-6 grid md:grid-cols-2 gap-6">
            {employee.personal_info.address && (
              <div>
                <p className="text-sm text-slate-500">Address</p>
                <p className="font-medium text-slate-900">{employee.personal_info.address}</p>
              </div>
            )}
            {employee.personal_info.emergency_contact && (
              <div>
                <p className="text-sm text-slate-500">Emergency Contact</p>
                <p className="font-medium text-slate-900">{employee.personal_info.emergency_contact}</p>
                {employee.personal_info.emergency_phone && (
                  <p className="text-sm text-slate-600 mt-1">{employee.personal_info.emergency_phone}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}