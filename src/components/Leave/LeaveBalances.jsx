import React from 'react';
import { Calendar } from 'lucide-react';
import { PAGE_ROUTES } from '@/constants/pageRoutes';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function LeaveBalances({ leaveBalances, leaveTypes, isAdmin }) {
    if (leaveBalances.length === 0 && leaveTypes.length === 0) {
    return (
      <Card className="border-slate-200">
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <Calendar className="w-12 h-12 mb-4 text-slate-300" />
          <p className="text-lg font-medium text-slate-700">No Leave Types Configured</p>
          <p className="max-w-md mx-auto mt-2 text-sm text-slate-500">
            {isAdmin
              ? "You haven't defined any leave types for your organization yet. Leave balances cannot be initialized until leave types are created."
              : "Your organization hasn't configured leave policies yet."}
          </p>
          {isAdmin && (
            <Button variant="outline" className="mt-6" onClick={() => { window.location.href = PAGE_ROUTES.SETTINGS; }}>
              Configure Leave Types in Settings
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {leaveBalances.length > 0
        ? leaveBalances.map((balance) => {
            const type = leaveTypes.find((leaveType) => leaveType.id === balance.leaveTypeId) || {
              name: "Unknown",
            };
            return (
              <Card key={balance.id} className="border-slate-200">
                <CardContent className="flex flex-col items-center justify-center p-4 text-center">
                  <p className="text-sm font-medium uppercase text-slate-500">{type.name}</p>
                  <p className="my-2 text-3xl font-bold text-blue-600">{balance.available}</p>
                  <p className="text-xs text-slate-400">
                    Entitlement: {balance.totalEntitled} | Used: {balance.used} | Pending:{" "}
                    {balance.pending}
                  </p>
                </CardContent>
              </Card>
            );
          })
        : leaveTypes.map((type) => (
            <Card key={type.id} className="border-slate-200">
              <CardContent className="flex flex-col items-center justify-center p-4 text-center">
                <p className="text-sm font-medium uppercase text-slate-500">{type.name}</p>
                <p className="my-2 text-3xl font-bold text-slate-400">{type?.defaultDays}</p>
                <p className="text-xs text-slate-400">{type?.code ?? "Balance not initialized"}</p>
              </CardContent>
            </Card>
          ))}
    </div>
  );
}
