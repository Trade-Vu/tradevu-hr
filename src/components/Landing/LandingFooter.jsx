import React from 'react';
import { Link } from 'react-router-dom';
import { PAGE_ROUTES } from '@/constants/pageRoutes';

export default function LandingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-50 border-t border-slate-200/80 py-12 sm:py-16 text-slate-600 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand info */}
          <div className="col-span-2 space-y-4">
            <Link to={PAGE_ROUTES.HOME} className="inline-block">
              <img src="/Logo-2.png" alt="Tradevu HR" className="h-8 w-auto" />
            </Link>
            <p className="text-sm text-slate-500 max-w-sm leading-relaxed">
              The modern HR operating system designed for growing enterprises, automated payroll, and seamless personnel workflows.
            </p>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/70 text-xs font-medium text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              All systems operational
            </div>
          </div>

          {/* Column 1 */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-4 font-heading">
              Platform
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#features" className="hover:text-slate-900 transition-colors">Directory</a></li>
              <li><a href="#features" className="hover:text-slate-900 transition-colors">Payroll</a></li>
              <li><a href="#features" className="hover:text-slate-900 transition-colors">Leave Management</a></li>
              <li><a href="#features" className="hover:text-slate-900 transition-colors">Self-Service</a></li>
            </ul>
          </div>

          {/* Column 2 */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-4 font-heading">
              Solutions
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#solutions" className="hover:text-slate-900 transition-colors">People Ops</a></li>
              <li><a href="#solutions" className="hover:text-slate-900 transition-colors">Finance & Payroll</a></li>
              <li><a href="#solutions" className="hover:text-slate-900 transition-colors">Employees</a></li>
              <li><a href="#security" className="hover:text-slate-900 transition-colors">Security & Audit</a></li>
            </ul>
          </div>

          {/* Column 3 */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-4 font-heading">
              Access
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to={PAGE_ROUTES.LOGIN} className="hover:text-slate-900 transition-colors">Workspace Login</Link></li>
              <li><Link to={PAGE_ROUTES.REGISTER} className="hover:text-slate-900 transition-colors">Create Account</Link></li>
              <li><a href="#faq" className="hover:text-slate-900 transition-colors">Support FAQ</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p className="text-sm">© {currentYear} Tradevu. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-slate-800 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-800 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-800 cursor-pointer">System Status</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
