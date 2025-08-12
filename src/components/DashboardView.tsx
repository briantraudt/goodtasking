import React, { useState, useEffect } from 'react';
import { Calendar, Sun, Sparkles, RefreshCw } from 'lucide-react';
import QuickTaskDialog from '@/components/QuickTaskDialog';
import TaskEditDialog from '@/components/TaskEditDialog';
import { EventEditDialog } from '@/components/EventEditDialog';
import { Button } from '@/components/ui/button';
import TodayView from './TodayView';
import WeeklySchedule from './WeeklySchedule';
import WeeklyAIReview from './WeeklyAIReview';
import DayViewCalendar from './DayViewCalendar';
import TaskSidebar from './TaskSidebar';
import ProjectsColumn from './ProjectsColumn';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { useToast } from '@/hooks/use-toast';
import { useTaskReminders } from '@/hooks/useTaskReminders';
import { useNotifications } from '@/hooks/useNotifications';
import { format } from 'date-fns';
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, useSensor, useSensors, PointerSensor, TouchSensor } from '@dnd-kit/core';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useIsTabletOrBelow } from '@/hooks/use-breakpoints';

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
  category: string;
  color?: string;
  tasks: Task[];
}

interface DashboardViewProps {
  projects: Project[];
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onUpdateProject?: (id: string, updates: Partial<Project>) => void;
  onDeleteProject?: (id: string) => void;
  onCreateTask: (projectId: string, title: string, description?: string, dueDate?: Date) => Promise<any>;
  onCreateProject: (data: { name: string; description?: string; category: string; color?: string }) => Promise<void>;
  onDeleteTask?: (taskId: string) => Promise<void>;
  onRefreshTasks?: () => void;
  userName?: string;
}

type ViewMode = 'planner' | 'today' | 'week';

const DashboardView = ({ 
  projects, 
  onUpdateTask, 
  onUpdateProject,
  onDeleteProject,
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
  const [showEventEditDialog, setShowEventEditDialog] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
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
  const [mobilePane, setMobilePane] = useState<'planner' | 'tasks' | 'projects'>('planner');

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

  // Broadcast selected date to header
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('dashboard-date-update', { detail: { selectedDate } }));
  }, [selectedDate]);
  
const { session } = useAuth();
const [calendarEvents, setCalendarEvents] = useState([]);

// Mobile and tablet detection
const isMobile = useIsMobile();
const isTabletOrBelow = useIsTabletOrBelow();
const sensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  useSensor(TouchSensor,   { activationConstraint: { delay: 150, tolerance: 5 } })
);

// Date navigation via header events
const changeDateByDays = (days: number) => {
  const [y, m, d] = selectedDate.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  const newDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  setSelectedDate(newDate);
};

useEffect(() => {
  const prev = () => changeDateByDays(-1);
  const next = () => changeDateByDays(1);
  const week = () => setViewMode('week');
  window.addEventListener('dashboard-date-prev', prev);
  window.addEventListener('dashboard-date-next', next);
  window.addEventListener('dashboard-view-week', week);
  return () => {
    window.removeEventListener('dashboard-date-prev', prev);
    window.removeEventListener('dashboard-date-next', next);
    window.removeEventListener('dashboard-view-week', week);
  };
}, [selectedDate]);

