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
    <Card 
      ref={setNodeRef}
      className={cn(
        className,
        "rounded-xl border shadow-soft bg-card",
        isOver && "ring-2 ring-primary ring-offset-2 bg-primary/5"
      )}
    >
      <CardHeader className="pb-4 sticky top-0 bg-white z-50 border-b shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckSquare className="h-5 w-5 text-primary" />
            <h3 className="text-xl font-bold text-foreground">Tasks</h3>
          </div>
          <SmartAddButton
            projects={projects.map(p => ({ id: p.id, name: p.name, tasks: [] }))}
            onCreateTask={handleCreateTask}
            onCreateProject={onCreateProject}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Modern Filter Component */}
        <div className="pt-4">
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

        {/* Task List - Increased Height for More Compact Cards */}
        <ScrollArea className="h-[500px] pr-2">
          <div className="space-y-0">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                {allTasks.length === 0 ? (
                  <p>🎉 All tasks are complete!</p>
                ) : (
                  <p>No tasks match the current filters</p>
                )}
              </div>
            ) : (
              filteredTasks.map(task => (
                <DraggableTaskItem key={task.id} task={task} />
              ))
            )}
          </div>
        </ScrollArea>

      </CardContent>
    </Card>
  );
};

export default TaskSidebar;