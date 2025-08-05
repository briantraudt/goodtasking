import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Clock, GripVertical, Calendar } from 'lucide-react';
import { format } from 'date-fns';
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

interface DraggableTaskItemProps {
  task: Task;
}

const DraggableTaskItem = ({ task }: DraggableTaskItemProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: task,
  });

  const getMinimalCardStyling = (projectName?: string) => {
    // Project-specific subtle background colors for minimal design
    const projectStyles = {
      'DGTL Dental': { bg: 'bg-blue-50', hover: 'hover:bg-blue-100' },
      'Ryco Roofing': { bg: 'bg-green-50', hover: 'hover:bg-green-100' },
      'Personal': { bg: 'bg-purple-50', hover: 'hover:bg-purple-100' },
      'Work': { bg: 'bg-orange-50', hover: 'hover:bg-orange-100' },
      'Marketing': { bg: 'bg-pink-50', hover: 'hover:bg-pink-100' },
      'Development': { bg: 'bg-indigo-50', hover: 'hover:bg-indigo-100' },
      'Design': { bg: 'bg-cyan-50', hover: 'hover:bg-cyan-100' },
      'Business': { bg: 'bg-amber-50', hover: 'hover:bg-amber-100' },
    };
    
    if (projectName && projectStyles[projectName as keyof typeof projectStyles]) {
      return projectStyles[projectName as keyof typeof projectStyles];
    }
    
    // Default soft gray for unknown projects
    return { bg: 'bg-gray-50', hover: 'hover:bg-gray-100' };
  };

  const cardStyling = getMinimalCardStyling(task.vibe_projects?.name);

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
        "flex items-center justify-between cursor-grab active:cursor-grabbing",
        "w-full",
        isDragging && "opacity-50 z-40"
      )}
    >
      {/* Task Title - Clean and minimal */}
      <span className="text-sm font-medium truncate">
        {task.title}
      </span>

      {/* Minimal Drag Handle (appears on hover) */}
      <div className="opacity-0 group-hover:opacity-60 transition-opacity ml-2 flex-shrink-0">
        <GripVertical className="h-3 w-3" />
      </div>
    </div>
  );
};

export default DraggableTaskItem;