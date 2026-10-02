import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, CheckCircle, Plane } from "lucide-react";
import { isPendingLeaveStatus, normalizeLeaveStatus, LEAVE_STATUS } from "@/lib/leaveStatus";
import { motion } from "framer-motion";

export const StatsSkeleton = () => (
  <div className="grid gap-6 md:grid-cols-3">
    {Array(3).fill(0).map((_, i) => (
      <div key={i} className="p-6 bg-white border shadow-sm border-slate-100 rounded-2xl animate-pulse">
        <div className="w-12 h-12 mb-4 bg-slate-100 rounded-xl"></div>
        <div className="w-16 h-8 mb-2 rounded bg-slate-100"></div>
        <div className="w-24 h-4 rounded bg-slate-100"></div>
      </div>
    ))}
  </div>
);

export default function LeaveStatsCards({ requests = [], isLoading = false, itemVariants }) {
  if (isLoading) {
    return <StatsSkeleton />;
  }

  const pendingCount = requests.filter(l => isPendingLeaveStatus(l.status)).length;
  const approvedThisMonthCount = requests.filter(l => normalizeLeaveStatus(l.status) === LEAVE_STATUS.APPROVED).length;
  const totalCount = requests.length;

  return (
    <motion.div variants={itemVariants} className="grid gap-6 md:grid-cols-3">
      <Card className="relative overflow-hidden bg-white shadow-sm border-slate-200/60 rounded-2xl">
        <div className="absolute top-0 right-0 w-24 h-24 -mt-4 -mr-4 rounded-bl-full opacity-50 pointer-events-none bg-amber-50"></div>
        <CardContent className="relative z-10 p-6">
          <div className="flex items-center justify-center w-12 h-12 mb-4 bg-amber-100/50 rounded-xl">
            <Clock className="w-6 h-6 text-amber-600" />
          </div>
          <p className="text-3xl font-bold tracking-tight text-slate-900">{pendingCount}</p>
          <p className="mt-1 text-sm font-medium text-slate-500">Pending Approvals</p>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden bg-white shadow-sm border-slate-200/60 rounded-2xl">
        <div className="absolute top-0 right-0 w-24 h-24 -mt-4 -mr-4 rounded-bl-full opacity-50 pointer-events-none bg-emerald-50"></div>
        <CardContent className="relative z-10 p-6">
          <div className="flex items-center justify-center w-12 h-12 mb-4 bg-emerald-100/50 rounded-xl">
            <CheckCircle className="w-6 h-6 text-emerald-600" />
          </div>
          <p className="text-3xl font-bold tracking-tight text-slate-900">{approvedThisMonthCount}</p>
          <p className="mt-1 text-sm font-medium text-slate-500">Approved This Month</p>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden bg-white shadow-sm border-slate-200/60 rounded-2xl">
        <div className="absolute top-0 right-0 w-24 h-24 -mt-4 -mr-4 rounded-bl-full opacity-50 pointer-events-none bg-indigo-50"></div>
        <CardContent className="relative z-10 p-6">
          <div className="flex items-center justify-center w-12 h-12 mb-4 bg-indigo-100/50 rounded-xl">
            <Plane className="w-6 h-6 text-indigo-600" />
          </div>
          <p className="text-3xl font-bold tracking-tight text-slate-900">{totalCount}</p>
          <p className="mt-1 text-sm font-medium text-slate-500">Total Requests</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
