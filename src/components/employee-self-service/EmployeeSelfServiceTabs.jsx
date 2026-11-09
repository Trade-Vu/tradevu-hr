import React from 'react';
import {
  User,
  FileText,
  DollarSign,
  Laptop,
  Calendar,
} from 'lucide-react';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';

const dossierTabs = [
  { value: 'profile', label: 'Personal & Bank Info', icon: User },
  { value: 'documents', label: 'Documents & Contracts', icon: FileText },
  { value: 'payslips', label: 'Payslips', icon: DollarSign },
  { value: 'assets', label: 'Company Assets', icon: Laptop },
  { value: 'job-history', label: 'Job & Role History', icon: Calendar },
];

export default function EmployeeSelfServiceTabs() {
  return (
    <TabsList className="bg-slate-100/90 p-1 rounded-xl h-auto inline-flex border border-slate-200/80 min-w-max gap-1">
      {dossierTabs.map(({ value, label, icon: Icon }) => (
        <TabsTrigger
          key={value}
          value={value}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-600 transition-all data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs hover:text-slate-900"
        >
          <Icon className="w-3.5 h-3.5" />
          <span>{label}</span>
        </TabsTrigger>
      ))}
    </TabsList>
  );
}
