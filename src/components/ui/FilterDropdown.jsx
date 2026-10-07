import React from 'react';
import { Filter } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export const DEFAULT_EMPLOYEE_STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PROBATION', label: 'Probation' },
  { value: 'PENDING_ONBOARDING', label: 'Pending Onboarding' },
  { value: 'ON_LEAVE', label: 'On Leave' },
  { value: 'PENDING_APPROVAL', label: 'Pending Approval' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'RESIGNED', label: 'Resigned' },
  { value: 'TERMINATED', label: 'Terminated' },
  { value: 'OFFBOARDED', label: 'Offboarded' },
  { value: 'ARCHIVED', label: 'Archived' },
];

/**
 * Generic and reusable filter dropdown component using shadcn/ui Select primitives.
 *
 * @param {string} value - Current active filter value
 * @param {function} onChange - Callback invoked with new value
 * @param {Array<{value: string, label: string}>} [options] - Selectable options list
 * @param {string} [placeholder='Filter...'] - Dropdown placeholder
 * @param {string} [triggerClassName] - Additional classes for SelectTrigger
 * @param {React.ReactNode} [icon] - Leading icon element (defaults to Filter icon)
 * @param {boolean} [showLeadingIcon=true] - Whether to show the icon
 */
export default function FilterDropdown({
  value = 'all',
  onChange,
  options = DEFAULT_EMPLOYEE_STATUS_OPTIONS,
  placeholder = 'Filter status',
  triggerClassName = '',
  icon: CustomIcon,
  showLeadingIcon = false,
  className = '',
}) {
  const isFiltered = value && value !== 'all';
  const IconComponent = CustomIcon || Filter;

  // Normalize options to { value, label } format
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'string') {
      return { value: opt, label: opt };
    }
    return opt;
  });

  return (
    <div className={cn('relative inline-block', className)}>
      <Select value={value} onValueChange={(val) => onChange && onChange(val)}>
        <SelectTrigger
          className={cn(
            'h-9 px-3 text-xs sm:text-sm font-medium transition-all duration-150',
            'bg-slate-50 border-slate-200 hover:bg-slate-100/80 focus:bg-white rounded-lg',
            isFiltered && 'border-indigo-300 bg-indigo-50/40 text-indigo-950 font-semibold',
            triggerClassName
          )}
        >
          <div className="flex items-center gap-2 truncate">
            {showLeadingIcon && (
              <IconComponent
                className={cn(
                  'w-3.5 h-3.5 shrink-0 transition-colors',
                  isFiltered ? 'text-indigo-600' : 'text-slate-400'
                )}
              />
            )}
            <SelectValue placeholder={placeholder} />
          </div>
        </SelectTrigger>

        <SelectContent className="shadow-lg rounded-xl border-slate-200 max-h-72">
          {normalizedOptions.map((opt) => (
            <SelectItem
              key={opt.value}
              value={opt.value}
              className="text-xs sm:text-sm cursor-pointer rounded-lg py-2"
            >
              <div className="flex items-center justify-between gap-2 w-full">
                <span>{opt.label}</span>
                {opt.badge && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                    {opt.badge}
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
