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
  projectColor?: string;
}

const DraggableTaskItem = ({ task, onTaskClick, onTaskComplete, projectColor }: DraggableTaskItemProps) => {
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
    backgroundColor: task.completed ? '#6b7280' : (projectColor || '#6b7280'),
    opacity: isDragging ? 0.5 : (task.completed ? 0.75 : 1)
  } : {
    backgroundColor: task.completed ? '#6b7280' : (projectColor || '#6b7280'),
    opacity: task.completed ? 0.75 : 1
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center w-full relative rounded-lg p-1.5 transition-all duration-200 cursor-pointer min-h-[22px] text-white border-0",
        isDragging && "shadow-lg z-50"
      )}
      onClick={handleCardClick}
    >
      {/* Draggable background area */}
      <div 
        className="absolute inset-0 cursor-grab active:cursor-grabbing z-0"
        {...listeners}
        {...attributes}
        title="Drag to schedule this task"
      />

      {/* Task content */}
      <div className="flex-1 relative z-10">
        <span 
          className={cn(
            "text-sm font-medium text-white hover:bg-white/10 transition-colors px-1 py-0.5 rounded cursor-pointer",
            task.completed && "line-through opacity-60"
          )}
          onClick={handleEditClick}
          title="Click to edit task"
        >
          {task.title}
        </span>
      </div>

      {/* Checkbox for task completion - moved to right side */}
      <div className="flex-shrink-0 ml-2 mr-2 z-10 flex items-center justify-center" data-checkbox onClick={(e) => e.stopPropagation()}>
        <div
          onClick={(e) => {
            e.stopPropagation();
            handleCheckboxChange(!task.completed);
          }}
          className={cn(
            "h-2.5 w-2.5 border-2 border-white bg-white cursor-pointer transition-all duration-200 hover:scale-110 rounded-none",
            task.completed && "bg-white border-white"
          )}
        >
          {task.completed && (
            <div className="h-full w-full flex items-center justify-center">
              <div className="w-1 h-1 bg-black rounded-none"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DraggableTaskItem;