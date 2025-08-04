import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    
    const [startHour, startMin] = block.start.split(':').map(Number);
    const [endHour, endMin] = block.end.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    return endMinutes - startMinutes;
  };

  const getDisplayDurationInMinutes = () => {
    // For display purposes in the current slot, cap at 30 minutes
    return Math.min(getDurationInMinutes(), 30);
  };

  const getSlotHeight = () => {
    const durationInMinutes = getDurationInMinutes();
    const SLOT_HEIGHT = 50; // Each 30-minute slot is 50px
    const MINUTES_PER_SLOT = 30;
    
    // Calculate height based on duration: 30min = 50px, 60min = 100px, etc.
    const calculatedHeight = (durationInMinutes / MINUTES_PER_SLOT) * SLOT_HEIGHT;
    
    // Ensure minimum height for readability but respect actual duration
    return Math.max(calculatedHeight, 40);
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        height: `${getSlotHeight()}px`,
        minHeight: '40px',
        position: 'relative',
        zIndex: 10
      }}
      {...(isDraggableTask ? listeners : {})}
      {...(isDraggableTask ? attributes : {})}
      className={cn(
        "p-2 m-1 rounded text-xs transition-all hover:shadow-soft relative border",
        block.color,
        isDraggableTask && "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50 shadow-elevated z-50",
        isDraggableTask && "hover:scale-[1.02]"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="font-medium">{block.start} - {block.end}</span>
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
      <p className="font-medium mt-1">{block.title}</p>
      
      {isDraggableTask && (
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-2 h-2 bg-current rounded-full"></div>
        </div>
      )}
    </div>
  );
};

export default DraggableTimelineTask;