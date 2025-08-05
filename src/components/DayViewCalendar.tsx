import React, { useState, useEffect, useRef, useCallback } from 'react';
import { format, addDays, subDays, isToday, parseISO, startOfDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, Clock, Star } from 'lucide-react';
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
  vibe_projects?: { name: string };
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
  onTaskScheduled?: (taskId: string, startTime: string, endTime: string) => void;
  onTaskUnscheduled?: (taskId: string) => void;
  onTaskEdit?: (task: Task) => void;
  onEventClick?: (event: CalendarEvent) => void;
  isGoogleConnected?: boolean;
  onConnectGoogle?: () => void;
  onViewModeChange?: (mode: 'week') => void;
  onQuickTaskCreate?: (hour: number, minute: number) => void;
}

interface TimeSlotProps {
  hour: number;
  minute: number;
  children?: React.ReactNode;
  isCurrentTime?: boolean;
  hasTask?: boolean;
  onClick?: () => void;
}

const TimeSlot = ({ hour, minute, children, isCurrentTime, hasTask, onClick }: TimeSlotProps) => {
  const slotId = `${hour}:${minute.toString().padStart(2, '0')}`;
  const { isOver, setNodeRef } = useDroppable({
    id: slotId,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "h-12 border-b border-border/30 relative transition-colors",
        hasTask 
          ? "cursor-default" 
          : "hover:bg-primary/10 cursor-pointer",
        isOver && "bg-primary/20 border-primary/40",
        isCurrentTime && "border-2 border-[#4DA8DA] bg-transparent",
        minute === 0 ? "border-border" : "border-border/20"
      )}
      onClick={() => !hasTask && onClick?.()}
      title={hasTask ? undefined : "Click to create a task"}
    >
      {children}
    </div>
  );
};

interface ScheduledTaskBlockProps {
  task: Task;
  onRemove: (taskId: string) => void;
  onEdit?: (task: Task) => void;
}

