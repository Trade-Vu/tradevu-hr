import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { CheckCircle2, XCircle, CalendarRange, Loader2, UserCircle } from 'lucide-react';
import { ApprovalsSkeleton, EmptyState, RejectDialog, safeDate } from './ApprovalsUIComponents';
import TaskReviewDialog from './TaskReviewDialog';

export default function UnifiedReviewsTab({
  loading,
  totalEmployeeReviewsCount,
  unifiedEmployeeIds,
  pendingDocuments,
  pendingProfiles,
  pendingProfileReviews,
  pendingTasksReviews,
  pendingProbationSetups,
  pendingProbationEnds,
  pendingProbations,
  pendingOffboardings,
  getEmployeeName,
  getEmployeeDept,
  getEmployeeJobTitle,
  onSelectUnifiedEmployee,
  onBeginOffboarding,
  approveCompletedTasks,
  isApprovingTasks,
  approveProbationSetup,
  isApprovingProbationSetup,
  approveProbationEnd,
  isApprovingProbationEnd,
  approveProfile,
  rejectProfile,
  isApprovingProfile,
  profAppVars,
  approveProbation,
  approveOffboarding,
  rejectOffboarding,
}) {
  const [taskReviewEmpId, setTaskReviewEmpId] = useState(null);

  if (loading) {
    return <ApprovalsSkeleton />;
  }

  if (totalEmployeeReviewsCount === 0) {
    return <EmptyState message="No pending reviews across the organization." icon={UserCircle} />;
  }

  const selectedTaskEmp = pendingTasksReviews.find((e) => (e.id || e._id) === taskReviewEmpId);
  const activeTasksForSelectedEmp = selectedTaskEmp
    ? (selectedTaskEmp.onboardingTasks?.filter(
        (t) =>
          Boolean(t.isCompleted || ['completed', 'done', 'DONE', 'COMPLETED'].includes(t.status)) &&
          t.status !== 'approved' &&
          !t.isApproved
      ) || [])
    : [];

  return (
    <div className="space-y-8">
      {/* Employee Reviews (Unified View) */}
      {unifiedEmployeeIds.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-slate-800 border-b pb-2 mb-4">Employee Reviews</h3>
          {unifiedEmployeeIds.map((empId) => {
            const eDocs = pendingDocuments.filter((d) => (d.employeeId?._id || d.employeeId?.id || d.employeeId) === empId).length;
            const eProfs = pendingProfiles.filter((p) => (p.employeeId?._id || p.employeeId?.id || p.employeeId) === empId).length;
            const ePendingOnboarding = pendingProfileReviews.some((e) => (e.id || e._id) === empId);

            if (!ePendingOnboarding && eDocs === 0 && eProfs === 0) return null;

            return (
              <motion.div 
                key={empId} 
                whileHover={{ y: -2 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border border-slate-200/60 rounded-xl bg-white shadow-xs hover:shadow-md transition-all gap-4 group"
              >
                <div>
                  <h4 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{getEmployeeName(empId)}</h4>
                  <p className="text-sm text-slate-500 mt-1">{getEmployeeJobTitle(empId)} • <span className="font-medium text-slate-600">{getEmployeeDept(empId)}</span></p>
                  <div className="flex gap-2 mt-2">
                    {ePendingOnboarding && <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 font-medium">Pending Activation</Badge>}
                    {eProfs > 0 && <Badge variant="outline" className="text-indigo-600 border-indigo-200 bg-indigo-50 font-medium">{eProfs} Profile Changes</Badge>}
                    {eDocs > 0 && <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 font-medium">{eDocs} Documents</Badge>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button 
                    className="bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all duration-150 ease-out text-white flex items-center gap-2 rounded-lg shadow-sm font-medium text-xs px-4 py-2"
                    onClick={() => onSelectUnifiedEmployee(empId)}
                  >
                    Review
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Tasks Reviews */}
      {pendingTasksReviews.length > 0 && (
        <div className="space-y-3 mt-8">
          <h3 className="text-lg font-semibold text-slate-800 border-b pb-2 mb-4">Completed Tasks</h3>
          {pendingTasksReviews.map((emp) => {
            const isCompletedTask = (t) => Boolean(t.isCompleted || ['completed', 'done', 'DONE', 'COMPLETED'].includes(t.status));
            const completedTasks = emp.onboardingTasks?.filter((t) => isCompletedTask(t) && t.status !== 'approved' && !t.isApproved) || [];
            if (completedTasks.length === 0) return null;
            
            return (
              <motion.div 
                key={emp.id || emp._id} 
                whileHover={{ y: -2 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border border-slate-200/60 rounded-xl bg-white shadow-xs hover:shadow-md transition-all gap-4 group"
              >
                <div>
                  <h4 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{emp.fullName}</h4>
                  <p className="text-sm text-slate-500 mt-1">{emp.jobTitle} • <span className="font-medium text-slate-600">{emp.department?.name || 'No Dept'}</span></p>
                  <p className="text-sm text-indigo-600 font-medium mt-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{completedTasks.length} {completedTasks.length === 1 ? 'task' : 'tasks'} completed and awaiting approval.</span>
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button 
                    className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 active:scale-[0.98] transition-all duration-150 ease-out flex items-center gap-2 rounded-lg shadow-2xs font-medium text-xs px-3.5 py-2"
                    onClick={() => setTaskReviewEmpId(emp.id || emp._id)}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    View Tasks ({completedTasks.length})
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Task Review Dialog */}
      {selectedTaskEmp && (
        <TaskReviewDialog
          open={Boolean(taskReviewEmpId)}
          onOpenChange={(open) => !open && setTaskReviewEmpId(null)}
          employee={selectedTaskEmp}
          completedTasks={activeTasksForSelectedEmp}
          onApproveTasks={approveCompletedTasks}
          isApproving={isApprovingTasks}
        />
      )}

      {/* Probation Setup Reviews */}
      {pendingProbationSetups.length > 0 && (
        <div className="space-y-3 mt-8">
          <h3 className="text-lg font-semibold text-slate-800 border-b pb-2 mb-4">Set Probation Period</h3>
          {pendingProbationSetups.map((emp) => (
            <motion.div 
              key={emp.id} 
              whileHover={{ y: -2 }}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border border-slate-200/60 rounded-xl bg-white shadow-xs hover:shadow-md transition-all gap-4 group"
            >
              <div>
                <h4 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{emp.fullName}</h4>
                <p className="text-sm text-slate-500 mt-1">{emp.jobTitle} • <span className="font-medium text-slate-600">{emp.department?.name || 'No Dept'}</span></p>
                <p className="text-sm text-indigo-600 font-medium mt-2">All tasks completed. Ready for probation setup.</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all duration-150 ease-out text-white flex items-center gap-2 rounded-lg shadow-sm font-medium text-xs px-4 py-2">
                      <CalendarRange className="w-4 h-4" />
                      Set Probation
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:rounded-2xl border-slate-200/80 shadow-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-lg font-bold text-slate-900">Set Probation Period</DialogTitle>
                      <DialogDescription className="text-xs text-slate-500">Define the probation start and end dates for {emp.fullName}.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.target);
                      approveProbationSetup({ 
                        employeeId: emp.id, 
                        startDate: formData.get('startDate'), 
                        endDate: formData.get('endDate') 
                      });
                    }} className="space-y-4 pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-slate-700">Start Date</label>
                          <input type="date" name="startDate" required className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-slate-700">End Date</label>
                          <input type="date" name="endDate" required className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                      </div>
                      <Button type="submit" disabled={isApprovingProbationSetup} className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all duration-150 ease-out text-white font-semibold text-xs py-2.5 rounded-lg shadow-sm">
                        {isApprovingProbationSetup ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Probation End Reviews */}
      {pendingProbationEnds.length > 0 && (
        <div className="space-y-3 mt-8">
          <h3 className="text-lg font-semibold text-slate-800 border-b pb-2 mb-4">Probation Period Ended</h3>
          {pendingProbationEnds.map((emp) => (
            <motion.div 
              key={emp.id} 
              whileHover={{ y: -2 }}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border border-slate-200/60 rounded-xl bg-white shadow-xs hover:shadow-md transition-all gap-4 group"
            >
              <div>
                <h4 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{emp.fullName}</h4>
                <p className="text-sm text-slate-500 mt-1">{emp.jobTitle} • <span className="font-medium text-slate-600">{emp.department?.name || 'No Dept'}</span></p>
                <p className="text-sm text-indigo-600 font-medium mt-2">Probation ended on {safeDate(emp.probationEndDate)}.</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button 
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50 active:scale-[0.98] transition-all duration-150 ease-out flex items-center gap-2 rounded-lg shadow-2xs font-medium text-xs px-3.5 py-2"
                  onClick={() => onBeginOffboarding(emp.id)}
                >
                  <XCircle className="w-4 h-4" />
                  Begin Offboarding
                </Button>
                <Button 
                  className="bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] transition-all duration-150 ease-out text-white flex items-center gap-2 rounded-lg shadow-sm font-medium text-xs px-4 py-2"
                  onClick={() => approveProbationEnd({ employeeId: emp.id })}
                  disabled={isApprovingProbationEnd}
                >
                  {isApprovingProbationEnd ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Change to Active
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Profile Updates */}
      {pendingProfiles.length > 0 && (
        <div className="space-y-3 mt-8">
          <h3 className="text-lg font-semibold text-slate-800 border-b pb-2 mb-4">Profile Updates</h3>
          {pendingProfiles.map((update) => (
            <motion.div 
              key={update.id} 
              whileHover={{ y: -2 }}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border border-slate-200/60 rounded-xl bg-white shadow-xs hover:shadow-md transition-all gap-4 group"
            >
              <div>
                <h4 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{getEmployeeName(update.employeeId)}</h4>
                <p className="text-sm text-slate-500 mt-1">
                  Requested change to <span className="font-semibold text-slate-700">{update.fieldName}</span>
                </p>
                <div className="flex items-center gap-2 mt-2 text-sm border border-slate-100 bg-slate-50 p-2 rounded-lg inline-flex">
                  <span className="text-slate-400 line-through font-medium">{update.currentValue || '(empty)'}</span>
                  <span className="text-slate-300">→</span>
                  <span className="text-indigo-600 font-semibold">{update.requestedValue}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <RejectDialog onReject={(reason) => rejectProfile({ id: update.id, reason, attachmentUrl: "" })} title="Reject Profile Update" />
                <Button 
                  className="bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all duration-150 ease-out text-white flex items-center gap-2 rounded-lg shadow-sm font-medium text-xs px-4 py-2"
                  onClick={() => approveProfile({ id: update.id })}
                  disabled={isApprovingProfile && profAppVars?.id === update.id}
                >
                  {isApprovingProfile && profAppVars?.id === update.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  Approve
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Probation Requests */}
      {pendingProbations.length > 0 && (
        <div className="space-y-3 mt-8">
          <h3 className="text-lg font-semibold text-slate-800 border-b pb-2 mb-4">Probation Requests</h3>
          {pendingProbations.map((prob) => (
            <motion.div 
              key={prob.id} 
              whileHover={{ y: -2 }}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border border-slate-200/60 rounded-xl bg-white shadow-xs hover:shadow-md transition-all gap-4 group"
            >
              <div>
                <h4 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{prob.employee?.fullName || 'Unknown'}</h4>
                <p className="text-sm text-slate-500 mt-1">
                  Requested Probation Period: <span className="font-medium text-slate-700">{safeDate(prob.startDate)}</span> to <span className="font-medium text-slate-700">{safeDate(prob.endDate)}</span>
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <RejectDialog onReject={(reason) => approveProbation({ id: prob.id, status: 'REJECTED', comments: reason })} title="Reject Probation Request" />
                <Button 
                  className="bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all duration-150 ease-out text-white flex items-center gap-2 rounded-lg shadow-sm font-medium text-xs px-4 py-2"
                  onClick={() => approveProbation({ id: prob.id, status: 'APPROVED' })}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approve
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Offboarding Requests */}
      {pendingOffboardings.length > 0 && (
        <div className="space-y-3 mt-8">
          <h3 className="text-lg font-semibold text-slate-800 border-b pb-2 mb-4">Offboarding Requests</h3>
          {pendingOffboardings.map((off) => (
            <motion.div 
              key={off.id} 
              whileHover={{ y: -2 }}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border border-slate-200/60 rounded-xl bg-white shadow-xs hover:shadow-md transition-all gap-4 group"
            >
              <div>
                <h4 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{off.employee?.fullName || 'Unknown'}</h4>
                <p className="text-sm text-slate-500 mt-1">
                  Offboarding Type: <span className="font-semibold text-slate-700">{off.exitType}</span> • Exit Date: <span className="font-medium text-slate-700">{safeDate(off.exitDate)}</span>
                </p>
                {off.reason && <p className="text-sm text-slate-600 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100">"{off.reason}"</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <RejectDialog onReject={(reason) => rejectOffboarding({ id: off.id, comments: reason })} title="Reject Offboarding" />
                <Button 
                  className="bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all duration-150 ease-out text-white flex items-center gap-2 rounded-lg shadow-sm font-medium text-xs px-4 py-2"
                  onClick={() => approveOffboarding({ id: off.id })}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approve
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
