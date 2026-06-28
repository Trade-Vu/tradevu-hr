import React, { useState } from 'react';
import { gqlClient } from '@/api/graphqlClient';
import { gql } from 'graphql-request';
import { Mail, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';

const REQUEST_RESET_MUTATION = gql`
  mutation RequestPasswordReset($email: String!) {
    requestPasswordReset(email: $email)
  }
`;

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      await gqlClient.request(REQUEST_RESET_MUTATION, { email });

      // We always show success to prevent email enumeration attacks
      setIsSuccess(true);
    } catch (err) {
      console.error('Password reset error:', err);
      setError('An error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans">
      <div className="w-full flex flex-col items-center justify-center p-8 sm:p-12 relative z-10">
        <div className="w-full max-w-md space-y-10 bg-white p-8 sm:p-10 rounded-2xl shadow-xl border border-slate-100">
          <div className="text-center">
            <img src="/logo-icon.png" alt="TradeVu Logo" className="w-12 h-auto mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Reset Password</h1>
            <p className="text-slate-500 mt-2 text-base">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          {isSuccess ? (
            <div className="text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-medium text-slate-900">Check your email</h3>
              <p className="text-slate-600">
                If an account exists for <span className="font-medium text-slate-900">{email}</span>, you will receive password reset instructions shortly.
              </p>
              <div className="pt-4">
                <Link to="/login" className="text-slate-900 font-medium hover:underline flex items-center justify-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Return to login
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm font-medium">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <Input
                    type="email"
                    placeholder="name@tradevu.com"
                    className="pl-11 py-6 bg-slate-50/50 border-slate-200 text-base rounded-xl focus:ring-slate-900 focus:border-slate-900 transition-colors"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full py-6 text-base font-medium bg-slate-900 text-white hover:bg-slate-800 shadow-md transition-all rounded-xl"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  'Send Reset Link'
                )}
              </Button>

              <div className="text-center pt-2">
                <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 hover:underline flex items-center justify-center gap-1.5">
                  <ArrowLeft className="w-4 h-4" />
                  Back to login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
