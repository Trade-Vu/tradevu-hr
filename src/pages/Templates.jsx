import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { PAGE_ROUTES } from "@/constants/pageRoutes";
import { onboardingApi, organizationsApi } from "@/api";
import { useDepartments } from "@/hooks/useDepartmentsQuery";
import { toast } from "sonner";
import { Plus, BookTemplate, ArrowLeft, Layers, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { queryKeys } from "@/constants/queryKeys";
import TemplateList from "../components/templates/TemplateList";
import TemplateForm from "../components/templates/TemplateForm";

export default function Templates() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const action = urlParams.get('action');
  const [showForm, setShowForm] = useState(action === 'add');
  const [editingTemplate, setEditingTemplate] = useState(null);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const res = await onboardingApi.getTemplates();
      return Array.isArray(res) ? res : (res?.data || []);
    },
    initialData: [],
  });

  const { data: orgData } = useQuery({
    queryKey: ['organization', 'me'],
    queryFn: async () => {
      const res = await organizationsApi.getMyOrganization();
      return res?.data || res;
    },
  });

  const { data: departments = [] } = useDepartments();

  const handleCancel = () => {
    setShowForm(false);
    setEditingTemplate(null);
    navigate(PAGE_ROUTES.TEMPLATES);
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setShowForm(true);
  };

  const handleCreateNew = () => {
    setEditingTemplate(null);
    setShowForm(true);
  };

  const createTemplateMutation = useMutation({
    mutationFn: async (templateData) => {
      const payload = {
        name: templateData.name,
        description: templateData.description,
        department: templateData.department || templateData.role_type || 'All Departments',
        role_type: templateData.department || templateData.role_type || 'All Departments',
        employeeClass: templateData.employeeClass || 'All Classes',
        employmentType: templateData.employmentType || 'All Types',
        requiredDocuments: templateData.required_documents || [],
        tasks: (templateData.tasks || []).map((t) => ({
          title: t.title,
          description: t.description,
          category: t.category || 'General',
          dueOffset: t.deadline_days || t.dueOffset || 7,
          isRequired: t.isRequired !== undefined ? t.isRequired : true,
          isUploadRequired: Boolean(t.isUploadRequired),
          taskType: t.taskType || 'checkbox',
          assignedRole: t.assignedRole || 'EMPLOYEE',
          completionRule: t.completionRule || 'auto_on_submit',
          inputConfig: t.inputConfig || null,
          templateUrl: t.templateUrl || null,
          templateName: t.templateName || null,
          companyAssetId: t.companyAssetId || null,
        })),
      };
      return await onboardingApi.createTemplate(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.templates.all });
      queryKeys.tasks.invalidateAll(queryClient);
      toast.success("Onboarding template created successfully!");
      handleCancel();
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || "Failed to create template");
    }
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const payload = {
        name: data.name,
        description: data.description,
        department: data.department || data.role_type || 'All Departments',
        role_type: data.department || data.role_type || 'All Departments',
        employeeClass: data.employeeClass || 'All Classes',
        employmentType: data.employmentType || 'All Types',
        requiredDocuments: data.required_documents || [],
        tasks: (data.tasks || []).map((t) => ({
          title: t.title,
          description: t.description,
          category: t.category || 'General',
          dueOffset: t.deadline_days || t.dueOffset || 7,
          isRequired: t.isRequired !== undefined ? t.isRequired : true,
          isUploadRequired: Boolean(t.isUploadRequired),
          taskType: t.taskType || 'checkbox',
          assignedRole: t.assignedRole || 'EMPLOYEE',
          completionRule: t.completionRule || 'auto_on_submit',
          inputConfig: t.inputConfig || null,
          templateUrl: t.templateUrl || null,
          templateName: t.templateName || null,
          companyAssetId: t.companyAssetId || null,
        })),
      };
      return await onboardingApi.updateTemplate(id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.templates.all });
      queryKeys.tasks.invalidateAll(queryClient);
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.paginated() });
      toast.success("Template updated successfully! In-progress employee tasks have been updated.");
      handleCancel();
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || "Failed to update template");
    }
  });

  const handleSubmit = (data) => {
    if (editingTemplate) {
      const templateId = editingTemplate._id || editingTemplate.id;
      updateTemplateMutation.mutate({ id: templateId, data });
    } else {
      createTemplateMutation.mutate(data);
    }
  };

  const isSubmitting = createTemplateMutation.isPending || updateTemplateMutation.isPending;

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {showForm ? (
          /* Form Page Header (Single Consolidated Header & Action Bar) */
          <div className="mb-8 pb-5 border-b border-slate-200/80">
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-indigo-600 transition-colors mb-3 cursor-pointer group"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
              <span>Back to Templates</span>
            </button>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-heading">
                    {editingTemplate ? `Edit Template: ${editingTemplate.name}` : "Create Onboarding Template"}
                  </h1>
                  {editingTemplate && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      v{editingTemplate.version || "1.0"}
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Configure generic onboarding tasks, targeting criteria, and required compliance paperwork.
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="h-9 px-3.5 text-xs font-semibold text-slate-700 border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  form="onboarding-template-form"
                  type="submit"
                  disabled={isSubmitting}
                  className="h-9 px-4 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs cursor-pointer"
                >
                  {isSubmitting
                    ? "Saving..."
                    : editingTemplate
                    ? "Save Template Changes"
                    : "Create Onboarding Template"}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* List Page Header */
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold mb-2 border border-indigo-100">
                <BookTemplate className="w-3.5 h-3.5" />
                <span>Settings • Onboarding Templates</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-heading">
                Onboarding Template Configuration
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Define reusable onboarding tracks configured generically for employee classes, employment types, and departments.
              </p>
            </div>
            <Button
              onClick={handleCreateNew}
              className="bg-slate-900 hover:bg-slate-800 text-white cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Onboarding Template
            </Button>
          </div>
        )}

        {showForm ? (
          <TemplateForm
            initialData={editingTemplate}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
            orgData={orgData}
            departments={departments}
          />
        ) : (
          <TemplateList 
            templates={templates} 
            isLoading={isLoading} 
            onEdit={handleEditTemplate}
          />
        )}
      </div>
    </div>
  );
}
