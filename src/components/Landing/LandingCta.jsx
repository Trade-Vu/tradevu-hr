import React from 'react';
import { Link } from 'react-router-dom';
import { PAGE_ROUTES } from '@/constants/pageRoutes';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function LandingCta() {
  return (
    <section className="py-20 sm:py-28 bg-white border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-slate-900 text-white p-8 sm:p-14 lg:p-16 relative overflow-hidden">
          <div className="max-w-3xl relative z-10 space-y-6">
            <span className="inline-block text-xs font-semibold uppercase tracking-wider text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
              Start in minutes
            </span>
            <h2 className="font-heading text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
              Ready to modernize your workforce management?
            </h2>
            <p className="font-sans text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
              Experience the clarity of a unified HR operating system. Simplify payroll, empower employees, and eliminate administrative friction today.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
              <Link to={PAGE_ROUTES.REGISTER}>
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto h-12 px-7 bg-primary-100 text-white hover:bg-primary-100/90 rounded-xl font-medium text-base shadow-md transition-colors"
                >
                  Start your free trial
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link to={PAGE_ROUTES.LOGIN}>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="w-full sm:w-auto h-12 px-7 border-slate-700 bg-transparent text-white hover:text-white hover:bg-slate-800 rounded-xl font-medium text-base transition-colors"
                >
                  Sign in to workspace
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
