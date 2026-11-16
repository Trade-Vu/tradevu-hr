import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { TASK_STATUSES, normalizeTaskStatus } from "@/constants/taskStatus";

export default function TaskProjectsView({
  mappedProjects = [],
  allTasks = [],
  onSelectProject,
}) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
      {mappedProjects.map((project) => {
        const projectTasks = allTasks.filter((t) => t.project_id === project.id);
        const completedCount = projectTasks.filter(
          (t) => normalizeTaskStatus(t.status) === TASK_STATUSES.DONE
        ).length;
        const progress = projectTasks.length > 0 ? Math.round((completedCount / projectTasks.length) * 100) : 0;

        return (
          <Card
            key={project.id}
            className="h-full border-slate-200/80 shadow-xs hover:shadow-md transition-all rounded-xl overflow-hidden bg-white group flex flex-col"
          >
            <div className="p-5 border-b border-slate-100 flex justify-between items-start gap-3">
              <div>
                <h3 className="font-heading font-bold text-base text-slate-900 group-hover:text-blue-600 transition-colors">
                  {project.project_name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Manager: <span className="text-slate-600 font-medium">{project.project_manager}</span>
                </p>
              </div>
              <Badge
                variant="outline"
                className={`shrink-0 rounded-full text-[10px] font-semibold border ${
                  project.status === "completed"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-blue-50 text-blue-700 border-blue-200"
                }`}
              >
                {project.status.replace("_", " ")}
              </Badge>
            </div>

            <div className="p-5 space-y-4 flex-1 flex flex-col">
              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                {project.description || "Active project workstream and deliverables track."}
              </p>

              <div className="space-y-1.5 mt-auto">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-500">Progress</span>
                  <span className="text-slate-900 font-bold">{progress}%</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-900 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                    Tasks Completed
                  </span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">
                    {completedCount} <span className="text-slate-400 font-normal">/ {projectTasks.length}</span>
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                    Deadline
                  </span>
                  <p className="font-semibold text-slate-800 text-sm mt-0.5 truncate">
                    {project.end_date ? new Date(project.end_date).toLocaleDateString() : "Flexible"}
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={() => onSelectProject(project.id)}
                className="w-full text-xs font-semibold rounded-lg border-slate-200 hover:bg-slate-50 text-slate-700 gap-1.5 cursor-pointer"
              >
                <span>View Kanban Board</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

