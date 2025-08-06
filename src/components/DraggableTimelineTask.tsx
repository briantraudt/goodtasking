import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, Home, User, Briefcase, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { parseISO, format } from 'date-fns';
import { useCategories } from '@/hooks/useCategories';
import { Checkbox } from '@/components/ui/checkbox';

interface Task {
  id: string;
  title: string;
  priority?: 'high' | 'medium' | 'low';
  estimated_duration?: number;
  start_time?: string;
  end_time?: string;
  project_id?: string;
  completed?: boolean;
  vibe_projects?: {
    name: string;
    category?: string;
  };
  project?: {
    id: string;
    name: string;
    category: string;
  };
}

interface TimeBlock {
  id: string;
  title: string;
  start: string;
  end: string;
  type: 'event' | 'task';
  color: string;
  priority?: string;
  taskId?: string;
  googleEventId?: string; // Add Google event ID
}

interface DraggableTimelineTaskProps {
  block: TimeBlock;
  task?: Task;
  onTaskComplete?: (taskId: string, completed: boolean) => void;
}

const DraggableTimelineTask = ({ block, task, onTaskComplete }: DraggableTimelineTaskProps) => {
  const { categories } = useCategories();
  // More robust type determination: 
  // If we have a googleEventId and NO task object, it's definitely an event
  // If we have a task object OR taskId, it's definitely a task
  const hasGoogleEventId = !!block.googleEventId;
  const hasTaskData = !!task || !!block.taskId;
  
  const actualBlockType = hasGoogleEventId && !hasTaskData ? 'event' : 'task';
  
  const isDraggableTask = actualBlockType === 'task' && task;
  
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `timeline-${block.id}`,
    data: {
      type: 'timeline-task',
      task: task,
      block: { ...block, type: actualBlockType }
    },
    disabled: !isDraggableTask,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    backgroundColor: actualBlockType === 'task' ? (block.color || '#6b7280') : undefined,
    borderLeftColor: actualBlockType === 'task' ? (block.color || '#6b7280') : undefined,
    borderLeftWidth: '4px',
    color: actualBlockType === 'task' ? 'white !important' : undefined,
    opacity: task?.completed ? 0.75 : 1,
    '--bg-color': actualBlockType === 'task' ? (block.color || '#6b7280') : undefined
  } as React.CSSProperties & { '--bg-color'?: string } : {
    backgroundColor: actualBlockType === 'task' ? (block.color || '#6b7280') : undefined,
    borderLeftColor: actualBlockType === 'task' ? (block.color || '#6b7280') : undefined,
    borderLeftWidth: '4px',
    color: actualBlockType === 'task' ? 'white !important' : undefined,
    opacity: task?.completed ? 0.75 : 1,
    '--bg-color': actualBlockType === 'task' ? (block.color || '#6b7280') : undefined
  } as React.CSSProperties & { '--bg-color'?: string };

  const getDurationInMinutes = () => {
    if (!block.start || !block.end) return 30;
    
    try {
      // Handle both HH:mm format and ISO datetime strings
      let startTime: Date;
      let endTime: Date;
      
      if (block.start.includes('T')) {
        // ISO datetime from Google Calendar
        startTime = parseISO(block.start);
        endTime = parseISO(block.end);
      } else {
        // HH:mm format from tasks
        const [startHour, startMin] = block.start.split(':').map(Number);
        const [endHour, endMin] = block.end.split(':').map(Number);
        
        const today = new Date();
        startTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), startHour, startMin);
        endTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), endHour, endMin);
      }
      
      return Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
    } catch (error) {
      console.error('Error calculating duration:', error, block);
      return 30; // Fallback to 30 minutes
    }
  };

  const getDisplayDurationInMinutes = () => {
    return getDurationInMinutes();
  };

  const handleCalendarEventClick = () => {
    if (actualBlockType === 'event' && block.googleEventId) {
      // Open Google Calendar main page
      const calendarUrl = 'https://calendar.google.com/calendar/u/0/r';
      window.open(calendarUrl, '_blank');
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger completion for events or if clicking on checkbox
    if (actualBlockType === 'event') {
      handleCalendarEventClick();
      return;
    }
    
    const target = e.target as HTMLElement;
    if (target.closest('[data-checkbox]')) {
      return;
    }
    
    // Toggle completion for tasks
    if (onTaskComplete && task && !isDragging) {
      e.stopPropagation();
      onTaskComplete(task.id, !task.completed);
    }
  };

  const handleCheckboxChange = (checked: boolean) => {
    if (onTaskComplete && task) {
      onTaskComplete(task.id, checked);
    }
  };

  // Get category from task data
  const getTaskCategory = () => {
    // Try to get category from project object first
    if (task?.project?.category) {
      return task.project.category;
    }
    
    // Try to get category from vibe_projects
    if (task?.vibe_projects?.category) {
      return task.vibe_projects.category;
    }
    
    // Fallback: try to infer category from project name
    if (task?.vibe_projects?.name) {
      const projectName = task.vibe_projects.name.toLowerCase();
      if (projectName.includes('personal') || projectName.includes('food')) return 'personal';
      if (projectName.includes('work') || projectName.includes('business')) return 'work';
      if (projectName.includes('home') || projectName.includes('house')) return 'home';
    }
    
    // Default fallback
    return 'work';
  };
  // Get category icon function
  const getCategoryIcon = (category: string) => {
    const categoryLower = category.toLowerCase();
    const categoryData = categories.find(cat => cat.name.toLowerCase() === categoryLower);
    
    // Fallback to direct icon mapping if category not found
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(isDraggableTask ? listeners : {})}
      {...(isDraggableTask ? attributes : {})}
      onClick={handleCardClick}
      aria-label={actualBlockType === 'event' ? `Google Calendar event: ${block.title}` : `Task: ${block.title}`}
      className={cn(
        "transition-all duration-200 w-full m-0 border-0 box-border flex flex-col justify-center group relative min-h-[44px]",
        "h-full min-h-full overflow-hidden cursor-pointer",
        // Modern styling for events and tasks
        actualBlockType === 'event' 
          ? "bg-blue-50 border-l-4 border-blue-400 rounded-lg hover:bg-blue-100 hover:shadow-md px-3 py-1.5" 
          : "border-l-4 rounded-lg px-3 py-1.5 !bg-[var(--bg-color)] text-white",
        isDraggableTask && "hover:shadow-md",
        isDragging && "opacity-50 shadow-lg z-40 rotate-1 scale-105",
        isDraggableTask && "hover:scale-[1.01]"
      )}
    >
      {/* Content container with modern spacing */}
      <div className="h-full flex flex-col justify-center">
        {/* Checkbox for task completion - only for tasks */}
        {actualBlockType === 'task' && task && (
          <div className="absolute top-2 left-2 z-20" data-checkbox onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={task.completed || false}
              onCheckedChange={handleCheckboxChange}
              className="h-3 w-3 border-0 bg-white rounded-none"
            />
          </div>
        )}

        {/* Event/Task Title - Enhanced Typography with Category Icon */}
        <div className={cn(
          "text-sm leading-tight text-left font-bold flex items-center gap-2",
          actualBlockType === 'event' ? "text-gray-900" : "text-white",
          task?.completed && "line-through opacity-60"
        )}>
          {/* Category Icon for tasks - Always show for tasks */}
          {actualBlockType === 'task' && (() => {
            const taskCategory = task ? getTaskCategory() : 'work';
            const CategoryIcon = getCategoryIcon(taskCategory);
            return <CategoryIcon className="w-4 h-4 flex-shrink-0 text-white" />;
          })()}
          <span className="truncate">{block.title}</span>
        </div>
      </div>
      
      {/* Header with badge - positioned in top-right for events */}
      <div className={cn(
        "absolute flex items-center gap-2",
        actualBlockType === 'event' ? "top-2 right-2" : "top-2 right-2"
      )}>
        {isDraggableTask && (
          <div className="flex items-center gap-1 text-xs opacity-70">
            <Clock className="h-3 w-3" />
            {getDisplayDurationInMinutes()}m
          </div>
        )}
        {actualBlockType === 'event' ? (
          <Calendar className="w-3.5 h-3.5 text-blue-400" />
        ) : (
          <span className="px-2 py-1 text-xs rounded-full border bg-background/50 border-current">
            Task
          </span>
        )}
      </div>
      
      {/* Show time only for tasks at bottom */}
      {actualBlockType === 'task' && (
        <div className="absolute bottom-2 left-3 text-xs font-medium text-white opacity-75">
          {block.start.includes('T') ? 
            format(parseISO(block.start), 'h:mm a') + ' - ' + format(parseISO(block.end), 'h:mm a') :
            block.start + ' - ' + block.end
          }
        </div>
      )}
      
      {isDraggableTask && (
        <div className="absolute top-1 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-2 h-2 bg-current rounded-full"></div>
        </div>
      )}
    </div>
  );
};

export default DraggableTimelineTask;