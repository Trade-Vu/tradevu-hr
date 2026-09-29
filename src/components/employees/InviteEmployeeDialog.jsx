import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { employeesApi, usersApi } from '@/api';

export default function InviteEmployeeDialog({ open, onClose }) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('EMPLOYEE');

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getUsers(),
    enabled: open,
    staleTime: 30000,
  });
  const usersList = Array.isArray(usersData) ? usersData : usersData?.data || [];

  const inviteMutation = useMutation({
    mutationFn: async (payload) => {
      return await employeesApi.inviteEmployee({
        ...payload,
        frontendUrl: window.location.origin,
      });
    },
    onSuccess: (res) => {
      toast.success(res?.message || 'Invitation sent successfully!');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['paginatedEmployees'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEmail('');
      setRole('EMPLOYEE');
      onClose();
    },
    onError: (err) => {
      console.error('Invite error:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to send invitation.';
      toast.error(errorMessage);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    const cleanEmail = email.trim().toLowerCase();

    const existingActiveUser = usersList.find(
      (u) => u.email?.toLowerCase() === cleanEmail && u.isActive
    );
    if (existingActiveUser) {
      toast.error('This user is already active on the platform and cannot be invited or reinvited.');
      return;
    }

    inviteMutation.mutate({ email: cleanEmail, role });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[425px] rounded-2xl">
        <DialogHeader>
          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-6 h-6 text-indigo-600" />
          </div>
          <DialogTitle className="text-xl">Invite Team Member</DialogTitle>
          <DialogDescription>
            Send an email invitation for a team member to join your organization.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="colleague@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EMPLOYEE">Employee</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="HR_ADMIN">Head of People</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={inviteMutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={inviteMutation.isPending || !email} className="bg-indigo-600 hover:bg-indigo-700">
              {inviteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Send Invite
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
