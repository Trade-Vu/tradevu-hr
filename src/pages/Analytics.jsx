import React from "react";
import { analyticsApi } from "@/api";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { Users, CheckCircle, Clock, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const ATTENDANCE_COLORS = {
  PRESENT: '#10b981',
  ABSENT: '#ef4444',
  ON_LEAVE: '#f59e0b',
  LATE: '#8b5cf6',
  HALF_DAY: '#3b82f6',
};

const formatLabel = (value = '') => value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
const getArrayData = (response) => (Array.isArray(response) ? response : response?.data || []);

export default function Analytics() {
  const today = new Date();
  const [attendanceMonth, setAttendanceMonth] = React.useState(today.getMonth() + 1);
  const [attendanceYear, setAttendanceYear] = React.useState(today.getFullYear());
  const [leaveYear, setLeaveYear] = React.useState(today.getFullYear());

  const { data: summary = {}, isLoading: loadingSummary } = useQuery({
    queryKey: ['analytics', 'summary'],
    queryFn: analyticsApi.getHrSummary,
  });
  const { data: departmentResponse = [], isLoading: loadingDepartments } = useQuery({
    queryKey: ['analytics', 'headcount-department'],
    queryFn: analyticsApi.getHeadcountByDepartment,
  });
  const { data: headcountResponse = [], isLoading: loadingHeadcount } = useQuery({
    queryKey: ['analytics', 'headcount-trend'],
    queryFn: () => analyticsApi.getHeadcountTrend(6),
  });
  const { data: attendanceResponse = [], isLoading: loadingAttendance } = useQuery({
    queryKey: ['analytics', 'attendance', attendanceYear, attendanceMonth],
    queryFn: () => analyticsApi.getAttendanceSummary(attendanceYear, attendanceMonth),
  });
  const { data: payrollResponse = [], isLoading: loadingPayroll } = useQuery({
    queryKey: ['analytics', 'payroll-trend'],
    queryFn: () => analyticsApi.getPayrollTrend(6),
  });
  const { data: leaveResponse = [], isLoading: loadingLeave } = useQuery({
    queryKey: ['analytics', 'leave', leaveYear],
    queryFn: () => analyticsApi.getLeaveAnalytics(leaveYear),
  });

  const departmentData = getArrayData(departmentResponse).map((item) => ({
    department: item.departmentName || 'Unassigned',
    count: item.count || 0,
  }));
  const headcountData = getArrayData(headcountResponse).map((item) => ({
    month: item.month,
    headcount: item.count || 0,
  }));
  const attendanceData = getArrayData(attendanceResponse).map((item) => ({
    name: formatLabel(item._id || item.status),
    value: item.count || 0,
    color: ATTENDANCE_COLORS[item._id || item.status] || '#64748b',
  }));
  const payrollData = getArrayData(payrollResponse).map((item) => ({
    month: item.month,
    gross: item.totalGross || 0,
    net: item.totalNet || 0,
    deductions: item.totalDeductions || 0,
  }));
  const leaveByMonth = getArrayData(leaveResponse).reduce((months, item) => {
    const month = item._id?.month;
    if (!month) return months;
    if (!months[month]) months[month] = { month: String(month).padStart(2, '0'), total: 0, days: 0 };
    months[month].total += item.count || 0;
    months[month].days += item.totalDays || 0;
    return months;
  }, {});
  const leaveData = Object.values(leaveByMonth);
  const isLoading = loadingSummary || loadingDepartments || loadingHeadcount || loadingAttendance || loadingPayroll || loadingLeave;

  if (isLoading) {
    return (
      <div className="p-4 md:p-8">
        <div className="mx-auto space-y-8 max-w-7xl">
          <Skeleton className="w-64 h-12" />
          <div className="grid gap-6 md:grid-cols-3">
            {Array(3).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mx-auto space-y-8 max-w-7xl">
        {/* Header */}
        <div> 
          <h1 className="text-2xl font-semibold text-slate-900">HR Analytics</h1>
          <p className="mt-1 text-slate-500">Workforce, attendance, leave, and payroll insights.</p>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-5">
          <Card className="border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">Total Employees</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{summary.totalEmployees || 0}</p>
                  <p className="mt-2 text-xs text-slate-500">All employee records</p>
                </div>
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">Active Employees</p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">{summary.activeEmployees || 0}</p>
                    <p className="mt-2 text-xs text-slate-500">Employment status: Active</p>
                </div>
                <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-xl">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">On Leave Today</p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">{summary.onLeaveToday || 0}</p>
                    <p className="mt-2 text-xs text-slate-500">Approved leave today</p>
                </div>
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">New Hires</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">
                      {summary.newHiresThisMonth || 0}
                  </p>
                    <p className="mt-2 text-xs text-slate-500">This month</p>
                </div>
                <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-xl">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">Pending Leave</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{summary.pendingLeaveRequests || 0}</p>
                  <p className="mt-2 text-xs text-slate-500">Awaiting approval</p>
                </div>
                <div className="flex items-center justify-center w-12 h-12 bg-slate-100 rounded-xl">
                  <Clock className="w-6 h-6 text-slate-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Headcount Trend */}
          <Card className="border-slate-200">
            <CardHeader className="border-b border-slate-200">
              <CardTitle>Headcount Trend</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={headcountData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="headcount" stroke="#2563eb" strokeWidth={2} name="Employees" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Department Headcount */}
          <Card className="border-slate-200">
            <CardHeader className="border-b border-slate-200">
              <CardTitle>Active Headcount by Department</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={departmentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2563eb" name="Employees" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Attendance Summary */}
          <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-200">
              <CardTitle>Attendance Summary</CardTitle>
              <div className="flex gap-2">
                <select value={attendanceMonth} onChange={(event) => setAttendanceMonth(Number(event.target.value))} className="px-2 py-1 text-sm border rounded-md border-slate-200">
                  {Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}
                </select>
                <input type="number" value={attendanceYear} onChange={(event) => setAttendanceYear(Number(event.target.value))} className="w-20 px-2 py-1 text-sm border rounded-md border-slate-200" />
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={attendanceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                    {attendanceData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Payroll Trend */}
          <Card className="border-slate-200">
            <CardHeader className="border-b border-slate-200">
              <CardTitle>Payroll Trend</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={payrollData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="gross" stroke="#2563eb" name="Gross" />
                  <Line type="monotone" dataKey="net" stroke="#10b981" name="Net" />
                  <Line type="monotone" dataKey="deductions" stroke="#ef4444" name="Deductions" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Summary Stats */}
        <Card className="border-slate-200">
          <CardHeader className="border-b border-slate-200">
            <CardTitle>Leave Analytics</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex justify-end mb-4">
              <input type="number" value={leaveYear} onChange={(event) => setLeaveYear(Number(event.target.value))} className="w-20 px-2 py-1 text-sm border rounded-md border-slate-200" />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={leaveData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" fill="#f59e0b" name="Requests" />
                <Bar dataKey="days" fill="#2563eb" name="Leave Days" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}