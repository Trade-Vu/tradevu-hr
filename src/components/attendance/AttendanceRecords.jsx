import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Clock, CheckCircle, XCircle, Coffee, Home, Calendar } from "lucide-react";
import { format } from "date-fns";

const statusConfig = {
  present: { color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle, label: "Present" },
  absent: { color: "bg-red-100 text-red-700 border-red-200", icon: XCircle, label: "Absent" },
  late: { color: "bg-orange-100 text-orange-700 border-orange-200", icon: Clock, label: "Late" },
  half_day: { color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Coffee, label: "Half Day" },
  leave: { color: "bg-purple-100 text-purple-700 border-purple-200", icon: Calendar, label: "Leave" },
  remote: { color: "bg-blue-100 text-blue-700 border-blue-200", icon: Home, label: "Remote" },
};

export default function AttendanceRecords({ attendanceRecords, employees, settings }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const getEmployeeName = (employeeId) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee ? employee.full_name : "Unknown";
  };

  const filteredRecords = attendanceRecords.filter(record => {
    const matchesSearch = record.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getEmployeeName(record.employee_id).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = !dateFilter || record.date === dateFilter;
    return matchesSearch && matchesDate;
  });

  if (attendanceRecords.length === 0) {
    return (
      <Card className="border-slate-200 shadow-lg">
        <CardContent className="p-12 text-center">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No attendance records</h3>
          <p className="text-slate-500">Import attendance data to get started</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 shadow-lg">
      <CardHeader className="border-b border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <CardTitle className="text-xl">Attendance Records</CardTitle>
          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search employee..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full md:w-64"
              />
            </div>
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-40"
            />
            {dateFilter && (
              <Button variant="outline" onClick={() => setDateFilter("")}>
                Clear
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead>Check Out</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.map((record) => {
                const config = statusConfig[record.status];
                const StatusIcon = config.icon;
                
                return (
                  <TableRow key={record.id} className="hover:bg-slate-50">
                    <TableCell className="font-medium">
                      {record.employee_name || getEmployeeName(record.employee_id)}
                    </TableCell>
                    <TableCell>{format(new Date(record.date), "MMM d, yyyy")}</TableCell>
                    <TableCell>
                      {record.check_in ? (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-green-600" />
                          {record.check_in}
                        </span>
                      ) : (
                        <span className="text-slate-400">--</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {record.check_out ? (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-orange-600" />
                          {record.check_out}
                        </span>
                      ) : (
                        <span className="text-slate-400">--</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {record.hours_worked ? (
                        <span className="font-medium">{record.hours_worked}h</span>
                      ) : (
                        <span className="text-slate-400">--</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${config.color} border flex items-center gap-1 w-fit`}>
                        <StatusIcon className="w-3 h-3" />
                        {config.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {record.sync_source}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-slate-600">
                      {record.notes || "--"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}