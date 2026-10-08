import React, { useState } from 'react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  Phone, 
  Calendar, 
  Briefcase, 
  ArrowRight, 
  User, 
  ShieldCheck, 
  Copy, 
  Check, 
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Send
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { employeesApi, leaveApi } from '@/api';
import { PAGE_ROUTES } from '@/constants/pageRoutes';
import { mapEmployeeData } from '@/components/employee-detail/employeeDetailUtils';

import PreviewOverviewTab from './preview/PreviewOverviewTab';
import PreviewLeaveTab from './preview/PreviewLeaveTab';
import PreviewRoleTab from './preview/PreviewRoleTab';

export default function EmployeeQuickPreviewSheet({ employee, isOpen, onClose }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [copiedLink, setCopiedLink] = useState(false);

  const empId = employee?.id || employee?._id || '';

  // 1. Fetch deep employee data for rich inspection
  const { data: fullEmployeeData, isLoading: loadingFullData } = useQuery({
    queryKey: ['employee-quick-preview', empId],
    queryFn: async () => {
      if (!empId) return null;
      const res = await employeesApi.getEmployeeById(empId);
      const raw = res.data?.data || res.data || res;
      return raw ? mapEmployeeData(raw) : null;
    },
    enabled: Boolean(isOpen && empId),
    staleTime: 60000,
  });

  // 2. Fetch live leave balances for the employee
  const { data: leaveBalances = [], isLoading: loadingBalances } = useQuery({
    queryKey: ['employee-preview-leave-balances', empId],
    queryFn: async () => {
      if (!empId) return [];
      const res = await leaveApi.getBalances(empId);
      const item = Array.isArray(res) ? res : res?.data || res;
      return (Array.isArray(item?.balances) ? item.balances : []).map((balance) => ({
        leaveTypeId: balance.leaveTypeId?._id || balance.leaveTypeId || '',
        leaveType: balance.leaveTypeId?.name || 'Leave',
        total: balance.allocated ?? 0,
        used: balance.used ?? 0,
        remaining: balance.remaining ?? 0,
      }));
    },
    enabled: Boolean(isOpen && empId),
    staleTime: 60000,
  });

  // 3. Resend invitation mutation
  const resendMutation = useMutation({
    mutationFn: () => employeesApi.resendInvite(empId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['employee-quick-preview', empId] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success(data?.message || 'Invitation sent successfully!');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to resend invitation.');
    },
  });

  if (!employee && !isOpen) return null;

  // Active merged employee object
  const activeEmployee = fullEmployeeData || employee || {};

  const fullName = activeEmployee.full_name || activeEmployee.fullName || `${activeEmployee.firstName || ''} ${activeEmployee.lastName || ''}`.trim() || 'Employee';
  const jobTitle = activeEmployee.job_title || activeEmployee.jobTitle || 'Role not specified';
  const departmentName = activeEmployee.department_name || activeEmployee.departmentId?.name || activeEmployee.department || 'General';
  const status = String(activeEmployee.employment_status || activeEmployee.employmentStatus || 'ACTIVE').toUpperCase();
  const email = activeEmployee.email || '';

  const onboardingProgress = Number(activeEmployee.onboarding_progress ?? activeEmployee.onboardingProgress ?? 0);
  const onboardingStatus = String(activeEmployee.onboarding_status || activeEmployee.onboardingStatus || '').toUpperCase();
  const isOnboarded = onboardingStatus === 'COMPLETED' || onboardingProgress >= 100 || status === 'ACTIVE';

  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'EM';

  const handleOpenFullProfile = () => {
    onClose();
    navigate(`${PAGE_ROUTES.EMPLOYEE_DETAIL}?id=${empId}`);
  };

  const handleCopyProfileLink = () => {
    const url = `${window.location.origin}${PAGE_ROUTES.EMPLOYEE_DETAIL}?id=${empId}`;
    navigator.clipboard?.writeText(url);
    setCopiedLink(true);
    toast.success('Direct employee profile link copied!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const getStatusBadgeStyle = (st) => {
    switch (st) {
      case 'ACTIVE':
        return 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30';
      case 'PROBATION':
        return 'bg-amber-500/20 text-amber-200 border-amber-400/30';
      case 'ON_LEAVE':
        return 'bg-purple-500/20 text-purple-200 border-purple-400/30';
      case 'SUSPENDED':
      case 'TERMINATED':
        return 'bg-rose-500/20 text-rose-200 border-rose-400/30';
      default:
        return 'bg-slate-500/20 text-slate-200 border-slate-400/30';
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg md:max-w-xl p-0 flex flex-col justify-between bg-white overflow-hidden shadow-2xl">
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Header Hero Banner */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white p-6 pt-9 pb-6 shrink-0 relative">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="relative shrink-0">
                  <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white font-heading font-bold text-xl flex items-center justify-center shadow-lg">
                    {initials}
                  </div>
                  <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${
                    status === 'ACTIVE' ? 'bg-emerald-500' : status === 'ON_LEAVE' ? 'bg-purple-500' : 'bg-amber-500'
                  }`} />
                </div>

                <div className="min-w-0">
                  <SheetTitle className="text-xl font-heading font-bold text-white tracking-tight truncate">
                    {fullName}
                  </SheetTitle>
                  <SheetDescription className="text-slate-300 text-sm truncate mt-0.5">
                    {jobTitle}
                  </SheetDescription>
                  <div className="mt-2.5 flex items-center flex-wrap gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeStyle(status)}`}>
                      {status.replace('_', ' ')}
                    </span>
                    {isOnboarded ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Onboarded</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-200 border border-amber-400/30">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>Onboarding {onboardingProgress}%</span>
                      </span>
                    )}
                    <span className="text-xs text-slate-300">· {departmentName}</span>
                  </div>
                </div>
              </div>

              {/* Quick Header Actions */}
              <div className="flex items-center gap-1.5 shrink-0 bg-white/10 backdrop-blur-md p-1 rounded-xl border border-white/15">
                {email && (
                  <a
                    href={`mailto:${email}`}
                    className="p-1.5 text-slate-300 hover:text-white hover:bg-white/15 rounded-lg transition-colors"
                    title="Send Email"
                  >
                    <Mail className="w-4 h-4" />
                  </a>
                )}
                <button
                  onClick={handleCopyProfileLink}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-white/15 rounded-lg transition-colors"
                  title="Copy Profile Link"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Navigation Tabs Bar */}
            <div className="flex items-center gap-2 mt-6 border-b border-white/10 pb-0">
              <button
                onClick={() => setActiveTab('overview')}
                className={`pb-2.5 px-2 text-xs font-semibold tracking-wide transition-all border-b-2 flex items-center gap-1.5 ${
                  activeTab === 'overview'
                    ? 'border-indigo-400 text-white'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Overview</span>
              </button>

              <button
                onClick={() => setActiveTab('leave')}
                className={`pb-2.5 px-2 text-xs font-semibold tracking-wide transition-all border-b-2 flex items-center gap-1.5 ${
                  activeTab === 'leave'
                    ? 'border-indigo-400 text-white'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Leave Balances</span>
                {leaveBalances.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-white">
                    {leaveBalances.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('role')}
                className={`pb-2.5 px-2 text-xs font-semibold tracking-wide transition-all border-b-2 flex items-center gap-1.5 ${
                  activeTab === 'role'
                    ? 'border-indigo-400 text-white'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Compensation & Role</span>
              </button>
            </div>
          </div>

          {/* Scrollable Tab Content Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-slate-50/30">
            {activeTab === 'overview' && (
              <PreviewOverviewTab employee={activeEmployee} />
            )}

            {activeTab === 'leave' && (
              <PreviewLeaveTab 
                employee={activeEmployee} 
                balances={leaveBalances} 
                isLoading={loadingBalances} 
              />
            )}

            {activeTab === 'role' && (
              <PreviewRoleTab 
                employee={activeEmployee} 
                canManage={true}
                onResendInvite={() => resendMutation.mutate()}
                isResendingInvite={resendMutation.isPending}
              />
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center gap-3 shrink-0">
          <Button
            onClick={handleOpenFullProfile}
            className="w-full sm:flex-1 bg-slate-900 hover:bg-slate-800 text-white h-11 rounded-xl text-sm font-medium gap-2 shadow-sm"
          >
            <span>View Full Employee Profile</span>
            <ArrowRight className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto px-5 border-slate-200 text-slate-700 hover:bg-slate-100 h-11 rounded-xl text-sm font-medium"
          >
            Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
