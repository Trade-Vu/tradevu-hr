import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { User, Calendar, Star, ClipboardCheck } from "lucide-react";
import { format } from "date-fns";

const statusColors = {
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  submitted: "bg-blue-100 text-blue-700 border-blue-200",
  reviewed: "bg-green-100 text-green-700 border-green-200",
};

const typeColors = {
  self: "bg-purple-100 text-purple-700",
  manager: "bg-blue-100 text-blue-700",
  peer: "bg-green-100 text-green-700",
  "360": "bg-orange-100 text-orange-700",
};

export default function EvaluationsList({ evaluations, employees }) {
  const getEmployeeName = (employeeId) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee ? employee.full_name : "Unknown";
  };

  const getAverageRating = (competencies) => {
    if (!competencies) return 0;
    const scores = Object.values(competencies).filter(v => typeof v === 'number');
    if (scores.length === 0) return 0;
    return (scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(1);
  };

  if (evaluations.length === 0) {
    return (
      <Card className="border-slate-200 shadow-lg">
        <CardContent className="p-12 text-center">
          <ClipboardCheck className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No evaluations yet</h3>
          <p className="text-slate-500">Create your first evaluation to get started</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {evaluations.map((evaluation) => (
        <Card key={evaluation.id} className="border-slate-200 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-purple-50">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg mb-2">
                  {getEmployeeName(evaluation.employee_id)}
                </CardTitle>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className={typeColors[evaluation.evaluation_type]}>
                    {evaluation.evaluation_type}
                  </Badge>
                  <Badge variant="outline" className={`${statusColors[evaluation.status]} border`}>
                    {evaluation.status}
                  </Badge>
                </div>
              </div>
              {evaluation.overall_rating && (
                <div className="text-right">
                  <div className="text-2xl font-bold text-indigo-600">{evaluation.overall_rating}</div>
                  <div className="text-xs text-slate-500">Overall</div>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <User className="w-4 h-4" />
                <span>Evaluator: {evaluation.evaluator_email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Calendar className="w-4 h-4" />
                <span>Period: {evaluation.period}</span>
              </div>

              {evaluation.competencies && Object.keys(evaluation.competencies).length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-slate-700">Competencies</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-semibold">{getAverageRating(evaluation.competencies)}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(evaluation.competencies).slice(0, 3).map(([key, value]) => (
                      <div key={key}>
                        <div className="flex justify-between text-xs text-slate-600 mb-1">
                          <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                          <span>{value}/5</span>
                        </div>
                        <Progress value={(value / 5) * 100} className="h-1.5" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {evaluation.strengths && (
                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-2">Strengths</h4>
                  <p className="text-sm text-slate-600 line-clamp-2">{evaluation.strengths}</p>
                </div>
              )}

              {evaluation.goals && evaluation.goals.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-2">Goals ({evaluation.goals.length})</h4>
                  <ul className="text-sm text-slate-600 space-y-1">
                    {evaluation.goals.slice(0, 2).map((goal, index) => (
                      <li key={index} className="line-clamp-1">• {goal}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}