import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users } from "lucide-react";

export default function ApplicantsList({
  applicants = [],
  jobs = [],
  statusConfig = {},
  onUpdateStatus,
}) {
  return (
    <Card className="border-slate-200">
      <CardHeader className="border-b border-slate-200">
        <CardTitle className="text-lg">All Applicants</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {applicants.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm">No applicants found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {applicants.map((applicant) => {
              const config = statusConfig[applicant.status] || {};
              const StatusIcon = config.icon || Users;
              const job = jobs.find((j) => j.id === applicant.job_posting_id);

              return (
                <div
                  key={applicant.id}
                  className="p-6 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="font-semibold text-slate-900">
                          {applicant.full_name}
                        </h3>
                        {applicant.ai_score && (
                          <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                            AI Score: {applicant.ai_score}%
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className={`${config.color || "bg-slate-100 text-slate-700"} border flex items-center gap-1`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {applicant.status?.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 mb-1">
                        Applied for: {job?.job_title || "General"}
                      </p>
                      <p className="text-sm text-slate-500">
                        {applicant.email} • {applicant.phone}
                      </p>
                      {applicant.ai_summary && (
                        <p className="text-sm text-slate-600 mt-2 italic">
                          {applicant.ai_summary}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={applicant.status}
                        onValueChange={(value) =>
                          onUpdateStatus?.(applicant.id, value)
                        }
                      >
                        <SelectTrigger className="w-36 text-xs h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="reviewed">Reviewed</SelectItem>
                          <SelectItem value="shortlisted">Shortlisted</SelectItem>
                          <SelectItem value="interview_scheduled">
                            Interview
                          </SelectItem>
                          <SelectItem value="offered">Offered</SelectItem>
                          <SelectItem value="hired">Hired</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                      {applicant.cv_url && (
                        <Button size="sm" variant="outline" asChild>
                          <a
                            href={applicant.cv_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View CV
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
