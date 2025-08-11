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
    backgroundColor: projectColor || '#6b7280',
    opacity: isDragging ? 0.5 : (task.completed ? 0.75 : 1)
  } : {
    backgroundColor: projectColor || '#6b7280',
    opacity: task.completed ? 0.75 : 1
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center w-full relative rounded-lg p-1.5 transition-all duration-200 min-h-[44px] md:min-h-[28px] text-white border-0 cursor-grab active:cursor-grabbing",
        isDragging && "shadow-lg z-50"
      )}
      {...listeners}
      {...attributes}
      title="Drag to schedule this task"
    >
      {/* Task content */}
      <div className="flex-1 relative">
        <span 
          className={cn(
            "text-sm font-medium text-white hover:bg-white/10 transition-colors px-1 py-0.5 rounded cursor-pointer",
            task.completed && "line-through opacity-60"
          )}
          onClick={handleEditClick}
          onPointerDown={(e) => e.stopPropagation()}
          title="Click to edit task"
        >
          {task.title}
        </span>
      </div>

      {/* Checkbox for task completion */}
      <div 
        className="flex-shrink-0 ml-2 mr-2 flex items-center justify-center" 
        onPointerDown={(e) => e.stopPropagation()}
      >
        <Checkbox
          checked={task.completed}
          onCheckedChange={handleCheckboxChange}
          onClick={(e) => e.stopPropagation()}
          className="h-3 w-3 data-[state=checked]:bg-white data-[state=checked]:border-white [&>*]:text-black"
        />
      </div>
    </div>
  );
};

export default DraggableTaskItem;