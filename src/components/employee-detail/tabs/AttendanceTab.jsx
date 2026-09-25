import React from "react";
import { Calendar, Printer, Download, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "../employeeDetailUtils";

export default function AttendanceTab({
  employee,
  attendance = [],
}) {
  const thisMonthAttendance = attendance.filter(a => {
    const recordDate = new Date(a.date);
    const now = new Date();
    return recordDate.getMonth() === now.getMonth() && recordDate.getFullYear() === now.getFullYear();
  });

  const presentDays = thisMonthAttendance.filter(a => a.status === 'present' || a.status === 'remote').length;
  const absentDays = thisMonthAttendance.filter(a => a.status === 'absent').length;
  const lateDays = thisMonthAttendance.filter(a => a.status === 'late').length;
  const leaveDays = thisMonthAttendance.filter(a => a.status === 'leave').length;

  const handlePrintAttendance = () => {
    window.print();
  };

  const handleExportPDF = () => {
    alert('PDF export feature coming soon');
  };

  const handleExportExcel = () => {
    const csvData = thisMonthAttendance.map(record =>
      `${format(new Date(record.date), 'yyyy-MM-dd')},${record.status},${record.check_in || ''},${record.check_out || ''}`
    ).join('\n');

    const blob = new Blob([`Date,Status,Check In,Check Out\n${csvData}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.download = `${employee?.full_name}_attendance_${format(new Date(), 'yyyy-MM')}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Attendance Overview</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handlePrintAttendance}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button size="sm" variant="outline" onClick={handleExportPDF}>
            <Download className="w-4 h-4 mr-2" />
            PDF
          </Button>
          <Button size="sm" variant="outline" onClick={handleExportExcel}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Excel
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="p-4 text-center rounded-lg bg-green-50">
          <p className="text-3xl font-bold text-green-700">{presentDays}</p>
          <p className="mt-1 text-sm text-slate-600">Present</p>
        </div>
        <div className="p-4 text-center rounded-lg bg-red-50">
          <p className="text-3xl font-bold text-red-700">{absentDays}</p>
          <p className="mt-1 text-sm text-slate-600">Absent</p>
        </div>
        <div className="p-4 text-center rounded-lg bg-yellow-50">
          <p className="text-3xl font-bold text-yellow-700">{lateDays}</p>
          <p className="mt-1 text-sm text-slate-600">Late</p>
        </div>
        <div className="p-4 text-center rounded-lg bg-blue-50">
          <p className="text-3xl font-bold text-blue-700">{leaveDays}</p>
          <p className="mt-1 text-sm text-slate-600">On Leave</p>
        </div>
      </div>

      <div className="pt-6 border-t">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Attendance Calendar - {format(new Date(), 'MMMM yyyy')}
        </h3>
        {thisMonthAttendance.length === 0 ? (
          <div className="py-8 text-center">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500">No attendance records this month</p>
          </div>
        ) : (
          <div className="space-y-2">
            {thisMonthAttendance.map(record => (
              <div key={record.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
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
}
