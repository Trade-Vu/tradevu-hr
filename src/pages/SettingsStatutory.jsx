import React, { useState, useEffect } from "react";
import { payrollApi } from "@/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Save, Plus, Trash2 } from "lucide-react";

const DEFAULT_SETTINGS = {
  currency: 'NGN',
  taxBrackets: [],
  pensionEmployeeRate: 0,
  pensionEmployerRate: 0,
  nsitfRate: 0,
  itfRate: 0,
  payslipMessage: '',
};

export default function SettingsStatutory() {
  const queryClient = useQueryClient();
  const [config, setConfig] = useState(DEFAULT_SETTINGS);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['payroll-settings'],
    queryFn: () => payrollApi.getSettings(),
  });

  useEffect(() => {
    if (settings) setConfig({ ...DEFAULT_SETTINGS, ...settings });
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: (newConfig) => payrollApi.updateSettings(newConfig),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-settings'] });
      toast.success("Statutory settings saved");
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to save settings"),
  });

  const addBracket = () => {
    setConfig(prev => ({ ...prev, taxBrackets: [...prev.taxBrackets, { min: 0, max: 0, rate: 0 }] }));
  };

  const updateBracket = (index, field, value) => {
    setConfig(prev => ({
      ...prev,
      taxBrackets: prev.taxBrackets.map((b, i) => i === index ? { ...b, [field]: Number(value) || 0 } : b),
    }));
  };

  const removeBracket = (index) => {
    setConfig(prev => ({ ...prev, taxBrackets: prev.taxBrackets.filter((_, i) => i !== index) }));
  };

  if (isLoading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Statutory Configuration</h1>
          <p className="text-slate-600">Configure currency, income tax brackets, and statutory contribution rates used when running payroll.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Currency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-w-xs">
              <Label>Payroll Currency</Label>
              <Input
                value={config.currency}
                onChange={e => setConfig({ ...config, currency: e.target.value.toUpperCase() })}
                maxLength={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Income Tax</CardTitle>
            <CardDescription>Progressive monthly tax brackets. Income within each bracket is taxed at that bracket's rate.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {config.taxBrackets.length === 0 ? (
              <p className="text-sm text-slate-500">No tax brackets configured — income tax will be calculated as 0. Add a single bracket (e.g. Min 0, Max a very large number) for a flat rate.</p>
            ) : (
              <div className="space-y-2">
                {config.taxBrackets.map((bracket, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end">
                    <div className="space-y-1">
                      {idx === 0 && <Label className="text-xs text-slate-500">Min Income</Label>}
                      <Input type="number" value={bracket.min} onChange={e => updateBracket(idx, 'min', e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      {idx === 0 && <Label className="text-xs text-slate-500">Max Income</Label>}
                      <Input type="number" value={bracket.max} onChange={e => updateBracket(idx, 'max', e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      {idx === 0 && <Label className="text-xs text-slate-500">Rate (%)</Label>}
                      <Input type="number" value={bracket.rate} onChange={e => updateBracket(idx, 'rate', e.target.value)} />
                    </div>
                    <Button type="button" size="icon" variant="ghost" onClick={() => removeBracket(idx)}>
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <Button type="button" size="sm" variant="outline" onClick={addBracket}>
              <Plus className="w-4 h-4 mr-1" /> Add Bracket
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pension</CardTitle>
            <CardDescription>Employee contribution is deducted from net pay; employer contribution is tracked as a cost only.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Employee Contribution (%)</Label>
                <Input
                  type="number"
                  value={config.pensionEmployeeRate}
                  onChange={e => setConfig({ ...config, pensionEmployeeRate: Number(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Employer Contribution (%)</Label>
                <Input
                  type="number"
                  value={config.pensionEmployerRate}
                  onChange={e => setConfig({ ...config, pensionEmployerRate: Number(e.target.value) || 0 })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Other Statutory Contributions</CardTitle>
            <CardDescription>Employer cost only, not deducted from employee net pay.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>NSITF Rate (%)</Label>
                <Input type="number" value={config.nsitfRate} onChange={e => setConfig({ ...config, nsitfRate: Number(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>ITF Rate (%)</Label>
                <Input type="number" value={config.itfRate} onChange={e => setConfig({ ...config, itfRate: Number(e.target.value) || 0 })} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payslip Message</CardTitle>
            <CardDescription>Optional note shown on every generated payslip.</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={config.payslipMessage}
              onChange={e => setConfig({ ...config, payslipMessage: e.target.value })}
              rows={3}
            />
          </CardContent>
        </Card>

        <Button
          className="bg-slate-900 text-white"
          onClick={() => updateMutation.mutate(config)}
          disabled={updateMutation.isPending}
        >
          <Save className="w-4 h-4 mr-2" />
          {updateMutation.isPending ? 'Saving...' : 'Save Configuration'}
        </Button>
      </div>
    </div>
  );
}
