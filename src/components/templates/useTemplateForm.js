import { useState, useEffect, useRef } from "react";
import { uploadToCloudinary } from "@/utils/cloudinary";
import { toast } from "sonner";
import {
  TASK_INPUT_TYPES,
  SINGLE_INPUT_SUBTYPES,
  TASK_OWNER_ROLES,
  COMPLETION_RULES,
} from "@/constants/onboardingTaskTypes";

const DEFAULT_EMPLOYMENT_TYPES = ["PERMANENT", "PROBATIONARY", "CONTRACT", "CONSULTANT"];

const DEFAULT_EMPLOYEE_CLASSES = [
  "INTERN",
  "TEAM MEMBER",
  "MID LEVEL TEAM MEMBER",
  "MID LEVEL MANAGER",
  "MANAGER",
  "SENIOR MANAGER",
  "EXECUTIVE MANAGER",
];

export const INITIAL_TASK_STATE = {
  title: "",
  description: "",
  deadline_days: 7,
  category: "General",
  taskType: TASK_INPUT_TYPES.CHECKBOX,
  assignedRole: TASK_OWNER_ROLES.EMPLOYEE,
  completionRule: COMPLETION_RULES.AUTO_ON_SUBMIT,
  inputSubType: SINGLE_INPUT_SUBTYPES.TEXT,
  inputLabel: "",
  inputPlaceholder: "",
  optionsText: "",
  allowMultiple: true,
  templateUrl: "",
  templateName: "",
  companyAssetId: null,
  isUploadRequired: false,
};

const normalizeTasks = (tasks = []) =>
  tasks.map((t) => ({
    title: t.title || "",
    description: t.description || "",
    deadline_days: t.dueOffset ?? t.deadline_days ?? 7,
    category: t.category || "General",
    taskType: t.taskType || TASK_INPUT_TYPES.CHECKBOX,
    assignedRole: t.assignedRole || TASK_OWNER_ROLES.EMPLOYEE,
    completionRule: t.completionRule || COMPLETION_RULES.AUTO_ON_SUBMIT,
    inputConfig: t.inputConfig || null,
    templateUrl: t.templateUrl || "",
    templateName: t.templateName || "",
    companyAssetId: t.companyAssetId || null,
    isUploadRequired: Boolean(t.isUploadRequired),
  }));

