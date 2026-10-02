import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Check, Shield, Zap, HeartHandshake, FileSpreadsheet, Clock } from 'lucide-react';

import { CardSpotlight } from '@/components/ui/card-spotlight';

export default function LandingRoleTabs() {
  const roleData = {
    hr: {
      title: 'Built for People Operations & HR Leaders',
      description: 'Streamline headcount tracking, automate onboarding paperwork, and manage organization structures with precision.',
      bullets: [
        'Centralized personnel records with departmental hierarchical mapping',
        'Customizable leave policies with per-employee quota exception rules',
        'Digital HR letter issuance with downloadable verification PDF documents',
        'Multi-stage approval workflows for leave and expense requests',
      ],
      previewStats: [
        { label: 'Time saved on admin tasks', value: '14 hrs/wk' },
        { label: 'Policy compliance rate', value: '100%' },
      ],
    },
    finance: {
      title: 'Engineered for Payroll Managers & Finance',
      description: 'Run error-free payrolls with automatic tax calculations, salary adjustments, and complete statutory reporting.',
      bullets: [
        'One-click automated payroll calculation with deduction breakdowns',
        'Direct adjustment management (bonuses, commissions, deductions, loans)',
        'Comprehensive statutory compliance and downloadable tax schedules',
        'Detailed payroll variance and audit logs before bank disbursement',
      ],
      previewStats: [
        { label: 'Calculation accuracy', value: '99.99%' },
        { label: 'Disbursement turnaround', value: '< 1 day' },
      ],
    },
    employee: {
      title: 'Delightful for Employees & Line Managers',
      description: 'Provide team members a self-service portal they actually enjoy using on desktop and mobile devices.',
      bullets: [
        'Instant leave balance check and one-click leave application',
        'Direct access to downloadable payslips and compensation summaries',
        'Line manager approval queue with single-click review and actions',
        'Company announcements and employee directory lookup',
      ],
      previewStats: [
        { label: 'Employee adoption rate', value: '98%' },
        { label: 'Average request resolution', value: '< 4 hrs' },
      ],
    },
  };

  return (
    <section id="solutions" className="py-20 sm:py-28 bg-slate-50/60 border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
            Tailored Experiences
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 leading-tight">
            Designed for every role in your organization.
          </h2>
          <p className="mt-4 font-sans text-base sm:text-lg text-slate-600">
            A frictionless interface built for administrators, finance teams, and everyday staff.
          </p>
        </div>

        {/* Minimal Tabs Container */}
        <Tabs defaultValue="hr" className="w-full max-w-4xl mx-auto">
          <div className="flex justify-center mb-10">
            <TabsList className="bg-white border border-slate-200/80 p-1 rounded-xl shadow-xs">
              <TabsTrigger 
                value="hr" 
                className="px-5 py-2 rounded-lg text-sm font-medium data-[state=active]:bg-primary-100 data-[state=active]:text-white text-slate-600 transition-all"
              >
                People Ops
              </TabsTrigger>
              <TabsTrigger 
                value="finance" 
                className="px-5 py-2 rounded-lg text-sm font-medium data-[state=active]:bg-primary-100 data-[state=active]:text-white text-slate-600 transition-all"
              >
                Payroll & Finance
              </TabsTrigger>
              <TabsTrigger 
                value="employee" 
                className="px-5 py-2 rounded-lg text-sm font-medium data-[state=active]:bg-primary-100 data-[state=active]:text-white text-slate-600 transition-all"
              >
                Employees & Managers
              </TabsTrigger>
            </TabsList>
          </div>

          {Object.entries(roleData).map(([key, data]) => (
            <TabsContent key={key} value={key} className="focus:outline-none">
              <CardSpotlight 
                className="p-6 sm:p-10 shadow-sm hover:shadow-lg transition-all duration-300"
                radius={420}
                color="rgba(79, 70, 229, 0.08)"
                borderColor="rgba(79, 70, 229, 0.35)"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-7 space-y-6">
                    <h3 className="font-heading text-2xl font-bold text-slate-900">
                      {data.title}
                    </h3>
                    <p className="font-sans text-slate-600 text-base leading-relaxed">
                      {data.description}
                    </p>

                    <div className="space-y-3 pt-2">
                      {data.bullets.map((bullet, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="mt-1 w-4 h-4 rounded-full bg-primary-100/10 flex items-center justify-center shrink-0">
                            <Check className="w-2.5 h-2.5 text-primary-100" />
                          </div>
                          <span className="text-sm text-slate-700 leading-snug">{bullet}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="lg:col-span-5 bg-slate-50/90 border border-slate-200/80 rounded-xl p-6 space-y-4">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Impact Metrics
                    </div>
                    {data.previewStats.map((stat, i) => (
                      <div key={i} className="border-b border-slate-200/60 pb-3 last:border-b-0 last:pb-0">
                        <div className="font-heading text-2xl font-bold text-slate-900">
                          {stat.value}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {stat.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardSpotlight>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}
