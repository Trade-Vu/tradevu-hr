import React from "react";
import { Button } from "@/components/ui/button";
import { CheckSquare, AlertCircle, Plus } from "lucide-react";

import TemplateScopeSection from "./TemplateScopeSection";
import TemplateTaskItem from "./TemplateTaskItem";
import TemplateTaskEditor from "./TemplateTaskEditor";
import TemplateDocumentsSection from "./TemplateDocumentsSection";
import { useTemplateForm } from "./useTemplateForm";

export default function TemplateForm({
  initialData = null,
  onSubmit,
  onCancel,
  isSubmitting,
  orgData = null,
  departments = [],
}) {
  const isEditing = Boolean(initialData && (initialData._id || initialData.id));

  const {
    formData,
    setFormData,
    editingTaskIndex,
    isTaskDialogOpen,
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
  } = useTemplateForm({ initialData, onSubmit, orgData });

  return (
    <form id="onboarding-template-form" onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-6 pb-24">
      {isEditing && (
        <div className="p-4 bg-amber-50/90 border border-amber-200/90 rounded-xl text-xs text-amber-900 leading-relaxed flex items-start gap-3 shadow-2xs">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            <strong>Audit Note:</strong> Template updates will automatically sync to in-progress onboarding milestones. Any tasks already finalized or approved for existing employees will remain intact.
          </span>
        </div>
      )}

      {/* 1. Scope & Targeting Rules */}
      <TemplateScopeSection
        formData={formData}
        setFormData={setFormData}
        resolvedEmployeeClasses={resolvedEmployeeClasses}
        resolvedEmploymentTypes={resolvedEmploymentTypes}
        departments={departments}
      />

      {/* 2. Tasks & Activities Section */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 tracking-tight font-heading">
                Configured Onboarding Tasks
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Review, edit, or remove milestone tasks for this template, or configure new ones.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 w-fit shrink-0">
              {formData.tasks.length} {formData.tasks.length === 1 ? "task" : "tasks"}
            </span>
            <Button
              type="button"
              onClick={handleOpenCreateTask}
              className="h-8 px-3 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-2xs cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Activity</span>
            </Button>
          </div>
        </div>

        {/* List of Configured Tasks */}
        {formData.tasks.length > 0 ? (
          <div className="space-y-3">
            {formData.tasks.map((task, index) => (
              <TemplateTaskItem
                key={index}
                task={task}
                index={index}
                isBeingEdited={editingTaskIndex === index}
                onEdit={handleEditTask}
                onRemove={removeTask}
              />
            ))}
          </div>
        ) : (
          <div className="p-8 border border-dashed border-slate-200 rounded-xl text-center bg-slate-50/50 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800">No milestone activities configured yet</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Add onboarding steps, document uploads, or forms for new hires to complete.</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpenCreateTask}
              className="h-8 text-xs font-medium border-slate-200 hover:bg-white text-slate-700 cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1 text-slate-500" />
              Add First Activity
            </Button>
          </div>
        )}
      </div>

      {/* Task Modal Dialog */}
      <TemplateTaskEditor
        open={isTaskDialogOpen}
        onClose={handleCloseTaskDialog}
        newTask={newTask}
        onChange={handleTaskFieldChange}
        editingTaskIndex={editingTaskIndex}
        onSave={saveTask}
        isUploadingTemplate={isUploadingTemplate}
        onTemplateUpload={handleTemplateUpload}
        onRemoveTemplate={handleRemoveAttachedTemplate}
      />

      {/* 3. Standard Paperwork Documents */}
      <TemplateDocumentsSection
        requiredDocuments={formData.required_documents}
        newDocument={newDocument}
        setNewDocument={setNewDocument}
        onAddDocument={addDocument}
        onRemoveDocument={removeDocument}
      />

      {/* 4. Sticky Form Action Footer */}
      <div className="fixed sm:sticky bottom-0 left-0 right-0 z-30 py-3.5 px-4 sm:px-6 bg-white/90 backdrop-blur-md border-t border-slate-200/90 shadow-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="text-xs text-slate-500 hidden sm:flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-medium text-slate-700">
              {formData.tasks.length} {formData.tasks.length === 1 ? "task" : "tasks"}
            </span>
            <span className="text-slate-300">•</span>
            <span className="font-medium text-slate-700">
              {formData.required_documents.length} required documents
            </span>
          </div>
          <div className="flex items-center gap-2.5 ml-auto">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="h-9 px-4 text-xs font-semibold text-slate-700 border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-9 px-5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs cursor-pointer"
            >
              {isSubmitting
                ? isEditing
                  ? "Saving Changes..."
                  : "Creating Template..."
                : isEditing
                  ? "Save Template Changes"
                : "Create Onboarding Template"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}