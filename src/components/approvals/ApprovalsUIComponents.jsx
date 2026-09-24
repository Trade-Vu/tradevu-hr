import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

export const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

// Returns a ready-to-display locale date string, or 'N/A' if val is missing/unparseable.
export const safeDate = (val) => {
  if (!val) return 'N/A';
  const asNum = Number(val);
  const parsed = new Date(isNaN(asNum) ? val : asNum);
  return isNaN(parsed.getTime()) ? 'N/A' : parsed.toLocaleDateString();
};

export const RejectDialog = ({ onReject, title = "Reject Request" }) => {
  const [reason, setReason] = useState("");
  const [open, setOpen] = useState(false);

  const handleReject = () => {
    if (!reason.trim()) return;
    onReject(reason);
    setOpen(false);
    setReason("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="text-slate-600 border-slate-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600 flex items-center gap-2 transition-colors">
          <XCircle className="w-4 h-4" />
          Reject
        </Button>
      </DialogTrigger>
      <DialogContent className="border-slate-100 shadow-xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-slate-900 tracking-tight">{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Reason for rejection (Required)</label>
            <textarea
              className="w-full min-h-[100px] p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors resize-none"
              placeholder="Please provide a reason..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" className="rounded-lg" onClick={() => setOpen(false)}>Cancel</Button>
            <Button 
              className="bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm"
              disabled={!reason.trim()} 
              onClick={handleReject}
            >
              Confirm Rejection
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const ApprovalsSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    {Array(4).fill(0).map((_, i) => (
      <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 border border-slate-100 rounded-xl bg-white shadow-sm gap-4">
        <div className="flex-1 space-y-3 w-full">
          <div className="h-4 bg-slate-100 rounded w-1/3"></div>
          <div className="h-3 bg-slate-100 rounded w-1/2"></div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="h-9 w-24 bg-slate-100 rounded-lg"></div>
          <div className="h-9 w-24 bg-slate-100 rounded-lg"></div>
        </div>
      </div>
    ))}
  </div>
);

export const EmptyState = ({ message, icon: Icon }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="text-center p-12 flex flex-col items-center justify-center border border-slate-100 rounded-2xl bg-white/50 border-dashed"
  >
    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
      <Icon className="w-8 h-8 text-slate-300" />
    </div>
    <p className="text-slate-500 font-medium">{message}</p>
  </motion.div>
);
