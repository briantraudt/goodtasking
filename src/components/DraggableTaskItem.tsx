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
        "flex items-center w-full relative",
        isDragging && "opacity-50"
      )}
    >
      {/* Task name - clickable for editing */}
      <div 
        className="truncate cursor-pointer relative z-10 py-1"
        onClick={handleClick}
        title="Click to edit task"
      >
        <span className="text-sm font-medium bg-inherit px-1 py-0.5 rounded hover:bg-black/5 transition-colors">
          {task.title}
        </span>
      </div>
      
      {/* Extended drag area - starts right after text, covers remaining space */}
      <div
        className="flex-1 h-full cursor-grab active:cursor-grabbing min-h-[32px]"
        {...listeners}
        {...attributes}
        title="Drag to schedule this task"
      />
    </div>
  );
};

export default DraggableTaskItem;