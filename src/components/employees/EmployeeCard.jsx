import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Briefcase, Calendar } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

const getStatusColors = (status) => {
  const s = (status || 'active').toLowerCase();
  switch (s) {
    case 'active': return "bg-green-50 text-green-700 border-green-200";
    case 'on_leave': return "bg-yellow-50 text-yellow-700 border-yellow-200";
    case 'suspended': return "bg-orange-50 text-orange-700 border-orange-200";
    case 'terminated': return "bg-red-50 text-red-700 border-red-200";
    case 'resigned': return "bg-slate-50 text-slate-700 border-slate-200";
    case 'pending_onboarding': return "bg-blue-50 text-blue-700 border-blue-200";
    case 'ongoing_onboarding': return "bg-indigo-50 text-indigo-700 border-indigo-200";
    case 'probation': return "bg-purple-50 text-purple-700 border-purple-200";
    case 'draft': return "bg-slate-100 text-slate-600 border-slate-300";
    default: return "bg-slate-50 text-slate-700 border-slate-200";
  }
};

export default function EmployeeCard({ employee, onOpenDetail }) {
  return (
    <motion.div whileHover={{ y: -2 }}>
      <div onClick={() => onOpenDetail ? onOpenDetail(employee.id) : null} className="block h-full cursor-pointer">
        <Card className="h-full border-slate-200/60 shadow-sm hover:shadow-md transition-shadow group bg-white rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start gap-4 mb-5">
              {employee.avatar_url ? (
                <img src={employee.avatar_url} alt={employee.full_name} className="w-14 h-14 rounded-full object-cover shadow-sm border border-slate-100" />
              ) : (
                <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-lg shadow-sm shrink-0">
                  {employee.full_name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                  {employee.full_name}
                </h3>
                <div className="flex items-center flex-wrap gap-2 mt-1.5">
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded font-medium whitespace-nowrap">
                    {employee.employeeCode}
                  </span>
                  <Badge variant="outline" className={`${getStatusColors(employee.employment_status)} border font-medium text-[10px] px-1.5 py-0 whitespace-nowrap`}>
                    {(employee.employment_status || 'active').replace(/_/g, ' ')}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-2.5 text-sm text-slate-600">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-md bg-slate-50 flex items-center justify-center shrink-0">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <span className="truncate font-medium">
                  {employee.job_title}
                  {employee.department_name && <span className="text-slate-400 font-normal"> • {employee.department_name}</span>}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-md bg-slate-50 flex items-center justify-center shrink-0">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <span className="truncate text-slate-500">{employee.email}</span>
              </div>
              {employee.phone && (
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-md bg-slate-50 flex items-center justify-center shrink-0">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <span className="text-slate-500">{employee.phone}</span>
                </div>
              )}
              {employee.start_date && !isNaN(new Date(employee.start_date).getTime()) && (
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-md bg-slate-50 flex items-center justify-center shrink-0">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <span className="text-slate-500">Joined {format(new Date(employee.start_date), "MMM d, yyyy")}</span>
                </div>
              )}
            </div>

            {employee.employment_type && (
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  Employment Type
                </span>
                <span className="text-xs font-medium text-slate-700">
                  {employee.employment_type.replace('_', ' ')}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}