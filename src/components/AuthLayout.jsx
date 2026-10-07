import React from 'react';
import { Link } from 'react-router-dom';
import { PAGE_ROUTES } from '@/constants/pageRoutes';
import { ArrowLeft, CheckCircle2, ShieldCheck, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Reusable, responsive authentication layout supporting two modes:
 * 1. 'split' (default for Login & Register): Left form container + right branded showcase.
 * 2. 'card' (for ForgotPassword, ResetPassword, OAuthConsent, AcceptInvite): Centered card.
 *
 * NOTE: Does not touch or override screen-specific logos; children/screens render their own logo.
 */
export default function AuthLayout({
  variant = 'card',
  icon: Icon,
  title,
  subtitle,
  footer,
  backTo = PAGE_ROUTES.HOME,
  backLabel = 'Back to website',
  showcaseTitle = 'Empower your workforce.',
  showcaseSubtitle = 'The unified platform for modern enterprises to manage talent, payroll, and organizational intelligence securely.',
  children,
  className,
}) {
  // If variant is 'split', render the two-column responsive layout
  if (variant === 'split') {
    return (
      <div className="min-h-[100dvh] flex bg-white font-sans text-slate-900 selection:bg-slate-900 selection:text-white">
        {/* Left Panel: Responsive Form Container */}
        <div className="w-full lg:w-1/2 flex flex-col justify-between min-h-[100dvh] p-6 sm:p-10 lg:p-14 xl:p-16 relative z-10 overflow-y-auto">
          {/* Top Bar: Back to Home Link */}
          <div className="flex items-center justify-between w-full max-w-md mx-auto pt-2 pb-4">
            {backTo && (
              <Link
                to={backTo}
                className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors py-1 group"
              >
                <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
                <span>{backLabel}</span>
              </Link>
            )}
          </div>

          {/* Form Content Wrapper */}
          <div className={cn('w-full max-w-md mx-auto my-auto py-6 sm:py-8', className)}>
            {children}
          </div>
        </div>

        {/* Right Panel: Showcase (Visible on Large Desktops) */}
        <div className="hidden lg:block lg:w-1/2 relative bg-slate-900 overflow-hidden shadow-2xl">
          {/* Subtle gradient & backdrop overlay */}
          <div className="absolute inset-0 bg-slate-900/40 mix-blend-multiply z-10" />

          {/* Background image */}
          <img
            src="/bg-login.png"
            alt="Tradevu Abstract"
            className="absolute inset-0 w-full h-full object-cover opacity-90 scale-105"
          />

          {/* Bottom highlight overlay */}
          <div className="absolute inset-0 z-20 flex flex-col justify-end p-12 xl:p-16 pb-20 text-white bg-gradient-to-t from-slate-900/95 via-slate-900/50 to-transparent">
            <div className="max-w-xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-medium text-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                Enterprise Personnel Infrastructure
              </div>
              <h2 className="font-heading text-3xl xl:text-4xl font-bold leading-tight tracking-tight text-white drop-shadow-sm">
                {showcaseTitle}
              </h2>
              <p className="text-base xl:text-lg text-slate-200 leading-relaxed font-light drop-shadow">
                {showcaseSubtitle}
              </p>
            </div>

            {/* Platform proof */}
            <div className="mt-10 flex items-center space-x-6 border-t border-white/10 pt-6">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-9 h-9 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center overflow-hidden"
                  >
                    <UserCircle className="w-7 h-7 text-slate-400" />
                  </div>
                ))}
              </div>
              <div className="text-xs text-slate-300">
                <span className="font-semibold text-white">10,000+</span> professionals on Tradevu
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default 'card' variant (for single-purpose flows like ForgotPassword, ResetPassword, OAuthConsent)
  return (
    <div className="min-h-[100dvh] flex flex-col justify-between bg-slate-50/70 px-4 py-8 sm:py-12 font-sans text-slate-900 selection:bg-slate-900 selection:text-white">
      {/* Top Bar with optional back button */}
      <div className="w-full max-w-md mx-auto flex items-center justify-between mb-4">
        {backTo && (
          <Link
            to={backTo}
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors py-1 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span>{backLabel}</span>
          </Link>
        )}
      </div>

      {/* Main Card Container */}
      <div className="w-full max-w-md mx-auto my-auto">
        {(Icon || title) && (
          <div className="text-center mb-8">
            {Icon && (
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-900 text-white mb-4">
                <Icon className="w-7 h-7" aria-hidden="true" />
              </div>
            )}
            {title && (
              <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                {title}
              </h1>
            )}
            {subtitle && <p className="text-slate-600 mt-2 text-sm sm:text-base">{subtitle}</p>}
          </div>
        )}

        <div className={cn('bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/80 p-6 sm:p-8', className)}>
          {children}
        </div>

        {footer && (
          <div className="text-center text-sm text-slate-600 mt-6">
            {footer}
          </div>
        )}
      </div>

      {/* Bottom Footer */}
      <div className="w-full max-w-md mx-auto text-center pt-8 text-xs text-slate-400">
        © {new Date().getFullYear()} Tradevu. All rights reserved.
      </div>
    </div>
  );
}
