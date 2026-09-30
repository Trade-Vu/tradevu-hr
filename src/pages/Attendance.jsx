import React, { useState } from "react";
import { gqlClient } from "@/api/graphqlClient";
import { gql } from "graphql-request";
import { useAuth } from "@/lib/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Upload, Settings, Users, Smartphone, Printer, Download, FileSpreadsheet } from "lucide-react";
import { format } from "date-fns";
import AttendanceRecords from "../components/attendance/AttendanceRecords";
import BulkAttendanceImport from "../components/attendance/BulkAttendanceImport";
import ZKTecoSettings from "../components/attendance/ZKTecoSettings";
import ZKTecoDeviceManager from "../components/attendance/ZKTecoDeviceManager";
import AttendanceSummary from "../components/attendance/AttendanceSummary";
import EmployeeAttendanceList from "../components/attendance/EmployeeAttendanceList";
import { motion } from "framer-motion";

export default function Attendance() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showDeviceManager, setShowDeviceManager] = useState(false);
  const [reportType, setReportType] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');

  const { data: attendanceRecords = [], isLoading: loadingRecords } = useQuery({
    queryKey: ['attendance'],
    queryFn: async () => {
      const ATT_QUERY = gql`
        query { attendanceRecords { id employeeId date clockIn clockOut status } }
      `;
      const data = await gqlClient.request(ATT_QUERY);
      return (data.attendanceRecords || []).map(a => ({
        ...a,
        employee_id: a.employeeId,
        check_in: a.clockIn,
        check_out: a.clockOut,
        employee_name: a.employeeId // mocked name
      }));
    },
    initialData: [],
  });

  const { data: employees = [], isLoading: loadingEmployees } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const EMP_QUERY = gql`query { employees { id fullName email jobTitle } }`;
      const data = await gqlClient.request(EMP_QUERY);
      return (data.employees || []).map(e => ({ ...e, full_name: e.fullName }));
    },
    initialData: [],
  });

  const { data: settings = [] } = useQuery({
    queryKey: ['attendance-settings'],
    queryFn: async () => [],
    initialData: [],
  });

  const { data: myTodayRecord } = useQuery({
    queryKey: ['attendance-today', user?.email],
    queryFn: async () => {
      const GET_MY_ATTENDANCE = gql`
        query GetMyAttendance($date: String!) {
          attendanceRecords(date: $date) {
            id
            employeeId
            date
            clockIn
            clockOut
            status
          }
        }
      `;
      const today = new Date().toISOString().split('T')[0];
      const data = await gqlClient.request(GET_MY_ATTENDANCE, { date: today });
      const record = (data.attendanceRecords || []).find(r => r.employeeId === user?.email);
      return record || null;
    },
    enabled: !!user?.email
  });

  const clockInMutation = useMutation({
    mutationFn: async () => {
      const CLOCK_IN = gql`
        mutation ClockIn {
          clockIn {
            id
            clockIn
            status
          }
        }
      `;
      return await gqlClient.request(CLOCK_IN);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-today'] });
    }
  });

  const clockOutMutation = useMutation({
    mutationFn: async () => {
      if (!myTodayRecord?.id) return;
      const CLOCK_OUT = gql`
        mutation ClockOut {
          clockOut {
            id
            clockOut
            status
          }
        }
      `;
      return await gqlClient.request(CLOCK_OUT);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-today'] });
    }
  });

  const currentSettings = settings[0] || {
    work_start_time: "09:00",
    work_end_time: "17:00",
    late_threshold_minutes: 15,
    zkteco_enabled: false,
  };

  const handlePrintReport = () => {
    window.print();
  };

  const handleExportPDF = () => {
    alert('PDF export coming soon');
  };

  const handleExportExcel = () => {
    let data = attendanceRecords;
    
    if (reportType === 'employee' && selectedEmployee) {
      data = attendanceRecords.filter(r => r.employee_id === selectedEmployee);
    } else if (reportType === 'department' && selectedDepartment) {
      const deptEmployees = employees.filter(e => e.department_id === selectedDepartment).map(e => e.id);
      data = attendanceRecords.filter(r => deptEmployees.includes(r.employee_id));
    }
    
    const csvData = data.map(record => 
      `${record.employee_name},${format(new Date(record.date), 'yyyy-MM-dd')},${record.status},${record.check_in || ''},${record.check_out || ''}`
    ).join('\n');
    
    const blob = new Blob([`Employee,Date,Status,Check In,Check Out\n${csvData}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const departments = [...new Set(employees.map(e => e.department_id).filter(Boolean))];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30 p-4 md:p-8"
    >
      <div className="max-w-7xl mx-auto space-y-8">
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-full mb-4">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">Attendance Management</span>
            </div>
            
            <p className="text-slate-500">
              Track and manage employee attendance records
            </p>
          </div>
          <div className="flex flex-col gap-3 items-end">
            <div className="flex gap-2 bg-white p-1.5 rounded-xl shadow-sm border border-slate-200/60">
              <Button 
                onClick={() => clockInMutation.mutate()} 
                disabled={!!myTodayRecord?.clockIn || clockInMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-6"
              >
                {myTodayRecord?.clockIn ? `Clocked In at ${myTodayRecord.clockIn}` : 'Clock In'}
              </Button>
              <Button 
                onClick={() => clockOutMutation.mutate()} 
                disabled={!myTodayRecord?.clockIn || !!myTodayRecord?.clockOut || clockOutMutation.isPending}
                variant={myTodayRecord?.clockOut ? "outline" : "destructive"}
                className={`rounded-lg px-6 ${!myTodayRecord?.clockOut ? 'bg-rose-600 hover:bg-rose-700 text-white border-0' : ''}`}
              >
                {myTodayRecord?.clockOut ? `Clocked Out at ${myTodayRecord.clockOut}` : 'Clock Out'}
              </Button>
            </div>
            <div className="flex gap-2 flex-wrap justify-end">
              <div className="flex gap-1 bg-white p-1 rounded-lg border border-slate-200/60 shadow-sm mr-2">
                <Button size="sm" variant="ghost" className="h-8 text-slate-600 hover:text-indigo-600" onClick={handlePrintReport}>
                  <Printer className="w-4 h-4 mr-1.5" />
                  Print
                </Button>
                <Button size="sm" variant="ghost" className="h-8 text-slate-600 hover:text-indigo-600" onClick={handleExportPDF}>
                  <Download className="w-4 h-4 mr-1.5" />
                  PDF
                </Button>
                <Button size="sm" variant="ghost" className="h-8 text-slate-600 hover:text-indigo-600" onClick={handleExportExcel}>
                  <FileSpreadsheet className="w-4 h-4 mr-1.5" />
                  Excel
                </Button>
              </div>
              <Button 
                size="sm"
                onClick={() => setShowDeviceManager(true)}
                variant="outline"
                className="h-10 rounded-lg border-indigo-200 text-indigo-700 hover:bg-indigo-50"
              >
                <Smartphone className="w-4 h-4 mr-2" />
                Devices
              </Button>
              <Button 
                size="sm"
                onClick={() => setShowSettingsDialog(true)}
                variant="outline"
                className="h-10 rounded-lg border-slate-200 hover:bg-slate-50"
              >
                <Settings className="w-4 h-4 mr-2 text-slate-500" />
                Settings
              </Button>
              <Button 
                size="sm"
                onClick={() => setShowImportDialog(true)}
                className="h-10 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Report Options */}
        <motion.div variants={itemVariants}>
          <Card className="border-slate-200/60 shadow-sm rounded-2xl bg-white">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <Label className="whitespace-nowrap text-slate-600 font-semibold uppercase tracking-wider text-[10px]">Report Type:</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger className="w-full sm:w-48 rounded-lg border-slate-200 bg-slate-50 focus:bg-white transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-100 shadow-lg">
                    <SelectItem value="all">All Staff Report</SelectItem>
                    <SelectItem value="employee">Individual Employee</SelectItem>
                    <SelectItem value="department">Department Report</SelectItem>
                  </SelectContent>
                </Select>
                
                {reportType === 'employee' && (
                  <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                    <SelectTrigger className="w-full sm:w-64 rounded-lg border-slate-200 bg-slate-50 focus:bg-white transition-colors">
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-100 shadow-lg">
                      {employees.map(emp => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                
                {reportType === 'department' && (
                  <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                    <SelectTrigger className="w-full sm:w-64 rounded-lg border-slate-200 bg-slate-50 focus:bg-white transition-colors">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-100 shadow-lg">
                      {departments.map(dept => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <AttendanceSummary 
            attendanceRecords={attendanceRecords}
            employees={employees}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <Tabs defaultValue="summary" className="space-y-6">
            <TabsList className="bg-slate-100 p-1 rounded-xl h-auto inline-flex border border-slate-200/70">
              <TabsTrigger
                value="summary"
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
              >
                <Users className="w-4 h-4" />
                <span>Employee Summary</span>
                <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-slate-200/70 text-slate-700 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                  {employees.length}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="records"
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
              >
                <Calendar className="w-4 h-4" />
                <span>Records</span>
                <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-slate-200/70 text-slate-700 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                  {attendanceRecords.length}
                </span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="mt-6 focus-visible:outline-none">
              <EmployeeAttendanceList
                employees={employees}
                attendanceRecords={attendanceRecords}
                isLoading={loadingEmployees || loadingRecords}
              />
            </TabsContent>

            <TabsContent value="records" className="mt-6">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
                <AttendanceRecords 
                  attendanceRecords={attendanceRecords}
                  employees={employees}
                  settings={currentSettings}
                />
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>

        <BulkAttendanceImport
          open={showImportDialog}
          onClose={() => setShowImportDialog(false)}
          employees={employees}
        />

        <ZKTecoSettings
          open={showSettingsDialog}
          onClose={() => setShowSettingsDialog(false)}
          currentSettings={currentSettings}
        />

        <ZKTecoDeviceManager
          open={showDeviceManager}
          onClose={() => setShowDeviceManager(false)}
        />
      </div>
    </motion.div>
  );
}
