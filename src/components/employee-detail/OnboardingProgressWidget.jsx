import React from "react";
import { useQuery } from "@tanstack/react-query";
import { onboardingApi } from "@/api/onboarding.api";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ClipboardCheck, CheckCircle2, UserCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OnboardingProgressWidget({
  employeeId,
  employee,
  onCompleteAction,
  onSetToActive,
  onBeginOffboarding,
}) {
  const { data: rawTasks = [], isLoading } = useQuery({
    queryKey: ['onboarding-tasks', employeeId],
    queryFn: async () => {
      const res = await onboardingApi.getEmployeeTasks(employeeId);
      return Array.isArray(res) ? res : (res?.data || []);
    },
    enabled: !!employeeId,
  });

  const tasks = rawTasks.map((t) => ({
    ...t,
    id: t._id || t.id,
    isCompleted: Boolean(
      t.isCompleted ||
      t.status === 'completed' ||
      t.status === 'DONE' ||
      t.status === 'done' ||
      t.status === 'approved'
    ),
  }));

  const isProbation = employee?.employmentStatus === 'PROBATION';
  const terminalStatuses = ['OFFBOARDED', 'RESIGNED', 'TERMINATED', 'SUSPENDED'];
  const shouldHide = terminalStatuses.includes(employee?.employmentStatus);

  if (isLoading || (!isProbation && tasks.length === 0) || shouldHide) return null;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.isCompleted).length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const parseSafeDateObj = (d) => {
    if (!d) return null;
    const asNum = Number(d);
    const parsed = new Date(isNaN(asNum) ? d : asNum);
    return isNaN(parsed.getTime()) ? null : parsed;
  };

  let probationDaysLeft = null;
  let isProbationEnd = false;
  let endDateDisplay = null;

  if (isProbation) {
    let end = parseSafeDateObj(employee?.probationEndDate);
    if (!end) {
      end = parseSafeDateObj(employee?.hireDate);
      if (end) end.setMonth(end.getMonth() + 3); // 3 months default
    }

    if (end) {
      endDateDisplay = end.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
      const today = new Date();
      end.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      const diff = end.getTime() - today.getTime();
      probationDaysLeft = Math.ceil(diff / (1000 * 3600 * 24));
      isProbationEnd = probationDaysLeft <= 0;
    }
  }

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100 mb-6 shadow-sm">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0 border border-blue-100">
            <ClipboardCheck className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1 w-full">
            {isProbation ? (
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
                  <div>
                    <h4 className="font-semibold text-slate-900">Probation Status</h4>
                    <p className="text-sm text-slate-500">
                      {endDateDisplay ? `Ends on ${endDateDisplay}` : "End date pending"}
                    </p>
                  </div>
                  {probationDaysLeft !== null && (
                    <div className="text-left sm:text-right">
                      <span className="text-xs font-medium uppercase tracking-wider text-slate-500 block mb-1">Time Remaining</span>
                      <span className={`text-sm font-bold px-3 py-1 rounded-full ${isProbationEnd ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                        {isProbationEnd ? 'Probation Ended' : `${probationDaysLeft} days left`}
                      </span>
                    </div>
                  )}
                </div>
                {(onSetToActive || onBeginOffboarding) && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-blue-100/70">
                    {onSetToActive && (
                      <Button
                        type="button"
                        onClick={onSetToActive}
                        className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 h-8 rounded-md font-medium transition-colors inline-flex items-center gap-1.5"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        Set Employee to Active
                      </Button>
                    )}
                    {onBeginOffboarding && (
                      <Button
                        type="button"
                        onClick={onBeginOffboarding}
                        variant="outline"
                        className="text-xs border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 px-3 py-1.5 h-8 rounded-md font-medium transition-colors inline-flex items-center gap-1.5"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        Begin Offboarding
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h4 className="font-semibold text-slate-900">Onboarding Progress</h4>
                    <p className="text-sm text-slate-500">{completedTasks} of {totalTasks} tasks completed</p>
                  </div>
                  <span className="text-lg font-bold text-blue-700">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2 bg-blue-100 mb-3" />
                {progress === 100 && onCompleteAction && !terminalStatuses.includes(employee?.employmentStatus) && employee?.employmentStatus !== 'ACTIVE' && (
                  <Button 
                    type="button"
                    onClick={onCompleteAction}
                    className="mt-2 text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-md font-medium transition-colors inline-flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Set Employee to Probation
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
