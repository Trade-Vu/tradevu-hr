import React from 'react';
import { Plus } from 'lucide-react';
import { toTitleCase } from '@/lib/utils';
import {
  DEFAULT_EMPLOYMENT_TYPES,
  DEFAULT_EMPLOYEE_CLASSES,
  normalizeEmploymentTypes,
  normalizeEmployeeClasses,
} from '@/lib/formOptions';
import LeaveQuotaExceptionRow from './LeaveQuotaExceptionRow';

export default function LeaveQuotaExceptionsEditor({
  exceptions = [],
  onChange,
  employeeClassOptions = [],
  employmentTypeOptions = [],
  employees = [],
  defaultDays = 0,
}) {
  const parsedDefaultDays = Math.max(0, parseFloat(defaultDays) || 0);

  const resolvedEmploymentTypes =
    Array.isArray(employmentTypeOptions) && employmentTypeOptions.length > 0
      ? employmentTypeOptions
      : normalizeEmploymentTypes(DEFAULT_EMPLOYMENT_TYPES);

  const resolvedEmployeeClasses =
    Array.isArray(employeeClassOptions) && employeeClassOptions.length > 0
      ? employeeClassOptions
      : normalizeEmployeeClasses(DEFAULT_EMPLOYEE_CLASSES);

  const getNormalizedCategory = (row) => {
    if (!row) return 'CLASS';
    const cat = String(row.category || '').toUpperCase();
    if (cat === 'CLASS' || cat === 'TYPE' || cat === 'INDIVIDUAL') {
      return cat;
    }
    if (
      (row.subjectId && String(row.subjectId).startsWith('EMP:')) ||
      employees.some((e) => String(e.id || e._id) === String(row.subjectId))
    ) {
      return 'INDIVIDUAL';
    }
    if (resolvedEmploymentTypes.some((t) => t.value === row.category || t.value === row.employmentType)) {
      return 'TYPE';
    }
    if (resolvedEmployeeClasses.some((c) => c.value === row.category || c.value === row.employeeClass)) {
      return 'CLASS';
    }
    return 'CLASS';
  };

  const getSubjectLabel = (cat, subjVal) => {
    if (cat === 'CLASS') {
      const match = resolvedEmployeeClasses.find((c) => c.value === subjVal);
      return match?.label || toTitleCase(subjVal) || 'Class';
    }
    if (cat === 'TYPE') {
      const match = resolvedEmploymentTypes.find((t) => t.value === subjVal);
      return match?.label || toTitleCase(subjVal) || 'Employment Type';
    }
    if (cat === 'INDIVIDUAL') {
      const emp = employees.find((e) => String(e.id || e._id) === String(subjVal));
      return emp?.fullName || emp?.email || 'Individual';
    }
    return subjVal || 'Exception';
  };

  const getNormalizedSubject = (row, cat) => {
    if (!row) return '';
    if (cat === 'CLASS') {
      return (
        row.employeeClass ||
        (row.category === 'CLASS' ? row.subjectId : '') ||
        row.subjectId ||
        resolvedEmployeeClasses[0]?.value ||
        ''
      );
    }
    if (cat === 'TYPE') {
      return (
        row.employmentType ||
        (row.category === 'TYPE' ? row.subjectId : '') ||
        (row.category !== 'CLASS' && row.category !== 'INDIVIDUAL' ? row.category : '') ||
        row.subjectId ||
        resolvedEmploymentTypes[0]?.value ||
        ''
      );
    }
    if (cat === 'INDIVIDUAL') {
      const clean = String(row.subjectId || '').replace(/^EMP:/, '');
      return clean || (employees[0] ? String(employees[0].id || employees[0]._id) : '');
    }
    return row.subjectId || '';
  };

  const handleAdd = () => {
    const initialCat = 'CLASS';
    const initialSubj = resolvedEmployeeClasses[0]?.value || '';
    const subjectName = getSubjectLabel(initialCat, initialSubj);
    const initialDays = parsedDefaultDays || 0;
    const newRow = {
      category: initialCat,
      subjectId: initialSubj,
      subjectName,
      employeeClass: initialSubj,
      employmentType: '',
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
      let nextSubj = '';
      let employeeClass = '';
      let employmentType = '';

      if (newCat === 'CLASS') {
        nextSubj = resolvedEmployeeClasses[0]?.value || '';
        employeeClass = nextSubj;
      } else if (newCat === 'TYPE') {
        nextSubj = resolvedEmploymentTypes[0]?.value || '';
        employmentType = nextSubj;
      } else if (newCat === 'INDIVIDUAL') {
        const firstEmp = employees[0];
        nextSubj = firstEmp ? String(firstEmp.id || firstEmp._id) : '';
      }

      const subjectName = getSubjectLabel(newCat, nextSubj);
      return {
        ...row,
        category: newCat,
        subjectId: nextSubj,
        subjectName,
        employeeClass,
        employmentType,
      };
    });
    onChange(updated);
  };

  const handleSubjectChange = (index, newSubj) => {
    const updated = exceptions.map((row, i) => {
      if (i !== index) return row;
      const cat = getNormalizedCategory(row);
      const subjectName = getSubjectLabel(cat, newSubj);
      return {
        ...row,
        category: cat,
        subjectId: newSubj,
        subjectName,
        employeeClass: cat === 'CLASS' ? newSubj : '',
        employmentType: cat === 'TYPE' ? newSubj : '',
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
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-all duration-150 active:scale-[0.98]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add exceptions</span>
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/90 space-y-3.5">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Exceptions
          </span>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Set custom overrides for specific individuals, employee types or classes.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {/* Table / Grid Headers with 3 Columns */}
        <div className="hidden sm:grid sm:grid-cols-12 gap-3 px-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          <div className="col-span-4">Category</div>
          <div className="col-span-4">Subject</div>
          <div className="col-span-3">Days Per Year</div>
          <div className="col-span-1 text-center"></div>
        </div>

        {/* Rows */}
        {exceptions.map((row, idx) => {
          const cat = getNormalizedCategory(row);
          const subj = getNormalizedSubject(row, cat);

          return (
            <LeaveQuotaExceptionRow
              key={idx}
              row={row}
              index={idx}
              cat={cat}
              subj={subj}
              resolvedEmployeeClasses={resolvedEmployeeClasses}
              resolvedEmploymentTypes={resolvedEmploymentTypes}
              employees={employees}
              onCategoryChange={handleCategoryChange}
              onSubjectChange={handleSubjectChange}
              onDaysChange={handleDaysChange}
              onRemove={handleRemove}
            />
          );
        })}
      </div>

      <div className="pt-1 flex items-center justify-between">
        <button
          type="button"
          onClick={handleAdd}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-all duration-150 active:scale-[0.98]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add another exception</span>
        </button>
      </div>
    </div>
  );
}
