import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, CheckSquare, File, Briefcase } from "lucide-react";

export default function TemplateList({ templates, isLoading }) {
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
      {templates.map((template) => (
        <Card 
          key={template.id} 
          className="border-slate-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
        >
          <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-purple-50">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-xl mb-2">{template.name}</CardTitle>
                <Badge variant="outline" className="bg-white">
                  <Briefcase className="w-3 h-3 mr-1" />
                  {template.role_type}
                </Badge>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
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
                  <span className="font-semibold">{template.tasks?.length || 0}</span> tasks included
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <File className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-slate-700">
                  <span className="font-semibold">{template.required_documents?.length || 0}</span> documents required
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}