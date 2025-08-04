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

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "h-full",
        isOver && "ring-2 ring-primary ring-offset-2 bg-primary/5"
      )}
    >
      {/* Header Section */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-primary" />
            <span className="text-sm text-gray-600">Task Management</span>
          </div>
          <SmartAddButton
            projects={projects.map(p => ({ id: p.id, name: p.name, tasks: [] }))}
            onCreateTask={handleCreateTask}
            onCreateProject={onCreateProject}
          />
        </div>
      </div>

      {/* Filter Section */}
      <div className="mb-4">
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

      {/* Projects Grid - 3 Columns */}
      <div className="grid grid-cols-1 gap-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 400px)' }}>
        {projectsWithTasks.map(project => {
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

          return (
            <div key={project.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              {/* Project Header */}
              <div className="mb-3 pb-2 border-b border-gray-300">
                <h3 className="font-semibold text-gray-900 text-sm">{project.name}</h3>
                <div className="text-xs text-gray-500 mt-1">
                  {projectTasks.length} task{projectTasks.length !== 1 ? 's' : ''}
                </div>
              </div>

              {/* Project Tasks */}
              <div className="space-y-2">
                {projectTasks.map(task => (
                  <DraggableTaskItem key={task.id} task={task} />
                ))}
              </div>
            </div>
          );
        })}

        {/* Show message if no projects have tasks */}
        {projectsWithTasks.length === 0 && (
          <div className="col-span-full text-center py-8 text-muted-foreground text-sm">
            {allTasks.length === 0 ? (
              <p>🎉 All tasks are complete!</p>
            ) : (
              <p>No tasks match the current filters</p>
            )}
          </div>
        )}
      </div>

    </div>
  );
};

export default TaskSidebar;