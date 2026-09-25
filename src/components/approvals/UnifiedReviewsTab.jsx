import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { CheckCircle2, XCircle, CalendarRange, Loader2, UserCircle } from 'lucide-react';
import { ApprovalsSkeleton, EmptyState, RejectDialog, safeDate } from './ApprovalsUIComponents';

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
                className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border border-slate-200/60 rounded-xl bg-white shadow-sm hover:shadow-md transition-all gap-4 group"
              >
                <div>
                  <h4 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{getEmployeeName(empId)}</h4>
                  <p className="text-sm text-slate-500 mt-1">{getEmployeeJobTitle(empId)} • <span className="font-medium text-slate-600">{getEmployeeDept(empId)}</span></p>
                  <div className="flex gap-2 mt-2">
                    {ePendingOnboarding && <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">Pending Activation</Badge>}
                    {eProfs > 0 && <Badge variant="outline" className="text-indigo-600 border-indigo-200 bg-indigo-50">{eProfs} Profile Changes</Badge>}
                    {eDocs > 0 && <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">{eDocs} Documents</Badge>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 rounded-lg shadow-sm"
                    onClick={() => onSelectUnifiedEmployee(empId)}
                  >
                    Review & Action
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
            const completedTasks = emp.onboardingTasks?.filter((t) => isCompletedTask(t) && t.status !== 'approved') || [];
            if (completedTasks.length === 0) return null;
            
            return (
              <motion.div 
                key={emp.id || emp._id} 
                whileHover={{ y: -2 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border border-slate-200/60 rounded-xl bg-white shadow-sm hover:shadow-md transition-all gap-4 group"
              >
                <div>
                  <h4 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{emp.fullName}</h4>
                  <p className="text-sm text-slate-500 mt-1">{emp.jobTitle} • <span className="font-medium text-slate-600">{emp.department?.name || 'No Dept'}</span></p>
                  <p className="text-sm text-indigo-600 font-medium mt-2">{completedTasks.length} tasks completed and awaiting approval.</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Dialog open={taskReviewEmpId === (emp.id || emp._id)} onOpenChange={(open) => setTaskReviewEmpId(open ? (emp.id || emp._id) : null)}>
                    <DialogTrigger asChild>
                      <Button className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-2 rounded-lg shadow-sm">
                        <CheckCircle2 className="w-4 h-4" />
                        View Tasks
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Completed Tasks</DialogTitle>
                        <DialogDescription>Review the tasks completed by {emp.fullName}.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-3 py-4 max-h-[60vh] overflow-y-auto">
                        {completedTasks.map((task) => (
                          <div key={task.id || task._id} className="text-sm flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-slate-800 font-medium">{task.title}</p>
                              <Badge variant="outline" className="text-xs mt-1 bg-white">{task.category}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-end pt-2 border-t border-slate-100">
                        <Button 
                          className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2"
                          onClick={() => {
                            approveCompletedTasks(
                              { 
                                employeeId: emp.id || emp._id, 
                                taskIds: completedTasks.map((t) => (t.id || t._id)?.toString()).filter(Boolean) 
                              },
                              { onSuccess: () => setTaskReviewEmpId(null) }
                            );
                          }}
                          disabled={isApprovingTasks}
                        >
                          {isApprovingTasks ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                          Approve Tasks
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Probation Setup Reviews */}
      {pendingProbationSetups.length > 0 && (
        <div className="space-y-3 mt-8">
          <h3 className="text-lg font-semibold text-slate-800 border-b pb-2 mb-4">Set Probation Period</h3>
          {pendingProbationSetups.map((emp) => (
            <motion.div 
              key={emp.id} 
              whileHover={{ y: -2 }}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border border-slate-200/60 rounded-xl bg-white shadow-sm hover:shadow-md transition-all gap-4 group"
            >
              <div>
                <h4 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{emp.fullName}</h4>
                <p className="text-sm text-slate-500 mt-1">{emp.jobTitle} • <span className="font-medium text-slate-600">{emp.department?.name || 'No Dept'}</span></p>
                <p className="text-sm text-indigo-600 font-medium mt-2">All tasks completed. Ready for probation setup.</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 rounded-lg shadow-sm">
                      <CalendarRange className="w-4 h-4" />
                      Set Probation
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Set Probation Period</DialogTitle>
                      <DialogDescription>Define the probation start and end dates for {emp.fullName}.</DialogDescription>
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
                          <label className="text-sm font-medium">Start Date</label>
                          <input type="date" name="startDate" required className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">End Date</label>
                          <input type="date" name="endDate" required className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm" />
                        </div>
                      </div>
                      <Button type="submit" disabled={isApprovingProbationSetup} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
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
              className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border border-slate-200/60 rounded-xl bg-white shadow-sm hover:shadow-md transition-all gap-4 group"
            >
              <div>
                <h4 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{emp.fullName}</h4>
                <p className="text-sm text-slate-500 mt-1">{emp.jobTitle} • <span className="font-medium text-slate-600">{emp.department?.name || 'No Dept'}</span></p>
                <p className="text-sm text-indigo-600 font-medium mt-2">Probation ended on {safeDate(emp.probationEndDate)}.</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button 
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50 flex items-center gap-2 rounded-lg shadow-sm"
                  onClick={() => onBeginOffboarding(emp.id)}
                >
                  <XCircle className="w-4 h-4" />
                  Begin Offboarding
                </Button>
                <Button 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 rounded-lg shadow-sm"
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
              className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border border-slate-200/60 rounded-xl bg-white shadow-sm hover:shadow-md transition-all gap-4 group"
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
                  className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 rounded-lg shadow-sm"
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
              className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border border-slate-200/60 rounded-xl bg-white shadow-sm hover:shadow-md transition-all gap-4 group"
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
                  className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 rounded-lg shadow-sm"
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
              className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border border-slate-200/60 rounded-xl bg-white shadow-sm hover:shadow-md transition-all gap-4 group"
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
                  className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 rounded-lg shadow-sm"
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
