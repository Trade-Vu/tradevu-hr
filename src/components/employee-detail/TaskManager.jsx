import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Calendar, User, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import AddTaskDialog from "./AddTaskDialog";

const statusColors = {
  pending: "bg-orange-100 text-orange-800 border-orange-200",
  in_progress: "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-green-100 text-green-800 border-green-200",
};

const priorityColors = {
  low: "bg-slate-100 text-slate-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-red-100 text-red-800",
};

export default function TaskManager({ tasks, employeeId }) {
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, data }) => base44.entities.Task.update(taskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', employeeId] });
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: (taskData) => base44.entities.Task.create({ ...taskData, employee_id: employeeId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', employeeId] });
      setShowAddDialog(false);
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

  const updateTaskStatus = (taskId, newStatus) => {
    updateTaskMutation.mutate({ taskId, data: { status: newStatus } });
  };

  const groupedTasks = {
    pending: tasks.filter(t => t.status === 'pending'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    completed: tasks.filter(t => t.status === 'completed'),
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Onboarding Tasks</h2>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Task
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Pending */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-orange-500" />
            <h3 className="font-semibold text-slate-900">Pending ({groupedTasks.pending.length})</h3>
          </div>
          <div className="space-y-3">
            {groupedTasks.pending.map(task => (
              <Card key={task.id} className="border-slate-200 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
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
                        <Badge variant="outline">{task.department}</Badge>
                        {task.deadline && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(task.deadline), "MMM d")}
                          </Badge>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="mt-2 text-blue-600"
                        onClick={() => updateTaskStatus(task.id, 'in_progress')}
                      >
                        Start Task
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {groupedTasks.pending.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-8">No pending tasks</p>
            )}
          </div>
        </div>

        {/* In Progress */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-slate-900">In Progress ({groupedTasks.in_progress.length})</h3>
          </div>
          <div className="space-y-3">
            {groupedTasks.in_progress.map(task => (
              <Card key={task.id} className="border-blue-200 bg-blue-50 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
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
                        <Badge variant="outline">{task.department}</Badge>
                        {task.deadline && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(task.deadline), "MMM d")}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {groupedTasks.in_progress.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-8">No tasks in progress</p>
            )}
          </div>
        </div>

        {/* Completed */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <h3 className="font-semibold text-slate-900">Completed ({groupedTasks.completed.length})</h3>
          </div>
          <div className="space-y-3">
            {groupedTasks.completed.map(task => (
              <Card key={task.id} className="border-green-200 bg-green-50 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={true}
                      onCheckedChange={() => toggleTaskComplete(task)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-slate-900 line-through mb-1">{task.title}</h4>
                      {task.description && (
                        <p className="text-sm text-slate-600 mb-2">{task.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className={priorityColors[task.priority]}>
                          {task.priority}
                        </Badge>
                        <Badge variant="outline">{task.department}</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {groupedTasks.completed.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-8">No completed tasks yet</p>
            )}
          </div>
        </div>
      </div>

      <AddTaskDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSubmit={(data) => createTaskMutation.mutate(data)}
        isSubmitting={createTaskMutation.isPending}
      />
    </div>
  );
}