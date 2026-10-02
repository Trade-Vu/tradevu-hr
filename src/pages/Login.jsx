import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { authApi } from '@/api/auth.api';
import { Mail, Lock, Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { PAGE_ROUTES } from '@/constants/pageRoutes';
import AuthLayout from '@/components/AuthLayout';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { checkAppState } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      // DEV-ONLY: bypass real auth with a mock token for local testing.
      if (import.meta.env.DEV && email.toLowerCase() === 'ceo@tradevu.com') {
        localStorage.setItem('token', 'mock_ceo_token');
        await checkAppState();
        window.location.href = PAGE_ROUTES.HOME;
        return;
      }

      const data = await authApi.login({
        email,
        password,
      });

      if (data && data.token) {
        localStorage.setItem('token', data.token);
        await checkAppState();
        window.location.href = PAGE_ROUTES.HOME;
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Invalid credentials. Please check your email and password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout variant="split">
      <div className="space-y-8">
        <div className="text-left">
          {/* Preserving current logo on auth screen exactly as requested */}
          <img src="/logo-icon.png" alt="Tradevu Logo" className="w-16 h-auto mb-6" />
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Welcome back
          </h1>
          <p className="text-slate-500 mt-2 text-base sm:text-lg">
            Sign in to your Tradevu HR workspace.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <Input
                  type="email"
                  data-testid="email-input"
                  placeholder="name@tradevu.com"
                  className="pl-11 h-12 bg-slate-50/50 border-slate-200 text-base rounded-xl focus-visible:ring-slate-900 focus-visible:border-slate-900 transition-colors"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  data-testid="password-input"
                  placeholder="••••••••"
                  className="pl-11 pr-11 h-12 bg-slate-50/50 border-slate-200 text-base rounded-xl focus-visible:ring-slate-900 focus-visible:border-slate-900 transition-colors"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-slate-900 focus:ring-slate-900 border-slate-300 rounded cursor-pointer"
              />
              <label htmlFor="remember-me" className="ml-2.5 block text-sm text-slate-600 cursor-pointer select-none">
                Remember me
              </label>
            </div>
            <div className="text-sm">
              <Link
                to={PAGE_ROUTES.FORGOT_PASSWORD}
                className="font-medium text-slate-900 hover:text-slate-700 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <Button
            type="submit"
            data-testid="login-submit"
            disabled={isLoading}
            className="w-full h-12 text-base font-medium bg-slate-900 text-white hover:bg-slate-800 shadow-md hover:shadow-lg transition-all rounded-xl"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <>
                Sign In
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </form>

        <div className="text-center pt-4 space-y-2">
          <p className="text-sm text-slate-600">
            Don't have an account?{' '}
            <Link to={PAGE_ROUTES.REGISTER} className="font-semibold text-slate-900 hover:underline">
              Sign up
            </Link>
          </p>
          <p className="text-xs text-slate-500">
            Need help?{' '}
            <a href="mailto:support@tradevu.co" className="font-medium text-slate-700 hover:underline">
              Contact IT Support
            </a>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
