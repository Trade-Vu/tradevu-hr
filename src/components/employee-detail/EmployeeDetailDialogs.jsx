import React from "react";
import { toast } from "sonner";
import { approvalsApi } from "@/api";
import { extractErrorMessage } from "@/lib/utils";
import ReassignHrAdminDialog from "./dialogs/ReassignHrAdminDialog";
import PromoteEmployeeDialog from "./dialogs/PromoteEmployeeDialog";
import SuspendEmployeeDialog from "./dialogs/SuspendEmployeeDialog";
import OffboardEmployeeDialog from "./dialogs/OffboardEmployeeDialog";
import ProbationDecisionDialog from "./dialogs/ProbationDecisionDialog";
import RejectProfileDialog from "./dialogs/RejectProfileDialog";
import ReactivateEmployeeDialog from "./dialogs/ReactivateEmployeeDialog";

export default function EmployeeDetailDialogs({
  employee,
  employees,
  departments,
  employeeClasses,
  employeeId,
  queryClient,
  activeDialog,
  onCloseDialog,
  selectedHrAdminEmpId,
  setSelectedHrAdminEmpId,
  mutations = {},
}) {
  return (
    <>
      <ReassignHrAdminDialog
        open={activeDialog === 'reassign'}
        onOpenChange={(open) => !open && onCloseDialog()}
        employee={employee}
        employees={employees}
        selectedHrAdminEmpId={selectedHrAdminEmpId}
        setSelectedHrAdminEmpId={setSelectedHrAdminEmpId}
        onConfirm={(targetId) => mutations.reassignHr?.mutate(targetId, {
          onSuccess: onCloseDialog
        })}
        isPending={Boolean(mutations.reassignHr?.isPending)}
      />

      <PromoteEmployeeDialog
        open={activeDialog === 'promote'}
        onOpenChange={(open) => !open && onCloseDialog()}
        employee={employee}
        departments={departments}
        employeeClasses={employeeClasses}
        onConfirm={(data) => mutations.requestPromotion?.mutate(data, {
          onSuccess: onCloseDialog
        })}
        isPending={Boolean(mutations.requestPromotion?.isPending)}
      />

      <SuspendEmployeeDialog
        open={activeDialog === 'suspend'}
        onOpenChange={(open) => !open && onCloseDialog()}
        employee={employee}
        onConfirm={(data) => mutations.suspendEmployee?.mutate(data, {
          onSuccess: onCloseDialog
        })}
        isPending={Boolean(mutations.suspendEmployee?.isPending)}
      />

      <OffboardEmployeeDialog
        open={activeDialog === 'offboard'}
        onOpenChange={(open) => !open && onCloseDialog()}
        employee={employee}
        onConfirm={(data) => mutations.requestOffboarding?.mutate(data, {
          onSuccess: onCloseDialog
        })}
        isPending={Boolean(mutations.requestOffboarding?.isPending)}
      />

      <ProbationDecisionDialog
        open={activeDialog === 'probation'}
        onOpenChange={(open) => !open && onCloseDialog()}
        employee={employee}
        onConfirm={(data) => mutations.requestProbation?.mutate(data, {
          onSuccess: onCloseDialog
        })}
        isPending={Boolean(mutations.requestProbation?.isPending)}
      />

      <RejectProfileDialog
        open={activeDialog === 'reject'}
        onOpenChange={(open) => !open && onCloseDialog()}
        onConfirm={async (reason) => {
          try {
            await approvalsApi.rejectEmployee(employeeId, reason);
            toast.success("Revision requested and profile returned to draft.");
            onCloseDialog();
            queryClient.invalidateQueries({ queryKey: ['employee', employeeId] });
            queryClient.invalidateQueries({ queryKey: ['employees'] });
          } catch (err) {
            toast.error(extractErrorMessage(err, "Failed to request profile revision."));
          }
        }}
      />

      <ReactivateEmployeeDialog
        open={activeDialog === 'reactivate'}
        onOpenChange={(open) => !open && onCloseDialog()}
        employee={employee}
        onConfirm={(data) => mutations.reactivateEmployee?.mutate(data, {
          onSuccess: onCloseDialog
        })}
        isPending={Boolean(mutations.reactivateEmployee?.isPending)}
      />
    </>
  );
}
