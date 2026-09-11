import React, { useState, useEffect } from 'react';
import { authApi } from '@/api/auth.api';
import { Lock, Loader2, ArrowRight, UserCircle, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { PAGE_ROUTES } from '@/constants/pageRoutes';
import { useAuth } from '@/lib/AuthContext';

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { checkAppState } = useAuth();

  const [inviteDetails, setInviteDetails] = useState(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing invite token. Please request a new invite link.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!token) {
      setError('Invalid or missing invite token.');
      return;
    }

    if (!firstName || !lastName) {
      setError('Please enter your first and last name.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      
      const fullName = `${firstName} ${lastName}`.trim();
      const data = await authApi.acceptInvite({
        token,
        fullName,
        password,
      });

      if (data && data.token) {
        localStorage.setItem('token', data.token);
        await checkAppState();
        setIsSuccess(true);
        setTimeout(() => {
          if (data.user?.role === 'EMPLOYEE') {
            window.location.href = PAGE_ROUTES.EMPLOYEE_SELF_SERVICE;
          } else {
            window.location.href = PAGE_ROUTES.DASHBOARD;
          }
        }, 1500);
      }
    } catch (err) {
      console.error('Accept invite error:', err);
      setError(err.message || 'Failed to complete account setup. The link may be invalid or expired.');
    } finally {
      setIsSubmitting(false);
    }
  };

  console.log({ inviteDetails })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-slate-800" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans">
      <div className="w-full flex flex-col items-center justify-center p-8 sm:p-12 relative z-10">
        <div className="w-full max-w-md space-y-8 bg-white p-8 sm:p-10 rounded-2xl shadow-xl border border-slate-100">
          
          {error ? (
            <div className="text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-medium text-slate-900">Invite Invalid</h3>
              <p className="text-slate-600">{error}</p>
              <Button onClick={() => navigate(PAGE_ROUTES.LOGIN)} className="w-full mt-4">
                Return to Login
              </Button>
            </div>
          ) : isSuccess ? (
            <div className="text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-medium text-slate-900">Welcome to Tradevu HR</h3>
              <p className="text-slate-600">
                Your account has been created successfully. Redirecting you to your dashboard...
              </p>
            </div>
          ) : (
            <>
              <div className="text-center">
                <img src="/logo-icon.png" alt="Tradevu Logo" className="w-12 h-auto mx-auto mb-6" />
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Join {inviteDetails?.organizationName}</h1>
                <p className="text-slate-500 mt-2 text-base">
                  You've been invited as {inviteDetails?.role === 'HR_ADMIN' ? 'an HR Manager' : 'an Employee'}.<br/>
                  <span className="font-medium text-slate-700">{inviteDetails?.email}</span>
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">First Name</label>
                    <Input
                      type="text"
                      placeholder="Jane"
                      className="py-6 bg-slate-50/50 border-slate-200 text-base rounded-xl focus:ring-slate-900 focus:border-slate-900"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Last Name</label>
                    <Input
                      type="text"
                      placeholder="Doe"
                      className="py-6 bg-slate-50/50 border-slate-200 text-base rounded-xl focus:ring-slate-900 focus:border-slate-900"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Create Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-slate-400" />
                      </div>
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-11 pr-11 py-6 bg-slate-50/50 border-slate-200 text-base rounded-xl focus:ring-slate-900 focus:border-slate-900"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isSubmitting}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Confirm Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-slate-400" />
                      </div>
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-11 pr-11 py-6 bg-slate-50/50 border-slate-200 text-base rounded-xl focus:ring-slate-900 focus:border-slate-900"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={isSubmitting}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-6 text-base font-medium bg-slate-900 text-white hover:bg-slate-800 shadow-md transition-all rounded-xl"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
