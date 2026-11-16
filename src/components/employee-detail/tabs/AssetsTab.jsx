import React, { useState } from "react";
import { Laptop, Trash2, ShieldCheck, CheckCircle2, Clock, Monitor, Smartphone, Tablet, Cpu, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format } from "date-fns";

const assetIcons = {
  laptop: Laptop,
  monitor: Monitor,
  phone: Smartphone,
  tablet: Tablet,
  desktop: Laptop,
  equipment: Cpu,
  other: Layers,
};

export default function AssetsTab({
  employee,
  assets = [],
  onUnassignAsset,
  isUnassigning,
}) {
  const [assetToRemove, setAssetToRemove] = useState(null);

  return (
    <div className="flex flex-col overflow-hidden bg-white border shadow-xs rounded-xl border-slate-200/80">
      <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-base sm:text-lg font-semibold tracking-tight text-slate-900 font-heading flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>Assigned Hardware & Equipment</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Hardware currently issued to {employee?.fullName || employee?.full_name || "this employee"}
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
          {assets.length} Items Assigned
        </span>
      </div>

      <div className="p-4 sm:p-6">
        {assets.length === 0 ? (
          <div className="py-14 text-center">
            <div className="w-14 h-14 mx-auto mb-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-center text-slate-400">
              <Laptop className="w-7 h-7" />
            </div>
            <h4 className="text-sm font-semibold text-slate-800 font-heading">No Hardware Issued</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              No devices are currently assigned to this team member.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {assets.map((asset) => {
              const IconComponent = assetIcons[asset.asset_type?.toLowerCase() || asset.type?.toLowerCase()] || Laptop;
              const isConfirmed = Boolean(
                asset.confirmed_by_employee ||
                asset.confirmedByEmployee ||
                asset.confirmation_status === "confirmed" ||
                asset.confirmationStatus === "confirmed"
              );

              return (
                <div
                  key={asset.id || asset._id}
                  className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-center text-slate-700 shrink-0 shadow-2xs">
                      <IconComponent className="w-5 h-5 text-slate-700" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-semibold text-slate-900 text-sm">
                          {asset.asset_name || asset.name}
                        </p>
                        <span className="text-[11px] font-medium capitalize px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          {asset.asset_type || asset.type}
                        </span>
                        <span className="text-[11px] font-medium capitalize px-2 py-0.5 rounded-md bg-slate-100/70 text-slate-600">
                          {asset.condition || "Good"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5 text-xs text-slate-500 flex-wrap">
                        {(asset.serial_number || asset.serialNumber) && (
                          <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-800 text-[11px] font-medium">
                            S/N: {asset.serial_number || asset.serialNumber}
                          </span>
                        )}
                        {asset.specifications && (
                          <span className="text-slate-600 truncate max-w-sm">
                            {asset.specifications}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                    <Badge
                      className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
                        isConfirmed
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-300"
                      }`}
                    >
                      {isConfirmed ? "Receipt Confirmed" : "Pending Confirmation"}
                    </Badge>

                    <Dialog
                      open={assetToRemove?.id === asset.id || assetToRemove?._id === asset._id}
                      onOpenChange={(open) => !open && setAssetToRemove(null)}
                    >
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setAssetToRemove(asset)}
                          className="h-8 px-2.5 text-xs text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Return</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md bg-white rounded-2xl p-6 border-slate-200/80 shadow-xl">
                        <DialogHeader>
                          <DialogTitle className="text-lg font-bold text-slate-900 font-heading">
                            Return Hardware Asset
                          </DialogTitle>
                          <DialogDescription className="text-xs text-slate-500">
                            Confirm return of &ldquo;{assetToRemove?.asset_name || assetToRemove?.name}&rdquo; from {employee?.fullName || employee?.full_name}. This device will become available in stock.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="mt-5 flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setAssetToRemove(null)}
                            className="text-xs h-9 rounded-lg"
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              onUnassignAsset(assetToRemove.id || assetToRemove._id, () => setAssetToRemove(null));
                            }}
                            disabled={isUnassigning}
                            className="text-xs h-9 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold"
                          >
                            {isUnassigning ? "Returning..." : "Return to Stock"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
