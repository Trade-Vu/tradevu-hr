// @ts-nocheck
import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectsApi, onboardingApi, employeesApi } from "@/api";
import { toast } from "sonner";
import { TASK_STATUSES, normalizeTaskStatus } from "@/constants/taskStatus";

export function useTaskManager({ user, selectedTask, setSelectedTask }) {
  const queryClient = useQueryClient();

  // Queries
  const { data: employeesData } = useQuery({
    queryKey: ["task-manager-employees"],
    queryFn: async () => employeesApi.getAllEmployees(),
  });
  const employees = Array.isArray(employeesData) ? employeesData : (employeesData?.data || []);

  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await projectsApi.getProjects({ limit: 100 });
      return Array.isArray(res) ? res : (res?.data?.data || res?.data || []);
    },
  });
  const rawProjects = Array.isArray(projectsData) ? projectsData : (projectsData?.data || []);

  const { data: projectTasksData, isLoading: projectTasksLoading } = useQuery({
    queryKey: ["project-tasks"],
    queryFn: async () => {
      const res = await projectsApi.getAllTasks();
      return Array.isArray(res) ? res : (res?.data?.data || res?.data || []);
    },
  });
  const rawProjectTasks = Array.isArray(projectTasksData) ? projectTasksData : (projectTasksData?.data || []);

  const { data: onboardingTasksData, isLoading: onboardingTasksLoading } = useQuery({
    queryKey: ["onboarding-tasks"],
    queryFn: async () => {
      const res = await onboardingApi.getAllTasks();
      return Array.isArray(res) ? res : (res?.data?.data || res?.data || []);
    },
  });
  const rawOnboardingTasks = Array.isArray(onboardingTasksData) ? onboardingTasksData : (onboardingTasksData?.data || []);

  const tasksLoading = projectsLoading || projectTasksLoading || onboardingTasksLoading;

  // Normalized Project Tasks
  const normalizedProjectTasks = useMemo(() => {
    return rawProjectTasks.map((t) => {
      const rawProjectId = t.projectId?._id || t.projectId;
      const proj = rawProjects.find((p) => String(p._id || p.id) === String(rawProjectId));
      const status = normalizeTaskStatus(t.status, Boolean(t.isCompleted));

      let assignedToDisplay = "Unassigned";
      let assignedEmail = "";
      if (typeof t.assignedTo === "string") {
        assignedToDisplay = t.assignedTo;
        assignedEmail = t.assignedTo;
      } else if (t.assignedTo && typeof t.assignedTo === "object") {
        assignedToDisplay =
          t.assignedTo.fullName ||
          t.assignedTo.name ||
          t.assignedTo.email ||
          t.assignedTo[0]?.fullName ||
          t.assignedTo[0]?.email ||
          "Unassigned";
        assignedEmail = t.assignedTo.email || t.assignedTo[0]?.email || "";
      }

      return {
        id: t._id || t.id,
        title: t.title || "Untitled Task",
        description: t.description || "",
        status,
        priority: (t.priority || "medium").toLowerCase(),
        assigned_to: assignedToDisplay,
        assigned_email: assignedEmail,
        project_id: rawProjectId ? String(rawProjectId) : null,
        projectName: proj?.name || proj?.project_name || "General Tasks",
        category: t.category || "Project Task",
        due_date: t.dueDate || t.due_date,
        is_onboarding: false,
      };
    });
  }, [rawProjectTasks, rawProjects]);

  // Normalized Onboarding Tasks
  const normalizedOnboardingTasks = useMemo(() => {
    return rawOnboardingTasks.map((t) => {
      const rawEmpId = t.employeeId?._id || t.employeeId;
      const emp =
        t.employeeId && typeof t.employeeId === "object" && (t.employeeId.fullName || t.employeeId.email)
          ? t.employeeId
          : employees.find((e) => String(e._id || e.id) === String(rawEmpId));

      const empName = emp?.fullName || emp?.email || "Employee";
      const empEmail = emp?.email || "";
      const projId = rawEmpId ? `onboarding_${String(rawEmpId)}` : "onboarding";
      const status = normalizeTaskStatus(t.status, Boolean(t.isCompleted));

      return {
        id: t._id || t.id,
        title: t.title || "Onboarding Task",
        description: t.description || (t.category ? `Category: ${t.category}` : ""),
        status,
        priority: (t.priority || "medium").toLowerCase(),
        assigned_to: empName,
        assigned_email: empEmail,
        project_id: projId,
        projectName: `Onboarding: ${empName}`,
        category: t.category || "Onboarding",
        due_date: t.dueDate || t.due_date,
        is_onboarding: true,
        taskType: t.taskType || "checkbox",
        assignedRole: t.assignedRole || t.ownerRole || "EMPLOYEE",
        completionRule: t.completionRule || "auto_on_submit",
        inputConfig: t.inputConfig,
        templateUrl: t.templateUrl,
        templateName: t.templateName,
        responseValue: t.responseValue,
        attachmentUrls: t.attachmentUrls || [],
        submissions: t.submissions || [],
        notes: t.notes,
      };
    });
  }, [rawOnboardingTasks, employees]);

  const allTasks = useMemo(
    () => [...normalizedProjectTasks, ...normalizedOnboardingTasks],
    [normalizedProjectTasks, normalizedOnboardingTasks]
  );

  // Mapped Projects
  const mappedProjects = useMemo(() => {
    const list = rawProjects.map((p) => ({
      id: String(p._id || p.id),
      project_name: p.name || p.project_name || "Untitled Project",
      description: p.description || "",
      status: p.status || "active",
      end_date: p.endDate || p.end_date,
      project_manager: p.projectManager || p.project_manager || "Unassigned",
      is_onboarding: false,
    }));

    const onboardingProjectsMap = new Map();
    normalizedOnboardingTasks.forEach((t) => {
      if (t.project_id && !onboardingProjectsMap.has(t.project_id)) {
        onboardingProjectsMap.set(t.project_id, {
          id: t.project_id,
          project_name: t.projectName,
          description: "Employee onboarding track and readiness milestones",
          status: "in_progress",
          is_onboarding: true,
          project_manager: "HR Team",
        });
      }
    });

    return [...list, ...Array.from(onboardingProjectsMap.values())];
  }, [rawProjects, normalizedOnboardingTasks]);

  // Mutations
  const createProjectMutation = useMutation({
    mutationFn: async (data) => {
      return await projectsApi.createProject({
        name: data.project_name,
        description: data.description,
        projectManager: data.project_manager,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project workspace created");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || error?.message || "Failed to create project");
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data) => {
      const targetProjectId =
        data.project_id && !data.project_id.startsWith("onboarding_") && data.project_id !== "general"
          ? data.project_id
          : undefined;

      const payload = {
        title: data.title,
        description: data.description,
        assignedTo: data.assigned_to,
        priority: data.priority,
        status: data.status || TASK_STATUSES.TODO,
        dueDate: data.due_date || undefined,
        projectId: targetProjectId,
      };
      return await projectsApi.createTask(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-tasks"] });
      toast.success("Task created successfully");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || error?.message || "Failed to create task");
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ task, newStatus, newPriority }) => {
      const canonicalStatus = newStatus ? normalizeTaskStatus(newStatus) : undefined;
      const payload = {};
      if (canonicalStatus) payload.status = canonicalStatus;
      if (newPriority) payload.priority = newPriority;

      if (task.is_onboarding) {
        return await onboardingApi.updateTask(task.id, payload);
      } else {
        return await projectsApi.updateTask(task.id, payload);
      }
    },
    onMutate: async ({ task, newStatus, newPriority }) => {
      const canonicalStatus = newStatus ? normalizeTaskStatus(newStatus) : undefined;
      const queryKey = task.is_onboarding ? ["onboarding-tasks"] : ["project-tasks"];
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old) => {
        if (!old) return old;
        const list = Array.isArray(old) ? old : (old?.data || []);
        const updatedList = list.map((item) => {
          const itemId = item._id || item.id;
          if (itemId === task.id) {
            return {
              ...item,
              ...(canonicalStatus ? { status: canonicalStatus, isCompleted: canonicalStatus === TASK_STATUSES.DONE } : {}),
              ...(newPriority ? { priority: newPriority } : {}),
            };
          }
          return item;
        });
        return Array.isArray(old) ? updatedList : { ...old, data: updatedList };
      });

      if (setSelectedTask) {
        setSelectedTask((prev) => {
          if (prev?.id === task.id) {
            return {
              ...prev,
              ...(canonicalStatus ? { status: canonicalStatus } : {}),
              ...(newPriority ? { priority: newPriority } : {}),
            };
          }
          return prev;
        });
      }

      return { previousData, queryKey };
    },
    onError: (error, variables, context) => {
      if (context?.queryKey && context?.previousData) {
        queryClient.setQueryData(context.queryKey, context.previousData);
      }
      toast.error("Failed to update task");
    },
    onSettled: (data, error, variables) => {
      if (variables?.task?.is_onboarding) {
        queryClient.invalidateQueries({ queryKey: ["onboarding-tasks"] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["project-tasks"] });
      }
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (task) => {
      if (task.is_onboarding) {
        throw new Error("Onboarding milestone tasks are system managed and cannot be directly deleted.");
      }
      return await projectsApi.deleteTask(task.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-tasks"] });
      if (setSelectedTask) setSelectedTask(null);
      toast.success("Task deleted successfully");
    },
    onError: (err) => {
      toast.error(err?.message || "Failed to delete task");
    },
  });

  const bulkUpdateTasksMutation = useMutation({
    mutationFn: async ({ taskIds, newStatus, newPriority }) => {
      const canonicalStatus = newStatus ? normalizeTaskStatus(newStatus) : undefined;
      const tasksToUpdate = allTasks.filter((t) => taskIds.includes(t.id));

      const promises = tasksToUpdate.map((task) => {
        const payload = {};
        if (canonicalStatus) payload.status = canonicalStatus;
        if (newPriority) payload.priority = newPriority;

        if (task.is_onboarding) {
          return onboardingApi.updateTask(task.id, payload);
        } else {
          return projectsApi.updateTask(task.id, payload);
        }
      });

      return await Promise.allSettled(promises);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["project-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["onboarding-tasks"] });
      const statusTitle = variables.newStatus
        ? TASK_STATUS_CONFIG[normalizeTaskStatus(variables.newStatus)]?.title || variables.newStatus
        : "updated";
      toast.success(`Successfully moved ${variables.taskIds.length} tasks to ${statusTitle}`);
    },
    onError: () => {
      toast.error("Failed to update some tasks");
    },
  });

  return {
    employees,
    rawProjects,
    mappedProjects,
    allTasks,
    tasksLoading,
    createProjectMutation,
    createTaskMutation,
    updateTaskMutation,
    bulkUpdateTasksMutation,
    deleteTaskMutation,
  };
}

