import React from 'react';
import {
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  Laptop,
  Plane,
  Receipt,
  User,
} from 'lucide-react';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';

const tabs = [
  { value: 'profile', label: 'My Profile', icon: User },
  { value: 'onboarding', label: 'Onboarding & Tasks', icon: CheckCircle },
  { value: 'payslips', label: 'Payslips', icon: DollarSign },
  { value: 'leave', label: 'Leave', icon: Plane },
  { value: 'attendance', label: 'Attendance', icon: Clock },
  { value: 'assets', label: 'Assets', icon: Laptop },
  { value: 'expenses', label: 'Expenses', icon: Receipt },
  { value: 'documents', label: 'Documents', icon: FileText },
  { value: 'job-history', label: 'Job History', icon: Calendar },
];

export default function EmployeeSelfServiceTabs({ pendingTasksCount }) {
  return (
    <TabsList className="bg-slate-100 p-1 rounded-xl h-auto inline-flex border border-slate-200/70 min-w-max gap-1">
      {tabs.map(({ value, label, icon: Icon }) => (
        <TabsTrigger
          key={value}
          value={value}
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
        >
          <Icon className="w-4 h-4" />
          <span>{label}</span>
          {value === "onboarding" && pendingTasksCount > 0 && (
            <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-slate-200/70 text-slate-700 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
              {pendingTasksCount}
            </span>
          )}
        </TabsTrigger>
      ))}
    </TabsList>
  );
}
