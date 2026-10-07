import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { motion, AnimatePresence } from 'framer-motion';

export default function LeaveTargetingSection({ formData, setFormData }) {
  const currentGenders = Array.isArray(formData.applicableGenders) ? formData.applicableGenders : [];
  const isGenderRestricted = currentGenders.length > 0;

  const selectedGender =
    currentGenders.length === 1 && currentGenders[0] === 'MALE' ? 'MALE' : 'FEMALE';

  const handleToggle = (checked) => {
    if (checked) {
      // Switch active -> Restrict by gender, default to FEMALE or previous selection
      setFormData((prev) => ({
        ...prev,
        applicableGenders: [selectedGender || 'FEMALE'],
      }));
    } else {
      // Switch false -> Available to all genders
      setFormData((prev) => ({ ...prev, applicableGenders: [] }));
    }
  };

  const handleGenderSelect = (gender) => {
    setFormData((prev) => ({
      ...prev,
      applicableGenders: [gender],
    }));
  };

  return (
    <div className="p-3.5 space-y-3 border rounded-lg border-slate-200/80 bg-slate-50/50">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="restrict-by-gender" className="text-sm font-medium text-slate-800 cursor-pointer">
            Restrict by Gender
          </Label>
          <p className="text-xs text-slate-500">
            {isGenderRestricted
              ? 'This leave type is restricted to employees of a specific gender.'
              : 'Available to all employees regardless of gender.'}
          </p>
        </div>
        <Switch
          id="restrict-by-gender"
          checked={isGenderRestricted}
          onCheckedChange={handleToggle}
        />
      </div>

      <AnimatePresence>
        {isGenderRestricted && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="space-y-2 pt-3 border-t border-slate-200">
              <div className="space-y-0.5">
                <Label className="text-xs font-semibold text-slate-700">Target Gender</Label>
                <p className="text-xs text-slate-500">
                  Only employees of the selected gender can see and apply for this leave type.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                {[
                  { value: 'FEMALE', label: 'Female' },
                  { value: 'MALE', label: 'Male' },
                ].map((option) => {
                  const isSelected = selectedGender === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleGenderSelect(option.value)}
                      className={`flex items-center justify-center px-3 py-2 text-xs font-medium rounded-lg border transition-all ${
                        isSelected
                          ? 'bg-indigo-50 border-indigo-600 text-indigo-700 font-semibold shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}



