import React from "react";
import countryList from 'country-list';
import { Mail, Phone, Calendar, User, Shield, MessageSquare, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toTitleCase } from "@/lib/utils";
import OnboardingProgressWidget from "../OnboardingProgressWidget";
import { PremiumField, format } from "../employeeDetailUtils";

export default function PersonalTab({
  employee,
  employeeId,
  isEditing,
  editData,
  setEditData,
  onNavigateToJobWithStatus,
  onSendEmail,
  onSendSMS,
  onSendWhatsApp,
}) {
  return (
    <div className="space-y-6">
      <OnboardingProgressWidget
        employeeId={employeeId}
        employee={employee}
        onCompleteAction={() => onNavigateToJobWithStatus('PROBATION')}
        onSetToActive={() => onNavigateToJobWithStatus('ACTIVE')}
        onBeginOffboarding={() => onNavigateToJobWithStatus('OFFBOARDED')}
      />
      <div>
        <h3 className="mb-5 text-lg font-semibold text-slate-900">About</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {isEditing ? (
            <>
              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <Input
                  type="date"
                  value={editData.personal_info?.date_of_birth || ''}
                  onChange={(e) => setEditData(prev => ({
                    ...prev,
                    personal_info: { ...prev.personal_info, date_of_birth: e.target.value }
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select
                  value={(editData.personal_info?.gender || '').toLowerCase()}
                  onValueChange={(value) => setEditData(prev => ({
                    ...prev,
                    personal_info: { ...prev.personal_info, gender: value }
                  }))}
                >
                  <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Nationality</Label>
                <Select
                  value={editData.personal_info?.nationality || ''}
                  onValueChange={(value) => setEditData(prev => ({
                    ...prev,
                    personal_info: { ...prev.personal_info, nationality: value }
                  }))}
                >
                  <SelectTrigger><SelectValue placeholder="Select nationality" /></SelectTrigger>
                  <SelectContent>
                    {countryList.getNames().map(country => (
                      <SelectItem key={country} value={country}>{country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Marital Status</Label>
                <Select
                  value={(editData.personal_info?.marital_status || '').toLowerCase()}
                  onValueChange={(value) => setEditData(prev => ({
                    ...prev,
                    personal_info: { ...prev.personal_info, marital_status: value }
                  }))}
                >
                  <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="married">Married</SelectItem>
                    <SelectItem value="divorced">Divorced</SelectItem>
                    <SelectItem value="widowed">Widowed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>National ID Number</Label>
                <Input
                  value={editData.personal_info?.national_id || ''}
                  onChange={(e) => setEditData(prev => ({
                    ...prev,
                    personal_info: { ...prev.personal_info, national_id: e.target.value }
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Iqama Number</Label>
                <Input
                  value={editData.personal_info?.iqama_number || ''}
                  onChange={(e) => setEditData(prev => ({
                    ...prev,
                    personal_info: { ...prev.personal_info, iqama_number: e.target.value }
                  }))}
                />
              </div>
            </>
          ) : (
            <>
              <PremiumField icon={Calendar} label="Birthday" value={employee.personal_info?.date_of_birth ? format(new Date(employee.personal_info.date_of_birth), 'dd MMM yyyy') : 'Not set'} />
              <PremiumField icon={User} label="Gender" value={toTitleCase(employee.personal_info?.gender) || 'Not set'} />
              <PremiumField icon={User} label="Nationality" value={employee.personal_info?.nationality || 'Not set'} />
              <PremiumField icon={User} label="Marital Status" value={toTitleCase(employee.personal_info?.marital_status) || 'Not set'} />
              <PremiumField icon={Shield} label="National ID Number" value={employee.personal_info?.national_id || 'Not set'} />
              <PremiumField icon={Shield} label="Iqama Number" value={employee.personal_info?.iqama_number || 'Not set'} />
            </>
          )}
        </div>
      </div>

      <div className="pt-8 border-t border-slate-100">
        <h3 className="mb-5 text-lg font-semibold text-slate-900">Contact</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <PremiumField
            icon={Mail}
            label="Work Email"
            value={employee.email}
            action={
              <Button size="icon" variant="ghost" className="w-8 h-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50" onClick={() => onSendEmail(employee.email, 'work')}>
                <Mail className="w-4 h-4" />
              </Button>
            }
          />

          {isEditing ? (
            <div className="col-span-1 space-y-2 md:col-span-2">
              <Label>Private Email</Label>
              <Input
                type="email"
                value={editData.private_email || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, private_email: e.target.value }))}
                placeholder="personal@email.com"
              />
            </div>
          ) : employee.private_email ? (
            <PremiumField
              icon={Mail}
              label="Private Email"
              value={employee.private_email}
              action={
                <Button size="icon" variant="ghost" className="w-8 h-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50" onClick={() => onSendEmail(employee.private_email, 'private')}>
                  <Mail className="w-4 h-4" />
                </Button>
              }
            />
          ) : null}

          <PremiumField
            icon={Phone}
            label="Mobile No."
            value={employee.phone || 'Not set'}
            action={
              employee.phone && (
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="w-8 h-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50" onClick={() => onSendSMS(employee.phone)} title="Send SMS">
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="w-8 h-8 text-slate-400 hover:text-green-600 hover:bg-green-50" onClick={() => onSendWhatsApp(employee.phone)} title="Send WhatsApp">
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                </div>
              )
            }
          />
        </div>
      </div>
    </div>
  );
}
