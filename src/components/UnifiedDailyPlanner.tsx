import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { useAIScheduler } from '@/hooks/useAIScheduler';
import { useAIPlanner } from '@/hooks/useAIPlanner';
import TaskSidebar from '@/components/TaskSidebar';
import { Calendar, Clock, Sparkles, Loader2 } from 'lucide-react';
import { format, parseISO, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { DndContext, DragEndEvent, DragOverEvent, useDroppable } from '@dnd-kit/core';

interface Task {
  id: string;
  title: string;
  priority?: 'high' | 'medium' | 'low';
  estimated_duration?: number;
  due_date?: string | null;
  scheduled_date?: string | null;
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
}

interface DroppableTimeSlotProps {
  hour: number;
  period: 'first' | 'second';
  children: React.ReactNode;
}

const DroppableTimeSlot = ({ hour, period, children }: DroppableTimeSlotProps) => {
  const slotId = `${hour}-${period}`;
  const { isOver, setNodeRef } = useDroppable({
    id: slotId,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[30px] border-b border-muted transition-colors",
        isOver && "bg-blue-50 border-blue-200"
      )}
    >
      {children}
    </div>
  );
};

const UnifiedDailyPlanner = ({ projects, onUpdateTask, className }: UnifiedDailyPlannerProps) => {
  const { events, isConnected, loading: calendarLoading } = useGoogleCalendar();
  const { scheduleTasksWithAI, updateTaskSchedule, loading: aiLoading } = useAIScheduler();
  const { planMyDay, loading: planningLoading } = useAIPlanner();
  const { toast } = useToast();
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Get today's scheduled tasks
  const scheduledTasks = projects.flatMap(project => 
    project.tasks.filter(task => 
      !task.completed && 
      task.scheduled_date === selectedDate
    )
  );

  const formatTime = (timeStr: string) => {
    if (timeStr.includes('T')) {
      return format(parseISO(timeStr), 'HH:mm');
    }
    return timeStr;
  };

  const generateTimeBlocks = () => {
    const blocks: TimeBlock[] = [];

    // Add calendar events
    events.forEach(event => {
      blocks.push({
        id: `event-${event.id}`,
        title: event.title,
        start: formatTime(event.start),
        end: formatTime(event.end),
        type: 'event',
        color: 'bg-blue-100 border-blue-300 text-blue-800'
      });
    });

    // Add scheduled tasks
    scheduledTasks.forEach(task => {
      blocks.push({
        id: `task-${task.id}`,
        title: task.title,
        start: '09:00', // Default start time - would be actual scheduled time
        end: '09:30', // Default end time based on duration
        type: 'task',
        color: getPriorityColor(task.priority),
        priority: task.priority
      });
    });

    // Sort by time
    blocks.sort((a, b) => a.start.localeCompare(b.start));
    setTimeBlocks(blocks);
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 border-red-300 text-red-800';
      case 'medium': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'low': return 'bg-green-100 border-green-300 text-green-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
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
      // Update time blocks with AI suggestions
      const updatedBlocks = [...timeBlocks];
      
      result.scheduledTasks.forEach(suggestion => {
        const blockIndex = updatedBlocks.findIndex(block => 
          block.id === `task-${suggestion.taskId}`
        );
        
        if (blockIndex !== -1) {
          updatedBlocks[blockIndex] = {
            ...updatedBlocks[blockIndex],
            start: suggestion.proposedStartTime,
            end: suggestion.proposedEndTime
          };
        }
      });
      
      setTimeBlocks(updatedBlocks.sort((a, b) => a.start.localeCompare(b.start)));
    }
  };

  const handlePlanMyDay = async () => {
    const result = await planMyDay(selectedDate, events);
    
    if (result && result.dayPlan.length > 0) {
      // Update time blocks with AI day plan
      const updatedBlocks = [...timeBlocks.filter(block => block.type === 'event')];
      
      result.dayPlan.forEach(planItem => {
        updatedBlocks.push({
          id: `planned-${planItem.taskId}`,
          title: planItem.title,
          start: planItem.startTime,
          end: planItem.endTime,
          type: 'task',
          color: 'bg-purple-100 border-purple-300 text-purple-800',
          priority: 'planned'
        });
      });
      
      setTimeBlocks(updatedBlocks.sort((a, b) => a.start.localeCompare(b.start)));
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || !active.data.current) return;

    const task = active.data.current as Task;
    const dropSlot = over.id as string;
    
    // Parse the drop slot (format: "hour-period")
    const [hourStr, period] = dropSlot.split('-');
    const hour = parseInt(hourStr);
    const minutes = period === 'second' ? 30 : 0;
    
    const startTime = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    const duration = task.estimated_duration || 30;
    const endHour = Math.floor((hour * 60 + minutes + duration) / 60);
    const endMinutes = (hour * 60 + minutes + duration) % 60;
    const endTime = `${endHour.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;

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
        priority: task.priority
      };
      
      setTimeBlocks(prev => [...prev, newBlock].sort((a, b) => a.start.localeCompare(b.start)));
      
      toast({
        title: "Task Scheduled! ✅",
        description: `${task.title} scheduled for ${startTime}`,
      });
    } else {
      toast({
        title: "Scheduling Failed",
        description: "Unable to schedule task. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Generate time slots (9 AM to 6 PM)
  const timeSlots = Array.from({ length: 9 }, (_, i) => i + 9);

  useEffect(() => {
    generateTimeBlocks();
  }, [events, scheduledTasks, selectedDate]);

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
    <DndContext onDragEnd={handleDragEnd}>
      <div className={cn("flex gap-4 h-full", className)}>
        {/* Left side - Calendar Timeline (70%) */}
        <Card className="flex-[7]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Daily Timeline
                <Badge variant="secondary">{format(new Date(selectedDate), 'MMM d')}</Badge>
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePlanMyDay}
                  disabled={planningLoading || !isConnected}
                  className="flex items-center gap-1"
                >
                  {planningLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Calendar className="h-3 w-3" />
                  )}
                  Plan My Day
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSmartSchedule}
                  disabled={aiLoading}
                  className="flex items-center gap-1"
                >
                  {aiLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                  Smart Schedule
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!isConnected && (
              <div className="text-center py-4 text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Connect your Google Calendar to see a unified view</p>
              </div>
            )}

            {/* Time Grid */}
            <div className="space-y-0 border rounded-lg overflow-hidden">
              {timeSlots.map(hour => (
                <div key={hour} className="grid grid-cols-[80px_1fr] border-b last:border-b-0">
                  {/* Time Label */}
                  <div className="bg-muted/50 p-2 text-sm font-medium text-center border-r">
                    {hour}:00
                  </div>
                  
                  {/* Time Slots */}
                  <div className="grid grid-rows-2">
                    {/* First half hour */}
                    <DroppableTimeSlot hour={hour} period="first">
                      {timeBlocks
                        .filter(block => block.start.startsWith(`${hour.toString().padStart(2, '0')}:0`))
                        .map(block => (
                          <div
                            key={block.id}
                            className={cn(
                              "p-2 m-1 rounded text-xs transition-all hover:shadow-sm",
                              block.color
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{block.start} - {block.end}</span>
                              <Badge variant="outline" className="text-xs">
                                {block.type}
                              </Badge>
                            </div>
                            <p className="font-medium mt-1">{block.title}</p>
                          </div>
                        ))
                      }
                    </DroppableTimeSlot>
                    
                    {/* Second half hour */}
                    <DroppableTimeSlot hour={hour} period="second">
                      {timeBlocks
                        .filter(block => block.start.startsWith(`${hour.toString().padStart(2, '0')}:3`))
                        .map(block => (
                          <div
                            key={block.id}
                            className={cn(
                              "p-2 m-1 rounded text-xs transition-all hover:shadow-sm",
                              block.color
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{block.start} - {block.end}</span>
                              <Badge variant="outline" className="text-xs">
                                {block.type}
                              </Badge>
                            </div>
                            <p className="font-medium mt-1">{block.title}</p>
                          </div>
                        ))
                      }
                    </DroppableTimeSlot>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Stats */}
            <div className="mt-6 pt-4 border-t">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-blue-600">{events.length}</p>
                  <p className="text-xs text-muted-foreground">Calendar Events</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{scheduledTasks.length}</p>
                  <p className="text-xs text-muted-foreground">Scheduled Tasks</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">{timeBlocks.length}</p>
                  <p className="text-xs text-muted-foreground">Total Blocks</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right side - Task Sidebar (30%) */}
        <TaskSidebar 
          projects={projects}
          selectedDate={selectedDate}
          className="flex-[3]"
        />
      </div>
    </DndContext>
  );
};

export default UnifiedDailyPlanner;