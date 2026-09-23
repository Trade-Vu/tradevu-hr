import React, { useState } from "react";
import { Plus, Upload, FileText, Eye, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { uploadToCloudinary } from "@/utils/cloudinary";
import { format } from "../employeeDetailUtils";

export default function DocumentsTab({
  documents = [],
  canApprove,
  onCreateDocument,
  isCreatingDoc,
  onApproveDocument,
  isApprovingDoc,
  onRejectDocument,
  isRejectingDoc,
  onReplaceDocument,
  isReplacingDoc,
  onDeleteDocument,
  isDeletingDoc,
  documentHistory = [],
  selectedDocHistory,
  setSelectedDocHistory,
}) {
  const [docSearchQuery, setDocSearchQuery] = useState('');
  const [docCategoryFilter, setDocCategoryFilter] = useState('All');
  const [showDocDialog, setShowDocDialog] = useState(false);
  const [showReplaceDialog, setShowReplaceDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [docToReplace, setDocToReplace] = useState(null);

  const [docForm, setDocForm] = useState({
    document_name: '',
    file_url: '',
    file_name: '',
    file_type: 'PDF',
    file_size: 0,
    category: 'Employment Contract',
    visibility_level: 'hr_only',
  });

  const [replaceForm, setReplaceForm] = useState({
    file_url: '',
    file_name: '',
    file_type: 'PDF',
    file_size: 0,
  });

  const handleDocUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFile(true);
    try {
      const result = await uploadToCloudinary(file);
      setDocForm(prev => ({
        ...prev,
        file_url: result.secure_url,
        file_name: file.name,
        file_type: result.format || 'PDF',
        file_size: result.bytes || 0,
      }));
    } catch (error) {
      console.error("Error uploading to Cloudinary:", error);
      alert("Failed to upload file");
    }
    setUploadingFile(false);
  };

  const handleReplaceDocUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFile(true);
    try {
      const result = await uploadToCloudinary(file);
      setReplaceForm(prev => ({
        ...prev,
        file_url: result.secure_url,
        file_name: file.name,
        file_type: result.format || 'PDF',
        file_size: result.bytes || 0,
      }));
    } catch (error) {
      console.error("Error uploading to Cloudinary:", error);
      alert("Failed to upload file");
    }
    setUploadingFile(false);
  };

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.document_name?.toLowerCase().includes(docSearchQuery.toLowerCase());
    const matchesCategory = docCategoryFilter === 'All' || doc.category === docCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Documents</h3>
        <Dialog open={showDocDialog} onOpenChange={setShowDocDialog}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              onCreateDocument(docForm, () => {
                setShowDocDialog(false);
                setDocForm({
                  document_name: '',
                  file_url: '',
                  file_name: '',
                  file_type: 'PDF',
                  file_size: 0,
                  category: 'Employment Contract',
                  visibility_level: 'hr_only',
                });
              });
            }} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="document_name">Document Name</Label>
                <Input
                  id="document_name"
                  value={docForm.document_name}
                  onChange={(e) => setDocForm(prev => ({ ...prev, document_name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={docForm.category}
                  onChange={(e) => setDocForm(prev => ({ ...prev, category: e.target.value }))}
                  className="flex items-center justify-between w-full h-10 px-3 py-2 text-sm bg-white border rounded-md border-slate-200"
                >
                  <option value="Employment Contract">Employment Contract</option>
                  <option value="Offer Letter">Offer Letter</option>
                  <option value="Government ID">Government ID</option>
                  <option value="Passport Photograph">Passport Photograph</option>
                  <option value="Certificates & Qualifications">Certificates & Qualifications</option>
                  <option value="Compliance Forms">Compliance Forms</option>
                  <option value="Guarantor Documents">Guarantor Documents</option>
                  <option value="Promotion Letters">Promotion Letters</option>
                  <option value="Payroll Support Documents">Payroll Support Documents</option>
                  <option value="Exit Documents">Exit Documents</option>
                  <option value="Miscellaneous HR Documents">Miscellaneous HR Documents</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="visibility_level">Visibility Level</Label>
                <select
                  id="visibility_level"
                  value={docForm.visibility_level}
                  onChange={(e) => setDocForm(prev => ({ ...prev, visibility_level: e.target.value }))}
                  className="flex items-center justify-between w-full h-10 px-3 py-2 text-sm bg-white border rounded-md border-slate-200"
                >
                  <option value="hr_only">HR Admin / Super Admin (Private)</option>
                  <option value="employee">Employee & HR</option>
                  <option value="manager">Manager, Employee & HR</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="doc-upload">File</Label>
                <input type="file" onChange={handleDocUpload} className="hidden" id="doc-upload" />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => document.getElementById('doc-upload').click()}
                  disabled={uploadingFile}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploadingFile ? 'Uploading...' : docForm.file_url ? 'Change File' : 'Upload File'}
                </Button>
                {docForm.file_name && <p className="text-sm text-slate-500">Selected file: {docForm.file_name}</p>}
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setShowDocDialog(false)}>Cancel</Button>
                <Button type="submit" disabled={isCreatingDoc || !docForm.file_url || !docForm.document_name}>
                  {isCreatingDoc ? 'Adding...' : 'Add Document'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4 mb-6">
        <Input
          placeholder="Search documents..."
          value={docSearchQuery}
          onChange={(e) => setDocSearchQuery(e.target.value)}
          className="max-w-xs"
        />
        <select
          value={docCategoryFilter}
          onChange={(e) => setDocCategoryFilter(e.target.value)}
          className="flex items-center justify-between w-64 h-10 px-3 py-2 text-sm bg-white border rounded-md border-slate-200"
        >
          <option value="All">All Categories</option>
          <option value="Employment Contract">Employment Contract</option>
          <option value="Offer Letter">Offer Letter</option>
          <option value="Government ID">Government ID</option>
          <option value="Passport Photograph">Passport Photograph</option>
          <option value="Certificates & Qualifications">Certificates & Qualifications</option>
          <option value="Compliance Forms">Compliance Forms</option>
          <option value="Guarantor Documents">Guarantor Documents</option>
          <option value="Promotion Letters">Promotion Letters</option>
          <option value="Payroll Support Documents">Payroll Support Documents</option>
          <option value="Exit Documents">Exit Documents</option>
          <option value="Miscellaneous HR Documents">Miscellaneous HR Documents</option>
        </select>
      </div>

      {filteredDocs.length === 0 ? (
        <div className="py-12 text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500">No documents match.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDocs.map(doc => (
            <div key={doc.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">{doc.document_name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">{doc.category}</Badge>
                    <Badge variant="secondary" className="bg-slate-200 text-slate-700">
                      {doc.visibilityLevel === 'hr_only' ? 'HR Only' : doc.visibilityLevel === 'manager' ? 'Manager+' : 'Employee+'}
                    </Badge>
                    <Badge variant="secondary" className="text-blue-700 bg-blue-100">v{doc.currentVersion || 1}</Badge>
                    {doc.status && (
                      <Badge variant="secondary" className={
                        doc.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                          doc.status === 'rejected' ? 'bg-rose-100 text-rose-800' :
                            doc.status === 'pending_upload' ? 'bg-amber-100 text-amber-800' :
                              doc.status === 'EXPIRING_SOON' ? 'bg-amber-100 text-amber-700' :
                                doc.status === 'EXPIRED' ? 'bg-red-100 text-red-700' :
                                  'bg-blue-100 text-blue-700'
                      }>
                        {doc.status === 'pending_upload' ? 'Awaiting Upload' : doc.status}
                      </Badge>
                    )}
                  </div>
                  {doc.rejectionReason && (
                    <p className="mt-1 text-xs text-rose-600">Rejection reason: {doc.rejectionReason}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {canApprove && doc.status !== 'approved' && doc.status !== 'pending_upload' && doc.file_url && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                    onClick={() => onApproveDocument(doc.id)}
                    disabled={isApprovingDoc}
                  >
                    Approve
                  </Button>
                )}
                {canApprove && doc.status !== 'rejected' && doc.status !== 'pending_upload' && doc.file_url && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                    onClick={() => {
                      const reason = window.prompt("Enter rejection reason (optional):");
                      if (reason !== null) {
                        onRejectDocument({ id: doc.id, notes: reason });
                      }
                    }}
                    disabled={isRejectingDoc}
                  >
                    Reject
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => { setSelectedDocHistory(doc); setShowHistoryDialog(true); }}>
                  History
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setDocToReplace(doc); setShowReplaceDialog(true); }}>
                  Replace
                </Button>
                {doc.file_url && (
                  <>
                    <Button size="sm" variant="ghost" asChild>
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer" title="Preview">
                        <Eye className="w-4 h-4" />
                      </a>
                    </Button>
                    <Button size="sm" variant="ghost" asChild>
                      <a href={doc.file_url} download title="Download">
                        <Download className="w-4 h-4" />
                      </a>
                    </Button>
                  </>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => onDeleteDocument(doc.id)}
                  disabled={isDeletingDoc}
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Replace Document Dialog */}
      <Dialog open={showReplaceDialog} onOpenChange={setShowReplaceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Replace Document Version</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (docToReplace) {
              onReplaceDocument({
                id: docToReplace.id,
                fileUrl: replaceForm.file_url,
                fileType: replaceForm.file_type,
                fileSize: replaceForm.file_size,
              }, () => {
                setShowReplaceDialog(false);
                setReplaceForm({ file_url: '', file_name: '', file_type: 'PDF', file_size: 0 });
              });
            }
          }} className="space-y-4">
            <div className="space-y-2">
              <p className="mb-2 text-sm text-slate-600">
                Replacing: <strong>{docToReplace?.document_name}</strong> (Current v{docToReplace?.currentVersion || 1})
              </p>
              <Label htmlFor="replace-upload">New File</Label>
              <input type="file" onChange={handleReplaceDocUpload} className="hidden" id="replace-upload" />
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => document.getElementById('replace-upload').click()}
                disabled={uploadingFile}
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploadingFile ? 'Uploading...' : replaceForm.file_url ? 'Change File' : 'Upload New Version'}
              </Button>
              {replaceForm.file_name && <p className="text-sm text-slate-500">Selected file: {replaceForm.file_name}</p>}
            </div>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowReplaceDialog(false);
                  setReplaceForm({ file_url: '', file_name: '', file_type: 'PDF', file_size: 0 });
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isReplacingDoc || !replaceForm.file_url}>
                {isReplacingDoc ? 'Replacing...' : 'Upload New Version'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Document History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Version History: {selectedDocHistory?.document_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {documentHistory.length === 0 ? (
              <p className="py-4 text-sm text-center text-slate-500">No previous versions.</p>
            ) : (
              <div className="space-y-3">
                {documentHistory.map(hist => (
                  <div key={hist.id} className="flex items-center justify-between p-3 border rounded-lg border-slate-200">
                    <div>
                      <p className="font-medium">Version {hist.version}</p>
                      <p className="text-xs text-slate-500">Uploaded {format(!isNaN(Number(hist.createdAt)) ? new Date(Number(hist.createdAt)) : new Date(hist.createdAt), 'PPpp')}</p>
                    </div>
                    <Button size="sm" variant="outline" asChild>
                      <a href={hist.fileUrl} target="_blank" rel="noopener noreferrer">View</a>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
