import React, { useState } from "react";
import { documentsApi } from "@/api/documents.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Upload, File, CheckCircle, Clock, ExternalLink, Plus, 
  XCircle, Trash2, History, AlertCircle 
} from "lucide-react";
import UploadDocumentDialog from "./UploadDocumentDialog";
import { DocumentViewerModal } from "@/components/ui/DocumentViewerModal";
import { toast } from "sonner";
import { format } from "date-fns";

const statusColors = {
  pending: "bg-orange-100 text-orange-800 border-orange-200",
  pending_upload: "bg-amber-100 text-amber-800 border-amber-200",
  uploaded: "bg-blue-100 text-blue-800 border-blue-200",
  approved: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  archived: "bg-slate-100 text-slate-700 border-slate-200",
};

export default function DocumentManager({ documents = [], employeeId }) {
  const queryClient = useQueryClient();
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [viewerDoc, setViewerDoc] = useState(null);

  // Rejection Dialog State
  const [rejectDialogDoc, setRejectDialogDoc] = useState(null);
  const [rejectionNotes, setRejectionNotes] = useState("");

  // History Dialog State
  const [historyDoc, setHistoryDoc] = useState(null);
  const [docHistoryData, setDocHistoryData] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const invalidateDocs = () => {
    queryClient.invalidateQueries({ queryKey: ['documents', employeeId] });
    queryClient.invalidateQueries({ queryKey: ['employee-documents', employeeId] });
  };

  const updateDocumentMutation = useMutation({
    mutationFn: async ({ docId, data }) => {
      if (data.fileUrl) {
        return documentsApi.replaceDocumentVersion(docId, {
          fileUrl: data.fileUrl,
          fileType: data.fileType,
          fileSize: data.fileSize,
          name: data.name,
          category: data.category,
          notes: data.notes,
        });
      }
      return data;
    },
    onSuccess: () => {
      invalidateDocs();
      setShowUploadDialog(false);
      setSelectedDocument(null);
      toast.success("Document version updated successfully");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update document");
    },
  });

  const createDocumentMutation = useMutation({
    mutationFn: async (docData) => {
      return documentsApi.uploadDocument({
        employeeId,
        name: docData.name || docData.document_name,
        category: docData.category || 'Other',
        fileUrl: docData.fileUrl || '',
        fileType: docData.fileType || '',
        fileSize: docData.fileSize || 0,
        visibilityLevel: docData.visibilityLevel || 'employee',
        notes: docData.notes,
      });
    },
    onSuccess: () => {
      invalidateDocs();
      setShowUploadDialog(false);
      setSelectedDocument(null);
      toast.success("Document request created successfully");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to create document request");
    },
  });

  const approveDocumentMutation = useMutation({
    mutationFn: async ({ docId, notes }) => {
      return documentsApi.approveDocument(docId, notes);
    },
    onSuccess: () => {
      invalidateDocs();
      toast.success("Document approved successfully");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to approve document");
    },
  });

  const rejectDocumentMutation = useMutation({
    mutationFn: async ({ docId, notes }) => {
      return documentsApi.rejectDocument(docId, notes);
    },
    onSuccess: () => {
      invalidateDocs();
      setRejectDialogDoc(null);
      setRejectionNotes("");
      toast.success("Document marked as rejected");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to reject document");
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (docId) => {
      return documentsApi.deleteDocument(docId);
    },
    onSuccess: () => {
      invalidateDocs();
      toast.success("Document deleted successfully");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to delete document");
    },
  });

  const handleOpenHistory = async (doc) => {
    const docId = doc._id || doc.id;
    setHistoryDoc(doc);
    setLoadingHistory(true);
    try {
      const res = await documentsApi.getDocumentHistory(docId);
      const data = res.data?.data || res.data;
      setDocHistoryData(data);
    } catch (err) {
      toast.error("Failed to load document version history");
    } finally {
      setLoadingHistory(false);
    }
  };

  const openUploadDialog = (doc = null) => {
    setSelectedDocument(doc);
    setShowUploadDialog(true);
  };

  const isPending = (doc) => {
    const s = String(doc.status || '').toLowerCase();
    return s === 'pending' || s === 'pending_upload' || (!doc.fileUrl && !doc.file_url);
  };

  const pendingDocs = documents.filter(d => isPending(d));
  const uploadedDocs = documents.filter(d => !isPending(d));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Documents</h2>
          <p className="text-sm text-slate-500">Manage employee files, contracts, and HR verification</p>
        </div>
        <Button onClick={() => openUploadDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Document Request
        </Button>
      </div>

      {/* Pending Documents */}
      {pendingDocs.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            Pending Upload ({pendingDocs.length})
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {pendingDocs.map(doc => {
              const docId = doc._id || doc.id;
              const docName = doc.name || doc.document_name || 'Document';
              return (
                <Card key={docId} className="border-amber-200 bg-amber-50/60">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                          <File className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-slate-900">{docName}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">{doc.category || 'General'}</p>
                          {doc.notes && <p className="text-xs text-slate-600 mt-1 italic">{doc.notes}</p>}
                          <Badge variant="outline" className={`${statusColors[doc.status] || 'bg-amber-100 text-amber-800'} border mt-2`}>
                            Awaiting Upload
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => openUploadDialog(doc)}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => deleteDocumentMutation.mutate(docId)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Uploaded Documents */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-500" />
          Employee Documents ({uploadedDocs.length})
        </h3>
        {uploadedDocs.length === 0 ? (
          <Card className="border-slate-200">
            <CardContent className="p-8 text-center text-slate-500">
              <File className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No documents uploaded yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {uploadedDocs.map(doc => {
              const docId = doc._id || doc.id;
              const docName = doc.name || doc.document_name || 'Document';
              const fileUrl = doc.fileUrl || doc.file_url;
              const status = String(doc.status || '').toLowerCase();
              const isApproved = status === 'approved';
              const isRejected = status === 'rejected';

              return (
                <Card key={docId} className={`border hover:shadow-md transition-shadow ${isRejected ? 'border-red-200 bg-red-50/30' : 'border-slate-200'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isApproved ? 'bg-emerald-100 text-emerald-600' : isRejected ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                          <File className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-slate-900">{docName}</h4>
                            <Badge variant="secondary" className="text-xs">v{doc.currentVersion || 1}</Badge>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{doc.category || 'General'}</p>
                          {doc.rejectionReason && isRejected && (
                            <p className="text-xs text-red-600 mt-1 font-medium">Rejection reason: {doc.rejectionReason}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className={`${statusColors[doc.status] || 'bg-slate-100 text-slate-700'} border capitalize`}>
                              {doc.status}
                            </Badge>
                            {fileUrl && (
                              <button
                                onClick={() => setViewerDoc({ ...doc, file_url: fileUrl, document_name: docName })}
                                className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1 cursor-pointer ml-1"
                              >
                                <ExternalLink className="w-3 h-3" />
                                View
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenHistory(doc)}
                              className="text-slate-500 hover:text-slate-800 text-sm flex items-center gap-1 cursor-pointer ml-2"
                            >
                              <History className="w-3 h-3" />
                              History
                            </button>
                          </div>

                          {/* HR Review Actions */}
                          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100">
                            {!isApproved && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 h-7 text-xs"
                                onClick={() => approveDocumentMutation.mutate({ docId })}
                                disabled={approveDocumentMutation.isPending}
                              >
                                <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                Approve
                              </Button>
                            )}
                            {!isRejected && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-rose-600 border-rose-200 hover:bg-rose-50 h-7 text-xs"
                                onClick={() => setRejectDialogDoc(doc)}
                              >
                                <XCircle className="w-3.5 h-3.5 mr-1" />
                                Reject
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs text-slate-600"
                              onClick={() => openUploadDialog(doc)}
                            >
                              <Upload className="w-3.5 h-3.5 mr-1" />
                              Replace
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs text-red-500 hover:text-red-700 ml-auto"
                              onClick={() => deleteDocumentMutation.mutate(docId)}
                              disabled={deleteDocumentMutation.isPending}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <UploadDocumentDialog
        open={showUploadDialog}
        onClose={() => {
          setShowUploadDialog(false);
          setSelectedDocument(null);
        }}
        onSubmit={(data) => {
          const docId = selectedDocument?._id || selectedDocument?.id;
          if (docId) {
            updateDocumentMutation.mutate({ docId, data });
          } else {
            createDocumentMutation.mutate(data);
          }
        }}
        document={selectedDocument}
        isSubmitting={updateDocumentMutation.isPending || createDocumentMutation.isPending}
      />

      {/* Reject Dialog */}
      <Dialog open={!!rejectDialogDoc} onOpenChange={(open) => { if (!open) setRejectDialogDoc(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-slate-600">
              Provide feedback or notes on why <strong>{rejectDialogDoc?.name || rejectDialogDoc?.document_name}</strong> is being rejected:
            </p>
            <div className="space-y-2">
              <Label htmlFor="reject-notes">Rejection Reason</Label>
              <Input
                id="reject-notes"
                placeholder="e.g. Incomplete signature, blurry image, expired ID"
                value={rejectionNotes}
                onChange={(e) => setRejectionNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogDoc(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={rejectDocumentMutation.isPending}
              onClick={() => {
                const docId = rejectDialogDoc?._id || rejectDialogDoc?.id;
                rejectDocumentMutation.mutate({ docId, notes: rejectionNotes });
              }}
            >
              {rejectDocumentMutation.isPending ? "Rejecting..." : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={!!historyDoc} onOpenChange={(open) => { if (!open) setHistoryDoc(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Version History: {historyDoc?.name || historyDoc?.document_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 max-h-80 overflow-y-auto">
            {loadingHistory ? (
              <p className="text-sm text-slate-500 text-center py-4">Loading version history...</p>
            ) : !docHistoryData?.history || docHistoryData.history.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No previous versions found. Current version is v{docHistoryData?.currentVersion || 1}.</p>
            ) : (
              docHistoryData.history.map((h, i) => (
                <div key={h.id || i} className="p-3 border border-slate-200 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Version {h.version}</p>
                    <p className="text-xs text-slate-500">
                      {h.createdAt ? format(new Date(h.createdAt), "PPp") : "Previous version"}
                    </p>
                  </div>
                  {h.fileUrl && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={h.fileUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3.5 h-3.5 mr-1" />
                        View
                      </a>
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHistoryDoc(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DocumentViewerModal
        isOpen={!!viewerDoc}
        onClose={() => setViewerDoc(null)}
        fileUrl={viewerDoc?.file_url}
        title={viewerDoc?.document_name || "Document Viewer"}
      />
    </div>
  );
}