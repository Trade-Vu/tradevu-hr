import React, { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { onboardingApi } from "@/api/onboarding.api";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Calendar, User, CheckCircle, Clock, AlertCircle, BookTemplate } from "lucide-react";
import { format } from "date-fns";
import AddTaskDialog from "./AddTaskDialog";
import AssignTemplateDialog from "./AssignTemplateDialog";
import { TASK_STATUSES, normalizeTaskStatus } from "@/constants/taskStatus";
import { queryKeys } from "@/constants/queryKeys";

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

export default function TaskManager({ tasks = [], employeeId, employee }) {
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);

  const { data: templates = [] } = useQuery({
    queryKey: queryKeys.templates.all,
    queryFn: async () => {
      const res = await onboardingApi.getTemplates();
      return Array.isArray(res) ? res : (res?.data || []);
    },
  });

  const assignedTemplate = useMemo(() => {
    const tId = employee?.templateId || employee?.template_id || employee?.template?._id || employee?.template?.id;
    if (!tId || !templates.length) return null;
    return templates.find((t) => (t._id || t.id) === tId) || null;
  }, [employee, templates]);

  const { data: fetchedTasks = [] } = useQuery({
    queryKey: queryKeys.tasks.onboardingEmployee(employeeId),
    queryFn: async () => {
      if (!employeeId) return [];
      const res = await onboardingApi.getEmployeeTasks(employeeId);
      const list = Array.isArray(res) ? res : (res?.data || []);
      return list.map(t => ({
        ...t,
        id: t._id || t.id,
      }));
    },
    enabled: !!employeeId,
  });

  const effectiveTasks = (fetchedTasks.length > 0 ? fetchedTasks : tasks).map(t => ({
    ...t,
    id: t._id || t.id,
  }));

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, data }) => {
      const canonicalStatus = data.status ? normalizeTaskStatus(data.status) : undefined;
      return await onboardingApi.updateTask(taskId, {
        ...data,
        ...(canonicalStatus ? { status: canonicalStatus } : {}),
      });
    },
    onSuccess: () => {
      queryKeys.tasks.invalidateAll(queryClient, employeeId);
      queryClient.invalidateQueries({ queryKey: ['pendingApprovals'] });
      queryClient.refetchQueries({ queryKey: ['pendingApprovals'] });
      queryClient.invalidateQueries({ queryKey: ['pendingApprovalsCount'] });
      queryClient.refetchQueries({ queryKey: ['pendingApprovalsCount'] });
      toast.success("Task updated successfully");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || "Failed to update task");
    }
  });

  const createTaskMutation = useMutation({
    mutationFn: async (taskData) => {
      const payload = {
        employeeId,
        title: taskData.title,
        description: taskData.description,
        category: taskData.department || taskData.category || 'other',
        priority: taskData.priority || 'medium',
        dueDate: taskData.deadline || undefined,
        status: TASK_STATUSES.TODO,
        taskType: taskData.taskType || 'checkbox',
        assignedRole: taskData.assignedRole || 'EMPLOYEE',
        completionRule: taskData.completionRule || 'auto_on_submit',
        inputConfig: taskData.inputConfig,
        templateUrl: taskData.templateUrl,
        templateName: taskData.templateName,
        isUploadRequired: Boolean(taskData.isUploadRequired),
      };
      return await onboardingApi.createTask(payload);
    },
    onSuccess: () => {
      queryKeys.tasks.invalidateAll(queryClient, employeeId);
      setShowAddDialog(false);
      toast.success("Task created successfully");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || "Failed to create task");
    }
  });

  const toggleTaskComplete = (task) => {
    const isCurrentlyDone = normalizeTaskStatus(task.status, Boolean(task.isCompleted)) === TASK_STATUSES.DONE;
    const newStatus = isCurrentlyDone ? TASK_STATUSES.TODO : TASK_STATUSES.DONE;
    updateTaskMutation.mutate({ 
      taskId: task.id, 
      data: { status: newStatus } 
    });
  };

  const updateTaskStatus = (taskId, newStatus) => {
    updateTaskMutation.mutate({ taskId, data: { status: normalizeTaskStatus(newStatus) } });
  };

  const groupedTasks = {
    pending: effectiveTasks.filter(t => {
      const s = normalizeTaskStatus(t.status, Boolean(t.isCompleted));
      return s === TASK_STATUSES.TODO || s === TASK_STATUSES.BACKLOG;
    }),
    in_progress: effectiveTasks.filter(t => {
      const s = normalizeTaskStatus(t.status, Boolean(t.isCompleted));
      return s === TASK_STATUSES.IN_PROGRESS || s === TASK_STATUSES.REVIEW;
    }),
    completed: effectiveTasks.filter(t => normalizeTaskStatus(t.status, Boolean(t.isCompleted)) === TASK_STATUSES.DONE),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Onboarding Tasks</h2>
          <p className="text-xs text-slate-500">Track and manage onboarding milestone progress for this employee.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (assignedTemplate) {
                setSelectedTemplateId(assignedTemplate._id || assignedTemplate.id);
              }
              setShowAssignDialog(true);
            }}
            className="border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5 cursor-pointer"
          >
            <BookTemplate className="w-4 h-4 text-slate-500" />
            <span>{assignedTemplate ? "Re-sync Template" : "Apply Template"}</span>
          </Button>
          <Button
            size="sm"
            onClick={() => setShowAddDialog(true)}
            className="gap-1.5 bg-slate-900 hover:bg-slate-800 text-white cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </Button>
        </div>
      </div>

      {/* Template Association & Audit Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <BookTemplate className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-slate-800">
                {assignedTemplate ? `Track: ${assignedTemplate.name}` : "Onboarding Track: Custom / Ad-hoc"}
              </span>
              <Badge variant="outline" className="bg-white text-indigo-700 border-indigo-200 text-[10px] font-semibold py-0 h-4">
                v{assignedTemplate?.version || "1.0"}
              </Badge>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {assignedTemplate
                ? "Milestones are linked to this template. Re-syncing pulls any new or updated tasks from the template."
                : "Assign an onboarding template to automatically populate this employee with standardized milestones."}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (assignedTemplate) {
              setSelectedTemplateId(assignedTemplate._id || assignedTemplate.id);
            }
            setShowAssignDialog(true);
          }}
          className="text-xs h-8 border-slate-200 hover:bg-white text-slate-700 font-medium shrink-0 cursor-pointer"
        >
          <BookTemplate className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
          {assignedTemplate ? "Re-sync Tasks" : "Assign Template"}
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

      {/* Standalone Reusable Apply / Re-sync Template Dialog */}
      <AssignTemplateDialog
        open={showAssignDialog}
        onClose={() => setShowAssignDialog(false)}
        employeeId={employeeId}
        initialTemplateId={assignedTemplate?._id || assignedTemplate?.id || ""}
      />
    </div>
  );
}