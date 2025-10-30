import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Laptop, Plus, Monitor, Smartphone, Tablet, MoreVertical } from "lucide-react";

const assetIcons = {
  laptop: Laptop,
  monitor: Monitor,
  phone: Smartphone,
  tablet: Tablet,
  desktop: Laptop,
};

export default function Assets() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    asset_name: '',
    asset_type: 'laptop',
    serial_number: '',
    assigned_to: '',
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };
    loadUser();
  }, []);

  const { data: assets = [] } = useQuery({
    queryKey: ['assets'],
    queryFn: () => base44.entities.Asset.list('-created_date'),
    initialData: [],
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list(),
    initialData: [],
  });

  const createAssetMutation = useMutation({
    mutationFn: (data) => {
      const employee = employees.find(e => e.email === data.assigned_to);
      
      return base44.entities.Asset.create({
        ...data,
        organization_id: user.organization_id,
        assigned_to_name: employee?.full_name,
        assigned_date: new Date().toISOString().split('T')[0],
        assignment_status: data.assigned_to ? 'assigned' : 'available',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      setShowForm(false);
      setFormData({
        asset_name: '',
        asset_type: 'laptop',
        serial_number: '',
        assigned_to: '',
      });
    },
  });

  const statusColors = {
    active: 'bg-green-100 text-green-700',
    inactive: 'bg-blue-100 text-blue-700',
    in_repair: 'bg-yellow-100 text-yellow-700',
    broken: 'bg-red-100 text-red-700',
    retired: 'bg-slate-100 text-slate-700',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-start">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm mb-4">
              <Laptop className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-slate-700">Asset Management</span>
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-3">Assets</h1>
            <p className="text-lg text-slate-600">Track and manage company assets</p>
          </div>
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-green-600 to-emerald-600">
                <Plus className="w-4 h-4 mr-2" />
                Add Asset
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Asset</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); createAssetMutation.mutate(formData); }} className="space-y-4">
                <div className="space-y-2">
                  <Label>Asset Name</Label>
                  <Input placeholder="e.g., Macbook Air 2024" value={formData.asset_name} onChange={(e) => setFormData(prev => ({ ...prev, asset_name: e.target.value }))} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={formData.asset_type} onValueChange={(value) => setFormData(prev => ({ ...prev, asset_type: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="laptop">Laptop</SelectItem>
                        <SelectItem value="desktop">Desktop</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="tablet">Tablet</SelectItem>
                        <SelectItem value="monitor">Monitor</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Serial Number</Label>
                    <Input value={formData.serial_number} onChange={(e) => setFormData(prev => ({ ...prev, serial_number: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Assign To (Optional)</Label>
                  <Select value={formData.assigned_to} onValueChange={(value) => setFormData(prev => ({ ...prev, assigned_to: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Not assigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>Not Assigned</SelectItem>
                      {employees.map(emp => (
                        <SelectItem key={emp.id} value={emp.email}>
                          {emp.full_name} - {emp.job_title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                  <Button type="submit" disabled={createAssetMutation.isPending}>
                    {createAssetMutation.isPending ? 'Adding...' : 'Add Asset'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-slate-200">
          <CardHeader className="border-b bg-slate-50">
            <div className="flex items-center justify-between">
              <CardTitle>Assets</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost">
                  <Plus className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {assets.length === 0 ? (
              <div className="p-12 text-center">
                <Laptop className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500">No assets yet</p>
              </div>
            ) : (
              <div className="divide-y">
                {assets.map(asset => {
                  const Icon = assetIcons[asset.asset_type] || Laptop;
                  return (
                    <div key={asset.id} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                          <Icon className="w-6 h-6 text-slate-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-900">{asset.asset_name}</h4>
                          <p className="text-sm text-slate-500">{asset.asset_type}</p>
                        </div>
                        <div className="text-center">
                          {asset.assigned_to ? (
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-700 text-xs font-semibold">
                                  {asset.assigned_to_name?.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="text-left">
                                <p className="text-sm font-medium text-slate-900">{asset.assigned_to_name}</p>
                                <p className="text-xs text-slate-500">Assigned</p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                                <span className="text-slate-400 text-xs">--</span>
                              </div>
                              <div className="text-left">
                                <p className="text-sm text-slate-500">Not Assigned</p>
                              </div>
                            </div>
                          )}
                        </div>
                        <Badge className={statusColors[asset.status || 'active']}>
                          {asset.status || 'Active'}
                        </Badge>
                        <Button size="sm" variant="ghost">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}