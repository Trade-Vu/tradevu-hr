
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } => from "react-router-dom";
import { ArrowLeft, Mail, Phone, Calendar, Briefcase, FileText, CheckCircle, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TaskManager from "../components/employee-detail/TaskManager";
import DocumentManager from "../components/employee-detail/DocumentManager";
import EmployeeInfo from "../components/employee-detail/EmployeeInfo";

export default function EmployeeDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const employeeId = urlParams.get('id');
  const [isEditing, setIsEditing] = useState(false);

  const { data: employee, isLoading: loadingEmployee } = useQuery({
    queryKey: ['employee', employeeId],
    queryFn: async () => {
      const employees = await base44.entities.Employee.filter({ id: employeeId });
      return employees[0];
    },
    enabled: !!employeeId,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', employeeId],
    queryFn: () => base44.entities.Task.filter({ employee_id: employeeId }),
    enabled: !!employeeId,
    initialData: [],
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['documents', employeeId],
    queryFn: () => base44.entities.Document.filter({ employee_id: employeeId }),
    enabled: !!employeeId,
    initialData: [],
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Employee.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee', employeeId] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setIsEditing(false); // Set isEditing to false on successful update
    },
  });

  // Calculate progress based on tasks
  React.useEffect(() => {
    if (employee && tasks.length > 0) {
      const completedTasks = tasks.filter(t => t.status === 'completed').length;
      const progress = Math.round((completedTasks / tasks.length) * 100);
      
      if (progress !== employee.progress_percentage) {
        updateEmployeeMutation.mutate({ 
          id: employee.id, 
          data: { 
            progress_percentage: progress,
            status: progress === 100 ? 'completed' : (progress > 0 ? 'in_progress' : 'not_started'),
            onboarding_completed_date: progress === 100 ? new Date().toISOString().split('T')[0] : undefined,
          } 
        });
      }
    }
  }, [tasks, employee]);

  if (loadingEmployee) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">Employee not found</p>
      </div>
    );
  }

  const statusColors = {
    not_started: "bg-slate-100 text-slate-800 border-slate-200",
    in_progress: "bg-blue-100 text-blue-800 border-blue-200",
    completed: "bg-green-100 text-green-800 border-green-200",
  };

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const uploadedDocuments = documents.filter(d => d.status !== 'pending').length;

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="icon" onClick={() => navigate('/Employees')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900">{employee.full_name}</h1>
            <p className="text-slate-500 mt-1">{employee.job_title}</p>
          </div>
          <Badge variant="outline" className={`${statusColors[employee.status]} border px-4 py-2 text-sm`}>
            {employee.status === 'not_started' ? 'Not Started' : employee.status === 'in_progress' ? 'In Progress' : 'Completed'}
          </Badge>
          <Button
            variant="outline"
            onClick={() => setIsEditing(!isEditing)}
            className="gap-2"
          >
            <Edit className="w-4 h-4" />
            {isEditing ? 'Cancel Edit' : 'Edit Info'}
          </Button>
        </div>

        {/* Progress Overview */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-8 border border-blue-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Onboarding Progress</h2>
              <p className="text-sm text-slate-600">Overall completion status</p>
            </div>
            <div className="text-3xl font-bold text-blue-600">
              {employee.progress_percentage || 0}%
            </div>
          </div>
          <Progress value={employee.progress_percentage || 0} className="h-3 mb-4" />
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">{tasks.length}</div>
              <div className="text-sm text-slate-600">Total Tasks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{completedTasks}</div>
              <div className="text-sm text-slate-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{uploadedDocuments}/{documents.length}</div>
              <div className="text-sm text-slate-600">Documents</div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="tasks" className="space-y-6">
          <TabsList className="bg-white border border-slate-200">
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="info">Employee Info</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks">
            <TaskManager 
              tasks={tasks} 
              employeeId={employeeId}
            />
          </TabsContent>

          <TabsContent value="documents">
            <DocumentManager 
              documents={documents}
              employeeId={employeeId}
            />
          </TabsContent>

          <TabsContent value="info">
            <EmployeeInfo 
              employee={employee}
              isEditing={isEditing}
              onUpdate={(data) => updateEmployeeMutation.mutate({ id: employee.id, data })}
              isUpdating={updateEmployeeMutation.isPending}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
