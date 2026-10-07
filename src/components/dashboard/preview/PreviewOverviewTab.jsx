import React from 'react';
import { 
  Building2, 
  UserCheck, 
  Calendar, 
  Mail, 
  Phone, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Shield,
  HeartHandshake
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function PreviewOverviewTab({ employee }) {
  if (!employee) return null;

  const departmentName = employee.department_name || employee.departmentId?.name || employee.department || 'General';
  const managerName = employee.manager_email || employee.manager?.fullName || employee.manager?.email || employee.managerId?.fullName || 'Not assigned';
  const employmentType = (employee.employment_type || employee.employmentType || 'FULL_TIME').replace('_', ' ');
  const employeeClass = employee.employeeClass || employee.employee_class || 'Standard';
  
  const joinDateRaw = employee.start_date || employee.hireDate || employee.joiningDate || employee.createdAt;
  let formattedJoinDate = 'N/A';
  let tenureText = '';
  if (joinDateRaw) {
    try {
      const d = new Date(joinDateRaw);
      if (!isNaN(d.getTime())) {
        formattedJoinDate = format(d, 'MMM d, yyyy');
        const months = Math.floor((new Date() - d) / (1000 * 60 * 60 * 24 * 30.4375));
        if (months >= 12) {
          const yrs = Math.floor(months / 12);
          const remMonths = months % 12;
          tenureText = `${yrs} yr${yrs > 1 ? 's' : ''} ${remMonths > 0 ? `${remMonths} mo` : ''}`.trim();
        } else if (months > 0) {
          tenureText = `${months} month${months > 1 ? 's' : ''}`;
        } else {
          tenureText = 'New joiner';
        }
      }
    } catch (e) {
      formattedJoinDate = 'N/A';
    }
  }

  const onboardingProgress = Number(employee.onboarding_progress ?? employee.onboardingProgress ?? 0);
  const onboardingStatus = employee.onboarding_status || employee.onboardingStatus || 'PENDING';
  const isOnboarded = onboardingStatus === 'COMPLETED' || onboardingProgress >= 100;

  const workEmail = employee.email || 'N/A';
  const personalEmail = employee.private_email || employee.personal_info?.personal_email || employee.personalEmail || null;
  const phone = employee.phone || employee.phoneNumber || employee.personal_info?.phone || 'Not provided';
  const emergency = employee.emergency_contact || employee.emergencyContact || employee.personal_info?.emergency_contact;

  return (
    <div className="space-y-5 text-sm">
      {/* Onboarding Status Banner - only shown when incomplete/in progress */}
      {!isOnboarded && (
        <div className="p-3.5 rounded-xl border bg-amber-50/70 border-amber-200/80 text-amber-900">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="font-semibold text-xs uppercase tracking-wider">
                Onboarding in Progress
              </span>
            </div>
            <span className="text-xs font-bold font-mono">
              {onboardingProgress}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 rounded-full bg-slate-200/70 overflow-hidden">
            <div 
              className="h-full transition-all duration-500 rounded-full bg-amber-500"
              style={{ width: `${Math.min(100, Math.max(5, onboardingProgress))}%` }}
            />
          </div>
        </div>
      )}

      {/* Primary Employment Attributes */}
      <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/70 space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-slate-400" />
          <span>Work & Organizational Placement</span>
        </h4>

        <div className="grid grid-cols-2 gap-3.5 pt-1">
          <div>
            <p className="text-xs text-slate-500">Department</p>
            <p className="font-medium text-slate-900 text-xs sm:text-sm mt-0.5 truncate">
              {departmentName}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500">Reports To</p>
            <p className="font-medium text-slate-900 text-xs sm:text-sm mt-0.5 truncate flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{managerName}</span>
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500">Employment Type</p>
            <p className="font-medium text-slate-900 text-xs sm:text-sm mt-0.5 capitalize">
              {employmentType}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500">Job Grade / Class</p>
            <p className="font-medium text-slate-900 text-xs sm:text-sm mt-0.5">
              {employeeClass}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500">Start Date</p>
            <p className="font-medium text-slate-900 text-xs sm:text-sm mt-0.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{formattedJoinDate}</span>
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500">Tenure</p>
            <p className="font-medium text-slate-900 text-xs sm:text-sm mt-0.5 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span>{tenureText || 'Recent'}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Contact Details Card */}
      <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/70 space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <Mail className="w-3.5 h-3.5 text-slate-400" />
          <span>Contact Channels</span>
        </h4>

        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" /> Work Email
            </span>
            <a 
              href={`mailto:${workEmail}`} 
              className="font-medium text-indigo-600 hover:underline truncate max-w-[200px]"
            >
              {workEmail}
            </a>
          </div>

          {personalEmail && (
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" /> Personal Email
              </span>
              <span className="font-medium text-slate-800 truncate max-w-[200px]">
                {personalEmail}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone
            </span>
            <span className="font-medium text-slate-800">
              {phone}
            </span>
          </div>

          {emergency && (
            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1">
                <HeartHandshake className="w-3.5 h-3.5 text-rose-400" /> Emergency
              </span>
              <span className="font-medium text-slate-700">
                {emergency.name || emergency.fullName || 'Registered'} ({emergency.relationship || 'Contact'})
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
