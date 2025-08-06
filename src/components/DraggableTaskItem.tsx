import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { GripVertical } from 'lucide-react';
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
  onTaskClick?: (task: Task) => void;
}

const DraggableTaskItem = ({ task, onTaskClick }: DraggableTaskItemProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: task,
  });

  const handleClick = (e: React.MouseEvent) => {
    // Only trigger click if we're not in the middle of a drag
    if (!isDragging && onTaskClick) {
      e.stopPropagation();
      onTaskClick(task);
    }
  };

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 w-full relative",
        isDragging && "opacity-50"
      )}
    >
      {/* Expanded drag area - covers everything except task name */}
      <div
        className="absolute inset-0 cursor-grab active:cursor-grabbing z-0"
        {...listeners}
        {...attributes}
        title="Drag to schedule this task"
      />
      
      {/* Task name - clickable for editing, positioned above drag area */}
      <div 
        className="flex-1 truncate cursor-pointer relative z-10 py-1"
        onClick={handleClick}
        title="Click to edit task"
      >
        <span className="text-sm font-medium bg-inherit px-1 py-0.5 rounded hover:bg-black/5 transition-colors">
          {task.title}
        </span>
      </div>
      
      {/* Much larger visual drag indicator */}
      <div className="flex items-center justify-center w-12 h-8 opacity-60 pointer-events-none relative z-10 bg-white/10 rounded">
        <GripVertical className="h-4 w-4" />
        <GripVertical className="h-4 w-4 -ml-2" />
      </div>
    </div>
  );
};

export default DraggableTaskItem;