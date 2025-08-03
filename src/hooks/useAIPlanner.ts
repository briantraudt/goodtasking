import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface DayPlanItem {
  taskId: string;
  title: string;
  startTime: string;
  endTime: string;
  rationale: string;
}

interface DayPlanResult {
  dayPlan: DayPlanItem[];
  deferredTasks: Array<{
    taskId: string;
    title: string;
    reason: string;
  }>;
  insights: {
    totalPlannedTime: number;
    availableTime: number;
    efficiency: 'high' | 'medium' | 'low';
    recommendations: string[];
  };
  summary: string;
}

interface WeekPlanResult {
  weekPlan: {
    monday: Array<{
      taskId: string;
      title: string;
      projectName: string;
      suggestedTime: string;
      rationale: string;
    }>;
    tuesday: Array<any>;
    wednesday: Array<any>;
    thursday: Array<any>;
    friday: Array<any>;
  };
  weeklyInsights: {
    totalTasks: number;
    totalEstimatedHours: number;
    heaviestDay: string;
    lightestDay: string;
    criticalDeadlines: string[];
    recommendations: string[];
  };
  deferredTasks: Array<{
    taskId: string;
    title: string;
    reason: string;
  }>;
  summary: string;
}

export const useAIPlanner = () => {
  const { session } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const planMyDay = async (
    targetDate: string,
    calendarEvents: any[]
  ): Promise<DayPlanResult | null> => {
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please log in to use AI day planning.",
        variant: "destructive",
      });
      return null;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('plan-my-day', {
        body: {
          targetDate,
          calendarEvents
        },
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Day Plan Generated! 📅",
        description: `Planned ${data.dayPlan?.length || 0} tasks for ${targetDate}.`,
      });

      return data;

    } catch (error) {
      console.error('Error planning day:', error);
      toast({
        title: "Day Planning Error",
        description: "Failed to generate day plan. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const planMyWeek = async (
    weekStart: string,
    weekEnd: string
  ): Promise<WeekPlanResult | null> => {
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please log in to use AI week planning.",
        variant: "destructive",
      });
      return null;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('plan-my-week', {
        body: {
          weekStart,
          weekEnd
        },
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Week Plan Generated! 🗓️",
        description: `Planned your week from ${weekStart} to ${weekEnd}.`,
      });

      return data;

    } catch (error) {
      console.error('Error planning week:', error);
      toast({
        title: "Week Planning Error",
        description: "Failed to generate week plan. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    planMyDay,
    planMyWeek,
    loading
  };
};