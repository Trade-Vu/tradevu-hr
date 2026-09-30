import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { toTitleCase } from '@/lib/utils';
import {
  DEFAULT_EMPLOYMENT_TYPES,
  DEFAULT_EMPLOYEE_CLASSES,
  normalizeEmploymentTypes,
  normalizeEmployeeClasses,
} from '@/lib/formOptions';

export default function LeaveQuotaExceptionsEditor({
  exceptions = [],
  onChange,
  employeeClassOptions = [],
  employmentTypeOptions = [],
  employees = [],
  defaultDays = 0,
}) {
  const parsedDefaultDays = Math.max(0, parseFloat(defaultDays) || 0);
  const maxAllowedDays = Math.max(0, parsedDefaultDays - 1);

  const resolvedEmploymentTypes =
    Array.isArray(employmentTypeOptions) && employmentTypeOptions.length > 0
      ? employmentTypeOptions
      : normalizeEmploymentTypes(DEFAULT_EMPLOYMENT_TYPES);

  const resolvedEmployeeClasses =
    Array.isArray(employeeClassOptions) && employeeClassOptions.length > 0
      ? employeeClassOptions
      : normalizeEmployeeClasses(DEFAULT_EMPLOYEE_CLASSES);

  const buildSubjectName = (catVal, subjVal) => {
    let catLabel = '';
    if (catVal && catVal !== 'ALL') {
      const match = resolvedEmploymentTypes.find((t) => t.value === catVal);
      catLabel = match?.label || toTitleCase(catVal);
    }

    let subjLabel = '';
    if (subjVal && subjVal !== 'ALL') {
      if (subjVal.startsWith('EMP:')) {
        const empId = subjVal.replace('EMP:', '');
        const emp = employees.find((e) => String(e.id || e._id) === String(empId));
        subjLabel = emp?.fullName || emp?.email || 'Individual';
      } else {
        const match = resolvedEmployeeClasses.find((c) => c.value === subjVal);
        subjLabel = match?.label || toTitleCase(subjVal);
      }
    }

    if (catLabel && subjLabel) return `${catLabel} - ${subjLabel}`;
    if (catLabel) return catLabel;
    if (subjLabel) return subjLabel;
    return 'All Employees';
  };

  const getCategoryValue = (row) => {
    if (!row) return 'ALL';
    if (row.employmentType) return row.employmentType;
    if (row.category && row.category !== 'CLASS' && row.category !== 'INDIVIDUAL') {
      return row.category === 'TYPE' ? (row.subjectId || 'ALL') : row.category;
    }
    return 'ALL';
  };

  const getSubjectValue = (row) => {
    if (!row) return 'ALL';
    if (row.employeeClass) return row.employeeClass;
    if (row.category === 'CLASS') return row.subjectId || 'ALL';
    if (row.category === 'INDIVIDUAL' || (row.subjectId && row.subjectId.startsWith('EMP:'))) {
      return row.subjectId.startsWith('EMP:') ? row.subjectId : `EMP:${row.subjectId}`;
    }
    if (row.subjectId && row.category !== 'TYPE') return row.subjectId;
    return 'ALL';
  };

  const handleAdd = () => {
    const firstType = resolvedEmploymentTypes[0]?.value || 'PERMANENT';
    const firstClass = 'ALL';
    const subjectName = buildSubjectName(firstType, firstClass);
    const initialDays = Math.max(0, parsedDefaultDays > 0 ? parsedDefaultDays - 1 : 0);
    const newRow = {
      category: firstType,
      employmentType: firstType,
      subjectId: firstClass,
      employeeClass: firstClass,
      subjectName,
      days: initialDays,
    };
    onChange([...exceptions, newRow]);
  };

  const handleRemove = (index) => {
    onChange(exceptions.filter((_, i) => i !== index));
  };

  const handleCategoryChange = (index, newCat) => {
    const updated = exceptions.map((row, i) => {
      if (i !== index) return row;
      const currentSubj = getSubjectValue(row);
      const subjectName = buildSubjectName(newCat, currentSubj);
      return {
        ...row,
        category: newCat,
        employmentType: newCat,
        subjectId: currentSubj,
        employeeClass: currentSubj,
        subjectName,
      };
    });
    onChange(updated);
  };

  const handleSubjectChange = (index, newSubj) => {
    const updated = exceptions.map((row, i) => {
      if (i !== index) return row;
      const currentCat = getCategoryValue(row);
      const subjectName = buildSubjectName(currentCat, newSubj);
      const isEmp = newSubj.startsWith('EMP:');
      const cleanSubjectId = isEmp ? newSubj.replace('EMP:', '') : newSubj;
      return {
        ...row,
        category: currentCat,
        employmentType: currentCat,
        subjectId: cleanSubjectId,
        employeeClass: isEmp ? '' : newSubj,
        subjectName,
      };
    });
    onChange(updated);
  };

  const handleDaysChange = (index, value) => {
    const numVal = value === '' ? '' : Math.max(0, parseInt(value, 10) || 0);
    const updated = exceptions.map((row, i) => {
      if (i !== index) return row;
      return { ...row, days: numVal };
    });
    onChange(updated);
  };

  if (!exceptions || exceptions.length === 0) {
    return (
      <div className="pt-1">
        <button
          type="button"
          onClick={handleAdd}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Add exceptions</span>
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/90 space-y-3.5">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Exceptions (Quota Overrides)
          </span>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Set custom annual leave days by organization employment type and employee class / tier. Max days must be less than the default ({parsedDefaultDays} days) and not a negative number.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {/* Table / Grid Headers with 3 Columns */}
        <div className="hidden sm:grid sm:grid-cols-12 gap-3 px-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          <div className="col-span-4">Category</div>
          <div className="col-span-4">Subject</div>
          <div className="col-span-3">Max Days Per Year</div>
          <div className="col-span-1 text-center"></div>
        </div>

        {/* Rows */}
        {exceptions.map((row, idx) => {
          const numDays = Number(row.days);
          const isInvalidDays =
            row.days !== '' && (numDays >= parsedDefaultDays || numDays < 0);

          return (
            <div
              key={idx}
              className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center p-3 sm:p-0 rounded-lg bg-white sm:bg-transparent border sm:border-0 border-slate-200 shadow-sm sm:shadow-none"
            >
              {/* Column 1: Category (Employment Type Dropdown) */}
              <div className="col-span-4">
                <label className="text-[10px] font-semibold text-slate-500 uppercase sm:hidden block mb-1">
                  Category
                </label>
                <Select
                  value={getCategoryValue(row)}
                  onValueChange={(val) => handleCategoryChange(idx, val)}
                >
                  <SelectTrigger className="h-9 bg-white border-slate-200 text-xs">
                    <SelectValue placeholder="Select Employment Type..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    <SelectItem value="ALL" className="text-xs font-medium text-slate-600">
                      All Employment Types
                    </SelectItem>
                    <SelectGroup>
                      <SelectLabel className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 py-1 bg-slate-50 border-t border-b border-slate-100 mt-1">
                        Configured Employment Types
                      </SelectLabel>
                      {resolvedEmploymentTypes.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value} className="text-xs">
                          {opt.label || opt.value}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              {/* Column 2: Subject (Employee Class / Tiers Dropdown) */}
              <div className="col-span-4">
                <label className="text-[10px] font-semibold text-slate-500 uppercase sm:hidden block mb-1">
                  Subject
                </label>
                <Select
                  value={getSubjectValue(row)}
                  onValueChange={(val) => handleSubjectChange(idx, val)}
                >
                  <SelectTrigger className="h-9 bg-white border-slate-200 text-xs">
                    <SelectValue placeholder="Select Class / Tier..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    <SelectItem value="ALL" className="text-xs font-medium text-slate-600">
                      All Classes / Tiers
                    </SelectItem>
                    <SelectGroup>
                      <SelectLabel className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 py-1 bg-slate-50 border-t border-b border-slate-100 mt-1">
                        Employee Classes / Tiers
                      </SelectLabel>
                      {resolvedEmployeeClasses.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value} className="text-xs">
                          {opt.label || opt.value}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                    {employees.length > 0 && (
                      <SelectGroup>
                        <SelectLabel className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 py-1 bg-slate-50 border-t border-b border-slate-100 mt-1">
                          Individual Employees
                        </SelectLabel>
                        {employees.slice(0, 50).map((emp) => (
                          <SelectItem key={`EMP:${emp.id}`} value={`EMP:${emp.id}`} className="text-xs">
                            <span>{emp.fullName || emp.email}</span>
                            {emp.jobTitle && (
                              <span className="ml-1 text-[11px] text-slate-400">({emp.jobTitle})</span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Column 3: Max Days Per Year */}
              <div className="col-span-3">
                <label className="text-[10px] font-semibold text-slate-500 uppercase sm:hidden block mb-1">
                  Max Days Per Year
                </label>
                <Input
                  type="number"
                  min="0"
                  max={maxAllowedDays}
                  value={row.days}
                  onChange={(e) => handleDaysChange(idx, e.target.value)}
                  placeholder={String(maxAllowedDays)}
                  className={`h-9 bg-white text-xs border-slate-200 ${
                    isInvalidDays
                      ? 'border-red-500 focus-visible:ring-red-400 bg-red-50/20 text-red-900'
                      : ''
                  }`}
                />
                {isInvalidDays && (
                  <p className="text-[10px] text-red-500 mt-1 font-medium leading-tight">
                    Must be between 0 and {maxAllowedDays} days (&lt; {parsedDefaultDays} default)
                  </p>
                )}
              </div>

              {/* Delete / Remove Action */}
              <div className="col-span-1 flex justify-end sm:justify-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(idx)}
                  className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                  title="Remove exception"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-1 flex items-center justify-between">
        <button
          type="button"
          onClick={handleAdd}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Add another exception</span>
        </button>
      </div>
    </div>
  );
}
