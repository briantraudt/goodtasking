import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Clock, Calendar } from 'lucide-react';
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

  const getProjectBorderColor = (projectName?: string) => {
    if (!projectName) return 'border-gray-200';
    
    // Generate consistent colors based on project name
    const projectColors = {
      'DGTL Dental': 'border-blue-400',
      'Ryco Roofing': 'border-green-400', 
      'Personal': 'border-purple-400',
      'Work': 'border-orange-400',
      'Marketing': 'border-pink-400',
      'Development': 'border-indigo-400',
      'Design': 'border-cyan-400',
      'Business': 'border-amber-400',
    };
    
    // If project isn't in our predefined list, generate a color based on hash
    if (projectColors[projectName as keyof typeof projectColors]) {
      return projectColors[projectName as keyof typeof projectColors];
    }
    
    // Simple hash-based color generation for unknown projects
    const hash = projectName.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const colors = [
      'border-red-400', 'border-yellow-400', 'border-green-400', 'border-blue-400',
      'border-purple-400', 'border-pink-400', 'border-indigo-400', 'border-cyan-400'
    ];
    
    return colors[Math.abs(hash) % colors.length];
  };

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500'; 
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-400';
    }
  };

  const getPriorityBorderColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50/50';
      case 'medium': return 'border-yellow-200 bg-yellow-50/50'; 
      case 'low': return 'border-green-200 bg-green-50/50';
      default: return 'border-gray-200 bg-gray-50/50';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "p-4 rounded-lg border-2 cursor-grab active:cursor-grabbing transition-all duration-200",
        "hover:shadow-card hover:scale-[1.02] hover:border-primary/30",
        "bg-white flex flex-col min-h-[100px] relative group",
        getPriorityBorderColor(task.priority),
        getProjectBorderColor(task.vibe_projects?.name),
        isDragging && "opacity-50 shadow-elevated z-30 rotate-2"
      )}
    >
      {/* Priority Indicator Dot */}
      <div className="absolute top-2 left-2 flex items-center gap-1">
        <div className={cn("w-2 h-2 rounded-full", getPriorityColor(task.priority))} />
        {task.priority && (
          <span className="text-xs font-medium text-muted-foreground capitalize">
            {task.priority}
          </span>
        )}
      </div>

      {/* Duration in upper right corner */}
      {task.estimated_duration && (
        <div className="absolute top-2 right-2 flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span className="font-medium">{task.estimated_duration}m</span>
        </div>
      )}
      
      {/* Project name at top in small text - Enhanced */}
      {task.vibe_projects?.name && (
        <div className="text-xs text-muted-foreground mb-2 pr-16 pt-4 font-medium">
          {task.vibe_projects.name}
        </div>
      )}
      
      {/* Task title centered - Improved Typography */}
      <div className="flex-1 flex items-center justify-center mb-3">
        <h4 className="font-bold text-base leading-tight text-foreground text-center">{task.title}</h4>
      </div>
      
      {/* Due date in lower right corner */}
      {task.due_date && (
        <div className="absolute bottom-2 right-2 flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span className="font-medium">{format(new Date(task.due_date), 'MMM d')}</span>
        </div>
      )}

      {/* Drag Handle Indicator */}
      <div className="absolute top-2 right-8 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-1 h-4 bg-muted-foreground/30 rounded-full flex flex-col gap-0.5">
          <div className="w-full h-0.5 bg-current rounded-full" />
          <div className="w-full h-0.5 bg-current rounded-full" />
          <div className="w-full h-0.5 bg-current rounded-full" />
        </div>
      </div>
    </div>
  );
};

export default DraggableTaskItem;