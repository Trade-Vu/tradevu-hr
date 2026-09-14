export const dateKey = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
};

export const calculateWorkingDays = (start, end, holidays = []) => {
  if (!start || !end) return 0;

  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate < startDate) return 0;

  const holidayKeys = new Set(holidays.map((holiday) => dateKey(holiday.date || holiday)));
  const currentDate = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate()));
  const lastDate = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate()));
  let workingDays = 0;

  while (currentDate <= lastDate) {
    const dayOfWeek = currentDate.getUTCDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    if (!isWeekend && !holidayKeys.has(dateKey(currentDate))) workingDays += 1;
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }

  return workingDays;
};
