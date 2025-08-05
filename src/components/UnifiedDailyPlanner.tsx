import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAIScheduler } from '@/hooks/useAIScheduler';
import { useAIPlanner } from '@/hooks/useAIPlanner';
import TaskSidebar from '@/components/TaskSidebar';
import SmartAddButton from '@/components/SmartAddButton';
import AIChatBubble from '@/components/AIChatBubble';
import FooterMetrics from '@/components/FooterMetrics';
import DraggableTimelineTask from '@/components/DraggableTimelineTask';
import { CheckSquare, Clock, Sparkles, Loader2, Undo2 } from 'lucide-react';
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
  type: 'task';
  color: string;
  priority?: string;
  taskId?: string;
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
    disabled: hasOverlap,
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
       {isOver && (
         <div className="absolute -top-6 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded z-20">
           Drop at {format(new Date().setHours(hour, period === 'first' ? 0 : 30, 0, 0), 'h:mm a')}
         </div>
       )}
      
      {isCurrentTime && (
        <div className="current-time-indicator absolute left-0 right-0 top-1/2 z-10">
        </div>
      )}
      
      {hasOverlap && isOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-destructive/10 text-destructive text-xs font-medium z-30">
          ⚠️ Overlap
        </div>
      )}
      
      {children}
    </div>
  );
};

const SimpleCalendar = ({ selectedDate, onDateChange, timeBlocks, children }: {
  selectedDate: string;
  onDateChange: (date: string) => void;
  timeBlocks: TimeBlock[];
  children?: React.ReactNode;
}) => {
  const formatHour = (hour: number) => {
    const date = new Date();
    date.setHours(hour, 0, 0, 0);
    return format(date, 'h:00 a');
  };

  const isCurrentTimeSlot = (hour: number, period: 'first' | 'second') => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const selectedDateLocal = new Date(year, month - 1, day);
    
    if (!isToday(selectedDateLocal)) return false;
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    
    if (currentHour !== hour) return false;
    
    return period === 'first' ? currentMinutes < 30 : currentMinutes >= 30;
  };

  const hasTimeSlotOverlap = (hour: number, period: 'first' | 'second') => {
    const targetTime = `${hour.toString().padStart(2, '0')}:${period === 'first' ? '00' : '30'}`;
    const nextSlotTime = `${hour.toString().padStart(2, '0')}:${period === 'first' ? '30' : '60'}`;
    
    return timeBlocks.some(block => {
      const blockStart = block.start;
      const blockEnd = block.end;
      
      return (blockStart <= targetTime && blockEnd > targetTime) ||
             (blockStart < nextSlotTime && blockEnd >= nextSlotTime) ||
             (blockStart >= targetTime && blockEnd <= nextSlotTime);
    });
  };

  const renderTimeBlocks = (hour: number, period: 'first' | 'second') => {
    const targetTime = `${hour.toString().padStart(2, '0')}:${period === 'first' ? '00' : '30'}`;
    const nextSlotTime = `${hour.toString().padStart(2, '0')}:${period === 'first' ? '30' : '60'}`;
    
    return timeBlocks
      .filter(block => {
        const blockStart = block.start;
        const blockEnd = block.end;
        return (blockStart <= targetTime && blockEnd > targetTime) ||
               (blockStart < nextSlotTime && blockEnd >= nextSlotTime) ||
               (blockStart >= targetTime && blockEnd <= nextSlotTime);
      })
      .map(block => (
        <DraggableTimelineTask
          key={block.id}
          block={block}
        />
      ));
  };

  return (
    <div className="relative h-full overflow-y-auto">
      {/* Generate 24 hours with half-hour slots */}
      {Array.from({ length: 24 }, (_, hour) => (
        <div key={hour} className="border-b border-sidebar-border">
          {/* Hour label */}
          <div 
            className="sticky left-0 bg-navy-blue text-white p-2 text-sm font-semibold border-r-2 border-border"
            style={{ minWidth: '80px', textAlign: 'center' }}
          >
            {formatHour(hour)}
          </div>
          
          {/* First half hour */}
          <DroppableTimeSlot
            hour={hour}
            period="first"
            hasOverlap={hasTimeSlotOverlap(hour, 'first')}
            isCurrentTime={isCurrentTimeSlot(hour, 'first')}
          >
            {renderTimeBlocks(hour, 'first')}
          </DroppableTimeSlot>
          
          {/* Second half hour */}
          <DroppableTimeSlot
            hour={hour}
            period="second"
            hasOverlap={hasTimeSlotOverlap(hour, 'second')}
            isCurrentTime={isCurrentTimeSlot(hour, 'second')}
          >
            {renderTimeBlocks(hour, 'second')}
          </DroppableTimeSlot>
        </div>
      ))}
      
      {children}
    </div>
  );
};

