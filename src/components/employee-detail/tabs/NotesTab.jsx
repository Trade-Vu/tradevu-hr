import React from "react";
import { Textarea } from "@/components/ui/textarea";

export default function NotesTab({
  employee,
  isEditing,
  editData,
  setEditData,
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-900">Notes</h3>
      {isEditing ? (
        <Textarea
          value={editData.notes || ''}
          onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))}
          rows={10}
          placeholder="Add notes about this employee..."
          className="w-full"
        />
      ) : (
        <div className="p-4 bg-slate-50 rounded-lg min-h-[200px]">
          <p className="whitespace-pre-wrap text-slate-700">{employee?.notes || 'No notes yet'}</p>
        </div>
      )}
    </div>
  );
}
