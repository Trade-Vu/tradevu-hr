import React from "react";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import { Plus } from "lucide-react";
import { TASK_STATUS_CONFIG } from "@/constants/taskStatus";
import TaskCard from "./TaskCard";

export default function TaskKanbanView({
  tasksByStatus,
  onDragEnd,
  onOpenCreateWithColumn,
  onSelectTask,
  selectedTaskIds = [],
  onToggleSelectTask,
}) {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar snap-x">
        {Object.entries(TASK_STATUS_CONFIG).map(([status, config]) => {
          const columnTasks = tasksByStatus[status] || [];

          return (
            <div
              key={status}
              className="flex flex-col bg-slate-50/70 rounded-xl p-3 sm:p-3.5 h-[calc(100vh-320px)] min-h-[500px] max-h-[780px] border border-slate-200/80 transition-colors w-[300px] shrink-0 snap-start shadow-2xs"
            >
              {/* Pinned Column Header */}
              <div className="flex items-center justify-between mb-3 px-1 shrink-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-900 text-sm tracking-tight font-heading">
                    {config.title}
                  </h3>
                  <span className={`text-[11px] font-semibold px-2 py-0.2 rounded-full border ${config.color}`}>
                    {columnTasks.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenCreateWithColumn(status)}
                  title={`Add task to ${config.title}`}
                  className="w-6 h-6 rounded-md hover:bg-slate-200/70 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Viewport-locked, independently scrollable card droppable container */}
              <Droppable droppableId={status}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 overflow-y-auto overflow-x-hidden space-y-2.5 pr-1 -mr-1 transition-colors rounded-lg p-1 [scrollbar-width:thin] [scrollbar-color:theme(colors.slate.200)_transparent] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-300 ${
                      snapshot.isDraggingOver ? "bg-slate-100/90 ring-1 ring-slate-300" : ""
                    }`}
                  >
                    {columnTasks.map((task, index) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        index={index}
                        onSelectTask={onSelectTask}
                        isSelected={selectedTaskIds.includes(task.id)}
                        onToggleSelect={onToggleSelectTask}
                      />
                    ))}
                    {provided.placeholder}

                    {columnTasks.length === 0 && (
                      <div className="h-32 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-center p-3 text-slate-400">
                        <p className="text-xs font-medium">No tasks</p>
                        <button
                          type="button"
                          onClick={() => onOpenCreateWithColumn(status)}
                          className="text-[11px] text-slate-600 hover:text-slate-900 font-semibold mt-1 underline cursor-pointer"
                        >
                          + Add task
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
