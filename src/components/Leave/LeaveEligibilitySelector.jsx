import React from 'react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, Check } from 'lucide-react';
import { toTitleCase } from '@/lib/utils';

export default function LeaveEligibilitySelector({
  label,
  helperText,
  icon: Icon,
  options = [],
  selected = [],
  onChange,
  allLabel = 'All (No exceptions)',
  placeholder = 'Select option to exclude...',
}) {
  const isAllSelected = !selected || selected.length === 0;

  const handleSelect = (val) => {
    if (val === '__ALL__') {
      onChange([]);
      return;
    }

    const upperVal = val.toUpperCase();
    if (selected.includes(upperVal)) {
      // Toggle off
      onChange(selected.filter((item) => item !== upperVal));
    } else {
      // Add
      onChange([...selected, upperVal]);
    }
  };

  const handleRemove = (itemToRemove) => {
    onChange(selected.filter((item) => item !== itemToRemove));
  };

  const handleSelectAll = () => {
    onChange(options.map((opt) => opt.value.toUpperCase()));
  };

  const handleClear = () => {
    onChange([]);
  };

  return (
    <div className="p-3.5 space-y-3 border rounded-lg border-slate-200 bg-slate-50/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon && (
            <div className="p-1 rounded bg-amber-100/70 text-amber-800">
              <Icon className="w-3.5 h-3.5" />
            </div>
          )}
          <div>
            <Label className="text-sm font-semibold text-slate-800">{label}</Label>
            {helperText && <p className="text-xs text-slate-500">{helperText}</p>}
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          {isAllSelected ? (
            <Badge variant="outline" className="font-normal bg-white text-slate-600 border-slate-200">
              {allLabel}
            </Badge>
          ) : (
            <Badge variant="outline" className="font-medium bg-amber-50 text-amber-800 border-amber-200">
              {selected.length} {selected.length === 1 ? 'Exception' : 'Exceptions'}
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Select onValueChange={handleSelect} value="">
          <SelectTrigger className="w-full bg-white border-slate-200">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            <SelectItem value="__ALL__" className="font-medium text-slate-700">
              {allLabel}
            </SelectItem>
            {options.length === 0 ? (
              <div className="px-3 py-2 text-xs text-slate-400 italic text-center">
                No options configured in organization settings
              </div>
            ) : (
              options.map((opt) => {
                const isItemChosen = selected.includes(opt.value.toUpperCase());
                return (
                  <SelectItem key={opt.value} value={opt.value} className="flex justify-between">
                    <span className="flex items-center gap-2">
                      {opt.label || toTitleCase(opt.value)}
                      {isItemChosen && <Check className="w-3.5 h-3.5 text-amber-600 inline ml-1" />}
                    </span>
                  </SelectItem>
                );
              })
            )}
          </SelectContent>
        </Select>

        {/* Selected items pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 min-h-[28px]">
          {isAllSelected ? (
            <span className="text-xs italic text-slate-500">
              Applies to all employees (no exceptions configured)
            </span>
          ) : (
            selected.map((item) => (
              <Badge
                key={item}
                variant="secondary"
                className="pl-2.5 pr-1 py-0.5 text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1"
              >
                <span>Except: {toTitleCase(item)}</span>
                <button
                  type="button"
                  onClick={() => handleRemove(item)}
                  className="rounded hover:bg-amber-200/70 p-0.5 text-amber-700 transition-colors"
                  aria-label={`Remove exception ${item}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))
          )}
        </div>

        {/* Quick action buttons */}
        <div className="flex justify-end gap-2 pt-1 border-t border-slate-200/60">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleSelectAll}
            className="h-6 px-2 text-[11px] text-slate-600 hover:text-amber-700"
          >
            Exclude All
          </Button>
          {!isAllSelected && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-6 px-2 text-[11px] text-slate-600 hover:text-red-600"
            >
              Clear Exceptions
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
