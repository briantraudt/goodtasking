import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { parseISO, format } from 'date-fns';
import googleCalendarLogo from '@/assets/google-calendar-logo.png';

interface Task {
  id: string;
  title: string;
  priority?: 'high' | 'medium' | 'low';
  estimated_duration?: number;
  start_time?: string;
  end_time?: string;
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
}

const DraggableTimelineTask = ({ block, task }: DraggableTimelineTaskProps) => {
  const isDraggableTask = block.type === 'task' && task;
  
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `timeline-${block.id}`,
    data: {
      type: 'timeline-task',
      task: task,
      block: block
    },
    disabled: !isDraggableTask,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

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
    if (block.type === 'event' && block.googleEventId) {
      // Open Google Calendar main page
      const calendarUrl = 'https://calendar.google.com/calendar/u/0/r';
      window.open(calendarUrl, '_blank');
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(isDraggableTask ? listeners : {})}
      {...(isDraggableTask ? attributes : {})}
      onClick={block.type === 'event' ? handleCalendarEventClick : undefined}
      aria-label={block.type === 'event' ? `Google Calendar event: ${block.title}` : `Task: ${block.title}`}
      className={cn(
        "transition-all hover:shadow-soft w-full m-0 p-0 border-0 box-border flex flex-col justify-center",
        "h-full min-h-full overflow-hidden border-l-4",
        // Enhanced color scheme for different block types
        block.type === 'event' 
          ? "bg-google-calendar-bg border-google-calendar-border text-blue-800 cursor-pointer hover:bg-blue-50" 
          : "bg-ai-scheduled-bg border-ai-scheduled-border text-green-800",
        isDraggableTask && "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50 shadow-elevated z-50",
        isDraggableTask && "hover:scale-[1.02]"
      )}
    >
      {/* Content container fills full height */}
      <div className="h-full flex flex-col justify-center pl-3 pr-2">
        {/* Event/Task Title - Left aligned with padding */}
        <div className={cn(
          "text-task-title leading-tight text-left",
          block.type === 'event' ? "text-blue-800" : "text-green-800"
        )}>
          {block.title}
        </div>
        
        {/* Header with badge - positioned absolutely to not affect centering */}
        <div className="absolute top-2 right-2 flex items-center gap-2">
          {isDraggableTask && (
            <div className="flex items-center gap-1 text-xs opacity-70">
              <Clock className="h-3 w-3" />
              {getDisplayDurationInMinutes()}m
            </div>
          )}
          {block.type === 'event' ? (
            <img src={googleCalendarLogo} alt="Google Calendar" className="w-6 h-6" />
          ) : (
            <span className="px-2 py-1 text-xs rounded-full border bg-background/50 border-current">
              Task
            </span>
          )}
        </div>
        
        {/* Show time only for tasks at bottom */}
        {block.type === 'task' && (
          <div className="absolute bottom-2 left-3 text-xs font-medium opacity-75">
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
    </div>
  );
};

export default DraggableTimelineTask;