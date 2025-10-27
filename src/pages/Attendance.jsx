import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar, Upload, Settings, Users } from "lucide-react";
import AttendanceRecords from "../components/attendance/AttendanceRecords";
import BulkAttendanceImport from "../components/attendance/BulkAttendanceImport";
import ZKTecoSettings from "../components/attendance/ZKTecoSettings";
import AttendanceSummary from "../components/attendance/AttendanceSummary";

export default function Attendance() {
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);

  const { data: attendanceRecords = [] } = useQuery({
    queryKey: ['attendance'],
    queryFn: () => base44.entities.Attendance.list('-date'),
    initialData: [],
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list(),
    initialData: [],
  });

  const { data: settings = [] } = useQuery({
    queryKey: ['attendance-settings'],
    queryFn: () => base44.entities.AttendanceSettings.list(),
    initialData: [],
  });

  const currentSettings = settings[0] || {
    work_start_time: "09:00",
    work_end_time: "17:00",
    late_threshold_minutes: 15,
    zkteco_enabled: false,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm mb-4">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-slate-700">Attendance Management</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-3">
              Staff Attendance
            </h1>
            <p className="text-lg text-slate-600">
              Track and manage employee attendance records
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={() => setShowSettingsDialog(true)}
              variant="outline"
              className="border-slate-300"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button 
              onClick={() => setShowImportDialog(true)}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            >
              <Upload className="w-4 h-4 mr-2" />
              Import Attendance
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <AttendanceSummary 
          attendanceRecords={attendanceRecords}
          employees={employees}
        />

        {/* Main Content */}
        <Tabs defaultValue="records" className="space-y-6">
          <TabsList className="bg-white border border-slate-200">
            <TabsTrigger value="records" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Records
            </TabsTrigger>
            <TabsTrigger value="summary" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Employee Summary
            </TabsTrigger>
          </TabsList>

          <TabsContent value="records">
            <AttendanceRecords 
              attendanceRecords={attendanceRecords}
              employees={employees}
              settings={currentSettings}
            />
          </TabsContent>

          <TabsContent value="summary">
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
              <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500">Employee attendance summary coming soon</p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Import Dialog */}
        <BulkAttendanceImport
          open={showImportDialog}
          onClose={() => setShowImportDialog(false)}
          employees={employees}
        />

        {/* Settings Dialog */}
        <ZKTecoSettings
          open={showSettingsDialog}
          onClose={() => setShowSettingsDialog(false)}
          currentSettings={currentSettings}
        />
      </div>
    </div>
  );
}