import React from 'react';
import { Shield, Lock, FileText } from 'lucide-react';
import { CardHoverEffect } from '@/components/ui/card-hover-effect';

export default function LandingSecurity() {
  const securityPillars = [
    {
      icon: Shield,
      title: 'Role-Based Access Control',
      description: 'Strict separation between Super Admins, HR Managers, Finance Leads, and standard Employees ensures users only access what they need.',
    },
    {
      icon: Lock,
      title: 'Data Privacy & Encryption',
      description: 'All employee personal identifiable information (PII) and payroll records are encrypted in transit and at rest with industry-standard protocols.',
    },
    {
      icon: FileText,
      title: 'Immutable Audit Logs',
      description: 'Every critical system action—from leave quota overrides to salary adjustments—is tracked with timestamps, IP origin, and actor metadata.',
    },
  ];

  return (
    <section id="security" className="py-20 sm:py-28 bg-white border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-16">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
            Security & Governance
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 leading-tight">
            Security built into every layer of the platform.
          </h2>
          <p className="mt-4 font-sans text-base sm:text-lg text-slate-600 leading-relaxed">
            Your human capital and financial data demands uncompromised privacy and regulatory compliance.
          </p>
        </div>

        <CardHoverEffect
          items={securityPillars}
          layoutId="securityCardHover"
          className="gap-4 -mx-2 md:grid-cols-3"
          renderItem={(pillar) => {
            const Icon = pillar.icon;
            return (
              <div className="p-7 rounded-2xl border border-slate-200/80 bg-white group-hover:border-slate-300 group-hover:shadow-sm transition-all duration-300 h-full flex flex-col justify-start">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center mb-5 group-hover:bg-primary-100 group-hover:scale-105 transition-all duration-300">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-slate-900 mb-2 group-hover:text-slate-900 transition-colors">
                  {pillar.title}
                </h3>
                <p className="font-sans text-sm text-slate-600 leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            );
          }}
        />
      </div>
    </section>
  );
}