const UnifiedDailyPlanner = ({ projects, onUpdateTask, onCreateTask, onCreateProject, className }: UnifiedDailyPlannerProps) => {
  const { scheduleTasksWithAI, updateTaskSchedule, loading: aiLoading } = useAIScheduler();
  const { planMyDay, loading: planningLoading } = useAIPlanner();
  const { toast } = useToast();
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => {
    return format(new Date(), 'yyyy-MM-dd');
  });
  const [undoAction, setUndoAction] = useState<UndoAction | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    if (selectedDate !== today) {
      setSelectedDate(today);
    }
  }, []);

  const [lastAISequence, setLastAISequence] = useState<Date | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dragOverTimeSlot, setDragOverTimeSlot] = useState<string | null>(null);

  const scheduledTasks = projects.flatMap(project => 
    project.tasks.filter(task => 
      !task.completed && 
      task.scheduled_date === selectedDate
    )
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const generateTimeBlocks = useCallback(() => {
    const blocks: TimeBlock[] = [];

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

    return blocks.sort((a, b) => a.start.localeCompare(b.start));
  }, [scheduledTasks]);

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

    const result = await scheduleTasksWithAI([], unscheduledTasks, selectedDate);
    
    if (result && result.scheduledTasks.length > 0) {
      const updatedBlocks = [...timeBlocks];
      
      for (const suggestion of result.scheduledTasks) {
        const success = await updateTaskSchedule(
          suggestion.taskId, 
          selectedDate, 
          suggestion.proposedStartTime, 
          suggestion.proposedEndTime
        );
        
        if (success) {
          onUpdateTask(suggestion.taskId, { 
            scheduled_date: selectedDate,
            start_time: suggestion.proposedStartTime,
            end_time: suggestion.proposedEndTime
          });
          
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
        description: `Optimally scheduled ${result.scheduledTasks.length} tasks.`,
      });
    }
  };

  const handlePlanMyDay = async () => {
    const result = await planMyDay(selectedDate, []);
    
    if (result && result.dayPlan.length > 0) {
      const updatedBlocks = [...timeBlocks];
      
      for (const planItem of result.dayPlan) {
        const success = await updateTaskSchedule(planItem.taskId, selectedDate, planItem.startTime, planItem.endTime);
        
        if (success) {
          onUpdateTask(planItem.taskId, { 
            scheduled_date: selectedDate,
            start_time: planItem.startTime,
            end_time: planItem.endTime
          });
          
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
    
    if (activeData.type !== 'timeline-task') {
      const task = activeData as Task;
      const dropSlot = over.id as string;
      
      if (dropSlot === 'task-sidebar') {
        return;
      }
      
      const [hourStr, period] = dropSlot.split('-');
      const hour = parseInt(hourStr);
      const minutes = period === 'second' ? 30 : 0;
      
      const startTime = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      const duration = task.estimated_duration || 30;
      const endHour = Math.floor((hour * 60 + minutes + duration) / 60);
      const endMinutes = (hour * 60 + minutes + duration) % 60;
      const endTime = `${endHour.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;

      setUndoAction({
        taskId: task.id,
        taskTitle: task.title,
        previousState: {
          scheduled_date: task.scheduled_date
        }
      });

      const success = await updateTaskSchedule(task.id, selectedDate, startTime, endTime);
      
      if (success) {
        onUpdateTask(task.id, { scheduled_date: selectedDate });
        
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

  useEffect(() => {
    const newBlocks = generateTimeBlocks();
    setTimeBlocks(newBlocks);
  }, [selectedDate, generateTimeBlocks]);

  return (
    <DndContext 
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      collisionDetection={pointerWithin}
      modifiers={[restrictToFirstScrollableAncestor]}
    >
      <div className={cn("h-full overflow-hidden flex flex-col", className)}>
        <div className="flex-1 grid grid-cols-2 gap-6 p-6 min-h-0 overflow-hidden pb-24">
          
          {/* Left Column - Simple Calendar Timeline */}
          <div className="bg-white rounded-xl shadow-sm p-4 border overflow-hidden" data-calendar-section>
            <div className="flex flex-col h-full">
              <div className="sticky top-0 z-10 bg-white pb-4 border-b border-timeline-gray mb-4">
                <div className="flex items-center justify-center gap-4">
                  <button 
                    onClick={() => {
                      const prevDay = format(subDays(new Date(selectedDate), 1), 'yyyy-MM-dd');
                      setSelectedDate(prevDay);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    ←
                  </button>
                  <span className="font-semibold text-lg text-[#1E3A5F]">
                    {format(new Date(selectedDate), 'EEEE, MMMM d')}
                  </span>
                  <button 
                    onClick={() => {
                      const nextDay = format(addDays(new Date(selectedDate), 1), 'yyyy-MM-dd');
                      setSelectedDate(nextDay);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    →
                  </button>
                </div>
                {selectedDate !== format(new Date(), 'yyyy-MM-dd') && (
                  <div className="flex justify-center mt-2">
                    <button
                      onClick={() => {
                        const today = format(new Date(), 'yyyy-MM-dd');
                        setSelectedDate(today);
                      }}
                      className="px-4 py-2 text-sm bg-forest-green text-white rounded-lg hover:bg-forest-green/90 transition-colors font-medium"
                    >
                      Today
                    </button>
                  </div>
                )}
              </div>
              
              <div 
                className="flex-1 overflow-hidden"
                style={{
                  maxHeight: 'calc(100vh - 300px)',
                  overflowY: 'scroll',
                  scrollBehavior: 'smooth'
                }}
              >
                <SimpleCalendar
                  selectedDate={selectedDate}
                  onDateChange={setSelectedDate}
                  timeBlocks={timeBlocks}
                >
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
                </SimpleCalendar>
              </div>
            </div>
          </div>

          {/* Right Column - Tasks */}
          <div className="bg-white rounded-xl shadow-sm p-4 border overflow-hidden" data-tasks-section>
            <div className="flex flex-col h-full">
              <div className="sticky top-0 z-10 bg-white pb-4 border-b border-timeline-gray mb-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-navy-blue flex items-center gap-2">
                    <CheckSquare className="h-5 w-5 text-forest-green" />
                    Tasks
                  </h2>
                  <SmartAddButton
                    projects={projects.map(p => ({ id: p.id, name: p.name, tasks: [] }))}
                    onCreateTask={(projectId: string, title: string, scheduledDate: Date) => {
                      onCreateTask?.(projectId, title, undefined, scheduledDate);
                    }}
                    onCreateProject={onCreateProject}
                  />
                </div>
              </div>
              
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

        </div>

        <AIChatBubble
          targetDate={selectedDate}
          projects={projects}
          onTasksScheduled={(tasks) => {
            setLastAISequence(new Date());
            console.log('AI scheduled tasks:', tasks);
          }}
        />

        <FooterMetrics
          projects={projects}
          selectedDate={selectedDate}
          lastAISequence={lastAISequence}
        />

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