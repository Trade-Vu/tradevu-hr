import './App.css'
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';
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

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

setupIframeMessaging();

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { user, isLoadingAuth, isLoadingPublicSettings, authError, isAuthenticated, navigateToLogin, viewMode } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname.toLowerCase();
  const isLoginPage = currentPath.includes(PAGE_ROUTES.LOGIN);
  const isPublicPage = (!isAuthenticated && currentPath === PAGE_ROUTES.HOME) || 
    currentPath.includes(PAGE_ROUTES.FORGOT_PASSWORD) || 
    currentPath.includes(PAGE_ROUTES.RESET_PASSWORD) || 
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

  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.isOrgOwner || user?.is_organization_owner;
  const isAdmin = user?.role?.includes('ADMIN') || user?.role === 'admin' || isSuperAdmin;

  // Force profile completion for new employees (skip for SUPER_ADMIN)
  if (user?.mustCompleteProfile && !isSuperAdmin) {
    return <ProfileCompletionWizard />;
  }

  // Intercept for Role Selection if user has admin privileges but hasn't picked a view
  if (user && !viewMode) {
    const isEmployeeActive = user.employee?.employmentStatus === 'ACTIVE';
    const hasDualRoles = isSuperAdmin || (isAdmin && isEmployeeActive);

    console.log({ user, viewMode, isTrue: user && !viewMode, hasDualRoles, isAdmin });

    if (hasDualRoles && Pages.RoleSelection) {
      return <Pages.RoleSelection />;
    }
  }

  const isEmployeeActive = user?.employee?.employmentStatus === 'ACTIVE';
  const hasDualRoles = isSuperAdmin || (isAdmin && isEmployeeActive);

  const effectiveViewMode = viewMode || (hasDualRoles ? 'ADMIN' : 'EMPLOYEE');

  // Render the main app
  return (
    <LayoutWrapper currentPageName={mainPageKey}>
      <Routes>
        <Route path={PAGE_ROUTES.HOME} element={effectiveViewMode === 'EMPLOYEE' ? <Navigate to={PAGE_ROUTES.EMPLOYEE_SELF_SERVICE} replace /> : <MainPage />} />
        {Object.entries(Pages).map(([path, Page]) => (
          <Route key={path} path={`/${path.toLowerCase()}`} element={<Page />} />
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
