import React from "react";
import { motion } from "framer-motion";
import { Users } from "lucide-react";

export const AttendanceSkeleton = () => (
  <div className="space-y-4">
    {Array(5)
      .fill(0)
      .map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm animate-pulse"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-100 rounded-full" />
            <div className="space-y-2">
              <div className="h-4 w-32 bg-slate-100 rounded" />
              <div className="h-3 w-24 bg-slate-100 rounded" />
            </div>
          </div>
          <div className="flex gap-6">
            {Array(3)
              .fill(0)
              .map((_, j) => (
                <div key={j} className="text-center space-y-2">
                  <div className="h-6 w-8 bg-slate-100 rounded mx-auto" />
                  <div className="h-2 w-12 bg-slate-100 rounded mx-auto" />
                </div>
              ))}
          </div>
        </div>
      ))}
  </div>
);

export default function EmployeeAttendanceList({
  employees = [],
  attendanceRecords = [],
  isLoading = false,
}) {
  if (isLoading) {
    return <AttendanceSkeleton />;
  }

  return (
    <div className="space-y-4">
      {employees.map((emp, index) => {
        const empAttendance = attendanceRecords.filter(
          (r) => r.employee_id === emp.id
        );
        const thisMonth = empAttendance.filter((r) => {
          const d = new Date(r.date);
          const now = new Date();
          return (
            d.getMonth() === now.getMonth() &&
            d.getFullYear() === now.getFullYear()
          );
        });
        const present = thisMonth.filter(
          (r) => r.status === "present" || r.status === "remote"
        ).length;
        const absent = thisMonth.filter((r) => r.status === "absent").length;
        const late = thisMonth.filter((r) => r.status === "late").length;

        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            key={emp.id}
            className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-white border border-slate-100 hover:border-indigo-100 hover:shadow-md transition-all rounded-2xl group gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-full flex items-center justify-center shrink-0">
                <span className="text-indigo-700 font-bold text-lg">
                  {emp.full_name?.charAt(0).toUpperCase() || "E"}
                </span>
              </div>
              <div>
                <p className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                  {emp.full_name}
                </p>
                <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 mt-0.5">
                  {emp.job_title}
                </p>
              </div>
            </div>
            <div className="flex gap-4 md:gap-8 bg-slate-50 p-3 rounded-xl border border-slate-100 w-full md:w-auto justify-center md:justify-end">
              <div className="text-center w-16">
                <p className="text-2xl font-black text-emerald-600">{present}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Present
                </p>
              </div>
              <div className="w-px h-10 bg-slate-200" />
              <div className="text-center w-16">
                <p className="text-2xl font-black text-rose-600">{absent}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Absent
                </p>
              </div>
              <div className="w-px h-10 bg-slate-200" />
              <div className="text-center w-16">
                <p className="text-2xl font-black text-amber-500">{late}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Late
                </p>
              </div>
            </div>
          </motion.div>
        );
      })}

      {employees.length === 0 && (
        <div className="text-center p-12 bg-white rounded-2xl border border-slate-200/60 shadow-sm flex flex-col items-center">
          <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            No employees found
          </h3>
          <p className="text-slate-500 text-sm">
            Add employees to start tracking attendance.
          </p>
        </div>
      )}
    </div>
  );
}
