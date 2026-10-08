import React from 'react';
import { 
  Users, 
  Clock, 
  CheckCircle2, 
  TrendingUp, 
  UserPlus, 
  FileText, 
  BarChart3, 
  UserCheck, 
  Search, 
  ChevronDown, 
  ChevronRight, 
  Send, 
  Briefcase, 
  Mail, 
  PartyPopper, 
  Gift, 
  Activity,
  Layers,
  DollarSign,
  Settings,
  Sun,
  Laptop,
  CheckSquare
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function LandingDashboardPreview() {
  const dummyEmployees = [
    {
      initials: 'SJ',
      name: 'Sarah Jenkins',
      empId: 'EMP0084',
      status: 'Pending Onboarding',
      statusVariant: 'bg-blue-50 text-blue-700 border-blue-200/80',
      role: 'Staff Product Designer',
      email: 'sarah.jenkins@acmecorp.io',
      progress: 45,
      showResend: true,
    },
    {
      initials: 'AR',
      name: 'Alex Rivera',
      empId: 'EMP0085',
      status: 'Active',
      statusVariant: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
      role: 'Senior Backend Engineer',
      email: 'alex.rivera@acmecorp.io',
      progress: 80,
      showResend: false,
    },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Outer Browser Window Frame */}
      <div className="relative rounded-2xl border border-slate-200/90 bg-white shadow-2xl shadow-slate-300/50 overflow-hidden text-left">
        {/* Top Browser / Window chrome */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200/80 bg-slate-50/90">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono bg-white px-3 py-1 rounded-md border border-slate-200/70 shadow-xs">
            <span className="text-slate-400">tradevu-hr.com</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-700 font-medium">dashboard</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[11px] font-normal border-emerald-200/80 text-emerald-700 bg-emerald-50/50">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
              Live Workspace
            </Badge>
          </div>
        </div>

        {/* Inner App Workspace Layout: Rail + Secondary Sidebar + Main Content */}
        <div className="flex min-h-[580px] bg-[#f8fafc] overflow-x-auto">
          {/* 1. Left Icon Rail (Dark slate like live app) */}
          <div className="w-14 sm:w-16 bg-[#161626] flex flex-col items-center justify-between py-4 shrink-0 text-slate-400">
            <div className="flex flex-col items-center gap-5 w-full">
              {/* Brand Logo Icon */}
              <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                T
              </div>
              {/* Nav Icons */}
              <div className="flex flex-col items-center gap-3 w-full px-2">
                <button type="button" className="w-10 h-10 rounded-xl bg-primary-100 text-white flex items-center justify-center shadow-xs">
                  <Layers className="w-5 h-5" />
                </button>
                <button type="button" className="w-10 h-10 rounded-xl hover:bg-white/10 hover:text-white flex items-center justify-center transition-colors">
                  <Users className="w-5 h-5" />
                </button>
                <button type="button" className="w-10 h-10 rounded-xl hover:bg-white/10 hover:text-white flex items-center justify-center transition-colors">
                  <DollarSign className="w-5 h-5" />
                </button>
                <button type="button" className="w-10 h-10 rounded-xl hover:bg-white/10 hover:text-white flex items-center justify-center transition-colors">
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col items-center gap-3">
              <button type="button" className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors">
                <Sun className="w-4 h-4 text-slate-400" />
              </button>
              <div className="w-8 h-8 rounded-full bg-violet-600/80 text-white font-semibold text-xs flex items-center justify-center ring-2 ring-violet-400/40">
                TV
              </div>
            </div>
          </div>

          {/* 2. Secondary Sidebar: Dashboard Sub-nav */}
          <div className="w-48 sm:w-52 bg-white border-r border-slate-200/80 shrink-0 hidden md:flex flex-col p-4">
            <div className="mb-6">
              <h2 className="text-lg font-bold font-heading text-slate-900 tracking-tight">Dashboard</h2>
            </div>
            <nav className="space-y-1.5">
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-100 text-primary-100 font-semibold text-xs relative">
                <div className="w-1 h-4 bg-primary-100 rounded-full absolute left-1" />
                <Layers className="w-4 h-4 ml-1" />
                <span>Overview</span>
              </div>
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-50 font-medium text-xs transition-colors">
                <CheckCircle2 className="w-4 h-4 text-slate-400" />
                <span>Approvals</span>
              </div>
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-50 font-medium text-xs transition-colors">
                <Laptop className="w-4 h-4 text-slate-400" />
                <span>Assets</span>
              </div>
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-50 font-medium text-xs transition-colors">
                <CheckSquare className="w-4 h-4 text-slate-400" />
                <span>Tasks & Projects</span>
              </div>
            </nav>
          </div>

          {/* 3. Main Dashboard Body */}
          <div className="flex-1 p-4 sm:p-6 lg:p-7 space-y-5 min-w-[700px]">
            {/* Header with Welcome and Add Employee Button */}
            <div className="flex items-center justify-between gap-4">
              <h1 className="text-base sm:text-lg font-bold font-heading text-slate-900 tracking-tight">
                Welcome back! Here's what's happening with onboarding.
              </h1>
              <button 
                type="button" 
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
              >
                <span>+</span>
                <span>Add employee</span>
              </button>
            </div>

            {/* Row 1: Four Stat Metric Cards */}
            <div className="grid grid-cols-4 gap-3 sm:gap-4">
              {/* Card 1: Total Employees */}
              <div className="p-4 rounded-xl border border-slate-200/80 bg-white shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-slate-400" /> 3 templates
                  </span>
                </div>
                <div className="text-xs font-medium text-slate-500">Total Employees</div>
                <div className="text-2xl font-bold font-heading text-slate-900 tracking-tight mt-0.5">24</div>
              </div>

              {/* Card 2: Active Onboarding */}
              <div className="p-4 rounded-xl border border-slate-200/80 bg-white shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" /> 11 pending tasks
                  </span>
                </div>
                <div className="text-xs font-medium text-slate-500">Active Onboarding</div>
                <div className="text-2xl font-bold font-heading text-slate-900 tracking-tight mt-0.5">6</div>
              </div>

              {/* Card 3: Completed */}
              <div className="p-4 rounded-xl border border-slate-200/80 bg-white shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-slate-400" /> This month
                  </span>
                </div>
                <div className="text-xs font-medium text-slate-500">Completed</div>
                <div className="text-2xl font-bold font-heading text-slate-900 tracking-tight mt-0.5">18</div>
              </div>

              {/* Card 4: Avg. Progress */}
              <div className="p-4 rounded-xl border border-slate-200/80 bg-white shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-slate-400" /> Overall
                  </span>
                </div>
                <div className="text-xs font-medium text-slate-500">Avg. Progress</div>
                <div className="text-2xl font-bold font-heading text-slate-900 tracking-tight mt-0.5">68%</div>
              </div>
            </div>

            {/* Row 2: Four Action / Shortcut Cards */}
            <div className="grid grid-cols-4 gap-3 sm:gap-4">
              <div className="p-3 rounded-xl border border-slate-200/80 bg-white flex items-center gap-3 shadow-xs">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-900 truncate">Add employee</div>
                  <div className="text-[11px] text-slate-500 truncate">Onboard a new...</div>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-slate-200/80 bg-white flex items-center gap-3 shadow-xs">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-900 truncate">Create Template</div>
                  <div className="text-[11px] text-slate-500 truncate">Build onboarding...</div>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-slate-200/80 bg-white flex items-center gap-3 shadow-xs">
                <div className="w-8 h-8 rounded-xl bg-fuchsia-50 text-fuchsia-600 flex items-center justify-center shrink-0">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-900 truncate">View Analytics</div>
                  <div className="text-[11px] text-slate-500 truncate">Check performance...</div>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-slate-200/80 bg-white flex items-center gap-3 shadow-xs">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-900 truncate">Manage Employees</div>
                  <div className="text-[11px] text-slate-500 truncate">View all employees</div>
                </div>
              </div>
            </div>

            {/* Row 3: Lower Section: Employees List (65%) + Widgets (35%) */}
            <div className="grid grid-cols-12 gap-4">
              {/* Left Column: Employees Table/List */}
              <div className="col-span-8 p-4 rounded-2xl border border-slate-200/80 bg-white shadow-xs space-y-4">
                {/* Header with Search and Filter */}
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-bold font-heading text-slate-900">Employees</h3>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50/60 text-xs text-slate-400 w-44">
                      <Search className="w-3.5 h-3.5" />
                      <span className="truncate">Search employees...</span>
                    </div>
                    <div className="flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700">
                      <span>All Status</span>
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </div>
                </div>

                {/* Dummy Employee Rows (Safely anonymized) */}
                <div className="space-y-3">
                  {dummyEmployees.map((emp, idx) => (
                    <div 
                      key={idx} 
                      className="p-3 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/40 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-200/80 text-slate-700 font-semibold text-xs flex items-center justify-center shrink-0">
                          {emp.initials}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-900">{emp.name}</span>
                            <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              {emp.empId}
                            </span>
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${emp.statusVariant}`}>
                              {emp.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Briefcase className="w-3 h-3 text-slate-400" /> {emp.role}
                            </span>
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-400" /> {emp.email}
                            </span>
                          </div>
                          {/* Progress */}
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Progress</span>
                            <div className="w-36 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div className="h-full bg-slate-900 rounded-full" style={{ width: `${emp.progress}%` }} />
                            </div>
                            <span className="text-[10px] font-medium text-slate-600">{emp.progress}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {emp.showResend && (
                          <button 
                            type="button" 
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-medium shadow-2xs transition-colors"
                          >
                            <Send className="w-3 h-3 text-primary-100" />
                            <span>Resend Invite</span>
                          </button>
                        )}
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Widgets */}
              <div className="col-span-4 space-y-4">
                {/* Celebrations Widget */}
                <div className="p-4 rounded-2xl border border-slate-200/80 bg-white shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                      <PartyPopper className="w-3.5 h-3.5 text-pink-500" />
                      <span>This Month's Celebrations</span>
                    </div>
                    <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">October</span>
                  </div>
                  <div className="py-6 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 rounded-2xl bg-pink-50 text-pink-400 flex items-center justify-center mb-2.5">
                      <Gift className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-medium text-slate-500">No celebrations this month</p>
                  </div>
                </div>

                {/* Recent Activity Widget */}
                <div className="p-4 rounded-2xl border border-slate-200/80 bg-white shadow-xs">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 mb-3">
                    <Activity className="w-3.5 h-3.5 text-primary-100" />
                    <span>Recent Activity</span>
                  </div>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-[11px] font-semibold text-slate-800">Leave Request Approved</div>
                        <div className="text-[10px] text-slate-500">Sarah Jenkins · 2h ago</div>
                      </div>
                      <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                        Done
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-[11px] font-semibold text-slate-800">Tax Form Signed</div>
                        <div className="text-[10px] text-slate-500">Alex Rivera · Yesterday</div>
                      </div>
                      <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                        Verified
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
