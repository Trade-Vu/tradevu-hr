import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation } from '@tanstack/react-query';
import { gqlClient } from '@/api/graphqlClient';
import { toast } from '@/components/ui/use-toast';
import { Mail, Loader2 } from 'lucide-react';

const INVITE_USER_MUTATION = `
  mutation InviteUser($input: InviteUserInput!) {
    inviteUser(input: $input)
  }
`;

export default function InviteHRModal({ open, onOpenChange, onSuccess }) {
  const [email, setEmail] = useState('');

  const inviteMutation = useMutation({
    mutationFn: async (inputData) => {
      return gqlClient.request(INVITE_USER_MUTATION, { input: inputData });
    },
    onSuccess: () => {
      toast({
        title: "Invite Sent!",
        description: "Your HR Manager has been invited successfully. The Human Resources department has also been created.",
      });
      setEmail('');
      onOpenChange(false);
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Failed to send invite",
        description: error.response?.errors?.[0]?.message || error.message || "Something went wrong",
      });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    inviteMutation.mutate({ email, role: 'HR_ADMIN' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite HR Manager</DialogTitle>
          <DialogDescription>
            Send an invitation email to your HR Manager. This will also automatically setup the Human Resources department.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
              <Input
                id="email"
                type="email"
                placeholder="hr@yourcompany.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>
          <DialogFooter className="sm:justify-end">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={inviteMutation.isPending || !email} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {inviteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Invite
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
