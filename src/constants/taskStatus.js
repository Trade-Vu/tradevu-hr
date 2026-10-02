export const TASK_STATUSES = {
  BACKLOG: 'backlog',
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  REVIEW: 'review',
  DONE: 'done',
};

export const TASK_STATUS_CONFIG = {
  [TASK_STATUSES.BACKLOG]: { title: 'Backlog', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  [TASK_STATUSES.TODO]: { title: 'To Do', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  [TASK_STATUSES.IN_PROGRESS]: { title: 'In Progress', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  [TASK_STATUSES.REVIEW]: { title: 'Review', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  [TASK_STATUSES.DONE]: { title: 'Done', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

export const normalizeTaskStatus = (status, isCompleted = false) => {
  if (isCompleted) return TASK_STATUSES.DONE;
  if (!status) return TASK_STATUSES.TODO;
  const s = String(status).toLowerCase().replace(/[\s-]+/g, '_').trim();
  if (['completed', 'done', 'approved', 'verified'].includes(s)) return TASK_STATUSES.DONE;
  if (['in_progress', 'progress'].includes(s)) return TASK_STATUSES.IN_PROGRESS;
  if (['review', 'in_review', 'under_review'].includes(s)) return TASK_STATUSES.REVIEW;
  if (['backlog'].includes(s)) return TASK_STATUSES.BACKLOG;
  if (['pending', 'not_started', 'todo', 'open'].includes(s)) return TASK_STATUSES.TODO;
  return TASK_STATUSES.TODO;
};
