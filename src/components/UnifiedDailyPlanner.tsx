import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { useAIScheduler } from '@/hooks/useAIScheduler';
import { useAIPlanner } from '@/hooks/useAIPlanner';
import TaskSidebar from '@/components/TaskSidebar';
import CalendarTimeline from '@/components/CalendarTimeline';
import { Calendar, Clock, Sparkles, Loader2, Undo2 } from 'lucide-react';
import { format, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { 
  DndContext, 
  DragEndEvent, 
  useDroppable, 
  DragOverlay,
  pointerWithin 
} from '@dnd-kit/core';
import { restrictToFirstScrollableAncestor } from '@dnd-kit/modifiers';
import moment from 'moment';

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
  className?: string;
}

interface UndoAction {
  taskId: string;
  taskTitle: string;
  previousState: {
    scheduled_date: string | null;
    start_time?: string;
    end_time?: string;
  };
}

const UnifiedDailyPlanner = ({ projects, onUpdateTask, onCreateTask, className }: UnifiedDailyPlannerProps) => {
  const { events, isConnected, loading: calendarLoading } = useGoogleCalendar();
  const { scheduleTasksWithAI, updateTaskSchedule, loading: aiLoading } = useAIScheduler();
  const { planMyDay, loading: planningLoading } = useAIPlanner();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [undoAction, setUndoAction] = useState<UndoAction | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const scheduledTasks = useMemo(() => 
    projects.flatMap(project => 
      project.tasks.filter(task => 
        !task.completed && 
        task.scheduled_date === selectedDate
      )
    ), [projects, selectedDate]
  );

  const handleTimelineItemMove = async (itemId: string, dragTime: number, newGroupOrder: number) => {
    const item = itemId.split('-');
    const type = item[0];
    const id = item[1];
    
    if (type !== 'task') return;
    
    const task = scheduledTasks.find(t => t.id === id);
    if (!task) return;
    
    const newStartTime = moment(dragTime);
    const duration = task.estimated_duration || 30;
    const newEndTime = moment(dragTime).add(duration, 'minutes');
    
    const startTimeStr = newStartTime.format('HH:mm');
    const endTimeStr = newEndTime.format('HH:mm');
    
    setUndoAction({
      taskId: task.id,
      taskTitle: task.title,
      previousState: {
        scheduled_date: task.scheduled_date,
        start_time: task.start_time,
        end_time: task.end_time
      }
    });
    
    const success = await updateTaskSchedule(task.id, selectedDate, startTimeStr, endTimeStr);
    
    if (success) {
      onUpdateTask(task.id, { 
        scheduled_date: selectedDate,
        start_time: startTimeStr,
        end_time: endTimeStr
      });
      
      toast({
        title: "Task Rescheduled",
        description: `${task.title} moved to ${startTimeStr}`,
      });
      
      setTimeout(() => setUndoAction(null), 5000);
    }
  };
  
  const handleTimelineItemResize = async (itemId: string, time: number, edge: 'left' | 'right') => {
    const item = itemId.split('-');
    const type = item[0];
    const id = item[1];
    
    if (type !== 'task') return;
    
    const task = scheduledTasks.find(t => t.id === id);
    if (!task || !task.start_time || !task.end_time) return;
    
    const taskDate = moment(task.scheduled_date);
    const [startHour, startMin] = task.start_time.split(':').map(Number);
    const [endHour, endMin] = task.end_time.split(':').map(Number);
    
    const currentStart = taskDate.clone().hour(startHour).minute(startMin);
    const currentEnd = taskDate.clone().hour(endHour).minute(endMin);
    const resizeTime = moment(time);
    
    let newStartTime, newEndTime;
    
    if (edge === 'left') {
      newStartTime = resizeTime;
      newEndTime = currentEnd;
    } else {
      newStartTime = currentStart;
      newEndTime = resizeTime;
    }
    
    const startTimeStr = newStartTime.format('HH:mm');
    const endTimeStr = newEndTime.format('HH:mm');
    
    setUndoAction({
      taskId: task.id,
      taskTitle: task.title,
      previousState: {
        scheduled_date: task.scheduled_date,
        start_time: task.start_time,
        end_time: task.end_time
      }
    });
    
    const success = await updateTaskSchedule(task.id, selectedDate, startTimeStr, endTimeStr);
    
    if (success) {
      onUpdateTask(task.id, { 
        start_time: startTimeStr,
        end_time: endTimeStr
      });
      
      toast({
        title: "Task Duration Updated",
        description: `${task.title} duration changed`,
      });
      
      setTimeout(() => setUndoAction(null), 5000);
    }
  };
  
  const handleTimelineCanvasClick = (groupId: number, time: number, e: React.SyntheticEvent) => {
    console.log('Canvas clicked at:', moment(time).format('HH:mm'));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    
    if (!over || !active.data.current) return;

    const activeData = active.data.current;
    const task = activeData as Task;
    const dropZoneId = over.id as string;
    
    if (dropZoneId === 'task-sidebar') {
      if (!task.scheduled_date) return;
      
      setUndoAction({
        taskId: task.id,
        taskTitle: task.title,
        previousState: {
          scheduled_date: task.scheduled_date,
          start_time: task.start_time,
          end_time: task.end_time
        }
      });

      const success = await updateTaskSchedule(task.id, '', '', '');
      
      if (success) {
        onUpdateTask(task.id, { 
          scheduled_date: null,
          start_time: undefined,
          end_time: undefined
        });
        
        toast({
          title: "Task Unscheduled",
          description: `${task.title} moved back to task list`,
        });

        setTimeout(() => setUndoAction(null), 5000);
      }
    }
  };

  const handleUndo = async () => {
    if (!undoAction) return;

    const { taskId, previousState } = undoAction;
    
    const success = await updateTaskSchedule(
      taskId, 
      previousState.scheduled_date || '', 
      previousState.start_time || '', 
      previousState.end_time || ''
    );

    if (success) {
      onUpdateTask(taskId, { 
        scheduled_date: previousState.scheduled_date,
        start_time: previousState.start_time,
        end_time: previousState.end_time
      });
      
      toast({
        title: "Undo Successful",
        description: `${undoAction.taskTitle} changes reverted.`,
      });
      
      setUndoAction(null);
    }
  };

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
      onDragStart={(event) => setActiveId(event.active.id)}
      collisionDetection={pointerWithin}
      modifiers={[restrictToFirstScrollableAncestor]}
    >
      <div className={cn("flex gap-4 h-full relative", className)}>
        <Card className="flex-[7]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Daily Timeline
                <Badge variant="secondary">{format(new Date(selectedDate), 'MMM d')}</Badge>
                {isToday(new Date(selectedDate)) && (
                  <Badge variant="outline" className="text-xs">Today</Badge>
                )}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CalendarTimeline
              events={events}
              scheduledTasks={scheduledTasks}
              selectedDate={new Date(selectedDate)}
              onItemMove={handleTimelineItemMove}
              onItemResize={handleTimelineItemResize}
              onCanvasClick={handleTimelineCanvasClick}
              className="h-[600px]"
            />
          </CardContent>
        </Card>

        <TaskSidebar 
          projects={projects}
          selectedDate={selectedDate}
          onCreateTask={onCreateTask}
          className="flex-[3]"
        />

        {undoAction && (
          <div className="fixed bottom-6 right-6 z-50">
            <Button onClick={handleUndo} variant="secondary">
              <Undo2 className="h-4 w-4 mr-2" />
              Undo: {undoAction.taskTitle}
            </Button>
          </div>
        )}
      </div>

      <DragOverlay>
        {activeId ? (
          <div className="p-3 rounded-lg border bg-primary/10 border-primary/30 text-primary opacity-80">
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              <span className="text-sm font-medium">Dragging task...</span>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default UnifiedDailyPlanner;