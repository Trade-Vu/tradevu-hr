import React from "react";

export default function EmployeeCardSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array(6).fill(0).map((_, i) => (
        <div key={i} className="h-[280px] bg-white border border-slate-100 rounded-2xl shadow-sm p-6 flex flex-col animate-pulse">
          <div className="flex items-start gap-4 mb-5">
            <div className="rounded-full w-14 h-14 bg-slate-100 shrink-0"></div>
            <div className="flex-1 py-1 space-y-2">
              <div className="w-3/4 h-4 rounded bg-slate-100"></div>
              <div className="flex gap-2">
                <div className="w-1/4 h-4 rounded bg-slate-100"></div>
                <div className="w-1/3 h-4 rounded bg-slate-100"></div>
              </div>
            </div>
          </div>
          <div className="mb-auto space-y-3">
            <div className="flex items-center gap-3"><div className="w-6 h-6 rounded-md bg-slate-100"></div><div className="w-2/3 h-3 rounded bg-slate-100"></div></div>
            <div className="flex items-center gap-3"><div className="w-6 h-6 rounded-md bg-slate-100"></div><div className="w-1/2 h-3 rounded bg-slate-100"></div></div>
            <div className="flex items-center gap-3"><div className="w-6 h-6 rounded-md bg-slate-100"></div><div className="w-1/3 h-3 rounded bg-slate-100"></div></div>
          </div>
          <div className="flex justify-between pt-4 mt-4 border-t border-slate-100">
            <div className="w-1/4 h-3 rounded bg-slate-100"></div>
            <div className="w-1/4 h-3 rounded bg-slate-100"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
