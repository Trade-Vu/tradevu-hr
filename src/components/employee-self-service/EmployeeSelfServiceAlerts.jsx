import React from 'react';
import { CheckCircle, Send, PartyPopper, Info, X } from 'lucide-react';
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
  notifications = [],
  onDismissNotification,
}) {
  return (
    <div className="space-y-4">
      {notifications.map((notification) => {
        const isPromotion = notification.type === 'PROMOTION';
        return (
          <div
            key={notification.id}
            className={`flex items-start justify-between gap-4 p-5 border shadow-sm rounded-2xl ${isPromotion ? 'border-purple-200 bg-purple-50/90 text-purple-900' : 'border-blue-200 bg-blue-50/90 text-blue-900'}`}
          >
            <div className="flex items-start gap-3">
              {isPromotion ? <PartyPopper className="w-5 h-5 mt-0.5 shrink-0" /> : <Info className="w-5 h-5 mt-0.5 shrink-0" />}
              <div>
                <h3 className="text-lg font-semibold">{notification.title}</h3>
                <p className={`mt-1 text-sm ${isPromotion ? 'text-purple-700' : 'text-blue-700'}`}>{notification.message}</p>
              </div>
            </div>
            <button
              type="button"
              className="p-1 rounded-full shrink-0 hover:bg-black/5"
              onClick={() => onDismissNotification?.(notification.id)}
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
      {!hideBanner && pendingTasksCount > 0 && (
        <div className="sticky top-0 z-[100] flex flex-col items-center justify-between px-4 py-5 text-base border shadow-sm rounded-2xl bg-slate-100 border-slate-300 text-slate-800 xl:flex-row md:px-8">
          <div className="flex-1 pr-4 mb-3 font-medium xl:mb-0">
            You have {pendingTasksCount} pending onboarding {pendingTasksCount === 1 ? 'task' : 'tasks'} to complete.
            <button type="button" className="ml-2 font-semibold text-blue-700 hover:underline" onClick={onViewTasks}>View task list</button>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium whitespace-nowrap">
            <button type="button" className="px-4 py-2 transition-colors rounded text-slate-600 hover:bg-slate-200 hover:text-slate-900" onClick={onRemindLater}>Remind me later</button>
            <button type="button" className="px-4 py-2 transition-colors bg-transparent border rounded border-slate-300 text-slate-800 hover:bg-slate-200" onClick={onViewTasks}>Only view tasks</button>
            <button type="button" className="px-4 py-2 transition-colors bg-white border rounded shadow-sm border-slate-300 text-slate-800 hover:bg-slate-50 disabled:opacity-50" onClick={onCompleteAll} disabled={isCompletingTasks}>
              {isCompletingTasks ? 'Completing...' : 'Accept & Complete all'}
            </button>
          </div>
        </div>
      )}

      {isDraft && (
        <div className="flex flex-col items-start justify-between gap-4 p-5 border shadow-sm rounded-2xl border-amber-200 bg-amber-50/90 text-amber-900 sm:flex-row sm:items-center">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-amber-500" />
              {hasBeenRejected ? 'Action Required: Profile Revisions Requested' : 'Action Required: Complete & Submit Profile'}
            </h3>
            {hasBeenRejected && <p className="p-3 mt-2 text-sm border rounded-xl border-amber-200 bg-white/80 text-amber-800">{rejectionReason || 'Please review and update your information.'}</p>}
            <p className="mt-2 text-sm text-amber-700">Complete your personal details and submit your profile for review.</p>
          </div>
          <Button className="font-medium text-white shrink-0 bg-amber-600 hover:bg-amber-700" onClick={onSubmitForReview} disabled={isSubmittingProfile}>
            <Send className="w-4 h-4 mr-2" />
            {isSubmittingProfile ? 'Submitting...' : 'Submit for Review'}
          </Button>
        </div>
      )}

      {isPendingApproval && (
        <div className="p-5 text-blue-900 border border-blue-200 shadow-sm rounded-2xl bg-blue-50/90">
          <h3 className="flex items-center gap-2 text-lg font-semibold"><span className="h-2.5 w-2.5 animate-pulse rounded-full bg-blue-500" />Profile Submitted & In Review</h3>
          <p className="mt-1 text-sm text-blue-800">Your profile is awaiting CEO or HR Admin approval.</p>
        </div>
      )}

      {hasOnboardingTasks && (
        <div className="flex flex-col items-start justify-between gap-4 p-5 text-indigo-800 border shadow-sm rounded-2xl border-indigo-200/60 bg-indigo-50/80 sm:flex-row sm:items-center">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold text-indigo-950"><span className="h-2.5 w-2.5 animate-pulse rounded-full bg-indigo-500" />Action Required: Onboarding Tasks ({pendingTasksCount} pending)</h3>
            <p className="mt-1 text-sm text-indigo-700">Review and complete your assigned onboarding tasks.</p>
          </div>
          <Button className="font-medium text-white bg-indigo-600 shrink-0 hover:bg-indigo-700" onClick={onOpenOnboarding}><CheckCircle className="w-4 h-4 mr-2" />View Tasks Checklist</Button>
        </div>
      )}
    </div>
  );
}
