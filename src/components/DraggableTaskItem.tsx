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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "p-3 rounded-lg border-2 cursor-grab transition-all hover:shadow-soft bg-white flex flex-col min-h-[100px]",
        getProjectBorderColor(task.vibe_projects?.name),
        isDragging && "opacity-50 shadow-elevated z-50"
      )}
    >
      {/* Project name at top in small text */}
      {task.vibe_projects?.name && (
        <div className="text-xs text-muted-foreground mb-2">
          {task.vibe_projects.name}
        </div>
      )}
      
      {/* Task title left-aligned in large text */}
      <div className="flex-1 flex items-center mb-3">
        <h4 className="font-semibold text-base leading-tight text-foreground">{task.title}</h4>
      </div>
      
      {/* Duration and date at bottom, left-aligned */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {task.estimated_duration && (
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {task.estimated_duration}m
          </div>
        )}
        
        {task.due_date && (
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {format(new Date(task.due_date), 'MMM d')}
          </div>
        )}
      </div>
    </div>
  );
};

export default DraggableTaskItem;