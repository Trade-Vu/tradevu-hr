import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Clock, CheckCircle, AlertCircle, Activity } from "lucide-react";

export default function RecentActivity({ tasks, employees }) {
  // Get recent tasks (last 10)
  const recentTasks = tasks.slice(0, 10);

  // Get employee name by id
  const getEmployeeName = (employeeId) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee ? employee.full_name : "Unknown";
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "in_progress":
        return <Clock className="w-4 h-4 text-blue-500" />;
      case "pending":
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const statusColors = {
    pending: "bg-orange-50 text-orange-600 border-orange-200",
    in_progress: "bg-blue-50 text-blue-600 border-blue-200",
    completed: "bg-green-50 text-green-600 border-green-200",
  };

  return (
    <Card className="border-slate-200/60 shadow-sm rounded-xl overflow-hidden bg-white">
      <CardHeader className="border-b border-slate-100 pb-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-900">
          <Activity className="w-4 h-4 text-indigo-500" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {recentTasks.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mb-3 border border-slate-100">
              <Clock className="w-5 h-5 text-slate-300" />
            </div>
            <p className="text-sm text-slate-500 font-medium">No recent activity</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
            {recentTasks.map((task) => (
              <div key={task.id} className="p-4 hover:bg-slate-50 transition-colors group">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 w-8 h-8 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    {getStatusIcon(task.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 text-sm mb-1 truncate group-hover:text-indigo-600 transition-colors">
                      {task.title}
                    </p>
                    <p className="text-xs text-slate-500 mb-2 truncate">
                      <span className="font-medium text-slate-700">{getEmployeeName(task.employee_id)}</span> • {task.department}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`${statusColors[task.status] || 'bg-slate-50 text-slate-600 border-slate-200'} font-medium border text-[10px] py-0 h-5`}>
                        {task.status.replace('_', ' ')}
                      </Badge>
                      {task.deadline && (
                        <span className="text-[10px] uppercase tracking-wider font-medium text-slate-400">
                          Due {format(new Date(task.deadline), "MMM d")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}