import React from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, AlertCircle, Info, Loader2 } from "lucide-react";

const variantConfig = {
  danger: {
    icon: AlertCircle,
    iconWrapper: "bg-rose-50 text-rose-600 border border-rose-200/60",
    confirmBtn: "bg-rose-600 hover:bg-rose-700 text-white shadow-xs",
  },
  warning: {
    icon: AlertTriangle,
    iconWrapper: "bg-amber-50 text-amber-600 border border-amber-200/60",
    confirmBtn: "bg-amber-600 hover:bg-amber-700 text-white shadow-xs",
  },
  info: {
    icon: Info,
    iconWrapper: "bg-blue-50 text-blue-600 border border-blue-200/60",
    confirmBtn: "bg-slate-900 hover:bg-slate-800 text-white shadow-xs",
  },
  default: {
    icon: Info,
    iconWrapper: "bg-slate-100 text-slate-700 border border-slate-200",
    confirmBtn: "bg-slate-900 hover:bg-slate-800 text-white shadow-xs",
  },
};

export function ConfirmationDialog({
  open,
  onOpenChange,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  isLoading = false,
  onConfirm,
  onCancel,
}) {
  const config = variantConfig[variant] || variantConfig.danger;
  const Icon = config.icon;

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (onConfirm) {
      await onConfirm();
    }
  };

  const handleCancel = (e) => {
    e.preventDefault();
    if (onCancel) {
      onCancel();
    }
    if (onOpenChange) {
      onOpenChange(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl border border-slate-200/80 shadow-2xl bg-white p-6 max-w-md">
        <AlertDialogHeader className="space-y-3 text-left">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${config.iconWrapper}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <AlertDialogTitle className="font-heading text-base font-bold text-slate-900">
                {title}
              </AlertDialogTitle>
              <div className="text-xs text-slate-500 mt-1 leading-relaxed">
                <AlertDialogDescription asChild>
                  <span>{description}</span>
                </AlertDialogDescription>
              </div>
            </div>
          </div>
        </AlertDialogHeader>

        <AlertDialogFooter className="flex flex-row justify-end gap-2.5 pt-4 mt-2 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCancel}
            disabled={isLoading}
            className="h-8.5 px-3.5 text-xs font-semibold rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            {cancelText}
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleConfirm}
            disabled={isLoading}
            className={`h-8.5 px-4 text-xs font-semibold rounded-lg cursor-pointer gap-1.5 ${config.confirmBtn}`}
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{confirmText}</span>
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default ConfirmationDialog;

