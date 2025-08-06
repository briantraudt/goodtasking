import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { GripVertical, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';

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
  onTaskComplete?: (taskId: string, completed: boolean) => void;
}

const DraggableTaskItem = ({ task, onTaskClick, onTaskComplete }: DraggableTaskItemProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: task,
  });

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger completion if clicking on drag handle or checkbox
    const target = e.target as HTMLElement;
    if (target.closest('[data-drag-handle]') || target.closest('[data-checkbox]')) {
      return;
    }
    
    // Only trigger click if we're not in the middle of a drag
    if (!isDragging && onTaskComplete) {
      e.stopPropagation();
      onTaskComplete(task.id, !task.completed);
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    // Only trigger edit if we're not in the middle of a drag and clicking specifically on text
    if (!isDragging && onTaskClick) {
      e.stopPropagation();
      onTaskClick(task);
    }
  };

  const handleCheckboxChange = (checked: boolean) => {
    if (onTaskComplete) {
      onTaskComplete(task.id, checked);
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
        "flex items-center w-full relative rounded-lg p-2 transition-all duration-200 cursor-pointer min-h-[44px]",
        "hover:bg-gray-50 active:bg-gray-100",
        task.completed ? "bg-gray-50/60 opacity-75" : "bg-white",
        isDragging && "opacity-50 shadow-lg z-50"
      )}
      onClick={handleCardClick}
    >
      {/* Checkbox for task completion */}
      <div className="flex-shrink-0 mr-3 z-10" data-checkbox onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={task.completed}
          onCheckedChange={handleCheckboxChange}
          className="rounded-sm"
        />
      </div>

      {/* Task name - clickable for editing */}
      <div 
        className={cn(
          "flex-1 cursor-text z-10",
          task.completed && "line-through opacity-60"
        )}
        onClick={handleEditClick}
        title="Click to edit task"
      >
        <span className="text-sm font-medium hover:bg-black/5 transition-colors px-1 py-0.5 rounded">
          {task.title}
        </span>
      </div>
      
      {/* Extended drag area - starts right after text, covers remaining space */}
      <div
        className="flex-shrink-0 h-full cursor-grab active:cursor-grabbing min-h-[44px] w-8 flex items-center justify-center"
        data-drag-handle
        {...listeners}
        {...attributes}
        title="Drag to schedule this task"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  );
};

export default DraggableTaskItem;