// @ts-nocheck
import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { TASK_STATUSES, normalizeTaskStatus } from "@/constants/taskStatus";

// Custom Hook (Clean Architecture)
import { useTaskManager } from "@/hooks/useTaskManager";

// Modular UI Components (All < 250 lines)
import TaskMetricsGrid from "@/components/task-manager/TaskMetricsGrid";
import TaskControlBar from "@/components/task-manager/TaskControlBar";
import TaskKanbanView from "@/components/task-manager/TaskKanbanView";
import TaskListView from "@/components/task-manager/TaskListView";
import TaskProjectsView from "@/components/task-manager/TaskProjectsView";
import TaskDetailSheet from "@/components/task-manager/TaskDetailSheet";
import TaskBulkActionBar from "@/components/task-manager/TaskBulkActionBar";
import CreateProjectDialog from "@/components/task-manager/CreateProjectDialog";
import CreateTaskDialog from "@/components/task-manager/CreateTaskDialog";

export default function TaskManager() {
  const { user } = useAuth();

  // View & Filter States
  const [viewMode, setViewMode] = useState("kanban"); // 'kanban' | 'list' | 'projects'
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("all");
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [onlyMyTasks, setOnlyMyTasks] = useState(false);

  // Multi-Selection State (Bulk Actions)
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);

  // Dialog & Sheet States
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  // Form States
  const [projectForm, setProjectForm] = useState({
    project_name: "",
    description: "",
    project_manager: "",
  });

  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    assigned_to: "",
    priority: "medium",
    status: TASK_STATUSES.TODO,
    due_date: "",
    project_id: "",
  });

  useEffect(() => {
    if (user?.email) {
      setProjectForm((prev) => ({ ...prev, project_manager: prev.project_manager || user.email }));
      setTaskForm((prev) => ({ ...prev, assigned_to: prev.assigned_to || user.email }));
    }
  }, [user]);

  // Data & Mutations Layer
  const {
    employees,
    mappedProjects,
    allTasks,
    tasksLoading,
    createProjectMutation,
    createTaskMutation,
    updateTaskMutation,
    bulkUpdateTasksMutation,
    deleteTaskMutation,
  } = useTaskManager({ user, selectedTask, setSelectedTask });

  // Filter Pipeline
  const filteredTasks = useMemo(() => {
    return allTasks.filter((task) => {
      if (selectedProjectId !== "all" && task.project_id !== selectedProjectId) return false;
      if (selectedPriority !== "all" && task.priority !== selectedPriority) return false;

      if (onlyMyTasks && user?.email) {
        const matchesEmail = task.assigned_email && task.assigned_email.toLowerCase() === user.email.toLowerCase();
        const matchesName = task.assigned_to && user.fullName && task.assigned_to.toLowerCase().includes(user.fullName.toLowerCase());
        const matchesUserEmailString = task.assigned_to && task.assigned_to.toLowerCase() === user.email.toLowerCase();
        if (!matchesEmail && !matchesName && !matchesUserEmailString) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = task.title?.toLowerCase().includes(q);
        const matchesDesc = task.description?.toLowerCase().includes(q);
        const matchesAssignee = task.assigned_to?.toLowerCase().includes(q);
        const matchesProject = task.projectName?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesAssignee && !matchesProject) return false;
      }

      return true;
    });
  }, [allTasks, selectedProjectId, selectedPriority, onlyMyTasks, searchQuery, user]);

  const tasksByStatus = useMemo(() => {
    return {
      [TASK_STATUSES.BACKLOG]: filteredTasks.filter((t) => normalizeTaskStatus(t.status) === TASK_STATUSES.BACKLOG),
      [TASK_STATUSES.TODO]: filteredTasks.filter((t) => normalizeTaskStatus(t.status) === TASK_STATUSES.TODO),
      [TASK_STATUSES.IN_PROGRESS]: filteredTasks.filter((t) => normalizeTaskStatus(t.status) === TASK_STATUSES.IN_PROGRESS),
      [TASK_STATUSES.REVIEW]: filteredTasks.filter((t) => normalizeTaskStatus(t.status) === TASK_STATUSES.REVIEW),
      [TASK_STATUSES.DONE]: filteredTasks.filter((t) => normalizeTaskStatus(t.status) === TASK_STATUSES.DONE),
    };
  }, [filteredTasks]);

  // Multi-Select Handlers
  const handleToggleSelectTask = (taskId) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const handleToggleSelectAll = () => {
    const visibleIds = filteredTasks.map((t) => t.id);
    const isAllSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedTaskIds.includes(id));
    if (isAllSelected) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(visibleIds);
    }
  };

  const handleBulkMoveStatus = (newStatus) => {
    if (selectedTaskIds.length === 0) return;
    bulkUpdateTasksMutation.mutate(
      { taskIds: selectedTaskIds, newStatus },
      { onSuccess: () => setSelectedTaskIds([]) }
    );
  };

  const handleBulkChangePriority = (newPriority) => {
    if (selectedTaskIds.length === 0) return;
    bulkUpdateTasksMutation.mutate(
      { taskIds: selectedTaskIds, newPriority },
      { onSuccess: () => setSelectedTaskIds([]) }
    );
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const taskId = result.draggableId;
    const newStatus = normalizeTaskStatus(result.destination.droppableId);
    const task = allTasks.find((t) => t.id === taskId);

    if (task && normalizeTaskStatus(task.status) !== newStatus) {
      updateTaskMutation.mutate({ task, newStatus });
    }
  };

  const handleOpenCreateWithColumn = (columnStatus) => {
    setTaskForm((prev) => ({
      ...prev,
      status: columnStatus,
      project_id: selectedProjectId !== "all" ? selectedProjectId : "",
    }));
    setShowTaskDialog(true);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 mx-auto space-y-6 sm:space-y-8 max-w-7xl font-sans text-slate-900 pb-20">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/70">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-1">
            Tasks
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Track employee onboarding milestone progress.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            onClick={() => setShowProjectDialog(true)}
            className="h-9 px-3.5 text-xs font-semibold rounded-lg border-slate-200 hover:bg-slate-50 text-slate-700 shadow-2xs gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-slate-500" />
            <span>New Project</span>
          </Button>

          <Button
            onClick={() => handleOpenCreateWithColumn(TASK_STATUSES.TODO)}
            className="h-9 px-4 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-sm gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </Button>
        </div>
      </div>

      {/* 2. Executive 4-Card Spotlight KPI Grid */}
      <TaskMetricsGrid allTasks={allTasks} />

      {/* 3. Control Rail: Switcher & Filters */}
      <TaskControlBar
        viewMode={viewMode}
        setViewMode={setViewMode}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onlyMyTasks={onlyMyTasks}
        setOnlyMyTasks={setOnlyMyTasks}
        selectedProjectId={selectedProjectId}
        setSelectedProjectId={setSelectedProjectId}
        selectedPriority={selectedPriority}
        setSelectedPriority={setSelectedPriority}
        mappedProjects={mappedProjects}
        allTasksCount={allTasks.length}
      />

      {/* 4. Active Workstream View Mode */}
      {tasksLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="bg-slate-50 rounded-xl p-3 border border-slate-200/60 animate-pulse space-y-3">
              <div className="h-4 bg-slate-200 rounded w-1/2" />
              <div className="h-24 bg-white rounded-lg border border-slate-100" />
              <div className="h-24 bg-white rounded-lg border border-slate-100" />
            </div>
          ))}
        </div>
      ) : viewMode === "kanban" ? (
        <TaskKanbanView
          tasksByStatus={tasksByStatus}
          onDragEnd={handleDragEnd}
          onOpenCreateWithColumn={handleOpenCreateWithColumn}
          onSelectTask={setSelectedTask}
          selectedTaskIds={selectedTaskIds}
          onToggleSelectTask={handleToggleSelectTask}
        />
      ) : viewMode === "list" ? (
        <TaskListView
          filteredTasks={filteredTasks}
          onSelectTask={setSelectedTask}
          onUpdateStatus={(task, newStatus) => updateTaskMutation.mutate({ task, newStatus })}
          selectedTaskIds={selectedTaskIds}
          onToggleSelectTask={handleToggleSelectTask}
          onToggleSelectAll={handleToggleSelectAll}
        />
      ) : (
        <TaskProjectsView
          mappedProjects={mappedProjects}
          allTasks={allTasks}
          onSelectProject={(projId) => {
            setSelectedProjectId(projId);
            setViewMode("kanban");
          }}
        />
      )}

      {/* 5. Floating Bulk Action Toolbar */}
      <TaskBulkActionBar
        selectedCount={selectedTaskIds.length}
        onClearSelection={() => setSelectedTaskIds([])}
        onBulkMoveStatus={handleBulkMoveStatus}
        onBulkChangePriority={handleBulkChangePriority}
        isPending={bulkUpdateTasksMutation.isPending}
      />

      {/* 6. Slide-Over Task Inspection Sheet */}
      <TaskDetailSheet
        selectedTask={selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdateStatus={(task, newStatus) => updateTaskMutation.mutate({ task, newStatus })}
        onUpdatePriority={(task, newPriority) => updateTaskMutation.mutate({ task, newPriority })}
        onDeleteTask={(task) => deleteTaskMutation.mutate(task)}
        isDeleting={deleteTaskMutation.isPending}
      />

      {/* 7. Modal: Create Project */}
      <CreateProjectDialog
        open={showProjectDialog}
        onOpenChange={setShowProjectDialog}
        projectForm={projectForm}
        setProjectForm={setProjectForm}
        onSubmit={(e) => {
          e.preventDefault();
          createProjectMutation.mutate(projectForm, {
            onSuccess: () => {
              setShowProjectDialog(false);
              setProjectForm({ project_name: "", description: "", project_manager: user?.email || "" });
            },
          });
        }}
        isPending={createProjectMutation.isPending}
        employees={employees}
        currentUserEmail={user?.email || ""}
      />

      {/* 8. Modal: Create Task */}
      <CreateTaskDialog
        open={showTaskDialog}
        onOpenChange={setShowTaskDialog}
        taskForm={taskForm}
        setTaskForm={setTaskForm}
        onSubmit={(e) => {
          e.preventDefault();
          createTaskMutation.mutate(taskForm, {
            onSuccess: () => {
              setShowTaskDialog(false);
              setTaskForm({
                title: "",
                description: "",
                assigned_to: user?.email || "",
                priority: "medium",
                status: TASK_STATUSES.TODO,
                due_date: "",
                project_id: "",
              });
            },
          });
        }}
        isPending={createTaskMutation.isPending}
        mappedProjects={mappedProjects}
        employees={employees}
        currentUserEmail={user?.email || ""}
      />
    </div>
  );
}
