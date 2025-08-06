import React, { useState, useEffect, useRef, useCallback } from 'react';
import { format, addDays, subDays, isToday, parseISO, startOfDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, Clock, Star, GripVertical, Check, X } from 'lucide-react';
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

interface Project {
  id: string;
  name: string;
  color?: string;
  category: 'work' | 'home' | 'personal';
}

interface DayViewCalendarProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  tasks: Task[];
  projects: Project[];
  calendarEvents?: CalendarEvent[];
  onTaskScheduled?: (taskId: string, startTime: string, endTime: string) => void;
  onTaskUnscheduled?: (taskId: string) => void;
  onTaskEdit?: (task: Task) => void;
  onEventClick?: (event: CalendarEvent) => void;
  isGoogleConnected?: boolean;
  onConnectGoogle?: () => void;
  onDisconnectGoogle?: () => void;
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
  projects: Project[];
  onRemove: (taskId: string) => void;
  onEdit?: (task: Task) => void;
}

const ScheduledTaskBlock = ({ task, projects, onRemove, onEdit }: ScheduledTaskBlockProps) => {
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

  // Get project color
  const project = projects.find(p => p.id === task.project_id);
  const getProjectColor = (category: string = 'work', customColor?: string) => {
    if (customColor) return customColor;
    
    switch (category) {
      case 'personal': return 'hsl(150, 45%, 45%)';
      case 'home': return 'hsl(25, 95%, 53%)';
      case 'work':
      default: return '#4DA8DA';
    }
  };
  
  const projectColor = getProjectColor(project?.category, project?.color);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('✏️ Task clicked for editing:', task.title);
    onEdit?.(task);
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        backgroundColor: projectColor,
        borderColor: projectColor
      }}
      className={cn(
        "absolute inset-0 rounded-lg border z-10 shadow-sm text-white flex items-center relative",
        isDragging && "opacity-50"
      )}
      title="Drag anywhere to move • Click task name to edit"
    >
      {/* Task content area - clickable for editing */}
      <div className="p-2 h-full flex flex-col justify-center">
        <div className="text-sm truncate">
          <span 
            className="font-bold cursor-pointer hover:bg-white/10 px-1 py-0.5 rounded transition-colors"
            onClick={handleClick}
            title="Click to edit task"
          >
            {task.title}
          </span>
          {task.vibe_projects?.name && (
            <span className="font-normal"> - {task.vibe_projects.name}</span>
          )}
        </div>
      </div>
      
      {/* Extended drag area - covers everything except the text content */}
      <div
        className="absolute inset-0 cursor-grab active:cursor-grabbing z-0"
        {...listeners}
        {...attributes}
      />
    </div>
  );
};

interface EventBlockProps {
  event: CalendarEvent;
  onClick?: (event: CalendarEvent) => void;
}

