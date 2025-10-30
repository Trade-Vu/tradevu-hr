import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Mail, Phone, Calendar, Briefcase, FileText, 
  User, DollarSign, Clock, Laptop, TrendingUp, StickyNote,
  Shield, Gift, MoreVertical, Edit, Save, MessageCircle, MessageSquare, CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";

const menuItems = [
  { id: 'personal', label: 'Personal', icon: User },
  { id: 'job', label: 'Job Info', icon: Briefcase },
  { id: 'contracts', label: 'Contracts', icon: FileText },
  { id: 'financial', label: 'Financial', icon: DollarSign },
  { id: 'leave', label: 'Leave', icon: Calendar },
  { id: 'attendance', label: 'Attendance', icon: Calendar },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'benefits', label: 'Benefits', icon: Gift },
  { id: 'assets', label: 'Assets', icon: Laptop },
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
  const [editData, setEditData] = useState({});
  const [user, setUser] = useState(null);

  React.useEffect(() => {
    const loadUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    loadUser();
  }, []);

  const { data: employee, isLoading } = useQuery({
    queryKey: ['employee', employeeId],
    queryFn: async () => {
      const employees = await base44.entities.Employee.list();
      return employees.find(e => e.id === employeeId);
    },
    enabled: !!employeeId,
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['all-employees'],
    queryFn: () => base44.entities.Employee.list(),
    initialData: [],
  });

  const { data: shifts = [] } = useQuery({
    queryKey: ['shifts'],
    queryFn: () => base44.entities.Shift.list(),
    initialData: [],
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

  const { data: leaveRequests = [] } = useQuery({
    queryKey: ['employee-leaves', employeeId],
    queryFn: async () => {
      const allLeaves = await base44.entities.LeaveRequest.list();
      return allLeaves.filter(l => l.employee_id === employeeId);
    },
    enabled: !!employeeId,
    initialData: [],
  });

  const { data: attendance = [] } = useQuery({
    queryKey: ['employee-attendance', employeeId],
    queryFn: async () => {
      const allAttendance = await base44.entities.Attendance.list('-date');
      return allAttendance.filter(a => a.employee_id === employeeId);
    },
    enabled: !!employeeId,
    initialData: [],
  });

  React.useEffect(() => {
    if (employee && !isEditing) {
      setEditData(employee);
    }
  }, [employee, isEditing]);

  const updateEmployeeMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Employee.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee', employeeId] });
      setIsEditing(false);
    },
  });

  const createCommLogMutation = useMutation({
    mutationFn: (data) => base44.entities.CommunicationLog.create(data),
  });

  const handleSave = () => {
    updateEmployeeMutation.mutate({ id: employee.id, data: editData });
  };

  const handleSendEmail = async (email, type = 'work') => {
    await createCommLogMutation.mutateAsync({
      organization_id: user?.organization_id,
      employee_id: employee.id,
      employee_name: employee.full_name,
      sent_by: user?.email,
      communication_type: 'email',
      recipient: email,
      subject: 'Communication from HR',
      message: 'Email sent via employee profile',
      sent_date: new Date().toISOString(),
    });
    window.location.href = `mailto:${email}`;
  };

  const handleSendSMS = async (phone) => {
    await createCommLogMutation.mutateAsync({
      organization_id: user?.organization_id,
      employee_id: employee.id,
      employee_name: employee.full_name,
      sent_by: user?.email,
      communication_type: 'sms',
      recipient: phone,
      message: 'SMS sent via employee profile',
      sent_date: new Date().toISOString(),
    });
    window.location.href = `sms:${phone}`;
  };

  const handleSendWhatsApp = async (phone) => {
    await createCommLogMutation.mutateAsync({
      organization_id: user?.organization_id,
      employee_id: employee.id,
      employee_name: employee.full_name,
      sent_by: user?.email,
      communication_type: 'whatsapp',
      recipient: phone,
      message: 'WhatsApp message sent via employee profile',
      sent_date: new Date().toISOString(),
    });
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  if (isLoading || !employee) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const thisMonthAttendance = attendance.filter(a => {
    const recordDate = new Date(a.date);
    const now = new Date();
    return recordDate.getMonth() === now.getMonth() && recordDate.getFullYear() === now.getFullYear();
  });

  const presentDays = thisMonthAttendance.filter(a => a.status === 'present' || a.status === 'remote').length;
  const absentDays = thisMonthAttendance.filter(a => a.status === 'absent').length;
  const lateDays = thisMonthAttendance.filter(a => a.status === 'late').length;
  const leaveDays = thisMonthAttendance.filter(a => a.status === 'leave').length;

  const renderContent = () => {
    switch (activeSection) {
      case 'personal':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">About</h3>
              <div className="grid md:grid-cols-2 gap-6">
                {isEditing ? (
                  <>
                    <div className="space-y-2">
                      <Label>Date of Birth</Label>
                      <Input
                        type="date"
                        value={editData.personal_info?.date_of_birth || ''}
                        onChange={(e) => setEditData(prev => ({
                          ...prev,
                          personal_info: { ...prev.personal_info, date_of_birth: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Gender</Label>
                      <Select
                        value={editData.personal_info?.gender || ''}
                        onValueChange={(value) => setEditData(prev => ({
                          ...prev,
                          personal_info: { ...prev.personal_info, gender: value }
                        }))}
                      >
                        <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Nationality</Label>
                      <Input
                        value={editData.personal_info?.nationality || ''}
                        onChange={(e) => setEditData(prev => ({
                          ...prev,
                          personal_info: { ...prev.personal_info, nationality: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Marital Status</Label>
                      <Select
                        value={editData.personal_info?.marital_status || ''}
                        onValueChange={(value) => setEditData(prev => ({
                          ...prev,
                          personal_info: { ...prev.personal_info, marital_status: value }
                        }))}
                      >
                        <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single">Single</SelectItem>
                          <SelectItem value="married">Married</SelectItem>
                          <SelectItem value="divorced">Divorced</SelectItem>
                          <SelectItem value="widowed">Widowed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>National ID</Label>
                      <Input
                        value={editData.personal_info?.national_id || ''}
                        onChange={(e) => setEditData(prev => ({
                          ...prev,
                          personal_info: { ...prev.personal_info, national_id: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Iqama Number</Label>
                      <Input
                        value={editData.personal_info?.iqama_number || ''}
                        onChange={(e) => setEditData(prev => ({
                          ...prev,
                          personal_info: { ...prev.personal_info, iqama_number: e.target.value }
                        }))}
                      />
                    </div>
                  </>
                ) : (
                  <>
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
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-500 uppercase">National ID</p>
                        <p className="font-medium text-slate-900">{employee.personal_info?.national_id || 'Not set'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-500 uppercase">Iqama Number</p>
                        <p className="font-medium text-slate-900">{employee.personal_info?.iqama_number || 'Not set'}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="pt-6 border-t">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Contact</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500 uppercase">Work Email</p>
                      <p className="font-medium text-slate-900">{employee.email}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => handleSendEmail(employee.email, 'work')}>
                    <Mail className="w-4 h-4" />
                  </Button>
                </div>
                
                {isEditing ? (
                  <div className="space-y-2">
                    <Label>Private Email</Label>
                    <Input
                      type="email"
                      value={editData.private_email || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, private_email: e.target.value }))}
                      placeholder="personal@email.com"
                    />
                  </div>
                ) : employee.private_email ? (
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-500 uppercase">Private Email</p>
                        <p className="font-medium text-slate-900">{employee.private_email}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => handleSendEmail(employee.private_email, 'private')}>
                      <Mail className="w-4 h-4" />
                    </Button>
                  </div>
                ) : null}
                
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500 uppercase">Mobile No.</p>
                      <p className="font-medium text-slate-900">{employee.phone || 'Not set'}</p>
                    </div>
                  </div>
                  {employee.phone && (
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => handleSendSMS(employee.phone)} title="Send SMS">
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleSendWhatsApp(employee.phone)} title="Send WhatsApp">
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 'job':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-900">Job Information</h3>
            {isEditing ? (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Job Title</Label>
                  <Input
                    value={editData.job_title || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, job_title: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Input
                    value={editData.department_id || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, department_id: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Employment Type</Label>
                  <Select
                    value={editData.employment_type || 'full_time'}
                    onValueChange={(value) => setEditData(prev => ({ ...prev, employment_type: value }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full_time">Full Time</SelectItem>
                      <SelectItem value="part_time">Part Time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="intern">Intern</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Employment Status</Label>
                  <Select
                    value={editData.employment_status || 'active'}
                    onValueChange={(value) => setEditData(prev => ({ ...prev, employment_status: value }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="on_leave">On Leave</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="terminated">Terminated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={editData.start_date || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, start_date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Reports To (Manager)</Label>
                  <Select
                    value={editData.manager_email || ''}
                    onValueChange={(value) => setEditData(prev => ({ ...prev, manager_email: value }))}
                  >
                    <SelectTrigger><SelectValue placeholder="Select manager" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>No Manager</SelectItem>
                      {employees.filter(e => e.id !== employee.id).map(emp => (
                        <SelectItem key={emp.id} value={emp.email}>
                          {emp.full_name} - {emp.job_title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
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
                  <p className="text-sm text-slate-500 mb-1">Reports To</p>
                  <p className="font-medium text-slate-900">{employee.manager_email || 'Not assigned'}</p>
                </div>
              </div>
            )}
          </div>
        );

      case 'contracts':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-900">Contract Details</h3>
            {isEditing ? (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Contract Type</Label>
                  <Select
                    value={editData.contract_details?.contract_type || ''}
                    onValueChange={(value) => setEditData(prev => ({
                      ...prev,
                      contract_details: { ...prev.contract_details, contract_type: value }
                    }))}
                  >
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="indefinite">Indefinite</SelectItem>
                      <SelectItem value="fixed_term">Fixed Term</SelectItem>
                      <SelectItem value="probation">Probation</SelectItem>
                      <SelectItem value="internship">Internship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Assigned Shift</Label>
                  <Select
                    value={editData.work_schedule?.shift_id || ''}
                    onValueChange={(value) => setEditData(prev => ({
                      ...prev,
                      work_schedule: { ...prev.work_schedule, shift_id: value }
                    }))}
                  >
                    <SelectTrigger><SelectValue placeholder="Select shift" /></SelectTrigger>
                    <SelectContent>
                      {shifts.map(shift => (
                        <SelectItem key={shift.id} value={shift.id}>
                          {shift.shift_name} ({shift.start_time} - {shift.end_time})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Contract Start Date</Label>
                  <Input
                    type="date"
                    value={editData.contract_details?.contract_start_date || ''}
                    onChange={(e) => setEditData(prev => ({
                      ...prev,
                      contract_details: { ...prev.contract_details, contract_start_date: e.target.value }
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contract End Date</Label>
                  <Input
                    type="date"
                    value={editData.contract_details?.contract_end_date || ''}
                    onChange={(e) => setEditData(prev => ({
                      ...prev,
                      contract_details: { ...prev.contract_details, contract_end_date: e.target.value }
                    }))}
                  />
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-500 mb-1">Contract Type</p>
                  <p className="font-medium text-slate-900">
                    {employee.contract_details?.contract_type || 'Not set'}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-500 mb-1">Assigned Shift</p>
                  <p className="font-medium text-slate-900">
                    {shifts.find(s => s.id === employee.work_schedule?.shift_id)?.shift_name || 'Not assigned'}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-500 mb-1">Contract Start</p>
                  <p className="font-medium text-slate-900">
                    {employee.contract_details?.contract_start_date || 'Not set'}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-500 mb-1">Contract End</p>
                  <p className="font-medium text-slate-900">
                    {employee.contract_details?.contract_end_date || 'Not set'}
                  </p>
                </div>
              </div>
            )}
          </div>
        );

      case 'financial':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-900">Financial Details</h3>
            {isEditing ? (
              <>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Basic Salary (SAR)</Label>
                    <Input
                      type="number"
                      value={editData.payroll_details?.basic_salary || 0}
                      onChange={(e) => setEditData(prev => ({
                        ...prev,
                        payroll_details: { ...prev.payroll_details, basic_salary: parseFloat(e.target.value) }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Bank Name</Label>
                    <Input
                      value={editData.payroll_details?.bank_name || ''}
                      onChange={(e) => setEditData(prev => ({
                        ...prev,
                        payroll_details: { ...prev.payroll_details, bank_name: e.target.value }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>IBAN</Label>
                    <Input
                      value={editData.payroll_details?.iban || ''}
                      onChange={(e) => setEditData(prev => ({
                        ...prev,
                        payroll_details: { ...prev.payroll_details, iban: e.target.value }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>GOSI Number</Label>
                    <Input
                      value={editData.payroll_details?.gosi_number || ''}
                      onChange={(e) => setEditData(prev => ({
                        ...prev,
                        payroll_details: { ...prev.payroll_details, gosi_number: e.target.value }
                      }))}
                    />
                  </div>
                </div>
                <div>
                  <Label className="mb-3">Allowances (SAR)</Label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <Input
                      type="number"
                      placeholder="Housing"
                      value={editData.payroll_details?.allowances?.housing || 0}
                      onChange={(e) => setEditData(prev => ({
                        ...prev,
                        payroll_details: {
                          ...prev.payroll_details,
                          allowances: { ...prev.payroll_details?.allowances, housing: parseFloat(e.target.value) || 0 }
                        }
                      }))}
                    />
                    <Input
                      type="number"
                      placeholder="Transport"
                      value={editData.payroll_details?.allowances?.transport || 0}
                      onChange={(e) => setEditData(prev => ({
                        ...prev,
                        payroll_details: {
                          ...prev.payroll_details,
                          allowances: { ...prev.payroll_details?.allowances, transport: parseFloat(e.target.value) || 0 }
                        }
                      }))}
                    />
                    <Input
                      type="number"
                      placeholder="Food"
                      value={editData.payroll_details?.allowances?.food || 0}
                      onChange={(e) => setEditData(prev => ({
                        ...prev,
                        payroll_details: {
                          ...prev.payroll_details,
                          allowances: { ...prev.payroll_details?.allowances, food: parseFloat(e.target.value) || 0 }
                        }
                      }))}
                    />
                    <Input
                      type="number"
                      placeholder="Other"
                      value={editData.payroll_details?.allowances?.other || 0}
                      onChange={(e) => setEditData(prev => ({
                        ...prev,
                        payroll_details: {
                          ...prev.payroll_details,
                          allowances: { ...prev.payroll_details?.allowances, other: parseFloat(e.target.value) || 0 }
                        }
                      }))}
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
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
                    <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
                      <span className="text-slate-600">Bank Name</span>
                      <span className="font-medium">{employee.payroll_details?.bank_name || 'Not set'}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
                      <span className="text-slate-600">IBAN</span>
                      <span className="font-medium font-mono">{employee.payroll_details?.iban || 'Not set'}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
                      <span className="text-slate-600">GOSI Number</span>
                      <span className="font-medium">{employee.payroll_details?.gosi_number || 'Not set'}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        );

      case 'leave':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-900">Leave Balance</h3>
            {isEditing ? (
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>Annual Leave Total</Label>
                  <Input
                    type="number"
                    value={editData.leave_balances?.annual_leave_total || 21}
                    onChange={(e) => setEditData(prev => ({
                      ...prev,
                      leave_balances: { ...prev.leave_balances, annual_leave_total: parseFloat(e.target.value) }
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Annual Leave Used</Label>
                  <Input
                    type="number"
                    value={editData.leave_balances?.annual_leave_used || 0}
                    onChange={(e) => setEditData(prev => ({
                      ...prev,
                      leave_balances: { ...prev.leave_balances, annual_leave_used: parseFloat(e.target.value) }
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sick Leave Total</Label>
                  <Input
                    type="number"
                    value={editData.leave_balances?.sick_leave_total || 30}
                    onChange={(e) => setEditData(prev => ({
                      ...prev,
                      leave_balances: { ...prev.leave_balances, sick_leave_total: parseFloat(e.target.value) }
                    }))}
                  />
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-6">
                <div className="p-6 bg-blue-50 rounded-xl text-center">
                  <p className="text-3xl font-bold text-blue-700">
                    {(employee.leave_balances?.annual_leave_total || 21) - (employee.leave_balances?.annual_leave_used || 0)}
                  </p>
                  <p className="text-sm text-slate-600 mt-2">Annual Leave Days</p>
                  <p className="text-xs text-slate-500">
                    {employee.leave_balances?.annual_leave_used || 0} used of {employee.leave_balances?.annual_leave_total || 21}
                  </p>
                </div>
                <div className="p-6 bg-green-50 rounded-xl text-center">
                  <p className="text-3xl font-bold text-green-700">
                    {(employee.leave_balances?.sick_leave_total || 30) - (employee.leave_balances?.sick_leave_used || 0)}
                  </p>
                  <p className="text-sm text-slate-600 mt-2">Sick Leave Days</p>
                  <p className="text-xs text-slate-500">
                    {employee.leave_balances?.sick_leave_used || 0} used of {employee.leave_balances?.sick_leave_total || 30}
                  </p>
                </div>
              </div>
            )}
            
            <div className="pt-6 border-t">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Leave History</h3>
              {leaveRequests.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-slate-500">No leave requests</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {leaveRequests.map(leave => (
                    <div key={leave.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-900">{leave.leave_type.replace('_', ' ')}</p>
                        <p className="text-sm text-slate-500">
                          {format(new Date(leave.start_date), 'MMM d')} - {format(new Date(leave.end_date), 'MMM d, yyyy')} ({leave.total_days} days)
                        </p>
                      </div>
                      <Badge className={
                        leave.status === 'approved' ? 'bg-green-100 text-green-700' :
                        leave.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }>
                        {leave.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'attendance':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-900">Attendance Overview</h3>
            
            <div className="grid md:grid-cols-4 gap-4">
              <div className="p-4 bg-green-50 rounded-lg text-center">
                <p className="text-3xl font-bold text-green-700">{presentDays}</p>
                <p className="text-sm text-slate-600 mt-1">Present</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg text-center">
                <p className="text-3xl font-bold text-red-700">{absentDays}</p>
                <p className="text-sm text-slate-600 mt-1">Absent</p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg text-center">
                <p className="text-3xl font-bold text-yellow-700">{lateDays}</p>
                <p className="text-sm text-slate-600 mt-1">Late</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <p className="text-3xl font-bold text-blue-700">{leaveDays}</p>
                <p className="text-sm text-slate-600 mt-1">On Leave</p>
              </div>
            </div>

            <div className="pt-6 border-t">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Attendance Calendar - {format(new Date(), 'MMMM yyyy')}</h3>
              {thisMonthAttendance.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-slate-500">No attendance records this month</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {thisMonthAttendance.map(record => (
                    <div key={record.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="font-medium text-slate-900">{format(new Date(record.date), 'EEEE, MMM d')}</p>
                          <p className="text-xs text-slate-500">
                            {record.check_in && record.check_out && `${record.check_in} - ${record.check_out}`}
                          </p>
                        </div>
                      </div>
                      <Badge className={
                        record.status === 'present' ? 'bg-green-100 text-green-700' :
                        record.status === 'absent' ? 'bg-red-100 text-red-700' :
                        record.status === 'late' ? 'bg-yellow-100 text-yellow-700' :
                        record.status === 'leave' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-700'
                      }>
                        {record.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'benefits':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-900">Employee Benefits</h3>
            {isEditing ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={editData.benefits?.health_insurance || false}
                    onCheckedChange={(checked) => setEditData(prev => ({
                      ...prev,
                      benefits: { ...prev.benefits, health_insurance: checked }
                    }))}
                  />
                  <Label>Health Insurance</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={editData.benefits?.life_insurance || false}
                    onCheckedChange={(checked) => setEditData(prev => ({
                      ...prev,
                      benefits: { ...prev.benefits, life_insurance: checked }
                    }))}
                  />
                  <Label>Life Insurance</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={editData.benefits?.dental_insurance || false}
                    onCheckedChange={(checked) => setEditData(prev => ({
                      ...prev,
                      benefits: { ...prev.benefits, dental_insurance: checked }
                    }))}
                  />
                  <Label>Dental Insurance</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={editData.benefits?.gym_membership || false}
                    onCheckedChange={(checked) => setEditData(prev => ({
                      ...prev,
                      benefits: { ...prev.benefits, gym_membership: checked }
                    }))}
                  />
                  <Label>Gym Membership</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={editData.benefits?.transportation || false}
                    onCheckedChange={(checked) => setEditData(prev => ({
                      ...prev,
                      benefits: { ...prev.benefits, transportation: checked }
                    }))}
                  />
                  <Label>Transportation</Label>
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {Object.entries(employee.benefits || {}).map(([key, value]) => (
                  typeof value === 'boolean' && value && (
                    <div key={key} className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-slate-900 capitalize">{key.replace('_', ' ')}</span>
                    </div>
                  )
                ))}
                {!employee.benefits || Object.values(employee.benefits).every(v => !v) && (
                  <div className="col-span-2 text-center py-8">
                    <Gift className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-slate-500">No benefits assigned</p>
                  </div>
                )}
              </div>
            )}
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

      case 'performance':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-900">Performance Reviews</h3>
            <div className="text-center py-12">
              <TrendingUp className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500">Performance reviews coming soon</p>
            </div>
          </div>
        );

      case 'notes':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Notes</h3>
            {isEditing ? (
              <Textarea
                value={editData.notes || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))}
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
        <Button variant="ghost" onClick={() => navigate('/Employees')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Employees
        </Button>

        <Card className="border-slate-200 overflow-hidden shadow-xl">
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

          <div className="flex">
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

            <div className="flex-1 p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900">
                  {menuItems.find(m => m.id === activeSection)?.label}
                </h2>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (isEditing) {
                      handleSave();
                    } else {
                      setIsEditing(true);
                    }
                  }}
                  className="gap-2"
                  disabled={updateEmployeeMutation.isPending}
                >
                  {isEditing ? (
                    <>
                      <Save className="w-4 h-4" />
                      {updateEmployeeMutation.isPending ? 'Saving...' : 'Save'}
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
      </div>
    </div>
  );
}