import React from "react";
import { Card } from "@/components/ui/card";
import { Users, Calendar, Clock, CheckCircle2 } from "lucide-react";

export default function LeaveReportMetrics({ metrics }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <Card className="p-4 border-slate-200/80 bg-white shadow-xs rounded-xl flex items-center justify-between">
        <div>
          <p className="text-[11px] text-slate-500 font-medium tracking-tight">{metrics.countLabel}</p>
          <p className="text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">{metrics.count}</p>
        </div>
        <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
          <Users className="w-4 h-4" />
        </div>
      </Card>

      <Card className="p-4 border-slate-200/80 bg-white shadow-xs rounded-xl flex items-center justify-between">
        <div>
          <p className="text-[11px] text-slate-500 font-medium tracking-tight">{metrics.stat1Label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">{metrics.stat1}</p>
        </div>
        <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
          <Calendar className="w-4 h-4" />
        </div>
      </Card>

      <Card className="p-4 border-slate-200/80 bg-white shadow-xs rounded-xl flex items-center justify-between">
        <div>
          <p className="text-[11px] text-slate-500 font-medium tracking-tight">{metrics.stat2Label}</p>
          <p className="text-2xl font-bold text-amber-600 mt-0.5 tracking-tight">{metrics.stat2}</p>
        </div>
        <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
          <Clock className="w-4 h-4" />
        </div>
      </Card>

      <Card className="p-4 border-slate-200/80 bg-white shadow-xs rounded-xl flex items-center justify-between">
        <div>
          <p className="text-[11px] text-slate-500 font-medium tracking-tight">{metrics.stat3Label}</p>
          <p className="text-2xl font-bold text-emerald-600 mt-0.5 tracking-tight">{metrics.stat3}</p>
        </div>
        <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-4 h-4" />
        </div>
      </Card>
    </div>
  );
}
