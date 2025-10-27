import React from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Calendar } from "lucide-react";
import { format } from "date-fns";

const priorityColors = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-red-100 text-red-700",
};

export default function EmployeeTaskList({ tasks, employeeId }) {
  const queryClient = useQueryClient();

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, data }) => base44.entities.Task.update(taskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-tasks', employeeId] });
    },
  });

  const toggleTaskComplete = (task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    const completed_date = newStatus === 'completed' ? new Date().toISOString().split('T')[0] : undefined;
    updateTaskMutation.mutate({ 
      taskId: task.id, 
      data: { status: newStatus, completed_date } 
    });
  };

  const pendingTasks = tasks.filter(t => t.status !== 'completed');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  return (
    <Card className="border-slate-200 shadow-lg">
      <CardHeader className="border-b border-slate-200 bg-slate-50">
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-blue-600" />
          Your Tasks
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {/* Pending Tasks */}
        {pendingTasks.length > 0 && (
          <div className="space-y-3 mb-6">
            <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wide flex items-center gap-2">
              <Clock className="w-4 h-4" />
              To Do ({pendingTasks.length})
            </h3>
            {pendingTasks.map(task => (
              <div key={task.id} className="flex items-start gap-3 p-4 bg-white border border-slate-200 rounded-lg hover:shadow-md transition-shadow">
                <Checkbox
                  checked={false}
                  onCheckedChange={() => toggleTaskComplete(task)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-slate-900 mb-1">{task.title}</h4>
                  {task.description && (
                    <p className="text-sm text-slate-600 mb-2">{task.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className={priorityColors[task.priority]}>
                      {task.priority}
                    </Badge>
                    {task.deadline && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(task.deadline), "MMM d")}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wide flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Completed ({completedTasks.length})
            </h3>
            {completedTasks.map(task => (
              <div key={task.id} className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <Checkbox
                  checked={true}
                  onCheckedChange={() => toggleTaskComplete(task)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-slate-700 line-through">{task.title}</h4>
                </div>
              </div>
            ))}
          </div>
        )}

        {tasks.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <Clock className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>No tasks assigned yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}