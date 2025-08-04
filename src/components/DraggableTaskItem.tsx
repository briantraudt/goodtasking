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
        "task-card flex flex-col cursor-grab active:cursor-grabbing transition-all duration-200",
        "py-1.5 px-3 rounded-lg border-0 relative group h-12 mb-1",
        "shadow-none hover:shadow-sm",
        cardStyling.bg,
        cardStyling.hover,
        isDragging && "opacity-50 shadow-md z-40 rotate-1 scale-105"
      )}
    >
      {/* Project/Client Name - Small, subtle gray */}
      {task.vibe_projects?.name && (
        <div className="text-xs text-gray-500 mb-0.5 font-normal">
          {task.vibe_projects.name}
        </div>
      )}
      
      {/* Task Title - Bold, primary focus */}
      <div className="flex-1 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-900 leading-tight truncate">
          {task.title}
        </h4>
        
        {/* Scheduled indicator */}
        {task.scheduled_date && (
          <div className="flex items-center gap-1 text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded ml-2">
            <Calendar className="h-2.5 w-2.5" />
            <span className="hidden sm:inline">Scheduled</span>
          </div>
        )}
      </div>

      {/* Minimal Drag Handle (appears on hover) */}
      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-50 transition-opacity">
        <GripVertical className="h-3 w-3 text-gray-400" />
      </div>
    </div>
  );
};

export default DraggableTaskItem;