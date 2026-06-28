import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import OrganizationSetup from "@/pages/OrganizationSetup";
import { Link } from "react-router-dom";
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
  const isCEO = user?.role === 'super_admin';
  const firstName = user?.full_name?.split(' ')[0] || 'there';

  // We use local state for this mockup, but normally we'd pull these from the backend
  const [completedSteps, setCompletedSteps] = useState([]);
  const [isOrgSetupOpen, setIsOrgSetupOpen] = useState(false);

  const toggleStep = (stepId) => {
    setCompletedSteps(prev => 
      prev.includes(stepId) 
        ? prev.filter(id => id !== stepId)
        : [...prev, stepId]
    );
  };

  const ceoSteps = [
    { id: 'org', title: 'Complete Organization Profile', description: 'Add your company logo, legal name, and industry details.', icon: Building2, isModal: true },
    { id: 'hr', title: 'Invite your HR Manager', description: 'Onboard your HR head to take over the rest of the setup.', icon: UserPlus, link: '/employees' },
  ];

  const hrSteps = [
    { id: 'prof', title: 'Complete your Profile', description: 'Add your photo and personal details.', icon: Users, link: '/profile' },
    { id: 'invite', title: 'Invite your team members', description: 'Send out invites to the rest of the company.', icon: UserPlus, link: '/employees' },
    { id: 'dept', title: 'Define Departments & Roles', description: 'Structure your organization for better reporting.', icon: Settings, link: '/settingsdepartments' },
    { id: 'policy', title: 'Review Company Policies', description: 'Familiarize yourself with the existing setup.', icon: FileText, link: '/settingsstatutory' },
    { id: 'leave', title: 'Configure Leave Policies', description: 'Set up PTO, sick leave, and holidays.', icon: CalendarDays, link: '/settingsleavetypes' },
  ];

  const steps = isCEO ? ceoSteps : hrSteps;
  const progress = Math.round((completedSteps.length / steps.length) * 100);

  return (
    <div className="space-y-10 animate-in fade-in zoom-in-95 duration-700 max-w-5xl mx-auto">
      {/* Premium Welcome Header */}
      <div className="relative rounded-[2rem] p-8 sm:p-10 text-white shadow-2xl overflow-hidden bg-slate-900 border border-slate-800">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 opacity-50 blur-3xl" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-b from-blue-500/30 to-purple-600/30 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 mix-blend-screen" />
        
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 mb-4">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-medium text-slate-200">Workspace Ready</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4 tracking-tight leading-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">
            Welcome to TradeVu HR, {firstName}!
          </h1>
          <p className="text-base sm:text-lg text-slate-400 font-normal leading-relaxed max-w-xl">
            {isCEO 
              ? "Your unified HR platform is ready. Start by setting up your organization profile and bringing your HR leader aboard."
              : "We're glad you're here. Let's get you familiarized with your new HR workspace and setup the foundation."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Modern Checklist */}
        <Card className="lg:col-span-2 border-slate-200/60 shadow-xl shadow-slate-200/40 rounded-3xl overflow-hidden bg-white/80 backdrop-blur-xl">
          <CardHeader className="p-8 border-b border-slate-100/80 bg-white/50">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <div>
                <CardTitle className="text-2xl font-bold text-slate-900">Your Action Items</CardTitle>
                <CardDescription className="text-base mt-2 text-slate-500">
                  Complete these steps to unlock the full potential of your workspace.
                </CardDescription>
              </div>
              <div className="flex items-center gap-4 bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100">
                <div className="relative w-14 h-14 flex items-center justify-center">
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
                  <p className="text-xs text-slate-500 font-medium">{completedSteps.length} of {steps.length} steps</p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {steps.map((step) => {
                const Icon = step.icon;
                const isCompleted = completedSteps.includes(step.id);
                return (
                  <div 
                    key={step.id} 
                    className="p-6 flex items-start gap-5 hover:bg-slate-50/80 transition-all duration-300 group relative border-l-4 border-transparent hover:border-indigo-500"
                  >
                    <button 
                      onClick={() => toggleStep(step.id)}
                      className="mt-1 flex-shrink-0 focus:outline-none transition-transform active:scale-95"
                    >
                      {isCompleted ? (
                         <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 shadow-sm">
                           <CheckCircle2 className="w-5 h-5" />
                         </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full border-2 border-slate-200 flex items-center justify-center text-slate-300 group-hover:border-indigo-200 group-hover:text-indigo-400 transition-colors">
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
                            <Button variant="secondary" className="hidden sm:flex bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm rounded-xl px-6 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                              Take Action <ArrowRight className="w-4 h-4 ml-2 text-indigo-500" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl p-0 border-0 bg-transparent shadow-none [&>button]:hidden overflow-visible" hideCloseButton={true}>
                            <div className="flex w-full items-center justify-center max-h-[95vh] overflow-y-auto px-2 py-4">
                              <OrganizationSetup asModal={true} onComplete={() => {
                                setIsOrgSetupOpen(false);
                                toggleStep(step.id);
                              }} />
                            </div>
                          </DialogContent>
                        </Dialog>
                      ) : (
                        <Button asChild variant="secondary" className="hidden sm:flex bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm rounded-xl px-6 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
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
          <h3 className="font-bold text-xl text-slate-900 px-1 mb-6">Fast Actions</h3>
          
          <Link to="/employees" className="block">
            <Card className="border-0 shadow-lg shadow-indigo-100/50 hover:shadow-xl hover:shadow-indigo-200/60 transition-all duration-300 group overflow-hidden relative rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 hover:-translate-y-1">
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
              <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              <CardContent className="p-8 relative z-10 flex flex-col gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/20 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                  <UserPlus className="w-7 h-7" />
                </div>
                <div className="mt-2">
                  <h4 className="font-bold text-xl text-white mb-1">
                    {isCEO ? "Invite HR Manager" : "Invite Team Member"}
                  </h4>
                  <p className="text-indigo-100 font-medium">Send secure access instantly.</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/settings" className="block">
            <Card className="border border-slate-200/60 shadow-md hover:shadow-lg transition-all duration-300 group overflow-hidden relative rounded-3xl bg-white hover:-translate-y-1">
              <CardContent className="p-8 relative z-10 flex flex-col gap-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-600 border border-slate-100 group-hover:scale-110 group-hover:bg-slate-100 group-hover:text-slate-900 transition-all duration-300">
                  <Settings className="w-7 h-7" />
                </div>
                <div className="mt-2">
                  <h4 className="font-bold text-xl text-slate-900 mb-1">Workspace Settings</h4>
                  <p className="text-slate-500 font-medium">Configure roles & preferences.</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
