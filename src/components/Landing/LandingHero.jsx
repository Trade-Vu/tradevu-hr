import React from 'react';
import { Link } from 'react-router-dom';
import { PAGE_ROUTES } from '@/constants/pageRoutes';
import { Button } from '@/components/ui/button';
import { ArrowRight, ShieldCheck, Check } from 'lucide-react';
import LandingDashboardPreview from './LandingDashboardPreview';

export default function LandingHero() {
  return (
    <section className="pt-28 pb-16 sm:pt-36 sm:pb-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Minimal Hero Header Content */}
        <div className="text-center max-w-4xl mx-auto">
          {/* Subtle minimal pill badge with primary accent */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-slate-200/90 bg-slate-50/80 text-xs font-medium text-slate-700 mb-8 transition-colors hover:border-primary-100/30">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-100" />
            <span>Modern Workforce & Payroll Infrastructure</span>
          </div>

          {/* Heading with styled gradient text */}
          <h1 className="font-heading text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 leading-[1.08] mb-6">
            The modern HR OS for <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
              growing enterprises
            </span>
          </h1>

          {/* Subheading - Preserved exact text content */}
          <p className="font-sans text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Manage your workforce, run payroll, and streamline operations in one unified platform built for speed and security.
          </p>

          {/* Action CTAs with primary brand color primary-100 */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-12">
            <Link to={PAGE_ROUTES.REGISTER} className="w-full sm:w-auto">
              <Button 
                size="lg" 
                className="w-full sm:w-auto h-12 px-7 bg-primary-100 hover:bg-primary-100/90 text-white rounded-xl font-medium text-base shadow-md shadow-primary-100/20 transition-all hover:shadow-lg"
              >
                Start your free trial
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>

            <Link to={PAGE_ROUTES.LOGIN} className="w-full sm:w-auto">
              <Button 
                size="lg" 
                variant="outline" 
                className="w-full sm:w-auto h-12 px-7 border-slate-200 bg-white hover:bg-slate-50 text-slate-800 rounded-xl font-medium text-base transition-colors"
              >
                Sign in to workspace
              </Button>
            </Link>
          </div>

          {/* Minimalist trust notes */}
          <div className="flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-primary-100" />
              No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-primary-100" />
              Fast 5-minute setup
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-primary-100" />
              Enterprise-grade security
            </span>
          </div>
        </div>

        {/* Dashboard Workspace Mockup */}
        <div className="mt-14 sm:mt-18">
          <LandingDashboardPreview />
        </div>
      </div>
    </section>
  );
}
