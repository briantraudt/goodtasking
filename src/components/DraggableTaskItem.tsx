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

  const getCardStyling = (projectName?: string, priority?: string) => {
    // Subtle backgrounds based on priority/project, keeping it minimal
    if (priority === 'high') {
      return {
        bg: 'bg-red-50/50',
        border: 'border-red-100',
        hover: 'hover:bg-red-50'
      };
    }
    if (priority === 'medium') {
      return {
        bg: 'bg-yellow-50/50',
        border: 'border-yellow-100',
        hover: 'hover:bg-yellow-50'
      };
    }
    if (priority === 'low') {
      return {
        bg: 'bg-green-50/50',
        border: 'border-green-100',
        hover: 'hover:bg-green-50'
      };
    }
    
    // Default neutral clean tone
    return {
      bg: 'bg-gray-50/50',
      border: 'border-gray-100',
      hover: 'hover:bg-gray-100/70'
    };
  };

  const getPriorityIcon = (priority?: string) => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡'; 
      case 'low': return '🟢';
      default: return null;
    }
  };

  const cardStyling = getCardStyling(task.vibe_projects?.name, task.priority);

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
        "task-card flex flex-col cursor-grab active:cursor-grabbing transition-all duration-200",
        "py-2 px-3 rounded-[10px] border mb-2 relative group",
        "shadow-[0_1px_2px_rgba(0,0,0,0.04)] font-inter h-16",
        cardStyling.bg,
        cardStyling.border,
        cardStyling.hover,
        "hover:shadow-[0_2px_4px_rgba(0,0,0,0.08)]",
        isDragging && "opacity-50 shadow-lg z-40 rotate-1 scale-105"
      )}
    >
      {/* Top Row - Meta (small, muted) */}
      <div className="flex justify-between items-center text-xs text-gray-500 mb-1">
        <div className="flex items-center gap-2">
          {task.vibe_projects?.name && (
            <span className="font-medium">{task.vibe_projects.name}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {task.estimated_duration && (
            <div className="flex items-center gap-1">
              <span>•</span>
              <span>{task.estimated_duration}m</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Title - Primary focus (large, bold, single-line) */}
      <div className="flex-1 flex items-center">
        <h4 className="text-base font-semibold text-gray-900 leading-tight truncate">
          {task.title}
        </h4>
      </div>
      
      {/* Footer - Optional (due date + priority) */}
      {(task.due_date || task.priority) && (
        <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
          <div>
            {task.due_date && (
              <span className="font-medium">
                {format(new Date(task.due_date), 'MMM d')}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {getPriorityIcon(task.priority) && (
              <>
                <span className="text-[10px]">{getPriorityIcon(task.priority)}</span>
                <span className="capitalize">{task.priority}</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Drag Handle (appears on hover) */}
      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-60 transition-opacity">
        <GripVertical className="h-3 w-3 text-gray-400" />
      </div>
    </div>
  );
};

export default DraggableTaskItem;