import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { UserMinus, Plus, CheckCircle, Calendar, DollarSign } from "lucide-react";
import { format } from "date-fns";

export default function Offboarding() {
  const { data: offboardings = [] } = useQuery({
    queryKey: ['offboardings'],
    queryFn: () => base44.entities.Offboarding.list('-created_date'),
    initialData: [],
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-start">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm mb-4">
              <UserMinus className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-slate-700">Offboarding Management</span>
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-3">Offboarding Journey</h1>
            <p className="text-lg text-slate-600">Manage employee departures smoothly</p>
          </div>
          <Button className="bg-gradient-to-r from-blue-600 to-indigo-600">
            <Plus className="w-4 h-4 mr-2" />
            New Offboarding
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offboardings.map(offboarding => (
            <Card key={offboarding.id} className="border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-teal-500 to-cyan-600 p-6 text-white">
                <div className="w-20 h-20 bg-white rounded-full mx-auto mb-4 flex items-center justify-center border-4 border-white shadow-lg">
                  <span className="text-3xl">👋</span>
                </div>
                <h3 className="font-bold text-xl text-center">{offboarding.employee_name}</h3>
                <p className="text-center text-teal-100 text-sm">Offboarding Journey</p>
              </div>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-3">
                  {offboarding.checklist?.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        item.completed ? 'bg-green-500' : 'bg-slate-200'
                      }`}>
                        {item.completed && <CheckCircle className="w-4 h-4 text-white" />}
                      </div>
                      <span className={`text-sm ${item.completed ? 'text-slate-900' : 'text-slate-500'}`}>
                        {item.task}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Notice Date</p>
                      <p className="font-medium">{format(new Date(offboarding.notice_date), 'MMM dd, yyyy')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Last Working Day</p>
                      <p className="font-medium">{format(new Date(offboarding.last_working_day), 'MMM dd, yyyy')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Termination Date</p>
                      <p className="font-medium">{format(new Date(offboarding.termination_date), 'MMM dd, yyyy')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Final Settlement</p>
                      <p className="font-medium">{offboarding.final_settlement?.toLocaleString()} SAR</p>
                    </div>
                  </div>
                </div>

                <Button className="w-full bg-red-600 hover:bg-red-700 mt-4">
                  Complete
                </Button>
              </CardContent>
            </Card>
          ))}

          {offboardings.length === 0 && (
            <Card className="col-span-full border-slate-200">
              <CardContent className="p-12 text-center">
                <UserMinus className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No offboarding processes</h3>
                <p className="text-slate-500">Start an offboarding journey when needed</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}