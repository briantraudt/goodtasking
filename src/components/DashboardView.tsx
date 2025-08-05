import React, { useState, useEffect } from 'react';
import { Calendar, Sun, Sparkles, RefreshCw } from 'lucide-react';
import QuickTaskDialog from '@/components/QuickTaskDialog';
import TaskEditDialog from '@/components/TaskEditDialog';
import { Button } from '@/components/ui/button';
import TodayView from './TodayView';
import WeeklySchedule from './WeeklySchedule';
import WeeklyAIReview from './WeeklyAIReview';
import DayViewCalendar from './DayViewCalendar';
import TaskSidebar from './TaskSidebar';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { format } from 'date-fns';
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay } from '@dnd-kit/core';

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
  vibe_projects?: { name: string };
}

interface Project {
  id: string;
  name: string;
  description?: string;
  category: 'work' | 'home' | 'personal';
  tasks: Task[];
}

interface DashboardViewProps {
  projects: Project[];
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onUpdateProject?: (id: string, updates: Partial<Project>) => void;
  onCreateTask: (projectId: string, title: string, description?: string, dueDate?: Date) => Promise<any>;
  onCreateProject: (data: { name: string; description: string; category: 'work' | 'home' | 'personal' }) => void;
  onDeleteTask?: (taskId: string) => Promise<void>;
  onRefreshTasks?: () => void;
  userName?: string;
}

type ViewMode = 'planner' | 'today' | 'week';

