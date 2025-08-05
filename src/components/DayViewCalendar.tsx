import React, { useState, useEffect, useRef, useCallback } from 'react';
import { format, addDays, subDays, isToday, parseISO, startOfDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

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
}

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  type: 'task' | 'google_event';
  color?: string;
  description?: string;
  isAllDay?: boolean;
}

interface DayViewCalendarProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  tasks: Task[];
  calendarEvents?: CalendarEvent[];
  onTaskScheduled: (taskId: string, startTime: string, endTime: string) => void;
  onTaskUnscheduled: (taskId: string) => void;
  onEventClick?: (event: CalendarEvent) => void;
}

interface TimeSlotProps {
  hour: number;
  minute: number;
  children?: React.ReactNode;
  isCurrentTime?: boolean;
}

const TimeSlot = ({ hour, minute, children, isCurrentTime }: TimeSlotProps) => {
  const slotId = `${hour}:${minute.toString().padStart(2, '0')}`;
  const { isOver, setNodeRef } = useDroppable({
    id: slotId,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "h-10 border-b border-gray-100 relative transition-colors hover:bg-blue-50/30",
        isOver && "bg-blue-100 border-blue-200",
        isCurrentTime && "bg-yellow-50/50",
        minute === 0 ? "border-gray-200" : "border-gray-50"
      )}
    >
      {children}
    </div>
  );
};

interface ScheduledTaskBlockProps {
  task: Task;
  onRemove: (taskId: string) => void;
}

const ScheduledTaskBlock = ({ task, onRemove }: ScheduledTaskBlockProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `scheduled-${task.id}`,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const getPriorityColor = () => {
    switch (task.priority) {
      case 'high': return 'bg-red-50 border-red-200 text-red-800';
      case 'medium': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'low': return 'bg-green-50 border-green-200 text-green-800';
      default: return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "absolute left-2 right-2 rounded-lg border p-2 cursor-grab z-10 shadow-sm",
        getPriorityColor(),
        isDragging && "opacity-50"
      )}
      onDoubleClick={() => onRemove(task.id)}
      title="Double-click to remove from schedule"
    >
      <div className="text-xs font-medium truncate">
        {task.title}
      </div>
      {task.start_time && task.end_time && (
        <div className="text-xs opacity-70 mt-1">
          {format(parseISO(`2000-01-01T${task.start_time}`), 'h:mm a')} - 
          {format(parseISO(`2000-01-01T${task.end_time}`), 'h:mm a')}
        </div>
      )}
    </div>
  );
};

interface EventBlockProps {
  event: CalendarEvent;
  onClick?: (event: CalendarEvent) => void;
}

const EventBlock = ({ event, onClick }: EventBlockProps) => {
  return (
    <div
      className="absolute left-2 right-2 bg-blue-50 border border-blue-200 rounded-lg p-2 cursor-pointer z-10 shadow-sm"
      onClick={() => onClick?.(event)}
      title={event.description || event.title}
    >
      <div className="text-xs font-medium text-[#1B365D] truncate">
        {event.title}
      </div>
      <div className="text-xs text-[#1B365D]/70 mt-1">
        {format(parseISO(event.start), 'h:mm a')} - {format(parseISO(event.end), 'h:mm a')}
      </div>
    </div>
  );
};

