import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2 } from 'lucide-react';

const CATEGORY_OPTIONS = [
  { value: 'CLASS', label: 'Class' },
  { value: 'TYPE', label: 'Type' },
  { value: 'INDIVIDUAL', label: 'Individual' },
];

export default function LeaveQuotaExceptionRow({
  row,
  index,
  cat,
  subj,
  resolvedEmployeeClasses,
  resolvedEmploymentTypes,
  employees,
  onCategoryChange,
  onSubjectChange,
  onDaysChange,
  onRemove,
}) {
  const numDays = Number(row.days);
  const isInvalidDays = row.days !== '' && numDays < 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center p-3 sm:p-0 rounded-lg bg-white sm:bg-transparent border sm:border-0 border-slate-200 shadow-sm sm:shadow-none">
      {/* Column 1: Category Dropdown (Class | Type | Individual) */}
      <div className="col-span-4">
        <label className="text-[10px] font-semibold text-slate-500 uppercase sm:hidden block mb-1">
          Category
        </label>
        <Select value={cat} onValueChange={(val) => onCategoryChange(index, val)}>
          <SelectTrigger className="h-9 bg-white border-slate-200 text-xs">
            <SelectValue placeholder="Select Category..." />
          </SelectTrigger>
          <SelectContent className="max-h-64">
            {CATEGORY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Column 2: Subject Dropdown (Subjective based on Category) */}
      <div className="col-span-4">
        <label className="text-[10px] font-semibold text-slate-500 uppercase sm:hidden block mb-1">
          Subject
        </label>
        <Select value={subj} onValueChange={(val) => onSubjectChange(index, val)}>
          <SelectTrigger className="h-9 bg-white border-slate-200 text-xs">
            <SelectValue
              placeholder={
                cat === 'CLASS'
                  ? 'Select Class...'
                  : cat === 'TYPE'
                  ? 'Select Type...'
                  : 'Select Employee...'
              }
            />
          </SelectTrigger>
          <SelectContent className="max-h-64">
            {cat === 'CLASS' && (
              <>
                {resolvedEmployeeClasses.length === 0 ? (
                  <SelectItem value="__none__" disabled className="text-xs text-slate-400">
                    No classes configured
                  </SelectItem>
                ) : (
                  resolvedEmployeeClasses.map((cls) => (
                    <SelectItem key={cls.value} value={cls.value} className="text-xs">
                      {cls.label || cls.value}
                    </SelectItem>
                  ))
                )}
              </>
            )}

            {cat === 'TYPE' && (
              <>
                {resolvedEmploymentTypes.length === 0 ? (
                  <SelectItem value="__none__" disabled className="text-xs text-slate-400">
                    No types configured
                  </SelectItem>
                ) : (
                  resolvedEmploymentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value} className="text-xs">
                      {type.label || type.value}
                    </SelectItem>
                  ))
                )}
              </>
            )}

            {cat === 'INDIVIDUAL' && (
              <>
                {employees.length === 0 ? (
                  <SelectItem value="__none__" disabled className="text-xs text-slate-400">
                    No employees available
                  </SelectItem>
                ) : (
                  employees.slice(0, 100).map((emp) => {
                    const empId = String(emp.id || emp._id);
                    return (
                      <SelectItem key={empId} value={empId} className="text-xs">
                        <span>{emp.fullName || emp.email || 'Employee'}</span>
                        {emp.jobTitle ? (
                          <span className="ml-1 text-[11px] text-slate-400">
                            ({emp.jobTitle})
                          </span>
                        ) : null}
                      </SelectItem>
                    );
                  })
                )}
              </>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Column 3: Days Per Year */}
      <div className="col-span-3">
        <label className="text-[10px] font-semibold text-slate-500 uppercase sm:hidden block mb-1">
          Days Per Year
        </label>
        <Input
          type="number"
          min="0"
          value={row.days}
          onChange={(e) => onDaysChange(index, e.target.value)}
          placeholder="0"
          className={`h-9 bg-white text-xs border-slate-200 ${
            isInvalidDays
              ? 'border-red-500 focus-visible:ring-red-400 bg-red-50/20 text-red-900'
              : ''
          }`}
        />
        {isInvalidDays && (
          <p className="text-[10px] text-red-500 mt-1 font-medium leading-tight">
            Must be 0 or greater (cannot be negative)
          </p>
        )}
      </div>

      {/* Column 4: Delete Action */}
      <div className="col-span-1 flex justify-end sm:justify-center">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onRemove(index)}
          className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 active:scale-[0.95] transition-all duration-150"
          title="Remove exception"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
