import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { employeesApi, usersApi } from '@/api';
import { toast } from '@/components/ui/use-toast';
import { Mail, User, Briefcase, Loader2, Send } from 'lucide-react';

export default function InviteHRModal({
  open,
  onOpenChange,
  onSuccess,
  initialEmail = '',
  isResend = false,
  defaultFullName = '',
  defaultJobTitle = '',
}) {
  const [email, setEmail] = useState(initialEmail);
  const [fullName, setFullName] = useState(defaultFullName);
  const [jobTitle, setJobTitle] = useState(defaultJobTitle || (isResend ? '' : 'Head of People'));
  const queryClient = useQueryClient();

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getUsers(),
    enabled: open,
    staleTime: 30000,
  });
  const usersList = Array.isArray(usersData) ? usersData : usersData?.data || [];

  useEffect(() => {
    if (open) {
      setEmail(initialEmail || '');
      setFullName(defaultFullName || '');
      setJobTitle(defaultJobTitle || (isResend ? '' : 'Head of People'));
    }
  }, [open, initialEmail, defaultFullName, defaultJobTitle, isResend]);

  const inviteMutation = useMutation({
    mutationFn: async (inputData) => {
      return employeesApi.inviteEmployee(inputData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast({
        title: isResend ? "Invite Resent!" : "Invite Sent!",
        description: isResend
          ? `A fresh activation link has been sent to ${email}.`
          : `Invitation sent to ${email} as HR Administrator.`,
      });
      setEmail('');
      setFullName('');
      setJobTitle('');
      onOpenChange(false);
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      console.error(error);
      toast({
        variant: "destructive",
        title: isResend ? "Failed to resend invite" : "Failed to send invite",
        description: error.response?.data?.message || error.message || "Something went wrong",
      });
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
      toast({
        variant: "destructive",
        title: isResend ? "Cannot resend invite" : "Cannot send invite",
        description: "This user is already active on the platform and cannot be invited or reinvited.",
      });
      return;
    }

    inviteMutation.mutate({
      email: cleanEmail,
      role: 'HR_ADMIN',
      fullName: fullName.trim() || undefined,
      jobTitle: jobTitle.trim() || undefined,
      frontendUrl: window.location.origin,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-indigo-600" />
            {isResend ? "Resend HR Administrator Invite" : "Invite HR Administrator"}
          </DialogTitle>
          <DialogDescription>
            {isResend
              ? "Send a fresh invitation link with a new 7-day expiration to this HR administrator."
              : "Invite an HR Administrator (e.g. Head of People, People Operations) with admin privileges on Tradevu HR."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="hr-fullname">Full Name (Optional)</Label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                id="hr-fullname"
                type="text"
                placeholder="e.g. Sarah Jenkins"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hr-email">Email Address <span className="text-red-500">*</span></Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                id="hr-email"
                type="email"
                placeholder="hr@yourcompany.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hr-jobtitle">Job Title</Label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                id="hr-jobtitle"
                type="text"
                placeholder="e.g. Head of People"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <DialogFooter className="pt-2 sm:justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={inviteMutation.isPending || !email}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {inviteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isResend ? "Resend Invite" : "Send Invite"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
