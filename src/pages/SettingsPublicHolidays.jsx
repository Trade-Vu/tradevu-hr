import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { leaveApi } from '@/api/leave.api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Trash2, Calendar, AlertTriangle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SettingsPublicHolidays() {
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [isAdding, setIsAdding] = useState(false);
  const [holidayToDelete, setHolidayToDelete] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    date: '',
  });

  // Query public holidays from backend via REST
  const { data: rawHolidays, isLoading } = useQuery({
    queryKey: ['leave-holidays'],
    queryFn: async () => {
      const res = await leaveApi.getPublicHolidays();
      return Array.isArray(res) ? res : res?.data || [];
    },
  });

  const { mutate: createHoliday, isPending: isCreating } = useMutation({
    mutationFn: (payload) => leaveApi.createPublicHoliday(payload),
    onSuccess: () => {
      toast.success('Public Holiday added successfully!');
      queryClient.invalidateQueries({ queryKey: ['leave-holidays'] });
      setIsAdding(false);
      setFormData({ name: '', date: '' });
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Failed to add holiday.';
      toast.error(msg);
    },
  });

  const { mutate: deleteHoliday, isPending: isDeleting } = useMutation({
    mutationFn: (id) => leaveApi.deletePublicHoliday(id),
    onSuccess: () => {
      toast.success('Public Holiday removed!');
      queryClient.invalidateQueries({ queryKey: ['leave-holidays'] });
      setHolidayToDelete(null);
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Failed to remove holiday.';
      toast.error(msg);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.date) {
      return toast.error('Name and Date are required');
    }
    createHoliday({
      name: formData.name.trim(),
      date: formData.date,
    });
  };

  const holidaysList = Array.isArray(rawHolidays) ? rawHolidays : [];
  
  // Filter holidays by selected year and sort chronologically
  const sortedHolidays = holidaysList
    .filter((h) => {
      if (!h.date) return false;
      const d = new Date(h.date);
      return d.getUTCFullYear() === selectedYear || d.getFullYear() === selectedYear;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Public Holidays</h2>
          <p className="text-slate-500 mt-1">
            Manage statutory holidays. These dates are automatically excluded from leave deductions and blocked in the annual leave planner.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button variant="outline" size="sm" onClick={() => setSelectedYear((y) => y - 1)}>
            &larr;
          </Button>
          <span className="font-semibold px-4">{selectedYear}</span>
          <Button variant="outline" size="sm" onClick={() => setSelectedYear((y) => y + 1)}>
            &rarr;
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="p-8 text-center text-slate-500 flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Loading holidays...</span>
              </CardContent>
            </Card>
          ) : sortedHolidays.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-slate-500">
                No public holidays configured for {selectedYear}.
              </CardContent>
            </Card>
          ) : (
            sortedHolidays.map((h) => {
              const holidayId = h._id || h.id;
              const holidayDate = new Date(h.date);
              return (
                <motion.div key={holidayId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="hover:border-slate-300 transition-colors">
                    <CardContent className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-sky-50 rounded-xl flex items-center justify-center text-sky-600">
                          <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900">{h.name}</h4>
                          <p className="text-sm text-slate-500 mt-1">
                            {holidayDate.toLocaleDateString(undefined, {
                              timeZone: 'UTC',
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setHolidayToDelete(h)}
                        disabled={isDeleting}
                        title="Delete public holiday"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>

        <div>
          {isAdding ? (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Add Holiday</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Holiday Name</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. New Year's Day"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Date</label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setIsAdding(false);
                        setFormData({ name: '', date: '' });
                      }}
                      disabled={isCreating}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1" disabled={isCreating}>
                      {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Button onClick={() => setIsAdding(true)} className="w-full flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Add Holiday
            </Button>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={!!holidayToDelete} onOpenChange={(open) => !open && setHolidayToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <AlertDialogTitle>Delete Public Holiday</AlertDialogTitle>
                <AlertDialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Action affects leave calculations & planner
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>

          <div className="space-y-3 py-2 text-sm text-slate-600">
            <p>
              Are you sure you want to remove <strong className="text-slate-900">{holidayToDelete?.name}</strong>?
            </p>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Removing this holiday will restore it as a regular working day. Employees will now be able to select this day in the Annual Leave Planner.
              </span>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 hover:bg-rose-700 text-white"
              onClick={() => {
                if (holidayToDelete) {
                  deleteHoliday(holidayToDelete._id || holidayToDelete.id);
                }
              }}
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              {isDeleting ? 'Removing...' : 'Delete Holiday'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
