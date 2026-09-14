import React from 'react';
import { Badge } from '@/components/ui/badge';

export const formatStatusDate = (value) => {
  if (!value) return 'N/A';
  const numberValue = Number(value);
  const date = !Number.isNaN(numberValue) && numberValue > 0 ? new Date(numberValue) : new Date(value);
  return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

export const renderStatusHistoryBadge = (status, isNew = false) => {
  if (!status || status === 'N/A' || status === 'INITIAL') {
    return <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200">{status === 'INITIAL' ? 'Initial' : 'N/A'}</Badge>;
  }
  const label = String(status).replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  const normalized = String(status).toUpperCase();
  if (normalized === 'ACTIVE') return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">{label}</Badge>;
  if (normalized === 'PROBATION') return <Badge className="bg-amber-50 text-amber-700 border-amber-200">{label}</Badge>;
  if (['PENDING_APPROVAL', 'PENDING_ONBOARDING', 'ONGOING_ONBOARDING'].includes(normalized)) return <Badge className="text-blue-700 border-blue-200 bg-blue-50">{label}</Badge>;
  if (normalized === 'DRAFT') return <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">{label}</Badge>;
  if (['TERMINATED', 'SUSPENDED', 'OFFBOARDED', 'RESIGNED'].includes(normalized)) return <Badge className="bg-rose-50 text-rose-700 border-rose-200">{label}</Badge>;
  return <Badge className={isNew ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-50 text-slate-600 border-slate-200'}>{label}</Badge>;
};

export const getSortedStatusHistory = (employee) => {
  const history = employee?.status_history || employee?.statusHistory || [];
  return Array.isArray(history) ? [...history].sort((a, b) => {
    const dateB = new Date(Number(b.createdAt || b.date) || b.createdAt || b.date || 0);
    const dateA = new Date(Number(a.createdAt || a.date) || a.createdAt || a.date || 0);
    return dateB - dateA;
  }) : [];
};
