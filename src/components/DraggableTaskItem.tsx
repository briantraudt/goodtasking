import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Clock, GripVertical } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  priority?: 'high' | 'medium' | 'low';
  estimated_duration?: number;
  due_date?: string | null;
  completed: boolean;
  vibe_projects?: { name: string };
}

interface DraggableTaskItemProps {
  task: Task;
}

const DraggableTaskItem = ({ task }: DraggableTaskItemProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: task,
  });

  const getProjectStyling = (projectName?: string) => {
    if (!projectName) return {
      bg: 'bg-gray-50',
      text: 'text-gray-900',
      border: 'border-gray-200'
    };
    
    // Project-specific color schemes
    const projectStyles = {
      'DGTL Dental': { bg: 'bg-blue-50', text: 'text-blue-900', border: 'border-blue-200' },
      'Ryco Roofing': { bg: 'bg-green-50', text: 'text-green-900', border: 'border-green-200' },
      'Personal': { bg: 'bg-purple-50', text: 'text-purple-900', border: 'border-purple-200' },
      'Work': { bg: 'bg-orange-50', text: 'text-orange-900', border: 'border-orange-200' },
      'Marketing': { bg: 'bg-pink-50', text: 'text-pink-900', border: 'border-pink-200' },
      'Development': { bg: 'bg-indigo-50', text: 'text-indigo-900', border: 'border-indigo-200' },
      'Design': { bg: 'bg-cyan-50', text: 'text-cyan-900', border: 'border-cyan-200' },
      'Business': { bg: 'bg-amber-50', text: 'text-amber-900', border: 'border-amber-200' },
    };
    
    // Return project-specific styling or generate from hash
    if (projectStyles[projectName as keyof typeof projectStyles]) {
      return projectStyles[projectName as keyof typeof projectStyles];
    }
    
    // Generate consistent colors for unknown projects
    const hash = projectName.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const colors = [
      { bg: 'bg-red-50', text: 'text-red-900', border: 'border-red-200' },
      { bg: 'bg-yellow-50', text: 'text-yellow-900', border: 'border-yellow-200' },
      { bg: 'bg-green-50', text: 'text-green-900', border: 'border-green-200' },
      { bg: 'bg-blue-50', text: 'text-blue-900', border: 'border-blue-200' },
      { bg: 'bg-purple-50', text: 'text-purple-900', border: 'border-purple-200' },
      { bg: 'bg-pink-50', text: 'text-pink-900', border: 'border-pink-200' },
      { bg: 'bg-indigo-50', text: 'text-indigo-900', border: 'border-indigo-200' },
      { bg: 'bg-cyan-50', text: 'text-cyan-900', border: 'border-cyan-200' }
    ];
    
    return colors[Math.abs(hash) % colors.length];
  };

  const getPriorityBadge = (priority?: string) => {
    if (!priority) return null;
    
    const priorityStyles = {
      'high': { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
      'medium': { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' },
      'low': { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
    };
    
    return priorityStyles[priority as keyof typeof priorityStyles];
  };

  const projectStyling = getProjectStyling(task.vibe_projects?.name);
  const priorityBadge = getPriorityBadge(task.priority);

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "task-card p-3 rounded-lg border cursor-grab active:cursor-grabbing transition-all duration-200",
        "hover:scale-[1.01] hover:shadow-md shadow-sm",
        "flex flex-col gap-1 h-[72px] relative group",
        projectStyling.bg,
        projectStyling.text,
        projectStyling.border,
        isDragging && "opacity-50 shadow-lg z-40 rotate-2 scale-105"
      )}
    >
      {/* Top Row: Project Name, Duration, Priority */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          {task.vibe_projects?.name && (
            <span className="text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
              {task.vibe_projects.name}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {task.estimated_duration && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded">
              <Clock className="h-3 w-3" />
              <span className="font-medium">{task.estimated_duration}m</span>
            </div>
          )}
          
          {priorityBadge && (
            <span 
              className={cn(
                "text-xs font-semibold px-1.5 py-0.5 rounded border",
                priorityBadge.bg,
                priorityBadge.text,
                priorityBadge.border
              )}
            >
              {task.priority?.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
      </div>
      
      {/* Task Title - Emphasized and Centered */}
      <div className="flex-1 flex items-center justify-center">
        <h4 className="text-base font-bold leading-tight text-center line-clamp-2">
          {task.title}
        </h4>
      </div>
      
      {/* Bottom Row: Due Date (if exists) */}
      {task.due_date && (
        <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
          <span className="font-medium">
            Due {format(new Date(task.due_date), 'MMM d')}
          </span>
        </div>
      )}

      {/* Drag Handle (appears on hover) */}
      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical className="h-3 w-3 text-muted-foreground/50" />
      </div>
    </div>
  );
};

export default DraggableTaskItem;