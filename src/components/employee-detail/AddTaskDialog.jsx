import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { UploadCloud, FileText, Sparkles, Check } from "lucide-react";
import { uploadToCloudinary } from "@/utils/cloudinary";
import { toast } from "sonner";
import {
  TASK_INPUT_TYPES,
  TASK_INPUT_TYPE_LABELS,
  SINGLE_INPUT_SUBTYPES,
  TASK_OWNER_ROLES,
  TASK_OWNER_ROLE_LABELS,
  COMPLETION_RULES,
  COMPLETION_RULE_LABELS,
} from "@/constants/onboardingTaskTypes";

export default function AddTaskDialog({ open, onClose, onSubmit, isSubmitting }) {
  const [taskData, setTaskData] = useState({
    title: "",
    description: "",
    department: "",
    owner_email: "",
    deadline: "",
    priority: "medium",
    status: "pending",
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
    isUploadRequired: false,
  });

  const [isUploadingTemplate, setIsUploadingTemplate] = useState(false);

  const handleTemplateUpload = async (file) => {
    if (!file) return;
    try {
      setIsUploadingTemplate(true);
      const res = await uploadToCloudinary(file);
      setTaskData((prev) => ({
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

    let inputConfig = null;
    if (taskData.taskType === TASK_INPUT_TYPES.INPUT) {
      inputConfig = {
        subType: taskData.inputSubType || SINGLE_INPUT_SUBTYPES.TEXT,
        label: taskData.inputLabel || taskData.title,
        placeholder: taskData.inputPlaceholder || "Enter your response...",
      };
    } else if (taskData.taskType === TASK_INPUT_TYPES.MULTI_SELECT) {
      const options = taskData.optionsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      inputConfig = {
        label: taskData.inputLabel || "Select your preference",
        options: options.length > 0 ? options : ["Option A", "Option B"],
        allowMultiple: Boolean(taskData.allowMultiple),
      };
    }

    const payload = {
      title: taskData.title,
      description: taskData.description,
      department: taskData.department,
      owner_email: taskData.owner_email,
      deadline: taskData.deadline,
      priority: taskData.priority,
      status: taskData.status,
      taskType: taskData.taskType,
      assignedRole: taskData.assignedRole,
      completionRule: taskData.completionRule,
      inputConfig,
      templateUrl: taskData.templateUrl || undefined,
      templateName: taskData.templateName || undefined,
      isUploadRequired: Boolean(taskData.isUploadRequired),
    };

    onSubmit(payload);
    resetForm();
  };

  const resetForm = () => {
    setTaskData({
      title: "",
      description: "",
      department: "",
      owner_email: "",
      deadline: "",
      priority: "medium",
      status: "pending",
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-white rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-900 font-heading">
            Create Onboarding Activity
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Define requirements, interactive form inputs, downloadable templates, or document signing for the employee.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs font-semibold text-slate-700">
              Activity Title *
            </Label>
            <Input
              id="title"
              value={taskData.title}
              onChange={(e) => setTaskData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="e.g. Choose Workstation Hardware Preference"
              required
              className="text-xs h-9 rounded-lg border-slate-200"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-semibold text-slate-700">
              Description / Instructions
            </Label>
            <Textarea
              id="description"
              value={taskData.description}
              onChange={(e) => setTaskData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Provide clear guidance for the employee on what to do..."
              rows={2}
              className="text-xs resize-none rounded-lg border-slate-200"
            />
          </div>

          {/* Activity / Input Type */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-800">
                  Interaction Method *
                </Label>
                <Select
                  value={taskData.taskType}
                  onValueChange={(val) => setTaskData((prev) => ({ ...prev, taskType: val }))}
                >
                  <SelectTrigger className="text-xs h-9 bg-white rounded-lg border-slate-200">
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
                  Responsible Owner *
                </Label>
                <Select
                  value={taskData.assignedRole}
                  onValueChange={(val) => setTaskData((prev) => ({ ...prev, assignedRole: val }))}
                >
                  <SelectTrigger className="text-xs h-9 bg-white rounded-lg border-slate-200">
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

            <div className="space-y-1.5 pt-1">
              <Label className="text-xs font-semibold text-slate-700">
                Completion Rule
              </Label>
              <Select
                value={taskData.completionRule}
                onValueChange={(val) => setTaskData((prev) => ({ ...prev, completionRule: val }))}
              >
                <SelectTrigger className="text-xs h-9 bg-white rounded-lg border-slate-200">
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

            {/* Sub-inputs based on task type */}
            {taskData.taskType === TASK_INPUT_TYPES.INPUT && (
              <div className="space-y-2 pt-2 border-t border-slate-200/70">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-slate-600">Expected Data Type</Label>
                    <Select
                      value={taskData.inputSubType}
                      onValueChange={(val) => setTaskData((prev) => ({ ...prev, inputSubType: val }))}
                    >
                      <SelectTrigger className="text-xs h-8 bg-white">
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
                    <Label className="text-[11px] font-semibold text-slate-600">Field Label</Label>
                    <Input
                      placeholder="e.g. Emergency Contact Number"
                      value={taskData.inputLabel}
                      onChange={(e) => setTaskData((prev) => ({ ...prev, inputLabel: e.target.value }))}
                      className="text-xs h-8 bg-white rounded-md border-slate-200"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-slate-600">Placeholder Text</Label>
                  <Input
                    placeholder="e.g. +1 (555) 000-0000"
                    value={taskData.inputPlaceholder}
                    onChange={(e) => setTaskData((prev) => ({ ...prev, inputPlaceholder: e.target.value }))}
                    className="text-xs h-8 bg-white rounded-md border-slate-200"
                  />
                </div>
              </div>
            )}

            {taskData.taskType === TASK_INPUT_TYPES.MULTI_SELECT && (
              <div className="space-y-2 pt-2 border-t border-slate-200/70">
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-slate-600">
                    Choices / Options (Comma-separated) *
                  </Label>
                  <Input
                    placeholder="e.g. Apple MacBook Pro, Dell XPS 15, Lenovo ThinkPad"
                    value={taskData.optionsText}
                    onChange={(e) => setTaskData((prev) => ({ ...prev, optionsText: e.target.value }))}
                    required
                    className="text-xs h-8 bg-white rounded-md border-slate-200"
                  />
                  <p className="text-[10px] text-slate-500">
                    Separate each option with a comma.
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Checkbox
                    id="allow-multi-dialog"
                    checked={taskData.allowMultiple}
                    onCheckedChange={(checked) =>
                      setTaskData((prev) => ({ ...prev, allowMultiple: Boolean(checked) }))
                    }
                  />
                  <Label htmlFor="allow-multi-dialog" className="text-xs font-medium text-slate-700 cursor-pointer">
                    Allow selecting multiple choices (uncheck for single choice)
                  </Label>
                </div>
              </div>
            )}

            {(taskData.taskType === TASK_INPUT_TYPES.FILE_UPLOAD ||
              taskData.taskType === TASK_INPUT_TYPES.DOCUMENT_SIGNING) && (
              <div className="space-y-2 pt-2 border-t border-slate-200/70">
                <Label className="text-[11px] font-semibold text-slate-600">
                  Attach Official Template / Form (Optional for Employee to Download)
                </Label>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-dashed border-indigo-300 text-indigo-700 text-xs font-semibold hover:bg-indigo-50/60 cursor-pointer shadow-2xs">
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>{isUploadingTemplate ? "Uploading Template..." : "Upload Form Template"}</span>
                    <input
                      type="file"
                      className="hidden"
                      disabled={isUploadingTemplate}
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleTemplateUpload(e.target.files[0]);
                      }}
                    />
                  </label>
                  {taskData.templateName && (
                    <span className="text-xs text-emerald-700 font-medium truncate max-w-xs flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Attached: {taskData.templateName}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-200/70">
                  <Checkbox
                    id="dialog-require-upload"
                    checked={
                      taskData.isUploadRequired ||
                      taskData.taskType === TASK_INPUT_TYPES.FILE_UPLOAD ||
                      taskData.taskType === TASK_INPUT_TYPES.DOCUMENT_SIGNING
                    }
                    onCheckedChange={(checked) =>
                      setTaskData((prev) => ({ ...prev, isUploadRequired: Boolean(checked) }))
                    }
                  />
                  <Label htmlFor="dialog-require-upload" className="text-xs font-medium text-slate-800 cursor-pointer">
                    Mark upload as required (employee must upload signed file/evidence)
                  </Label>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="department" className="text-xs font-semibold text-slate-700">
                Department / Category
              </Label>
              <Input
                id="department"
                value={taskData.department}
                onChange={(e) => setTaskData((prev) => ({ ...prev, department: e.target.value }))}
                placeholder="e.g. IT, HR, Legal"
                className="text-xs h-9 rounded-lg border-slate-200"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="priority" className="text-xs font-semibold text-slate-700">
                Priority
              </Label>
              <Select
                value={taskData.priority}
                onValueChange={(value) => setTaskData((prev) => ({ ...prev, priority: value }))}
              >
                <SelectTrigger className="text-xs h-9 rounded-lg border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="deadline" className="text-xs font-semibold text-slate-700">
                Target Due Date
              </Label>
              <Input
                id="deadline"
                type="date"
                value={taskData.deadline}
                onChange={(e) => setTaskData((prev) => ({ ...prev, deadline: e.target.value }))}
                className="text-xs h-9 rounded-lg border-slate-200"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="owner_email" className="text-xs font-semibold text-slate-700">
                Assignee / Supervisor Email
              </Label>
              <Input
                id="owner_email"
                type="email"
                value={taskData.owner_email}
                onChange={(e) => setTaskData((prev) => ({ ...prev, owner_email: e.target.value }))}
                placeholder="supervisor@company.com"
                className="text-xs h-9 rounded-lg border-slate-200"
              />
            </div>
          </div>

          <DialogFooter className="mt-5 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs h-9 rounded-lg"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || isUploadingTemplate}
              className="text-xs h-9 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold cursor-pointer"
            >
              {isSubmitting ? "Creating Activity..." : "Create Onboarding Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
