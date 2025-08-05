import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import DraggableTaskItem from '@/components/DraggableTaskItem';
import SmartAddButton from '@/components/SmartAddButton';
import TaskFilters from '@/components/TaskFilters';
import AddTaskDialog from '@/components/AddTaskDialog';
import TaskEditDialog from '@/components/TaskEditDialog';
import { Plus, CheckSquare } from 'lucide-react';
import { isToday, isPast, isThisWeek } from 'date-fns';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  priority?: 'high' | 'medium' | 'low';
  estimated_duration?: number;
  due_date?: string | null;
  scheduled_date?: string | null;
  completed: boolean;
  vibe_projects?: { name: string };
}

interface Project {
  id: string;
  name: string;
  tasks: Task[];
}

interface TaskSidebarProps {
  projects: Project[];
  selectedDate: string;
  onCreateTask?: (projectId: string, title: string, description?: string, dueDate?: Date) => void;
  onCreateProject?: (project: { name: string; description: string; tasks: any[] }) => void;
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onDeleteTask?: (taskId: string) => Promise<void>;
  className?: string;
}

const TaskSidebar = ({ projects, selectedDate, onCreateTask, onCreateProject, onUpdateTask, onDeleteTask, className }: TaskSidebarProps) => {
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [dueDateFilter, setDueDateFilter] = useState<string>('all');
  const [showAddTaskDialog, setShowAddTaskDialog] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [showEditTaskDialog, setShowEditTaskDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Set up droppable for the sidebar
  const { isOver, setNodeRef } = useDroppable({
    id: 'task-sidebar',
  });

  // Get all incomplete tasks (both scheduled and unscheduled)
  const allTasks = useMemo(() => {
    return projects.flatMap(project => 
      project.tasks
        .filter(task => !task.completed) // Only filter out completed tasks
        .map(task => ({
          ...task,
          vibe_projects: { name: project.name }
        }))
    );
  }, [projects]);

  // Apply filters
  const filteredTasks = useMemo(() => {
    return allTasks.filter(task => {
      // Project filter
      if (projectFilter !== 'all') {
        const projectMatch = projects.find(p => 
          p.tasks.some(t => t.id === task.id) && p.id === projectFilter
        );
        if (!projectMatch) return false;
      }

      // Priority filter
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) {
        return false;
      }

      // Due date filter
      if (dueDateFilter !== 'all' && task.due_date) {
        const dueDate = new Date(task.due_date);
        switch (dueDateFilter) {
          case 'today':
            if (!isToday(dueDate)) return false;
            break;
          case 'overdue':
            if (!isPast(dueDate) || isToday(dueDate)) return false;
            break;
          case 'this-week':
            if (!isThisWeek(dueDate)) return false;
            break;
        }
      } else if (dueDateFilter !== 'all' && !task.due_date) {
        return false;
      }

      return true;
    });
  }, [allTasks, projectFilter, priorityFilter, dueDateFilter, projects]);

  // Get unique projects that have tasks
  const projectsWithTasks = useMemo(() => {
    return projects.filter(project => 
      project.tasks.some(task => !task.completed)
    );
  }, [projects]);

  // Wrapper to handle type compatibility with SmartAddButton
  const handleCreateTask = (projectId: string, title: string, scheduledDate: Date) => {
    onCreateTask?.(projectId, title, undefined, scheduledDate);
  };

  // Handle task click for editing
  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setShowEditTaskDialog(true);
  };

  // Handle task edit
  const handleTaskEdit = async (taskId: string, updates: Partial<Task>) => {
    if (onUpdateTask) {
      await onUpdateTask(taskId, updates);
    }
  };

  // Handle task delete
  const handleTaskDelete = async (taskId: string) => {
    if (onDeleteTask) {
      await onDeleteTask(taskId);
    }
  };

  
  
  const getTaskCountByPriority = (priority: string) => {
    return allTasks.filter(task => task.priority === priority).length;
  };

  // Unified Light Blue Color System - Match the Add button blue
  const getProjectColor = () => {
    // All projects use the same light blue color (#4DA8DA) for consistency
    return {
      hex: '#4DA8DA',
      border: 'border-[#4DA8DA]',
      text: 'text-[#4DA8DA]', 
      accent: 'text-[#4DA8DA]',
      taskBg: 'bg-[#4DA8DA]',
      taskHover: 'hover:brightness-110',
      name: 'brand-light-blue'
    };
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "h-full",
        isOver && "ring-2 ring-primary ring-offset-2 bg-primary/5"
      )}
    >
      {/* Tasks Section Header */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold text-foreground">Tasks</h1>
        </div>
        <SmartAddButton
          projects={projects}
          onCreateTask={handleCreateTask}
          onCreateProject={onCreateProject}
        />
      </div>
      
      {/* No header section needed - Add button is now in parent component */}

      {/* Removed filter section as requested */}

      {/* Projects Grid - 2 Columns for Wider Tasks */}
      <div className="grid grid-cols-2 gap-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 350px)' }}>
        {projectsWithTasks.map((project, index) => {
          // Get filtered tasks for this project
          const projectTasks = allTasks.filter(task => {
            // Check if task belongs to this project
            const belongsToProject = projects.find(p => 
              p.tasks.some(t => t.id === task.id) && p.id === project.id
            );
            if (!belongsToProject) return false;

            // Apply other filters
            if (priorityFilter !== 'all' && task.priority !== priorityFilter) {
              return false;
            }

            if (dueDateFilter !== 'all' && task.due_date) {
              const dueDate = new Date(task.due_date);
              switch (dueDateFilter) {
                case 'today':
                  if (!isToday(dueDate)) return false;
                  break;
                case 'overdue':
                  if (!isPast(dueDate) || isToday(dueDate)) return false;
                  break;
                case 'this-week':
                  if (!isThisWeek(dueDate)) return false;
                  break;
              }
            } else if (dueDateFilter !== 'all' && !task.due_date) {
              return false;
            }

            return true;
          });

          if (projectTasks.length === 0) return null;

          const projectColor = getProjectColor();

          return (
            <div 
              key={project.id} 
              className={cn(
                "bg-white rounded-xl p-4 shadow-sm w-full transition-all duration-150 border-2 hover:shadow-gb-card",
                projectColor.border
              )}
            >
              {/* Good Business Project Header */}
              <div className="flex justify-between items-center mb-2">
                <h3 className={cn(
                  "font-semibold",
                  projectColor.text
                )}>
                  {project.name}
                </h3>
                <button
                  onClick={() => {
                    setSelectedProjectId(project.id);
                    setShowAddTaskDialog(true);
                  }}
                  className={cn(
                    "text-sm hover:underline font-medium",
                    projectColor.accent
                  )}
                >
                  + Add
                </button>
              </div>

              {/* Light Blue Task Pills */}
              <div className="flex flex-col gap-2">
                {projectTasks.map(task => {
                  // Determine if task is overdue for red border styling
                  const isOverdue = task.due_date && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date));
                  
                  return (
                    <div
                      key={task.id}
                      className={cn(
                        "text-white font-medium rounded-md px-4 py-2 text-sm cursor-pointer transition-all duration-150",
                        isOverdue 
                          ? "bg-[#4DA8DA] hover:brightness-110 border-2 border-red-500" // Light blue background with red border for overdue
                          : cn(projectColor.taskBg, projectColor.taskHover)
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 truncate">
                          <DraggableTaskItem task={task} onTaskClick={handleTaskClick} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Show message if no projects have tasks */}
        {projectsWithTasks.length === 0 && (
          <div className="col-span-full text-center py-12">
            <div className="rounded-xl bg-white p-8 border-2 border-dashed border-[#E2E8F0] shadow-sm">
              {allTasks.length === 0 ? (
                <div>
                  <div className="text-4xl mb-4">🎉</div>
                  <h3 className="text-lg font-semibold text-[#0F172A] mb-2">All tasks complete!</h3>
                  <p className="text-[#64748B]">Great job staying on top of everything.</p>
                </div>
              ) : (
                <div>
                  <div className="text-4xl mb-4">🔍</div>
                  <h3 className="text-lg font-semibold text-[#0F172A] mb-2">No matching tasks</h3>
                  <p className="text-[#64748B]">Try adjusting your filters to see more tasks.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Task Dialog - Custom component that doesn't use the interface from AddTaskDialog */}
      {showAddTaskDialog && (
        <Dialog open={showAddTaskDialog} onOpenChange={setShowAddTaskDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Task</DialogTitle>
            </DialogHeader>
            {/* Simple form would go here - using existing onCreateTask function */}
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Task Dialog */}
      <TaskEditDialog
        task={selectedTask}
        isOpen={showEditTaskDialog}
        onClose={() => {
          setShowEditTaskDialog(false);
          setSelectedTask(null);
        }}
        onSave={handleTaskEdit}
        onDelete={handleTaskDelete}
      />

    </div>
  );
};

export default TaskSidebar;