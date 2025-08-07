import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Calendar, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDraggable } from '@dnd-kit/core';

interface LocalEventBlockProps {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  onClick?: () => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  className?: string;
  showTime?: boolean;
}

export const LocalEventBlock: React.FC<LocalEventBlockProps> = ({
  id,
  title,
  description,
  startTime,
  endTime,
  onClick,
  onEdit,
  onDelete,
  className,
  showTime = false
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `event-${id}`,
    data: {
      type: 'calendar_event',
      eventId: id,
      title,
      startTime,
      endTime
    }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;
  const formatTime = (timeString: string) => {
    try {
      // Handle both ISO timestamp and time-only formats
      let time: Date;
      if (timeString.includes('T')) {
        // ISO timestamp - convert UTC to local time
        time = new Date(timeString);
      } else {
        // Time only format - treat as local time today
        const today = new Date();
        const [hours, minutes] = timeString.split(':');
        time = new Date(today.getFullYear(), today.getMonth(), today.getDate(), parseInt(hours), parseInt(minutes));
      }
      
      return time.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return timeString;
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(id);
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30",
        "border border-blue-200 dark:border-blue-800",
        "rounded-lg p-3 cursor-pointer transition-all duration-200",
        "hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700",
        "hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/50 dark:hover:to-indigo-900/50",
        isDragging ? "opacity-50 shadow-lg z-50" : "",
        className
      )}
      onClick={onClick}
    >
      {/* Drag Handle and Calendar Icon with Title */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {/* Drag Handle */}
        <div 
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-blue-400 hover:text-blue-600 flex-shrink-0"
        >
          <GripVertical className="w-3 h-3" />
        </div>
        
        <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
        <h4 
          className="font-medium text-foreground leading-tight truncate cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          onClick={onEdit ? () => onEdit(id) : undefined}
        >
          {title}
        </h4>
        
        {/* Action Buttons */}
        <div className="flex gap-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-200"
              onClick={handleEdit}
            >
              <Edit className="w-3 h-3" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-100"
              onClick={handleDelete}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Event Description */}
      {description && !description.startsWith('Parsed from') && !description.includes('Created on calendar') && (
        <p className="text-sm text-muted-foreground mb-2 line-clamp-2 leading-tight">
          {description}
        </p>
      )}

      {/* Time Range */}
      {showTime && (
        <div className="flex items-center text-xs text-blue-600 dark:text-blue-400 font-medium">
          <span>{formatTime(startTime)} - {formatTime(endTime)}</span>
        </div>
      )}
    </div>
  );
};

export default LocalEventBlock;