import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Plus, Download, CheckCircle, Clock, XCircle, Ban, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { isSuperAdmin, isHrAdmin } from "@/lib/roleUtils";
import { hrLettersApi, HR_LETTER_TYPES } from "@/api";

const emptyForm = {
  letterType: HR_LETTER_TYPES[0].value,
  purpose: "",
  addressedTo: "",
};

const listFrom = (res) => (Array.isArray(res) ? res : res?.data || []);

const letterTypeLabel = (value) => HR_LETTER_TYPES.find((t) => t.value === value)?.label || "HR Letter";

const statusConfig = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock },
  generated: { label: "Ready", color: "bg-blue-100 text-blue-700 border-blue-200", icon: CheckCircle },
  delivered: { label: "Delivered", color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-700 border-red-200", icon: XCircle },
  cancelled: { label: "Withdrawn", color: "bg-slate-100 text-slate-600 border-slate-200", icon: Ban },
};

export default function HRLetters() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [downloadingId, setDownloadingId] = useState(null);

  // Backend @Roles gating: GET /hr-letters (all requests) allows SUPER_ADMIN, HR_ADMIN only.
  // Generate/reject are restricted to the same roles; any employee can submit/withdraw their own.
  const canReview = isSuperAdmin(user) || isHrAdmin(user);
  // SUPER_ADMIN typically has no Employee record of their own, so they can't submit a request.
  const canSubmit = !isSuperAdmin(user) || Boolean(user?.employeeId);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["hr-letter-requests", canReview ? "all" : "my"],
    queryFn: async () => {
      const res = canReview
        ? await hrLettersApi.getAllRequests({ limit: 100 })
        : await hrLettersApi.getMyRequests({ limit: 100 });
      return listFrom(res).map((r) => ({
        id: r._id || r.id,
        letter_type: r.letterType,
        purpose: r.purpose,
        addressed_to: r.addressedTo,
        status: r.status,
        rejection_reason: r.rejectionReason,
        employee_name: r.employeeId?.fullName || "Employee",
        employee_code: r.employeeId?.employeeCode,
        processed_by: r.processedBy?.fullName,
        requested_date: r.createdAt,
      }));
    },
    enabled: !!user,
  });

  const createRequestMutation = useMutation({
    mutationFn: (data) =>
      hrLettersApi.createRequest({
        letterType: data.letterType,
        purpose: data.purpose || undefined,
        addressedTo: data.addressedTo || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr-letter-requests"] });
      setShowRequestForm(false);
      setFormData(emptyForm);
      toast.success("Letter request submitted");
    },
    onError: (error) => toast.error(error.message || "Failed to submit letter request"),
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => hrLettersApi.cancelRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr-letter-requests"] });
      toast.success("Request withdrawn");
    },
    onError: (error) => toast.error(error.message || "Failed to withdraw request"),
  });

  const generateMutation = useMutation({
    mutationFn: (id) => hrLettersApi.generateLetter(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr-letter-requests"] });
      toast.success("Letter generated and sent to the employee");
    },
    onError: (error) => toast.error(error.message || "Failed to generate letter"),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => hrLettersApi.rejectRequest(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr-letter-requests"] });
      toast.success("Request rejected");
    },
    onError: (error) => toast.error(error.message || "Failed to reject request"),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createRequestMutation.mutate(formData);
  };

  const handleReject = (request) => {
    const reason = window.prompt("Reason for rejecting this request:");
    if (reason === null) return;
    if (!reason || reason.trim().length < 3) {
      toast.error("Please provide a reason of at least 3 characters");
      return;
    }
    rejectMutation.mutate({ id: request.id, reason: reason.trim() });
  };

  const handleDownload = async (request) => {
    setDownloadingId(request.id);
    try {
      const blob = await hrLettersApi.downloadPdf(request.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${letterTypeLabel(request.letter_type).replace(/\s+/g, "-").toLowerCase()}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      queryClient.invalidateQueries({ queryKey: ["hr-letter-requests"] });
    } catch (error) {
      toast.error(error.message || "Failed to download letter");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-indigo-50 to-purple-50 md:p-8">
      <div className="mx-auto space-y-8 max-w-7xl">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-4 bg-white rounded-full shadow-sm">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-medium text-slate-700">HR Letters & Documents</span>
            </div>

            <p className="text-lg text-slate-600">
              {canReview ? "Review and generate HR letters requested by employees" : "Request and manage your official HR documents"}
            </p>
          </div>
          {canSubmit && (
            <Dialog open={showRequestForm} onOpenChange={(open) => {
              setShowRequestForm(open);
              if (!open) setFormData(emptyForm);
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Request Letter
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Request HR Letter</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="letter_type">Letter Type *</Label>
                    <Select value={formData.letterType} onValueChange={(value) => setFormData((prev) => ({ ...prev, letterType: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {HR_LETTER_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="addressed_to">Addressed To</Label>
                    <Input
                      id="addressed_to"
                      value={formData.addressedTo}
                      onChange={(e) => setFormData((prev) => ({ ...prev, addressedTo: e.target.value }))}
                      placeholder="e.g. Embassy Consular Officer (optional)"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="purpose">Purpose *</Label>
                    <Textarea
                      id="purpose"
                      value={formData.purpose}
                      onChange={(e) => setFormData((prev) => ({ ...prev, purpose: e.target.value }))}
                      placeholder="Why do you need this letter? (e.g., visa application, bank loan, etc.)"
                      rows={3}
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => setShowRequestForm(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createRequestMutation.isPending}>
                      {createRequestMutation.isPending ? "Submitting..." : "Submit Request"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Card className="border-slate-200">
          <CardHeader className="border-b border-slate-200">
            <CardTitle>Letter Requests</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-12 text-center">
                <Loader2 className="w-8 h-8 mx-auto animate-spin text-slate-400" />
              </div>
            ) : requests.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <h3 className="mb-2 text-lg font-semibold text-slate-900">No letter requests yet</h3>
                <p className="text-slate-500">
                  {canSubmit ? "Request your first HR letter to get started" : "There are no HR letter requests to review yet"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {requests.map((request) => {
                  const config = statusConfig[request.status] || statusConfig.pending;
                  const StatusIcon = config.icon;
                  const isDownloading = downloadingId === request.id;

                  return (
                    <div key={request.id} className="p-6 transition-colors hover:bg-slate-50">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-3 mb-2">
                            <h3 className="font-semibold text-slate-900">
                              {letterTypeLabel(request.letter_type)}
                            </h3>
                            <Badge variant="outline" className={`${config.color} border flex items-center gap-1`}>
                              <StatusIcon className="w-3 h-3" />
                              {config.label}
                            </Badge>
                          </div>
                          {canReview && (
                            <p className="mb-1 text-sm text-slate-600">
                              {request.employee_name}{request.employee_code ? ` (${request.employee_code})` : ""}
                            </p>
                          )}
                          {request.purpose && <p className="text-sm text-slate-500">Purpose: {request.purpose}</p>}
                          {request.addressed_to && <p className="text-sm text-slate-500">Addressed to: {request.addressed_to}</p>}
                          <p className="mt-2 text-xs text-slate-400">
                            Requested: {request.requested_date ? format(new Date(request.requested_date), "MMM d, yyyy") : "N/A"}
                            {request.processed_by ? ` · Processed by ${request.processed_by}` : ""}
                          </p>
                          {request.status === "rejected" && request.rejection_reason && (
                            <p className="mt-2 text-sm text-red-600">Reason: {request.rejection_reason}</p>
                          )}
                        </div>
                        <div className="flex gap-2 shrink-0">
                          {["generated", "delivered"].includes(request.status) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownload(request)}
                              disabled={isDownloading}
                            >
                              {isDownloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                              {isDownloading ? "Preparing..." : "Download"}
                            </Button>
                          )}
                          {request.status === "pending" && canReview && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 border-green-300 hover:bg-green-50"
                                onClick={() => generateMutation.mutate(request.id)}
                                disabled={generateMutation.isPending}
                              >
                                Generate Letter
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-300 hover:bg-red-50"
                                onClick={() => handleReject(request)}
                                disabled={rejectMutation.isPending}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          {request.status === "pending" && !canReview && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-slate-500 hover:text-red-600"
                              onClick={() => cancelMutation.mutate(request.id)}
                              disabled={cancelMutation.isPending}
                            >
                              Withdraw
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
