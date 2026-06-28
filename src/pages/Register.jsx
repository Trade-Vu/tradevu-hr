import React, { useState } from 'react';
import { Mail, Lock, Building2, ArrowRight, ArrowLeft, UserCircle, CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link, useNavigate } from 'react-router-dom';
import { gqlClient } from '@/api/graphqlClient';
import { gql } from 'graphql-request';
import { useAuth } from '@/lib/AuthContext';

const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      token
      user {
        id
        email
        role
        organizationId
      }
    }
  }
`;

const INVITE_HR_MUTATION = gql`
  mutation InviteHRAdmin($email: String!) {
    inviteUser(email: $email, role: "HR_ADMIN") {
      id
      email
    }
  }
`;

export default function Register() {
  const navigate = useNavigate();
  const { checkAppState } = useAuth();
  const [step, setStep] = useState(1);
  const [orgName, setOrgName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [defaultEmployeePassword, setDefaultEmployeePassword] = useState('');
  const [hrEmail, setHrEmail] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showDefaultPassword, setShowDefaultPassword] = useState(false);

  const handleNext = (e) => {
    e.preventDefault();
    if (step < 5) {
      setStep(step + 1);
    } else {
      handleCompleteSetup();
    }
  };

  const handleCompleteSetup = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      // Step 1: Create the CEO account and organization via real GraphQL mutation
      const data = await gqlClient.request(REGISTER_MUTATION, {
        input: {
          email,
          password,
          orgName,
        }
      });

      if (data.register?.token) {
        localStorage.setItem('token', data.register.token);

        // Step 2: If an HR email was provided, send them an invite
        if (hrEmail) {
          try {
            await gqlClient.request(INVITE_HR_MUTATION, { email: hrEmail });
          } catch (inviteErr) {
            // Non-fatal: registration succeeded even if invite fails
            console.warn('HR invite failed (non-fatal):', inviteErr);
          }
        }

        // Step 3: Sync auth state and redirect
        await checkAppState();
        setIsComplete(true);
        setTimeout(() => navigate('/dashboard'), 1500);
      }
    } catch (err) {
      console.error('Registration error:', err);
      const msg = err.response?.errors?.[0]?.message || 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-sans">
      {/* Left Panel: Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 sm:p-12 lg:p-24 relative z-10">
        <div className="w-full max-w-md space-y-10">
          <div className="text-left">
            <img src="/logo-icon.png" alt="TradeVu Logo" className="w-16 h-auto mb-8" />
            
            {/* Step Indicators */}
            {!isComplete && (
              <div className="flex gap-2 mb-8">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div 
                    key={i} 
                    className={`h-1.5 rounded-full flex-1 transition-all duration-300 ${
                      step >= i ? 'bg-slate-900' : 'bg-slate-200'
                    }`} 
                  />
                ))}
              </div>
            )}

            {isComplete ? (
              <>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h1 className="text-4xl font-bold text-slate-900 tracking-tight">You're all set!</h1>
                <p className="text-slate-500 mt-3 text-lg mb-8">
                  Your workspace has been created. Redirecting to your dashboard...
                </p>
                <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
              </>
            ) : (
              <>
                <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
                  {step === 1 && "Create workspace"}
                  {step === 2 && "Admin email"}
                  {step === 3 && "Secure account"}
                  {step === 4 && "Employee defaults"}
                  {step === 5 && "Invite HR Team"}
                </h1>
                <p className="text-slate-500 mt-3 text-lg">
                  {step === 1 && "Set up TradeVu HR for your organization."}
                  {step === 2 && "How should we contact you?"}
                  {step === 3 && "Create a secure password for your admin account."}
                  {step === 4 && "Set the default password for new employee invites."}
                  {step === 5 && "Invite your HR manager to help you set up."}
                </p>
              </>
            )}
          </div>

          {!isComplete && (
            <form onSubmit={handleNext} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium">
                  {error}
                </div>
              )}
                {step === 1 && (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Organization Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Building2 className="h-5 w-5 text-slate-400" />
                      </div>
                      <Input
                        type="text"
                        placeholder="Acme Corp"
                        className="pl-11 py-6 bg-slate-50/50 border-slate-200 text-base rounded-xl focus:ring-slate-900 focus:border-slate-900 transition-colors"
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        autoFocus
                        required
                      />
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Work Email Address</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-slate-400" />
                      </div>
                      <Input
                        type="email"
                        placeholder="name@company.com"
                        className="pl-11 py-6 bg-slate-50/50 border-slate-200 text-base rounded-xl focus:ring-slate-900 focus:border-slate-900 transition-colors"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoFocus
                        required
                      />
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Admin Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-slate-400" />
                      </div>
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-11 pr-11 py-6 bg-slate-50/50 border-slate-200 text-base rounded-xl focus:ring-slate-900 focus:border-slate-900 transition-colors"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoFocus
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
                )}

                {step === 4 && (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Default Employee Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-slate-400" />
                      </div>
                      <Input
                        type={showDefaultPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-11 pr-11 py-6 bg-slate-50/50 border-slate-200 text-base rounded-xl focus:ring-slate-900 focus:border-slate-900 transition-colors"
                        value={defaultEmployeePassword}
                        onChange={(e) => setDefaultEmployeePassword(e.target.value)}
                        autoFocus
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowDefaultPassword(!showDefaultPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                      >
                        {showDefaultPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    <p className="text-sm text-slate-500 mt-2">All employees will use this password to sign up for the first time.</p>
                  </div>
                )}

                {step === 5 && (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                    <label className="block text-sm font-medium text-slate-700 mb-2">HR Email Address (Optional)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-slate-400" />
                      </div>
                      <Input
                        type="email"
                        placeholder="hr@company.com"
                        className="pl-11 py-6 bg-slate-50/50 border-slate-200 text-base rounded-xl focus:ring-slate-900 focus:border-slate-900 transition-colors"
                        value={hrEmail}
                        onChange={(e) => setHrEmail(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <p className="text-sm text-slate-500 mt-2">We'll send them an invite link right away to help manage your platform.</p>
                  </div>
                )}

              <div className="flex gap-4 pt-4">
                {step > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    className="py-6 px-6 text-base font-medium rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50"
                  >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back
                  </Button>
                )}
                
                <Button
                  type="submit"
                  className="flex-1 py-6 text-base font-medium bg-slate-900 text-white hover:bg-slate-800 shadow-md hover:shadow-lg transition-all rounded-xl"
                  disabled={
                    isSubmitting ||
                    (step === 1 && !orgName) || 
                    (step === 2 && !email) || 
                    (step === 3 && !password) ||
                    (step === 4 && !defaultEmployeePassword)
                  }
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <>
                      {step < 5 ? 'Continue' : 'Complete Setup'}
                      {step < 5 && <ArrowRight className="w-5 h-5 ml-2" />}
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
          
          <div className="text-center pt-6">
            <p className="text-sm text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-slate-900 hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel: Showcase */}
      <div className="hidden lg:block lg:w-1/2 relative bg-slate-900 overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-slate-900/40 mix-blend-multiply z-10" />
        
        <img 
          src="/bg-login.png" 
          alt="TradeVu Abstract" 
          className="absolute inset-0 w-full h-full object-cover opacity-90 scale-105" 
        />
        
        <div className="absolute inset-0 z-20 flex flex-col justify-end p-16 pb-24 text-white bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent">
          <div className="max-w-xl">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight tracking-tight text-white drop-shadow-sm">
              Your OS for HR
            </h2>
            <p className="text-lg lg:text-xl text-slate-200 leading-relaxed font-light drop-shadow">
              Centralize your operations and build a world-class workplace from day one.
            </p>
          </div>
          
          <div className="mt-12 flex items-center space-x-6">
            <div className="flex -space-x-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center overflow-hidden">
                  <UserCircle className="w-8 h-8 text-slate-400" />
                </div>
              ))}
            </div>
            <p className="text-sm font-medium text-slate-300">
              Join <span className="text-white">10,000+</span> companies
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
