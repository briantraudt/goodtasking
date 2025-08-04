import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { useAIScheduler } from '@/hooks/useAIScheduler';
import { useAIPlanner } from '@/hooks/useAIPlanner';
import TaskSidebar from '@/components/TaskSidebar';
import AITaskSequencerInline from '@/components/AITaskSequencerInline';
import DraggableTimelineTask from '@/components/DraggableTimelineTask';
import Enhanced24HourTimeline from '@/components/Enhanced24HourTimeline';
import { Calendar, Clock, Sparkles, Loader2, Undo2, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, parseISO, isToday, addDays, subDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { 
  DndContext, 
  DragEndEvent, 
  DragOverEvent, 
  useDroppable, 
  useDraggable, 
  DragOverlay,
  pointerWithin,
  closestCorners 
} from '@dnd-kit/core';
import { restrictToFirstScrollableAncestor } from '@dnd-kit/modifiers';

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
}

interface Project {
  id: string;
  name: string;
  tasks: Task[];
}

interface UnifiedDailyPlannerProps {
  projects: Project[];
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onCreateTask?: (projectId: string, title: string, description?: string, dueDate?: Date) => void;
  onCreateProject?: (project: { name: string; description: string; tasks: any[] }) => void;
  className?: string;
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

interface DroppableTimeSlotProps {
  hour: number;
  period: 'first' | 'second';
  children?: React.ReactNode;
  hasOverlap: boolean;
  isCurrentTime: boolean;
}

interface UndoAction {
  taskId: string;
  taskTitle: string;
  previousState: {
    scheduled_date: string | null;
  };
}

const DroppableTimeSlot = ({ hour, period, children, hasOverlap, isCurrentTime }: DroppableTimeSlotProps) => {
  const slotId = `${hour}-${period}`;
  const { isOver, setNodeRef } = useDroppable({
    id: slotId,
    disabled: hasOverlap, // Disable drop if there's overlap
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "h-[38px] border-b border-sidebar-border transition-colors relative",
        isOver && !hasOverlap && "bg-primary/10 border-primary/30 ring-1 ring-primary/20",
        isOver && hasOverlap && "bg-destructive/10 border-destructive/30 ring-1 ring-destructive/20",
        isCurrentTime && "bg-priority-medium/10"
      )}
    >
       {/* Time label on hover */}
       {isOver && (
         <div className="absolute -top-6 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded z-20">
           Drop at {format(new Date().setHours(hour, period === 'first' ? 0 : 30, 0, 0), 'h:mm a')}
         </div>
       )}
      
      {/* Current time indicator */}
      {isCurrentTime && (
        <div className="current-time-indicator absolute left-0 right-0 top-1/2 z-10">
        </div>
      )}
      
      {hasOverlap && isOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-destructive/10 text-destructive text-xs font-medium z-30">
          ⚠️ Overlap
        </div>
      )}
    </div>
  );
};

