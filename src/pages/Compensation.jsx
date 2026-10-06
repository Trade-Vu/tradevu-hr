import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, SlidersHorizontal, Users } from "lucide-react";
import { compensationApi, employeesApi } from "@/api";
import { useDepartments } from "@/hooks/useDepartmentsQuery";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import CompensationStructuresTab from "@/components/compensation/CompensationStructuresTab";
import CompensationAssignmentsTab from "@/components/compensation/CompensationAssignmentsTab";
import CreateStructureDialog from "@/components/compensation/CreateStructureDialog";
import EditStructureDialog from "@/components/compensation/EditStructureDialog";
import AssignStructureDialog from "@/components/compensation/AssignStructureDialog";

const listFrom = (response) => (Array.isArray(response) ? response : response?.data || []);

export default function Compensation() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("structures");
  const [showStructureDialog, setShowStructureDialog] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [assignTarget, setAssignTarget] = useState(null);

  const { data: departments = [] } = useDepartments();

  const { data: structures = [], isLoading: structuresLoading } = useQuery({
    queryKey: ["compensation-structures"],
    queryFn: async () => listFrom(await compensationApi.getStructures()),
  });

  const activeStructures = structures.filter((s) => s.status === "ACTIVE");

  const { data: employees = [], isLoading: employeesLoading } = useQuery({
    queryKey: ["employees-basic"],
    queryFn: () => employeesApi.getAllEmployees(),
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["compensation-assignments"],
    queryFn: async () => listFrom(await compensationApi.getAssignments()),
  });

  const assignmentByEmployeeId = assignments.reduce((acc, a) => {
    const empId = a.employeeId?._id || a.employeeId?.id || a.employeeId;
    if (empId) acc[empId] = a;
    return acc;
  }, {});

  const createStructureMutation = useMutation({
    mutationFn: (input) =>
      compensationApi.createStructure({
        name: input.name,
        departmentId: input.departmentId || undefined,
        payGrade: input.payGrade || undefined,
        effectiveDate: input.effectiveDate,
        components: {
          basicSalary: Number(input.basicSalary) || 0,
          allowances: input.allowances,
        },
        status: input.status,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compensation-structures"] });
      setShowStructureDialog(false);
      toast.success("Compensation structure created successfully");
    },
    onError: (err) =>
      toast.error(err?.response?.data?.message || err?.message || "Failed to create structure"),
  });

  const updateStructureMutation = useMutation({
    mutationFn: ({ id, data }) => compensationApi.updateStructure(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compensation-structures"] });
      setEditTarget(null);
      toast.success("Compensation structure updated successfully");
    },
    onError: (err) =>
      toast.error(err?.response?.data?.message || err?.message || "Failed to update structure"),
  });

  const deleteStructureMutation = useMutation({
    mutationFn: (id) => compensationApi.deleteStructure(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compensation-structures"] });
      toast.success("Compensation structure deleted successfully");
    },
    onError: (err) =>
      toast.error(err?.response?.data?.message || err?.message || "Failed to delete structure"),
  });

  const assignMutation = useMutation({
    mutationFn: (input) =>
      compensationApi.assign({
        employeeId: assignTarget?._id || assignTarget?.id,
        structureId: input.structureId,
        reason: input.reason || undefined,
        overrides:
          input.overrideBasicSalary !== "" && input.overrideBasicSalary !== undefined
            ? { basicSalary: Number(input.overrideBasicSalary) }
            : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compensation-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["employee"] });
      setShowAssignDialog(false);
      setAssignTarget(null);
      toast.success("Compensation structure assigned successfully");
    },
    onError: (err) =>
      toast.error(err?.response?.data?.message || err?.message || "Failed to assign structure"),
  });

  const handleOpenAssignDialog = (employee) => {
    setAssignTarget(employee);
    setShowAssignDialog(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Compensation Management
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Define salary structures and assign them to employees.
            </p>
          </div>

          <Button
            onClick={() => setShowStructureDialog(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Structure</span>
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-slate-100 p-1 rounded-xl h-auto inline-flex border border-slate-200/70">
            <TabsTrigger
              value="structures"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Salary Structures</span>
              <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-slate-200/70 text-slate-700 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                {structures.length}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="assignments"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
            >
              <Users className="w-4 h-4" />
              <span>Employee Assignments</span>
              <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-slate-200/70 text-slate-700 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                {employees.length}
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="structures" className="focus-visible:outline-none">
            <CompensationStructuresTab
              structures={structures}
              isLoading={structuresLoading}
              onOpenCreateDialog={() => setShowStructureDialog(true)}
              onEdit={(struct) => setEditTarget(struct)}
              onDelete={(id) => deleteStructureMutation.mutate(id)}
              onToggleStatus={(struct, status) =>
                updateStructureMutation.mutate({
                  id: struct._id || struct.id,
                  data: { status },
                })
              }
            />
          </TabsContent>

          <TabsContent value="assignments" className="focus-visible:outline-none">
            <CompensationAssignmentsTab
              employees={employees}
              isLoading={employeesLoading}
              assignmentByEmployeeId={assignmentByEmployeeId}
              onAssign={handleOpenAssignDialog}
            />
          </TabsContent>
        </Tabs>

        <CreateStructureDialog
          open={showStructureDialog}
          onOpenChange={setShowStructureDialog}
          departments={departments}
          onSubmit={(form) => createStructureMutation.mutate(form)}
          isPending={createStructureMutation.isPending}
        />

        <EditStructureDialog
          structure={editTarget}
          open={!!editTarget}
          onOpenChange={(open) => !open && setEditTarget(null)}
          departments={departments}
          onSubmit={(form) =>
            updateStructureMutation.mutate({
              id: editTarget._id || editTarget.id,
              data: form,
            })
          }
          isPending={updateStructureMutation.isPending}
        />

        <AssignStructureDialog
          open={showAssignDialog}
          onOpenChange={setShowAssignDialog}
          targetEmployee={assignTarget}
          activeStructures={activeStructures}
          onSubmit={(form) => assignMutation.mutate(form)}
          isPending={assignMutation.isPending}
        />
      </div>
    </div>
  );
}
