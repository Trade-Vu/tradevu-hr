
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Building2, CreditCard, Users, Settings as SettingsIcon, Upload, Activity } from "lucide-react";
import { format } from "date-fns";

export default function Settings() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);

        if (currentUser.organization_id) {
          const orgs = await base44.entities.Organization.filter({ id: currentUser.organization_id });
          if (orgs.length > 0) {
            setOrganization(orgs[0]);
            setFormData({
              name: orgs[0].name,
              phone: orgs[0].phone || '',
              email: orgs[0].email || '',
              city: orgs[0].city || '',
              address: orgs[0].address || '',
            });
          }
        }
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };
    loadData();
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    city: '',
    address: '',
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => base44.entities.AuditLog.list('-timestamp'),
    initialData: [],
  });

  const updateOrganizationMutation = useMutation({
    mutationFn: (data) => base44.entities.Organization.update(organization.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.Organization.update(organization.id, { logo_url: file_url });
      queryClient.invalidateQueries();
    } catch (error) {
      console.error("Error uploading logo:", error);
    }
    setUploadingLogo(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateOrganizationMutation.mutate(formData);
  };

  if (!organization) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  const planFeatures = {
    trial: ['All features', '14-day trial', 'Up to 50 employees'],
    starter: ['Basic features', 'Up to 50 employees', 'Email support'],
    professional: ['All features', 'Up to 200 employees', 'Priority support', 'Custom branding'],
    enterprise: ['All features', 'Unlimited employees', '24/7 support', 'Custom integrations', 'Dedicated account manager'],
  };

  const daysUntilExpiry = organization.trial_ends_at 
    ? Math.ceil((new Date(organization.trial_ends_at) - new Date()) / (1000 * 60 * 60 * 24))
    : 0;

  const actionColors = {
    create: 'bg-green-100 text-green-700',
    update: 'bg-blue-100 text-blue-700',
    delete: 'bg-red-100 text-red-700',
    approve: 'bg-purple-100 text-purple-700',
    reject: 'bg-orange-100 text-orange-700',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm mb-4">
            <SettingsIcon className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-slate-700">Organization Settings</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-3">
            Settings
          </h1>
          <p className="text-lg text-slate-600">
            Manage your organization settings and subscription
          </p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="bg-white border border-slate-200">
            <TabsTrigger value="general">
              <Building2 className="w-4 h-4 mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger value="subscription">
              <CreditCard className="w-4 h-4 mr-2" />
              Subscription
            </TabsTrigger>
            <TabsTrigger value="logs">
              <Activity className="w-4 h-4 mr-2" />
              System Logs
            </TabsTrigger>
            <TabsTrigger value="team">
              <Users className="w-4 h-4 mr-2" />
              Team
            </TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general">
            <Card className="border-slate-200">
              <CardHeader className="border-b border-slate-200">
                <CardTitle>Organization Details</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Logo Upload */}
                  <div className="space-y-2">
                    <Label>Organization Logo</Label>
                    <div className="flex items-center gap-4">
                      {organization.logo_url ? (
                        <img src={organization.logo_url} alt="Logo" className="w-20 h-20 rounded-lg object-cover border border-slate-200" />
                      ) : (
                        <div className="w-20 h-20 bg-slate-100 rounded-lg flex items-center justify-center">
                          <Building2 className="w-8 h-8 text-slate-400" />
                        </div>
                      )}
                      <div>
                        <input
                          type="file"
                          id="logo"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('logo').click()}
                          disabled={uploadingLogo}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Organization Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={updateOrganizationMutation.isPending}>
                      {updateOrganizationMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscription Tab */}
          <TabsContent value="subscription">
            <Card className="border-slate-200">
              <CardHeader className="border-b border-slate-200">
                <CardTitle>Subscription & Billing</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Current Plan */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 mb-1 capitalize">{organization.subscription_plan} Plan</h3>
                      <Badge className={
                        organization.subscription_status === 'trial' ? 'bg-yellow-100 text-yellow-700' :
                        organization.subscription_status === 'active' ? 'bg-green-100 text-green-700' :
                        'bg-red-100 text-red-700'
                      }>
                        {organization.subscription_status}
                      </Badge>
                    </div>
                    {organization.subscription_status === 'trial' && (
                      <div className="text-right">
                        <p className="text-sm text-slate-600">Trial ends in</p>
                        <p className="text-2xl font-bold text-blue-600">{daysUntilExpiry} days</p>
                      </div>
                    )}
                  </div>
                  <ul className="space-y-2">
                    {planFeatures[organization.subscription_plan]?.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm text-slate-700">
                        <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Usage */}
                <div>
                  <h4 className="font-semibold text-slate-900 mb-3">Usage</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Employees</span>
                      <span className="font-medium text-slate-900">0 / {organization.max_employees}</span>
                    </div>
                  </div>
                </div>

                {organization.subscription_status === 'trial' && (
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600">
                    Upgrade Now
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Logs Tab */}
          <TabsContent value="logs">
            <Card className="border-slate-200">
              <CardHeader className="border-b border-slate-200">
                <CardTitle>System Activity Logs</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {auditLogs.length === 0 ? (
                  <div className="p-12 text-center">
                    <Activity className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                    <p className="text-slate-500">No activity logs yet</p>
                  </div>
                ) : (
                  <div className="max-h-[600px] overflow-y-auto">
                    {auditLogs.map(log => (
                      <div key={log.id} className="p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Badge variant="outline" className={actionColors[log.action] || 'bg-slate-100 text-slate-700'}>
                                {log.action}
                              </Badge>
                              <span className="text-sm font-medium text-slate-900">
                                {log.entity_type}
                              </span>
                            </div>
                            <p className="text-sm text-slate-600 mb-2">
                              <strong>{log.user_name}</strong> ({log.user_email}) {log.action}d {log.entity_name || log.entity_type}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-slate-500">
                              <span>🕐 {format(new Date(log.timestamp || log.created_date), 'MMM d, yyyy h:mm a')}</span>
                              {log.ip_address && <span>📍 IP: {log.ip_address}</span>}
                              {log.device_info?.device_type && <span>💻 {log.device_info.device_type}</span>}
                              {log.location?.city && <span>🌍 {log.location.city}, {log.location.country}</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team">
            <Card className="border-slate-200">
              <CardHeader className="border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <CardTitle>Team Members</CardTitle>
                  <Button>
                    <Users className="w-4 h-4 mr-2" />
                    Invite Member
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center py-12">
                  <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-500">Team management coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
