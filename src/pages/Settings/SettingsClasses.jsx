import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { organizationsApi } from '@/api';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Briefcase, Layers } from 'lucide-react';
import ClassificationListManager from './ClassificationListManager';

const DEFAULT_EMPLOYMENT_TYPES = [
  'PERMANENT',
  'PROBATIONARY',
  'CONTRACT',
  'CONSULTANT',
];

const DEFAULT_EMPLOYEE_CLASSES = [
  'INTERN',
  'TEAM MEMBER',
  'MID LEVEL TEAM MEMBER',
  'MID LEVEL MANAGER',
  'MANAGER',
  'SENIOR MANAGER',
  'EXECUTIVE MANAGER',
];

const OLD_LEGACY_CLASSES = [
  'PERMANENT',
  'PROBATIONARY',
  'CONTRACT',
  'CONSULTANT',
  'INTERN',
  'MANAGERIAL',
];

export default function SettingsClasses() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('types');
  const [types, setTypes] = useState(DEFAULT_EMPLOYMENT_TYPES);
  const [classes, setClasses] = useState(DEFAULT_EMPLOYEE_CLASSES);

  const { data, isLoading } = useQuery({
    queryKey: ['organization', 'me'],
    queryFn: async () => {
      const res = await organizationsApi.getMyOrganization();
      return res?.data || res;
    },
  });

  useEffect(() => {
    if (!data) return;

    // Load Employment Types
    if (Array.isArray(data.employmentTypes) && data.employmentTypes.length > 0) {
      setTypes(data.employmentTypes.map((t) => t.toUpperCase()));
    } else {
      setTypes(DEFAULT_EMPLOYMENT_TYPES);
    }

    // Load Employment Classes
    if (Array.isArray(data.employeeClasses) && data.employeeClasses.length > 0) {
      const isLegacyDefault =
        data.employeeClasses.length === OLD_LEGACY_CLASSES.length &&
        data.employeeClasses.every((c, i) => c.toUpperCase() === OLD_LEGACY_CLASSES[i]);

      if (isLegacyDefault) {
        setClasses(DEFAULT_EMPLOYEE_CLASSES);
      } else {
        setClasses(data.employeeClasses.map((c) => c.toUpperCase()));
      }
    } else {
      setClasses(DEFAULT_EMPLOYEE_CLASSES);
    }
  }, [data]);

  const updateTypesMutation = useMutation({
    mutationFn: async (newTypes) => {
      const upperTypes = newTypes.map((t) => t.toUpperCase());
      return await organizationsApi.updateMyOrganization({ employmentTypes: upperTypes });
    },
    onSuccess: () => {
      toast.success('Employment types updated successfully');
      queryClient.invalidateQueries({ queryKey: ['organization', 'me'] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to update employment types');
    },
  });

  const updateClassesMutation = useMutation({
    mutationFn: async (newClasses) => {
      const upperClasses = newClasses.map((c) => c.toUpperCase());
      return await organizationsApi.updateMyOrganization({ employeeClasses: upperClasses });
    },
    onSuccess: () => {
      toast.success('Employment classes updated successfully');
      queryClient.invalidateQueries({ queryKey: ['organization', 'me'] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to update employment classes');
    },
  });

  const handleSaveTypes = (newTypes, callback) => {
    setTypes(newTypes);
    updateTypesMutation.mutate(newTypes, {
      onSuccess: () => {
        callback?.();
      },
    });
  };

  const handleSaveClasses = (newClasses, callback) => {
    setClasses(newClasses);
    updateClassesMutation.mutate(newClasses, {
      onSuccess: () => {
        callback?.();
      },
    });
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-500">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-blue-600 border-r-transparent mb-2" />
        <p className="text-sm">Loading employee classifications...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Employee Classifications
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Manage employment agreements (Employment Type) and organizational hierarchies (Employment Class).
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-100 p-1 rounded-xl h-auto inline-flex border border-slate-200/70">
          <TabsTrigger
            value="types"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
          >
            <Briefcase className="w-4 h-4" />
            <span>Employment Type</span>
            <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-slate-200/70 text-slate-700 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
              {types.length}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="classes"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
          >
            <Layers className="w-4 h-4" />
            <span>Employment Class</span>
            <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-slate-200/70 text-slate-700 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
              {classes.length}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="types" className="focus-visible:outline-none">
          <ClassificationListManager
            title="Employment Types"
            itemLabel="Employment Type"
            description="Categorize how individuals are engaged with the organization (e.g., Permanent, Probationary, Contract, Consultant)."
            icon={Briefcase}
            items={types}
            onSave={handleSaveTypes}
            isSaving={updateTypesMutation.isPending}
            defaultItems={DEFAULT_EMPLOYMENT_TYPES}
            placeholder="e.g. Permanent"
          />
        </TabsContent>

        <TabsContent value="classes" className="focus-visible:outline-none">
          <ClassificationListManager
            title="Employment Classes"
            itemLabel="Employment Class"
            description="Establish seniority ranks and workforce tiers (e.g., Intern, Team Member, Manager, Senior Manager, Executive Manager)."
            icon={Layers}
            items={classes}
            onSave={handleSaveClasses}
            isSaving={updateClassesMutation.isPending}
            defaultItems={DEFAULT_EMPLOYEE_CLASSES}
            placeholder="e.g. Mid Level Manager"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
