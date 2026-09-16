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
    <TabsList className="inline-flex h-auto gap-1 p-1 border shadow-sm bg-slate-50 min-w-max rounded-xl border-slate-200">
      {tabs.map(({ value, label, icon: Icon }) => (
        <TabsTrigger
          key={value}
          value={value}
          className="gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 data-[state=active]:bg-[slate-900] data-[state=active]:text-slate-900 data-[state=active]:bg-white data-[state=active]:shadow-sm"
        >
          <Icon className="w-4 h-4" />
          <span>{label}</span>
          {value === "onboarding" && pendingTasksCount > 0 && `(${pendingTasksCount})`}
        </TabsTrigger>
      ))}
    </TabsList>
  );
}