const EventBlock = ({ event, onClick }: EventBlockProps) => {
  const handleCalendarEventClick = () => {
    // Open Google Calendar main page
    const calendarUrl = 'https://calendar.google.com/calendar/u/0/r';
    window.open(calendarUrl, '_blank');
  };

  return (
    <div
      className="absolute left-2 right-2 bg-blue-50 border border-blue-400 rounded-lg p-2 cursor-pointer z-10 shadow-sm hover:bg-blue-100 transition-colors"
      onClick={handleCalendarEventClick}
      title={`Google Calendar: ${event.description || event.title}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="text-xs font-medium text-blue-900 truncate">
            {event.title}
          </div>
          <div className="text-xs text-blue-700 mt-1">
            {format(parseISO(event.start), 'h:mm a')} - {format(parseISO(event.end), 'h:mm a')}
          </div>
        </div>
        <Calendar className="w-3 h-3 text-blue-500 ml-2 flex-shrink-0" />
      </div>
    </div>
  );
};

const DayViewCalendar = ({
  selectedDate,
  onDateChange,
  tasks,
  projects,
  calendarEvents = [],
  onTaskScheduled,
  onTaskUnscheduled,
  onTaskEdit,
  onEventClick,
  isGoogleConnected = false,
  onConnectGoogle,
  onDisconnectGoogle,
  onViewModeChange,
  onQuickTaskCreate
}: DayViewCalendarProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showUnsyncOption, setShowUnsyncOption] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hasAutoScrolled = useRef(false);
  const { toast } = useToast();

  const handleCalendarClick = () => {
    if (isGoogleConnected) {
      setShowUnsyncOption(!showUnsyncOption);
    } else {
      onConnectGoogle?.();
    }
  };

  const handleUnsync = () => {
    onDisconnectGoogle?.();
    setShowUnsyncOption(false);
  };

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
    
    // Each 30-minute slot is 48px (h-12)
    const startSlot = (startHour * 2) + (startMinute >= 30 ? 1 : 0);
    const endSlot = (endHour * 2) + (endMinute >= 30 ? 1 : 0);
    const duration = (endSlot - startSlot) * 48;
    
    return {
      top: startSlot * 48,
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
    
    // Each 30-minute slot is 48px (h-12)
    const startSlot = (startHour * 2) + (startMinute >= 30 ? 1 : 0);
    const endSlot = (endHour * 2) + (endMinute >= 30 ? 1 : 0);
    const duration = (endSlot - startSlot) * 48;
    
    return {
      top: startSlot * 48,
      height: Math.max(duration, 20)
    };
  };

  const formatTimeLabel = (hour: number, minute: number) => {
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const period = hour < 12 ? 'AM' : 'PM';
    const minuteStr = minute.toString().padStart(2, '0');
    return `${displayHour}:${minuteStr} ${period}`;
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
        {/* Calendar Icon and Clickable Text on Left */}
        <div className="flex items-center gap-2 relative">
          <Calendar className="h-5 w-5 text-primary" />
          <div 
            className={cn(
              "cursor-pointer select-none relative transition-colors duration-200",
              isGoogleConnected ? "text-green-600 hover:text-green-700" : "text-foreground hover:text-primary"
            )}
            onClick={handleCalendarClick}
          >
            <h1 className="text-lg font-semibold flex items-center gap-2">
              Calendar
              {isGoogleConnected && <Check className="h-4 w-4" />}
            </h1>
            
            {/* Unsync option tooltip */}
            {showUnsyncOption && isGoogleConnected && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-border rounded-lg shadow-lg p-2 z-50 min-w-[120px]">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUnsync();
                  }}
                  className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 w-full p-2 rounded transition-colors"
                >
                  <X className="h-4 w-4" />
                  Unsync
                </button>
              </div>
            )}
          </div>
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
            {/* Time labels and slots - 30-minute increments */}
            {Array.from({ length: 48 }, (_, index) => {
              const hour = Math.floor(index / 2);
              const minute = (index % 2) * 30;
              
              // Parse selectedDate using local timezone for consistent comparison
              const [year, month, day] = selectedDate.split('-').map(Number);
              const selectedDateObj = new Date(year, month - 1, day);
              const isCurrentSlot = isCurrentTimeSlot(hour, minute);
              const hasTask = hasTaskAtTime(hour, minute);
              
              return (
                <div 
                  key={`${hour}-${minute}`} 
                  data-hour={hour}
                  data-minute={minute}
                  className="flex w-full h-12 border-t border-gray-200"
                >
                  {/* Time column */}
                  <div className={cn(
                    "w-28 h-full pr-2 flex items-start justify-end border-r border-border",
                    isToday(selectedDateObj) ? "bg-primary/5" : "bg-muted/30"
                  )}>
                    {minute === 0 ? (
                      <span className={cn(
                        "pt-1 text-sm font-semibold text-gray-700",
                        isCurrentSlot && "text-[#4DA8DA] font-bold"
                      )}>
                        {formatTimeLabel(hour, minute)}
                      </span>
                    ) : (
                      <span className="invisible pt-1 text-sm font-semibold">
                        {formatTimeLabel(hour, minute)}
                      </span>
                    )}
                  </div>

                  {/* Time slot container */}
                  <div className="flex-1 h-full relative">
                    <TimeSlot
                      hour={hour}
                      minute={minute}
                      isCurrentTime={isCurrentSlot}
                      hasTask={hasTask}
                      onClick={() => onQuickTaskCreate?.(hour, minute)}
                    />
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
                    left: 120, // Space for time labels + padding (w-28 = 112px + 8px padding)
                    right: 16,
                    zIndex: 10
                  }}
                >
                  <ScheduledTaskBlock
                    task={task}
                    projects={projects}
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
                   top: ((currentTime.getHours() * 2) + (currentTime.getMinutes() >= 30 ? 1 : 0)) * 48,
                   left: 120, // Updated to match widened time column (w-28 = 112px + 8px padding)
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