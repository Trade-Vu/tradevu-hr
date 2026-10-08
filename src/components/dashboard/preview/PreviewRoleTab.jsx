import React from 'react';
import { 
  ShieldCheck, 
  CreditCard, 
  DollarSign, 
  Building, 
  Copy, 
  Check, 
  Send,
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function PreviewRoleTab({ 
  employee, 
  canManage = false,
  onResendInvite,
  isResendingInvite = false 
}) {
  const [copied, setCopied] = React.useState(false);

  const empId = employee?.id || employee?._id || '';
  const systemRole = employee?.systemRole || employee?.role || 'EMPLOYEE';
  const isHrAdmin = Boolean(employee?.isHrAdmin || systemRole === 'HR_ADMIN');
  const isSuperAdmin = Boolean(employee?.isSuperAdmin || systemRole === 'SUPER_ADMIN' || employee?.isOrgOwner);

  const status = String(employee?.employment_status || employee?.employmentStatus || '').toUpperCase();
  const isNotOnboarded = status !== 'ACTIVE' && status !== 'ON_LEAVE' && status !== 'TERMINATED';

  // Compensation details
  const comp = employee?.salary || employee?.compensation || employee?.financial_info || {};
  const baseSalary = comp.baseSalary || comp.amount || comp.gross_salary || employee?.baseSalary;
  const currency = comp.currency || employee?.currency || 'USD';
  const paymentFrequency = comp.frequency || comp.paymentFrequency || 'Monthly';
  const bankName = comp.bankName || comp.bank_name || employee?.bankName;
  const accountNumber = comp.accountNumber || comp.account_number || employee?.accountNumber;

  const handleCopyId = () => {
    if (!empId) return;
    navigator.clipboard?.writeText(empId);
    setCopied(true);
    toast.success('Employee ID copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 text-sm">
      {/* System Access & Role Permissions Card */}
      <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/70 space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
          <span>Platform Role & Permissions</span>
        </h4>

        <div className="flex items-center justify-between pt-1">
          <div className="space-y-0.5">
            <p className="font-semibold text-slate-900 text-sm">
              {isSuperAdmin ? 'Super Administrator' : isHrAdmin ? 'HR Administrator' : 'Standard Personnel'}
            </p>
            <p className="text-xs text-slate-500">
              {isSuperAdmin 
                ? 'Full organizational control and platform configuration' 
                : isHrAdmin 
                ? 'Workforce management, approvals and records authority' 
                : 'Self-service portal access and request submissions'}
            </p>
          </div>
          <Badge className={
            isSuperAdmin 
              ? 'bg-purple-600 hover:bg-purple-700 text-white' 
              : isHrAdmin 
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
              : 'bg-slate-200 text-slate-800 hover:bg-slate-300'
          }>
            {systemRole}
          </Badge>
        </div>

        <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
          <span className="text-slate-500">Employee System ID</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-slate-700 font-medium truncate max-w-[140px]">
              {empId}
            </span>
            <button 
              onClick={handleCopyId}
              className="p-1 rounded hover:bg-slate-200 text-slate-500 transition-colors"
              title="Copy ID"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Compensation & Bank Glance */}
      <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/70 space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <DollarSign className="w-3.5 h-3.5 text-slate-400" />
          <span>Compensation & Financial Overview</span>
        </h4>

        {baseSalary ? (
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <p className="text-xs text-slate-500">Base Compensation</p>
              <p className="font-semibold text-slate-900 text-sm mt-0.5">
                {currency} {Number(baseSalary).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Pay Frequency</p>
              <p className="font-medium text-slate-900 text-xs sm:text-sm mt-0.5 capitalize">
                {paymentFrequency}
              </p>
            </div>
            {bankName && (
              <div className="col-span-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                <span className="text-slate-500 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-slate-400" /> Disbursed to
                </span>
                <span className="font-medium text-slate-800">
                  {bankName} {accountNumber ? `(•••• ${String(accountNumber).slice(-4)})` : ''}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="p-3 text-center rounded-lg bg-white border border-slate-200/60 text-xs text-slate-500 flex items-center justify-center gap-2">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Compensation records protected or pending setup</span>
          </div>
        )}
      </div>

      {/* Invite Resend Quick Action if Pending */}
      {isNotOnboarded && onResendInvite && (
        <div className="p-3.5 rounded-xl bg-indigo-50/80 border border-indigo-100 flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-indigo-950">Pending Invitation</p>
            <p className="text-[11px] text-indigo-700">Re-dispatch the organization welcome email</p>
          </div>
          <Button
            size="sm"
            onClick={onResendInvite}
            disabled={isResendingInvite}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 gap-1.5 rounded-lg shadow-xs"
          >
            <Send className="w-3 h-3" />
            <span>{isResendingInvite ? 'Sending...' : 'Resend Invite'}</span>
          </Button>
        </div>
      )}
    </div>
  );
}
