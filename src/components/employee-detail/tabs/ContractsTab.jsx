import React from "react";
import { FileText, Clock, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatLeaveStatus, getLeaveStatusBadgeClass } from "@/lib/leaveStatus";
import { PremiumField, format } from "../employeeDetailUtils";

export default function ContractsTab({
  employee,
  isEditing,
  editData,
  setEditData,
  shifts = [],
  employeeLeaveBalances = [],
  leaveTypes = [],
  leaveRequests = [],
}) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-900">Contract Details</h3>
      {isEditing ? (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Contract Type</Label>
            <Select
              value={editData.contract_details?.contract_type || ''}
              onValueChange={(value) => setEditData(prev => ({
                ...prev,
                contract_details: { ...prev.contract_details, contract_type: value }
              }))}
            >
              <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="indefinite">Indefinite</SelectItem>
                <SelectItem value="fixed_term">Fixed Term</SelectItem>
                <SelectItem value="probation">Probation</SelectItem>
                <SelectItem value="internship">Internship</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Assigned Shift</Label>
            <Select
              value={editData.work_schedule?.shift_id || ''}
              onValueChange={(value) => setEditData(prev => ({
                ...prev,
                work_schedule: { ...prev.work_schedule, shift_id: value }
              }))}
            >
              <SelectTrigger><SelectValue placeholder="Select shift" /></SelectTrigger>
              <SelectContent>
                {shifts.map(shift => (
                  <SelectItem key={shift.id} value={shift.id}>
                    {shift.shift_name} ({shift.start_time} - {shift.end_time})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Contract Start Date</Label>
            <Input
              type="date"
              value={editData.contract_details?.contract_start_date || ''}
              onChange={(e) => setEditData(prev => ({
                ...prev,
                contract_details: { ...prev.contract_details, contract_start_date: e.target.value }
              }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Contract End Date</Label>
            <Input
              type="date"
              value={editData.contract_details?.contract_end_date || ''}
              onChange={(e) => setEditData(prev => ({
                ...prev,
                contract_details: { ...prev.contract_details, contract_end_date: e.target.value }
              }))}
            />
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <PremiumField icon={FileText} label="Contract Type" value={employee.contract_details?.contract_type || 'Not set'} />
          <PremiumField icon={Clock} label="Assigned Shift" value={shifts.find(s => s.id === employee.work_schedule?.shift_id)?.shift_name || 'Not assigned'} />
          <PremiumField icon={Calendar} label="Contract Start" value={employee.contract_details?.contract_start_date ? format(new Date(employee.contract_details.contract_start_date), 'MMM dd, yyyy') : 'Not set'} />
          <PremiumField icon={Calendar} label="Contract End" value={employee.contract_details?.contract_end_date ? format(new Date(employee.contract_details.contract_end_date), 'MMM dd, yyyy') : 'Not set'} />
        </div>
      )}

      <div className="pt-6 border-t">
        <h3 className="text-lg font-semibold text-slate-900">Leave Balance</h3>
        {(() => {
          const rows = employeeLeaveBalances.length > 0
            ? employeeLeaveBalances.map(balance => ({
              key: balance.leaveTypeId,
              name: balance.leaveType,
              total: balance.total,
              used: balance.used,
              remaining: balance.remaining,
            }))
            : leaveTypes.map(type => ({ key: type.id, name: type.name, total: 0, used: 0, remaining: 0 }));
          const colors = [
            { bg: 'bg-blue-50', text: 'text-blue-700' },
            { bg: 'bg-green-50', text: 'text-green-700' },
            { bg: 'bg-purple-50', text: 'text-purple-700' },
            { bg: 'bg-amber-50', text: 'text-amber-700' },
            { bg: 'bg-rose-50', text: 'text-rose-700' },
            { bg: 'bg-cyan-50', text: 'text-cyan-700' },
          ];
          if (rows.length === 0) {
            return <p className="mt-3 text-sm text-slate-500">No leave types configured for this organization.</p>;
          }
          return (
            <div className="grid gap-6 mt-4 md:grid-cols-3">
              {rows.map((row, index) => {
                const color = colors[index % colors.length];
                return (
                  <div key={row.key} className={`p-6 rounded-xl text-center ${color.bg}`}>
                    <p className={`text-3xl font-bold ${color.text}`}>{row.remaining}</p>
                    <p className="mt-2 text-sm text-slate-600">{row.name}</p>
                    <p className="text-xs text-slate-500">
                      {row.used} used of {row.total}
                    </p>
                  </div>
                );
              })}
            </div>
          );
        })()}

        <div className="pt-6">
          <h4 className="mb-3 font-semibold text-slate-900">Leave History</h4>
          {leaveRequests.length === 0 ? (
            <div className="py-8 text-center">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500">No leave requests</p>
            </div>
          ) : (
            <div className="space-y-3">
              {leaveRequests.map(leave => (
                <div key={leave.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-50">
                  <div>
                    <p className="font-medium text-slate-900">{leave.leave_type?.replace('_', ' ')}</p>
                    <p className="text-sm text-slate-500">
                      {format(new Date(leave.start_date), 'MMM d')} - {format(new Date(leave.end_date), 'MMM d, yyyy')} ({leave.total_days} days)
                    </p>
                  </div>
                  <Badge className={getLeaveStatusBadgeClass(leave.status)}>
                    {formatLeaveStatus(leave.status)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
