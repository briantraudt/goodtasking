import React, { useState, useCallback } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { useCategories } from '@/hooks/useCategories';
import { Check, Home, User, Briefcase, GripVertical } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  priority?: 'high' | 'medium' | 'low';
  estimated_duration?: number;
  due_date?: string | null;
  scheduled_date?: string | null;
  start_time?: string;
  end_time?: string;
  completed: boolean;
  project_id: string;
  vibe_projects?: { name: string };
}

interface Project {
  id: string;
  name: string;
  color?: string;
  category: string;
}

interface ResizableTaskBlockProps {
  task: Task;
  projects: Project[];
  onRemove: (taskId: string) => void;
  onEdit?: (task: Task) => void;
  onTaskComplete?: (taskId: string, completed: boolean) => void;
  onResize?: (taskId: string, startTime: string, endTime: string) => void;
  style?: React.CSSProperties;
}

export const ResizableTaskBlock = ({ 
  task, 
  projects, 
  onRemove, 
  onEdit, 
  onTaskComplete, 
  onResize,
  style 
}: ResizableTaskBlockProps) => {
  const { categories } = useCategories();
  const [isResizing, setIsResizing] = useState<'top' | 'bottom' | null>(null);
  const [startY, setStartY] = useState(0);
  const [originalTimes, setOriginalTimes] = useState<{ start: string; end: string } | null>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `scheduled-${task.id}`,
    disabled: isResizing !== null,
  });

  const dragStyle = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  // Get project color
  const project = projects.find(p => p.id === task.project_id);
  const getProjectColor = (category: string = 'work', customColor?: string) => {
    if (customColor) return customColor;
    
    switch (category) {
      case 'personal': return 'hsl(150, 45%, 45%)';
      case 'home': return 'hsl(25, 95%, 53%)';
      case 'work':
      default: return '#4DA8DA';
    }
  };

  const projectColor = getProjectColor(project?.category, project?.color);

  // Get category icon function
  const getCategoryIcon = (category: string) => {
    const categoryLower = category.toLowerCase();
    const categoryData = categories.find(cat => cat.name.toLowerCase() === categoryLower);
    
    if (!categoryData) {
      switch (categoryLower) {
        case 'home': return Home;
        case 'personal': return User;
        case 'work': return Briefcase;
        default: return Briefcase;
      }
    }
    
    return categoryData.icon || Briefcase;
  };

  const handleCheckboxChange = (checked: boolean) => {
    if (onTaskComplete) {
      onTaskComplete(task.id, checked);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isResizing) return;
    e.preventDefault();
    e.stopPropagation();
    onEdit?.(task);
  };

  const timeToMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const snapToSlot = (minutes: number): number => {
    return Math.round(minutes / 30) * 30;
  };

  const handleResizeStart = useCallback((e: React.MouseEvent, direction: 'top' | 'bottom') => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🎯 Resize start:', direction, 'Task:', task.id);
    
    if (!task.start_time || !task.end_time) {
      console.error('❌ Task missing start_time or end_time:', task);
      return;
    }
    
    setIsResizing(direction);
    const mouseStartY = e.clientY;
    setStartY(mouseStartY);
    const origTimes = { start: task.start_time, end: task.end_time };
    setOriginalTimes(origTimes);
    
    console.log('✅ Resize initialized:', { direction, mouseStartY, origTimes });
    
    // Add global mouse event listeners
    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - mouseStartY;
      const deltaSlots = Math.round(deltaY / 48); // Each slot is 48px
      const deltaMinutes = deltaSlots * 30; // Each slot is 30 minutes
      
      console.log('📏 Mouse move:', { deltaY, deltaSlots, deltaMinutes });
      
      const originalStartMinutes = timeToMinutes(origTimes.start);
      const originalEndMinutes = timeToMinutes(origTimes.end);
      
      let newStartMinutes = originalStartMinutes;
      let newEndMinutes = originalEndMinutes;
      
      if (direction === 'top') {
        newStartMinutes = snapToSlot(originalStartMinutes + deltaMinutes);
        // Ensure minimum duration of 30 minutes
        if (newStartMinutes >= originalEndMinutes - 30) {
          newStartMinutes = originalEndMinutes - 30;
        }
        // Ensure start time is not before 00:00
        if (newStartMinutes < 0) {
          newStartMinutes = 0;
        }
      } else {
        newEndMinutes = snapToSlot(originalEndMinutes + deltaMinutes);
        // Ensure minimum duration of 30 minutes
        if (newEndMinutes <= originalStartMinutes + 30) {
          newEndMinutes = originalStartMinutes + 30;
        }
        // Ensure end time is not after 23:59
        if (newEndMinutes > 24 * 60 - 1) {
          newEndMinutes = 24 * 60 - 1;
        }
      }
      
      const newStartTime = minutesToTime(newStartMinutes);
      const newEndTime = minutesToTime(newEndMinutes);
      
      console.log('🔄 Resize update:', { newStartTime, newEndTime });
      
      // Call onResize immediately for live preview
      if (onResize) {
        onResize(task.id, newStartTime, newEndTime);
      }
    };
    
    const handleMouseUp = () => {
      console.log('✅ Resize complete');
      setIsResizing(null);
      setOriginalTimes(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [task.id, task.start_time, task.end_time, onResize]);

  return (
    <div className="relative h-full group">
      {/* Top resize handle */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity z-30",
          "hover:bg-white/20 flex items-center justify-center",
          isResizing === 'top' && "opacity-100 bg-white/30"
        )}
        onMouseDown={(e) => handleResizeStart(e, 'top')}
        title="Drag to resize start time"
      >
        <GripVertical className="h-3 w-3 text-white/60" />
      </div>

      {/* Checkbox OUTSIDE the draggable area */}
      <div 
        className="absolute top-1/2 -translate-y-1/2 right-2 z-50 p-2"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleCheckboxChange(!task.completed);
        }}
        style={{ pointerEvents: 'auto' }}
      >
        <div className="h-3 w-3 border-2 border-white bg-white cursor-pointer transition-all duration-200 hover:scale-110 rounded-none relative">
          {task.completed && (
            <div className="h-full w-full flex items-center justify-center">
              <Check className="w-2.5 h-2.5 text-black stroke-[3]" />
            </div>
          )}
        </div>
      </div>
      
      {/* Main task content */}
      <div
        ref={setNodeRef}
        style={{
          ...style,
          ...dragStyle,
          '--task-bg-color': projectColor,
          backgroundColor: projectColor,
          borderColor: projectColor,
          borderLeftWidth: '4px',
          color: 'white'
        } as React.CSSProperties & { '--task-bg-color': string }}
        className={cn(
          "border-l-4 rounded-lg p-3 transition-all duration-200 h-full min-h-full flex flex-col justify-center cursor-grab active:cursor-grabbing hover:shadow-md relative text-white",
          isDragging && "opacity-50 shadow-lg z-40 rotate-1 scale-105",
          task.completed && "opacity-70",
          isResizing && "cursor-ns-resize"
        )}
        {...(isResizing ? {} : listeners)}
        {...(isResizing ? {} : attributes)}
      >
        {/* Task content */}
        <div className={cn(
          "flex items-center justify-start gap-2 min-h-0 ml-2 mr-8 relative transition-all duration-300",
          task.completed && "opacity-50"
        )}>
          {/* White strikethrough line when completed */}
          {task.completed && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="w-full h-0.5 bg-white/80"></div>
            </div>
          )}
          
          {/* Category Icon */}
          {(() => {
            const category = project?.category || 'work';
            const CategoryIcon = getCategoryIcon(category);
            return <CategoryIcon className="w-4 h-4 flex-shrink-0 text-white" />;
          })()}
          
          {/* Task Title */}
          <span 
            className={cn(
              "text-sm font-bold text-white truncate cursor-pointer hover:bg-white/20 px-1 py-0.5 rounded transition-colors text-left"
            )}
            onClick={handleClick}
            title="Click to edit task"
          >
            {task.title}
          </span>
          
          {/* Project name */}
          {task.vibe_projects?.name && (
            <span className="text-xs text-white/80 truncate"> - {task.vibe_projects.name}</span>
          )}
        </div>
      </div>

      {/* Bottom resize handle */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity z-30",
          "hover:bg-white/20 flex items-center justify-center",
          isResizing === 'bottom' && "opacity-100 bg-white/30"
        )}
        onMouseDown={(e) => handleResizeStart(e, 'bottom')}
        title="Drag to resize end time"
      >
        <GripVertical className="h-3 w-3 text-white/60" />
      </div>
    </div>
  );
};

export default ResizableTaskBlock;