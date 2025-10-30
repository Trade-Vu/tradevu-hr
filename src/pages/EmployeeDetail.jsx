import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Mail, Phone, Calendar, Briefcase, FileText, 
  User, DollarSign, Clock, Laptop, TrendingUp, StickyNote,
  Shield, Gift, MoreVertical, Edit, Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";

const menuItems = [
  { id: 'personal', label: 'Personal', icon: User },
  { id: 'job', label: 'Job Info', icon: Briefcase },
  { id: 'contracts', label: 'Contracts', icon: FileText },
  { id: 'financial', label: 'Financial', icon: DollarSign },
  { id: 'leave', label: 'Leave', icon: Calendar },
  { id: 'time', label: 'Time', icon: Clock },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'benefits', label: 'Benefits', icon: Gift },
  { id: 'assets', label: 'Assets', icon: Laptop },
  { id: 'shifts', label: 'Shifts', icon: Clock },
  { id: 'performance', label: 'Performance', icon: TrendingUp },
  { id: 'notes', label: 'Notes', icon: StickyNote },
];

export default function EmployeeDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const employeeId = urlParams.get('id');
  const [activeSection, setActiveSection] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);

  const { data: employee, isLoading } = useQuery({
    queryKey: ['employee', employeeId],
    queryFn: async () => {
      const employees = await base44.entities.Employee.list();
      return employees.find(e => e.id === employeeId);
    },
    enabled: !!employeeId,
  });

  const { data: assets = [] } = useQuery({
    queryKey: ['employee-assets', employeeId],
    queryFn: async () => {
      const allAssets = await base44.entities.Asset.list();
      return allAssets.filter(a => a.assigned_to === employee?.email);
    },
    enabled: !!employee,
    initialData: [],
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['employee-documents', employeeId],
    queryFn: async () => {
      const allDocs = await base44.entities.Document.list();
      return allDocs.filter(d => d.employee_id === employeeId);
    },
    enabled: !!employeeId,
    initialData: [],
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Employee.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee', employeeId] });
      setIsEditing(false);
    },
  });

  if (isLoading || !employee) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'personal':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">About</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Birthday</p>
                    <p className="font-medium text-slate-900">
                      {employee.personal_info?.date_of_birth || 'Not set'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Gender</p>
                    <p className="font-medium text-slate-900">{employee.personal_info?.gender || 'Not set'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Nationality</p>
                    <p className="font-medium text-slate-900">{employee.personal_info?.nationality || 'Not set'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Marital Status</p>
                    <p className="font-medium text-slate-900">{employee.personal_info?.marital_status || 'Not set'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Contact</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Work Email</p>
                    <p className="font-medium text-slate-900">{employee.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Mobile No.</p>
                    <p className="font-medium text-slate-900">{employee.phone || 'Not set'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Phone No.</p>
                    <p className="font-medium text-slate-900">{employee.whatsapp_number || 'Not set'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'job':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-900">Job Information</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-slate-500 mb-1">Job Title</p>
                <p className="font-medium text-slate-900">{employee.job_title}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Department</p>
                <p className="font-medium text-slate-900">{employee.department_id || 'Not assigned'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Employment Type</p>
                <p className="font-medium text-slate-900">{employee.employment_type?.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Employment Status</p>
                <Badge className="bg-green-100 text-green-700">{employee.employment_status}</Badge>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Start Date</p>
                <p className="font-medium text-slate-900">{format(new Date(employee.start_date), 'MMM dd, yyyy')}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Manager</p>
                <p className="font-medium text-slate-900">{employee.manager_email || 'Not assigned'}</p>
              </div>
            </div>
          </div>
        );

      case 'financial':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-900">Financial Details</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-slate-600 mb-1">Basic Salary</p>
                <p className="text-2xl font-bold text-green-700">
                  {employee.payroll_details?.basic_salary?.toLocaleString() || 0} SAR
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-slate-600 mb-1">Total Compensation</p>
                <p className="text-2xl font-bold text-blue-700">
                  {((employee.payroll_details?.basic_salary || 0) + 
                    Object.values(employee.payroll_details?.allowances || {}).reduce((sum, val) => sum + (val || 0), 0)
                  ).toLocaleString()} SAR
                </p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-3">Allowances</h4>
              <div className="grid md:grid-cols-2 gap-3">
                {Object.entries(employee.payroll_details?.allowances || {}).map(([key, value]) => (
                  value > 0 && (
                    <div key={key} className="flex justify-between p-3 bg-slate-50 rounded-lg">
                      <span className="text-slate-600 capitalize">{key}</span>
                      <span className="font-medium">{value} SAR</span>
                    </div>
                  )
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-3">Banking Information</h4>
              <div className="space-y-3">
                {employee.payroll_details?.bank_name && (
                  <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="text-slate-600">Bank Name</span>
                    <span className="font-medium">{employee.payroll_details.bank_name}</span>
                  </div>
                )}
                {employee.payroll_details?.iban && (
                  <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="text-slate-600">IBAN</span>
                    <span className="font-medium font-mono">{employee.payroll_details.iban}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'assets':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-900">Assigned Assets</h3>
            {assets.length === 0 ? (
              <div className="text-center py-12">
                <Laptop className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500">No assets assigned</p>
              </div>
            ) : (
              <div className="space-y-3">
                {assets.map(asset => (
                  <div key={asset.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Laptop className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{asset.asset_name}</p>
                        <p className="text-sm text-slate-500">{asset.asset_type}</p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-700">{asset.status || 'Active'}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'documents':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-900">Documents</h3>
            {documents.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500">No documents</p>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{doc.document_name}</p>
                        <p className="text-sm text-slate-500">{doc.file_name}</p>
                      </div>
                    </div>
                    <Badge>{doc.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'notes':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Notes</h3>
            {isEditing ? (
              <Textarea
                defaultValue={employee.notes || ''}
                rows={10}
                placeholder="Add notes about this employee..."
                className="w-full"
              />
            ) : (
              <div className="p-4 bg-slate-50 rounded-lg min-h-[200px]">
                <p className="text-slate-700 whitespace-pre-wrap">{employee.notes || 'No notes yet'}</p>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <p className="text-slate-500">Section under development</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => navigate('/Employees')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Employees
        </Button>

        {/* Top Section Icons */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <Card className="border-teal-200 bg-gradient-to-br from-teal-50 to-cyan-50 hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-teal-100 rounded-2xl mx-auto mb-3 flex items-center justify-center">
                <User className="w-8 h-8 text-teal-600" />
              </div>
              <h3 className="font-semibold text-teal-900">Personal</h3>
              <h3 className="font-semibold text-teal-900">Information</h3>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-2xl mx-auto mb-3 flex items-center justify-center">
                <Briefcase className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="font-semibold text-orange-900">Job & Contract</h3>
              <h3 className="font-semibold text-orange-900">Details</h3>
            </CardContent>
          </Card>

          <Card className="border-slate-300 bg-gradient-to-br from-slate-100 to-slate-200 hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-slate-200 rounded-2xl mx-auto mb-3 flex items-center justify-center">
                <FileText className="w-8 h-8 text-slate-600" />
              </div>
              <h3 className="font-semibold text-slate-900">Documents &</h3>
              <h3 className="font-semibold text-slate-900">Files</h3>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Card */}
        <Card className="border-slate-200 overflow-hidden shadow-xl">
          {/* Employee Header */}
          <div className="bg-gradient-to-r from-green-600 to-teal-600 p-6 text-white relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                  {employee.avatar_url ? (
                    <img src={employee.avatar_url} alt={employee.full_name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-4xl text-green-600 font-bold">
                      {employee.full_name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{employee.full_name}</h2>
                  <p className="text-green-100">{employee.job_title}</p>
                </div>
              </div>
              <Button variant="ghost" className="text-white hover:bg-white/20">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex">
            {/* Left Sidebar Menu */}
            <div className="w-64 border-r border-slate-200 bg-slate-50 p-4">
              <div className="space-y-1">
                {menuItems.map(item => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                        activeSection === item.id
                          ? 'bg-green-100 text-green-700 font-medium'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900">
                  {menuItems.find(m => m.id === activeSection)?.label}
                </h2>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(!isEditing)}
                  className="gap-2"
                >
                  {isEditing ? (
                    <>
                      <Save className="w-4 h-4" />
                      Save
                    </>
                  ) : (
                    <>
                      <Edit className="w-4 h-4" />
                      Edit
                    </>
                  )}
                </Button>
              </div>

              {renderContent()}
            </div>
          </div>
        </Card>

        {/* Bottom Section Cards */}
        <div className="grid grid-cols-3 gap-6">
          <Card className="border-teal-200 bg-gradient-to-br from-teal-50 to-cyan-50 hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-teal-100 rounded-2xl mx-auto mb-3 flex items-center justify-center">
                <DollarSign className="w-8 h-8 text-teal-600" />
              </div>
              <h3 className="font-semibold text-teal-900">Financial</h3>
              <h3 className="font-semibold text-teal-900">Details</h3>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-2xl mx-auto mb-3 flex items-center justify-center">
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="font-semibold text-orange-900">Time &</h3>
              <h3 className="font-semibold text-orange-900">Attendance</h3>
            </CardContent>
          </Card>

          <Card className="border-slate-300 bg-gradient-to-br from-slate-100 to-slate-200 hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-slate-200 rounded-2xl mx-auto mb-3 flex items-center justify-center">
                <Laptop className="w-8 h-8 text-slate-600" />
              </div>
              <h3 className="font-semibold text-slate-900">Assets &</h3>
              <h3 className="font-semibold text-slate-900">Benefits</h3>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}