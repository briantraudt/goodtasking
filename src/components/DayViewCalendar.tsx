import React, { useState, useEffect, useRef, useCallback } from 'react';
import { format, addDays, subDays, isToday, parseISO, startOfDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
        "h-12 border-b border-border/20 relative transition-colors",
        isOver && "bg-primary/10 border-primary/30",
        isCurrentTime && "bg-yellow-50 border-yellow-200",
        minute === 0 ? "border-border/40" : "border-border/20"
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
      case 'high': return 'bg-red-100 border-red-300 text-red-800';
      case 'medium': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'low': return 'bg-green-100 border-green-300 text-green-800';
      default: return 'bg-blue-100 border-blue-300 text-blue-800';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "absolute left-1 right-1 rounded-md border-2 p-2 cursor-grab z-10",
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
        <div className="text-xs opacity-70">
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
      className="absolute left-1 right-1 bg-primary/20 border-primary/40 border rounded-md p-2 cursor-pointer z-10"
      onClick={() => onClick?.(event)}
      title={event.description || event.title}
    >
      <div className="text-xs font-medium text-primary truncate">
        {event.title}
      </div>
      <div className="text-xs text-primary/70">
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
      const scrollPosition = Math.max(0, (currentHour - 2) * 96); // 96px per hour (8 * 12px slots)
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
    
    const startPosition = (startHour * 96) + (startMinute / 60 * 96);
    const duration = ((endHour - startHour) * 96) + ((endMinute - startMinute) / 60 * 96);
    
    return {
      top: startPosition,
      height: Math.max(duration, 24) // Minimum height
    };
  };

  const calculateEventPosition = (event: CalendarEvent) => {
    const startTime = parseISO(event.start);
    const endTime = parseISO(event.end);
    
    const startHour = startTime.getHours();
    const startMinute = startTime.getMinutes();
    const endHour = endTime.getHours();
    const endMinute = endTime.getMinutes();
    
    const startPosition = (startHour * 96) + (startMinute / 60 * 96);
    const duration = ((endHour - startHour) * 96) + ((endMinute - startMinute) / 60 * 96);
    
    return {
      top: startPosition,
      height: Math.max(duration, 24)
    };
  };

  // Generate time slots for 24 hours
  const timeSlots = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      timeSlots.push({ hour, minute });
    }
  }

  const formatTimeLabel = (hour: number) => {
    if (hour === 0) return '12:00 AM';
    if (hour === 12) return '12:00 PM';
    if (hour < 12) return `${hour}:00 AM`;
    return `${hour - 12}:00 PM`;
  };

  return (
    <Card className="h-full flex flex-col bg-white shadow-lg">
      {/* Header */}
      <div className="bg-[#1B365D] text-white p-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateDate('prev')}
              className="text-white hover:bg-white/10 p-2"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <h2 className="text-xl font-semibold min-w-[250px] text-center">
              {formatDateHeader()}
            </h2>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateDate('next')}
              className="text-white hover:bg-white/10 p-2"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-3">
            {!isToday(new Date(selectedDate)) && (
              <Button
                variant="outline"
                size="sm"
                onClick={goToToday}
                className="bg-white text-[#1B365D] border-white hover:bg-white/90"
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                Today
              </Button>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              24-Hour View
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto relative"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div className="relative">
          {/* Time labels and slots */}
          {Array.from({ length: 24 }, (_, hour) => (
            <div key={hour} className="relative">
              {/* Hour label */}
              <div className="sticky left-0 z-20 bg-[#1B365D] text-white px-3 py-1 text-sm font-medium border-b border-white/20">
                {formatTimeLabel(hour)}
              </div>
              
              {/* 15-minute slots for this hour */}
              {Array.from({ length: 4 }, (_, quarterIndex) => {
                const minute = quarterIndex * 15;
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
                  top: position.top + 32, // Offset for hour labels
                  height: position.height,
                  left: 80, // Space for time labels
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
                  top: position.top + 32, // Offset for hour labels
                  height: position.height,
                  left: 80, // Space for time labels
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
              className="absolute left-0 right-0 h-0.5 bg-red-500 z-30"
              style={{
                top: (currentTime.getHours() * 96) + (currentTime.getMinutes() / 60 * 96) + 32
              }}
            >
              <div className="absolute -left-2 -top-2 w-4 h-4 bg-red-500 rounded-full"></div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default DayViewCalendar;