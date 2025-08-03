import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  streakTrackingEnabled: boolean;
  checkInDates: string[];
}

interface CheckInResult {
  current_streak: number;
  longest_streak: number;
  milestone_reached: number;
  check_in_recorded: boolean;
}

export const useStreaks = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    streakTrackingEnabled: true,
    checkInDates: []
  });
  const [loading, setLoading] = useState(true);

  const fetchStreakData = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('current_streak, longest_streak, streak_tracking_enabled, check_in_dates')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching streak data:', error);
        return;
      }

      if (data) {
        setStreakData({
          currentStreak: data.current_streak || 0,
          longestStreak: data.longest_streak || 0,
          streakTrackingEnabled: data.streak_tracking_enabled ?? true,
          checkInDates: data.check_in_dates || []
        });
      }
    } catch (error) {
      console.error('Error fetching streak data:', error);
    } finally {
      setLoading(false);
    }
  };

  const recordCheckIn = async (): Promise<CheckInResult | null> => {
    if (!user || !streakData.streakTrackingEnabled) return null;

    try {
      const { data, error } = await supabase.rpc('record_check_in', {
        user_uuid: user.id
      });

      if (error) {
        console.error('Error recording check-in:', error);
        return null;
      }

      const result = data as unknown as CheckInResult;
      
      // Update local streak data
      setStreakData(prev => ({
        ...prev,
        currentStreak: result.current_streak,
        longestStreak: result.longest_streak
      }));

      // Show milestone celebration if reached
      if (result.milestone_reached > 0) {
        showMilestoneCelebration(result.milestone_reached);
      }

      return result;
    } catch (error) {
      console.error('Error recording check-in:', error);
      return null;
    }
  };

  const showMilestoneCelebration = (milestone: number) => {
    const celebrations = {
      3: { emoji: '🔥', message: '3 days in a row! You\'re building momentum!' },
      5: { emoji: '🚀', message: '5 days straight! You\'re on fire!' },
      7: { emoji: '⭐', message: 'One full week! Amazing consistency!' },
      10: { emoji: '💎', message: '10 days! You\'re a productivity diamond!' },
      14: { emoji: '🏆', message: '2 weeks! You\'re unstoppable!' },
      21: { emoji: '🎯', message: '3 weeks! Habit formation in progress!' },
      30: { emoji: '👑', message: '30 days! You\'re a productivity royalty!' },
      50: { emoji: '🦅', message: '50 days! Soaring to new heights!' },
      100: { emoji: '🌟', message: '100 days! Legendary dedication!' }
    };

    const celebration = celebrations[milestone as keyof typeof celebrations];
    if (celebration) {
      toast({
        title: `${celebration.emoji} Streak Milestone!`,
        description: celebration.message,
        duration: 5000,
      });
    }
  };

  const updateStreakSettings = async (enabled: boolean) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          streak_tracking_enabled: enabled
        });

      if (error) {
        console.error('Error updating streak settings:', error);
        return;
      }

      setStreakData(prev => ({
        ...prev,
        streakTrackingEnabled: enabled
      }));

      toast({
        title: "Settings updated",
        description: `Streak tracking ${enabled ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      console.error('Error updating streak settings:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchStreakData();
      // Record check-in when user loads the app
      recordCheckIn();
    }
  }, [user]);

  return {
    streakData,
    loading,
    recordCheckIn,
    updateStreakSettings,
    fetchStreakData
  };
};