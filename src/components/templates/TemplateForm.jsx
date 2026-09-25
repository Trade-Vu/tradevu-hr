import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, FileText, CheckSquare, File, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function TemplateForm({ initialData = null, onSubmit, onCancel, isSubmitting }) {
  const isEditing = Boolean(initialData && (initialData._id || initialData.id));

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    department: initialData?.department || initialData?.role_type || "",
    role_type: initialData?.department || initialData?.role_type || "",
    tasks: (initialData?.tasks || []).map(t => ({
      title: t.title || "",
      description: t.description || "",
      deadline_days: t.dueOffset ?? t.deadline_days ?? 7,
      category: t.category || "General",
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
        tasks: (initialData.tasks || []).map(t => ({
          title: t.title || "",
          description: t.description || "",
          deadline_days: t.dueOffset ?? t.deadline_days ?? 7,
          category: t.category || "General",
        })),
        required_documents: initialData.requiredDocuments || initialData.required_documents || [],
      });
    }
  }, [initialData]);

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    deadline_days: 7,
  });

  const [newDocument, setNewDocument] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      department: (formData.department || '').trim() || 'All Departments',
      role_type: (formData.department || '').trim() || 'All Departments',
    });
  };

  const addTask = () => {
    if (newTask.title.trim()) {
      setFormData(prev => ({
        ...prev,
        tasks: [...prev.tasks, { ...newTask, title: newTask.title.trim(), deadline_days: Number(newTask.deadline_days) || 7 }],
      }));
      setNewTask({ title: "", description: "", deadline_days: 7 });
    }
  };

  const removeTask = (index) => {
    setFormData(prev => ({
      ...prev,
      tasks: prev.tasks.filter((_, i) => i !== index),
    }));
  };

  const addDocument = () => {
    if (newDocument) {
      setFormData(prev => ({
        ...prev,
        required_documents: [...prev.required_documents, newDocument],
      }));
      setNewDocument("");
    }
  };

  const removeDocument = (index) => {
    setFormData(prev => ({
      ...prev,
      required_documents: prev.required_documents.filter((_, i) => i !== index),
    }));
  };

  return (
    <Card className="max-w-4xl mx-auto border-slate-200 shadow-lg">
      <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-2xl">
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
            className="text-slate-500 hover:text-slate-700"
          >
            Cancel
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {isEditing && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 leading-relaxed">
              <strong>Notice:</strong> Updates will automatically reflect on tasks for all employees who are still actively going through onboarding. Tasks that employees have already completed will remain preserved.
            </div>
          )}
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Template Details</h3>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Software Engineer Onboarding"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Target Department *</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value, role_type: e.target.value }))}
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
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this template includes..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Tasks Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-indigo-600" />
              Onboarding Tasks
            </h3>
            
            {/* Task List */}
            {formData.tasks.length > 0 && (
              <div className="space-y-2 mb-4">
                {formData.tasks.map((task, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <CheckSquare className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{task.title}</p>
                      {task.description && (
                        <p className="text-sm text-slate-600 mt-0.5">{task.description}</p>
                      )}
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className="text-xs bg-white text-indigo-700 border-indigo-200">
                          Due in {task.deadline_days} days
                        </Badge>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeTask(index)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Task Form */}
            <div className="p-5 border-2 border-dashed border-slate-300 rounded-lg space-y-4 bg-slate-50/50">
              <div className="space-y-2">
                <Label htmlFor="task-title" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Task Title *
                </Label>
                <Input
                  id="task-title"
                  placeholder="e.g., Complete IT workstation setup and security training"
                  value={newTask.title}
                  onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="task-description" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Task Description
                </Label>
                <Input
                  id="task-description"
                  placeholder="Provide instructions or links for completing this task..."
                  value={newTask.description}
                  onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-1">
                <div className="space-y-2 w-full sm:w-64">
                  <Label htmlFor="task-deadline" className="text-xs font-bold text-indigo-700 flex items-center gap-1.5 uppercase tracking-wider">
                    <span>Days Until Deadline *</span>
                  </Label>
                  <Input
                    id="task-deadline"
                    type="number"
                    min="1"
                    placeholder="e.g., 7"
                    value={newTask.deadline_days}
                    onChange={(e) => setNewTask(prev => ({ ...prev, deadline_days: parseInt(e.target.value) || 0 }))}
                    className="bg-white border-slate-300 focus:border-indigo-500 font-medium"
                  />
                </div>
                <Button 
                  type="button" 
                  onClick={addTask} 
                  variant="outline"
                  className="bg-white border-slate-300 hover:bg-slate-100 self-end shadow-sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Task
                </Button>
              </div>
            </div>
          </div>

          {/* Documents Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <File className="w-5 h-5" />
              Required Documents
            </h3>

            {/* Document List */}
            {formData.required_documents.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {formData.required_documents.map((doc, index) => (
                  <Badge key={index} variant="secondary" className="px-3 py-2">
                    {doc}
                    <button
                      type="button"
                      onClick={() => removeDocument(index)}
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Add Document Form */}
            <div className="flex gap-3">
              <Input
                placeholder="Document name (e.g., ID Copy, Resume)"
                value={newDocument}
                onChange={(e) => setNewDocument(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDocument())}
              />
              <Button type="button" onClick={addDocument} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Document
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={onCancel} isLoading={isSubmitting}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              isLoading={isSubmitting}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              {isSubmitting 
                ? (isEditing ? "Saving Changes..." : "Creating...") 
                : (isEditing ? "Save Changes" : "Create Template")
              }
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}