import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserMinus, Plus, CheckCircle, Calendar, DollarSign } from "lucide-react";
import { format } from "date-fns";

export default function Offboarding() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: '',
    notice_date: new Date().toISOString().split('T')[0],
    last_working_day: '',
    termination_date: '',
    final_settlement: 0,
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };
    loadUser();
  }, []);

  const { data: offboardings = [] } = useQuery({
    queryKey: ['offboardings'],
    queryFn: () => base44.entities.Offboarding.list('-created_date'),
    initialData: [],
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list(),
    initialData: [],
  });

  const createOffboardingMutation = useMutation({
    mutationFn: (data) => {
      const employee = employees.find(e => e.id === data.employee_id);
      
      const defaultChecklist = [
        { task: 'Complete offboarding', completed: false },
        { task: 'Exit interview', completed: false },
        { task: 'Return company assets', completed: false },
        { task: 'Access revocation', completed: false },
        { task: 'Final settlement', completed: false },
        { task: 'Certificate issuance', completed: false },
      ];

      return base44.entities.Offboarding.create({
        ...data,
        organization_id: user.organization_id,
        employee_name: employee.full_name,
        checklist: defaultChecklist,
        status: 'in_progress',
        completion_percentage: 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offboardings'] });
      setShowForm(false);
      setFormData({
        employee_id: '',
        notice_date: new Date().toISOString().split('T')[0],
        last_working_day: '',
        termination_date: '',
        final_settlement: 0,
      });
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-start">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm mb-4">
              <UserMinus className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-slate-700">Offboarding Management</span>
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-3">Offboarding Journey</h1>
            <p className="text-lg text-slate-600">Manage employee departures smoothly</p>
          </div>
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600">
                <Plus className="w-4 h-4 mr-2" />
                New Offboarding
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Start Offboarding Process</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); createOffboardingMutation.mutate(formData); }} className="space-y-4">
                <div className="space-y-2">
                  <Label>Employee</Label>
                  <Select value={formData.employee_id} onValueChange={(value) => setFormData(prev => ({ ...prev, employee_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map(emp => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.full_name} - {emp.job_title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Notice Date</Label>
                    <Input type="date" value={formData.notice_date} onChange={(e) => setFormData(prev => ({ ...prev, notice_date: e.target.value }))} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Working Day</Label>
                    <Input type="date" value={formData.last_working_day} onChange={(e) => setFormData(prev => ({ ...prev, last_working_day: e.target.value }))} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Termination Date</Label>
                    <Input type="date" value={formData.termination_date} onChange={(e) => setFormData(prev => ({ ...prev, termination_date: e.target.value }))} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Final Settlement (SAR)</Label>
                    <Input type="number" value={formData.final_settlement} onChange={(e) => setFormData(prev => ({ ...prev, final_settlement: parseFloat(e.target.value) }))} />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                  <Button type="submit" disabled={createOffboardingMutation.isPending}>
                    {createOffboardingMutation.isPending ? 'Creating...' : 'Start Offboarding'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offboardings.map(offboarding => (
            <Card key={offboarding.id} className="border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-teal-500 to-cyan-600 p-6 text-white">
                <div className="w-20 h-20 bg-white rounded-full mx-auto mb-4 flex items-center justify-center border-4 border-white shadow-lg">
                  <span className="text-3xl">👋</span>
                </div>
                <h3 className="font-bold text-xl text-center">{offboarding.employee_name}</h3>
                <p className="text-center text-teal-100 text-sm">Offboarding Journey</p>
              </div>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-3">
                  {offboarding.checklist?.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        item.completed ? 'bg-green-500' : 'bg-slate-200'
                      }`}>
                        {item.completed && <CheckCircle className="w-4 h-4 text-white" />}
                      </div>
                      <span className={`text-sm ${item.completed ? 'text-slate-900' : 'text-slate-500'}`}>
                        {item.task}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Notice Date</p>
                      <p className="font-medium">{format(new Date(offboarding.notice_date), 'MMM dd, yyyy')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Last Working Day</p>
                      <p className="font-medium">{format(new Date(offboarding.last_working_day), 'MMM dd, yyyy')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Termination Date</p>
                      <p className="font-medium">{format(new Date(offboarding.termination_date), 'MMM dd, yyyy')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Final Settlement</p>
                      <p className="font-medium">{offboarding.final_settlement?.toLocaleString()} SAR</p>
                    </div>
                  </div>
                </div>

                <Button className="w-full bg-red-600 hover:bg-red-700 mt-4">
                  Complete
                </Button>
              </CardContent>
            </Card>
          ))}

          {offboardings.length === 0 && (
            <Card className="col-span-full border-slate-200">
              <CardContent className="p-12 text-center">
                <UserMinus className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No offboarding processes</h3>
                <p className="text-slate-500">Start an offboarding journey when needed</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}