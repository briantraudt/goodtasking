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
      className={cn(
        "p-2 rounded text-xs transition-all hover:shadow-soft border h-full w-full ml-0 pl-0 box-border",
        block.type === 'event' ? "bg-blue-50 border-blue-200 text-blue-800" : block.color,
        isDraggableTask && "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50 shadow-elevated z-50",
        isDraggableTask && "hover:scale-[1.02]"
      )}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium">
          {block.start.includes('T') ? 
            format(parseISO(block.start), 'h:mm a') + ' - ' + format(parseISO(block.end), 'h:mm a') :
            block.start + ' - ' + block.end
          }
        </span>
        <div className="flex items-center gap-1">
          {isDraggableTask && (
            <div className="flex items-center gap-1 text-xs opacity-70">
              <Clock className="h-3 w-3" />
              {getDisplayDurationInMinutes()}m
            </div>
          )}
          <Badge variant="outline" className="text-xs bg-background/50">
            {block.type}
          </Badge>
        </div>
      </div>
      <p className="font-medium text-xs line-clamp-2">{block.title}</p>
      
      {isDraggableTask && (
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-2 h-2 bg-current rounded-full"></div>
        </div>
      )}
    </div>
  );
};

export default DraggableTimelineTask;