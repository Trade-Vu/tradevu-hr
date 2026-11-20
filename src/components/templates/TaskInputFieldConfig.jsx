import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sliders,
  Sparkles,
  Paperclip,
  UploadCloud,
  Check,
} from "lucide-react";
import {
  TASK_INPUT_TYPES,
  TASK_INPUT_TYPE_LABELS,
  SINGLE_INPUT_SUBTYPES,
  COMPLETION_RULES,
  COMPLETION_RULE_LABELS,
} from "@/constants/onboardingTaskTypes";
import CompanyLibraryAssetSelector from "./CompanyLibraryAssetSelector";

export default function TaskInputFieldConfig({
  task,
  onChange,
  isUploadingTemplate,
  onTemplateUpload,
  onRemoveTemplate,
}) {
  return (
    <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-4 shadow-2xs">
      <div className="border-b border-slate-100 pb-2">
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-indigo-600" />
          <span>Input Field Configuration</span>
        </h4>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Select the kind of input field shown to the employee and specify its custom prompt label.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Select the Kind of Input Field */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-700">
            Kind of Input Field *
          </Label>
          <Select
            value={task.taskType}
            onValueChange={(val) => onChange("taskType", val)}
          >
            <SelectTrigger className="text-xs h-9 bg-white">
              <SelectValue placeholder="Select input field type" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value={TASK_INPUT_TYPES.INPUT}>
                Normal Input Field (Text, Number, Date, Paragraph)
              </SelectItem>
              <SelectItem value={TASK_INPUT_TYPES.MULTI_SELECT}>
                Multiple Select / Choices
              </SelectItem>
              <SelectItem value={TASK_INPUT_TYPES.FILE_UPLOAD}>
                File Select / Document Evidence
              </SelectItem>
              <SelectItem value={TASK_INPUT_TYPES.DOCUMENT_SIGNING}>
                Template Download & Signed Document Upload
              </SelectItem>
              <SelectItem value={TASK_INPUT_TYPES.CHECKBOX}>
                Checkbox / Acknowledgment
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 2. Custom Input Field Label */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-700">
            Input Field Label / Prompt *
          </Label>
          <Input
            placeholder="e.g. Emergency Contact Name, Laptop Model Preference, or Bank Account No"
            value={task.inputLabel}
            onChange={(e) => onChange("inputLabel", e.target.value)}
            className="bg-white text-xs h-9"
          />
          <span className="text-[10px] text-slate-400 block">
            Label shown directly above the input field on the employee checklist.
          </span>
        </div>
      </div>

      {/* Sub-config 1: Normal Input Field (configured with data subtype, placeholder) */}
      {task.taskType === TASK_INPUT_TYPES.INPUT && (
        <div className="p-3.5 bg-slate-50/90 rounded-lg border border-slate-200 space-y-3">
          <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Normal Input Field Options</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-slate-600">Input Data Subtype</Label>
              <Select
                value={task.inputSubType}
                onValueChange={(val) => onChange("inputSubType", val)}
              >
                <SelectTrigger className="bg-white text-xs h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value={SINGLE_INPUT_SUBTYPES.TEXT}>Text (Single Line)</SelectItem>
                  <SelectItem value={SINGLE_INPUT_SUBTYPES.NUMBER}>Numeric (e.g. Account / Serial No)</SelectItem>
                  <SelectItem value={SINGLE_INPUT_SUBTYPES.DATE}>Date</SelectItem>
                  <SelectItem value={SINGLE_INPUT_SUBTYPES.SHORT_ANSWER}>Short Answer / Paragraph</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-slate-600">Placeholder Text</Label>
              <Input
                placeholder="e.g. Jane Doe (+234 800 000 0000)"
                value={task.inputPlaceholder}
                onChange={(e) => onChange("inputPlaceholder", e.target.value)}
                className="bg-white text-xs h-8"
              />
            </div>
          </div>
        </div>
      )}

      {/* Sub-config 2: Multi-Select / Choices */}
      {task.taskType === TASK_INPUT_TYPES.MULTI_SELECT && (
        <div className="p-3.5 bg-slate-50/90 rounded-lg border border-slate-200 space-y-3">
          <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Multiple Select Options</span>
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] font-semibold text-slate-600">
              Choices / Options (Comma-separated) *
            </Label>
            <Input
              placeholder="e.g. Apple MacBook Pro, Dell XPS 15, Lenovo ThinkPad"
              value={task.optionsText}
              onChange={(e) => onChange("optionsText", e.target.value)}
              className="bg-white text-xs h-8"
            />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Checkbox
              id="allow-multi"
              checked={task.allowMultiple}
              onCheckedChange={(checked) => onChange("allowMultiple", Boolean(checked))}
            />
            <Label htmlFor="allow-multi" className="text-xs font-medium text-slate-700 cursor-pointer">
              Allow selecting multiple choices (uncheck for single choice only)
            </Label>
          </div>
        </div>
      )}

      {/* Sub-config 3: Completion Rule & Deadline Days */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-700">
            Completion Rule *
          </Label>
          <Select
            value={task.completionRule}
            onValueChange={(val) => onChange("completionRule", val)}
          >
            <SelectTrigger className="text-xs h-9 bg-white">
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

        <div className="space-y-1.5">
          <Label htmlFor="task-deadline" className="text-xs font-semibold text-slate-700">
            Days Until Deadline *
          </Label>
          <Input
            id="task-deadline"
            type="number"
            min="1"
            placeholder="e.g., 7"
            value={task.deadline_days}
            onChange={(e) => onChange("deadline_days", parseInt(e.target.value) || 1)}
            className="bg-white text-xs h-9"
          />
        </div>
      </div>

      {/* Sub-config 4: Attach Template Form & Mark Upload as Required */}
      <div className="p-3.5 bg-slate-50/90 rounded-lg border border-slate-200 space-y-3">
        <CompanyLibraryAssetSelector
          selectedAssetId={task.companyAssetId}
          templateName={task.templateName}
          templateUrl={task.templateUrl}
          onSelectAsset={(asset) => {
            onChange("templateName", asset.name);
            onChange("templateUrl", asset.fileUrl);
            onChange("companyAssetId", asset.id);
            onChange("isUploadRequired", true);
          }}
          onClearAsset={() => {
            onChange("templateName", "");
            onChange("templateUrl", "");
            onChange("companyAssetId", null);
            onRemoveTemplate();
          }}
          isUploadingTemplate={isUploadingTemplate}
          onTemplateUpload={onTemplateUpload}
        />

        {/* Mark Upload as Required */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-200/70">
          <Checkbox
            id="require-upload"
            checked={
              task.isUploadRequired ||
              task.taskType === TASK_INPUT_TYPES.FILE_UPLOAD ||
              task.taskType === TASK_INPUT_TYPES.DOCUMENT_SIGNING
            }
            onCheckedChange={(checked) => onChange("isUploadRequired", Boolean(checked))}
            disabled={
              task.taskType === TASK_INPUT_TYPES.FILE_UPLOAD ||
              task.taskType === TASK_INPUT_TYPES.DOCUMENT_SIGNING
            }
          />
          <Label htmlFor="require-upload" className="text-xs font-medium text-slate-800 cursor-pointer">
            <strong>Mark upload as required</strong> — Employee must upload a signed version or document evidence to complete this task
          </Label>
        </div>
      </div>
    </div>
  );
}