const UnifiedDailyPlanner = ({ projects, onUpdateTask, onCreateTask, onCreateProject, className }: UnifiedDailyPlannerProps) => {
  const { events, isConnected, loading: calendarLoading, refreshEvents } = useGoogleCalendar();
  const { scheduleTasksWithAI, updateTaskSchedule, loading: aiLoading } = useAIScheduler();
  const { planMyDay, loading: planningLoading } = useAIPlanner();
  const { toast } = useToast();
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    // Force to YYYY-MM-DD format in local timezone
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [undoAction, setUndoAction] = useState<UndoAction | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dragOverTimeSlot, setDragOverTimeSlot] = useState<string | null>(null);

  // Get today's scheduled tasks
  const scheduledTasks = projects.flatMap(project => 
    project.tasks.filter(task => 
      !task.completed && 
      task.scheduled_date === selectedDate
    )
  );

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Refresh calendar events when date changes
  useEffect(() => {
    if (isConnected && refreshEvents) {
      refreshEvents(selectedDate);
    }
  }, [selectedDate, isConnected]); // Removed refreshEvents from dependencies

  const formatTime = (timeStr: string) => {
    try {
      // Handle different time formats from Google Calendar
      if (timeStr.includes('T')) {
        // Parse ISO datetime and convert to local time for display
        const date = parseISO(timeStr);
        return format(date, 'HH:mm'); // Use 24-hour format for consistent parsing
      }
      return timeStr;
    } catch (error) {
      console.error('Error formatting time:', error, timeStr);
      return timeStr;
    }
  };

  const formatHour = (hour: number) => {
    const date = new Date();
    date.setHours(hour, 0, 0, 0);
    return format(date, 'h:00 a');
  };

  const isCurrentTimeSlot = useCallback((hour: number, period: 'first' | 'second') => {
    // Parse selectedDate as local date to avoid timezone issues
    const [year, month, day] = selectedDate.split('-').map(Number);
    const selectedDateLocal = new Date(year, month - 1, day); // month is 0-indexed
    
    if (!isToday(selectedDateLocal)) return false;
    
    const now = currentTime;
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    
    if (currentHour !== hour) return false;
    
    return period === 'first' ? currentMinutes < 30 : currentMinutes >= 30;
  }, [selectedDate, currentTime]);

  const hasTimeSlotOverlap = useCallback((hour: number, period: 'first' | 'second', currentBlocks?: TimeBlock[]) => {
    const blocksToCheck = currentBlocks || timeBlocks;
    const targetTime = `${hour.toString().padStart(2, '0')}:${period === 'first' ? '00' : '30'}`;
    const nextSlotTime = `${hour.toString().padStart(2, '0')}:${period === 'first' ? '30' : '60'}`;
    
    return blocksToCheck.some(block => {
      const blockStart = block.start;
      const blockEnd = block.end;
      
      // Check if there's any overlap with the 30-minute slot
      return (blockStart <= targetTime && blockEnd > targetTime) ||
             (blockStart < nextSlotTime && blockEnd >= nextSlotTime) ||
             (blockStart >= targetTime && blockEnd <= nextSlotTime);
    });
  }, [timeBlocks]);

  const generateTimeBlocks = useCallback(() => {
    const blocks: TimeBlock[] = [];

    // Filter events for the selected date and add to blocks
    const filteredEvents = events.filter(event => {
      // Parse event start time (it's in UTC)
      const eventStart = new Date(event.start);
      // Get the local date for the event
      const eventLocalDate = eventStart.toLocaleDateString('en-CA'); // YYYY-MM-DD format
      // Compare with selected date
      return eventLocalDate === selectedDate;
    });

    filteredEvents.forEach(event => {
      blocks.push({
        id: `event-${event.id}`,
        title: event.title,
        start: formatTime(event.start),
        end: formatTime(event.end),
        type: 'event',
        color: '',
        googleEventId: event.id // Pass the Google event ID
      });
    });

    // Add scheduled tasks
    scheduledTasks.forEach(task => {
      if (task.start_time && task.end_time) {
        blocks.push({
          id: `task-${task.id}`,
          title: task.title,
          start: task.start_time,
          end: task.end_time,
          type: 'task',
          color: getPriorityColor(task.priority),
          priority: task.priority,
          taskId: task.id
        });
      }
    });

    // Sort by time
    return blocks.sort((a, b) => a.start.localeCompare(b.start));
  }, [events, scheduledTasks, selectedDate]); // Add selectedDate dependency

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'bg-priority-high/10 border-priority-high/30 text-priority-high';
      case 'medium': return 'bg-priority-medium/10 border-priority-medium/30 text-priority-medium';
      case 'low': return 'bg-priority-low/10 border-priority-low/30 text-priority-low';
      default: return 'bg-muted border-muted-foreground/20 text-muted-foreground';
    }
  };

  const handleSmartSchedule = async () => {
    const unscheduledTasks = projects.flatMap(project => 
      project.tasks.filter(task => 
        !task.completed && 
        !task.scheduled_date
      )
    );

    const result = await scheduleTasksWithAI(events, unscheduledTasks, selectedDate);
    
    if (result && result.scheduledTasks.length > 0) {
      const updatedBlocks = [...timeBlocks.filter(block => block.type === 'event')];
      
      // Process each scheduled task
      for (const suggestion of result.scheduledTasks) {
        // Update task in database
        const success = await updateTaskSchedule(
          suggestion.taskId, 
          selectedDate, 
          suggestion.proposedStartTime, 
          suggestion.proposedEndTime
        );
        
        if (success) {
          // Update the task in the projects state
          onUpdateTask(suggestion.taskId, { 
            scheduled_date: selectedDate,
            start_time: suggestion.proposedStartTime,
            end_time: suggestion.proposedEndTime
          });
          
          // Find the task to get its details
          const task = unscheduledTasks.find(t => t.id === suggestion.taskId);
          
          if (task) {
            updatedBlocks.push({
              id: `task-${suggestion.taskId}`,
              title: task.title,
              start: suggestion.proposedStartTime,
              end: suggestion.proposedEndTime,
              type: 'task',
              color: getPriorityColor(task.priority),
              priority: task.priority,
              taskId: suggestion.taskId
            });
          }
        }
      }
      
      setTimeBlocks(updatedBlocks.sort((a, b) => a.start.localeCompare(b.start)));
      
      toast({
        title: "Smart Schedule Complete! 🤖",
        description: `Optimally scheduled ${result.scheduledTasks.length} tasks around your calendar events.`,
      });
    }
  };

  const handlePlanMyDay = async () => {
    const result = await planMyDay(selectedDate, events);
    
    if (result && result.dayPlan.length > 0) {
      // Update time blocks with AI day plan
      const updatedBlocks = [...timeBlocks.filter(block => block.type === 'event')];
      
      // Update tasks in database and UI
      for (const planItem of result.dayPlan) {
        // Update task in database
        const success = await updateTaskSchedule(planItem.taskId, selectedDate, planItem.startTime, planItem.endTime);
        
        if (success) {
          // Update the task in the projects state
          onUpdateTask(planItem.taskId, { 
            scheduled_date: selectedDate,
            start_time: planItem.startTime,
            end_time: planItem.endTime
          });
          
          // Add to time blocks with gradient styling for AI-planned tasks
          updatedBlocks.push({
            id: `task-${planItem.taskId}`,
            title: planItem.title,
            start: planItem.startTime,
            end: planItem.endTime,
            type: 'task',
            color: 'bg-gradient-ai-planned/10 border-2 border-gradient-ai-planned/30 text-primary',
            priority: 'planned',
            taskId: planItem.taskId
          });
        }
      }
      
      setTimeBlocks(updatedBlocks.sort((a, b) => a.start.localeCompare(b.start)));
      
      toast({
        title: "Day Planned Successfully! 📅",
        description: `Scheduled ${result.dayPlan.length} tasks for ${format(new Date(selectedDate), 'MMM d')}.`,
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    setDragOverTimeSlot(null);
    const { active, over } = event;
    
    if (!over || !active.data.current) return;

    const activeData = active.data.current;
    
    // Handle dragging from sidebar to calendar
    if (activeData.type !== 'timeline-task') {
      const task = activeData as Task;
      const dropSlot = over.id as string;
      
      // Check if dropping to sidebar (unschedule)
      if (dropSlot === 'task-sidebar') {
        return; // Task is already unscheduled
      }
      
      // Parse the drop slot (format: "hour-period")
      const [hourStr, period] = dropSlot.split('-');
      const hour = parseInt(hourStr);
      const minutes = period === 'second' ? 30 : 0;
      
      // Check for overlap before proceeding
      if (hasTimeSlotOverlap(hour, period as 'first' | 'second')) {
        toast({
          title: "Time Slot Conflict",
          description: "This time slot is already occupied. Please choose another time.",
          variant: "destructive",
        });
        return;
      }
      
      const startTime = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      const duration = task.estimated_duration || 30;
      const endHour = Math.floor((hour * 60 + minutes + duration) / 60);
      const endMinutes = (hour * 60 + minutes + duration) % 60;
      const endTime = `${endHour.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;

      // Store undo action
      setUndoAction({
        taskId: task.id,
        taskTitle: task.title,
        previousState: {
          scheduled_date: task.scheduled_date
        }
      });

      // Update task in database
      const success = await updateTaskSchedule(task.id, selectedDate, startTime, endTime);
      
      if (success) {
        // Update local state
        onUpdateTask(task.id, { scheduled_date: selectedDate });
        
        // Add to time blocks
        const newBlock: TimeBlock = {
          id: `task-${task.id}`,
          title: task.title,
          start: startTime,
          end: endTime,
          type: 'task',
          color: getPriorityColor(task.priority),
          priority: task.priority,
          taskId: task.id
        };
        
        setTimeBlocks(prev => [...prev, newBlock].sort((a, b) => a.start.localeCompare(b.start)));
        
        toast({
          title: "Task Scheduled! ✅",
          description: `${task.title} scheduled for ${format(new Date().setHours(parseInt(startTime.split(':')[0]), parseInt(startTime.split(':')[1]), 0, 0), 'h:mm a')}`,
        });

        // Clear undo after 5 seconds
        setTimeout(() => setUndoAction(null), 5000);
      } else {
        setUndoAction(null);
        toast({
          title: "Scheduling Failed",
          description: "Unable to schedule task. Please try again.",
          variant: "destructive",
        });
      }
    }
    // Handle dragging from timeline back to sidebar
    else if (activeData.type === 'timeline-task') {
      const { task, block } = activeData;
      const dropSlot = over.id as string;
      
      // Check if dropping to sidebar (unschedule)
      if (dropSlot === 'task-sidebar') {
        // Store undo action
        setUndoAction({
          taskId: task.id,
          taskTitle: task.title,
          previousState: {
            scheduled_date: task.scheduled_date
          }
        });

        // Unschedule task
        const success = await updateTaskSchedule(task.id, '', '', '');
        
        if (success) {
          // Update local state
          onUpdateTask(task.id, { scheduled_date: null });
          
          // Remove from time blocks
          setTimeBlocks(prev => prev.filter(b => b.id !== block.id));
          
          toast({
            title: "Task Unscheduled",
            description: `${task.title} moved back to task list`,
          });

          // Clear undo after 5 seconds
          setTimeout(() => setUndoAction(null), 5000);
        }
      }
      // Handle moving between time slots
      else {
        const [hourStr, period] = dropSlot.split('-');
        const hour = parseInt(hourStr);
        const minutes = period === 'second' ? 30 : 0;
        
        // Check for overlap before proceeding
        if (hasTimeSlotOverlap(hour, period as 'first' | 'second')) {
          toast({
            title: "Time Slot Conflict",
            description: "This time slot is already occupied. Please choose another time.",
            variant: "destructive",
          });
          return;
        }
        
        const startTime = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        const duration = task.estimated_duration || 30;
        const endHour = Math.floor((hour * 60 + minutes + duration) / 60);
        const endMinutes = (hour * 60 + minutes + duration) % 60;
        const endTime = `${endHour.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;

        // Store undo action
        setUndoAction({
          taskId: task.id,
          taskTitle: task.title,
          previousState: {
            scheduled_date: task.scheduled_date
          }
        });

        // Update task in database
        const success = await updateTaskSchedule(task.id, selectedDate, startTime, endTime);
        
        if (success) {
          // Update time blocks
          setTimeBlocks(prev => 
            prev.map(b => 
              b.id === block.id 
                ? { ...b, start: startTime, end: endTime }
                : b
            ).sort((a, b) => a.start.localeCompare(b.start))
          );
          
          toast({
            title: "Task Rescheduled",
            description: `${task.title} moved to ${format(new Date().setHours(parseInt(startTime.split(':')[0]), parseInt(startTime.split(':')[1]), 0, 0), 'h:mm a')}`,
          });

          // Clear undo after 5 seconds
          setTimeout(() => setUndoAction(null), 5000);
        }
      }
    }
  };

  const handleUndo = async () => {
    if (!undoAction) return;

    const success = await updateTaskSchedule(
      undoAction.taskId, 
      undoAction.previousState.scheduled_date || '', 
      '', 
      ''
    );

    if (success) {
      onUpdateTask(undoAction.taskId, { 
        scheduled_date: undoAction.previousState.scheduled_date 
      });
      
      // Remove from time blocks
      setTimeBlocks(prev => prev.filter(block => block.id !== `task-${undoAction.taskId}`));
      
      toast({
        title: "Undo Successful",
        description: `${undoAction.taskTitle} moved back to unscheduled tasks.`,
      });
      
      setUndoAction(null);
    }
  };

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (over) {
      setDragOverTimeSlot(over.id as string);
    } else {
      setDragOverTimeSlot(null);
    }
  };

  const formatSelectedDate = () => {
    // Parse as local date to avoid timezone issues
    const [year, month, day] = selectedDate.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed
    return format(date, 'MMM d, yyyy');
  };

  useEffect(() => {
    const newBlocks = generateTimeBlocks();
    setTimeBlocks(newBlocks);
  }, [selectedDate]); // Only depend on selectedDate since generateTimeBlocks already uses useMemo


  if (calendarLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading calendar...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <DndContext 
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      collisionDetection={pointerWithin}
      modifiers={[restrictToFirstScrollableAncestor]}
    >
      <div className={cn("h-full overflow-hidden flex flex-col", className)}>

        {/* Restructured Layout: Top 2/3 Columns + Bottom 1/3 AI Panel */}
        <div className="flex-1 flex flex-col gap-6 p-6 min-h-0 overflow-hidden">
          
          {/* Top Section: Side-by-Side Columns (66% viewport height) */}
          <div className="grid grid-cols-[65fr_35fr] gap-6 overflow-hidden" style={{ height: '66vh' }}>
            
            {/* Left Column - Calendar Timeline (65% width) */}
            <div className="overflow-hidden" data-calendar-section>
              <Enhanced24HourTimeline
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                timeBlocks={timeBlocks}
                onDrop={(hour, period, item) => {
                  // This will be handled by the existing drag and drop logic
                  console.log('Drop handled:', hour, period, item);
                }}
              >
                {/* Undo Button */}
                {undoAction && (
                  <div className="absolute bottom-6 right-6 z-50">
                    <Button
                      onClick={handleUndo}
                      className="flex items-center gap-2 shadow-elevated bg-accent text-accent-foreground hover:bg-accent/90"
                      variant="secondary"
                    >
                      <Undo2 className="h-4 w-4" />
                      Undo: {undoAction.taskTitle}
                    </Button>
                  </div>
                )}
              </Enhanced24HourTimeline>
            </div>

            {/* Right Column - Tasks Only (35% width) */}
            <div className="flex flex-col overflow-hidden border border-border rounded-xl bg-card shadow-sm" data-tasks-section>
              <div className="flex-1 overflow-y-auto scrollbar-none">
                <TaskSidebar
                  projects={projects}
                  selectedDate={selectedDate}
                  onCreateTask={onCreateTask}
                  onCreateProject={onCreateProject}
                />
              </div>
            </div>

          </div>

          {/* Bottom Section: Full-Width AI Task Sequencer (remaining viewport space) */}
          <div className="flex-1 border-t-2 border-muted pt-6" data-ai-footer-section>
            <div className="border border-border rounded-xl bg-card shadow-sm">
              <div className="overflow-y-auto scrollbar-none" style={{ maxHeight: '30vh' }}>
                <AITaskSequencerInline
                  targetDate={selectedDate}
                  onTasksScheduled={(tasks) => {
                    // Handle AI-scheduled tasks - add them to timeline
                    console.log('AI scheduled tasks:', tasks);
                    // You can integrate these tasks into your timeline here
                  }}
                />
              </div>
            </div>
          </div>

        </div>


        {/* Drag Overlay with Ghost Preview */}
        <DragOverlay>
          {activeId ? (
            <div className="p-3 rounded-lg border bg-primary/10 border-primary/30 text-primary opacity-80 shadow-elevated">
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                <span className="text-sm font-medium">Dragging task...</span>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
};

export default UnifiedDailyPlanner;