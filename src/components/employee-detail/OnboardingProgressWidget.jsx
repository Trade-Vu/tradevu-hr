import React from "react";
import { useQuery } from "@tanstack/react-query";
import { gqlClient } from "@/api/graphqlClient";
import { gql } from "graphql-request";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const GET_TASKS = gql`
  query GetTasks($employeeId: ID) {
    onboardingTasks(employeeId: $employeeId) {
      id
      isCompleted
    }
  }
`;

export default function OnboardingProgressWidget({ employeeId, onCompleteAction }) {
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['onboarding-tasks', employeeId],
    queryFn: async () => {
      const data = await gqlClient.request(GET_TASKS, { employeeId });
      return data.onboardingTasks || [];
    },
    enabled: !!employeeId
  });

  if (isLoading || tasks.length === 0) return null;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.isCompleted).length;
  const progress = Math.round((completedTasks / totalTasks) * 100);

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100 mb-6">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
            <ClipboardCheck className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1 w-full">
            <div className="flex justify-between items-center mb-2">
              <div>
                <h4 className="font-semibold text-slate-900">Onboarding Progress</h4>
                <p className="text-sm text-slate-500">{completedTasks} of {totalTasks} tasks completed</p>
              </div>
              <span className="text-lg font-bold text-blue-700">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2 bg-blue-100 mb-3" />
            {progress === 100 && onCompleteAction && (
              <Button 
                onClick={onCompleteAction}
                className="mt-2 text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-md font-medium transition-colors"
              >
                Set Employee to Probation
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
