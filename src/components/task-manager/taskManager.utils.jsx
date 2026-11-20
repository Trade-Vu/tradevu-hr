import React from "react";
import { Calendar, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { TASK_STATUSES, normalizeTaskStatus } from "@/constants/taskStatus";

export const priorityConfig = {
  urgent: { label: "Urgent", badge: "bg-red-50 text-red-700 border-red-200/60", dot: "bg-red-500" },
  high: { label: "High", badge: "bg-amber-50 text-amber-700 border-amber-200/60", dot: "bg-amber-500" },
  medium: { label: "Medium", badge: "bg-blue-50 text-blue-700 border-blue-200/60", dot: "bg-blue-500" },
  low: { label: "Low", badge: "bg-slate-50 text-slate-600 border-slate-200/60", dot: "bg-slate-400" },
};

export const getDueBadge = (dueDate, status) => {
  if (!dueDate) {
    return (
      <span className="text-slate-400 text-xs flex items-center gap-1 font-normal">
        <Calendar className="w-3.5 h-3.5" /> No date
      </span>
    );
  }

  const isDone = normalizeTaskStatus(status) === TASK_STATUSES.DONE;
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDay = new Date(due);
  dueDay.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((dueDay - today) / (1000 * 60 * 60 * 24));

  if (isDone) {
    return (
      <span className="text-slate-400 text-xs flex items-center gap-1">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
        {due.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
      </span>
    );
  }

  if (diffDays < 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-50 border border-red-200/60 px-2 py-0.5 rounded-md">
        <AlertCircle className="w-3 h-3 text-red-600" />
        Overdue ({Math.abs(diffDays)}d)
      </span>
    );
  }

  if (diffDays === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-md">
        <Clock className="w-3 h-3 text-amber-600" />
        Due Today
      </span>
    );
  }

  if (diffDays <= 2) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50/70 border border-amber-200/50 px-2 py-0.5 rounded-md">
        <Clock className="w-3 h-3 text-amber-600" />
        In {diffDays}d
      </span>
    );
  }

  return (
    <span className="text-slate-500 text-xs flex items-center gap-1">
      <Calendar className="w-3.5 h-3.5 text-slate-400" />
      {due.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
    </span>
  );
};

