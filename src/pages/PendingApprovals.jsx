import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { UserCircle, CalendarRange, Building2, Inbox, AlertCircle, Receipt, Banknote } from 'lucide-react';
import { extractErrorMessage } from '@/lib/utils';
import EmployeeDetail from './EmployeeDetail';
import UnifiedProfileReviewDialog from '@/components/UnifiedProfileReviewDialog';
import LeaveActionDialog from '@/components/Leave/LeaveActionDialog';

import { usePendingApprovalsData } from '@/components/approvals/usePendingApprovalsData';
import { containerVariants, itemVariants } from '@/components/approvals/ApprovalsUIComponents';
import UnifiedReviewsTab from '@/components/approvals/UnifiedReviewsTab';
import LeaveApprovalsTab from '@/components/approvals/LeaveApprovalsTab';
import DepartmentApprovalsTab from '@/components/approvals/DepartmentApprovalsTab';
import ExpenseApprovalsTab from '@/components/approvals/ExpenseApprovalsTab';
import PayrollApprovalsTab from '@/components/approvals/PayrollApprovalsTab';
import ApprovalsOffboardDialog from '@/components/approvals/ApprovalsOffboardDialog';

export default function PendingApprovals() {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [selectedUnifiedEmployeeId, setSelectedUnifiedEmployeeId] = useState(null);
  const [leaveConfirmState, setLeaveConfirmState] = useState(null); // { leave, action }
  
  const [showOffboardDialog, setShowOffboardDialog] = useState(false);
  const [offboardTargetId, setOffboardTargetId] = useState(null);
  const [offboardForm, setOffboardForm] = useState({ type: 'RESIGNATION', exitDate: '', reason: '' });

  const data = usePendingApprovalsData();

  if (data.error) {
    return (
      <div className="flex justify-center items-center h-64 text-red-500 bg-red-50 p-4 rounded-lg text-center max-w-lg mx-auto mt-10 shadow-sm border border-red-100">
        <AlertCircle className="w-6 h-6 mr-3 shrink-0" />
        <span>Error loading approvals: {extractErrorMessage(data.error)}</span>
      </div>
    );
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 p-4 md:p-8 max-w-5xl mx-auto"
    >
      {/* Employee Detail Modal */}
      <Dialog open={!!selectedEmployeeId} onOpenChange={(open) => !open && setSelectedEmployeeId(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] p-0 border-0 bg-transparent shadow-2xl">
          <DialogTitle className="sr-only">Employee Profile</DialogTitle>
          {selectedEmployeeId && (
            <EmployeeDetail 
              employeeIdProp={selectedEmployeeId} 
              onClose={() => setSelectedEmployeeId(null)} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Unified Profile Review Dialog */}
      <UnifiedProfileReviewDialog 
        open={!!selectedUnifiedEmployeeId}
        onOpenChange={(open) => !open && setSelectedUnifiedEmployeeId(null)}
        employeeId={selectedUnifiedEmployeeId}
        employeeName={data.getEmployeeName(selectedUnifiedEmployeeId)}
        isPendingActivation={data.pendingProfileReviews.some(e => (e.id || e._id) === selectedUnifiedEmployeeId)}
        pendingDocs={data.pendingDocuments.filter(d => (d.employeeId?._id || d.employeeId?.id || d.employeeId) === selectedUnifiedEmployeeId)}
        pendingProfiles={data.pendingProfiles.filter(p => (p.employeeId?._id || p.employeeId?.id || p.employeeId) === selectedUnifiedEmployeeId)}
      />

      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-full mb-4">
          <Inbox className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">Inbox</span>
        </div>
        <p className="text-slate-500 mt-1">Review and action pending requests across the organization.</p>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={itemVariants}>
        <Tabs defaultValue={!data.isAdmin && data.isManager ? "leaves" : "unified"} className="space-y-6">
          <TabsList className="bg-slate-100 p-1 rounded-xl h-auto inline-flex flex-wrap border border-slate-200/70">
            <TabsTrigger
              value="unified"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
            >
              <UserCircle className="w-4 h-4" />
              <span>Employee Reviews</span>
              {data.totalEmployeeReviewsCount > 0 && (
                <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-slate-200/70 text-slate-700 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                  {data.totalEmployeeReviewsCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="leaves"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
            >
              <CalendarRange className="w-4 h-4" />
              <span>Leave Requests</span>
              {data.pendingLeaves.length > 0 && (
                <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-slate-200/70 text-slate-700 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                  {data.pendingLeaves.length}
                </span>
              )}
            </TabsTrigger>
            {data.isAdmin && (
              <TabsTrigger
                value="expenses"
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
              >
                <Receipt className="w-4 h-4" />
                <span>Expense Claims</span>
                {data.pendingExpenses.length > 0 && (
                  <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-slate-200/70 text-slate-700 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                    {data.pendingExpenses.length}
                  </span>
                )}
              </TabsTrigger>
            )}
            {(data.isSuperAdmin || data.user?.role === 'FINANCE_ADMIN' || data.user?.role === 'HR_ADMIN') && (
              <TabsTrigger
                value="payroll"
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
              >
                <Banknote className="w-4 h-4" />
                <span>Payroll Runs</span>
                {data.pendingPayrollRuns.length > 0 && (
                  <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-slate-200/70 text-slate-700 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                    {data.pendingPayrollRuns.length}
                  </span>
                )}
              </TabsTrigger>
            )}
            {data.isSuperAdmin && (
              <TabsTrigger
                value="departments"
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
              >
                <Building2 className="w-4 h-4" />
                <span>Departments</span>
                {data.pendingDepartments.length > 0 && (
                  <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-slate-200/70 text-slate-700 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                    {data.pendingDepartments.length}
                  </span>
                )}
              </TabsTrigger>
            )}
          </TabsList>

          <div className="pt-2">
            <TabsContent value="unified" className="m-0 focus-visible:outline-none">
              <UnifiedReviewsTab
                loading={data.loading}
                totalEmployeeReviewsCount={data.totalEmployeeReviewsCount}
                unifiedEmployeeIds={data.unifiedEmployeeIds}
                pendingDocuments={data.pendingDocuments}
                pendingProfiles={data.pendingProfiles}
                pendingProfileReviews={data.pendingProfileReviews}
                pendingTasksReviews={data.pendingTasksReviews}
                pendingProbationSetups={data.pendingProbationSetups}
                pendingProbationEnds={data.pendingProbationEnds}
                pendingProbations={data.pendingProbations}
                pendingOffboardings={data.pendingOffboardings}
                getEmployeeName={data.getEmployeeName}
                getEmployeeDept={data.getEmployeeDept}
                getEmployeeJobTitle={data.getEmployeeJobTitle}
                onSelectUnifiedEmployee={(id) => setSelectedUnifiedEmployeeId(id)}
                onBeginOffboarding={(id) => {
                  setOffboardTargetId(id);
                  setShowOffboardDialog(true);
                }}
                approveCompletedTasks={data.approveCompletedTasks}
                isApprovingTasks={data.isApprovingTasks}
                approveProbationSetup={data.approveProbationSetup}
                isApprovingProbationSetup={data.isApprovingProbationSetup}
                approveProbationEnd={data.approveProbationEnd}
                isApprovingProbationEnd={data.isApprovingProbationEnd}
                approveProfile={data.approveProfile}
                rejectProfile={data.rejectProfile}
                isApprovingProfile={data.isApprovingProfile}
                profAppVars={data.profAppVars}
                approveProbation={data.approveProbation}
                approveOffboarding={data.approveOffboarding}
                rejectOffboarding={data.rejectOffboarding}
              />
            </TabsContent>

            <TabsContent value="leaves" className="m-0 focus-visible:outline-none">
              <LeaveApprovalsTab
                loading={data.loading}
                pendingLeaves={data.pendingLeaves}
                getEmployeeName={data.getEmployeeName}
                onLeaveAction={setLeaveConfirmState}
                isApprovingLeave={data.isApprovingLeave}
                leaveAppVars={data.leaveAppVars}
              />
            </TabsContent>

            <TabsContent value="expenses" className="m-0 focus-visible:outline-none">
              <ExpenseApprovalsTab
                expenses={data.pendingExpenses}
                onApprove={(id) => data.approveExpense(id)}
                onReject={(payload) => data.rejectExpense(payload)}
                isApproving={data.isApprovingExpense}
                isRejecting={data.isRejectingExpense}
                canReview={data.isAdmin}
              />
            </TabsContent>

            <TabsContent value="payroll" className="m-0 focus-visible:outline-none">
              <PayrollApprovalsTab
                payrollRuns={data.pendingPayrollRuns}
                onApprove={(id) => data.approvePayrollRun(id)}
                isApproving={data.isApprovingPayroll}
                canApprove={data.isSuperAdmin || data.user?.role === 'FINANCE_ADMIN'}
              />
            </TabsContent>

            <TabsContent value="departments" className="m-0 focus-visible:outline-none">
              <DepartmentApprovalsTab
                loading={data.loading}
                pendingDepartments={data.pendingDepartments}
                isAdmin={data.isAdmin}
                onApproveDepartment={(id) => data.approveDepartmentMutation.mutate(id)}
                isApprovingDepartment={data.approveDepartmentMutation.isPending}
              />
            </TabsContent>
          </div>
        </Tabs>
      </motion.div>

      {/* Offboard Dialog */}
      <ApprovalsOffboardDialog
        open={showOffboardDialog}
        onOpenChange={setShowOffboardDialog}
        offboardForm={offboardForm}
        setOffboardForm={setOffboardForm}
        isSubmitting={data.isRequestingOffboarding}
        onSubmit={() => {
          data.requestOffboarding(
            {
              id: offboardTargetId,
              data: {
                exitType: offboardForm.type,
                exitDate: offboardForm.exitDate,
                reason: offboardForm.reason
              }
            },
            {
              onSuccess: () => {
                setShowOffboardDialog(false);
                setOffboardForm({ type: 'RESIGNATION', exitDate: '', reason: '' });
              }
            }
          );
        }}
      />

      {/* Leave Action Dialog */}
      <LeaveActionDialog
        open={!!leaveConfirmState}
        onOpenChange={(open) => !open && setLeaveConfirmState(null)}
        action={leaveConfirmState?.action}
        employeeName={leaveConfirmState ? data.getEmployeeName(leaveConfirmState.leave.employeeId) : ''}
        isPending={data.isApprovingLeave || data.isRejectingLeave}
        onConfirm={(reason) => {
          if (!leaveConfirmState) return;
          const { leave, action } = leaveConfirmState;
          if (action === 'approve') data.approveLeave({ id: leave.id });
          else data.rejectLeave({ id: leave.id, reason, attachmentUrl: '' });
        }}
      />
    </motion.div>
  );
}
