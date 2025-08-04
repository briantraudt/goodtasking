import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  isAllDay: boolean;
}

interface Task {
  id: string;
  title: string;
  priority?: 'high' | 'medium' | 'low';
  duration?: number; // in minutes
  completed: boolean;
}

interface SchedulingSuggestion {
  taskId: string;
  proposedStartTime: string;
  proposedEndTime: string;
  rationale: string;
}

interface SchedulingResult {
  scheduledTasks: SchedulingSuggestion[];
  conflicts: Array<{
    taskId: string;
    issue: string;
  }>;
  summary: string;
}

export const useAIScheduler = () => {
  const { session } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const scheduleTasksWithAI = async (
    events: CalendarEvent[],
    tasks: Task[],
    targetDate?: string
  ): Promise<SchedulingResult | null> => {
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please log in to use AI scheduling.",
        variant: "destructive",
      });
      return null;
    }

    setLoading(true);

    try {
      // Filter out completed tasks
      const uncompletedTasks = tasks.filter(task => !task.completed);

      // Prepare tasks with default durations if not specified
      const tasksWithDefaults = uncompletedTasks.map(task => ({
        ...task,
        duration: task.duration || 30, // Default 30 minutes
        priority: task.priority || 'medium'
      }));

      // Format events for AI
      const formattedEvents = events.map(event => ({
        title: event.title,
        start: event.start,
        end: event.end,
        isAllDay: event.isAllDay
      }));

      const { data, error } = await supabase.functions.invoke('ai-task-scheduler', {
        body: {
          events: formattedEvents,
          tasks: tasksWithDefaults,
          targetDate: targetDate || new Date().toISOString().split('T')[0]
        },
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw error;
      }

      toast({
        title: "AI Scheduling Complete! 🤖",
        description: `Generated ${data.scheduledTasks?.length || 0} task suggestions.`,
      });

      return data;

    } catch (error) {
      console.error('Error with AI scheduling:', error);
      toast({
        title: "Scheduling Error",
        description: "Failed to generate AI schedule. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const suggestTaskForTimeGap = async (
    startTime: string,
    endTime: string,
    availableTasks: Task[]
  ): Promise<string | null> => {
    if (!session) return null;

    try {
      const duration = calculateDuration(startTime, endTime);
      
      const { data, error } = await supabase.functions.invoke('ai-task-scheduler', {
        body: {
          events: [],
          tasks: availableTasks,
          timeGap: { startTime, endTime, duration },
          action: 'suggest-for-gap'
        },
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      return data.suggestion;

    } catch (error) {
      console.error('Error suggesting task for time gap:', error);
      return null;
    }
  };

  const calculateDuration = (start: string, end: string): number => {
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    return endMinutes - startMinutes;
  };

  const updateTaskSchedule = async (
    taskId: string, 
    scheduledDate: string,
    startTime?: string,
    endTime?: string
  ): Promise<boolean> => {
    if (!session) return false;

    try {
      // If scheduledDate is empty string, set to null (unschedule)
      const updateData: any = {
        scheduled_date: scheduledDate || null,
      };

      // Add time fields if provided
      if (startTime) {
        updateData.start_time = startTime;
      }
      if (endTime) {
        updateData.end_time = endTime;
      }

      const { error } = await supabase
        .from('vibe_tasks')
        .update(updateData)
        .eq('id', taskId)
        .eq('user_id', session.user.id);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error updating task schedule:', error);
      return false;
    }
  };

  return {
    scheduleTasksWithAI,
    suggestTaskForTimeGap,
    updateTaskSchedule,
    loading
  };
};