import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { gql } from 'graphql-request';
import { gqlClient } from '@/api/graphqlClient';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Switch } from '../components/ui/switch';
import { Plus, Trash2, Edit, X } from 'lucide-react';
import { motion } from 'framer-motion';

const GET_LEAVE_TYPES = gql`
  query GetLeaveTypes {
    leaveTypes {
      id
      name
      daysPerYear
      isPaid
      requiresApproval
      eligibleAfterDays
      applicableTo
    }
  }
`;

const CREATE_LEAVE_TYPE = gql`
  mutation CreateLeaveType($name: String!, $daysPerYear: Int!, $isPaid: Boolean!, $requiresApproval: Boolean!, $eligibleAfterDays: Int, $applicableTo: JSON) {
    createLeaveType(name: $name, daysPerYear: $daysPerYear, isPaid: $isPaid, requiresApproval: $requiresApproval, eligibleAfterDays: $eligibleAfterDays, applicableTo: $applicableTo) {
      id
      name
    }
  }
`;

const UPDATE_LEAVE_TYPE = gql`
  mutation UpdateLeaveType($id: ID!, $name: String, $daysPerYear: Int, $isPaid: Boolean, $requiresApproval: Boolean, $eligibleAfterDays: Int, $applicableTo: JSON) {
    updateLeaveType(id: $id, name: $name, daysPerYear: $daysPerYear, isPaid: $isPaid, requiresApproval: $requiresApproval, eligibleAfterDays: $eligibleAfterDays, applicableTo: $applicableTo) {
      id
      name
    }
  }
`;

const DEFAULT_FORM_DATA = {
  name: '',
  daysPerYear: 10,
  isPaid: true,
  requiresApproval: true,
  eligibleAfterDays: 0,
  classOverrides: []
};

const KNOWN_CLASSES = ["Permanent", "Probationary", "Contract", "Consultant", "Intern", "Managerial"];

