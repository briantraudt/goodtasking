import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { parseISO, format } from 'date-fns';

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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(isDraggableTask ? listeners : {})}
      {...(isDraggableTask ? attributes : {})}
      aria-label={block.type === 'event' ? `Google Calendar event: ${block.title}` : `Task: ${block.title}`}
      className={cn(
        "transition-all hover:shadow-soft h-full w-full m-0 p-0 border-0 box-border flex flex-col justify-center",
        block.type === 'event' ? "bg-blue-50 text-blue-800" : block.color,
        isDraggableTask && "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50 shadow-elevated z-50",
        isDraggableTask && "hover:scale-[1.02]"
      )}
    >
      {/* Content container with minimal padding */}
      <div className="px-3 py-2 h-full flex flex-col justify-center">
        {/* Header with time (only for tasks) and badge */}
        <div className="flex items-center justify-between mb-1">
          {/* Show time only for tasks, not events (since timeline shows position) */}
          {block.type === 'task' && (
            <span className="text-xs font-medium opacity-75">
              {block.start.includes('T') ? 
                format(parseISO(block.start), 'h:mm a') + ' - ' + format(parseISO(block.end), 'h:mm a') :
                block.start + ' - ' + block.end
              }
            </span>
          )}
          
          <div className="flex items-center gap-2 ml-auto">
            {isDraggableTask && (
              <div className="flex items-center gap-1 text-xs opacity-70">
                <Clock className="h-3 w-3" />
                {getDisplayDurationInMinutes()}m
              </div>
            )}
            <span className={cn(
              "px-2 py-1 text-xs rounded-full border",
              block.type === 'event' 
                ? "bg-gray-100 text-gray-600 border-gray-300" 
                : "bg-background/50 border-current"
            )}>
              {block.type === 'event' ? 'Google Calendar' : 'Task'}
            </span>
          </div>
        </div>
        
        {/* Event/Task Title */}
        <div className={cn(
          "font-medium leading-tight",
          block.type === 'event' ? "text-base text-blue-800" : "text-sm"
        )}>
          {block.title}
        </div>
        
        {isDraggableTask && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-2 h-2 bg-current rounded-full"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DraggableTimelineTask;