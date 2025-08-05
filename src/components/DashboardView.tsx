import React, { useState, useEffect } from 'react';
import { Calendar, Sun, Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import TodayView from './TodayView';
import WeeklySchedule from './WeeklySchedule';
import WeeklyAIReview from './WeeklyAIReview';
import DayViewCalendar from './DayViewCalendar';
import TaskSidebar from './TaskSidebar';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { format } from 'date-fns';
import { DndContext, DragEndEvent } from '@dnd-kit/core';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  scheduled_date?: string;
  project_id: string;
  priority?: 'high' | 'medium' | 'low';
  estimated_duration?: number;
  due_date?: string | null;
  start_time?: string;
  end_time?: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  tasks: Task[];
}

interface DashboardViewProps {
  projects: Project[];
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onCreateTask: (projectId: string, title: string, description?: string, dueDate?: Date) => void;
  onCreateProject: (data: { name: string; description: string }) => void;
  onRefreshTasks?: () => void;
  userName?: string;
}

type ViewMode = 'planner' | 'today' | 'week';

const DashboardView = ({ 
  projects, 
  onUpdateTask, 
  onCreateTask, 
  onCreateProject,
  onRefreshTasks,
  userName = "there"
}: DashboardViewProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>('planner');
  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  
  const {
    events,
    isConnected,
    isLoading,
    connectGoogleCalendar,
    disconnectGoogleCalendar,
    syncCalendar,
    createEventFromTask,
    deleteEvent
  } = useGoogleCalendar();

  // Get all tasks for the calendar
  const allTasks = projects.flatMap(project => project.tasks);

  const handleTaskScheduled = async (taskId: string, startTime: string, endTime: string) => {
    // Update task with schedule
    onUpdateTask(taskId, {
      scheduled_date: selectedDate,
      start_time: startTime,
      end_time: endTime
    });

    // Create Google Calendar event if connected
    const task = allTasks.find(t => t.id === taskId);
    if (task && isConnected) {
      await createEventFromTask(taskId, task.title, startTime, endTime, selectedDate);
    }
  };

  const handleTaskUnscheduled = (taskId: string) => {
    onUpdateTask(taskId, {
      scheduled_date: null,
      start_time: null,
      end_time: null
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    // Handle dropping tasks onto time slots
    if (typeof over.id === 'string' && over.id.includes(':')) {
      const taskId = active.id.toString().replace('task-', '').replace('scheduled-', '');
      const timeSlot = over.id.toString();
      const [hourStr, minuteStr] = timeSlot.split(':');
      
      const hour = parseInt(hourStr);
      const minute = parseInt(minuteStr);
      
      // Default to 30-minute duration
      const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
      const endHour = minute + 30 >= 60 ? hour + 1 : hour;
      const endMinute = minute + 30 >= 60 ? minute + 30 - 60 : minute + 30;
      const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}:00`;
      
      handleTaskScheduled(taskId, startTime, endTime);
    }
  };

  // Sync calendar when date changes
  useEffect(() => {
    if (isConnected && viewMode === 'planner') {
      syncCalendar(selectedDate);
    }
  }, [selectedDate, isConnected, viewMode, syncCalendar]);

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="h-full flex flex-col overflow-hidden">
        {/* View Mode Tabs */}
        <div className="flex items-center gap-1 p-4 border-b bg-background">
          <Button
            variant={viewMode === 'planner' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('planner')}
            className="flex items-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            Calendar
          </Button>
          <Button
            variant={viewMode === 'today' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('today')}
            className="flex items-center gap-2"
          >
            <Sun className="h-4 w-4" />
            Today
          </Button>
          <Button
            variant={viewMode === 'week' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('week')}
            className="flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Week
          </Button>
        </div>

        {/* Weekly AI Review - only show in week view */}
        {viewMode === 'week' && <WeeklyAIReview />}
        
        {/* Google Calendar Connection Status */}
        {viewMode === 'planner' && (
          <div className="p-4 border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  isConnected ? "bg-green-500" : "bg-red-500"
                )} />
                <span className="text-sm font-medium">
                  Google Calendar: {isConnected ? 'Connected' : 'Not Connected'}
                </span>
                {!isConnected && (
                  <span className="text-xs text-muted-foreground">
                    Connect to sync tasks to Google Calendar
                  </span>
                )}
                {isConnected && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => syncCalendar(selectedDate)}
                    disabled={isLoading}
                    className="h-6 w-6 p-0 hover:bg-primary/10"
                  >
                    <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} />
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={isConnected ? disconnectGoogleCalendar : connectGoogleCalendar}
                  disabled={isLoading}
                  className="hover:bg-primary/10 hover:border-primary"
                >
                  {isLoading ? 'Loading...' : isConnected ? 'Disconnect' : 'Connect'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Content Section */}
        <div className="flex-1 overflow-hidden">
          {viewMode === 'planner' ? (
            <div className="h-full p-6">
              <div className="h-full flex flex-col lg:flex-row gap-6">
                {/* Calendar - 50% width */}
                <div className="flex-1 min-h-0 lg:min-h-[600px]">
                  <div className="h-full bg-card rounded-xl shadow-sm border p-6">
                    <DayViewCalendar
                      selectedDate={selectedDate}
                      onDateChange={setSelectedDate}
                      tasks={allTasks}
                      calendarEvents={events}
                      onTaskScheduled={handleTaskScheduled}
                      onTaskUnscheduled={handleTaskUnscheduled}
                      onEventClick={(event) => {
                        console.log('Event clicked:', event);
                        // TODO: Implement event edit/delete modal
                      }}
                      isGoogleConnected={isConnected}
                      onConnectGoogle={connectGoogleCalendar}
                    />
                  </div>
                </div>
                
                {/* Task Sidebar - 50% width */}
                <div className="flex-1 min-h-0 lg:min-h-[600px]">
                  <div className="h-full bg-card rounded-xl shadow-sm border p-6">
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
          ) : viewMode === 'today' ? (
            <TodayView
              projects={projects}
              onUpdateTask={onUpdateTask}
              onCreateTask={onCreateTask}
              onCreateProject={onCreateProject}
              onRefreshTasks={onRefreshTasks}
              userName={userName}
            />
          ) : (
            <WeeklySchedule
              projects={projects}
              onUpdateTask={onUpdateTask}
              onCreateTask={onCreateTask}
              onCreateProject={onCreateProject}
              onRefreshTasks={onRefreshTasks}
              userName={userName}
            />
          )}
        </div>
      </div>
    </DndContext>
  );
};

export default DashboardView;