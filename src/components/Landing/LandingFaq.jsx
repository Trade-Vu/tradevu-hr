import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export default function LandingFaq() {
  const faqs = [
    {
      question: 'How fast can our company get started with Tradevu HR?',
      answer: 'Most organizations complete initial setup within 1 to 2 hours. You can import existing employee data via CSV, define your organizational departments and leave types, and immediately start inviting team members.',
    },
    {
      question: 'Can we configure custom leave quotas and individual employee exceptions?',
      answer: 'Yes. Tradevu includes a dedicated Leave Quota Exceptions engine allowing People Ops administrators to assign bespoke quotas, carry-forward days, or bonus allowances to specific employees without breaking company-wide policy defaults.',
    },
    {
      question: 'How does automated payroll calculation work?',
      answer: 'The payroll engine synchronizes active employee compensation figures, prorates join/leave dates, applies recurring and one-off salary adjustments, and automates statutory deductions before generating downloadable itemized payslips.',
    },
    {
      question: 'Does Tradevu support multi-tier approval chains?',
      answer: 'Yes. You can configure multi-tier approval rules that automatically route leave applications, salary adjustments, and letter requests from Line Managers through to Department Heads and HR Admins.',
    },
    {
      question: 'Is Tradevu accessible on mobile devices for employees?',
      answer: 'Tradevu HR is fully responsive. Employees can submit leave requests, view recent payslips, and check pending approvals directly from their smartphone browser without needing to download a separate mobile app.',
    },
    {
      question: 'How is company data protected?',
      answer: 'We employ role-based access control, cryptographic session handling, strict tenant data isolation, and comprehensive immutable audit trails for every key managerial action.',
    },
  ];

  return (
    <section id="faq" className="py-20 sm:py-28 bg-slate-50/50 border-t border-slate-200/80">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
            Questions & Answers
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 leading-tight">
            Frequently asked questions.
          </h2>
          <p className="mt-4 font-sans text-base sm:text-lg text-slate-600">
            Everything you need to know about Tradevu HR and getting your workforce onboarded.
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, idx) => (
              <AccordionItem key={idx} value={`item-${idx}`} className="border-slate-200/70 last:border-b-0">
                <AccordionTrigger className="text-left font-heading text-base font-semibold text-slate-900 hover:text-slate-700 py-4">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="font-sans text-slate-600 text-sm leading-relaxed pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