export function useTemplateForm({ initialData, onSubmit, orgData }) {
  const taskEditorRef = useRef(null);

  const resolvedEmploymentTypes =
    Array.isArray(orgData?.employmentTypes) && orgData.employmentTypes.length > 0
      ? orgData.employmentTypes.map((t) => (typeof t === "string" ? t.toUpperCase() : String(t?.name || "").toUpperCase()))
      : DEFAULT_EMPLOYMENT_TYPES;

  const resolvedEmployeeClasses =
    Array.isArray(orgData?.employeeClasses) && orgData.employeeClasses.length > 0
      ? orgData.employeeClasses.map((c) => (typeof c === "string" ? c.toUpperCase() : String(c?.name || c?.value || "").toUpperCase()))
      : DEFAULT_EMPLOYEE_CLASSES;

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    department: initialData?.department || initialData?.role_type || "All Departments",
    role_type: initialData?.department || initialData?.role_type || "All Departments",
    employeeClass: initialData?.employeeClass || "All Classes",
    employmentType: initialData?.employmentType || "All Types",
    tasks: normalizeTasks(initialData?.tasks),
    required_documents: initialData?.requiredDocuments || initialData?.required_documents || [],
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        description: initialData.description || "",
        department: initialData.department || initialData.role_type || "All Departments",
        role_type: initialData.department || initialData.role_type || "All Departments",
        employeeClass: initialData.employeeClass || "All Classes",
        employmentType: initialData.employmentType || "All Types",
        tasks: normalizeTasks(initialData.tasks),
        required_documents: initialData.requiredDocuments || initialData.required_documents || [],
      });
    }
  }, [initialData]);

  const [editingTaskIndex, setEditingTaskIndex] = useState(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState(INITIAL_TASK_STATE);
  const [isUploadingTemplate, setIsUploadingTemplate] = useState(false);
  const [newDocument, setNewDocument] = useState("");

  const handleTaskFieldChange = (field, value) => {
    setNewTask((prev) => ({ ...prev, [field]: value }));
  };

  const handleOpenCreateTask = () => {
    setEditingTaskIndex(null);
    setNewTask(INITIAL_TASK_STATE);
    setIsTaskDialogOpen(true);
  };

  const handleEditTask = (index) => {
    const taskToEdit = formData.tasks[index];
    if (!taskToEdit) return;

    setEditingTaskIndex(index);
    setNewTask({
      title: taskToEdit.title || "",
      description: taskToEdit.description || "",
      deadline_days: taskToEdit.deadline_days || 7,
      category: taskToEdit.category || "General",
      taskType: taskToEdit.taskType || TASK_INPUT_TYPES.CHECKBOX,
      assignedRole: taskToEdit.assignedRole || TASK_OWNER_ROLES.EMPLOYEE,
      completionRule: taskToEdit.completionRule || COMPLETION_RULES.AUTO_ON_SUBMIT,
      inputSubType: taskToEdit.inputConfig?.subType || SINGLE_INPUT_SUBTYPES.TEXT,
      inputLabel: taskToEdit.inputConfig?.label || "",
      inputPlaceholder: taskToEdit.inputConfig?.placeholder || "",
      optionsText: (taskToEdit.inputConfig?.options || []).join(", "),
      allowMultiple: taskToEdit.inputConfig?.allowMultiple !== false,
      templateUrl: taskToEdit.templateUrl || "",
      templateName: taskToEdit.templateName || "",
      isUploadRequired: Boolean(taskToEdit.isUploadRequired),
    });

    setIsTaskDialogOpen(true);
  };

  const handleCloseTaskDialog = () => {
    setIsTaskDialogOpen(false);
    setEditingTaskIndex(null);
    setNewTask(INITIAL_TASK_STATE);
  };

  const handleTemplateUpload = async (file) => {
    if (!file) return;
    try {
      setIsUploadingTemplate(true);
      const res = await uploadToCloudinary(file);
      setNewTask((prev) => ({
        ...prev,
        templateUrl: res.secure_url,
        templateName: file.name,
      }));
      toast.success("Document template uploaded and attached!");
    } catch (err) {
      toast.error(`Template upload failed: ${err.message || "Error"}`);
    } finally {
      setIsUploadingTemplate(false);
    }
  };

  const handleRemoveAttachedTemplate = () => {
    setNewTask((prev) => ({
      ...prev,
      templateUrl: "",
      templateName: "",
    }));
  };

  const saveTask = () => {
    if (!newTask.title.trim()) {
      toast.error("Please enter an activity / task title.");
      return;
    }

    let inputConfig = null;
    if (newTask.taskType === TASK_INPUT_TYPES.INPUT) {
      inputConfig = {
        subType: newTask.inputSubType || SINGLE_INPUT_SUBTYPES.TEXT,
        label: (newTask.inputLabel || "").trim() || newTask.title.trim(),
        placeholder: newTask.inputPlaceholder || "Enter your response...",
      };
    } else if (newTask.taskType === TASK_INPUT_TYPES.MULTI_SELECT) {
      const options = newTask.optionsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      inputConfig = {
        label: (newTask.inputLabel || "").trim() || "Select your preference",
        options: options.length > 0 ? options : ["Option A", "Option B"],
        allowMultiple: Boolean(newTask.allowMultiple),
      };
    } else if (
      newTask.taskType === TASK_INPUT_TYPES.FILE_UPLOAD ||
      newTask.taskType === TASK_INPUT_TYPES.DOCUMENT_SIGNING
    ) {
      inputConfig = {
        label: (newTask.inputLabel || "").trim() || "Upload required file or signed form",
      };
    } else if (newTask.inputLabel.trim()) {
      inputConfig = {
        label: newTask.inputLabel.trim(),
      };
    }

    const taskToSave = {
      title: newTask.title.trim(),
      description: newTask.description.trim(),
      deadline_days: Number(newTask.deadline_days) || 7,
      category: newTask.category || "General",
      taskType: newTask.taskType,
      assignedRole: newTask.assignedRole,
      completionRule: newTask.completionRule,
      inputConfig,
      templateUrl: newTask.templateUrl || "",
      templateName: newTask.templateName || "",
      isUploadRequired: Boolean(
        newTask.isUploadRequired ||
        newTask.taskType === TASK_INPUT_TYPES.FILE_UPLOAD ||
        newTask.taskType === TASK_INPUT_TYPES.DOCUMENT_SIGNING
      ),
    };

    if (editingTaskIndex !== null) {
      setFormData((prev) => {
        const updatedTasks = [...prev.tasks];
        updatedTasks[editingTaskIndex] = taskToSave;
        return { ...prev, tasks: updatedTasks };
      });
      toast.success("Task updated successfully!");
      setEditingTaskIndex(null);
    } else {
      setFormData((prev) => ({
        ...prev,
        tasks: [...prev.tasks, taskToSave],
      }));
      toast.success("Activity added to template!");
    }

    setNewTask(INITIAL_TASK_STATE);
    setEditingTaskIndex(null);
    setIsTaskDialogOpen(false);
  };

  const removeTask = (index) => {
    if (editingTaskIndex === index) {
      setEditingTaskIndex(null);
      setNewTask(INITIAL_TASK_STATE);
    } else if (editingTaskIndex !== null && index < editingTaskIndex) {
      setEditingTaskIndex(editingTaskIndex - 1);
    }
    setFormData((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((_, i) => i !== index),
    }));
  };

  const addDocument = () => {
    if (newDocument.trim()) {
      setFormData((prev) => ({
        ...prev,
        required_documents: [...prev.required_documents, newDocument.trim()],
      }));
      setNewDocument("");
    }
  };

  const removeDocument = (index) => {
    setFormData((prev) => ({
      ...prev,
      required_documents: prev.required_documents.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Please enter a template name");
      return;
    }
    onSubmit({
      ...formData,
      department: (formData.department || "").trim() || "All Departments",
      role_type: (formData.department || "").trim() || "All Departments",
    });
  };

  return {
    taskEditorRef,
    formData,
    setFormData,
    editingTaskIndex,
    isTaskDialogOpen,
    setIsTaskDialogOpen,
    newTask,
    isUploadingTemplate,
    newDocument,
    setNewDocument,
    resolvedEmploymentTypes,
    resolvedEmployeeClasses,
    handleTaskFieldChange,
    handleOpenCreateTask,
    handleEditTask,
    handleCloseTaskDialog,
    handleTemplateUpload,
    handleRemoveAttachedTemplate,
    saveTask,
    removeTask,
    addDocument,
    removeDocument,
    handleSubmit,
  };
}
