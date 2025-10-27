import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Clock, CheckCircle, AlertCircle } from "lucide-react";

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
    pending: "bg-orange-100 text-orange-800 border-orange-200",
    in_progress: "bg-blue-100 text-blue-800 border-blue-200",
    completed: "bg-green-100 text-green-800 border-green-200",
  };

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="border-b border-slate-200">
        <CardTitle className="text-xl font-bold text-slate-900">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {recentTasks.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <Clock className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>No recent activity</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {recentTasks.map((task) => (
              <div key={task.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {getStatusIcon(task.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 text-sm mb-1">
                      {task.title}
                    </p>
                    <p className="text-xs text-slate-500 mb-2">
                      {getEmployeeName(task.employee_id)} • {task.department}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`${statusColors[task.status]} border text-xs`}>
                        {task.status.replace('_', ' ')}
                      </Badge>
                      {task.deadline && (
                        <span className="text-xs text-slate-500">
                          Due: {format(new Date(task.deadline), "MMM d")}
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