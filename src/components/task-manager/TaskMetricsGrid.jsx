import React from "react";
import { CardSpotlight } from "@/components/ui/card-spotlight";
import { Layers, ListTodo, AlertTriangle, CheckCircle2, ArrowUpRight } from "lucide-react";
import { TASK_STATUSES, normalizeTaskStatus } from "@/constants/taskStatus";

export default function TaskMetricsGrid({ allTasks = [] }) {
  const totalTasksCount = allTasks.length;
  const completedTasksCount = allTasks.filter(
    (t) => normalizeTaskStatus(t.status) === TASK_STATUSES.DONE
  ).length;

  const activeWorkstreamCount = allTasks.filter((t) => {
    const s = normalizeTaskStatus(t.status);
    return s === TASK_STATUSES.IN_PROGRESS || s === TASK_STATUSES.REVIEW;
  }).length;

  const now = new Date();
  const overdueCount = allTasks.filter((t) => {
    if (normalizeTaskStatus(t.status) === TASK_STATUSES.DONE || !t.due_date) return false;
    return new Date(t.due_date) < now;
  }).length;

  const velocityPct = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  const metrics = [
    {
      title: "Active Workload",
      value: totalTasksCount - completedTasksCount,
      icon: Layers,
      trend: `${totalTasksCount - completedTasksCount} Open`,
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200/60",
    },
    {
      title: "In Execution",
      value: activeWorkstreamCount,
      icon: ListTodo,
      trend: "Active Flow",
      badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200/60",
    },
    {
      title: "Overdue & Bottlenecks",
      value: overdueCount,
      icon: AlertTriangle,
      trend: overdueCount > 0 ? "Requires Attention" : "Clear Schedule",
      badgeColor:
        overdueCount > 0
          ? "bg-red-50 text-red-700 border-red-200/60"
          : "bg-emerald-50 text-emerald-700 border-emerald-200/60",
    },
    {
      title: "Delivery Velocity",
      value: `${velocityPct}%`,
      icon: CheckCircle2,
      trend: `${completedTasksCount} Done`,
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
      {metrics.map((item, idx) => {
        const Icon = item.icon;
        return (
          <div key={idx} className="group block focus:outline-none">
            <CardSpotlight
              radius={280}
              color="rgba(79, 70, 229, 0.06)"
              borderColor="rgba(79, 70, 229, 0.25)"
              className="h-full p-4 sm:p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md border-slate-200/80 bg-white rounded-xl"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                  <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
              </div>

              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                  {item.title}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-heading">
                    {item.value}
                  </span>
                </div>
              </div>
            </CardSpotlight>
          </div>
        );
      })}
    </div>
  );
}

