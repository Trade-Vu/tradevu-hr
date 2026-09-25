import React from "react";
import { TrendingUp, Star, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function PerformanceTab({
  evaluations = [],
}) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-900">Performance Evaluations</h3>

      {evaluations.length === 0 ? (
        <div className="py-12 text-center">
          <TrendingUp className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500">No performance evaluations yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {evaluations.map(evaluation => (
            <div key={evaluation.id} className="p-5 border rounded-lg bg-slate-50 border-slate-200">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold text-slate-900">{evaluation.period}</h4>
                    <Badge variant="outline" className="capitalize">
                      {evaluation.evaluation_type?.replace('_', ' ')}
                    </Badge>
                    <Badge className={
                      evaluation.status === 'reviewed' ? 'bg-green-100 text-green-700' :
                        evaluation.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                    }>
                      {evaluation.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500">Evaluated by: {evaluation.evaluator_email}</p>
                </div>
                {evaluation.overall_rating > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < evaluation.overall_rating
                            ? 'fill-yellow-500 text-yellow-500'
                            : 'text-gray-300'
                            }`}
                        />
                      ))}
                    </div>
                    <span className="font-semibold text-slate-900">{evaluation.overall_rating}/5</span>
                  </div>
                )}
              </div>

              {evaluation.competencies && Object.keys(evaluation.competencies).length > 0 && (
                <div className="mb-3">
                  <p className="mb-2 text-sm font-medium text-slate-700">Competencies:</p>
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                    {Object.entries(evaluation.competencies).map(([key, value]) => (
                      value > 0 && (
                        <div key={key} className="flex items-center justify-between text-sm">
                          <span className="capitalize text-slate-600">{key.replace('_', ' ')}:</span>
                          <span className="font-medium text-slate-900">{value}/5</span>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {evaluation.strengths && (
                <div className="mb-3">
                  <p className="mb-1 text-sm font-medium text-slate-700">Strengths:</p>
                  <p className="text-sm text-slate-600">{evaluation.strengths}</p>
                </div>
              )}

              {evaluation.areas_for_improvement && (
                <div className="mb-3">
                  <p className="mb-1 text-sm font-medium text-slate-700">Areas for Improvement:</p>
                  <p className="text-sm text-slate-600">{evaluation.areas_for_improvement}</p>
                </div>
              )}

              {evaluation.document_url && (
                <div className="flex items-center gap-2 pt-3 mt-3 border-t border-slate-200">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <a
                    href={evaluation.document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View Supporting Document
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