export default function SettingsLeaveTypes() {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);

  const { data, isLoading } = useQuery({
    queryKey: ['leaveTypes'],
    queryFn: () => gqlClient.request(GET_LEAVE_TYPES)
  });

  const { mutate: createLeaveType, isPending: isCreating } = useMutation({
    mutationFn: (variables) => gqlClient.request(CREATE_LEAVE_TYPE, variables),
    onSuccess: () => {
      toast.success("Leave Type created successfully!");
      queryClient.invalidateQueries(['leaveTypes']);
      resetForm();
    },
    onError: (err) => {
      toast.error(err.response?.errors?.[0]?.message || err.message || "Failed to create leave type.");
    }
  });

  const { mutate: updateLeaveType, isPending: isUpdating } = useMutation({
    mutationFn: (variables) => gqlClient.request(UPDATE_LEAVE_TYPE, variables),
    onSuccess: () => {
      toast.success("Leave Type updated successfully!");
      queryClient.invalidateQueries(['leaveTypes']);
      resetForm();
    },
    onError: (err) => {
      toast.error(err.response?.errors?.[0]?.message || err.message || "Failed to update leave type.");
    }
  });

  const isPending = isCreating || isUpdating;

  const resetForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData(DEFAULT_FORM_DATA);
  };

  const handleEdit = (lt) => {
    let parsedOverrides = [];
    if (lt.applicableTo && lt.applicableTo.classOverrides) {
      parsedOverrides = Object.entries(lt.applicableTo.classOverrides).map(([className, days]) => ({
        className,
        daysPerYear: days
      }));
    }

    setFormData({
      name: lt.name,
      daysPerYear: lt.daysPerYear,
      isPaid: lt.isPaid,
      requiresApproval: lt.requiresApproval,
      eligibleAfterDays: lt.eligibleAfterDays || 0,
      classOverrides: parsedOverrides
    });
    setEditingId(lt.id);
    setIsAdding(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) return toast.error("Name is required");
    
    // Build applicableTo object
    const overridesObj = {};
    formData.classOverrides.forEach(override => {
      if (override.className && override.className.trim() !== '') {
        overridesObj[override.className.trim()] = parseInt(override.daysPerYear, 10) || 0;
      }
    });

    const applicableTo = Object.keys(overridesObj).length > 0 ? { classOverrides: overridesObj } : null;

    const payload = {
      name: formData.name,
      daysPerYear: parseInt(formData.daysPerYear, 10),
      isPaid: formData.isPaid,
      requiresApproval: formData.requiresApproval,
      eligibleAfterDays: parseInt(formData.eligibleAfterDays, 10),
      applicableTo
    };

    if (editingId) {
      updateLeaveType({ id: editingId, ...payload });
    } else {
      createLeaveType(payload);
    }
  };

  const addOverride = () => {
    setFormData({
      ...formData,
      classOverrides: [...formData.classOverrides, { className: '', daysPerYear: formData.daysPerYear }]
    });
  };

  const removeOverride = (index) => {
    const newOverrides = [...formData.classOverrides];
    newOverrides.splice(index, 1);
    setFormData({ ...formData, classOverrides: newOverrides });
  };

  const updateOverride = (index, field, value) => {
    const newOverrides = [...formData.classOverrides];
    newOverrides[index][field] = value;
    setFormData({ ...formData, classOverrides: newOverrides });
  };

  const leaveTypes = data?.leaveTypes || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Leave Types</h2>
        <p className="text-slate-500 mt-1">Configure available leave categories, quotas, and rules.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {isLoading ? (
            <Card><CardContent className="p-8 text-center text-slate-500">Loading leave types...</CardContent></Card>
          ) : leaveTypes.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-slate-500">No leave types configured yet.</CardContent></Card>
          ) : (
            leaveTypes.map(lt => (
              <motion.div key={lt.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Card>
                  <CardContent className="p-5 flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div>
                        <h4 className="font-semibold text-slate-900">{lt.name}</h4>
                        <p className="text-sm text-slate-500 mt-1">
                          Default: {lt.daysPerYear} days/year • {lt.isPaid ? 'Paid' : 'Unpaid'} • {lt.requiresApproval ? 'Requires Approval' : 'Auto-Approve'}
                          {lt.eligibleAfterDays > 0 && ` • Eligible after ${lt.eligibleAfterDays} days`}
                        </p>
                      </div>
                      
                      {lt.applicableTo?.classOverrides && Object.keys(lt.applicableTo.classOverrides).length > 0 && (
                        <div className="bg-slate-50 p-3 rounded-md mt-2 text-sm border border-slate-100">
                          <span className="font-medium text-slate-700 block mb-1">Class Overrides:</span>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(lt.applicableTo.classOverrides).map(([className, days]) => (
                              <span key={className} className="inline-flex items-center bg-white border border-slate-200 px-2 py-1 rounded text-xs text-slate-600 shadow-sm">
                                {className}: <strong className="ml-1 text-slate-900">{days} days</strong>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(lt)} className="ml-4 flex-shrink-0 text-slate-400 hover:text-indigo-600">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        <div>
          {isAdding ? (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">{editingId ? 'Edit Leave Type' : 'Add Leave Type'}</CardTitle>
                <CardDescription>{editingId ? 'Update leave category' : 'Create a new leave category'}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Name (e.g. Annual, Sick)</label>
                    <Input 
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      placeholder="Annual Leave"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Default Days Per Year</label>
                    <Input 
                      type="number"
                      value={formData.daysPerYear}
                      onChange={e => setFormData({...formData, daysPerYear: e.target.value})}
                    />
                  </div>
                  
                  {/* Class Overrides Section */}
                  <div className="space-y-3 pt-2 pb-2 border-y border-slate-100">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-slate-700">Overrides by Employee Class</label>
                    </div>
                    
                    {formData.classOverrides.map((override, index) => (
                      <div key={index} className="flex gap-2 items-start bg-slate-50 p-2 rounded-md border border-slate-100">
                        <div className="flex-1 space-y-2">
                          <Input 
                            placeholder="Class Name (e.g. Managerial)"
                            value={override.className}
                            onChange={(e) => updateOverride(index, 'className', e.target.value)}
                            list="known-classes"
                            className="h-8 text-sm"
                          />
                          <datalist id="known-classes">
                            {KNOWN_CLASSES.map(c => <option key={c} value={c} />)}
                          </datalist>
                          <div className="flex items-center gap-2">
                            <Input 
                              type="number"
                              placeholder="Days"
                              value={override.daysPerYear}
                              onChange={(e) => updateOverride(index, 'daysPerYear', e.target.value)}
                              className="h-8 text-sm"
                            />
                            <span className="text-xs text-slate-500 whitespace-nowrap">days/year</span>
                          </div>
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 w-8" onClick={() => removeOverride(index)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    
                    <Button type="button" variant="outline" size="sm" onClick={addOverride} className="w-full text-xs border-dashed">
                      <Plus className="w-3 h-3 mr-1" /> Add Class Override
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Eligible After (Days of Service)</label>
                    <Input 
                      type="number"
                      value={formData.eligibleAfterDays}
                      onChange={e => setFormData({...formData, eligibleAfterDays: e.target.value})}
                    />
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <label className="text-sm font-medium text-slate-700">Is Paid Leave?</label>
                    <Switch 
                      checked={formData.isPaid}
                      onCheckedChange={c => setFormData({...formData, isPaid: c})}
                    />
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <label className="text-sm font-medium text-slate-700">Requires Approval?</label>
                    <Switch 
                      checked={formData.requiresApproval}
                      onCheckedChange={c => setFormData({...formData, requiresApproval: c})}
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button type="button" variant="outline" className="flex-1" onClick={resetForm}>Cancel</Button>
                    <Button type="submit" className="flex-1" disabled={isPending}>{editingId ? 'Update' : 'Save'}</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Button onClick={() => setIsAdding(true)} className="w-full flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Leave Type
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
