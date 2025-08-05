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
      {...listeners}
      {...attributes}
      onClick={handleClick}
      className={cn(
        "flex items-center gap-2 w-full cursor-pointer",
        isDragging && "opacity-50"
      )}
    >
      <div className="flex-1 truncate">
        <span className="text-sm font-medium">{task.title}</span>
      </div>
      <div className="flex items-center gap-1 opacity-60">
        <GripVertical className="h-3 w-3" />
      </div>
    </div>
  );
};

export default DraggableTaskItem;