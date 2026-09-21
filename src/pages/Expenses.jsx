import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Receipt, Plus, Upload, CheckCircle, XCircle, Clock, Download, DollarSign, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { isSuperAdmin, isHrAdmin, isManager } from "@/lib/roleUtils";
import { expensesApi } from "@/api";
import { uploadToCloudinary } from "@/utils/cloudinary";

const DEFAULT_CURRENCY = "NGN";

const emptyForm = {
  expenseType: "travel",
  amount: "",
  date: new Date().toISOString().split("T")[0],
  description: "",
  receiptUrl: "",
};

const listFrom = (res) => (Array.isArray(res) ? res : res?.data || []);

export default function Expenses() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [formData, setFormData] = useState(emptyForm);

  // Backend @Roles gating: GET /expenses (all claims) allows SUPER_ADMIN, HR_ADMIN, MANAGER.
  // Approve/reject/reimburse only allow SUPER_ADMIN, HR_ADMIN.
  const canViewAll = isSuperAdmin(user) || isHrAdmin(user) || isManager(user);
  const canReview = isSuperAdmin(user) || isHrAdmin(user);
  // SUPER_ADMIN never has an Employee record, so they can't submit a claim of their own.
  const canSubmit = !isSuperAdmin(user) || Boolean(user?.employeeId);

  const { data: claims = [], isLoading: isLoadingClaims } = useQuery({
    queryKey: ["expense-claims", canViewAll ? "all" : "my"],
    queryFn: async () => {
      const res = canViewAll
        ? await expensesApi.getAllExpenses({ limit: 100 })
        : await expensesApi.getMyExpenses({ limit: 100 });
      return listFrom(res).map((c) => ({
        id: c._id || c.id,
        expense_type: c.expenseType,
        amount: c.amount || 0,
        currency: c.currency || DEFAULT_CURRENCY,
        date: c.date,
        description: c.description,
        receipt_url: c.receiptUrl,
        status: c.status,
        rejection_reason: c.rejectionReason,
        employee_name: c.employeeId?.fullName || c.employeeId?.employeeCode || "Employee",
      }));
    },
    enabled: !!user,
  });

  const createClaimMutation = useMutation({
    mutationFn: (data) =>
      expensesApi.createExpense({
        expenseType: data.expenseType,
        amount: Number(data.amount),
        currency: DEFAULT_CURRENCY,
        date: data.date,
        description: data.description,
        receiptUrl: data.receiptUrl || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-claims"] });
      setShowClaimForm(false);
      setFormData(emptyForm);
      toast.success("Expense claim submitted");
    },
    onError: (error) => toast.error(error.message || "Failed to submit expense claim"),
  });

  const approveMutation = useMutation({
    mutationFn: (id) => expensesApi.approveExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-claims"] });
      toast.success("Claim approved");
    },
    onError: (error) => toast.error(error.message || "Failed to approve claim"),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => expensesApi.rejectExpense(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-claims"] });
      toast.success("Claim rejected");
    },
    onError: (error) => toast.error(error.message || "Failed to reject claim"),
  });

  const reimburseMutation = useMutation({
    mutationFn: (id) => expensesApi.reimburseExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-claims"] });
      toast.success("Claim marked as reimbursed");
    },
    onError: (error) => toast.error(error.message || "Failed to mark claim as reimbursed"),
  });

  const handleReceiptUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingReceipt(true);
    try {
      const result = await uploadToCloudinary(file);
      setFormData((prev) => ({ ...prev, receiptUrl: result.secure_url }));
    } catch (error) {
      toast.error(error.message || "Failed to upload receipt");
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createClaimMutation.mutate(formData);
  };

  const handleApprove = (claim) => approveMutation.mutate(claim.id);

  const handleReject = (claim) => {
    const reason = window.prompt("Reason for rejecting this claim (optional):") || undefined;
    rejectMutation.mutate({ id: claim.id, reason });
  };

  const handleReimburse = (claim) => reimburseMutation.mutate(claim.id);

  const totalPending = claims.filter((c) => c.status === "pending").reduce((sum, c) => sum + c.amount, 0);
  const totalApproved = claims.filter((c) => c.status === "approved").reduce((sum, c) => sum + c.amount, 0);
  const totalReimbursed = claims.filter((c) => c.status === "reimbursed").reduce((sum, c) => sum + c.amount, 0);

  const statusConfig = {
    pending: { color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock },
    approved: { color: "bg-blue-100 text-blue-700 border-blue-200", icon: CheckCircle },
    reimbursed: { color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle },
    rejected: { color: "bg-red-100 text-red-700 border-red-200", icon: XCircle },
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="mx-auto space-y-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-4 bg-white rounded-full shadow-sm">
              <Receipt className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-slate-700">Expense Management</span>
            </div>

            <p className="text-lg text-slate-600">
              {canViewAll ? "Review and manage expense reimbursements" : "Submit and track your expense reimbursements"}
            </p>
          </div>
          {canSubmit && (
            <Button onClick={() => setShowClaimForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Expense
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="p-3 bg-yellow-100 rounded-xl">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
              <div className="mb-1 text-3xl font-bold text-slate-900">
                {totalPending.toLocaleString()} {DEFAULT_CURRENCY}
              </div>
              <div className="text-sm text-slate-600">Pending</div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="mb-1 text-3xl font-bold text-slate-900">
                {totalApproved.toLocaleString()} {DEFAULT_CURRENCY}
              </div>
              <div className="text-sm text-slate-600">Approved</div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="p-3 bg-green-100 rounded-xl">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="mb-1 text-3xl font-bold text-slate-900">
                {totalReimbursed.toLocaleString()} {DEFAULT_CURRENCY}
              </div>
              <div className="text-sm text-slate-600">Reimbursed</div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <Receipt className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="mb-1 text-3xl font-bold text-slate-900">
                {claims.length}
              </div>
              <div className="text-sm text-slate-600">Total Claims</div>
            </CardContent>
          </Card>
        </div>

        {/* Claim Form */}
        {showClaimForm && (
          <Card className="shadow-xl border-slate-200">
            <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-purple-50 to-pink-50">
              <CardTitle>Submit Expense Claim</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="expense_type">Expense Type *</Label>
                    <Select value={formData.expenseType} onValueChange={(value) => setFormData((prev) => ({ ...prev, expenseType: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="travel">Travel</SelectItem>
                        <SelectItem value="meals">Meals</SelectItem>
                        <SelectItem value="accommodation">Accommodation</SelectItem>
                        <SelectItem value="supplies">Supplies</SelectItem>
                        <SelectItem value="equipment">Equipment</SelectItem>
                        <SelectItem value="training">Training</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount ({DEFAULT_CURRENCY}) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date">Expense Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="receipt">Receipt Upload</Label>
                    <div className="flex gap-2">
                      <input
                        type="file"
                        id="receipt"
                        accept="image/*,.pdf"
                        onChange={handleReceiptUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('receipt').click()}
                        disabled={uploadingReceipt}
                        className="w-full"
                      >
                        {uploadingReceipt ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                        {uploadingReceipt ? "Uploading..." : formData.receiptUrl ? "Change Receipt" : "Upload Receipt"}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    required
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => { setShowClaimForm(false); setFormData(emptyForm); }}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createClaimMutation.isPending}>
                    {createClaimMutation.isPending ? "Submitting..." : "Submit Claim"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Claims List */}
        <Card className="border-slate-200">
          <CardHeader className="border-b border-slate-200">
            <CardTitle>Expense Claims</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingClaims ? (
              <div className="p-12 text-center">
                <Loader2 className="w-8 h-8 mx-auto animate-spin text-slate-400" />
              </div>
            ) : claims.length === 0 ? (
              <div className="p-12 text-center">
                <Receipt className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <h3 className="mb-2 text-lg font-semibold text-slate-900">No expense claims yet</h3>
                <p className="text-slate-500">Submit your first claim to get started</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {claims.map((claim) => {
                  const config = statusConfig[claim.status] || statusConfig.pending;
                  const StatusIcon = config.icon;

                  return (
                    <div key={claim.id} className="p-6 transition-colors hover:bg-slate-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold capitalize text-slate-900">
                              {claim.expense_type?.replace('_', ' ')}
                            </h3>
                            <Badge variant="outline" className={`${config.color} border flex items-center gap-1`}>
                              <StatusIcon className="w-3 h-3" />
                              {claim.status}
                            </Badge>
                            <span className="text-lg font-bold text-slate-900">
                              {claim.amount.toLocaleString()} {claim.currency}
                            </span>
                          </div>
                          {canViewAll && <p className="mb-1 text-sm text-slate-600">{claim.employee_name}</p>}
                          <p className="mb-2 text-sm text-slate-500">{claim.description}</p>
                          <p className="text-xs text-slate-400">
                            Date: {format(new Date(claim.date), "MMM d, yyyy")}
                          </p>
                          {claim.rejection_reason && (
                            <p className="mt-2 text-sm text-red-600">Reason: {claim.rejection_reason}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {claim.receipt_url && (
                            <Button size="sm" variant="outline" asChild>
                              <a href={claim.receipt_url} target="_blank" rel="noopener noreferrer">
                                <Download className="w-4 h-4 mr-2" />
                                Receipt
                              </a>
                            </Button>
                          )}
                          {canReview && claim.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 border-green-300 hover:bg-green-50"
                                onClick={() => handleApprove(claim)}
                                disabled={approveMutation.isPending}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-300 hover:bg-red-50"
                                onClick={() => handleReject(claim)}
                                disabled={rejectMutation.isPending}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          {canReview && claim.status === 'approved' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-blue-600 border-blue-300 hover:bg-blue-50"
                              onClick={() => handleReimburse(claim)}
                              disabled={reimburseMutation.isPending}
                            >
                              Mark Reimbursed
                            </Button>
                          )}
                        </div>
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
