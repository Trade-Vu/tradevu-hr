import React from 'react';
import { Navigate } from 'react-router-dom';
import { PAGE_ROUTES } from '@/constants/pageRoutes';
import { useAuth } from '@/lib/AuthContext';
import LandingNav from '@/components/Landing/LandingNav';
import LandingHero from '@/components/Landing/LandingHero';
import LandingMetrics from '@/components/Landing/LandingMetrics';
import LandingFeatures from '@/components/Landing/LandingFeatures';
import LandingRoleTabs from '@/components/Landing/LandingRoleTabs';
import LandingSecurity from '@/components/Landing/LandingSecurity';
import LandingFaq from '@/components/Landing/LandingFaq';
import LandingCta from '@/components/Landing/LandingCta';
import LandingFooter from '@/components/Landing/LandingFooter';

export default function Home() {
  const { isAuthenticated, user } = useAuth();

  // If already logged in, redirect to their designated dashboard
  if (isAuthenticated && user) {
    if (user.role === 'EMPLOYEE') {
      return <Navigate to={PAGE_ROUTES.EMPLOYEE_SELF_SERVICE} replace />;
    }
    return <Navigate to={PAGE_ROUTES.DASHBOARD} replace />;
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-slate-900 selection:text-white flex flex-col">
      <LandingNav />
      <main className="flex-1">
        <LandingHero />
        <LandingMetrics />
        <LandingFeatures />
        <LandingRoleTabs />
        <LandingSecurity />
        <LandingFaq />
        <LandingCta />
      </main>
      <LandingFooter />
    </div>
  );
}