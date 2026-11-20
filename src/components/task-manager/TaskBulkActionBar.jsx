import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckSquare, X, ArrowRight, Flag } from "lucide-react";
import { TASK_STATUS_CONFIG } from "@/constants/taskStatus";

export default function TaskBulkActionBar({
  selectedCount = 0,
  onClearSelection,
  onBulkMoveStatus,
  onBulkChangePriority,
  isPending = false,
}) {
  if (selectedCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 40, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 40, opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700/80 px-4 py-2.5 flex items-center gap-3.5 max-w-2xl w-auto select-none"
      >
        {/* Selected Counter */}
        <div className="flex items-center gap-2 pr-2 border-r border-slate-700/80 shrink-0">
          <div className="w-6 h-6 rounded-md bg-blue-500/20 text-blue-400 flex items-center justify-center">
            <CheckSquare className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-white whitespace-nowrap">
            {selectedCount} <span className="font-normal text-slate-300">selected</span>
          </span>
        </div>

        {/* Move Status / Column Action */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Select onValueChange={onBulkMoveStatus} disabled={isPending}>
            <SelectTrigger className="h-8 px-2.5 text-xs bg-slate-800 border-slate-700 text-white rounded-lg hover:bg-slate-700/80 gap-1.5">
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <SelectValue placeholder="Move to status..." />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-200 shadow-xl">
              {Object.entries(TASK_STATUS_CONFIG).map(([key, cfg]) => (
                <SelectItem key={key} value={key} className="text-xs">
                  {cfg.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Change Priority Action */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Select onValueChange={onBulkChangePriority} disabled={isPending}>
            <SelectTrigger className="h-8 px-2.5 text-xs bg-slate-800 border-slate-700 text-white rounded-lg hover:bg-slate-700/80 gap-1.5">
              <Flag className="w-3.5 h-3.5 text-slate-400" />
              <SelectValue placeholder="Set priority..." />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-200 shadow-xl">
              <SelectItem value="urgent" className="text-xs text-red-600 font-semibold">Urgent</SelectItem>
              <SelectItem value="high" className="text-xs text-amber-600 font-semibold">High</SelectItem>
              <SelectItem value="medium" className="text-xs text-blue-600 font-medium">Medium</SelectItem>
              <SelectItem value="low" className="text-xs text-slate-600 font-medium">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Clear Selection Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg shrink-0 cursor-pointer"
          title="Clear selection"
        >
          <X className="w-4 h-4" />
        </Button>
      </motion.div>
    </AnimatePresence>
  );
}

