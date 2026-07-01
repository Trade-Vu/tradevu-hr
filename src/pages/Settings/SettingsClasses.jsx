import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { gql } from 'graphql-request';
import { gqlClient } from '@/api/graphqlClient';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Edit, X } from 'lucide-react';
import { motion } from 'framer-motion';

const GET_ORGANIZATION = gql`
  query GetOrganization($id: ID!) {
    organization(id: $id) {
      id
      employeeClasses
    }
  }
`;

const UPDATE_ORGANIZATION = gql`
  mutation UpdateOrganization($input: UpdateOrganizationInput!) {
    updateOrganization(input: $input) {
      id
      employeeClasses
    }
  }
`;

export default function SettingsClasses() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [classes, setClasses] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [className, setClassName] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['organization', user?.organizationId],
    queryFn: async () => {
      if (!user?.organizationId) return null;
      const res = await gqlClient.request(GET_ORGANIZATION, { id: user.organizationId });
      return res.organization;
    },
    enabled: !!user?.organizationId
  });

  useEffect(() => {
    if (data?.employeeClasses) {
      setClasses(data.employeeClasses);
    } else if (data && !data.employeeClasses) {
      // Default classes if null
      setClasses(["Permanent", "Probationary", "Contract", "Consultant", "Intern", "Managerial"]);
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: async (newClasses) => {
      const input = { employeeClasses: newClasses };
      const res = await gqlClient.request(UPDATE_ORGANIZATION, { input });
      return res.updateOrganization;
    },
    onSuccess: () => {
      toast.success('Employee classes updated successfully');
      queryClient.invalidateQueries({ queryKey: ['organization', user?.organizationId] });
      setIsAdding(false);
      setEditingIndex(null);
      setClassName('');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update employee classes');
    }
  });

  const handleSave = () => {
    if (!className.trim()) {
      toast.error('Class name cannot be empty');
      return;
    }

    let newClasses = [...classes];
    if (editingIndex !== null) {
      newClasses[editingIndex] = className.trim();
    } else {
      if (newClasses.includes(className.trim())) {
        toast.error('Class already exists');
        return;
      }
      newClasses.push(className.trim());
    }

    updateMutation.mutate(newClasses);
  };

  const handleDelete = (index) => {
    const newClasses = classes.filter((_, i) => i !== index);
    updateMutation.mutate(newClasses);
  };

  const startEdit = (index) => {
    setClassName(classes[index]);
    setEditingIndex(index);
    setIsAdding(true);
  };

  const cancelEdit = () => {
    setIsAdding(false);
    setEditingIndex(null);
    setClassName('');
  };

  if (isLoading) {
    return <div className="p-8">Loading classes...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Employee Classes</h2>
          <p className="text-sm text-slate-500 mt-1">Manage employee classifications (e.g., Permanent, Contract).</p>
        </div>
        <Button onClick={() => { setIsAdding(true); setClassName(''); setEditingIndex(null); }} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" /> Add Class
        </Button>
      </div>

      {isAdding && (
        <Card className="border-blue-100 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">{editingIndex !== null ? 'Edit Class' : 'Add New Class'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="space-y-2 flex-1">
                <label className="text-sm font-medium text-slate-700">Class Name</label>
                <Input 
                  placeholder="e.g. Intern" 
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                />
              </div>
              <Button 
                onClick={handleSave} 
                disabled={updateMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 w-24"
              >
                {updateMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
              <Button variant="outline" onClick={cancelEdit}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {classes.map((cls, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-slate-800 text-lg">{cls}</h3>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => startEdit(idx)} className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(idx)} className="h-8 w-8 p-0 text-slate-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      
      {classes.length === 0 && !isAdding && (
        <div className="text-center p-12 bg-white rounded-xl border border-slate-200 border-dashed">
          <div className="bg-blue-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-1">No classes found</h3>
          <p className="text-slate-500 mb-4 max-w-sm mx-auto">Create employee classes to categorize your workforce.</p>
          <Button onClick={() => setIsAdding(true)} variant="outline">Create First Class</Button>
        </div>
      )}
    </div>
  );
}
