import React from "react";
import OnboardingProgressWidget from "../OnboardingProgressWidget";
import TaskManager from "../TaskManager";

export default function OnboardingTab({
  employee,
  employeeId,
  onNavigateToJobWithStatus,
}) {
  return (
    <div className="space-y-6">
      <OnboardingProgressWidget
        employeeId={employeeId}
        employee={employee}
        onCompleteAction={() => onNavigateToJobWithStatus('PROBATION')}
        onSetToActive={() => onNavigateToJobWithStatus('ACTIVE')}
        onBeginOffboarding={() => onNavigateToJobWithStatus('OFFBOARDED')}
      />
      <TaskManager employeeId={employeeId} tasks={employee?.onboardingTasks || []} />
    </div>
  );
}
