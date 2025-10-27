import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingUp, Calendar, AlertCircle } from "lucide-react";
import { format } from "date-fns";

const priorityColors = {
  low: "bg-blue-100 text-blue-700 border-blue-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  critical: "bg-red-100 text-red-700 border-red-200",
};

const statusColors = {
  identified: "bg-slate-100 text-slate-700 border-slate-200",
  planned: "bg-blue-100 text-blue-700 border-blue-200",
  in_progress: "bg-purple-100 text-purple-700 border-purple-200",
  completed: "bg-green-100 text-green-700 border-green-200",
};

const levelValues = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
  expert: 4,
};

export default function TrainingNeedsList({ trainingNeeds, employees }) {
  const getEmployeeName = (employeeId) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee ? employee.full_name : "Unknown";
  };

  const getProgressPercentage = (current, target) => {
    const currentVal = levelValues[current];
    const targetVal = levelValues[target];
    return Math.round((currentVal / targetVal) * 100);
  };

  if (trainingNeeds.length === 0) {
    return (
      <Card className="border-slate-200 shadow-lg">
        <CardContent className="p-12 text-center">
          <Target className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No training needs identified</h3>
          <p className="text-slate-500">Add training needs to track skill development</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {trainingNeeds.map((need) => (
        <Card key={need.id} className="border-slate-200 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-purple-50 to-pink-50 pb-4">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-bold text-lg text-slate-900">{need.skill_name}</h3>
              <Badge variant="outline" className={`${priorityColors[need.priority]} border`}>
                {need.priority}
              </Badge>
            </div>
            <p className="text-sm text-slate-600">{getEmployeeName(need.employee_id)}</p>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-600">Level Progress</span>
              </div>
              <Badge variant="outline" className={`${statusColors[need.status]} border`}>
                {need.status.replace('_', ' ')}
              </Badge>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-600 capitalize">{need.current_level}</span>
                <span className="font-semibold text-purple-600 capitalize">{need.target_level}</span>
              </div>
              <Progress value={getProgressPercentage(need.current_level, need.target_level)} className="h-2" />
            </div>

            {need.recommended_training && (
              <div className="p-3 bg-purple-50 rounded-lg">
                <p className="text-xs font-medium text-purple-900 mb-1">Recommended Training</p>
                <p className="text-sm text-purple-700">{need.recommended_training}</p>
              </div>
            )}

            {need.target_date && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Calendar className="w-4 h-4" />
                <span>Target: {format(new Date(need.target_date), "MMM d, yyyy")}</span>
              </div>
            )}

            {need.identified_by && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <AlertCircle className="w-3 h-3" />
                <span>Identified by: {need.identified_by}</span>
              </div>
            )}

            {need.notes && (
              <div className="pt-3 border-t border-slate-100">
                <p className="text-sm text-slate-600">{need.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}