import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Badge } from '@/components/ui/badge';
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

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'bg-priority-high/10 border-priority-high/30 text-priority-high';
      case 'medium': return 'bg-priority-medium/10 border-priority-medium/30 text-priority-medium';
      case 'low': return 'bg-priority-low/10 border-priority-low/30 text-priority-low';
      default: return 'bg-muted border-sidebar-border text-muted-foreground';
    }
  };

  const getPriorityBadgeColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'bg-priority-high/20 text-priority-high';
      case 'medium': return 'bg-priority-medium/20 text-priority-medium';
      case 'low': return 'bg-priority-low/20 text-priority-low';
      default: return 'bg-muted/50 text-muted-foreground';
    }
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
        "p-3 rounded-lg border cursor-grab transition-all hover:shadow-soft",
        getPriorityColor(task.priority),
        isDragging && "opacity-50 shadow-elevated z-50"
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-sm truncate flex-1">{task.title}</h4>
        <Badge variant="secondary" className={cn("text-xs", getPriorityBadgeColor(task.priority))}>
          {task.priority || 'medium'}
        </Badge>
      </div>
      
      <div className="space-y-1">
        {task.vibe_projects?.name && (
          <div className="text-xs text-muted-foreground">
            📁 {task.vibe_projects.name}
          </div>
        )}
        
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
    </div>
  );
};

export default DraggableTaskItem;