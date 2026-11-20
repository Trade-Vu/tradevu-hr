import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { FileText, CheckSquare, File, Briefcase, Edit, Layers, Building2, Paperclip } from "lucide-react";
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
          <div className="w-16 h-16 bg-slate-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <FileText className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No onboarding templates configured</h3>
          <p className="text-slate-500 mb-4 max-w-md mx-auto text-xs">
            Create structured onboarding templates targeting specific Employee Classes, Employment Types, or Departments to streamline new hire setup.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {templates.map((template) => {
        const templateId = template.id || template._id;
        const targetDept = template.department || template.role_type || 'All Departments';
        const targetClass = template.employeeClass || 'All Classes';
        const targetType = template.employmentType || 'All Types';
        const docCount = template.requiredDocuments?.length || template.required_documents?.length || 0;
        const taskCount = template.tasks?.length || 0;
        const tasksWithTemplates = (template.tasks || []).filter(t => t.templateUrl).length;

        return (
          <Card 
            key={templateId} 
            className="border-slate-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
          >
            <div>
              <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-base font-bold text-slate-900 truncate">
                        {template.name}
                      </CardTitle>
                      <Badge variant="outline" className="bg-white/80 text-slate-700 border-slate-200 text-[10px] font-semibold shrink-0">
                        v{template.version || "1.0"}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="outline" className="bg-white text-indigo-700 border-indigo-200 shadow-2xs text-[10px] font-medium">
                        <Building2 className="w-2.5 h-2.5 mr-1 text-indigo-500" />
                        {targetDept}
                      </Badge>
                      {targetClass && (
                        <Badge variant="outline" className="bg-white text-purple-700 border-purple-200 shadow-2xs text-[10px] font-medium">
                          <Layers className="w-2.5 h-2.5 mr-1 text-purple-500" />
                          {targetClass}
                        </Badge>
                      )}
                      {targetType && (
                        <Badge variant="outline" className="bg-white text-emerald-700 border-emerald-200 shadow-2xs text-[10px] font-medium">
                          <Briefcase className="w-2.5 h-2.5 mr-1 text-emerald-500" />
                          {targetType}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-xs shrink-0">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-5 space-y-4">
                {template.description && (
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{template.description}</p>
                )}

                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-7 h-7 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center text-blue-600 shrink-0">
                      <CheckSquare className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-slate-700">
                      <strong className="font-semibold text-slate-900">{taskCount}</strong> {taskCount === 1 ? 'task' : 'tasks'} configured
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-7 h-7 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 shrink-0">
                      <File className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-slate-700">
                      <strong className="font-semibold text-slate-900">{docCount}</strong> {docCount === 1 ? 'document' : 'documents'} required
                    </span>
                  </div>

                  {tasksWithTemplates > 0 && (
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-7 h-7 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 shrink-0">
                        <Paperclip className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-slate-700">
                        <strong className="font-semibold text-slate-900">{tasksWithTemplates}</strong> official {tasksWithTemplates === 1 ? 'template' : 'templates'} attached
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </div>

            {canEdit && onEdit && (
              <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50/50">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(template)}
                  className="text-xs h-8 text-indigo-700 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-800 font-medium cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5 mr-1.5" />
                  Configure Template
                </Button>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
