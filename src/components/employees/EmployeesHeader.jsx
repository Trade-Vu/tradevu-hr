import React from "react";
import { ArrowLeft, Plus, Upload, Users, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function EmployeesHeader({
  showAddForm,
  totalEmployees,
  canManageInvites,
  onBackToDirectory,
  onOpenInviteDialog,
  onOpenImportDialog,
  onOpenAddForm,
  itemVariants,
}) {
  return (
    <motion.div variants={itemVariants} className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
      <div className="flex items-start gap-4">
        {showAddForm && (
          <Button
            variant="outline"
            size="icon"
            className="mt-1 rounded-xl border-slate-200 hover:bg-slate-50"
            onClick={onBackToDirectory}
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </Button>
        )}
        <div>
          {!showAddForm && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-full mb-4">
              <Users className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-semibold tracking-wider text-indigo-700 uppercase">Directory</span>
            </div>
          )}
          
          <p className="mt-1 text-slate-500">
            {showAddForm 
              ? "Add a new team member to your organization." 
              : `Manage your ${totalEmployees} employee${totalEmployees !== 1 ? 's' : ''}`
            }
          </p>
        </div>
      </div>
      {!showAddForm && (
        <div className="flex gap-3 shrink-0">
          <Button 
            onClick={onOpenImportDialog}
            variant="outline"
            className="text-indigo-700 border-indigo-200 rounded-lg hover:bg-indigo-50"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import CSV
          </Button>
          <Button 
            onClick={onOpenAddForm}
            className="text-white bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Employee
          </Button>
        </div>
      )}
    </motion.div>
  );
}
