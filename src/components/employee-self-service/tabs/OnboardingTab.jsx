import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import {
  CheckCircle2,
  Clock,
  Download,
  UploadCloud,
  FileText,
  Send,
  ExternalLink,
  Sparkles,
  Filter,
  UserCheck,
  Building2,
  Calendar,
  AlertCircle,
  FileCheck,
  History,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { uploadToCloudinary } from '@/utils/cloudinary';
import { TASK_STATUSES, normalizeTaskStatus } from '@/constants/taskStatus';
import { useAuth } from '@/lib/AuthContext';
import {
  TASK_INPUT_TYPES,
  SINGLE_INPUT_SUBTYPES,
  TASK_OWNER_ROLES,
  COMPLETION_RULES,
} from '@/constants/onboardingTaskTypes';

const formatBytes = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function OnboardingTab({
  tasks = [],
  pendingTasksCount = 0,
  isCompleting = false,
  onCompleteAll,
  onOpenTaskManager,
  onToggleTask,
}) {
  const { user } = useAuth();

  // Scoping filter: 'my' (only tasks for new hire) vs 'all' (all cross-functional milestones)
  const [filterScope, setFilterScope] = useState('my');

  // Interactive inputs state
  const [inputs, setInputs] = useState({});
  const [selectedOptions, setSelectedOptions] = useState({});
  const [uploadingTaskId, setUploadingTaskId] = useState(null);

  // Filter tasks based on scope
  const filteredTasks = useMemo(() => {
    if (filterScope === 'all') return tasks;
    return tasks.filter((task) => {
      const role = task.assignedRole || task.ownerRole || TASK_OWNER_ROLES.EMPLOYEE;
      // Show tasks assigned specifically to Employee or unassigned
      if (role === TASK_OWNER_ROLES.EMPLOYEE) return true;
      if (user?.email && task.assigned_email && task.assigned_email.toLowerCase() === user.email.toLowerCase()) {
        return true;
      }
      return false;
    });
  }, [tasks, filterScope, user]);

  const activeTasksCount = filteredTasks.length;
  const completedTasksCount = filteredTasks.filter(
    (t) => Boolean(t.isCompleted) || normalizeTaskStatus(t.status) === TASK_STATUSES.DONE
  ).length;

  const completion = activeTasksCount > 0 ? Math.round((completedTasksCount / activeTasksCount) * 100) : 0;

  const handleInputChange = (taskId, value) => {
    setInputs((prev) => ({ ...prev, [taskId]: value }));
  };

  const handleToggleOption = (taskId, option, allowMultiple = true) => {
    setSelectedOptions((prev) => {
      const current = prev[taskId] || [];
      if (!allowMultiple) {
        return { ...prev, [taskId]: [option] };
      }
      const exists = current.includes(option);
      return {
        ...prev,
        [taskId]: exists ? current.filter((o) => o !== option) : [...current, option],
      };
    });
  };

  const handleSubmitInputTask = (task) => {
    const config = task.inputConfig || {};
    const subType = config.subType || SINGLE_INPUT_SUBTYPES.TEXT;
    const value = inputs[task.id] !== undefined ? inputs[task.id] : task.responseValue || '';

    const stringVal = String(value).trim();
    if (!stringVal) {
      toast.error('Please enter a response before saving.');
      return;
    }

    if (subType === SINGLE_INPUT_SUBTYPES.NUMBER && isNaN(Number(stringVal))) {
      toast.error('Please enter a valid numeric value.');
      return;
    }

    const shouldComplete = task.completionRule !== COMPLETION_RULES.REQUIRES_HR_REVIEW;
    onToggleTask({
      taskId: task.id,
      isCompleted: shouldComplete,
      status: shouldComplete ? TASK_STATUSES.DONE : TASK_STATUSES.REVIEW,
      responseValue: stringVal,
    });
    toast.success('Your response has been submitted!');
  };

  const handleSubmitSelectTask = (task) => {
    const config = task.inputConfig || {};
    const isMultiple = config.allowMultiple !== false;
    const selected =
      selectedOptions[task.id] ||
      (Array.isArray(task.responseValue) ? task.responseValue : task.responseValue ? [task.responseValue] : []);

    if (!selected || selected.length === 0) {
      toast.error('Please select at least one option.');
      return;
    }

    const valueToSave = isMultiple ? selected : selected[0];
    const shouldComplete = task.completionRule !== COMPLETION_RULES.REQUIRES_HR_REVIEW;

    onToggleTask({
      taskId: task.id,
      isCompleted: shouldComplete,
      status: shouldComplete ? TASK_STATUSES.DONE : TASK_STATUSES.REVIEW,
      responseValue: valueToSave,
    });
    toast.success('Choice submitted successfully!');
  };

  const handleFileUpload = async (task, file) => {
    if (!file) return;
    try {
      setUploadingTaskId(task.id);
      const res = await uploadToCloudinary(file);

      const submissionRecord = {
        fileName: file.name,
        fileUrl: res.secure_url,
        fileSize: file.size,
        fileType: file.type || file.name.split('.').pop()?.toUpperCase() || 'FILE',
        uploadedBy: user?.fullName || user?.email || 'Employee',
        uploadedAt: new Date().toISOString(),
      };

      const existingSubmissions = Array.isArray(task.submissions) ? task.submissions : [];
      const updatedSubmissions = [submissionRecord, ...existingSubmissions];
      const shouldComplete = task.completionRule !== COMPLETION_RULES.REQUIRES_HR_REVIEW;

      onToggleTask({
        taskId: task.id,
        isCompleted: shouldComplete,
        status: shouldComplete ? TASK_STATUSES.DONE : TASK_STATUSES.REVIEW,
        attachmentUrls: [res.secure_url, ...(task.attachmentUrls || [])],
        submissions: updatedSubmissions,
        responseValue: file.name,
      });

      toast.success(
        shouldComplete
          ? 'Evidence uploaded & activity marked complete!'
          : 'Document uploaded and submitted for HR review!'
      );
    } catch (err) {
      toast.error(`Upload failed: ${err.message || 'Error uploading file'}`);
    } finally {
      setUploadingTaskId(null);
    }
  };

  return (
    <div className="flex flex-col overflow-hidden bg-white border shadow-xs rounded-xl border-slate-200/80">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h2 className="text-base sm:text-lg font-semibold tracking-tight text-slate-900 font-heading flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-indigo-600" />
              <span>Onboarding Checklist & Activities</span>
            </h2>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200/60">
              {completedTasksCount} of {activeTasksCount} Completed
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Interactive onboarding requirements, equipment preferences, document templates, and submission evidence.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* Scope Toggle: My tasks vs All Milestones */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100/70 p-0.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => setFilterScope('my')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                filterScope === 'my'
                  ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              My Action Items
            </button>
            <button
              type="button"
              onClick={() => setFilterScope('all')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                filterScope === 'all'
                  ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Milestones
            </button>
          </div>

          {pendingTasksCount > 0 && onCompleteAll && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCompleteAll}
              disabled={isCompleting}
              className="text-xs font-medium text-slate-700 border-slate-200 hover:bg-slate-50 h-8 rounded-lg cursor-pointer"
            >
              {isCompleting ? 'Completing...' : 'Mark All Completed'}
            </Button>
          )}

          {onOpenTaskManager && (
            <Button
              size="sm"
              onClick={onOpenTaskManager}
              className="text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 h-8 rounded-lg shadow-sm cursor-pointer"
            >
              Workspace View
            </Button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {activeTasksCount > 0 && (
        <div className="px-4 sm:px-6 py-3 bg-slate-50/60 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Track Progress:</span>
            <span className="font-bold text-indigo-600">{completion}%</span>
            <span className="text-[11px] text-slate-400">
              ({activeTasksCount - completedTasksCount} pending action)
            </span>
          </div>
          <div className="w-full sm:w-64">
            <Progress value={completion} className="h-2 bg-slate-200/70" />
          </div>
        </div>
      )}

      {/* Task List */}
      <div className="p-4 sm:p-6">
        {filteredTasks.length === 0 ? (
          <div className="py-14 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-center text-slate-400 mx-auto mb-3">
              <CheckCircle2 className="w-7 h-7 text-emerald-500" />
            </div>
            <h4 className="text-sm font-semibold text-slate-800 font-heading">
              {filterScope === 'my' ? 'All Your Onboarding Tasks Are Clear' : 'No Onboarding Activities Found'}
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {filterScope === 'my'
                ? 'You have completed all pending action items assigned to you. You can toggle to "All Milestones" to see team coordination tasks.'
                : 'No structured onboarding milestones configured for this employee.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTasks.map((task) => {
              const statusNormalized = normalizeTaskStatus(task.status, Boolean(task.isCompleted));
              const isCompleted = statusNormalized === TASK_STATUSES.DONE;
              const isUnderReview = statusNormalized === TASK_STATUSES.REVIEW;

              const taskType = task.taskType || TASK_INPUT_TYPES.CHECKBOX;
              const config = task.inputConfig || {};
              const options = config.options || [];
              const assignedRole = task.assignedRole || task.ownerRole || TASK_OWNER_ROLES.EMPLOYEE;
              const isEmployeeRole = assignedRole === TASK_OWNER_ROLES.EMPLOYEE;

              // Submissions list
              const submissions = Array.isArray(task.submissions) && task.submissions.length > 0
                ? task.submissions
                : (task.attachmentUrls || []).map((url, i) => ({
                    fileName: `Attachment #${i + 1}`,
                    fileUrl: url,
                    uploadedAt: task.updatedAt || new Date().toISOString(),
                    uploadedBy: 'Employee',
                  }));

              return (
                <div
                  key={task.id}
                  className={`p-4 sm:p-5 rounded-xl border transition-all duration-200 ${
                    isCompleted
                      ? 'bg-slate-50/50 border-slate-200/70'
                      : isUnderReview
                      ? 'bg-purple-50/30 border-purple-200/70 shadow-2xs'
                      : 'bg-white border-slate-200/80 shadow-2xs hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    {/* Checkbox only for simple checkbox tasks, or disabled for input/upload tasks that require evidence */}
                    <Checkbox
                      checked={isCompleted}
                      onCheckedChange={() =>
                        onToggleTask({
                          taskId: task.id,
                          isCompleted,
                          status: isCompleted ? TASK_STATUSES.TODO : TASK_STATUSES.DONE,
                        })
                      }
                      className="mt-1"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h4
                          className={`font-semibold text-sm font-heading ${
                            isCompleted ? 'line-through text-slate-400' : 'text-slate-900'
                          }`}
                        >
                          {task.title}
                        </h4>

                        {/* Owner Badge */}
                        <Badge
                          className={`text-[10px] font-semibold border ${
                            isEmployeeRole
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : assignedRole === TASK_OWNER_ROLES.MANAGER
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {isEmployeeRole
                            ? 'Assigned to: You'
                            : assignedRole === TASK_OWNER_ROLES.MANAGER
                            ? 'Assigned to: Manager'
                            : 'Assigned to: HR Team'}
                        </Badge>

                        {task.category && (
                          <span className="text-[10px] font-medium capitalize px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                            {task.category.replace(/_/g, ' ')}
                          </span>
                        )}

                        {/* Status Badge */}
                        <Badge
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            isCompleted
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : isUnderReview
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-amber-50 text-amber-700 border-amber-300'
                          }`}
                        >
                          {isCompleted ? 'Completed' : isUnderReview ? 'Under Review' : 'Pending Action'}
                        </Badge>
                      </div>

                      {task.description && (
                        <p className="text-xs text-slate-600 leading-relaxed mb-2.5">
                          {task.description}
                        </p>
                      )}

                      {/* --- INTERACTIVE TASK TYPE 1: Single Text / Number / Date Input --- */}
                      {taskType === TASK_INPUT_TYPES.INPUT && (
                        <div className="mt-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                          <label className="text-[11px] font-semibold text-slate-700 flex items-center justify-between">
                            <span>{config.label || 'Your Response'}:</span>
                            {config.subType && (
                              <span className="text-[10px] font-normal text-slate-400 capitalize">
                                Type: {config.subType.replace('_', ' ')}
                              </span>
                            )}
                          </label>

                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            {config.subType === SINGLE_INPUT_SUBTYPES.SHORT_ANSWER ? (
                              <Textarea
                                rows={2}
                                placeholder={config.placeholder || 'Enter your response...'}
                                value={inputs[task.id] !== undefined ? inputs[task.id] : task.responseValue || ''}
                                onChange={(e) => handleInputChange(task.id, e.target.value)}
                                disabled={isCompleted}
                                className="text-xs bg-white border-slate-200 rounded-lg flex-1"
                              />
                            ) : (
                              <Input
                                type={
                                  config.subType === SINGLE_INPUT_SUBTYPES.DATE
                                    ? 'date'
                                    : config.subType === SINGLE_INPUT_SUBTYPES.NUMBER
                                    ? 'number'
                                    : 'text'
                                }
                                placeholder={config.placeholder || 'Enter your response...'}
                                value={inputs[task.id] !== undefined ? inputs[task.id] : task.responseValue || ''}
                                onChange={(e) => handleInputChange(task.id, e.target.value)}
                                disabled={isCompleted}
                                className="text-xs h-9 bg-white border-slate-200 rounded-lg flex-1"
                              />
                            )}

                            {!isCompleted && (
                              <Button
                                size="sm"
                                onClick={() => handleSubmitInputTask(task)}
                                className="h-9 px-4 text-xs bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold gap-1 shrink-0 cursor-pointer shadow-2xs self-end sm:self-auto"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>Save Response</span>
                              </Button>
                            )}
                          </div>

                          {task.responseValue && (
                            <div className="p-2 rounded bg-emerald-50/70 border border-emerald-200/60 text-[11px] text-emerald-800 font-medium flex items-center justify-between">
                              <span>Recorded Value: <strong className="font-semibold">{String(task.responseValue)}</strong></span>
                              {isCompleted && <span className="text-[10px] text-emerald-600 font-semibold">Verified</span>}
                            </div>
                          )}
                        </div>
                      )}

                      {/* --- INTERACTIVE TASK TYPE 2: Choice / Multi-Select --- */}
                      {taskType === TASK_INPUT_TYPES.MULTI_SELECT && options.length > 0 && (
                        <div className="mt-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                          <label className="text-[11px] font-semibold text-slate-700 flex items-center justify-between">
                            <span>{config.label || 'Select your preference'}:</span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              {config.allowMultiple !== false ? 'Multiple selections allowed' : 'Choose one option'}
                            </span>
                          </label>

                          <div className="flex flex-wrap gap-2">
                            {options.map((opt) => {
                              const activeList =
                                selectedOptions[task.id] ||
                                (Array.isArray(task.responseValue)
                                  ? task.responseValue
                                  : task.responseValue
                                  ? [task.responseValue]
                                  : []);
                              const isSelected = activeList.includes(opt);

                              return (
                                <button
                                  key={opt}
                                  type="button"
                                  disabled={isCompleted}
                                  onClick={() => handleToggleOption(task.id, opt, config.allowMultiple !== false)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                                    isSelected
                                      ? 'bg-slate-900 text-white border-slate-900 shadow-2xs font-semibold'
                                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100/70'
                                  }`}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>

                          {!isCompleted && (
                            <Button
                              size="sm"
                              onClick={() => handleSubmitSelectTask(task)}
                              className="h-8 px-3.5 text-xs bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold mt-1 gap-1.5 shadow-2xs cursor-pointer"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Submit Choice</span>
                            </Button>
                          )}

                          {task.responseValue && (
                            <div className="p-2 rounded bg-emerald-50/70 border border-emerald-200/60 text-[11px] text-emerald-800 font-medium">
                              Selected Choice:{' '}
                              <strong className="font-semibold">
                                {Array.isArray(task.responseValue)
                                  ? task.responseValue.join(', ')
                                  : String(task.responseValue)}
                              </strong>
                            </div>
                          )}
                        </div>
                      )}

                      {/* --- INTERACTIVE TASK TYPE 3: Template Download & Evidence Upload --- */}
                      {(taskType === TASK_INPUT_TYPES.FILE_UPLOAD ||
                        taskType === TASK_INPUT_TYPES.DOCUMENT_SIGNING) && (
                        <div className="mt-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                          {/* Attached Template from Admin */}
                          {task.templateUrl && (
                            <div className="flex items-center justify-between p-3 rounded-lg bg-indigo-50/60 border border-indigo-200/70 text-xs shadow-2xs">
                              <div className="flex items-center gap-2.5 truncate">
                                <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                                <div className="truncate">
                                  <span className="font-semibold text-slate-900 block truncate">
                                    {task.templateName || 'Official Starter Document Template'}
                                  </span>
                                  <span className="text-[10px] text-indigo-700">
                                    Download, fill/sign, and upload completed version below
                                  </span>
                                </div>
                              </div>
                              <a
                                href={task.templateUrl}
                                target="_blank"
                                rel="noreferrer"
                                download
                                className="inline-flex items-center gap-1 font-semibold text-indigo-700 hover:text-indigo-900 text-xs px-2.5 py-1 rounded-md bg-white border border-indigo-200 shadow-2xs transition-colors shrink-0 ml-2"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Download Form</span>
                              </a>
                            </div>
                          )}

                          {/* Upload Action */}
                          {!isCompleted && (
                            <div className="flex items-center gap-2">
                              <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer shadow-sm transition-colors">
                                <UploadCloud className="w-4 h-4 text-white" />
                                <span>
                                  {uploadingTaskId === task.id
                                    ? 'Uploading Document to Cloud...'
                                    : task.templateUrl
                                    ? 'Upload Completed / Signed Version'
                                    : 'Upload Document Evidence'}
                                </span>
                                <input
                                  type="file"
                                  className="hidden"
                                  disabled={uploadingTaskId === task.id}
                                  onChange={(e) => {
                                    if (e.target.files?.[0]) {
                                      handleFileUpload(task, e.target.files[0]);
                                    }
                                  }}
                                />
                              </label>
                            </div>
                          )}

                          {/* Submission History & Audit Trail */}
                          {submissions.length > 0 && (
                            <div className="space-y-2 pt-1">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                <History className="w-3 h-3 text-slate-400" />
                                <span>Submission History ({submissions.length})</span>
                              </span>
                              <div className="space-y-1.5">
                                {submissions.map((sub, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg text-xs"
                                  >
                                    <div className="flex items-center gap-2 truncate">
                                      <FileCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                      <div className="truncate">
                                        <span className="font-semibold text-slate-800 block truncate">
                                          {sub.fileName}
                                        </span>
                                        <span className="text-[10px] text-slate-400">
                                          Uploaded by {sub.uploadedBy || 'You'} •{' '}
                                          {sub.uploadedAt
                                            ? format(new Date(sub.uploadedAt), 'MMM d, yyyy h:mm a')
                                            : 'Recent'}{' '}
                                          {sub.fileSize ? `(${formatBytes(sub.fileSize)})` : ''}
                                        </span>
                                      </div>
                                    </div>
                                    <a
                                      href={sub.fileUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="font-semibold text-indigo-600 hover:text-indigo-800 underline inline-flex items-center gap-0.5 text-xs shrink-0 ml-2"
                                    >
                                      View <ExternalLink className="w-3 h-3" />
                                    </a>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Due date and Completion Rule */}
                      <div className="flex items-center gap-4 text-xs text-slate-400 mt-2.5 flex-wrap">
                        {task.dueDate && (
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>Due by: {format(new Date(task.dueDate), 'MMM d, yyyy')}</span>
                          </div>
                        )}
                        {task.completionRule === COMPLETION_RULES.REQUIRES_HR_REVIEW && (
                          <div className="flex items-center gap-1 text-[11px] text-purple-600 font-medium">
                            <AlertCircle className="w-3 h-3" />
                            <span>Requires HR verification after upload</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
