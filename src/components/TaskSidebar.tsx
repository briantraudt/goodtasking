import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import DraggableTaskItem from '@/components/DraggableTaskItem';
import SmartAddButton from '@/components/SmartAddButton';
import TaskFilters from '@/components/TaskFilters';
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

  const handleCreateTask = (projectId: string, title: string, scheduledDate: Date) => {
    onCreateTask?.(projectId, title, undefined, scheduledDate);
  };
  
  const getTaskCountByPriority = (priority: string) => {
    return allTasks.filter(task => task.priority === priority).length;
  };

  // Function to get Good Business project colors
  const getProjectColor = (projectName: string, index: number) => {
    const colors = [
      { border: 'border-project-navy', bg: 'bg-project-navy-bg', text: 'text-project-navy', name: 'navy' },
      { border: 'border-project-forest', bg: 'bg-project-forest-bg', text: 'text-project-forest', name: 'forest' },
      { border: 'border-project-indigo', bg: 'bg-project-indigo-bg', text: 'text-project-indigo', name: 'indigo' },
      { border: 'border-project-sky', bg: 'bg-project-sky-bg', text: 'text-project-sky', name: 'sky' },
      { border: 'border-project-purple', bg: 'bg-project-purple-bg', text: 'text-project-purple', name: 'purple' },
      { border: 'border-project-gold', bg: 'bg-project-gold-bg', text: 'text-project-gold', name: 'gold' }
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
      {/* No header section needed - Add button is now in parent component */}

      {/* Filter Section */}
      <div className="mb-6">
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

      {/* Projects Grid - 3 Columns with Bold Design */}
      <div className="grid grid-cols-3 gap-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 350px)' }}>
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
                "rounded-xl border-2 p-4 shadow-card transition-all duration-200 hover:shadow-elevated",
                projectColor.border,
                projectColor.bg
              )}
            >
              {/* Bold Project Header with Gradient */}
              <div className={cn(
                "mb-4 rounded-lg p-3 -mx-1",
                "bg-gradient-to-r from-white/60 to-white/30 backdrop-blur-sm"
              )}>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-3 h-3 rounded-full",
                    projectColor.border.replace('border-', 'bg-')
                  )} />
                  <h3 className={cn(
                    "font-bold text-base",
                    projectColor.text
                  )}>
                    {project.name}
                  </h3>
                </div>
              </div>

              {/* Project Tasks with Enhanced Cards */}
              <div className="space-y-3">
                {projectTasks.map(task => {
                  // Determine task status for color coding
                  let statusColor = 'border-l-gray-300'; // Default: unscheduled
                  let statusBg = 'bg-white';
                  
                  if (task.scheduled_date) {
                    statusColor = `border-l-${projectColor.name}-500`;
                    statusBg = 'bg-white';
                  }
                  
                  if (task.due_date && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date))) {
                    statusColor = 'border-l-red-500';
                    statusBg = 'bg-red-50';
                  }

                  return (
                    <div
                      key={task.id}
                      className={cn(
                        "rounded-lg border-l-4 p-3 shadow-soft transition-all duration-200",
                        "hover:shadow-card hover:transform hover:scale-[1.02] cursor-pointer",
                        statusColor,
                        statusBg
                      )}
                    >
                      <DraggableTaskItem task={task} />
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