import { useEffect } from 'react';
import './App.css'
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { setupIframeMessaging } from './lib/iframe-messaging';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import ProfileCompletionWizard from '@/pages/ProfileCompletionWizard';

import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AcceptInvite from './pages/AcceptInvite';

import { PAGE_ROUTES } from '@/constants/pageRoutes';
import { isAdmin, isSuperAdmin, isHrAdmin } from '@/lib/roleUtils';
import { RouteGuard } from '@/components/ProtectedRoute';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

setupIframeMessaging();

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { user, isLoadingAuth, isLoadingPublicSettings, authError, isAuthenticated, navigateToLogin, viewMode, changeViewMode } = useAuth();
  const location = useLocation();

  const userIsSuperAdmin = isSuperAdmin(user);
  const userIsAdmin = isAdmin(user);
  const userIsHrAdmin = isHrAdmin(user);

  useEffect(() => {
    if (userIsSuperAdmin && viewMode !== 'ADMIN') {
      changeViewMode('ADMIN');
    }
  }, [userIsSuperAdmin, viewMode, changeViewMode]);

  const currentPath = location.pathname.toLowerCase();
  const isLoginPage = currentPath.includes(PAGE_ROUTES.LOGIN);
  const isPublicPage = (!isAuthenticated && currentPath === PAGE_ROUTES.HOME) || 
    currentPath.includes(PAGE_ROUTES.FORGOT_PASSWORD) || 
    currentPath.includes(PAGE_ROUTES.RESET_PASSWORD) || 
    currentPath.includes('/reset-password') || 
    currentPath.includes(PAGE_ROUTES.ACCEPT_INVITE) || 
    currentPath.includes(PAGE_ROUTES.REGISTER);

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // If we are on the login or public pages, render them without layout
  if (isLoginPage || isPublicPage) {
    return (
      <Routes>
        <Route path={PAGE_ROUTES.LOGIN} element={Pages.Login ? <Pages.Login /> : <div>Login component missing</div>} />
        <Route path={PAGE_ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
        <Route path={PAGE_ROUTES.RESET_PASSWORD} element={<ResetPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path={PAGE_ROUTES.ACCEPT_INVITE} element={<AcceptInvite />} />
        <Route path={PAGE_ROUTES.REGISTER} element={Pages.Register ? <Pages.Register /> : <div>Register missing</div>} />
        <Route path={PAGE_ROUTES.HOME} element={Pages.Home ? <Pages.Home /> : <MainPage />} />
      </Routes>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Force profile completion for new employees (skip for SUPER_ADMIN)
  if (user?.mustCompleteProfile && !userIsSuperAdmin) {
    return <ProfileCompletionWizard />;
  }

  // SUPER_ADMIN must never access role selection or employee-only self service views
  if (userIsSuperAdmin) {
    if (
      currentPath === PAGE_ROUTES.ROLE_SELECTION.toLowerCase() ||
      currentPath === PAGE_ROUTES.EMPLOYEE_SELF_SERVICE.toLowerCase() ||
      currentPath === PAGE_ROUTES.EMPLOYEE_PORTAL.toLowerCase()
    ) {
      return <Navigate to={PAGE_ROUTES.DASHBOARD} replace />;
    }
  }

  // Intercept for Role Selection: ONLY HR_ADMIN gets the choice to select view
  if (user && !viewMode) {
    if (!userIsSuperAdmin && userIsHrAdmin && Pages.RoleSelection) {
      return <Pages.RoleSelection />;
    }
  }

  // SUPER_ADMIN unconditionally has ADMIN viewMode; other users default based on role
  const effectiveViewMode = userIsSuperAdmin
    ? 'ADMIN'
    : (viewMode || (userIsHrAdmin ? 'ADMIN' : 'EMPLOYEE'));

  // Render the main app
  return (
    <LayoutWrapper currentPageName={mainPageKey}>
      <Routes>
        <Route path={PAGE_ROUTES.HOME} element={effectiveViewMode === 'EMPLOYEE' ? <Navigate to={PAGE_ROUTES.EMPLOYEE_SELF_SERVICE} replace /> : <MainPage />} />
        {Object.entries(Pages).map(([path, Page]) => (
          <Route
            key={path}
            path={`/${path.toLowerCase()}`}
            element={
              <RouteGuard pageKey={path}>
                <Page />
              </RouteGuard>
            }
          />
        ))}
        {Object.entries(Pages).map(([path]) => (
          <Route key={`orig-${path}`} path={`/${path}`} element={<Navigate to={`/${path.toLowerCase()}`} replace />} />
        ))}
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </LayoutWrapper>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <ErrorBoundary>
          <Router>
            <NavigationTracker />
            <AuthenticatedApp />
          </Router>
          <Toaster />
          <SonnerToaster />
          <VisualEditAgent />
        </ErrorBoundary>
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
