import React, { useState } from "react";
import { documentsApi } from "@/api/documents.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Upload, Loader2, CheckCircle, ExternalLink, AlertCircle } from "lucide-react";
import { uploadToCloudinary } from "@/utils/cloudinary";
import { DocumentViewerModal } from "@/components/ui/DocumentViewerModal";

export default function EmployeeDocumentUpload({ documents = [], employeeId }) {
  const queryClient = useQueryClient();
  const [uploadingDoc, setUploadingDoc] = useState(null);
  const [viewerDoc, setViewerDoc] = useState(null);

  const updateDocumentMutation = useMutation({
    mutationFn: async ({ docId, fileUrl, fileType, fileSize }) => {
      return documentsApi.replaceDocumentVersion(docId, {
        fileUrl,
        fileType,
        fileSize,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-documents', employeeId] });
      queryClient.invalidateQueries({ queryKey: ['my-documents', employeeId] });
      setUploadingDoc(null);
    },
  });

  const handleFileUpload = async (document, file) => {
    const docId = document._id || document.id;
    setUploadingDoc(docId);
    
    try {
      const uploadResult = await uploadToCloudinary(file);
      
      await updateDocumentMutation.mutateAsync({
        docId,
        fileUrl: uploadResult.secure_url,
        fileType: uploadResult.format || file.name.split('.').pop() || 'PDF',
        fileSize: uploadResult.bytes || file.size || 0,
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload file");
      setUploadingDoc(null);
    }
  };

  const isPendingStatus = (st) => {
    const s = String(st || '').toLowerCase();
    return s === 'pending' || s === 'pending_upload';
  };

  const pendingDocs = documents.filter(d => isPendingStatus(d.status) || !d.fileUrl && !d.file_url);
  const uploadedDocs = documents.filter(d => !isPendingStatus(d.status) && (d.fileUrl || d.file_url));

  const statusColors = {
    pending: "bg-orange-100 text-orange-700 border-orange-200",
    pending_upload: "bg-amber-100 text-amber-700 border-amber-200",
    approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
    rejected: "bg-rose-100 text-rose-700 border-rose-200",
    archived: "bg-slate-100 text-slate-700 border-slate-200",
    uploaded: "bg-blue-100 text-blue-700 border-blue-200",
  };

  return (
    <Card className="border-slate-200 shadow-lg">
      <CardHeader className="border-b border-slate-200 bg-slate-50">
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-600" />
          Documents
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {/* Pending Documents */}
        {pendingDocs.length > 0 && (
          <div className="space-y-3 mb-6">
            <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">
              Required ({pendingDocs.length})
            </h3>
            {pendingDocs.map(doc => {
              const docId = doc._id || doc.id;
              const docName = doc.name || doc.document_name || 'Document';
              return (
                <div key={docId} className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-900">{docName}</h4>
                        {doc.notes && <p className="text-xs text-slate-600 mt-0.5">{doc.notes}</p>}
                        <Badge variant="outline" className={`${statusColors[doc.status] || 'bg-amber-100 text-amber-700'} border mt-1`}>
                          Upload Required
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <input
                    type="file"
                    id={`file-${docId}`}
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(doc, e.target.files[0]);
                      }
                    }}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  <Button
                    size="sm"
                    onClick={() => document.getElementById(`file-${docId}`).click()}
                    disabled={uploadingDoc === docId}
                    className="w-full"
                  >
                    {uploadingDoc === docId ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload File
                      </>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {/* Uploaded Documents */}
        {uploadedDocs.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wide flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              Uploaded Documents ({uploadedDocs.length})
            </h3>
            {uploadedDocs.map(doc => {
              const docId = doc._id || doc.id;
              const docName = doc.name || doc.document_name || 'Document';
              const fileUrl = doc.fileUrl || doc.file_url;
              const isRejected = String(doc.status).toLowerCase() === 'rejected';

              return (
                <div key={docId} className={`p-4 bg-white border rounded-lg ${isRejected ? 'border-rose-300 bg-rose-50/50' : 'border-slate-200'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isRejected ? 'bg-rose-100' : 'bg-green-100'}`}>
                        {isRejected ? <AlertCircle className="w-5 h-5 text-rose-600" /> : <CheckCircle className="w-5 h-5 text-green-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-slate-900">{docName}</h4>
                          <Badge variant="secondary" className="text-xs">v{doc.currentVersion || 1}</Badge>
                        </div>
                        {doc.fileType && (
                          <p className="text-xs text-slate-500 uppercase">{doc.fileType}</p>
                        )}
                        {isRejected && doc.rejectionReason && (
                          <div className="mt-2 p-2 bg-rose-100 text-rose-800 text-xs rounded border border-rose-200">
                            <strong>Reason:</strong> {doc.rejectionReason}
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className={`${statusColors[doc.status] || 'bg-slate-100 text-slate-700'} border capitalize`}>
                            {doc.status}
                          </Badge>
                          {fileUrl && (
                            <button
                              onClick={() => setViewerDoc({ ...doc, file_url: fileUrl, document_name: docName })}
                              className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1 cursor-pointer"
                            >
                              <ExternalLink className="w-3 h-3" />
                              View
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    {isRejected && (
                      <div>
                        <input
                          type="file"
                          id={`reupload-${docId}`}
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleFileUpload(doc, e.target.files[0]);
                            }
                          }}
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => document.getElementById(`reupload-${docId}`).click()}
                          disabled={uploadingDoc === docId}
                        >
                          {uploadingDoc === docId ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <>
                              <Upload className="w-3.5 h-3.5 mr-1" />
                              Re-upload
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {documents.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>No documents required</p>
          </div>
        )}
      </CardContent>

      <DocumentViewerModal
        isOpen={!!viewerDoc}
        onClose={() => setViewerDoc(null)}
        fileUrl={viewerDoc?.file_url}
        title={viewerDoc?.document_name || "Document Viewer"}
      />
    </Card>
  );
}