import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, FileText, CheckSquare, File, Edit, UploadCloud, UserCheck, ShieldAlert, Sparkles, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { uploadToCloudinary } from "@/utils/cloudinary";
import { toast } from "sonner";
import {
  TASK_INPUT_TYPES,
  TASK_INPUT_TYPE_LABELS,
  SINGLE_INPUT_SUBTYPES,
  SINGLE_INPUT_SUBTYPE_LABELS,
  TASK_OWNER_ROLES,
  TASK_OWNER_ROLE_LABELS,
  COMPLETION_RULES,
  COMPLETION_RULE_LABELS,
} from "@/constants/onboardingTaskTypes";

export default function TemplateForm({ initialData = null, onSubmit, onCancel, isSubmitting }) {
  const isEditing = Boolean(initialData && (initialData._id || initialData.id));

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    department: initialData?.department || initialData?.role_type || "",
    role_type: initialData?.department || initialData?.role_type || "",
    tasks: (initialData?.tasks || []).map((t) => ({
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
    })),
    required_documents: initialData?.requiredDocuments || initialData?.required_documents || [],
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        description: initialData.description || "",
        department: initialData.department || initialData.role_type || "",
        role_type: initialData.department || initialData.role_type || "",
        tasks: (initialData.tasks || []).map((t) => ({
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
        })),
        required_documents: initialData.requiredDocuments || initialData.required_documents || [],
      });
    }
  }, [initialData]);

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    deadline_days: 7,
    category: "General",
    taskType: TASK_INPUT_TYPES.CHECKBOX,
    assignedRole: TASK_OWNER_ROLES.EMPLOYEE,
    completionRule: COMPLETION_RULES.AUTO_ON_SUBMIT,
    // Input config fields
    inputSubType: SINGLE_INPUT_SUBTYPES.TEXT,
    inputLabel: "",
    inputPlaceholder: "",
    optionsText: "",
    allowMultiple: true,
    templateUrl: "",
    templateName: "",
  });

  const [isUploadingTemplate, setIsUploadingTemplate] = useState(false);
  const [newDocument, setNewDocument] = useState("");

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
      toast.success("Document template uploaded successfully!");
    } catch (err) {
      toast.error(`Template upload failed: ${err.message || "Error"}`);
    } finally {
      setIsUploadingTemplate(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      department: (formData.department || "").trim() || "All Departments",
      role_type: (formData.department || "").trim() || "All Departments",
    });
  };

  const addTask = () => {
    if (!newTask.title.trim()) {
      toast.error("Please enter a task title.");
      return;
    }

    let inputConfig = null;
    if (newTask.taskType === TASK_INPUT_TYPES.INPUT) {
      inputConfig = {
        subType: newTask.inputSubType || SINGLE_INPUT_SUBTYPES.TEXT,
        label: newTask.inputLabel || newTask.title,
        placeholder: newTask.inputPlaceholder || "Enter your response...",
      };
    } else if (newTask.taskType === TASK_INPUT_TYPES.MULTI_SELECT) {
      const options = newTask.optionsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      inputConfig = {
        label: newTask.inputLabel || "Select your preference",
        options: options.length > 0 ? options : ["Option A", "Option B"],
        allowMultiple: Boolean(newTask.allowMultiple),
      };
    }

    const taskToAdd = {
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
    };

    setFormData((prev) => ({
      ...prev,
      tasks: [...prev.tasks, taskToAdd],
    }));

    // Reset task form
    setNewTask({
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
    });
  };

  const removeTask = (index) => {
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

  return (
    <Card className="max-w-4xl mx-auto border-slate-200 shadow-lg">
      <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-2xl font-heading">
            {isEditing ? (
              <Edit className="w-6 h-6 text-indigo-600" />
            ) : (
              <FileText className="w-6 h-6 text-indigo-600" />
            )}
            {isEditing ? "Edit Onboarding Template" : "Create Onboarding Template"}
            {isEditing && (
              <Badge variant="outline" className="ml-2 bg-indigo-50 text-indigo-700 border-indigo-200 text-xs">
                Editing
              </Badge>
            )}
          </CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-slate-500 hover:text-slate-700 cursor-pointer"
          >
            Cancel
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {isEditing && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 leading-relaxed">
              <strong>Notice:</strong> Updates will automatically reflect on tasks for all employees who are still actively going through onboarding. Tasks that employees have already completed will remain preserved.
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 font-heading">Template Details</h3>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Software Engineer Onboarding"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Target Department *</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, department: e.target.value, role_type: e.target.value }))
                  }
                  placeholder="e.g., All Departments, Engineering, Sales, Marketing"
                  required
                />
                <p className="text-xs text-slate-500">
                  Specifies which department or team this template is suited for (or "All Departments" for company-wide use).
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this template includes..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Tasks Section */}
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900 font-heading flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-indigo-600" />
                <span>Onboarding Activities & Tasks</span>
              </h3>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                {formData.tasks.length} configured
              </span>
            </div>

            {/* Configured Task List */}
            {formData.tasks.length > 0 && (
              <div className="space-y-3 mb-4">
                {formData.tasks.map((task, index) => (
                  <div
                    key={index}
                    className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/90 shadow-2xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-sm text-slate-900">{task.title}</span>
                          <Badge variant="outline" className="text-[10px] bg-white border-slate-200 text-slate-700">
                            Due in {task.deadline_days} days
                          </Badge>
                          <Badge
                            className={`text-[10px] font-semibold border ${
                              task.assignedRole === TASK_OWNER_ROLES.EMPLOYEE
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : task.assignedRole === TASK_OWNER_ROLES.MANAGER
                                ? "bg-purple-50 text-purple-700 border-purple-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                          >
                            Owner: {TASK_OWNER_ROLE_LABELS[task.assignedRole] || task.assignedRole}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px] bg-slate-200/70 text-slate-800">
                            {TASK_INPUT_TYPE_LABELS[task.taskType] || task.taskType}
                          </Badge>
                        </div>
                        {task.description && (
                          <p className="text-xs text-slate-600 leading-relaxed">{task.description}</p>
                        )}
                        {task.templateName && (
                          <p className="text-[11px] text-indigo-600 font-medium flex items-center gap-1 mt-1.5">
                            <FileText className="w-3.5 h-3.5" />
                            Template Form Attached: {task.templateName}
                          </p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeTask(index)}
                        className="text-slate-400 hover:text-red-600 shrink-0 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Task Form Card */}
            <div className="p-5 border-2 border-dashed border-indigo-200/80 rounded-xl space-y-4 bg-indigo-50/20">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Define New Structured Activity</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="task-title" className="text-xs font-semibold text-slate-700">
                    Activity Title *
                  </Label>
                  <Input
                    id="task-title"
                    placeholder="e.g. Confirm Emergency Contact & Upload Signed Offer Letter"
                    value={newTask.title}
                    onChange={(e) => setNewTask((prev) => ({ ...prev, title: e.target.value }))}
                    className="bg-white text-xs h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">
                    Activity Owner / Responsible Role *
                  </Label>
                  <Select
                    value={newTask.assignedRole}
                    onValueChange={(val) => setNewTask((prev) => ({ ...prev, assignedRole: val }))}
                  >
                    <SelectTrigger className="bg-white text-xs h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      <SelectItem value={TASK_OWNER_ROLES.EMPLOYEE}>Employee (New Hire)</SelectItem>
                      <SelectItem value={TASK_OWNER_ROLES.MANAGER}>Manager / Team Lead</SelectItem>
                      <SelectItem value={TASK_OWNER_ROLES.HR_ADMIN}>HR Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="task-description" className="text-xs font-semibold text-slate-700">
                  Description / Guidance
                </Label>
                <Textarea
                  id="task-description"
                  placeholder="Provide instructions, links, or expectations for completing this task..."
                  value={newTask.description}
                  onChange={(e) => setNewTask((prev) => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="bg-white text-xs resize-none"
                />
              </div>

              {/* Task Interaction & Input Method */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3.5 shadow-2xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-800">
                      Response & Input Method *
                    </Label>
                    <Select
                      value={newTask.taskType}
                      onValueChange={(val) => setNewTask((prev) => ({ ...prev, taskType: val }))}
                    >
                      <SelectTrigger className="text-xs h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="text-xs">
                        <SelectItem value={TASK_INPUT_TYPES.CHECKBOX}>
                          {TASK_INPUT_TYPE_LABELS[TASK_INPUT_TYPES.CHECKBOX]}
                        </SelectItem>
                        <SelectItem value={TASK_INPUT_TYPES.INPUT}>
                          {TASK_INPUT_TYPE_LABELS[TASK_INPUT_TYPES.INPUT]}
                        </SelectItem>
                        <SelectItem value={TASK_INPUT_TYPES.MULTI_SELECT}>
                          {TASK_INPUT_TYPE_LABELS[TASK_INPUT_TYPES.MULTI_SELECT]}
                        </SelectItem>
                        <SelectItem value={TASK_INPUT_TYPES.FILE_UPLOAD}>
                          {TASK_INPUT_TYPE_LABELS[TASK_INPUT_TYPES.FILE_UPLOAD]}
                        </SelectItem>
                        <SelectItem value={TASK_INPUT_TYPES.DOCUMENT_SIGNING}>
                          {TASK_INPUT_TYPE_LABELS[TASK_INPUT_TYPES.DOCUMENT_SIGNING]}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-800">
                      Completion Rule *
                    </Label>
                    <Select
                      value={newTask.completionRule}
                      onValueChange={(val) => setNewTask((prev) => ({ ...prev, completionRule: val }))}
                    >
                      <SelectTrigger className="text-xs h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="text-xs">
                        <SelectItem value={COMPLETION_RULES.AUTO_ON_SUBMIT}>
                          {COMPLETION_RULE_LABELS[COMPLETION_RULES.AUTO_ON_SUBMIT]}
                        </SelectItem>
                        <SelectItem value={COMPLETION_RULES.REQUIRES_HR_REVIEW}>
                          {COMPLETION_RULE_LABELS[COMPLETION_RULES.REQUIRES_HR_REVIEW]}
                        </SelectItem>
                        <SelectItem value={COMPLETION_RULES.MANUAL_CHECK}>
                          {COMPLETION_RULE_LABELS[COMPLETION_RULES.MANUAL_CHECK]}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Sub-config: Single Input */}
                {newTask.taskType === TASK_INPUT_TYPES.INPUT && (
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold text-slate-600">Expected Data Type</Label>
                        <Select
                          value={newTask.inputSubType}
                          onValueChange={(val) => setNewTask((prev) => ({ ...prev, inputSubType: val }))}
                        >
                          <SelectTrigger className="bg-white text-xs h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="text-xs">
                            <SelectItem value={SINGLE_INPUT_SUBTYPES.TEXT}>Text</SelectItem>
                            <SelectItem value={SINGLE_INPUT_SUBTYPES.NUMBER}>Number / Numeric</SelectItem>
                            <SelectItem value={SINGLE_INPUT_SUBTYPES.DATE}>Date</SelectItem>
                            <SelectItem value={SINGLE_INPUT_SUBTYPES.SHORT_ANSWER}>Short Answer / Paragraph</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold text-slate-600">Prompt / Label</Label>
                        <Input
                          placeholder="e.g. Emergency Contact Name"
                          value={newTask.inputLabel}
                          onChange={(e) => setNewTask((prev) => ({ ...prev, inputLabel: e.target.value }))}
                          className="bg-white text-xs h-8"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold text-slate-600">Placeholder Text</Label>
                        <Input
                          placeholder="e.g. John Doe (+234 800 000 0000)"
                          value={newTask.inputPlaceholder}
                          onChange={(e) => setNewTask((prev) => ({ ...prev, inputPlaceholder: e.target.value }))}
                          className="bg-white text-xs h-8"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-config: Multi-Select */}
                {newTask.taskType === TASK_INPUT_TYPES.MULTI_SELECT && (
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold text-slate-600">
                        Choices / Options (Comma-separated) *
                      </Label>
                      <Input
                        placeholder="e.g. Apple MacBook Pro, Dell XPS 15, Lenovo ThinkPad"
                        value={newTask.optionsText}
                        onChange={(e) => setNewTask((prev) => ({ ...prev, optionsText: e.target.value }))}
                        className="bg-white text-xs h-8"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <Checkbox
                        id="allow-multi"
                        checked={newTask.allowMultiple}
                        onCheckedChange={(checked) =>
                          setNewTask((prev) => ({ ...prev, allowMultiple: Boolean(checked) }))
                        }
                      />
                      <Label htmlFor="allow-multi" className="text-xs font-medium text-slate-700 cursor-pointer">
                        Allow selecting multiple choices (uncheck for single choice only)
                      </Label>
                    </div>
                  </div>
                )}

                {/* Sub-config: Upload / Document Signing with Template */}
                {(newTask.taskType === TASK_INPUT_TYPES.FILE_UPLOAD ||
                  newTask.taskType === TASK_INPUT_TYPES.DOCUMENT_SIGNING) && (
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-2">
                    <Label className="text-[11px] font-semibold text-slate-700 block">
                      Attach Official Document / Form Template (Optional for employee to download)
                    </Label>
                    <div className="flex items-center gap-3">
                      <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-dashed border-indigo-400 text-indigo-700 hover:bg-indigo-50/70 text-xs font-semibold cursor-pointer shadow-2xs transition-colors">
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>
                          {isUploadingTemplate ? "Uploading Template..." : "Upload File Template"}
                        </span>
                        <input
                          type="file"
                          className="hidden"
                          disabled={isUploadingTemplate}
                          onChange={(e) => {
                            if (e.target.files?.[0]) handleTemplateUpload(e.target.files[0]);
                          }}
                        />
                      </label>
                      {newTask.templateName && (
                        <span className="text-xs text-emerald-700 font-semibold truncate max-w-sm flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Attached: {newTask.templateName}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-1">
                <div className="space-y-1.5 w-full sm:w-64">
                  <Label htmlFor="task-deadline" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    <span>Days Until Deadline *</span>
                  </Label>
                  <Input
                    id="task-deadline"
                    type="number"
                    min="1"
                    placeholder="e.g., 7"
                    value={newTask.deadline_days}
                    onChange={(e) =>
                      setNewTask((prev) => ({ ...prev, deadline_days: parseInt(e.target.value) || 1 }))
                    }
                    className="bg-white text-xs h-9"
                  />
                </div>
                <Button
                  type="button"
                  onClick={addTask}
                  disabled={isUploadingTemplate}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold h-9 px-4 rounded-lg shadow-sm cursor-pointer self-end"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add Activity to Template
                </Button>
              </div>
            </div>
          </div>

          {/* Required Documents Checklist */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 font-heading flex items-center gap-2">
              <File className="w-5 h-5 text-indigo-600" />
              <span>Standard Identification & Paperwork Documents</span>
            </h3>

            {formData.required_documents.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {formData.required_documents.map((doc, index) => (
                  <Badge key={index} variant="secondary" className="px-3 py-1.5 text-xs bg-slate-100 text-slate-800 border border-slate-200 gap-1.5">
                    <span>{doc}</span>
                    <button
                      type="button"
                      onClick={() => removeDocument(index)}
                      className="text-slate-400 hover:text-red-600 cursor-pointer ml-1 font-bold"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex gap-2.5">
              <Input
                placeholder="Document name (e.g., National ID / Passport, Academic Degree Certificate)"
                value={newDocument}
                onChange={(e) => setNewDocument(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addDocument())}
                className="text-xs h-9"
              />
              <Button
                type="button"
                onClick={addDocument}
                variant="outline"
                className="text-xs h-9 px-3.5 border-slate-200 hover:bg-slate-50 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Add Document
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="text-xs h-9 rounded-lg"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold h-9 px-5 rounded-lg shadow-sm"
            >
              {isSubmitting
                ? isEditing
                  ? "Saving Changes..."
                  : "Creating Template..."
                : isEditing
                ? "Save Changes"
                : "Create Onboarding Template"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
