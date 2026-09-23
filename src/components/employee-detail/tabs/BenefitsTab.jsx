import React from "react";
import { CheckCircle, Gift } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function BenefitsTab({
  employee,
  isEditing,
  editData,
  setEditData,
}) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-900">Employee Benefits</h3>
      {isEditing ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Checkbox
              id="health_insurance"
              checked={editData.benefits?.health_insurance || false}
              onCheckedChange={(checked) => setEditData(prev => ({
                ...prev,
                benefits: { ...prev.benefits, health_insurance: checked }
              }))}
            />
            <Label htmlFor="health_insurance">Health Insurance</Label>
          </div>
          <div className="flex items-center gap-3">
            <Checkbox
              id="life_insurance"
              checked={editData.benefits?.life_insurance || false}
              onCheckedChange={(checked) => setEditData(prev => ({
                ...prev,
                benefits: { ...prev.benefits, life_insurance: checked }
              }))}
            />
            <Label htmlFor="life_insurance">Life Insurance</Label>
          </div>
          <div className="flex items-center gap-3">
            <Checkbox
              id="dental_insurance"
              checked={editData.benefits?.dental_insurance || false}
              onCheckedChange={(checked) => setEditData(prev => ({
                ...prev,
                benefits: { ...prev.benefits, dental_insurance: checked }
              }))}
            />
            <Label htmlFor="dental_insurance">Dental Insurance</Label>
          </div>
          <div className="flex items-center gap-3">
            <Checkbox
              id="gym_membership"
              checked={editData.benefits?.gym_membership || false}
              onCheckedChange={(checked) => setEditData(prev => ({
                ...prev,
                benefits: { ...prev.benefits, gym_membership: checked }
              }))}
            />
            <Label htmlFor="gym_membership">Gym Membership</Label>
          </div>
          <div className="flex items-center gap-3">
            <Checkbox
              id="transportation"
              checked={editData.benefits?.transportation || false}
              onCheckedChange={(checked) => setEditData(prev => ({
                ...prev,
                benefits: { ...prev.benefits, transportation: checked }
              }))}
            />
            <Label htmlFor="transportation">Transportation</Label>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {Object.entries(employee.benefits || {}).map(([key, value]) => (
            typeof value === 'boolean' && value && (
              <div key={key} className="flex items-center gap-3 p-4 rounded-lg bg-green-50">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium capitalize text-slate-900">{key.replace('_', ' ')}</span>
              </div>
            )
          ))}
          {(!employee.benefits || Object.values(employee.benefits).every(v => !v)) && (
            <div className="col-span-2 py-8 text-center">
              <Gift className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500">No benefits assigned</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
