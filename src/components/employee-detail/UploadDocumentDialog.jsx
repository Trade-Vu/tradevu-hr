import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
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

export default function UploadDocumentDialog({ open, onClose, onSubmit, document, isSubmitting }) {
  const [docData, setDocData] = useState({
    document_name: document?.document_name || "",
    notes: document?.notes || "",
  });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let file_url = document?.file_url;
    let file_name = document?.file_name;

    if (file) {
      setUploading(true);
      try {
        const uploadResult = await base44.integrations.Core.UploadFile({ file });
        file_url = uploadResult.file_url;
        file_name = file.name;
      } catch (error) {
        console.error("Error uploading file:", error);
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    onSubmit({
      ...docData,
      file_url,
      file_name,
      status: file_url ? 'uploaded' : 'pending',
    });

    setDocData({ document_name: "", notes: "" });
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
            <div className="space-y-2">
              <Label htmlFor="document_name">Document Name *</Label>
              <Input
                id="document_name"
                value={docData.document_name}
                onChange={(e) => setDocData(prev => ({ ...prev, document_name: e.target.value }))}
                placeholder="e.g., ID Copy, Resume"
                required
              />
            </div>
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