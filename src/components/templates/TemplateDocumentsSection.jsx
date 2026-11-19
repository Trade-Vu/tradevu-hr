import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { File, Plus } from "lucide-react";

export default function TemplateDocumentsSection({
  requiredDocuments = [],
  newDocument,
  setNewDocument,
  onAddDocument,
  onRemoveDocument,
}) {
  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-2xs space-y-5">
      <div className="flex items-start gap-3 pb-3 border-b border-slate-100">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5">
          <File className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-900 tracking-tight font-heading">
            Standard Identification & Paperwork Documents
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            List generic compliance or identification documents the employee must provide.
          </p>
        </div>
      </div>

      {requiredDocuments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {requiredDocuments.map((doc, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="px-3 py-1.5 text-xs bg-slate-100 text-slate-800 border border-slate-200 gap-1.5"
            >
              <span>{doc}</span>
              <button
                type="button"
                onClick={() => onRemoveDocument(index)}
                className="text-slate-400 hover:text-red-600 cursor-pointer ml-1 font-bold"
                title="Remove document requirement"
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div className="flex gap-2.5">
        <Input
          placeholder="Document name (e.g., National ID / Passport, Academic Certificate, Medical Report)"
          value={newDocument}
          onChange={(e) => setNewDocument(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), onAddDocument())}
          className="text-xs h-10 bg-white border-slate-200 rounded-lg px-3.5 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 placeholder:text-slate-400 transition-all shadow-2xs"
        />
        <Button
          type="button"
          onClick={onAddDocument}
          variant="outline"
          className="text-xs h-10 px-4 border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-lg cursor-pointer shrink-0 shadow-2xs"
        >
          <Plus className="w-4 h-4 mr-1.5 text-slate-500" />
          Add Document
        </Button>
      </div>
    </div>
  );
}
