import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const formatTime = (timeString: string) => {
    try {
      // Handle both ISO timestamp and time-only formats
      let time: Date;
      if (timeString.includes('T')) {
        // ISO timestamp - parse as UTC and convert to local
        time = new Date(timeString);
      } else {
        // Time only format - treat as local time today
        time = new Date(`2000-01-01T${timeString}`);
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
      className={cn(
        "group relative bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30",
        "border border-blue-200 dark:border-blue-800",
        "rounded-lg p-3 cursor-pointer transition-all duration-200",
        "hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700",
        "hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/50 dark:hover:to-indigo-900/50",
        className
      )}
      onClick={onClick}
    >
      {/* Calendar Icon with Title and Action Buttons */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <h4 className="font-medium text-foreground leading-tight truncate">
            {title}
          </h4>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-blue-200 dark:hover:bg-blue-800"
              onClick={handleEdit}
            >
              <Edit className="w-3 h-3" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-red-200 dark:hover:bg-red-800 hover:text-red-600"
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