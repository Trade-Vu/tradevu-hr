import React from "react";
import { useQuery } from "@tanstack/react-query";
import { gqlClient } from "@/api/graphqlClient";
import { gql } from "graphql-request";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Gift, CalendarDays, PartyPopper } from "lucide-react";
import { format } from "date-fns";

const UPCOMING_CELEBRATIONS = gql`
  query UpcomingCelebrations($month: Int!) {
    upcomingCelebrations(month: $month) {
      employeeId
      fullName
      type
      date
      years
    }
  }
`;

export default function CelebrationsWidget() {
  const currentMonth = new Date().getMonth() + 1; // 1-12
  
  const { data: celebrations = [], isLoading } = useQuery({
    queryKey: ['upcoming-celebrations', currentMonth],
    queryFn: async () => {
      const data = await gqlClient.request(UPCOMING_CELEBRATIONS, { month: currentMonth });
      return data.upcomingCelebrations || [];
    }
  });

  if (isLoading) {
    return (
      <Card className="border-slate-200/60 shadow-sm rounded-xl overflow-hidden bg-white">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="text-sm font-semibold flex items-center justify-between text-slate-900">
            <div className="flex items-center gap-2">
              <PartyPopper className="w-4 h-4 text-pink-500" />
              This Month's Celebrations
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100 animate-pulse">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="flex items-center p-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 shrink-0" />
                <div className="ml-3 flex-1 space-y-2">
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                  <div className="h-2 bg-slate-100 rounded w-1/3" />
                </div>
                <div className="ml-3 shrink-0 h-4 bg-slate-100 rounded w-10" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const sortedCelebrations = [...celebrations].sort((a, b) => {
    return new Date(a.date).getDate() - new Date(b.date).getDate();
  });

  return (
    <Card className="border-slate-200/60 bg-gradient-to-b from-white to-pink-50/20 shadow-sm rounded-xl overflow-hidden">
      <CardHeader className="border-b border-slate-100 pb-4">
        <CardTitle className="text-sm font-semibold flex items-center justify-between text-slate-900">
          <div className="flex items-center gap-2">
            <PartyPopper className="w-4 h-4 text-pink-500" />
            This Month's Celebrations
          </div>
          <span className="text-[10px] font-medium tracking-wider uppercase text-slate-400">
            {format(new Date(), 'MMMM')}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {sortedCelebrations.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 bg-pink-50 rounded-xl flex items-center justify-center mb-3">
              <Gift className="w-6 h-6 text-pink-200" />
            </div>
            <p className="text-sm text-slate-500 font-medium">No celebrations this month</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
            {sortedCelebrations.map((event, idx) => {
              const dateObj = new Date(event.date);
              const isBirthday = event.type === 'BIRTHDAY';
              
              return (
                <div key={`${event.employeeId}-${idx}`} className="flex items-center p-4 hover:bg-white transition-colors group">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border transition-colors ${isBirthday ? 'bg-pink-50 border-pink-100 group-hover:border-pink-200 group-hover:bg-pink-100' : 'bg-blue-50 border-blue-100 group-hover:border-blue-200 group-hover:bg-blue-100'}`}>
                    {isBirthday ? (
                      <Gift className="w-4 h-4 text-pink-500" />
                    ) : (
                      <CalendarDays className="w-4 h-4 text-blue-500" />
                    )}
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate group-hover:text-pink-600 transition-colors">
                      {event.fullName}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium mt-0.5">
                      {isBirthday ? 'Birthday' : `${event.years} Year Anniversary`}
                    </p>
                  </div>
                  <div className="ml-3 shrink-0 flex flex-col items-end">
                    <span className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-100 px-2 py-1 rounded-md">
                      {format(dateObj, 'MMM d')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
