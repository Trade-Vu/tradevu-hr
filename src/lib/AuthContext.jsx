import React, { createContext, useState, useContext, useEffect } from 'react';
import { authApi } from '@/api/auth.api';
import { PAGE_ROUTES } from '@/constants/pageRoutes';
import { appParams } from '@/lib/app-params';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [viewMode, setViewMode] = useState(localStorage.getItem('tradevu_view_mode') || null);

  useEffect(() => {
    checkUserAuth();
  }, []);

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true);
      setAuthError(null);
      // Check if we have a token (from local storage or appParams)
      const token = localStorage.getItem('token') || appParams?.token;

      if (!token) {
        setIsLoadingAuth(false);
        setIsAuthenticated(false);
        setAuthError({
          type: 'auth_required',
          message: 'Authentication required',
        });
        return;
      }

      // DEV-ONLY: mock token bypass for local development.
      // if (import.meta.env.DEV && token === 'mock_ceo_token') {
      //   setUser({
      //     id: 'mock_ceo',
      //     _id: 'mock_ceo',
      //     email: 'ceo@tradevu.com',
      //     role: 'SUPER_ADMIN',
      //     organizationId: 'org_1',
      //     full_name: 'CEO',
      //     fullName: 'CEO',
      //     mustCompleteProfile: false,
      //   });
      //   setIsAuthenticated(true);
      //   setIsLoadingAuth(false);
      //   return;
      // }

      // Fetch current user from REST backend
      const userData = await authApi.getMe();

      if (userData) {
        const normalizedUser = {
          ...userData,
          id: userData._id || userData.id,
        };
        setUser(normalizedUser);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
      setIsLoadingAuth(false);
    } catch (error) {
      console.error('User auth check failed:', error);
      setIsLoadingAuth(false);
      setIsAuthenticated(false);

      setAuthError({
        type: 'auth_required',
        message: error.message || 'Authentication required or token expired',
      });
    }
  };

  const logout = async (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('token');
    localStorage.removeItem('tradevu_view_mode');

    if (shouldRedirect) {
      window.location.href = PAGE_ROUTES.LOGIN;
    }
  };

  const navigateToLogin = () => {
    if (!window.location.pathname.toLowerCase().includes(PAGE_ROUTES.LOGIN)) {
      window.location.href = PAGE_ROUTES.LOGIN;
    }
  };

  const changeViewMode = (mode) => {
    localStorage.setItem('tradevu_view_mode', mode);
    setViewMode(mode);
  };

  // Mocking the checkAppState function since we don't use base44 app state anymore
  const checkAppState = async () => {
    await checkUserAuth();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings: false,
      authError,
      appPublicSettings: null,
      logout,
      navigateToLogin,
      checkAppState,
      viewMode,
      changeViewMode
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