const DayViewCalendar = ({
  selectedDate,
  onDateChange,
  tasks,
  calendarEvents = [],
  onTaskScheduled,
  onTaskUnscheduled,
  onEventClick
}: DayViewCalendarProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to current time on mount if viewing today
  useEffect(() => {
    if (isToday(new Date(selectedDate)) && scrollContainerRef.current) {
      const currentHour = new Date().getHours();
      const scrollPosition = Math.max(0, (currentHour - 2) * 80);
      scrollContainerRef.current.scrollTop = scrollPosition;
    }
  }, [selectedDate]);

  const navigateDate = (direction: 'prev' | 'next') => {
    const currentDateObj = new Date(selectedDate);
    const newDate = direction === 'prev' ? subDays(currentDateObj, 1) : addDays(currentDateObj, 1);
    onDateChange(newDate.toISOString().split('T')[0]);
  };

  const goToToday = () => {
    const today = new Date().toISOString().split('T')[0];
    onDateChange(today);
  };

  const formatDateHeader = () => {
    const date = new Date(selectedDate);
    if (isToday(date)) {
      return `Today, ${format(date, 'MMMM d')}`;
    }
    return format(date, 'EEEE, MMMM d');
  };

  const isCurrentTimeSlot = (hour: number, minute: number) => {
    if (!isToday(new Date(selectedDate))) return false;
    const currentHour = currentTime.getHours();
    const currentMinutes = currentTime.getMinutes();
    return hour === currentHour && Math.abs(currentMinutes - minute) < 15;
  };

  // Get scheduled tasks for this date
  const scheduledTasks = tasks.filter(task => 
    task.scheduled_date === selectedDate && task.start_time && task.end_time
  );

  // Get events for this date
  const dayEvents = calendarEvents.filter(event => {
    const eventDate = format(parseISO(event.start), 'yyyy-MM-dd');
    return eventDate === selectedDate;
  });

  const calculateTaskPosition = (task: Task) => {
    if (!task.start_time || !task.end_time) return null;
    
    const startTime = parseISO(`2000-01-01T${task.start_time}`);
    const endTime = parseISO(`2000-01-01T${task.end_time}`);
    
    const startHour = startTime.getHours();
    const startMinute = startTime.getMinutes();
    const endHour = endTime.getHours();
    const endMinute = endTime.getMinutes();
    
    // Each hour is 80px (2 slots of 40px each)
    const startPosition = (startHour * 80) + (startMinute / 60 * 80);
    const duration = ((endHour - startHour) * 80) + ((endMinute - startMinute) / 60 * 80);
    
    return {
      top: startPosition,
      height: Math.max(duration, 20) // Minimum height
    };
  };

  const calculateEventPosition = (event: CalendarEvent) => {
    const startTime = parseISO(event.start);
    const endTime = parseISO(event.end);
    
    const startHour = startTime.getHours();
    const startMinute = startTime.getMinutes();
    const endHour = endTime.getHours();
    const endMinute = endTime.getMinutes();
    
    // Each hour is 80px (2 slots of 40px each)
    const startPosition = (startHour * 80) + (startMinute / 60 * 80);
    const duration = ((endHour - startHour) * 80) + ((endMinute - startMinute) / 60 * 80);
    
    return {
      top: startPosition,
      height: Math.max(duration, 20)
    };
  };

  const formatTimeLabel = (hour: number) => {
    if (hour === 0) return '12:00 AM';
    if (hour === 12) return '12:00 PM';
    if (hour < 12) return `${hour}:00 AM`;
    return `${hour - 12}:00 PM`;
  };

  return (
    <Card className="h-full flex flex-col bg-white shadow-sm border border-gray-200 rounded-xl">
      {/* Header */}
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateDate('prev')}
            className="text-[#1B365D] hover:bg-blue-50 p-2 rounded-lg"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <h2 className="text-xl font-semibold text-[#1B365D] min-w-[250px] text-center">
            {formatDateHeader()}
          </h2>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateDate('next')}
              className="text-[#1B365D] hover:bg-blue-50 p-2 rounded-lg"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
            
            {!isToday(new Date(selectedDate)) && (
              <Button
                variant="outline"
                size="sm"
                onClick={goToToday}
                className="ml-2 border-[#1B365D] text-[#1B365D] hover:bg-blue-50"
              >
                Today
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Calendar Grid */}
      <CardContent className="flex-1 overflow-hidden p-0">
        <div 
          ref={scrollContainerRef}
          className="h-full overflow-y-auto"
          style={{ scrollBehavior: 'smooth' }}
        >
          <div className="relative">
            {/* Time labels and slots */}
            {Array.from({ length: 24 }, (_, hour) => (
              <div key={hour} className="relative flex">
                {/* Time label */}
                <div className="w-20 flex-shrink-0 py-2 px-3 text-sm font-medium text-[#1B365D] border-r border-gray-100 bg-gray-50/30">
                  {formatTimeLabel(hour)}
                </div>
                
                {/* Time slots container */}
                <div className="flex-1">
                  {/* 30-minute slots for this hour */}
                  {Array.from({ length: 2 }, (_, halfIndex) => {
                    const minute = halfIndex * 30;
                    return (
                      <TimeSlot
                        key={`${hour}-${minute}`}
                        hour={hour}
                        minute={minute}
                        isCurrentTime={isCurrentTimeSlot(hour, minute)}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
            
            {/* Scheduled tasks */}
            {scheduledTasks.map(task => {
              const position = calculateTaskPosition(task);
              if (!position) return null;
              
              return (
                <div
                  key={task.id}
                  style={{
                    position: 'absolute',
                    top: position.top,
                    height: position.height,
                    left: 84, // Space for time labels + padding
                    right: 16,
                    zIndex: 10
                  }}
                >
                  <ScheduledTaskBlock
                    task={task}
                    onRemove={onTaskUnscheduled}
                  />
                </div>
              );
            })}
            
            {/* Calendar events */}
            {dayEvents.map(event => {
              const position = calculateEventPosition(event);
              
              return (
                <div
                  key={event.id}
                  style={{
                    position: 'absolute',
                    top: position.top,
                    height: position.height,
                    left: 84, // Space for time labels + padding
                    right: 16,
                    zIndex: 10
                  }}
                >
                  <EventBlock
                    event={event}
                    onClick={onEventClick}
                  />
                </div>
              );
            })}
            
            {/* Current time indicator */}
            {isToday(new Date(selectedDate)) && (
              <div
                className="absolute right-0 h-0.5 bg-red-500 z-30"
                style={{
                  top: (currentTime.getHours() * 80) + (currentTime.getMinutes() / 60 * 80),
                  left: 84,
                }}
              >
                <div className="absolute -left-2 -top-2 w-4 h-4 bg-red-500 rounded-full"></div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DayViewCalendar;