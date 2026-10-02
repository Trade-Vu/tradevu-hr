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
import { Search, Users, UserCheck } from "lucide-react";

export default function CompensationAssignmentsTab({
  employees = [],
  isLoading = false,
  assignmentByEmployeeId = {},
  onAssign,
}) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredEmployees = useMemo(() => {
    if (!searchTerm.trim()) return employees;
    const term = searchTerm.toLowerCase();
    return employees.filter((emp) => {
      const name = emp.fullName?.toLowerCase() || "";
      const code = emp.employeeCode?.toLowerCase() || "";
      const dept = emp.departmentId?.name?.toLowerCase() || "";
      const title = emp.jobTitle?.toLowerCase() || "";
      const assigned =
        assignmentByEmployeeId[emp._id || emp.id]?.compensationStructureId?.name?.toLowerCase() ||
        "";

      return (
        name.includes(term) ||
        code.includes(term) ||
        dept.includes(term) ||
        title.includes(term) ||
        assigned.includes(term)
      );
    });
  }, [employees, assignmentByEmployeeId, searchTerm]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, code, dept, job title..."
            className="pl-9 h-9 text-sm bg-white"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium self-end sm:self-center">
          Showing {filteredEmployees.length} of {employees.length} employees
        </div>
      </div>

      <Card className="border border-slate-200/80 shadow-sm overflow-hidden bg-white">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/70 hover:bg-slate-50/70">
                  <TableHead className="font-semibold text-xs text-slate-700">Employee</TableHead>
                  <TableHead className="font-semibold text-xs text-slate-700">Department</TableHead>
                  <TableHead className="font-semibold text-xs text-slate-700">Job Title</TableHead>
                  <TableHead className="font-semibold text-xs text-slate-700">Current Structure</TableHead>
                  <TableHead className="font-semibold text-xs text-slate-700 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                      <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-blue-600 border-r-transparent mb-2" />
                      <p className="text-xs">Loading employee assignments...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <div className="max-w-xs mx-auto text-center space-y-2">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                          <Users className="w-5 h-5" />
                        </div>
                        <p className="text-sm font-semibold text-slate-800">
                          {searchTerm ? "No matching employees" : "No employees found"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {searchTerm
                            ? "Try adjusting your search criteria"
                            : "Employees in your organization will appear here for compensation assignment."}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEmployees.map((emp) => {
                    const empId = emp._id || emp.id;
                    const assignment = assignmentByEmployeeId[empId];
                    const structureName =
                      assignment?.compensationStructureId?.name || null;

                    return (
                      <TableRow key={empId} className="hover:bg-slate-50/60">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-semibold text-slate-700 flex-shrink-0">
                              {emp.fullName
                                ? emp.fullName
                                    .split(" ")
                                    .map((n) => n[0])
                                    .slice(0, 2)
                                    .join("")
                                    .toUpperCase()
                                : "EM"}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 text-sm">
                                {emp.fullName}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {emp.employeeCode || "No Code"}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-600 text-xs">
                          {emp.departmentId?.name || "N/A"}
                        </TableCell>
                        <TableCell className="text-slate-600 text-xs">
                          {emp.jobTitle || "—"}
                        </TableCell>
                        <TableCell>
                          {structureName ? (
                            <Badge
                              variant="outline"
                              className="bg-blue-50 text-blue-700 border-blue-200 font-medium text-xs flex items-center gap-1 w-fit"
                            >
                              <UserCheck className="w-3 h-3" />
                              <span>{structureName}</span>
                            </Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="bg-slate-100 text-slate-500 border-transparent font-normal text-xs"
                            >
                              Not assigned
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onAssign(emp)}
                            className="h-8 text-xs border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-200"
                          >
                            {structureName ? "Change Structure" : "Assign Structure"}
                          </Button>
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
