import React, { useState, useMemo, useEffect } from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import {
  Plus,
  Search,
  SlidersHorizontal,
  MoreVertical,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
} from "lucide-react";

export default function CompensationStructuresTab({
  structures = [],
  isLoading = false,
  onOpenCreateDialog,
  onEdit,
  onDelete,
  onToggleStatus,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredStructures.length / pageSize));
  const paginatedStructures = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStructures.slice(start, start + pageSize);
  }, [filteredStructures, currentPage, pageSize]);

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
                  <TableHead className="font-semibold text-xs text-slate-700">Status</TableHead>
                  <TableHead className="font-semibold text-xs text-slate-700 text-right w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-slate-500">
                      <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-blue-600 border-r-transparent mb-2" />
                      <p className="text-xs">Loading compensation structures...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredStructures.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
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
                  paginatedStructures.map((struct) => {
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
                        <TableCell>
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
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900"
                              >
                                <MoreVertical className="w-4 h-4" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44 text-xs">
                              <DropdownMenuItem
                                onClick={() => onEdit && onEdit(struct)}
                                className="cursor-pointer gap-2"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                                <span>Edit Structure</span>
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() =>
                                  onToggleStatus &&
                                  onToggleStatus(
                                    struct,
                                    struct.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"
                                  )
                                }
                                className="cursor-pointer gap-2"
                              >
                                {struct.status === "ACTIVE" ? (
                                  <>
                                    <XCircle className="w-3.5 h-3.5 text-amber-600" />
                                    <span>Set Inactive</span>
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Set Active</span>
                                  </>
                                )}
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              <DropdownMenuItem
                                onClick={() => setDeleteTarget(struct)}
                                className="cursor-pointer gap-2 text-red-600 focus:text-red-700 focus:bg-red-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete Structure</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {filteredStructures.length > 0 && (
            <div className="px-4 py-3 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/70">
              <span className="text-xs text-slate-500">
                Showing <span className="font-semibold text-slate-800">{(currentPage - 1) * pageSize + 1}</span> to{" "}
                <span className="font-semibold text-slate-800">
                  {Math.min(currentPage * pageSize, filteredStructures.length)}
                </span>{" "}
                of <span className="font-semibold text-slate-800">{filteredStructures.length}</span> structures
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-7 px-2.5 text-xs bg-white"
                >
                  Previous
                </Button>
                <span className="text-xs font-medium px-2 text-slate-600">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-7 px-2.5 text-xs bg-white"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base text-slate-900">
              Delete Compensation Structure?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-slate-800">
                &ldquo;{deleteTarget?.name}&rdquo;
              </span>
              ? If any employees are currently assigned to this structure, deletion will be blocked and you should mark it Inactive instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget && onDelete) {
                  onDelete(deleteTarget._id || deleteTarget.id);
                  setDeleteTarget(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white text-xs"
            >
              Delete Structure
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
