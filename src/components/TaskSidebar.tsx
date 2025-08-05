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
  className?: string;
}

const TaskSidebar = ({ projects, selectedDate, onCreateTask, onCreateProject, className }: TaskSidebarProps) => {
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [dueDateFilter, setDueDateFilter] = useState<string>('all');
  const [showAddTaskDialog, setShowAddTaskDialog] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

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

  
  
  const getTaskCountByPriority = (priority: string) => {
    return allTasks.filter(task => task.priority === priority).length;
  };

  // Bold, Solid Primary Color Theme
  const getProjectColor = (projectName: string, index: number) => {
    const colors = [
      { 
        border: 'border-blue-600', 
        text: 'text-blue-600', 
        accent: 'text-blue-600',
        taskBg: 'bg-blue-600',
        taskHover: 'hover:bg-blue-700',
        name: 'blue'
      },
      { 
        border: 'border-green-600', 
        text: 'text-green-600', 
        accent: 'text-green-600',
        taskBg: 'bg-green-600',
        taskHover: 'hover:bg-green-700',
        name: 'green'
      },
      { 
        border: 'border-purple-600', 
        text: 'text-purple-600', 
        accent: 'text-purple-600',
        taskBg: 'bg-purple-600',
        taskHover: 'hover:bg-purple-700',
        name: 'purple'
      },
      { 
        border: 'border-red-600', 
        text: 'text-red-600', 
        accent: 'text-red-600',
        taskBg: 'bg-red-600',
        taskHover: 'hover:bg-red-700',
        name: 'red'
      },
      { 
        border: 'border-amber-600', 
        text: 'text-amber-600', 
        accent: 'text-amber-600',
        taskBg: 'bg-amber-600',
        taskHover: 'hover:bg-amber-700',
        name: 'amber'
      },
      { 
        border: 'border-pink-600', 
        text: 'text-pink-600', 
        accent: 'text-pink-600',
        taskBg: 'bg-pink-600',
        taskHover: 'hover:bg-pink-700',
        name: 'pink'
      }
    ];
    
    // Use consistent color assignment based on project name hash
    const hash = projectName.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return colors[hash % colors.length];
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

      {/* Filter Section - Moved to right */}
      <div className="mb-6 flex justify-end">
        <TaskFilters
          projects={projectsWithTasks}
          projectFilter={projectFilter}
          priorityFilter={priorityFilter}
          dueDateFilter={dueDateFilter}
          onProjectFilterChange={setProjectFilter}
          onPriorityFilterChange={setPriorityFilter}
          onDueDateFilterChange={setDueDateFilter}
          onClearAllFilters={() => {
            setProjectFilter('all');
            setPriorityFilter('all');
            setDueDateFilter('all');
          }}
        />
      </div>

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

          const projectColor = getProjectColor(project.name, index);

          return (
            <div 
              key={project.id} 
              className={cn(
                "rounded-2xl p-4 shadow-sm w-full transition-all duration-200 border-2",
                projectColor.border
              )}
            >
              {/* Enhanced Project Header with Color Theme */}
              <div className="flex justify-between items-center mb-3">
                <h3 className={cn(
                  "font-bold text-lg",
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
                    "text-sm hover:underline transition-all duration-200 font-medium",
                    projectColor.accent
                  )}
                >
                  + Add
                </button>
              </div>

              {/* Enhanced Task List */}
              <div className="flex flex-col gap-2">
                {projectTasks.map(task => {
                  // Determine if task is overdue for red styling
                  const isOverdue = task.due_date && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date));
                  
                  return (
                    <div
                      key={task.id}
                      className={cn(
                        "text-white font-semibold rounded-xl px-4 py-2 text-sm shadow cursor-pointer transition-all duration-200",
                        isOverdue 
                          ? "bg-red-600 hover:bg-red-700" 
                          : cn(projectColor.taskBg, projectColor.taskHover)
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 truncate">
                          <DraggableTaskItem task={task} />
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
            <div className="rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 p-8 border-2 border-dashed border-gray-300">
              {allTasks.length === 0 ? (
                <div>
                  <div className="text-4xl mb-4">🎉</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">All tasks complete!</h3>
                  <p className="text-gray-600">Great job staying on top of everything.</p>
                </div>
              ) : (
                <div>
                  <div className="text-4xl mb-4">🔍</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No matching tasks</h3>
                  <p className="text-gray-600">Try adjusting your filters to see more tasks.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default TaskSidebar;