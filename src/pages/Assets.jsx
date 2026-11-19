import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { assetsApi, employeesApi } from "@/api";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { CardSpotlight } from "@/components/ui/card-spotlight";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import {
  Laptop,
  Plus,
  Monitor,
  Smartphone,
  Tablet,
  Edit,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  Clock,
  UserCheck,
  Search,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Layers,
  CreditCard,
  Wifi,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const assetIcons = {
  laptop: Laptop,
  monitor: Monitor,
  phone: Smartphone,
  tablet: Tablet,
  desktop: Laptop,
  id_card: CreditCard,
  modem: Wifi,
  equipment: Cpu,
  other: Layers,
};

export default function Assets() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [deletingAsset, setDeletingAsset] = useState(null);
  const [resolvingAsset, setResolvingAsset] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const [formData, setFormData] = useState({
    name: "",
    model: "",
    type: "laptop",
    serialNumber: "",
    specifications: "",
    condition: "good",
    notes: "",
    assignedTo: "none",
  });

  const { data: assetsData, isLoading: loadingAssets } = useQuery({
    queryKey: ["assets"],
    queryFn: async () => {
      const res = await assetsApi.getAssets({ limit: 200 });
      return Array.isArray(res) ? res : res?.data || [];
    },
  });

  const { data: employeesData = [] } = useQuery({
    queryKey: ["employees-for-assets"],
    queryFn: async () => {
      const res = await employeesApi.getEmployees({ limit: 200 });
      const list = Array.isArray(res) ? res : res?.data || [];
      return list.map((e) => ({
        id: e._id || e.id,
        fullName: e.fullName || `${e.firstName || ""} ${e.lastName || ""}`.trim() || e.email,
        email: e.email,
        jobTitle: e.jobTitle || "Team Member",
        avatarUrl: e.avatarUrl || null,
      }));
    },
  });

  const createAssetMutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        name: data.name,
        model: data.model,
        type: data.type,
        serialNumber: data.serialNumber,
        specifications: data.specifications,
        condition: data.condition,
        notes: data.notes,
        ...(data.assignedTo && data.assignedTo !== "none" ? { assignedTo: data.assignedTo } : {}),
      };
      return await assetsApi.createAsset(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      toast.success("Asset created and logged successfully");
      setShowForm(false);
      resetForm();
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || "Failed to create asset");
    },
  });

  const updateAssetMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const payload = {
        name: data.name,
        model: data.model,
        type: data.type,
        serialNumber: data.serialNumber,
        specifications: data.specifications,
        condition: data.condition,
        notes: data.notes,
      };

      if (data.assignedTo && data.assignedTo !== "none") {
        await assetsApi.assignAsset(id, {
          employeeId: data.assignedTo,
          specifications: data.specifications,
          condition: data.condition,
          serialNumber: data.serialNumber,
          notes: data.notes,
        });
      } else if (editingAsset?.assignedTo) {
        await assetsApi.unassignAsset(id);
      }

      return await assetsApi.updateAsset(id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      toast.success("Asset updated successfully");
      setShowForm(false);
      resetForm();
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || "Failed to update asset");
    },
  });

  const resolveDisputeMutation = useMutation({
    mutationFn: async ({ id, notes }) => {
      return await assetsApi.resolveDispute(id, notes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      toast.success("Dispute resolved successfully!");
      setResolvingAsset(null);
      setResolutionNotes("");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || "Failed to resolve dispute");
    },
  });

  const deleteAssetMutation = useMutation({
    mutationFn: async (id) => {
      return await assetsApi.deleteAsset(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      toast.success("Asset deleted successfully");
      setDeletingAsset(null);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || "Failed to delete asset");
    },
  });

  const resetForm = () => {
    setEditingAsset(null);
    setFormData({
      name: "",
      model: "",
      type: "laptop",
      serialNumber: "",
      specifications: "",
      condition: "good",
      notes: "",
      assignedTo: "none",
    });
  };

  const handleEdit = (asset) => {
    setEditingAsset(asset);
    setFormData({
      name: asset.name || "",
      model: asset.model || "",
      type: asset.type || "laptop",
      serialNumber: asset.serialNumber || "",
      specifications: asset.specifications || "",
      condition: asset.condition || "good",
      notes: asset.notes || "",
      assignedTo: asset.assignedTo?._id || asset.assignedTo?.id || asset.assignedTo || "none",
    });
    setShowForm(true);
  };

  const rawAssets = assetsData || [];
  const filteredAssets = rawAssets.filter((asset) => {
    const isDisputed = Boolean(
      asset.confirmation_status === "disputed" ||
      asset.confirmationStatus === "disputed" ||
      asset.is_disputed ||
      asset.isDisputed
    );

    const matchesSearch =
      searchTerm === "" ||
      asset.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.specifications?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.assignedTo?.fullName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = selectedType === "all" || asset.type?.toLowerCase() === selectedType.toLowerCase();
    const matchesStatus =
      selectedStatus === "all" ||
      (selectedStatus === "disputed" && isDisputed) ||
      (selectedStatus === "assigned" && asset.status === "assigned" && !isDisputed) ||
      (selectedStatus === "available" && asset.status !== "assigned") ||
      (selectedStatus === "pending" && asset.status === "assigned" && !asset.confirmedByEmployee && !isDisputed);

    return matchesSearch && matchesType && matchesStatus;
  });

  const totalCount = rawAssets.length;
  const disputedCount = rawAssets.filter(
    (a) => a.confirmation_status === "disputed" || a.confirmationStatus === "disputed" || a.is_disputed || a.isDisputed
  ).length;
  const assignedCount = rawAssets.filter((a) => a.status === "assigned" && a.assignedTo).length;
  const availableCount = totalCount - assignedCount;
  const pendingConfirmCount = rawAssets.filter(
    (a) =>
      a.status === "assigned" &&
      !a.confirmedByEmployee &&
      a.confirmationStatus !== "confirmed" &&
      !a.is_disputed &&
      !a.isDisputed
  ).length;

  // Pagination slice
  const paginatedAssets = filteredAssets.slice((page - 1) * limit, page * limit);
  const totalPages = Math.ceil(filteredAssets.length / limit) || 1;

  // 4 Spotlight Metric Cards
  const metrics = [
    {
      title: "Total Inventory",
      value: totalCount,
      subtext: "Company hardware registered",
      icon: Laptop,
      trend: `${totalCount} Assets`,
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200/60",
    },
    {
      title: "Assigned & Active",
      value: assignedCount,
      subtext: "Currently issued to staff",
      icon: UserCheck,
      trend: `${Math.round((assignedCount / (totalCount || 1)) * 100)}% Deployed`,
      badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200/60",
    },
    {
      title: "Awaiting Confirmation",
      value: pendingConfirmCount,
      subtext: "Receipt acknowledgment pending",
      icon: Clock,
      trend: pendingConfirmCount > 0 ? "Requires Action" : "Zero Backlog",
      badgeColor:
        pendingConfirmCount > 0
          ? "bg-amber-50 text-amber-700 border-amber-200/60"
          : "bg-slate-50 text-slate-700 border-slate-200/60",
    },
    {
      title: "Available in Stock",
      value: availableCount,
      subtext: "Ready for immediate issue",
      icon: CheckCircle2,
      trend: `${availableCount} Unassigned`,
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 mx-auto space-y-6 sm:space-y-8 max-w-7xl font-sans text-slate-900">
      {/* 1. Header with System Design Breadcrumb and Primary Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/70">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Asset & Hardware Management
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200/60">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Fleet Inventory</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Issue, track, and monitor company equipment and inspect signed employee receipt confirmations.
          </p>
        </div>

        <Button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="h-9 px-4 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-sm gap-1.5 self-start md:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add & Assign Asset</span>
        </Button>
      </div>

      {/* 2. KPI Spotlight Cards Grid (Exact Design System) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {metrics.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="group block focus:outline-none">
              <CardSpotlight
                radius={280}
                color="rgba(79, 70, 229, 0.06)"
                borderColor="rgba(79, 70, 229, 0.25)"
                className="h-full p-4 sm:p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md border-slate-200/80 bg-white rounded-xl"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                    <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                    {item.title}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-heading">
                      {item.value}
                    </span>
                  </div>
                </div>
              </CardSpotlight>
            </div>
          );
        })}
      </div>

      {/* 3. Main Workforce Overview Style Card for Assets */}
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-white border shadow-xs rounded-xl border-slate-200/80">
        {/* Table Header: Search & Filters */}
        <div className="p-4 sm:p-5 border-b border-slate-100 shrink-0">
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-base sm:text-lg font-semibold tracking-tight text-slate-900 font-heading">
                Hardware Inventory
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Browse, reassign, or inspect confirmation status for all organization equipment
              </p>
            </div>

            <div className="flex flex-wrap w-full sm:w-auto items-center gap-2.5">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute w-4 h-4 transform -translate-y-1/2 left-3 top-1/2 text-slate-400" />
                <Input
                  placeholder="Search asset, S/N, or employee..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-9 h-9 text-xs sm:text-sm bg-slate-50 border-slate-200 focus:bg-white rounded-lg"
                />
              </div>

              <Select
                value={selectedType}
                onValueChange={(val) => {
                  setSelectedType(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 text-xs bg-slate-50 border-slate-200 focus:bg-white rounded-lg w-32 sm:w-36">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="laptop">Laptops</SelectItem>
                  <SelectItem value="phone">Phones</SelectItem>
                  <SelectItem value="id_card">ID Badges / Cards</SelectItem>
                  <SelectItem value="modem">Modems / MiFi</SelectItem>
                  <SelectItem value="monitor">Monitors</SelectItem>
                  <SelectItem value="tablet">Tablets</SelectItem>
                  <SelectItem value="equipment">Other Gear</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={selectedStatus}
                onValueChange={(val) => {
                  setSelectedStatus(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 text-xs bg-slate-50 border-slate-200 focus:bg-white rounded-lg w-36 sm:w-44">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="available">Available in Stock</SelectItem>
                  <SelectItem value="assigned">Assigned & Active</SelectItem>
                  <SelectItem value="pending">Pending Confirmation</SelectItem>
                  <SelectItem value="disputed">Flagged for HR Review (Disputed)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="relative flex-1 min-h-[300px] overflow-x-auto">
          {loadingAssets ? (
            <div className="divide-y divide-slate-100">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="p-4 sm:p-5 flex items-center gap-4 animate-pulse">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-100 rounded w-1/4" />
                    <div className="h-3 bg-slate-100 rounded w-1/6" />
                  </div>
                  <div className="w-24 h-6 bg-slate-100 rounded-full" />
                </div>
              ))}
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-14 h-14 mx-auto mb-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-center text-slate-400">
                <Laptop className="w-7 h-7" />
              </div>
                <h4 className="text-sm font-semibold text-slate-800">No Hardware Found</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  {searchTerm || selectedType !== "all" || selectedStatus !== "all"
                    ? "No equipment matches your current search criteria."
                    : "No organization assets recorded. Click 'Add & Assign Asset' to start."}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                  {paginatedAssets.map((asset) => {
                    const IconComponent = assetIcons[asset.type?.toLowerCase()] || Laptop;
                    const isAssigned = asset.status === "assigned" && asset.assignedTo;
                    const isDisputed = Boolean(
                      asset.confirmation_status === "disputed" ||
                      asset.confirmationStatus === "disputed" ||
                      asset.is_disputed ||
                      asset.isDisputed
                    );
                    const isConfirmed =
                      !isDisputed &&
                      Boolean(
                        asset.confirmedByEmployee ||
                        asset.confirmationStatus === "confirmed" ||
                        asset.confirmed_by_employee
                      );

                    return (
                  <div
                    key={asset._id || asset.id}
                    className={`p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                      isDisputed ? "bg-rose-50/30 hover:bg-rose-50/50" : "hover:bg-slate-50/70"
                    }`}
                  >
                    {/* Device Details */}
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-center text-slate-700 shrink-0 shadow-2xs">
                        <IconComponent className="w-5 h-5 text-slate-700" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h4 className="text-sm font-semibold text-slate-900 truncate">
                            {asset.name}
                          </h4>
                          {asset.model && (
                            <span className="text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                              Model: {asset.model}
                            </span>
                          )}
                          <span className="text-[11px] font-medium capitalize px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                            {asset.type}
                          </span>
                          <span className="text-[11px] font-medium capitalize px-2 py-0.5 rounded-md bg-slate-100/70 text-slate-600">
                            {asset.condition || "Good"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2.5 text-xs text-slate-500 flex-wrap">
                          {asset.serialNumber && (
                            <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700 text-[11px] font-medium">
                              S/N: {asset.serialNumber}
                            </span>
                          )}
                          {asset.specifications && (
                            <span className="text-slate-600 truncate max-w-sm">
                              {asset.specifications}
                            </span>
                          )}
                        </div>

                        {/* Dispute Alert Banner */}
                        {isDisputed && (
                          <div className="mt-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200/90 text-xs text-rose-900 flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <span className="font-semibold text-rose-950 block">Employee Dispute Logged:</span>
                              <p className="text-[11px] text-rose-800">
                                &ldquo;{asset.dispute_reason || asset.disputeReason || "No explanation provided"}&rdquo;
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Assigned Personnel */}
                    <div className="w-full md:w-56 shrink-0 flex items-center gap-2.5">
                      {isAssigned ? (
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                            {(asset.assignedTo?.fullName || "E").charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-900 truncate">
                              {asset.assignedTo?.fullName || "Assigned Staff"}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate">
                              {asset.assignedAt ? `Issued ${format(new Date(asset.assignedAt), "MMM d, yyyy")}` : "Assigned"}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium italic">
                          Unassigned / In Stock
                        </span>
                      )}
                    </div>

                    {/* Status & Actions */}
                    <div className="w-full md:w-56 shrink-0 flex items-center justify-between md:justify-end gap-2">
                      {isDisputed ? (
                        <Badge className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full border bg-rose-50 text-rose-700 border-rose-300">
                          Flagged for Review
                        </Badge>
                      ) : isAssigned ? (
                        <Badge
                          className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${isConfirmed
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-amber-50 text-amber-700 border-amber-300"
                            }`}
                        >
                          {isConfirmed ? "Confirmed & Active" : "Pending Confirmation"}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-600 border-slate-200 px-2.5 py-0.5 rounded-full">
                          Ready in Stock
                        </Badge>
                      )}

                      <div className="flex items-center gap-1">
                        {isDisputed && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setResolvingAsset(asset);
                              setResolutionNotes("");
                            }}
                            className="h-8 px-2 text-xs text-indigo-700 bg-indigo-50 border-indigo-200 hover:bg-indigo-100 rounded-lg gap-1 font-semibold cursor-pointer"
                            title="Resolve dispute"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Resolve</span>
                          </Button>
                        )}

                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEdit(asset)}
                          className="w-8 h-8 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setDeletingAsset(asset)}
                          className="w-8 h-8 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                          title="Delete asset"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Table Footer: Responsive Pagination */}
        {filteredAssets.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between p-3.5 sm:p-4 text-xs text-slate-500 border-t border-slate-100 gap-2 shrink-0 bg-slate-50/40">
            <span>
              Showing {Math.min((page - 1) * limit + 1, filteredAssets.length)} to{" "}
              {Math.min(page * limit, filteredAssets.length)} of {filteredAssets.length} items
            </span>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="h-8 px-2.5 gap-1 text-xs rounded-lg"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </Button>

              <span className="px-2 text-slate-600 font-medium">
                Page {page} of {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="h-8 px-2.5 gap-1 text-xs rounded-lg"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Hardware Dialog (New Design System) */}
      <Dialog open={showForm} onOpenChange={(open) => !open && setShowForm(false)}>
        <DialogContent className="max-w-lg bg-white rounded-2xl p-6 border-slate-200/80 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 font-heading flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <span>{editingAsset ? "Edit Hardware Details" : "Register & Issue Equipment"}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-0.5">
              Specify device identifiers, specifications, and designate the team member responsible.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (editingAsset) {
                updateAssetMutation.mutate({ id: editingAsset._id || editingAsset.id, data: formData });
              } else {
                createAssetMutation.mutate(formData);
              }
            }}
            className="space-y-4 pt-2"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Hardware Name *</Label>
                <Input
                  placeholder="e.g. MacBook Pro 16-inch"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  required
                  className="text-xs h-9 bg-slate-50 border-slate-200 focus:bg-white rounded-lg"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Model / Edition</Label>
                <Input
                  placeholder="e.g. M3 Max 2024 / A2991"
                  value={formData.model}
                  onChange={(e) => setFormData((prev) => ({ ...prev, model: e.target.value }))}
                  className="text-xs h-9 bg-slate-50 border-slate-200 focus:bg-white rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Equipment Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(val) => setFormData((prev) => ({ ...prev, type: val }))}
                >
                  <SelectTrigger className="text-xs h-9 bg-slate-50 border-slate-200 focus:bg-white rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="laptop">Laptop</SelectItem>
                    <SelectItem value="phone">Smartphone</SelectItem>
                    <SelectItem value="id_card">ID Badge / Access Card</SelectItem>
                    <SelectItem value="modem">Modem / MiFi / Hotspot</SelectItem>
                    <SelectItem value="monitor">External Monitor</SelectItem>
                    <SelectItem value="tablet">Tablet / iPad</SelectItem>
                    <SelectItem value="equipment">Work Tool / Other Gear</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Serial Number / Identifier</Label>
                <Input
                  placeholder="e.g. C02G45XPQ05D"
                  value={formData.serialNumber}
                  onChange={(e) => setFormData((prev) => ({ ...prev, serialNumber: e.target.value }))}
                  className="text-xs h-9 font-mono bg-slate-50 border-slate-200 focus:bg-white rounded-lg"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Hardware Specifications</Label>
              <Input
                placeholder="e.g. 36GB Unified Memory, 1TB SSD, Space Black"
                value={formData.specifications}
                onChange={(e) => setFormData((prev) => ({ ...prev, specifications: e.target.value }))}
                className="text-xs h-9 bg-slate-50 border-slate-200 focus:bg-white rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Physical Condition</Label>
                <Select
                  value={formData.condition}
                  onValueChange={(val) => setFormData((prev) => ({ ...prev, condition: val }))}
                >
                  <SelectTrigger className="text-xs h-9 bg-slate-50 border-slate-200 focus:bg-white rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="excellent">Brand New / Excellent</SelectItem>
                    <SelectItem value="good">Good Condition</SelectItem>
                    <SelectItem value="fair">Fair / Used</SelectItem>
                    <SelectItem value="poor">Maintenance Needed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Assign To Team Member</Label>
                <Select
                  value={formData.assignedTo}
                  onValueChange={(val) => setFormData((prev) => ({ ...prev, assignedTo: val }))}
                >
                  <SelectTrigger className="text-xs h-9 bg-slate-50 border-slate-200 focus:bg-white rounded-lg">
                    <SelectValue placeholder="Keep Unassigned" />
                  </SelectTrigger>
                  <SelectContent className="text-xs max-h-56">
                    <SelectItem value="none">Unassigned / In Stock</SelectItem>
                    {employeesData.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.fullName} ({emp.jobTitle})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Log Notes / Accessories</Label>
              <Textarea
                placeholder="e.g. Issued with power adapter, HDMI cable, and carrying bag."
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                className="text-xs resize-none h-18 bg-slate-50 border-slate-200 focus:bg-white rounded-lg"
              />
            </div>

            <DialogFooter className="mt-5 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowForm(false)}
                className="text-xs h-9 rounded-lg"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={createAssetMutation.isPending || updateAssetMutation.isPending}
                className="text-xs h-9 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold"
              >
                {createAssetMutation.isPending || updateAssetMutation.isPending
                  ? "Saving..."
                  : editingAsset
                    ? "Update Asset"
                    : "Register & Assign"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Generic Confirmation Prompt Modal */}
      <ConfirmationDialog
        open={Boolean(deletingAsset)}
        onOpenChange={(open) => !open && setDeletingAsset(null)}
        title="Remove Asset from Inventory"
        description={
          deletingAsset ? (
            <span>
              Are you sure you want to remove{" "}
              <strong className="text-slate-900 font-semibold">{deletingAsset.name}</strong>{" "}
              {deletingAsset.serialNumber ? `(S/N: ${deletingAsset.serialNumber})` : ""}? This action cannot be undone.
            </span>
          ) : ""
        }
        confirmText="Remove Asset"
        variant="danger"
        isLoading={deleteAssetMutation.isPending}
        onConfirm={() => {
          if (deletingAsset) {
            deleteAssetMutation.mutate(deletingAsset._id || deletingAsset.id);
          }
        }}
      />

      {/* Resolve Dispute Dialog */}
      <Dialog
        open={Boolean(resolvingAsset)}
        onOpenChange={(open) => !open && setResolvingAsset(null)}
      >
        <DialogContent className="max-w-md bg-white rounded-2xl p-6 border-slate-200/80 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 font-heading flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-indigo-600" />
              <span>Resolve Asset Dispute</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1">
              Reconcile reported issue with employee &ldquo;{resolvingAsset?.assignedTo?.fullName || "Employee"}&rdquo; for {resolvingAsset?.name}.
            </DialogDescription>
          </DialogHeader>

          {resolvingAsset && (
            <div className="my-2 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs space-y-1">
              <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">
                Employee's Dispute Reason:
              </span>
              <p className="text-rose-950 font-medium">
                &ldquo;{resolvingAsset.dispute_reason || resolvingAsset.disputeReason || "No details provided"}&rdquo;
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Resolution & Clarification Notes</Label>
            <Textarea
              placeholder="e.g. Verified correct serial number with employee, replaced adapter, or re-confirmed possession..."
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              rows={3}
              className="text-xs resize-none bg-slate-50 border-slate-200 focus:bg-white rounded-lg"
            />
          </div>

          <DialogFooter className="mt-5 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setResolvingAsset(null)}
              className="text-xs h-9 rounded-lg"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={resolveDisputeMutation.isPending}
              onClick={() => {
                if (resolvingAsset) {
                  resolveDisputeMutation.mutate({
                    id: resolvingAsset._id || resolvingAsset.id,
                    notes: resolutionNotes,
                  });
                }
              }}
              className="text-xs h-9 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold cursor-pointer"
            >
              {resolveDisputeMutation.isPending ? "Resolving..." : "Mark Resolved & Confirmed"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
