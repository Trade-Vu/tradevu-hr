import React, { useState } from 'react';
import {
  Laptop,
  Smartphone,
  Monitor,
  Tablet,
  Cpu,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
  ArrowUpRight,
  Layers,
  CreditCard,
  Wifi,
  HelpCircle,
  AlertTriangle,
} from 'lucide-react';
import { CardSpotlight } from '@/components/ui/card-spotlight';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { useAuth } from '@/lib/AuthContext';

const assetTypeIcons = {
  laptop: Laptop,
  phone: Smartphone,
  monitor: Monitor,
  tablet: Tablet,
  desktop: Laptop,
  id_card: CreditCard,
  modem: Wifi,
  equipment: Cpu,
  other: Layers,
};

export default function AssetsTab({
  assets = [],
  onConfirmAsset,
  isConfirming = false,
  onDisputeAsset,
  isDisputing = false,
}) {
  const { user } = useAuth();
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [confirmNotes, setConfirmNotes] = useState('');

  const [disputingAsset, setDisputingAsset] = useState(null);
  const [disputeReason, setDisputeReason] = useState('');

  const totalCount = assets.length;
  const disputedCount = assets.filter(
    (a) => a.confirmation_status === 'disputed' || a.confirmationStatus === 'disputed' || a.is_disputed || a.isDisputed
  ).length;
  const confirmedCount = assets.filter(
    (a) =>
      (a.confirmed_by_employee || a.confirmedByEmployee || a.confirmation_status === 'confirmed' || a.confirmationStatus === 'confirmed') &&
      !a.is_disputed &&
      !a.isDisputed
  ).length;
  const pendingCount = totalCount - confirmedCount - disputedCount;

  const handleOpenConfirm = (asset) => {
    setSelectedAsset(asset);
    setConfirmNotes('');
  };

  const handleConfirmSubmit = async () => {
    if (!selectedAsset) return;
    if (onConfirmAsset) {
      await onConfirmAsset({
        assetId: selectedAsset.id || selectedAsset._id,
        notes: confirmNotes,
        confirmedBy: user?.fullName || user?.email || 'Employee',
        confirmedAt: new Date().toISOString(),
      });
    }
    setSelectedAsset(null);
  };

  const handleOpenDispute = (asset) => {
    setDisputingAsset(asset);
    setDisputeReason('');
  };

  const handleDisputeSubmit = async () => {
    if (!disputingAsset) return;
    if (!disputeReason.trim()) {
      return;
    }
    if (onDisputeAsset) {
      await onDisputeAsset({
        assetId: disputingAsset.id || disputingAsset._id,
        reason: disputeReason.trim(),
        disputedBy: user?.fullName || user?.email || 'Employee',
        disputedAt: new Date().toISOString(),
      });
    }
    setDisputingAsset(null);
  };

  const statMetrics = [
    {
      title: 'Assigned Assets',
      value: `${totalCount} Total`,
      subtext: 'Hardware & gear issued to you',
      icon: Laptop,
      trend: `${totalCount} Registered`,
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200/60',
    },
    {
      title: 'Confirmed & In Use',
      value: `${confirmedCount} Verified`,
      subtext: 'Receipt confirmed by employee',
      icon: CheckCircle2,
      trend: `${Math.round((confirmedCount / (totalCount || 1)) * 100)}% Accepted`,
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    },
    {
      title: 'Pending / In Review',
      value: `${pendingCount + disputedCount} Items`,
      subtext: disputedCount > 0 ? `${disputedCount} flagged for HR review` : 'Receipt sign-off needed',
      icon: disputedCount > 0 ? AlertTriangle : Clock,
      trend: disputedCount > 0 ? `${disputedCount} Disputed` : pendingCount > 0 ? 'Action Required' : 'All Verified',
      badgeColor:
        disputedCount > 0
          ? 'bg-rose-50 text-rose-700 border-rose-200/60'
          : pendingCount > 0
          ? 'bg-amber-50 text-amber-700 border-amber-200/60'
          : 'bg-slate-50 text-slate-700 border-slate-200/60',
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Spotlight Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        {statMetrics.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="group block focus:outline-none">
              <CardSpotlight
                radius={280}
                color="rgba(79, 70, 229, 0.06)"
                borderColor="rgba(79, 70, 229, 0.25)"
                className="h-full p-4 sm:p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md border-slate-200/80 bg-white rounded-xl"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                    <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                    {item.title}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-heading">
                      {item.value}
                    </span>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                    <span className="text-slate-500 truncate max-w-[130px] sm:max-w-none">
                      {item.subtext}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border shrink-0 ${item.badgeColor}`}>
                      {item.trend}
                    </span>
                  </div>
                </div>
              </CardSpotlight>
            </div>
          );
        })}
      </div>

      {/* 2. Action Required / Disputed Banners */}
      {disputedCount > 0 && (
        <div className="p-4 rounded-xl bg-rose-50/80 border border-rose-200/90 flex items-start gap-3 shadow-2xs">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs text-rose-950">
            <p className="font-semibold text-sm">Disputed Asset Flagged for HR Review</p>
            <p className="mt-0.5 text-rose-800">
              You have {disputedCount} asset record{disputedCount > 1 ? 's' : ''} flagged for review. The asset remains allocated to your profile while HR investigates and contacts you for reconciliation.
            </p>
          </div>
        </div>
      )}

      {pendingCount > 0 && (
        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-3 shadow-2xs">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-950">
            <p className="font-semibold text-sm">Action Required: Confirm Assigned Hardware</p>
            <p className="mt-0.5 text-amber-800">
              You have {pendingCount} assigned asset{pendingCount > 1 ? 's' : ''} awaiting receipt confirmation. Please inspect your equipment serial numbers and click &ldquo;Confirm Receipt&rdquo; or &ldquo;Dispute Record&rdquo; if there is an issue.
            </p>
          </div>
        </div>
      )}

      {/* 3. Main Hardware Card Container */}
      <div className="flex flex-col overflow-hidden bg-white border shadow-xs rounded-xl border-slate-200/80">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-semibold tracking-tight text-slate-900 font-heading flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Assigned Company Assets</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Workstation laptops, mobile devices, ID cards, modems, and gear provisioned during onboarding and active employment
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {assets.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-14 h-14 mx-auto mb-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-center text-slate-400">
                <Laptop className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-semibold text-slate-800 font-heading">No Assets Issued Yet</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                You currently do not have any company assets assigned to your profile. Hardware provisioned during onboarding or active employment will be displayed here for receipt verification.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {assets.map((asset) => {
                const typeKey = (asset.asset_type || asset.type || 'other').toLowerCase();
                const IconComponent = assetTypeIcons[typeKey] || Laptop;

                const isDisputed = Boolean(
                  asset.confirmation_status === 'disputed' ||
                  asset.confirmationStatus === 'disputed' ||
                  asset.is_disputed ||
                  asset.isDisputed
                );

                const isConfirmed =
                  !isDisputed &&
                  Boolean(
                    asset.confirmed_by_employee ||
                    asset.confirmedByEmployee ||
                    asset.confirmation_status === 'confirmed' ||
                    asset.confirmationStatus === 'confirmed'
                  );

                return (
                  <div
                    key={asset.id || asset._id}
                    className={`p-4 sm:p-5 rounded-xl border transition-all duration-200 ${
                      isDisputed
                        ? 'bg-rose-50/40 border-rose-200/90 shadow-2xs'
                        : isConfirmed
                        ? 'bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-xs'
                        : 'bg-amber-50/30 border-amber-200 hover:border-amber-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3.5 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-center text-slate-700 shrink-0 shadow-2xs">
                          <IconComponent className="w-5 h-5 text-slate-700" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-bold text-slate-900 truncate font-heading">
                            {asset.asset_name || asset.name || 'Company Asset'}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-slate-500 capitalize">
                              {asset.asset_type || asset.type || 'Asset'}
                            </span>
                            {asset.model && (
                              <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                Model: {asset.model}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <Badge
                        className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
                          isDisputed
                            ? 'bg-rose-50 text-rose-700 border-rose-300'
                            : isConfirmed
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-300 animate-pulse'
                        }`}
                      >
                        {isDisputed
                          ? 'Flagged for HR Review'
                          : isConfirmed
                          ? 'Confirmed & Active'
                          : 'Pending Confirmation'}
                      </Badge>
                    </div>

                    {/* Metadata Grid */}
                    <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[11px] text-slate-400 block font-medium">Identifier / Serial No</span>
                        <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-800 text-[11px] font-medium inline-block mt-0.5">
                          {asset.serial_number || asset.serialNumber || 'N/A'}
                        </span>
                      </div>

                      <div>
                        <span className="text-[11px] text-slate-400 block font-medium">Condition Notes</span>
                        <span className="text-slate-700 font-semibold capitalize inline-block mt-0.5">
                          {asset.condition || 'Good'}
                        </span>
                      </div>

                      {asset.specifications && (
                        <div className="col-span-2">
                          <span className="text-[11px] text-slate-400 block font-medium">Specifications</span>
                          <span className="text-slate-700 font-medium leading-relaxed block mt-0.5">
                            {asset.specifications}
                          </span>
                        </div>
                      )}

                      {(asset.assigned_date || asset.assignedAt) && (
                        <div>
                          <span className="text-[11px] text-slate-400 block font-medium">Assigned Date</span>
                          <span className="text-slate-600 font-medium inline-block mt-0.5">
                            {format(new Date(asset.assigned_date || asset.assignedAt), 'MMM d, yyyy')}
                          </span>
                        </div>
                      )}

                      {isConfirmed && (asset.confirmed_at || asset.confirmedAt) && (
                        <div>
                          <span className="text-[11px] text-slate-400 block font-medium">Confirmed By You</span>
                          <span className="text-emerald-700 font-semibold inline-block mt-0.5">
                            {format(new Date(asset.confirmed_at || asset.confirmedAt), 'MMM d, yyyy')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Disputed Note Card */}
                    {isDisputed && (
                      <div className="mt-3.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs space-y-1">
                        <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">
                          Dispute Reason Logged
                        </span>
                        <p className="text-rose-900 font-medium">
                          &ldquo;{asset.dispute_reason || asset.disputeReason || 'Disputed by employee'}&rdquo;
                        </p>
                        <p className="text-[10px] text-rose-600">
                          Remains assigned while HR investigates • Logged on{' '}
                          {asset.disputed_at || asset.disputedAt
                            ? format(new Date(asset.disputed_at || asset.disputedAt), 'MMM d, yyyy')
                            : 'Recently'}
                        </p>
                      </div>
                    )}

                    {/* Action buttons if pending confirmation */}
                    {!isConfirmed && !isDisputed && (
                      <div className="mt-4 pt-3 border-t border-amber-200/60 flex items-center justify-between gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleOpenDispute(asset)}
                          className="text-xs text-rose-600 hover:text-rose-800 hover:underline font-medium cursor-pointer"
                        >
                          Dispute Record
                        </button>

                        <Button
                          size="sm"
                          onClick={() => handleOpenConfirm(asset)}
                          className="h-8 px-3 text-xs bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-2xs gap-1.5 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Confirm Receipt</span>
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={Boolean(selectedAsset)} onOpenChange={(open) => !open && setSelectedAsset(null)}>
        <DialogContent className="max-w-md bg-white rounded-2xl p-6 border-slate-200/80 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 font-heading flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Confirm Asset Receipt</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1">
              Please verify that you have physically received this equipment in the reported condition. Your acknowledgment will be recorded with your timestamp and identity.
            </DialogDescription>
          </DialogHeader>

          {selectedAsset && (
            <div className="my-3 p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Asset Name:</span>
                <span className="font-bold text-slate-900">{selectedAsset.asset_name || selectedAsset.name}</span>
              </div>
              {selectedAsset.model && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Model:</span>
                  <span className="text-slate-800 font-semibold">{selectedAsset.model}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Asset Type:</span>
                <span className="text-slate-700 capitalize font-medium">{selectedAsset.asset_type || selectedAsset.type}</span>
              </div>
              {(selectedAsset.serial_number || selectedAsset.serialNumber) && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Identifier / Serial:</span>
                  <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 font-semibold text-slate-900">
                    {selectedAsset.serial_number || selectedAsset.serialNumber}
                  </span>
                </div>
              )}
              {selectedAsset.condition && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Reported Condition:</span>
                  <span className="text-slate-800 capitalize font-semibold">{selectedAsset.condition}</span>
                </div>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="confirmNotes" className="text-xs font-semibold text-slate-700">
              Acknowledgment Notes (Optional)
            </Label>
            <Textarea
              id="confirmNotes"
              placeholder="e.g. Device inspected and in pristine condition with charger and accessories."
              value={confirmNotes}
              onChange={(e) => setConfirmNotes(e.target.value)}
              className="text-xs resize-none h-20 bg-slate-50 border-slate-200 focus:bg-white rounded-lg"
            />
          </div>

          <DialogFooter className="mt-5 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSelectedAsset(null)}
              className="text-xs h-9 rounded-lg"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isConfirming}
              onClick={handleConfirmSubmit}
              className="text-xs h-9 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold gap-1.5 shadow-sm cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isConfirming ? 'Recording Confirmation...' : 'I Confirm Receipt'}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dispute Dialog */}
      <Dialog open={Boolean(disputingAsset)} onOpenChange={(open) => !open && setDisputingAsset(null)}>
        <DialogContent className="max-w-md bg-white rounded-2xl p-6 border-slate-200/80 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 font-heading flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              <span>Dispute Asset Record</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1">
              If you did not receive this item or details (such as serial number or condition) are incorrect, please provide details. The asset will remain assigned but flagged for HR review.
            </DialogDescription>
          </DialogHeader>

          {disputingAsset && (
            <div className="my-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
              <p className="font-semibold text-slate-900">{disputingAsset.asset_name || disputingAsset.name}</p>
              <p className="text-slate-500 font-mono text-[11px] mt-0.5">
                S/N: {disputingAsset.serial_number || disputingAsset.serialNumber || 'N/A'}
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="disputeReason" className="text-xs font-semibold text-slate-700">
              Reason for Dispute *
            </Label>
            <Textarea
              id="disputeReason"
              placeholder="e.g. I have not received this laptop yet, or the serial number on my physical unit does not match..."
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              required
              rows={3}
              className="text-xs resize-none bg-slate-50 border-slate-200 focus:bg-white rounded-lg"
            />
          </div>

          <DialogFooter className="mt-5 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDisputingAsset(null)}
              className="text-xs h-9 rounded-lg"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isDisputing || !disputeReason.trim()}
              onClick={handleDisputeSubmit}
              className="text-xs h-9 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold gap-1.5 shadow-sm cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{isDisputing ? 'Submitting Dispute...' : 'Submit Dispute to HR'}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
