
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import EmployeeList from "../components/dashboard/EmployeeList";
import AddEmployeeForm from "../components/employees/AddEmployeeForm";
import BulkImportDialog from "../components/employees/BulkImportDialog";

export default function Employees() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const action = urlParams.get('action');
  const [showAddForm, setShowAddForm] = useState(action === 'add');
  const [showImportDialog, setShowImportDialog] = useState(false);

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list('-created_date'),
    initialData: [],
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: () => base44.entities.OnboardingTemplate.list(),
    initialData: [],
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => base44.entities.Department.list(),
    initialData: [],
  });

  const createEmployeeMutation = useMutation({
    mutationFn: async (employeeData) => {
      const employee = await base44.entities.Employee.create(employeeData);
      
      // If template is selected, create tasks from template
      if (employeeData.template_id) {
        const template = templates.find(t => t.id === employeeData.template_id);
        if (template?.tasks) {
          const startDate = new Date(employeeData.start_date);
          for (const templateTask of template.tasks) {
            const deadline = new Date(startDate);
            deadline.setDate(deadline.getDate() + (templateTask.deadline_days || 7));
            
            await base44.entities.Task.create({
              employee_id: employee.id,
              title: templateTask.title,
              description: templateTask.description,
              department: templateTask.department,
              deadline: deadline.toISOString().split('T')[0],
              status: 'pending',
              priority: 'medium',
            });
          }
        }

        // Create document requests from template
        if (template?.required_documents) {
          for (const docName of template.required_documents) {
            await base44.entities.Document.create({
              employee_id: employee.id,
              document_name: docName,
              status: 'pending',
            });
          }
        }
      }

      // Send welcome email
      try {
        await base44.integrations.Core.SendEmail({
          to: employeeData.email,
          subject: `Welcome to the Team! 🎉`,
          body: `Hi ${employeeData.full_name},\n\nWelcome to our team! We're excited to have you joining us as ${employeeData.job_title}.\n\nYour onboarding journey starts on ${new Date(employeeData.start_date).toLocaleDateString()}. You'll receive more information about your first day soon.\n\nWe've prepared everything to make your start smooth and enjoyable.\n\nLooking forward to working with you!\n\nBest regards,\nHR Team`,
        });
        
        await base44.entities.Employee.update(employee.id, { welcome_sent: true });
      } catch (error) {
        console.error("Error sending welcome email:", error);
      }

      return employee;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setShowAddForm(false);
      navigate('/Employees');
    },
  });

  const bulkCreateEmployeesMutation = useMutation({
    mutationFn: async (employeesData) => {
      const createdEmployees = [];
      for (const employeeData of employeesData) {
        const employee = await base44.entities.Employee.create(employeeData);
        createdEmployees.push(employee);
        
        // Send welcome email
        try {
          await base44.integrations.Core.SendEmail({
            to: employeeData.email,
            subject: `Welcome to the Team! 🎉`,
            body: `Hi ${employeeData.full_name},\n\nWelcome to our team! We're excited to have you joining us as ${employeeData.job_title}.\n\nYour onboarding journey starts on ${new Date(employeeData.start_date).toLocaleDateString()}.\n\nLooking forward to working with you!\n\nBest regards,\nHR Team`,
          });
          await base44.entities.Employee.update(employee.id, { welcome_sent: true });
        } catch (error) {
          console.error("Error sending welcome email:", error);
        }
      }
      return createdEmployees;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setShowImportDialog(false);
    },
  });

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            {showAddForm && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setShowAddForm(false);
                  navigate('/Employees');
                }}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                {showAddForm ? "Add New Employee" : "All Employees"}
              </h1>
              <p className="text-slate-500 mt-1">
                {showAddForm 
                  ? "Onboard a new team member" 
                  : `Manage your ${employees.length} employee${employees.length !== 1 ? 's' : ''}`
                }
              </p>
            </div>
          </div>
          {!showAddForm && (
            <div className="flex gap-3">
              <Button 
                onClick={() => setShowImportDialog(true)}
                variant="outline"
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <Upload className="w-4 h-4 mr-2" />
                Import CSV
              </Button>
              <Button 
                onClick={() => setShowAddForm(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Hire
              </Button>
            </div>
          )}
        </div>

        {/* Content */}
        {showAddForm ? (
          <AddEmployeeForm
            templates={templates}
            departments={departments}
            onSubmit={(data) => createEmployeeMutation.mutate(data)}
            onCancel={() => {
              setShowAddForm(false);
              navigate('/Employees');
            }}
            isSubmitting={createEmployeeMutation.isPending}
          />
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <EmployeeList employees={employees} isLoading={isLoading} />
          </div>
        )}

        {/* Bulk Import Dialog */}
        <BulkImportDialog
          open={showImportDialog}
          onClose={() => setShowImportDialog(false)}
          onImport={(data) => bulkCreateEmployeesMutation.mutate(data)}
          isImporting={bulkCreateEmployeesMutation.isPending}
          templates={templates}
          departments={departments}
        />
      </div>
    </div>
  );
}
