import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { FileText, CheckSquare, File, Briefcase, Edit } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { isSuperAdmin, isHrAdmin } from "@/lib/roleUtils";

export default function TemplateList({ templates, isLoading, onEdit }) {
  const { user } = useAuth();
  const canEdit = isSuperAdmin(user) || isHrAdmin(user);
  if (isLoading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array(6).fill(0).map((_, i) => (
          <Card key={i} className="border-slate-200">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <FileText className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No templates yet</h3>
          <p className="text-slate-500 mb-4">Create your first onboarding template to get started</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {templates.map((template) => {
        const templateId = template.id || template._id;
        const targetDept = template.department || template.role_type || 'All Departments';
        const docCount = template.requiredDocuments?.length || template.required_documents?.length || 0;
        const taskCount = template.tasks?.length || 0;

        return (
          <Card 
            key={templateId} 
            className="border-slate-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
          >
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-purple-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl mb-2">{template.name}</CardTitle>
                  <Badge variant="outline" className="bg-white text-indigo-700 border-indigo-200 shadow-sm font-medium">
                    <Briefcase className="w-3 h-3 mr-1 text-indigo-500" />
                    {targetDept}
                  </Badge>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-sm">
                  <FileText className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {template.description && (
                <p className="text-sm text-slate-600 mb-4">{template.description}</p>
              )}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <CheckSquare className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-slate-700">
                    <span className="font-semibold">{taskCount}</span> {taskCount === 1 ? 'task' : 'tasks'} included
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <File className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="text-slate-700">
                    <span className="font-semibold">{docCount}</span> {docCount === 1 ? 'document' : 'documents'} required
                  </span>
                </div>
              </div>
              {canEdit && onEdit && (
                <div className="pt-4 mt-3 border-t border-slate-100 flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(template)}
                    className="text-xs h-8 text-indigo-700 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-800 font-medium"
                  >
                    <Edit className="w-3.5 h-3.5 mr-1.5" />
                    Edit Template
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}