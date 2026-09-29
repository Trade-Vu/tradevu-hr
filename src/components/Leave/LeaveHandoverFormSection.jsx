import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Upload, Paperclip } from "lucide-react";
import { uploadToCloudinary } from "@/utils/cloudinary";
import { downloadHandoverTemplate } from "@/utils/handoverTemplate";
import { toast } from "sonner";

export default function LeaveHandoverFormSection({
  isCompulsory = false,
  departmentName = "",
  reliefOfficerId = "",
  onReliefOfficerChange,
  colleagues = [],
  handoverNote = "",
  onHandoverNoteChange,
  handoverNoteUrl = "",
  onHandoverNoteUrlChange,
}) {
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const uploadResult = await uploadToCloudinary(file);
      if (!uploadResult || !uploadResult.secure_url) {
        throw new Error("Failed to upload document to cloud storage.");
      }
      onHandoverNoteUrlChange(uploadResult.secure_url);
      toast.success("Handover document uploaded successfully.");
    } catch (error) {
      console.error("Error uploading handover document:", error);
      toast.error("Failed to upload handover document. Please try again.");
      onHandoverNoteUrlChange("");
    }
    setUploading(false);
  };

  return (
    <div className="p-4 space-y-4 rounded-xl border border-slate-200 bg-slate-50/70">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <Label className="text-sm font-semibold text-slate-800">Handover Note</Label>
            {isCompulsory ? (
              <Badge variant="outline" className="text-[10px] font-semibold text-rose-700 bg-rose-50 border-rose-200">
                Required *
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] font-normal text-slate-500 bg-slate-100">
                Optional
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Provide handover instructions, delegated responsibilities, key contacts, or attach a completed note.
          </p>
        </div>

        <div className="flex flex-col items-start sm:items-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={downloadHandoverTemplate}
            className="bg-white hover:bg-slate-100 text-indigo-600 border-indigo-200 hover:border-indigo-300 font-medium text-xs flex items-center gap-1.5 shrink-0 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            Download Handover Template
          </Button>
          <p className="text-[11px] text-slate-500 italic mt-1.5 sm:text-right max-w-xs">
            You can use the attached template as is or edit it to fit your specific use case.
          </p>
        </div>
      </div>

      {/* Relief Officer Selector */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium text-slate-700">
            Relief Officer {isCompulsory ? <span className="text-rose-600 font-semibold">* (Required)</span> : <span className="text-slate-400 font-normal">(Optional)</span>}
          </Label>
          {departmentName && (
            <span className="text-[11px] text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
              Department: {departmentName}
            </span>
          )}
        </div>
        <Select
          value={reliefOfficerId}
          onValueChange={(val) => onReliefOfficerChange(val)}
        >
          <SelectTrigger className="bg-white text-sm">
            <SelectValue placeholder="Select colleague from your department" />
          </SelectTrigger>
          <SelectContent>
            {colleagues.length === 0 ? (
              <SelectItem value="none" disabled>No colleagues found</SelectItem>
            ) : (
              colleagues.map((col) => (
                <SelectItem key={col.id} value={col.id}>
                  {col.full_name || col.fullName} {col.job_title ? `— ${col.job_title}` : ""}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        <p className="text-[11px] text-slate-500">
          The selected relief officer must confirm your attached handover note as part of your application.
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium text-slate-700">Handover Summary / Notes</Label>
        <Textarea
          placeholder="Outline your delegated duties, ongoing tasks, client contacts, and critical coverage notes..."
          value={handoverNote}
          onChange={(e) => onHandoverNoteChange(e.target.value)}
          rows={3}
          className="bg-white text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium text-slate-700">Attach Completed Handover Document</Label>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="file"
            id="handover-document"
            onChange={handleFileUpload}
            className="hidden"
            accept=".pdf,.doc,.docx,.txt"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => document.getElementById("handover-document")?.click()}
            disabled={uploading}
            className="bg-white"
          >
            <Upload className="w-3.5 h-3.5 mr-1.5" />
            {uploading ? "Uploading..." : "Upload Completed Note"}
          </Button>
          {handoverNoteUrl && (
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-md border border-emerald-200">
              <Paperclip className="w-3.5 h-3.5 text-emerald-600" />
              <span>Handover document attached</span>
              <button
                type="button"
                onClick={() => onHandoverNoteUrlChange("")}
                className="ml-1 text-slate-400 hover:text-red-500 font-bold"
                title="Remove attached document"
              >
                ×
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