const ScheduledTaskBlock = ({ task, onRemove, onEdit }: ScheduledTaskBlockProps) => {
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

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('✏️ Task clicked for editing:', task.title);
    onEdit?.(task);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "absolute inset-0 rounded-lg border border-[#4DA8DA] bg-[#4DA8DA] z-10 shadow-sm text-white",
        isDragging && "opacity-50"
      )}
      title="Click to edit"
    >
      {/* Draggable area - excludes the content area */}
      <div 
        {...listeners}
        {...attributes}
        className="absolute inset-0 cursor-grab"
      />
      
      {/* Clickable content area for editing */}
      <div 
        className="relative p-2 h-full flex flex-col justify-center cursor-pointer z-10"
        onClick={handleClick}
      >
        <div className="text-sm truncate">
          <span className="font-bold">{task.title}</span>
          {task.vibe_projects?.name && (
            <span className="font-normal"> - {task.vibe_projects.name}</span>
          )}
        </div>
      </div>
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
      className="absolute left-2 right-2 bg-green-50 border border-green-200 rounded-lg p-2 cursor-pointer z-10 shadow-sm"
      onClick={() => onClick?.(event)}
      title={event.description || event.title}
    >
      <div className="text-xs font-medium text-secondary truncate">
        {event.title}
      </div>
      <div className="text-xs text-secondary/70 mt-1">
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
  onTaskEdit,
  onEventClick,
  isGoogleConnected = false,
  onConnectGoogle,
  onViewModeChange,
  onQuickTaskCreate
}: DayViewCalendarProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hasAutoScrolled = useRef(false);
  const { toast } = useToast();

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to current time and FORCE today's date on initial load
  useEffect(() => {
    if (!hasAutoScrolled.current) {
      const now = new Date();
      
      // Use local timezone to get today's date (not UTC)
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const today = `${year}-${month}-${day}`;
      
      console.log('FORCING calendar to today:', today, 'Current selectedDate:', selectedDate);
      
      // ALWAYS set to today's date on initial load, regardless of current selectedDate
      onDateChange(today);
      
      // Auto-scroll to current hour with smooth animation
      setTimeout(() => {
        const currentHour = now.getHours();
        const hourBlock = document.querySelector(`[data-hour='${currentHour}']`);
        if (hourBlock && scrollContainerRef.current) {
          hourBlock.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }
      }, 100); // Small delay to ensure DOM is ready
      
      hasAutoScrolled.current = true;
    }
  }, [onDateChange]); // Only depend on onDateChange function

  const navigateDate = (direction: 'prev' | 'next') => {
    // Parse selectedDate using local timezone to avoid UTC issues
    const [year, month, day] = selectedDate.split('-').map(Number);
    const currentDateObj = new Date(year, month - 1, day); // month is 0-indexed
    const newDate = direction === 'prev' ? subDays(currentDateObj, 1) : addDays(currentDateObj, 1);
    
    // Use local timezone for consistency
    const newYear = newDate.getFullYear();
    const newMonth = String(newDate.getMonth() + 1).padStart(2, '0');
    const newDay = String(newDate.getDate()).padStart(2, '0');
    const newDateString = `${newYear}-${newMonth}-${newDay}`;
    
    console.log('📅 Navigating from', selectedDate, 'to', newDateString);
    onDateChange(newDateString);
  };

  const goToToday = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;
    onDateChange(today);
  };

  const formatDateHeader = () => {
    // Force local timezone parsing to avoid UTC issues
    const [year, month, day] = selectedDate.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed
    
    console.log('📅 Formatting date header - selectedDate:', selectedDate, 'parsed as:', date);
    
    if (isToday(date)) {
      return `Today, ${format(date, 'MMMM d')}`;
    }
    return format(date, 'EEEE, MMMM d');
  };

  const isCurrentTimeSlot = (hour: number, minute: number) => {
    // Parse selectedDate using local timezone
    const [year, month, day] = selectedDate.split('-').map(Number);
    const selectedDateObj = new Date(year, month - 1, day);
    
    if (!isToday(selectedDateObj)) return false;
    const currentHour = currentTime.getHours();
    const currentMinutes = currentTime.getMinutes();
    
    // Only highlight the specific 30-minute slot that contains the current time
    if (hour !== currentHour) return false;
    
    // For the correct hour, highlight the appropriate 30-minute slot
    if (minute === 0 && currentMinutes < 30) return true;
    if (minute === 30 && currentMinutes >= 30) return true;
    
    return false;
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

  // Check if a time slot has a task or event
  const hasTaskAtTime = (hour: number, minute: number) => {
    const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    
    // Check for scheduled tasks
    const hasTask = scheduledTasks.some(task => {
      if (!task.start_time || !task.end_time) return false;
      const startTime = task.start_time.split(':').slice(0, 2).join(':');
      const endTime = task.end_time.split(':').slice(0, 2).join(':');
      return timeStr >= startTime && timeStr < endTime;
    });
    
    // Check for calendar events
    const hasEvent = dayEvents.some(event => {
      const eventStart = parseISO(event.start);
      const eventEnd = parseISO(event.end);
      const slotTime = parseISO(`${selectedDate}T${timeStr}:00`);
      return slotTime >= eventStart && slotTime < eventEnd;
    });
    
    return hasTask || hasEvent;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Calendar Header with Icon, Centered Date and Week Button */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b">
        {/* Calendar Icon and Text on Left */}
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold text-foreground">Calendar</h1>
        </div>
        
        {/* Centered Date Navigation */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateDate('prev')}
            className="text-primary hover:opacity-80 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          
          <h2 className="text-base font-semibold text-primary">
            {formatDateHeader()}
          </h2>
          
          <button
            onClick={() => navigateDate('next')}
            className="text-primary hover:opacity-80 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        
        {/* Week Button on Right */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewModeChange?.('week')}
          className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
        >
          <Star className="h-4 w-4 mr-2" />
          Week
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-hidden">
        <div 
          ref={scrollContainerRef}
          className="h-full overflow-y-auto border rounded-lg"
          style={{ scrollBehavior: 'smooth' }}
        >
          <div className="relative">
            {/* Time labels and slots */}
            {Array.from({ length: 24 }, (_, hour) => {
              // Parse selectedDate using local timezone for consistent comparison
              const [year, month, day] = selectedDate.split('-').map(Number);
              const selectedDateObj = new Date(year, month - 1, day);
              const isCurrentHour = isToday(selectedDateObj) && 
                                  hour === currentTime.getHours();
              
              return (
                <div 
                  key={hour} 
                  data-hour={hour}
                  className={cn(
                    "relative flex",
                    isCurrentHour && "border-l-4 border-l-[#4DA8DA] bg-transparent" // Light blue left border instead of background
                  )}
                >
                   {/* Time column - matches exact structure of calendar grid */}
                   <div className={cn(
                     "w-28 flex-shrink-0 border-r border-border",
                     isToday(selectedDateObj) ? "bg-primary/5" : "bg-muted/30"
                   )}>
                      {/* First 30-min slot with time label at top */}
                       <div className={cn(
                         "h-12 border-b border-border/30 flex items-center justify-end pr-2 text-sm font-semibold text-gray-700",
                         isCurrentHour && "border-2 border-[#4DA8DA] bg-transparent text-[#4DA8DA] font-bold"
                       )}>
                         {formatTimeLabel(hour)}
                       </div>
                     {/* Second 30-min slot - empty for half-hour tasks */}
                     <div className={cn(
                       "h-12 border-b border-border/20",
                       isCurrentHour && "border-2 border-[#4DA8DA] bg-transparent"
                     )} />
                   </div>
                   
                   {/* Time slots container */}
                   <div className="flex-1">
                     {/* 30-minute slots for this hour */}
                     {Array.from({ length: 2 }, (_, halfIndex) => {
                       const minute = halfIndex * 30;
                       const hasTask = hasTaskAtTime(hour, minute);
                       
                       return (
                         <TimeSlot
                           key={`${hour}-${minute}`}
                           hour={hour}
                           minute={minute}
                           isCurrentTime={isCurrentTimeSlot(hour, minute)}
                           hasTask={hasTask}
                           onClick={() => onQuickTaskCreate?.(hour, minute)}
                         />
                       );
                     })}
                  </div>
                </div>
              );
            })}
            
            {/* Scheduled tasks */}
            {scheduledTasks.map(task => {
              const position = calculateTaskPosition(task);
              if (!position) return null;
              
              return (
                <div
                  key={task.id}
                  style={{
                    position: 'absolute',
                    top: position.top + 2, // Add 2px top margin for spacing
                    height: Math.max(position.height - 4, 16), // Reduce height by 4px (2px top + 2px bottom), minimum 16px
                    left: 116, // Space for time labels + padding (w-28 = 112px + 4px padding)
                    right: 16,
                    zIndex: 10
                  }}
                >
                  <ScheduledTaskBlock
                    task={task}
                    onRemove={onTaskUnscheduled}
                    onEdit={onTaskEdit}
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
                    left: 116, // Space for time labels + padding (w-28 = 112px + 4px padding)
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
            {(() => {
              // Parse selectedDate using local timezone for consistent comparison
              const [year, month, day] = selectedDate.split('-').map(Number);
              const selectedDateObj = new Date(year, month - 1, day);
              return isToday(selectedDateObj);
            })() && (
              <div
                className="absolute right-0 h-0.5 bg-[#4DA8DA] z-30" // Changed from red to light blue
                style={{
                  top: (currentTime.getHours() * 96) + (currentTime.getMinutes() / 60 * 96),
                  left: 116, // Updated to match widened time column (w-28 = 112px + 4px padding)
                }}
              >
                <div className="absolute -left-2 -top-2 w-4 h-4 bg-red-500 rounded-full"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DayViewCalendar;