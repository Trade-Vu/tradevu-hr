import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users, CheckCircle, XCircle, Clock, TrendingUp } from "lucide-react";

export default function AttendanceSummary({ attendanceRecords, employees }) {
  const today = new Date().toISOString().split('T')[0];
  const todayRecords = attendanceRecords.filter(r => r.date === today);

  const present = todayRecords.filter(r => r.status === 'present' || r.status === 'late' || r.status === 'remote').length;
  const absent = todayRecords.filter(r => r.status === 'absent').length;
  const late = todayRecords.filter(r => r.status === 'late').length;
  const totalEmployees = employees.length;
  const attendanceRate = totalEmployees > 0 ? Math.round((present / totalEmployees) * 100) : 0;

  const stats = [
    {
      title: "Total Employees",
      value: totalEmployees,
      icon: Users,
      color: "blue",
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      title: "Present Today",
      value: present,
      icon: CheckCircle,
      color: "green",
      bgColor: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      title: "Absent Today",
      value: absent,
      icon: XCircle,
      color: "red",
      bgColor: "bg-red-100",
      iconColor: "text-red-600",
    },
    {
      title: "Late Arrivals",
      value: late,
      icon: Clock,
      color: "orange",
      bgColor: "bg-orange-100",
      iconColor: "text-orange-600",
    },
    {
      title: "Attendance Rate",
      value: `${attendanceRate}%`,
      icon: TrendingUp,
      color: "purple",
      bgColor: "bg-purple-100",
      iconColor: "text-purple-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="border-slate-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-3">
              <div className={`${stat.bgColor} p-3 rounded-xl`}>
                <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-1">{stat.value}</div>
            <div className="text-sm text-slate-600">{stat.title}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}