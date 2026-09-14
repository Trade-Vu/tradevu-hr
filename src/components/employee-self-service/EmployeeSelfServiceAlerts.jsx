import React from 'react';
import { CheckCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function EmployeeSelfServiceAlerts({
  pendingTasksCount,
  hideBanner,
  isDraft,
  hasBeenRejected,
  rejectionReason,
  isPendingApproval,
  hasOnboardingTasks,
  isSubmittingProfile,
  isCompletingTasks,
  onRemindLater,
  onViewTasks,
  onCompleteAll,
  onSubmitForReview,
  onOpenOnboarding,
}) {
  return (
    <>
      {!hideBanner && pendingTasksCount > 0 && (
        <>
          <div className="absolute top-0 left-0 right-0 z-50 flex flex-col items-center justify-between px-4 py-5 text-base shadow-sm bg-slate-100 border-b border-slate-300 text-slate-800 xl:flex-row md:px-8">
            <div className="flex-1 pr-4 mb-3 font-medium xl:mb-0">
              You have {pendingTasksCount} pending onboarding {pendingTasksCount === 1 ? 'task' : 'tasks'} to complete.
              <button type="button" className="ml-2 font-semibold text-blue-700 hover:underline" onClick={onViewTasks}>View task list</button>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium whitespace-nowrap">
              <button type="button" className="rounded px-4 py-2 text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-900" onClick={onRemindLater}>Remind me later</button>
              <button type="button" className="rounded border border-slate-300 bg-transparent px-4 py-2 text-slate-800 transition-colors hover:bg-slate-200" onClick={onViewTasks}>Only view tasks</button>
              <button type="button" className="rounded border border-slate-300 bg-white px-4 py-2 text-slate-800 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50" onClick={onCompleteAll} disabled={isCompletingTasks}>
                {isCompletingTasks ? 'Completing...' : 'Accept & Complete all'}
              </button>
            </div>
          </div>
          <div className="h-28 w-full xl:h-20" />
        </>
      )}

      {isDraft && (
        <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50/90 p-5 text-amber-900 shadow-sm sm:flex-row sm:items-center">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-amber-500" />
              {hasBeenRejected ? 'Action Required: Profile Revisions Requested' : 'Action Required: Complete & Submit Profile'}
            </h3>
            {hasBeenRejected && <p className="mt-2 rounded-xl border border-amber-200 bg-white/80 p-3 text-sm text-amber-800">{rejectionReason || 'Please review and update your information.'}</p>}
            <p className="mt-2 text-sm text-amber-700">Complete your personal details and submit your profile for review.</p>
          </div>
          <Button className="shrink-0 bg-amber-600 font-medium text-white hover:bg-amber-700" onClick={onSubmitForReview} disabled={isSubmittingProfile}>
            <Send className="mr-2 h-4 w-4" />
            {isSubmittingProfile ? 'Submitting...' : 'Submit for Review'}
          </Button>
        </div>
      )}

      {isPendingApproval && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50/90 p-5 text-blue-900 shadow-sm">
          <h3 className="flex items-center gap-2 text-lg font-semibold"><span className="h-2.5 w-2.5 animate-pulse rounded-full bg-blue-500" />Profile Submitted & In Review</h3>
          <p className="mt-1 text-sm text-blue-800">Your profile is awaiting CEO or HR Admin approval.</p>
        </div>
      )}

      {hasOnboardingTasks && (
        <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-indigo-200/60 bg-indigo-50/80 p-5 text-indigo-800 shadow-sm sm:flex-row sm:items-center">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold text-indigo-950"><span className="h-2.5 w-2.5 animate-pulse rounded-full bg-indigo-500" />Action Required: Onboarding Tasks ({pendingTasksCount} pending)</h3>
            <p className="mt-1 text-sm text-indigo-700">Review and complete your assigned onboarding tasks.</p>
          </div>
          <Button className="shrink-0 bg-indigo-600 font-medium text-white hover:bg-indigo-700" onClick={onOpenOnboarding}><CheckCircle className="mr-2 h-4 w-4" />View Tasks Checklist</Button>
        </div>
      )}
    </>
  );
}
