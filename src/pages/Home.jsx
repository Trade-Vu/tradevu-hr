import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { ArrowRight, CheckCircle2, Users, Building2, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  const { isAuthenticated, user } = useAuth();

  // If already logged in, redirect to their dashboard
  if (isAuthenticated && user) {
    if (user.role === 'EMPLOYEE') {
      return <Navigate to="/employeeselfservice" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center gap-3">
              <img src="/logo-icon.png" alt="TradeVu HR" className="h-10 w-auto" />
              <span className="text-xl font-bold tracking-tight text-slate-900">TradeVu HR</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                Log in
              </Link>
              <Link to="/register">
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm rounded-full px-6">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-32 pb-20 sm:pt-40 sm:pb-24 overflow-hidden relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-100/50 rounded-full blur-3xl -z-10 opacity-70"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-8">
            The modern HR OS for <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
              growing enterprises
            </span>
          </h1>
          <p className="mt-4 text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Manage your workforce, run payroll, and streamline operations in one unified platform built for speed and security.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link to="/register">
              <Button size="lg" className="h-14 px-8 text-lg bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg shadow-indigo-200">
                Start your free trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full border-slate-200 text-slate-700 hover:bg-slate-50">
                Sign in to workspace
              </Button>
            </Link>
          </div>
          <div className="mt-10 text-sm text-slate-500 flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-green-600" />
            No credit card required • Free 14-day trial
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-24 bg-white border-y border-slate-100 relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Everything you need to run your team</h2>
            <p className="mt-4 text-lg text-slate-600">Powerful tools designed to save you time and keep your data secure.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/50 transition-all">
              <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Employee Directory</h3>
              <p className="text-slate-600 leading-relaxed">Keep all your employee data organized, secure, and easily accessible from anywhere.</p>
            </div>
            
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/50 transition-all">
              <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Automated Payroll</h3>
              <p className="text-slate-600 leading-relaxed">Run payroll in minutes with automated tax calculations and direct deposits.</p>
            </div>
            
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/50 transition-all">
              <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center mb-6">
                <Building2 className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Self-Service Portal</h3>
              <p className="text-slate-600 leading-relaxed">Empower employees to manage their own time off, payslips, and personal details.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <img src="/logo-icon.png" alt="TradeVu" className="h-8 w-auto brightness-0 invert opacity-80" />
            <span className="text-lg font-bold text-white tracking-tight">TradeVu HR</span>
          </div>
          <p className="text-sm">© {new Date().getFullYear()} TradeVu. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}