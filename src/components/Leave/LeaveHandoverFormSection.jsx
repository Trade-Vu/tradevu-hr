import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Upload, CheckCircle2, FileText, UserCheck, X } from "lucide-react";
import { uploadToCloudinary } from "@/utils/cloudinary";
import { downloadHandoverTemplate } from "@/utils/handoverTemplate";
import { toast } from "sonner";

export default function LeaveHandoverFormSection({
  isCompulsory = false,
  requiresReliefOfficer = true,
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
    <div className="space-y-3.5">
      {/* SECTION 1: Handover Document (Download & Upload) */}
      <div className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/70 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 pb-2.5 border-b border-slate-200/70">
          <div className="flex items-start gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 mt-0.5">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Label className="text-sm font-bold text-slate-800">Handover Document</Label>
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
                Download the handover template, outline your duties, and upload the completed note.
              </p>
            </div>
          </div>
        </div>

        {/* 2-Column Action Cards: Download & Upload */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
          {/* Step 1: Download Template */}
          <div className="p-3 rounded-lg bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between gap-2.5">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center">1</span>
                <span>Download Template</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Use our official template to document tasks, key contacts, and project status.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={downloadHandoverTemplate}
              className="w-full bg-white hover:bg-slate-50 text-indigo-600 border-indigo-200 hover:border-indigo-300 font-medium text-xs flex items-center justify-center gap-1.5 shadow-xs h-10"
            >
              <Download className="w-3.5 h-3.5" />
              Download Template
            </Button>
          </div>

          {/* Step 2: Upload Completed Note */}
          <div className="p-3 rounded-lg bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between gap-2.5">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center">2</span>
                <span>Upload Completed Note</span>
                {isCompulsory && <span className="text-rose-600 font-bold">*</span>}
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Attach your completed note (.pdf, .doc, .docx, .txt) for coverage review.
              </p>
            </div>

            <div>
              <input
                type="file"
                id="handover-document"
                onChange={handleFileUpload}
                className="hidden"
                accept=".pdf,.doc,.docx,.txt"
              />

              {handoverNoteUrl ? (
                <div className="flex items-center justify-between gap-2 p-1.5 px-2.5 rounded-md bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 h-8.5">
                  <div className="flex items-center gap-1.5 truncate">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="font-medium truncate">Document attached</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onHandoverNoteUrlChange("")}
                    className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors"
                    title="Remove attached document"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("handover-document")?.click()}
                  disabled={uploading}
                  className="w-full bg-white hover:bg-slate-50 text-slate-700 border-slate-200 font-medium text-xs flex items-center justify-center gap-1.5 shadow-xs h-10"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                  {uploading ? "Uploading..." : "Upload Completed Note"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Relief Officer */}
      {requiresReliefOfficer && (
        <div className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/70 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600 border border-purple-100">
                <UserCheck className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-sm font-bold text-slate-800">Relief Officer</Label>
                <Badge variant="outline" className="text-[10px] font-semibold text-rose-700 bg-rose-50 border-rose-200">
                  Required *
                </Badge>
              </div>
            </div>

            {departmentName && (
              <span className="text-[11px] text-indigo-700 font-medium bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100 self-start sm:self-auto">
                Department: {departmentName}
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <Select
              value={reliefOfficerId}
              onValueChange={(val) => onReliefOfficerChange(val)}
            >
              <SelectTrigger className="bg-white text-sm border-slate-200 h-9.5">
                <SelectValue placeholder="Select colleague from your department" />
              </SelectTrigger>
              <SelectContent>
                {colleagues.length === 0 ? (
                  <SelectItem value="none" disabled>No colleagues found in department</SelectItem>
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
              A relief officer is required to cover your responsibilities while on leave.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
