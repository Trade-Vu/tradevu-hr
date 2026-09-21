import React, { useState, useEffect } from 'react';
import { authApi } from '@/api/auth.api';
import { Lock, Loader2, ArrowRight, UserCircle, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { PAGE_ROUTES } from '@/constants/pageRoutes';
import { ellipsifyMiddle } from '@/lib/utils';
import { toast } from 'sonner';

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

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
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    authApi.getInviteDetails(token)
      .then((details) => {
        if (cancelled) return;
        setInviteDetails(details);

        // Prefill from the name collected when the invite was sent (e.g. the "Add
        // Employee" form). Skip generic placeholders the backend falls back to for
        // ad hoc email-only invites (InviteHRModal, the optional HR email at
        // registration) that never collected a real name - leave those blank for
        // the invitee to fill in themselves.
        const placeholderNames = ['hr manager', 'employee'];
        const fullName = details?.fullName?.trim();
        if (fullName && !placeholderNames.includes(fullName.toLowerCase())) {
          const [first, ...rest] = fullName.split(' ');
          setFirstName(first || '');
          setLastName(rest.join(' '));
        }
      })
      .catch((err) => {
        if (cancelled) return;
        const fallback = err.status === 404
          ? 'This invite link is invalid, has expired, or the service is temporarily unavailable. Please try again shortly or request a new invite.'
          : 'This invite link is invalid or has expired. Please request a new one.';
        setError(ellipsifyMiddle(err.message || fallback, 160));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!token) {
      setError('Invalid or missing invite token.');
      return;
    }

    if (!firstName || !lastName) {
      toast.error('Please enter your first and last name.');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
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
        // No need to refresh AuthContext's user here: window.location.href below
        // is a full page navigation, which re-initializes the whole app (and
        // AuthProvider's own auth check) from scratch anyway. Calling
        // checkAppState() here used to flip the global isLoadingAuth flag mid-flight,
        // which made App.jsx swap to its full-screen spinner and unmount this
        // component, then remount it fresh once loading finished — the fresh
        // mount re-ran the invite-lookup effect against an already-consumed
        // token, flashing an "invite invalid" error just before the original,
        // still-pending setTimeout below fired the real redirect anyway.
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
      setError(ellipsifyMiddle(err.message || 'Failed to complete account setup. The link may be invalid or expired.', 160));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-slate-800" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen font-sans bg-slate-50">
      <div className="relative z-10 flex flex-col items-center justify-center w-full p-8 sm:p-12">
        <div className="w-full max-w-md p-8 space-y-8 bg-white border shadow-xl sm:p-10 rounded-2xl border-slate-100">
          
          {error ? (
            <div className="space-y-6 text-center">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-full bg-red-50">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-medium font-heading text-slate-900">Invite Invalid</h3>
              <p className="text-slate-600">{error}</p>
              <Button onClick={() => navigate(PAGE_ROUTES.LOGIN)} className="w-full mt-4">
                Return to Login
              </Button>
            </div>
          ) : isSuccess ? (
            <div className="space-y-6 text-center">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-green-100 rounded-full">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-medium font-heading text-slate-900">Welcome to Tradevu HR</h3>
              <p className="text-slate-600">
                Your account has been created successfully. Redirecting you to your dashboard...
              </p>
            </div>
          ) : (
            <>
              <div className="text-center">
                <img src="/logo-icon.png" alt="Tradevu Logo" className="w-12 h-auto mx-auto mb-6" />
                <h1 className="text-3xl font-bold tracking-tight font-heading text-slate-900">Join {inviteDetails?.organizationName}</h1>
                <p className="mt-2 text-base text-slate-500">
                  You've been invited as {inviteDetails?.role === 'HR_ADMIN' ? 'an HR Manager' : 'an Employee'}.<br/>
                  <span className="font-medium text-slate-700">{inviteDetails?.email}</span>
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-slate-700">First Name</label>
                    <Input
                      type="text"
                      placeholder="Jane"
                      className="py-6 text-base bg-slate-50/50 border-slate-200 rounded-xl focus:ring-slate-900 focus:border-slate-900"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-slate-700">Last Name</label>
                    <Input
                      type="text"
                      placeholder="Doe"
                      className="py-6 text-base bg-slate-50/50 border-slate-200 rounded-xl focus:ring-slate-900 focus:border-slate-900"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-slate-700">Create Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Lock className="w-5 h-5 text-slate-400" />
                      </div>
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="py-6 text-base pl-11 pr-11 bg-slate-50/50 border-slate-200 rounded-xl focus:ring-slate-900 focus:border-slate-900"
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
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-slate-700">Confirm Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Lock className="w-5 h-5 text-slate-400" />
                      </div>
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="py-6 text-base pl-11 pr-11 bg-slate-50/50 border-slate-200 rounded-xl focus:ring-slate-900 focus:border-slate-900"
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
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-6 text-base font-medium text-white transition-all shadow-md bg-slate-900 hover:bg-slate-800 rounded-xl"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
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
