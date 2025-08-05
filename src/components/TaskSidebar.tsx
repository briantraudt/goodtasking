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

  // Light Blue Theme Colors - Consistent with the new logo
  const getProjectColor = (projectName: string, index: number) => {
    const colors = [
      { border: 'border-primary', bg: 'bg-white', text: 'text-primary', name: 'primary', hex: '#4DA8DA' },
      { border: 'border-[#15803D]', bg: 'bg-white', text: 'text-[#15803D]', name: 'green', hex: '#15803D' },
      { border: 'border-[#7C3AED]', bg: 'bg-white', text: 'text-[#7C3AED]', name: 'purple', hex: '#7C3AED' },
      { border: 'border-[#F59E0B]', bg: 'bg-white', text: 'text-[#F59E0B]', name: 'gold', hex: '#F59E0B' },
      { border: 'border-[#DC2626]', bg: 'bg-white', text: 'text-[#DC2626]', name: 'red', hex: '#DC2626' },
      { border: 'border-[#0891B2]', bg: 'bg-white', text: 'text-[#0891B2]', name: 'cyan', hex: '#0891B2' }
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
                "rounded-2xl border-4 p-5 shadow-inner bg-gradient-to-b from-white to-gray-50",
                "transition-all duration-200 hover:shadow-elevated flex flex-col gap-3",
                projectColor.border
              )}
            >
              {/* Elegant Project Title with Add Button */}
              <div className="border-b border-gray-200 pb-3 flex items-center justify-between">
                <h3 className={cn(
                  "font-bold text-lg",
                  projectColor.text
                )}>
                  {project.name}
                </h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setSelectedProjectId(project.id);
                    setShowAddTaskDialog(true);
                  }}
                  className={cn(
                    "h-6 w-6 p-0 hover:scale-110 transition-all duration-200",
                    `hover:bg-[${projectColor.hex}]/10`
                  )}
                  style={{ color: projectColor.hex }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Clean Task List - Pill Style */}
              <div className="flex flex-col gap-3">
                {projectTasks.map(task => {
                  // Determine if task is overdue for red border
                  const isOverdue = task.due_date && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date));
                  const leftBorderColor = isOverdue ? '#DC2626' : projectColor.hex;

                  return (
                     <div
                      key={task.id}
                      className="group cursor-pointer transform hover:scale-105 transition-all duration-200"
                    >
                      <div
                        className={cn(
                          "bg-white font-medium text-sm px-4 py-2 rounded-xl shadow-sm border transition-all duration-200",
                          "hover:shadow-lg hover:shadow-primary/25 relative overflow-hidden"
                        )}
                        style={{
                          borderColor: projectColor.hex,
                          borderLeftColor: leftBorderColor,
                          borderLeftWidth: '4px',
                          color: projectColor.hex
                        }}
                      >
                        {/* Hover overlay effect */}
                        <div 
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          style={{ backgroundColor: projectColor.hex }}
                        />
                        
                        {/* Task content */}
                        <div className="relative z-10 group-hover:text-white transition-colors duration-200">
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