import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import OrganizationSetup from "@/pages/OrganizationSetup";
import InviteHRModal from "./InviteHRModal";
import { Link } from "react-router-dom";
import { PAGE_ROUTES } from "@/constants/pageRoutes";
import { useQuery, useMutation } from '@tanstack/react-query';
import { usersApi, employeesApi, organizationsApi } from "@/api";
import { 
  Building2, 
  Users, 
  Settings, 
  CalendarDays, 
  CheckCircle2, 
  Circle, 
  ArrowRight,
  UserPlus,
  FileText,
  Bell
} from "lucide-react";

export default function DashboardEmptyState({ user }) {
  const isCEO = user?.role === 'SUPER_ADMIN';
  console.log({user})
  const firstName = user?.fullName?.split(' ')[0] || '';

  // Use database preferences first, then fallback to localStorage
  const storageKey = `dashboard_completed_steps_${user?.id || 'default'}`;
  const [completedSteps, setCompletedSteps] = useState(() => {
    if (user?.preferences?.dashboard_completed_steps) {
      return user.preferences.dashboard_completed_steps;
    }
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [isOrgSetupOpen, setIsOrgSetupOpen] = useState(false);
  const [isInviteHROpen, setIsInviteHROpen] = useState(false);

  // Dynamically check employees in this organization to see if HR has already onboarded
  const { data: employees = [] } = useQuery({
    queryKey: ['employees', 'empty-state-check'],
    queryFn: async () => {
      try {
        const res = await employeesApi.getEmployees({ limit: 50 });
        return Array.isArray(res) ? res : res?.data || [];
      } catch (err) {
        return [];
      }
    },
  });

  // Dynamically check organization details
  const { data: orgData } = useQuery({
    queryKey: ['organization', 'me'],
    queryFn: async () => {
      try {
        return await organizationsApi.getMyOrganization();
      } catch (err) {
        return null;
      }
    },
  });

  const hasHREmployee = employees.some(
    e => e.role === 'HR_ADMIN' ||
         e.jobTitle?.toLowerCase().includes('hr') ||
         e.jobTitle?.toLowerCase().includes('human resource') ||
         e.departmentId?.name?.toLowerCase().includes('resource') ||
         e.department?.toLowerCase().includes('resource')
  );

  const hasCompletedOrg = Boolean(
    orgData?.setupCompleted ||
    (orgData?.industry && orgData?.companySize && orgData?.country)
  );

  const { mutate: updatePreferences } = useMutation({
    mutationFn: async (preferences) => {
      return usersApi.updateMe({ preferences });
    },
    onError: (err) => console.error("Failed to sync preferences", err)
  });

  const isStepCompleted = (stepId) => {
    if (completedSteps.includes(stepId)) return true;
    if (stepId === 'hr' && hasHREmployee) return true;
    if (stepId === 'org' && hasCompletedOrg) return true;
    return false;
  };

  const toggleStep = (stepId) => {
    setCompletedSteps(prev => {
      const isAlreadyDone = isStepCompleted(stepId);
      const newSteps = isAlreadyDone 
        ? prev.filter(id => id !== stepId)
        : [...prev, stepId];
      try {
        localStorage.setItem(storageKey, JSON.stringify(newSteps));
      } catch (e) {
        console.warn('Failed to save to localStorage', e);
      }
      
      updatePreferences({ dashboard_completed_steps: newSteps });
      
      return newSteps;
    });
  };

  const ceoSteps = [
    { id: 'org', title: 'Complete Organization Profile', description: 'Add your company logo, legal name, and industry details.', icon: Building2, isModal: true },
    { id: 'hr', title: 'Invite your HR Manager', description: 'Onboard your HR head to take over the rest of the setup.', icon: UserPlus, isHRModal: true },
  ];

  const hrSteps = [
    { id: 'prof', title: 'Complete your Profile', description: 'Add your photo and personal details.', icon: Users, link: PAGE_ROUTES.EMPLOYEE_SELF_SERVICE },
    { id: 'invite', title: 'Invite your team members', description: 'Send out invites to the rest of the company.', icon: UserPlus, link: PAGE_ROUTES.EMPLOYEES },
    { id: 'dept', title: 'Define Departments & Roles', description: 'Structure your organization for better reporting.', icon: Settings, link: PAGE_ROUTES.SETTINGS_DEPARTMENTS },
    { id: 'policy', title: 'Review Company Policies', description: 'Familiarize yourself with the existing setup.', icon: FileText, link: PAGE_ROUTES.SETTINGS_STATUTORY },
    { id: 'leave', title: 'Configure Leave Policies', description: 'Set up PTO, sick leave, and holidays.', icon: CalendarDays, link: PAGE_ROUTES.SETTINGS_LEAVE_TYPES },
  ];

  const steps = isCEO ? ceoSteps : hrSteps;
  const completedCount = steps.filter(s => isStepCompleted(s.id)).length;
  const progress = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="max-w-5xl mx-auto space-y-10 duration-700 animate-in fade-in zoom-in-95">
      {/* Premium Welcome Header */}
      <div className="relative rounded-[2rem] p-8 sm:p-10 text-white shadow-2xl overflow-hidden bg-slate-900 border border-slate-800">
        <div className="absolute inset-0 opacity-50 bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 blur-3xl" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-b from-blue-500/30 to-purple-600/30 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 mix-blend-screen" />
        
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 mb-4">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs font-medium text-slate-200">Workspace Ready</span>
          </div>
          <h1 className="mb-4 text-3xl font-bold leading-tight tracking-tight text-transparent sm:text-4xl bg-clip-text bg-gradient-to-r from-white to-slate-300">
            Welcome to Tradevu HR, {firstName}!
          </h1>
          <p className="max-w-xl text-base font-normal leading-relaxed sm:text-lg text-slate-400">
            {isCEO 
              ? "Your unified HR platform is ready. Start by setting up your organization profile and bringing your HR leader aboard."
              : "We're glad you're here. Let's get you familiarized with your new HR workspace and setup the foundation."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Modern Checklist */}
        <Card className="overflow-hidden shadow-xl lg:col-span-2 border-slate-200/60 shadow-slate-200/40 rounded-3xl bg-white/80 backdrop-blur-xl">
          <CardHeader className="p-8 border-b border-slate-100/80 bg-white/50">
            <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
              <div>
                <CardTitle className="text-2xl font-bold text-slate-900">Your Action Items</CardTitle>
                <CardDescription className="mt-2 text-base text-slate-500">
                  Complete these steps to unlock the full potential of your workspace.
                </CardDescription>
              </div>
              <div className="flex items-center gap-4 px-5 py-3 border bg-slate-50 rounded-2xl border-slate-100">
                <div className="relative flex items-center justify-center w-14 h-14">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-200"
                      strokeWidth="3"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-indigo-600 transition-all duration-1000 ease-out"
                      strokeWidth="3"
                      strokeDasharray={`${progress}, 100`}
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="absolute text-sm font-bold text-slate-700">{progress}%</span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-900">Completion</p>
                  <p className="text-xs font-medium text-slate-500">{completedCount} of {steps.length} steps</p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {steps.map((step) => {
                const Icon = step.icon;
                const isCompleted = isStepCompleted(step.id);
                return (
                  <div 
                    key={step.id} 
                    className="relative flex items-start gap-5 p-6 transition-all duration-300 border-l-4 border-transparent hover:bg-slate-50/80 group hover:border-indigo-500"
                  >
                    <button 
                      onClick={() => toggleStep(step.id)}
                      className="flex-shrink-0 mt-1 transition-transform focus:outline-none active:scale-95"
                    >
                      {isCompleted ? (
                         <div className="flex items-center justify-center w-8 h-8 text-green-600 bg-green-100 rounded-full shadow-sm">
                           <CheckCircle2 className="w-5 h-5" />
                         </div>
                      ) : (
                        <div className="flex items-center justify-center w-8 h-8 transition-colors border-2 rounded-full border-slate-200 text-slate-300 group-hover:border-indigo-200 group-hover:text-indigo-400">
                          <Circle className="w-4 h-4 opacity-0" />
                        </div>
                      )}
                    </button>
                    <div className="flex-1">
                      <h3 className={`text-lg font-semibold transition-colors ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-900 group-hover:text-indigo-900'}`}>
                        {step.title}
                      </h3>
                      <p className={`mt-1.5 transition-colors ${isCompleted ? 'text-slate-400' : 'text-slate-500'}`}>{step.description}</p>
                    </div>
                    {!isCompleted && (
                      step.isModal ? (
                        <Dialog open={isOrgSetupOpen} onOpenChange={setIsOrgSetupOpen}>
                          <DialogTrigger asChild>
                            <Button variant="secondary" className="hidden px-6 transition-all duration-300 translate-x-2 bg-white border shadow-sm opacity-0 sm:flex hover:bg-slate-50 text-slate-700 border-slate-200 rounded-xl group-hover:opacity-100 group-hover:translate-x-0">
                              Take Action <ArrowRight className="w-4 h-4 ml-2 text-indigo-500" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl p-0 border-0 bg-transparent shadow-none [&>button]:hidden overflow-visible" hideCloseButton={true}>
                            <DialogTitle className="sr-only">Organization Setup</DialogTitle>
                            <div className="flex w-full items-center justify-center max-h-[95vh] overflow-y-auto px-2 py-4">
                              <OrganizationSetup asModal={true} onComplete={() => {
                                setIsOrgSetupOpen(false);
                                toggleStep(step.id);
                              }} />
                            </div>
                          </DialogContent>
                        </Dialog>
                      ) : step.isHRModal ? (
                        <Button 
                          onClick={() => setIsInviteHROpen(true)}
                          variant="secondary" 
                          className="hidden px-6 transition-all duration-300 translate-x-2 bg-white border shadow-sm opacity-0 sm:flex hover:bg-slate-50 text-slate-700 border-slate-200 rounded-xl group-hover:opacity-100 group-hover:translate-x-0"
                        >
                          Take Action <ArrowRight className="w-4 h-4 ml-2 text-indigo-500" />
                        </Button>
                      ) : (
                        <Button asChild variant="secondary" className="hidden px-6 transition-all duration-300 translate-x-2 bg-white border shadow-sm opacity-0 sm:flex hover:bg-slate-50 text-slate-700 border-slate-200 rounded-xl group-hover:opacity-100 group-hover:translate-x-0">
                          <Link to={step.link}>
                            Take Action <ArrowRight className="w-4 h-4 ml-2 text-indigo-500" />
                          </Link>
                        </Button>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="space-y-6">
          <h3 className="px-1 mb-6 text-xl font-bold text-slate-900">Fast Actions</h3>
          
          <Link to={PAGE_ROUTES.EMPLOYEES} className="block">
            <Card className="relative overflow-hidden transition-all duration-300 border-0 shadow-lg shadow-indigo-100/50 hover:shadow-xl hover:shadow-indigo-200/60 group rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 hover:-translate-y-1">
              <div className="absolute inset-0 bg-white/5 mix-blend-overlay"></div>
              <div className="absolute top-0 right-0 w-32 h-32 translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-2xl" />
              <CardContent className="relative z-10 flex flex-col gap-4 p-8">
                <div className="flex items-center justify-center text-white transition-transform duration-300 border shadow-inner w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border-white/20 group-hover:scale-110">
                  <UserPlus className="w-7 h-7" />
                </div>
                <div className="mt-2">
                  <h4 className="mb-1 text-xl font-bold text-white">
                    Invite Team Member
                  </h4>
                  <p className="font-medium text-indigo-100">Send secure access instantly.</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to={PAGE_ROUTES.SETTINGS} className="block">
            <Card className="relative overflow-hidden transition-all duration-300 bg-white border shadow-md border-slate-200/60 hover:shadow-lg group rounded-3xl hover:-translate-y-1">
              <CardContent className="relative z-10 flex flex-col gap-4 p-8">
                <div className="flex items-center justify-center transition-all duration-300 border w-14 h-14 rounded-2xl bg-slate-50 text-slate-600 border-slate-100 group-hover:scale-110 group-hover:bg-slate-100 group-hover:text-slate-900">
                  <Settings className="w-7 h-7" />
                </div>
                <div className="mt-2">
                  <h4 className="mb-1 text-xl font-bold text-slate-900">Workspace Settings</h4>
                  <p className="font-medium text-slate-500">Configure roles & preferences.</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
      <InviteHRModal 
        open={isInviteHROpen} 
        onOpenChange={setIsInviteHROpen} 
        onSuccess={() => toggleStep('hr')}
      />
    </div>
  );
}