// Mobile pane switch events (from footer buttons)
useEffect(() => {
  const showTasks = () => {
    setViewMode('planner');
    setMobilePane('tasks');
  };
  const showProjects = () => {
    setViewMode('planner');
    setMobilePane('projects');
  };
  const showHome = () => {
    setViewMode('planner');
    setMobilePane('planner');
  };
  window.addEventListener('dashboard-show-tasks', showTasks);
  window.addEventListener('dashboard-show-projects', showProjects);
  window.addEventListener('dashboard-show-home', showHome);
  return () => {
    window.removeEventListener('dashboard-show-tasks', showTasks);
    window.removeEventListener('dashboard-show-projects', showProjects);
    window.removeEventListener('dashboard-show-home', showHome);
  };
}, []);

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

  // Fetch calendar events from database
  const fetchCalendarEvents = async () => {
    if (!session?.user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', session.user.id);
      
      if (error) throw error;
      
      // Transform to match the expected format
      const transformedEvents = data?.map(event => ({
        id: event.id,
        title: event.title,
        start: event.start_time,
        end: event.end_time,
        type: 'calendar_event',
        description: event.description,
        isAllDay: event.is_all_day,
        source: event.source || 'local'
      })) || [];
      
      setCalendarEvents(transformedEvents);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
    }
  };

  // Load calendar events when component mounts or user changes
  useEffect(() => {
    fetchCalendarEvents();
  }, [session?.user?.id]);

  // Set up real-time subscription for calendar events
  useEffect(() => {
    if (!session?.user?.id) return;

    const channel = supabase
      .channel('calendar-events-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calendar_events',
          filter: `user_id=eq.${session.user.id}`
        },
        (payload) => {
          console.log('📡 Real-time calendar event update:', payload);
          fetchCalendarEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id, fetchCalendarEvents]);

  // Get all tasks for the calendar with project information
  const allTasks = projects.flatMap(project => 
    project.tasks.map(task => ({
      ...task,
      vibe_projects: { name: project.name }
    }))
  );

  const { toast } = useToast();
  const { notifyTaskCompleted, notifyProjectUpdate } = useNotifications();
  
  // Determine if the selected day is sparse to allocate more space to tasks on mobile
  const combinedCalendarForSelectedDate = [...events, ...calendarEvents].filter(ev => {
    if (!ev?.start) return false;
    try {
      return format(new Date(ev.start), 'yyyy-MM-dd') === selectedDate;
    } catch {
      return false;
    }
  });
  const scheduledTasksCountForDate = allTasks.filter(t => t.scheduled_date === selectedDate && t.start_time && t.end_time).length;
  const isSparseDay = (combinedCalendarForSelectedDate.length + scheduledTasksCountForDate) <= 2;
  
  // Set up task reminders
  useTaskReminders({ tasks: allTasks });

  const handleTaskScheduled = async (taskId: string, startTime: string, endTime: string) => {
    console.log('📅 Scheduling task:', { taskId, startTime, endTime, selectedDate });
    
    // Update task with schedule
    await onUpdateTask(taskId, {
      scheduled_date: selectedDate,
      start_time: startTime,
      end_time: endTime
    });

    console.log('✅ Task updated in database, refreshing UI...');
    
    // Force a complete refresh to ensure UI synchronization
    if (onRefreshTasks) {
      await onRefreshTasks();
      console.log('🔄 Projects data refreshed');
    }
    
    // Add a small delay to ensure the state propagates properly
    setTimeout(() => {
      console.log('🎉 Task scheduling complete!');
    }, 100);
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
    
    // Prevent horizontal scrolling during drag
    document.body.style.overflowX = 'hidden';
    document.documentElement.style.overflowX = 'hidden';
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const activeId = active.id.toString();
    const overId = over.id.toString();

    console.log('🎯 Drag end event:', { activeId, overId, activeData: active.data.current });

    // Handle calendar event dragging
    if (active.data.current?.type === 'calendar_event') {
      const eventId = active.data.current.eventId;
      
      if (overId.includes(':')) {
        const timeSlot = overId;
        const [hourStr, minuteStr] = timeSlot.split(':');
        const hour = parseInt(hourStr);
        const minute = parseInt(minuteStr);
        
        // Calculate duration from original event
        const originalStartTime = active.data.current.startTime;
        const originalEndTime = active.data.current.endTime;
        
        // Parse original times to calculate duration
        const [startHour, startMin] = originalStartTime.split(':').map(Number);
        const [endHour, endMin] = originalEndTime.split(':').map(Number);
        const duration = (endHour * 60 + endMin) - (startHour * 60 + startMin);
        
        // Calculate new times
        const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
        const newEndHour = Math.floor((hour * 60 + minute + duration) / 60);
        const newEndMinute = (minute + duration) % 60;
        const endTime = `${newEndHour.toString().padStart(2, '0')}:${newEndMinute.toString().padStart(2, '0')}:00`;
        
        console.log('📅 Moving calendar event:', { eventId, startTime, endTime, selectedDate });
        await handleEventTimeChange(eventId, selectedDate, startTime, endTime);
      }
    }
    // Handle task dragging (existing functionality)
    else if (overId.includes(':')) {
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
    
    // Restore normal scrolling behavior after drag
    document.body.style.overflowX = '';
    document.documentElement.style.overflowX = '';
  };

  const handleQuickTaskCreate = (hour: number, minute: number) => {
    setQuickTaskTime({ hour, minute });
    setShowQuickTaskDialog(true);
  };

  const createQuickTask = async (projectId: string, title: string, description?: string, dueDate?: Date, startTime?: string, endTime?: string, scheduledDate?: string) => {
    if (!quickTaskTime || !startTime || !endTime || !scheduledDate) return;
    
    console.log('🎯 Creating calendar event directly:', { title, startTime, endTime, scheduledDate });
    
    try {
      // Convert local time to proper UTC timestamp
      const startDateTime = new Date(`${scheduledDate}T${startTime}`);
      const endDateTime = new Date(`${scheduledDate}T${endTime}`);
      
      // Create optimistic UI update - add event immediately to state
      const optimisticEvent = {
        id: `temp-${Date.now()}`, // Temporary ID
        title: title,
        start: startDateTime.toISOString(), // Use 'start' instead of 'start_time'
        end: endDateTime.toISOString(),     // Use 'end' instead of 'end_time'
        type: 'calendar_event' as const,
        description: description || null,
        isAllDay: false,
        source: 'local' as const
      };
      
      // Add to UI immediately for instant feedback
      setCalendarEvents(prev => [...prev, optimisticEvent]);
      console.log('⚡ Added optimistic event to UI:', optimisticEvent);
      
      // Create local calendar event directly in the database
      const { data: eventData, error: eventError } = await supabase
        .from('calendar_events')
        .insert({
          user_id: session?.user?.id,
          title: title,
          description: description || null,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          source: 'local',
          is_all_day: false
        })
        .select()
        .single();

      if (eventError) {
        console.error('❌ Error creating calendar event:', eventError);
        // Remove optimistic update on error
        setCalendarEvents(prev => prev.filter(event => event.id !== optimisticEvent.id));
        throw eventError;
      }

      console.log('✅ Calendar event created successfully:', eventData);
      
      // Replace optimistic event with real database event
      setCalendarEvents(prev => 
        prev.map(event => event.id === optimisticEvent.id ? {
          id: eventData.id,
          title: eventData.title,
          start: eventData.start_time,
          end: eventData.end_time,
          type: 'calendar_event' as const,
          description: eventData.description,
          isAllDay: eventData.is_all_day,
          source: eventData.source || 'local'
        } : event)
      );

      toast({
        title: "Event Created! 📅",
        description: `"${title}" has been added to your calendar.`,
      });

      setShowQuickTaskDialog(false);
      setQuickTaskTime(null);
      
    } catch (error) {
      console.error('❌ Error creating calendar event:', error);
      toast({
        title: "Creation Failed",
        description: "Failed to create event. Please try again.",
        variant: "destructive",
      });
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

  // Handle task completion
  const handleTaskComplete = (taskId: string, completed: boolean) => {
    console.log('🎯 DashboardView handleTaskComplete called:', { taskId, completed });
    
    // Find the task for notification
    const task = allTasks.find(t => t.id === taskId);
    const project = projects.find(p => p.id === task?.project_id);
    
    // Send notification if task is being completed
    if (completed && task && project) {
      notifyTaskCompleted(task.title, project.name);
    }
    
    onUpdateTask(taskId, { completed });
    console.log('✅ DashboardView onUpdateTask called');
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

  // Handle task resize
  const handleTaskResize = async (taskId: string, startTime: string, endTime: string) => {
    console.log('🎯 DashboardView handleTaskResize called:', { taskId, startTime, endTime });
    try {
      await onUpdateTask(taskId, { 
        start_time: startTime, 
        end_time: endTime 
      });
      console.log('✅ Task resize completed successfully');
    } catch (error) {
      console.error('❌ Error resizing task:', error);
    }
  };

  // Handle calendar event time changes
  const handleEventTimeChange = async (eventId: string, date: string, startTime: string, endTime: string) => {
    try {
      // Convert local time to UTC for database storage
      const startDateTime = new Date(`${date}T${startTime}`);
      const endDateTime = new Date(`${date}T${endTime}`);
      
      console.log('🔄 Updating calendar event time:', {
        eventId,
        localStart: `${date}T${startTime}`,
        localEnd: `${date}T${endTime}`,
        utcStart: startDateTime.toISOString(),
        utcEnd: endDateTime.toISOString()
      });

      // Optimistic update - immediately update UI
      setCalendarEvents(prev => 
        prev.map(event => 
          event.id === eventId 
            ? { 
                ...event, 
                start: startDateTime.toISOString(),
                end: endDateTime.toISOString()
              }
            : event
        )
      );

      // Update the database
      const { error } = await supabase
        .from('calendar_events')
        .update({
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
        })
        .eq('id', eventId);

      if (error) {
        console.error('❌ Error updating calendar event time:', error);
        // Revert optimistic update
        await fetchCalendarEvents();
        throw error;
      }

      console.log('✅ Calendar event time updated successfully');
      
      toast({
        title: "Event Updated",
        description: "Event time has been successfully updated.",
      });

    } catch (error) {
      console.error('❌ Error updating event time:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update event time. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Sync calendar when date changes
  useEffect(() => {
    if (isConnected && viewMode === 'planner') {
      syncCalendar(selectedDate);
    }
  }, [selectedDate, isConnected, viewMode, syncCalendar]);

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="h-full flex flex-col overflow-hidden">
        {/* Weekly AI Review - only show in week view */}
        {viewMode === 'week' && <WeeklyAIReview />}
        
        {/* Scrollable Content Section */}
        <div className="flex-1 overflow-hidden">
          {viewMode === 'planner' ? (
            <div className="h-full p-0 md:p-6">
              {isMobile ? (
                mobilePane === 'planner' ? (
                  <div className="h-full flex flex-col gap-1">
                    {/* Top: Calendar (1/2 height) */}
                    <section className={`${isSparseDay ? 'flex-[0.9]' : 'flex-1'} min-h-0`}>
                      <div className="h-full bg-card rounded-none md:rounded-xl shadow-sm border-x-0 md:border px-0 md:p-6 py-1">
                        <div className="h-full overflow-auto">
                          <DayViewCalendar
                            selectedDate={selectedDate}
                            onDateChange={setSelectedDate}
                            tasks={allTasks}
                            projects={projects}
                            calendarEvents={[...events, ...calendarEvents]}
                            onTaskScheduled={handleTaskScheduled}
                            onTaskUnscheduled={handleTaskUnscheduled}
                            onTaskEdit={handleTaskEdit}
                            onEventClick={(event) => {
                              console.log('Event clicked:', event);
                            }}
                            isGoogleConnected={isConnected}
                            onConnectGoogle={connectGoogleCalendar}
                            onDisconnectGoogle={disconnectGoogleCalendar}
                            onViewModeChange={(mode) => setViewMode(mode)}
                            onQuickEventCreate={handleQuickTaskCreate}
                            onTaskComplete={handleTaskComplete}
                            onTaskResize={handleTaskResize}
                            onEventEdit={(eventId) => {
                              setSelectedEventId(eventId);
                              setShowEventEditDialog(true);
                            }}
                            onEventDelete={async (eventId) => {
                              await syncCalendar(selectedDate);
                            }}
                          />
                        </div>
                      </div>
                    </section>

                    {/* Bottom: Tasks (1/2 height) */}
                    <section className={`${isSparseDay ? 'flex-[1.1]' : 'flex-1'} min-h-0`}>
                      <div className="h-full bg-card rounded-none md:rounded-xl shadow-sm border-x-0 md:border px-0 md:p-6 pt-1 pb-1">
                        <div className="h-full overflow-auto">
                          <TaskSidebar
                            projects={projects}
                            selectedDate={selectedDate}
                            onCreateTask={onCreateTask}
                            onCreateProject={onCreateProject}
                            onUpdateProject={async (id: string, updates: any) => {
                              if (onUpdateProject) {
                                await onUpdateProject(id, updates);
                              }
                            }}
                            onDeleteProject={async (id: string) => {
                              if (onDeleteProject) {
                                await onDeleteProject(id);
                              }
                            }}
                            onUpdateTask={async (taskId: string, updates: Partial<Task>) => {
                              onUpdateTask(taskId, updates);
                            }}
                            onDeleteTask={onDeleteTask}
                            onRefreshTasks={onRefreshTasks}
                            onEventCreated={fetchCalendarEvents}
                            onMoveProjectBack={(projectId) => {
                              const project = projects.find(p => p.id === projectId);
                              if (project) {
                                const placeholderTask = project.tasks.find(t => t.title === "Add First Task...");
                                if (placeholderTask && onDeleteTask) {
                                  onDeleteTask(placeholderTask.id);
                                }
                              }
                            }}
                          />
                        </div>
                      </div>
                    </section>
                  </div>
                ) : (
                  <div className="h-full flex flex-col">
                    <section className="flex-1 min-h-0">
                      <div className="h-full bg-card rounded-none md:rounded-xl shadow-sm border-x-0 md:border px-0 md:p-6 py-0">
                        <div className="h-full overflow-auto">
                          {mobilePane === 'tasks' ? (
                            <TaskSidebar
                              projects={projects}
                              selectedDate={selectedDate}
                              onCreateTask={onCreateTask}
                              onCreateProject={onCreateProject}
                              onUpdateProject={async (id: string, updates: any) => {
                                if (onUpdateProject) {
                                  await onUpdateProject(id, updates);
                                }
                              }}
                              onDeleteProject={async (id: string) => {
                                if (onDeleteProject) {
                                  await onDeleteProject(id);
                                }
                              }}
                              onUpdateTask={async (taskId: string, updates: Partial<Task>) => {
                                onUpdateTask(taskId, updates);
                              }}
                              onDeleteTask={onDeleteTask}
                              onRefreshTasks={onRefreshTasks}
                              onEventCreated={fetchCalendarEvents}
                              onMoveProjectBack={(projectId) => {
                                const project = projects.find(p => p.id === projectId);
                                if (project) {
                                  const placeholderTask = project.tasks.find(t => t.title === "Add First Task...");
                                  if (placeholderTask && onDeleteTask) {
                                    onDeleteTask(placeholderTask.id);
                                  }
                                }
                              }}
                              showAddButton
                            />
                          ) : (
                            <ProjectsColumn
                              projects={projects}
                              onCreateProject={onCreateProject}
                              onUpdateProject={async (id: string, updates: any) => {
                                if (onUpdateProject) {
                                  await onUpdateProject(id, updates);
                                }
                              }}
                              onDeleteProject={async (id: string) => {
                                if (onDeleteProject) {
                                  await onDeleteProject(id);
                                }
                              }}
                              onCreateTask={async (projectId: string, title: string, description?: string) => {
                                if (onCreateTask) {
                                  await onCreateTask(projectId, title, description);
                                }
                              }}
                              onMoveProjectToTasks={(projectId) => {
                                onCreateTask(projectId, "Add First Task...", "Add your first task to this project");
                              }}
                              onEventCreated={fetchCalendarEvents}
                              forceShowAddButton
                            />
                          )}
                        </div>
                      </div>
                    </section>
                  </div>
                )
              ) : (
                mobilePane === 'projects' ? (
                  <div className="h-full">
                    <div className="h-full bg-card rounded-xl shadow-sm border p-6">
                      <ProjectsColumn
                        projects={projects}
                        onCreateProject={onCreateProject}
                        onUpdateProject={async (id: string, updates: any) => {
                          if (onUpdateProject) {
                            await onUpdateProject(id, updates);
                          }
                        }}
                        onDeleteProject={async (id: string) => {
                          if (onDeleteProject) {
                            await onDeleteProject(id);
                          }
                        }}
                        onCreateTask={async (projectId: string, title: string, description?: string) => {
                          if (onCreateTask) {
                            await onCreateTask(projectId, title, description);
                          }
                        }}
                        onMoveProjectToTasks={(projectId) => {
                          onCreateTask(projectId, "Add First Task...", "Add your first task to this project");
                        }}
                        onEventCreated={fetchCalendarEvents}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="h-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Projects - only on desktop (first column) */}
                    <div className="hidden lg:block min-h-0 lg:min-h-[600px]">
                      <div className="h-full bg-card rounded-xl shadow-sm border p-6 overflow-hidden">
                        <ProjectsColumn
                          projects={projects}
                          onCreateProject={onCreateProject}
                          onUpdateProject={async (id: string, updates: any) => {
                            if (onUpdateProject) {
                              await onUpdateProject(id, updates);
                            }
                          }}
                          onDeleteProject={async (id: string) => {
                            if (onDeleteProject) {
                              await onDeleteProject(id);
                            }
                          }}
                          onCreateTask={async (projectId: string, title: string, description?: string) => {
                            if (onCreateTask) {
                              await onCreateTask(projectId, title, description);
                            }
                          }}
                          onMoveProjectToTasks={(projectId) => {
                            onCreateTask(projectId, "Add First Task...", "Add your first task to this project");
                          }}
                          onEventCreated={fetchCalendarEvents}
                        />
                      </div>
                    </div>

                    {/* Calendar - full width on mobile, left column on tablet/desktop */}
                    <div className="min-h-0 md:min-h-[600px] overflow-hidden">
                      <div className="h-full bg-card rounded-xl shadow-sm border p-6 overflow-hidden">
                        <DayViewCalendar
                          selectedDate={selectedDate}
                          onDateChange={setSelectedDate}
                          tasks={allTasks}
                          projects={projects}
                          calendarEvents={[...events, ...calendarEvents]}
                          onTaskScheduled={handleTaskScheduled}
                          onTaskUnscheduled={handleTaskUnscheduled}
                          onTaskEdit={handleTaskEdit}
                          onEventClick={(event) => {
                            console.log('Event clicked:', event);
                          }}
                          isGoogleConnected={isConnected}
                          onConnectGoogle={connectGoogleCalendar}
                          onDisconnectGoogle={disconnectGoogleCalendar}
                          onViewModeChange={(mode) => setViewMode(mode)}
                          onQuickEventCreate={handleQuickTaskCreate}
                          onTaskComplete={handleTaskComplete}
                          onTaskResize={handleTaskResize}
                          onEventEdit={(eventId) => {
                            setSelectedEventId(eventId);
                            setShowEventEditDialog(true);
                          }}
                          onEventDelete={async (eventId) => {
                            // Delete handled in DayViewCalendar already
                            await syncCalendar(selectedDate);
                          }}
                        />
                      </div>
                    </div>
                    
                    {/* Task Sidebar - right column on tablet/desktop */}
                    <div className="min-h-0 md:min-h-[600px]">
                      <div className="h-full bg-card rounded-xl shadow-sm border p-6">
                        <TaskSidebar
                          projects={projects}
                          selectedDate={selectedDate}
                          onCreateTask={onCreateTask}
                          onCreateProject={onCreateProject}
                          onUpdateProject={async (id: string, updates: any) => {
                            if (onUpdateProject) {
                              await onUpdateProject(id, updates);
                            }
                          }}
                          onDeleteProject={async (id: string) => {
                            if (onDeleteProject) {
                              await onDeleteProject(id);
                            }
                          }}
                          onUpdateTask={async (taskId: string, updates: Partial<Task>) => {
                            onUpdateTask(taskId, updates);
                          }}
                          onDeleteTask={onDeleteTask}
                          onRefreshTasks={onRefreshTasks}
                          onEventCreated={fetchCalendarEvents}
                          onMoveProjectBack={(projectId) => {
                            // Remove the placeholder task when moving back to projects
                            const project = projects.find(p => p.id === projectId);
                            if (project) {
                              const placeholderTask = project.tasks.find(t => t.title === "Add First Task...");
                              if (placeholderTask && onDeleteTask) {
                                onDeleteTask(placeholderTask.id);
                              }
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )

              )}
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
              onUpdateProject={onUpdateProject}
              onDeleteProject={onDeleteProject}
              onRefreshTasks={onRefreshTasks}
              userName={userName}
            />
          )}
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeTask ? (() => {
          // Get the project for this task to use its color
          const project = projects.find(p => p.id === activeTask.project_id);
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
          
          return (
            <div 
              className="w-64 h-10 rounded-lg border shadow-lg text-white"
              style={{
                backgroundColor: projectColor,
                borderColor: projectColor
              }}
            >
              <div className="p-2 h-full flex flex-col justify-center">
                <div className="text-sm truncate">
                  <span className="font-bold">{activeTask.title}</span>
                  {activeTask.vibe_projects?.name && (
                    <span className="font-normal"> - {activeTask.vibe_projects.name}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })() : null}
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
      
      {/* Event Edit Dialog */}
      <EventEditDialog
        isOpen={showEventEditDialog}
        onClose={() => {
          setShowEventEditDialog(false);
          setSelectedEventId(null);
        }}
        eventId={selectedEventId}
        onEventUpdated={async () => {
          await fetchCalendarEvents();
          await syncCalendar(selectedDate);
        }}
        onOptimisticUpdate={(eventId, updates) => {
          // Immediately update the event in the UI
          setCalendarEvents(prev => 
            prev.map(event => 
              event.id === eventId 
                ? { ...event, ...updates }
                : event
            )
          );
        }}
      />
    </DndContext>
  );
};

export default DashboardView;