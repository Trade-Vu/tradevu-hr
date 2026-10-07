import React from 'react';

export default function LandingMetrics() {
  const metrics = [
    { value: '99.98%', label: 'System Uptime', subtext: 'Continuous, dependable availability' },
    { value: '< 5 min', label: 'Payroll Processing', subtext: 'One-click automated disbursement' },
    { value: '4.8x', label: 'Faster Approvals', subtext: 'Multi-level workflow automation' },
    { value: '100%', label: 'Audit Compliance', subtext: 'Immutable history and role security' },
  ];

  return (
    <section className="py-12 border-y border-slate-200/80 bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {metrics.map((item, idx) => (
            <div key={idx} className="text-center sm:text-left space-y-1">
              <div className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
                {item.value}
              </div>
              <div className="text-sm font-semibold text-slate-800">
                {item.label}
              </div>
              <div className="text-xs text-slate-500">
                {item.subtext}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
