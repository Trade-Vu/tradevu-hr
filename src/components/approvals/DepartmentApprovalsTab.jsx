import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Building2, Loader2 } from 'lucide-react';
import { ApprovalsSkeleton, EmptyState } from './ApprovalsUIComponents';

export default function DepartmentApprovalsTab({
  loading,
  pendingDepartments,
  isAdmin,
  onApproveDepartment,
  isApprovingDepartment,
}) {
  if (loading) {
    return <ApprovalsSkeleton />;
  }

  if (pendingDepartments.length === 0) {
    return <EmptyState message="No pending departments across the organization." icon={Building2} />;
  }

  return (
    <div className="space-y-4">
      {pendingDepartments.map((dept) => (
        <Card key={dept.id} className="overflow-hidden border-slate-200">
          <CardContent className="p-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between p-4 md:p-6 gap-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                  <Building2 className="w-5 h-5 text-slate-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-900">{dept.name}</h3>
                    <Badge variant="outline" className="text-orange-600 bg-orange-50 border-orange-200">
                      New Department
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500 mb-1">Code: {dept.code || 'N/A'}</p>
                </div>
              </div>

              {isAdmin && (
                <div className="flex items-center gap-2 shrink-0">
                  <Button 
                    onClick={() => onApproveDepartment(dept.id)}
                    disabled={isApprovingDepartment}
                    className="bg-green-600 hover:bg-green-700 text-white w-full md:w-auto"
                  >
                    {isApprovingDepartment ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                    )}
                    Approve
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
