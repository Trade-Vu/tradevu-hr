import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";

export default function PerformanceCheckInsList({
  checkIns = [],
  status = "SCHEDULED",
  onUpdateCheckIn,
  getStatusColor,
}) {
  const filtered = checkIns.filter((c) => c.status === status);

  if (filtered.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500 text-sm bg-white rounded-xl border border-slate-100">
        No {status.toLowerCase()} check-ins found.
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {filtered.map((checkIn) => (
        <Card key={checkIn.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="w-full">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Check-in for {checkIn.period}
                </h3>
                <div className="flex items-center gap-3 text-sm text-slate-600 mb-4">
                  <span>
                    {status === "COMPLETED"
                      ? `Completed on ${checkIn.completedDate || checkIn.scheduledDate}`
                      : `Scheduled: ${checkIn.scheduledDate}`}
                  </span>
                  <Badge className={getStatusColor?.(checkIn.status) || ""}>
                    {checkIn.status}
                  </Badge>
                </div>

                {status === "SCHEDULED" ? (
                  <div className="space-y-2">
                    <Label>Self Appraisal Notes</Label>
                    <Textarea
                      placeholder="Write your reflections here..."
                      defaultValue={checkIn.selfAppraisal || ""}
                      onBlur={(e) =>
                        onUpdateCheckIn?.(checkIn.id, {
                          selfAppraisal: e.target.value,
                          status: "COMPLETED",
                        })
                      }
                    />
                    <p className="text-xs text-slate-500">
                      Clicking outside the box will submit your appraisal.
                    </p>
                  </div>
                ) : (
                  checkIn.overallRating > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">Manager Rating:</span>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < checkIn.overallRating
                                ? "fill-yellow-500 text-yellow-500"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
