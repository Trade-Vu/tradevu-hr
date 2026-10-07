import React from 'react';
import { 
  Users, 
  Zap, 
  Building2, 
  CalendarDays, 
  GitFork, 
  ShieldCheck 
} from 'lucide-react';

import { CardHoverEffect } from '@/components/ui/card-hover-effect';

export default function LandingFeatures() {
  const features = [
    {
      icon: Users,
      title: 'Employee Directory',
      description: 'Keep all your employee data organized, secure, and easily accessible from anywhere.',
      badge: 'Core HR',
    },
    {
      icon: Zap,
      title: 'Automated Payroll',
      description: 'Run payroll in minutes with automated tax calculations and direct deposits.',
      badge: 'Payroll',
    },
    {
      icon: Building2,
      title: 'Self-Service Portal',
      description: 'Empower employees to manage their own time off, payslips, and personal details.',
      badge: 'Portal',
    },
    {
      icon: CalendarDays,
      title: 'Leave & Attendance',
      description: 'Configure customizable leave types, track team balances, and approve time off in one unified calendar.',
      badge: 'Time Off',
    },
    {
      icon: GitFork,
      title: 'Approval Workflows',
      description: 'Multi-tier approval chains routing requests directly to managers and HR with zero delay.',
      badge: 'Workflows',
    },
    {
      icon: ShieldCheck,
      title: 'Enterprise Security',
      description: 'Strict role-based access control, encrypted employee records, and immutable audit logs.',
      badge: 'Security',
    },
  ];

  return (
    <section id="features" className="py-20 sm:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header - Exact original text maintained */}
        <div className="max-w-3xl mb-16 sm:mb-20">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
            Core Platform
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 leading-tight">
            Everything you need to run your team
          </h2>
          <p className="mt-4 font-sans text-base sm:text-lg text-slate-600 leading-relaxed">
            Powerful tools designed to save you time and keep your data secure.
          </p>
        </div>

        {/* Feature Cards Grid with Aceternity-inspired Hover Animation */}
        <CardHoverEffect
          items={features}
          layoutId="featuresCardHover"
          className="gap-2 sm:gap-4 -mx-2"
          renderItem={(feature) => {
            const Icon = feature.icon;
            return (
              <div className="p-7 rounded-2xl border border-slate-200/80 bg-white group-hover:border-primary-100/40 group-hover:shadow-sm transition-all duration-300 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900 group-hover:bg-primary-100 group-hover:text-white group-hover:scale-105 transition-all duration-300">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-slate-100/70 text-slate-600 border border-slate-200/60 group-hover:border-primary-100/30 group-hover:text-primary-100 transition-colors">
                      {feature.badge}
                    </span>
                  </div>

                  <h3 className="font-heading text-xl font-semibold text-slate-900 mb-3 group-hover:text-slate-900 transition-colors">
                    {feature.title}
                  </h3>

                  <p className="font-sans text-sm text-slate-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          }}
        />
      </div>
    </section>
  );
}
