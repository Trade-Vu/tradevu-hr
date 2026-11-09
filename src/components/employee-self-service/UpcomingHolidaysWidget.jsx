import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { leaveApi } from '@/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CalendarHeart, Calendar, ChevronRight } from 'lucide-react';
import { format, differenceInCalendarDays, isAfter, isToday, startOfDay } from 'date-fns';
import { Link } from 'react-router-dom';
import { PAGE_ROUTES } from '@/constants/pageRoutes';

export default function UpcomingHolidaysWidget() {
  const { data: holidays = [], isLoading } = useQuery({
    queryKey: ['leave-holidays'],
    queryFn: async () => {
      try {
        const res = await leaveApi.getPublicHolidays();
        return Array.isArray(res) ? res : res?.data || [];
      } catch (err) {
        return [];
      }
    },
  });

  const today = startOfDay(new Date());

  const upcomingHolidays = holidays
    .filter((h) => {
      if (!h.date) return false;
      const hDate = startOfDay(new Date(h.date));
      return isAfter(hDate, today) || isToday(hDate);
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3);

  return (
    <Card className="border-slate-200/70 shadow-sm rounded-xl overflow-hidden bg-white">
      <CardHeader className="p-4 sm:p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-900 font-heading">
          <CalendarHeart className="w-4 h-4 text-emerald-600" />
          <span>Upcoming Holidays</span>
          {upcomingHolidays.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              {upcomingHolidays.length}
            </span>
          )}
        </CardTitle>
        <Link
          to={PAGE_ROUTES.LEAVE_MANAGEMENT}
          className="text-xs text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-0.5 font-medium"
        >
          Calendar <ChevronRight className="w-3 h-3" />
        </Link>
      </CardHeader>

      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-4 space-y-3 animate-pulse">
            {[1, 2].map((i) => (
              <div key={i} className="h-10 bg-slate-100 rounded-lg" />
            ))}
          </div>
        ) : upcomingHolidays.length === 0 ? (
          <div className="p-5 text-center flex flex-col items-center justify-center text-slate-500">
            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-1.5">
              <Calendar className="w-4 h-4" />
            </div>
            <p className="text-xs font-medium text-slate-700">No Upcoming Holidays</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Check back later for company holiday announcements.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {upcomingHolidays.map((holiday) => {
              const hDate = new Date(holiday.date);
              const daysLeft = differenceInCalendarDays(hDate, today);
              const dayTag = daysLeft === 0 ? 'Today' : daysLeft === 1 ? 'Tomorrow' : `In ${daysLeft} days`;

              return (
                <div key={holiday.id || holiday._id} className="p-3.5 px-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex flex-col items-center justify-center shrink-0">
                      <span className="text-[10px] font-semibold uppercase leading-none">
                        {format(hDate, 'MMM')}
                      </span>
                      <span className="text-xs font-bold leading-tight mt-0.5">
                        {format(hDate, 'd')}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        {holiday.name}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {format(hDate, 'EEEE, yyyy')}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${
                    daysLeft <= 3
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}>
                    {dayTag}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

