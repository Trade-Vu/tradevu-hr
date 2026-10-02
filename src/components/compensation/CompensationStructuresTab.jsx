import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Plus, Search, SlidersHorizontal } from "lucide-react";

export default function CompensationStructuresTab({
  structures = [],
  isLoading = false,
  onOpenCreateDialog,
}) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredStructures = useMemo(() => {
    if (!searchTerm.trim()) return structures;
    const term = searchTerm.toLowerCase();
    return structures.filter(
      (s) =>
        s.name?.toLowerCase().includes(term) ||
        s.payGrade?.toLowerCase().includes(term) ||
        s.status?.toLowerCase().includes(term)
    );
  }, [structures, searchTerm]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search structures..."
            className="pl-9 h-9 text-sm bg-white"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium self-end sm:self-center">
          Showing {filteredStructures.length} of {structures.length} structures
        </div>
      </div>

      <Card className="border border-slate-200/80 shadow-sm overflow-hidden bg-white">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/70 hover:bg-slate-50/70">
                  <TableHead className="font-semibold text-xs text-slate-700">Name</TableHead>
                  <TableHead className="font-semibold text-xs text-slate-700">Pay Grade</TableHead>
                  <TableHead className="font-semibold text-xs text-slate-700">Effective Date</TableHead>
                  <TableHead className="font-semibold text-xs text-slate-700">Basic Salary</TableHead>
                  <TableHead className="font-semibold text-xs text-slate-700">Allowances</TableHead>
                  <TableHead className="font-semibold text-xs text-slate-700">Total Est.</TableHead>
                  <TableHead className="font-semibold text-xs text-slate-700 text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                      <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-blue-600 border-r-transparent mb-2" />
                      <p className="text-xs">Loading compensation structures...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredStructures.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="max-w-xs mx-auto text-center space-y-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                          <SlidersHorizontal className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {searchTerm ? "No matching structures" : "No structures yet"}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {searchTerm
                              ? "Try adjusting your search criteria"
                              : "Get started by creating your first compensation salary structure."}
                          </p>
                        </div>
                        {!searchTerm && (
                          <Button
                            size="sm"
                            onClick={onOpenCreateDialog}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs mt-2"
                          >
                            <Plus className="w-3.5 h-3.5 mr-1.5" />
                            Create Structure
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStructures.map((struct) => {
                    const basic = Number(struct.components?.basicSalary) || 0;
                    const totalAllowances = (struct.components?.allowances || []).reduce(
                      (sum, a) =>
                        sum +
                        (a.mode === "percentage"
                          ? (basic * (Number(a.value) || 0)) / 100
                          : Number(a.value) || 0),
                      0
                    );
                    const totalEstimate = basic + totalAllowances;

                    return (
                      <TableRow key={struct._id || struct.id} className="hover:bg-slate-50/60">
                        <TableCell className="font-semibold text-slate-900 text-sm">
                          {struct.name}
                        </TableCell>
                        <TableCell>
                          {struct.payGrade ? (
                            <Badge variant="secondary" className="font-medium text-xs bg-slate-100 text-slate-700">
                              {struct.payGrade}
                            </Badge>
                          ) : (
                            <span className="text-slate-400 text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-slate-600 text-xs">
                          {struct.effectiveDate
                            ? format(new Date(struct.effectiveDate), "MMM d, yyyy")
                            : "—"}
                        </TableCell>
                        <TableCell className="text-emerald-600 font-medium text-sm">
                          {basic.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-slate-600 text-xs">
                          {totalAllowances > 0 ? (
                            <span>
                              {totalAllowances.toLocaleString()}{" "}
                              <span className="text-[11px] text-slate-400">
                                ({struct.components?.allowances?.length || 0})
                              </span>
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </TableCell>
                        <TableCell className="font-semibold text-slate-800 text-sm">
                          {totalEstimate.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant="outline"
                            className={
                              struct.status === "ACTIVE"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 font-medium text-xs"
                                : struct.status === "INACTIVE"
                                ? "bg-slate-100 text-slate-600 border-slate-200 font-medium text-xs"
                                : "bg-amber-50 text-amber-700 border-amber-200 font-medium text-xs"
                            }
                          >
                            {struct.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
