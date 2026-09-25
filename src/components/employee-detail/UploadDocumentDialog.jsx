import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import { uploadToCloudinary } from "@/utils/cloudinary";
import { toast } from "sonner";

export const DOCUMENT_CATEGORIES = [
  "Employment Contract",
  "Offer Letter",
  "Government ID",
  "Passport Photograph",
  "Tax Forms",
  "Bank Details",
  "Educational Certificates",
  "Certificates & Qualifications",
  "Compliance Forms",
  "Guarantor Documents",
  "Promotion Letters",
  "Performance Reviews",
  "Policy Acknowledgments",
  "Payroll Support Documents",
  "Exit Documents",
  "Miscellaneous HR Documents",
  "Other",
];

export default function UploadDocumentDialog({ open, onClose, onSubmit, document, isSubmitting }) {
  const [docData, setDocData] = useState({
    document_name: "",
    category: "Employment Contract",
    visibility_level: "employee",
    notes: "",
  });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (document) {
      setDocData({
        document_name: document.name || document.document_name || "",
        category: document.category || "Employment Contract",
        visibility_level: document.visibilityLevel || "employee",
        notes: document.notes || "",
      });
    } else {
      setDocData({
        document_name: "",
        category: "Employment Contract",
        visibility_level: "employee",
        notes: "",
      });
    }
    setFile(null);
  }, [document, open]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let fileUrl = document?.fileUrl || document?.file_url || "";
    let fileType = document?.fileType || document?.file_type || "";
    let fileSize = document?.fileSize || document?.file_size || 0;

    if (file) {
      setUploading(true);
      try {
        const uploadResult = await uploadToCloudinary(file);
        fileUrl = uploadResult.secure_url;
        fileType = uploadResult.format || file.name.split('.').pop() || 'PDF';
        fileSize = uploadResult.bytes || file.size || 0;
      } catch (error) {
        console.error("Error uploading file:", error);
        toast.error(error.message || "Failed to upload file to Cloudinary");
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    onSubmit({
      name: docData.document_name,
      document_name: docData.document_name,
      category: docData.category,
      visibilityLevel: docData.visibility_level,
      notes: docData.notes,
      fileUrl,
      file_url: fileUrl,
      fileType,
      file_name: file ? file.name : (docData.document_name + (fileType ? '.' + fileType : '')),
      fileSize,
      file_size: fileSize,
      status: fileUrl ? 'approved' : 'pending_upload',
    });

    setDocData({ document_name: "", category: "Employment Contract", visibility_level: "employee", notes: "" });
    setFile(null);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {document ? `Upload ${document.document_name}` : 'Add Document Request'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!document && (
            <>
              <div className="space-y-2">
                <Label htmlFor="document_name">Document Name *</Label>
                <Input
                  id="document_name"
                  value={docData.document_name}
                  onChange={(e) => setDocData(prev => ({ ...prev, document_name: e.target.value }))}
                  placeholder="e.g., ID Copy, Resume, Offer Letter"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <select
                  id="category"
                  value={docData.category}
                  onChange={(e) => setDocData(prev => ({ ...prev, category: e.target.value }))}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950"
                >
                  {DOCUMENT_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="visibility_level">Visibility Level</Label>
                <select
                  id="visibility_level"
                  value={docData.visibility_level}
                  onChange={(e) => setDocData(prev => ({ ...prev, visibility_level: e.target.value }))}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950"
                >
                  <option value="employee">Employee & HR</option>
                  <option value="hr_only">HR Admin / Super Admin (Private)</option>
                  <option value="manager">Manager, Employee & HR</option>
                </select>
              </div>
            </>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="file">Upload File</Label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-slate-400 transition-colors">
              <input
                id="file"
                type="file"
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
              <label htmlFor="file" className="cursor-pointer">
                <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                <p className="text-sm text-slate-600">
                  {file ? file.name : 'Click to upload or drag and drop'}
                </p>
                <p className="text-xs text-slate-500 mt-1">PDF, DOC, or Image files</p>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Input
              id="notes"
              value={docData.notes}
              onChange={(e) => setDocData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              disabled={uploading || isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={uploading || isSubmitting}>
              {uploading || isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {uploading ? 'Uploading...' : 'Saving...'}
                </>
              ) : (
                document ? 'Upload' : 'Add Request'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}