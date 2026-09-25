import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { PAGE_ROUTES } from "@/constants/pageRoutes";
import { onboardingApi } from "@/api/onboarding.api";
import { toast } from "sonner";
import { Plus, FileText, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
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
        requiredDocuments: templateData.required_documents || [],
        tasks: (templateData.tasks || []).map(t => ({
          title: t.title,
          description: t.description,
          category: t.category || 'General',
          dueOffset: t.deadline_days || 7,
          isRequired: true,
        })),
      };
      return await onboardingApi.createTemplate(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
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
        requiredDocuments: data.required_documents || [],
        tasks: (data.tasks || []).map(t => ({
          title: t.title,
          description: t.description,
          category: t.category || 'General',
          dueOffset: t.deadline_days || 7,
          isRequired: true,
        })),
      };
      return await onboardingApi.updateTemplate(id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['paginatedEmployees'] });
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
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            {showForm && (
              <Button
                variant="outline"
                size="icon"
                onClick={handleCancel}
                title="Cancel and return to templates"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <div>
              <p className="text-slate-500 mt-1">
                {showForm 
                  ? (editingTemplate ? `Editing "${editingTemplate.name}"` : "Build reusable onboarding flows") 
                  : `${templates.length} template${templates.length !== 1 ? 's' : ''} available`
                }
              </p>
            </div>
          </div>
          {!showForm && (
            <Button onClick={handleCreateNew}>
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          )}
        </div>

        {showForm ? (
          <TemplateForm
            initialData={editingTemplate}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
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