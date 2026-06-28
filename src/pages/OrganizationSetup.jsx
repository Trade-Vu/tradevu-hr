import React, { useState, useEffect } from "react";
import { gqlClient } from "@/api/graphqlClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Users, Rocket, CheckCircle } from "lucide-react";
import { Country, City } from 'country-state-city';
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "@/components/ui/use-toast";

export default function OrganizationSetup({ asModal = false, onComplete }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    industry: 'technology',
    size: '1-10',
    country: 'Saudi Arabia',
    city: 'Riyadh',
    phone: '',
    email: user?.email || '',
    subscription_plan: 'trial',
  });

  const createOrganizationMutation = useMutation({
    mutationFn: async (data) => {
      console.log("Mock create organization", data);
      
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 14);

      const features_enabled = {
        attendance: true,
        payroll: true,
        recruitment: true,
        lms: true,
        surveys: true,
        expenses: true,
        zkteco: false,
        whatsapp: false,
        ai_features: true,
      };

      const org = {
        ...data,
        id: `org_${Date.now()}`,
        owner_email: user.email,
        subscription_status: 'trial',
        trial_ends_at: trialEndsAt.toISOString().split('T')[0],
        max_employees: 50,
        features_enabled,
      };

      return org;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      toast({
        title: "Success",
        description: "Organization details updated.",
      });
      if (onComplete) {
        onComplete();
      } else {
        setStep(3);
        setTimeout(() => {
          navigate('/Dashboard');
        }, 2000);
      }
    },
  });

  const handleLoginBypass = () => {
    localStorage.setItem('token', 'mock_ceo_token');
    window.location.href = '/dashboard';
  };

  const countries = Country.getAllCountries();
  const selectedCountryCode = countries.find(c => c.name === formData.country)?.isoCode;
  const cities = selectedCountryCode ? City.getCitiesOfCountry(selectedCountryCode) : [];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      createOrganizationMutation.mutate(formData);
    }
  };

  const content = (
    <Card className="max-w-2xl w-full shadow-2xl border-0 bg-white rounded-[2rem] overflow-hidden relative z-10">
      <CardHeader className="border-b border-slate-100 p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-100 to-transparent rounded-full blur-3xl -mr-10 -mt-10 opacity-60"></div>
        <div className="text-center relative z-10">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-[1rem] flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-600/20 transform hover:scale-105 transition-transform">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-extrabold mb-1.5 tracking-tight text-slate-900">Welcome to EonHR! 🎉</CardTitle>
            <p className="text-sm sm:text-base text-slate-500 font-medium">Let's set up your organization in just a few steps</p>
          </div>
        </CardHeader>

        <CardContent className="p-6 sm:p-8">
          {step === 3 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">All Set! 🚀</h2>
              <p className="text-slate-600 mb-2">Your organization has been created successfully.</p>
              <p className="text-sm text-slate-500">Redirecting to dashboard...</p>
            </div>
          ) : (
            <>
              {/* Progress Steps */}
              <div className="flex items-center justify-center mb-6">
                <div className={`flex items-center ${step >= 1 ? 'text-blue-600' : 'text-slate-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}>
                    1
                  </div>
                  <span className="ml-2 text-sm font-semibold">Company Info</span>
                </div>
                <div className={`w-12 h-0.5 mx-3 ${step >= 2 ? 'bg-blue-600' : 'bg-slate-200'}`} />
                <div className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-slate-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}>
                    2
                  </div>
                  <span className="ml-2 text-sm font-semibold">Details</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {step === 1 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="industry" className="text-sm font-semibold text-slate-700">Industry</Label>
                        <Select value={formData.industry} onValueChange={(value) => setFormData(prev => ({ ...prev, industry: value }))}>
                          <SelectTrigger className="bg-white border-slate-200 h-12 rounded-xl text-slate-900 font-medium shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0 focus:border-indigo-500">
                            <SelectValue placeholder="Select Industry" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="technology">Technology</SelectItem>
                            <SelectItem value="healthcare">Healthcare</SelectItem>
                            <SelectItem value="education">Education</SelectItem>
                            <SelectItem value="retail">Retail</SelectItem>
                            <SelectItem value="manufacturing">Manufacturing</SelectItem>
                            <SelectItem value="finance">Finance</SelectItem>
                            <SelectItem value="hospitality">Hospitality</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="size" className="text-sm font-semibold text-slate-700">Company Size</Label>
                        <Select value={formData.size} onValueChange={(value) => setFormData(prev => ({ ...prev, size: value }))}>
                          <SelectTrigger className="bg-white border-slate-200 h-12 rounded-xl text-slate-900 font-medium shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0 focus:border-indigo-500">
                            <SelectValue placeholder="Select Size" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1-10">1-10 employees</SelectItem>
                            <SelectItem value="11-50">11-50 employees</SelectItem>
                            <SelectItem value="51-200">51-200 employees</SelectItem>
                            <SelectItem value="201-500">201-500 employees</SelectItem>
                            <SelectItem value="501-1000">501-1000 employees</SelectItem>
                            <SelectItem value="1000+">1000+ employees</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="country" className="text-sm font-semibold text-slate-700">Country</Label>
                        <Select value={formData.country} onValueChange={(value) => setFormData(prev => ({ ...prev, country: value, city: '' }))}>
                          <SelectTrigger className="bg-white border-slate-200 h-12 rounded-xl text-slate-900 font-medium shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0 focus:border-indigo-500">
                            <SelectValue placeholder="Select Country" />
                          </SelectTrigger>
                          <SelectContent>
                            {countries.map(c => (
                              <SelectItem key={c.isoCode} value={c.name}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="city" className="text-sm font-semibold text-slate-700">City</Label>
                        <Select value={formData.city} onValueChange={(value) => setFormData(prev => ({ ...prev, city: value }))} disabled={!formData.country || cities.length === 0}>
                          <SelectTrigger className="bg-white border-slate-200 h-12 rounded-xl text-slate-900 font-medium shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0 focus:border-indigo-500">
                            <SelectValue placeholder={!formData.country ? "Select Country First" : cities.length === 0 ? "No Cities Found" : "Select City"} />
                          </SelectTrigger>
                          <SelectContent>
                            {cities.map(c => (
                              <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-semibold text-slate-700">Company Phone</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="+966 5X XXX XXXX"
                          className="bg-white border-slate-200 h-12 rounded-xl text-slate-900 font-medium shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-0 focus-visible:border-indigo-500 placeholder:text-slate-400"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-semibold text-slate-700">Company Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="contact@company.com"
                          className="bg-white border-slate-200 h-12 rounded-xl text-slate-900 font-medium shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-0 focus-visible:border-indigo-500 placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl p-4 shadow-sm flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm shrink-0">
                        <Rocket className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-indigo-900 text-sm">14-Day Free Trial</h4>
                        <p className="text-xs text-indigo-700 font-medium mt-0.5">
                          Start with a free trial. No credit card required.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between pt-8 border-t border-slate-100 mt-8">
                  {step > 1 && (
                    <Button type="button" variant="outline" onClick={() => setStep(step - 1)} className="h-12 px-8 rounded-xl font-semibold border-slate-200 text-slate-700 hover:bg-slate-50">
                      Back
                    </Button>
                  )}
                  <Button
                    type="submit"
                    className="ml-auto h-12 px-8 rounded-xl font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20"
                    isLoading={createOrganizationMutation.isPending}
                  >
                    {step === 1 ? 'Continue to Details' : createOrganizationMutation.isPending ? 'Creating...' : 'Complete Setup'}
                  </Button>
                </div>
              </form>
            </>
          )}
        </CardContent>
      </Card>
  );

  if (asModal) {
    return content;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[100px] mix-blend-multiply" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-[120px] mix-blend-multiply" />

      {content}
    </div>
  );
}