const DashboardView = ({ 
  projects, 
  onUpdateTask, 
  onUpdateProject,
  onCreateTask, 
  onCreateProject,
  onDeleteTask,
  onRefreshTasks,
  userName = "there"
}: DashboardViewProps) => {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('planner');
  const [showQuickTaskDialog, setShowQuickTaskDialog] = useState(false);
  const [quickTaskTime, setQuickTaskTime] = useState<{ hour: number; minute: number } | null>(null);
  const [showEditTaskDialog, setShowEditTaskDialog] = useState(false);
  const [selectedTaskForEdit, setSelectedTaskForEdit] = useState<Task | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    // ALWAYS start with today's date using local timezone
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;
    console.log('🔥 INITIAL DashboardView date set to TODAY:', today);
    return today;
  });

  // Force today's date whenever the component mounts or user changes
  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;
    
    console.log('🔥 FORCING selectedDate to TODAY on mount:', today);
    setSelectedDate(today);
  }, []); // Run once on mount
  
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

  // Get all tasks for the calendar with project information
  const allTasks = projects.flatMap(project => 
    project.tasks.map(task => ({
      ...task,
      vibe_projects: { name: project.name }
    }))
  );

  const handleTaskScheduled = async (taskId: string, startTime: string, endTime: string) => {
    console.log('📅 Scheduling task:', { taskId, startTime, endTime, selectedDate });
    
    // Update task with schedule
    await onUpdateTask(taskId, {
      scheduled_date: selectedDate,
      start_time: startTime,
      end_time: endTime
    });

    console.log('✅ Task updated in database, refreshing UI...');
    
    // Refresh the tasks to update the UI immediately
    if (onRefreshTasks) {
      await onRefreshTasks();
    }

    // Create Google Calendar event if connected
    const task = allTasks.find(t => t.id === taskId);
    if (task && isConnected) {
      await createEventFromTask(taskId, task.title, startTime, endTime, selectedDate);
    }
    
    console.log('🎉 Task scheduling complete!');
  };

  const handleTaskUnscheduled = (taskId: string) => {
    onUpdateTask(taskId, {
      scheduled_date: null,
      start_time: null,
      end_time: null
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeId = active.id.toString();
    const taskId = activeId.replace('task-', '').replace('scheduled-', '');
    const task = allTasks.find(t => t.id === taskId);
    setActiveTask(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const activeId = active.id.toString();
    const overId = over.id.toString();

    // Handle dropping tasks onto time slots
    if (overId.includes(':')) {
      const taskId = activeId.replace('task-', '').replace('scheduled-', '');
      const timeSlot = overId;
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
    // Handle dropping scheduled tasks back to the sidebar
    else if (overId === 'task-sidebar') {
      const taskId = activeId.replace('scheduled-', '');
      handleTaskUnscheduled(taskId);
    }
    setActiveTask(null);
  };

  const handleQuickTaskCreate = (hour: number, minute: number) => {
    setQuickTaskTime({ hour, minute });
    setShowQuickTaskDialog(true);
  };

  const createQuickTask = async (projectId: string, title: string, description?: string, dueDate?: Date, startTime?: string, endTime?: string, scheduledDate?: string) => {
    if (!quickTaskTime || !startTime || !endTime || !scheduledDate) return;
    
    console.log('🎯 Creating scheduled task directly:', { projectId, title, startTime, endTime, scheduledDate });
    
    try {
      // Create the task and get the returned task data
      const newTask = await onCreateTask(projectId, title, description, dueDate);
      
      console.log('✅ Task created successfully:', newTask);
      console.log('🔍 Checking task conditions:', {
        hasNewTask: !!newTask,
        hasId: newTask?.id,
        taskId: newTask?.id
      });
      
      // If we got the task back, schedule it immediately
      if (newTask && newTask.id) {
        console.log('🎉 Scheduling task immediately:', newTask.id);
        await handleTaskScheduled(newTask.id, startTime, endTime);
        console.log('✅ Task scheduled successfully');
      } else {
        console.error('❌ No task returned from creation or missing ID:', { newTask, hasId: !!newTask?.id });
      }
      
      setShowQuickTaskDialog(false);
      setQuickTaskTime(null);
    } catch (error) {
      console.error('❌ Error creating quick task:', error);
      setShowQuickTaskDialog(false);
      setQuickTaskTime(null);
    }
  };

  // Handle task editing
  const handleTaskEdit = (task: Task) => {
    setSelectedTaskForEdit(task);
    setShowEditTaskDialog(true);
  };

  const handleTaskSave = async (taskId: string, updates: Partial<Task>) => {
    await onUpdateTask(taskId, updates);
    if (onRefreshTasks) {
      await onRefreshTasks();
    }
    setShowEditTaskDialog(false);
    setSelectedTaskForEdit(null);
  };

  const handleTaskDelete = async (taskId: string) => {
    if (onDeleteTask) {
      await onDeleteTask(taskId);
    }
    if (onRefreshTasks) {
      await onRefreshTasks();
    }
    setShowEditTaskDialog(false);
    setSelectedTaskForEdit(null);
  };

  // Sync calendar when date changes
  useEffect(() => {
    if (isConnected && viewMode === 'planner') {
      syncCalendar(selectedDate);
    }
  }, [selectedDate, isConnected, viewMode, syncCalendar]);

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="h-full flex flex-col overflow-hidden">
        {/* Navigation - Start in planner view by default */}

        {/* Weekly AI Review - only show in week view */}
        {viewMode === 'week' && <WeeklyAIReview />}
        
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
                      onTaskEdit={handleTaskEdit}
                      onEventClick={(event) => {
                        console.log('Event clicked:', event);
                        // TODO: Implement event edit/delete modal
                      }}
                      isGoogleConnected={isConnected}
                      onConnectGoogle={connectGoogleCalendar}
                      onViewModeChange={(mode) => setViewMode(mode)}
                      onQuickTaskCreate={handleQuickTaskCreate}
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
                      onUpdateProject={(id: string, updates: { category?: 'work' | 'home' | 'personal' }) => onUpdateProject?.(id, updates)}
                      onUpdateTask={async (taskId: string, updates: Partial<Task>) => {
                        onUpdateTask(taskId, updates);
                      }}
                      onDeleteTask={onDeleteTask}
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
      
      {/* Drag Overlay */}
      <DragOverlay>
        {activeTask ? (
          <div className="w-64 h-10 rounded-lg border border-[#4DA8DA] bg-[#4DA8DA] shadow-lg text-white">
            <div className="p-2 h-full flex flex-col justify-center">
              <div className="text-sm truncate">
                <span className="font-bold">{activeTask.title}</span>
                {activeTask.vibe_projects?.name && (
                  <span className="font-normal"> - {activeTask.vibe_projects.name}</span>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </DragOverlay>
      
      {/* Quick Task Creation Dialog */}
      <QuickTaskDialog
        isOpen={showQuickTaskDialog}
        onClose={() => {
          setShowQuickTaskDialog(false);
          setQuickTaskTime(null);
        }}
        selectedDate={selectedDate}
        startTime={quickTaskTime ? `${quickTaskTime.hour.toString().padStart(2, '0')}:${quickTaskTime.minute.toString().padStart(2, '0')}` : ''}
        projects={projects}
        onCreateTask={createQuickTask}
      />
      
      {/* Task Edit Dialog */}
      <TaskEditDialog
        task={selectedTaskForEdit}
        isOpen={showEditTaskDialog}
        onClose={() => {
          setShowEditTaskDialog(false);
          setSelectedTaskForEdit(null);
        }}
        onSave={handleTaskSave}
        onDelete={handleTaskDelete}
      />
    </DndContext>
  );
};

export default DashboardView;