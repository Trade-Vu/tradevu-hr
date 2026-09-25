import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { approvalsApi } from "@/api";
import { extractErrorMessage } from "@/lib/utils";
import { toast } from "sonner";

export default function ProfileApprovalBanner({
  isDraft,
  employeeId,
  onRequestRevision,
  queryClient,
}) {
  const [isApproving, setIsApproving] = useState(false);

  const handleApprove = async () => {
    try {
      setIsApproving(true);
      await approvalsApi.approveEmployee(employeeId);
      toast.success("Employee profile approved and activated!");
      queryClient.invalidateQueries({ queryKey: ['employee', employeeId] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['pendingApprovals'] });
      queryClient.invalidateQueries({ queryKey: ['pendingApprovalsCount'] });
      queryClient.refetchQueries({ queryKey: ['pendingApprovalsCount'] });
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to approve employee data."));
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div className="mb-6">
      <Card className="overflow-hidden border-blue-200 shadow-sm bg-blue-50/90 rounded-xl">
        <CardContent className="flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center">
          <div>
            <h3 className="flex items-center gap-2 font-semibold text-blue-950">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
              {isDraft ? "Draft Employee Profile" : "Pending Profile Approval"}
            </h3>
            <p className="mt-1 text-sm text-blue-800">
              {isDraft
                ? "This employee profile is currently in Draft status. You can review their details and approve/activate their profile to change their status to Active."
                : "This employee has completed their profile data and submitted it for review. Approve to activate their profile, or request revisions."}
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              variant="outline"
              className="text-red-700 border-red-200 hover:bg-red-50 hover:text-red-800"
              onClick={onRequestRevision}
            >
              Request Revision
            </Button>
            <Button
              className="text-white bg-blue-600 shadow-sm hover:bg-blue-700"
              disabled={isApproving}
              onClick={handleApprove}
            >
              {isApproving ? "Approving..." : "Approve & Activate Profile"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
