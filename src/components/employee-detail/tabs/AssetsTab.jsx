import React, { useState } from "react";
import { Laptop, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function AssetsTab({
  employee,
  assets = [],
  onUnassignAsset,
  isUnassigning,
}) {
  const [assetToRemove, setAssetToRemove] = useState(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Assigned Assets</h3>
      </div>

      {assets.length === 0 ? (
        <div className="py-12 text-center">
          <Laptop className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500">No assets assigned</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assets.map(asset => (
            <div key={asset.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                  <Laptop className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">{asset.asset_name}</p>
                  <p className="text-sm text-slate-500">{asset.asset_type}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="text-green-700 bg-green-100">{asset.assignment_status || 'Active'}</Badge>
                <Dialog open={assetToRemove?.id === asset.id} onOpenChange={(open) => !open && setAssetToRemove(null)}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="ghost" onClick={() => setAssetToRemove(asset)}>
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Return Asset</DialogTitle>
                    </DialogHeader>
                    <p>Are you sure you want to return "{assetToRemove?.asset_name}" from {employee?.full_name}?</p>
                    <div className="flex justify-end gap-3 mt-4">
                      <Button variant="outline" onClick={() => setAssetToRemove(null)}>Cancel</Button>
                      <Button
                        onClick={() => {
                          onUnassignAsset(assetToRemove.id, () => setAssetToRemove(null));
                        }}
                        disabled={isUnassigning}
                      >
                        {isUnassigning ? 'Returning...' : 'Return Asset'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
