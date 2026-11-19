import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { onboardingApi } from "@/api/onboarding.api";
import { queryKeys } from "@/constants/queryKeys";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { BookTemplate } from "lucide-react";

export default function AssignTemplateDialog({
  open,
  onClose,
  employeeId,
  initialTemplateId = "",
  onSuccess,
}) {
  const queryClient = useQueryClient();
  const [selectedTemplateId, setSelectedTemplateId] = useState(initialTemplateId);

  useEffect(() => {
    if (open) {
      setSelectedTemplateId(initialTemplateId || "");
    }
  }, [open, initialTemplateId]);

  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: queryKeys.templates.all,
    queryFn: async () => {
      const res = await onboardingApi.getTemplates();
      return Array.isArray(res) ? res : (res?.data || []);
    },
    enabled: open,
  });

  const assignTemplateMutation = useMutation({
    mutationFn: async (templateId) => {
      return await onboardingApi.assignTemplate(employeeId, templateId);
    },
    onSuccess: () => {
      queryKeys.tasks.invalidateAll(queryClient, employeeId);
      toast.success("Template assigned and employee onboarding tasks synced successfully!");
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || "Failed to assign template");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedTemplateId) return;
    assignTemplateMutation.mutate(selectedTemplateId);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[460px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900 font-heading">
              <BookTemplate className="w-5 h-5 text-indigo-600" />
              <span>Apply Onboarding Template</span>
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              Select an onboarding template to assign or re-sync with this employee. Milestone tasks defined in the template will be generated and synced to their checklist.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-700">Select Template</Label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={templatesLoading ? "Loading templates..." : "Choose an onboarding template"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((tpl) => (
                    <SelectItem key={tpl._id || tpl.id} value={tpl._id || tpl.id}>
                      {tpl.name} {tpl.department ? `(${tpl.department})` : ""} • v{tpl.version || "1.0"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
              <p className="font-semibold text-slate-700">Sync Behavior:</p>
              <ul className="list-disc pl-4 space-y-0.5 text-slate-500">
                <li>Template milestone tasks will be populated for this employee.</li>
                <li>Tasks already completed by the employee will be preserved.</li>
              </ul>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!selectedTemplateId || assignTemplateMutation.isPending}
              className="bg-slate-900 hover:bg-slate-800 text-white cursor-pointer"
            >
              {assignTemplateMutation.isPending ? "Applying..." : "Apply & Sync Tasks"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
