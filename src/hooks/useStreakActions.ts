import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface StreakContextType {
  recordCheckIn: () => Promise<void>;
}

// Simple function to record check-in without complex hooks
export const recordStreakCheckIn = async (userId: string): Promise<void> => {
  try {
    await supabase.rpc('record_check_in', {
      user_uuid: userId
    });
  } catch (error) {
    console.error('Error recording check-in:', error);
  }
};

// Hook for components that need to trigger check-ins
export const useStreakActions = (): StreakContextType => {
  const { user } = useAuth();

  const recordCheckIn = useCallback(async () => {
    if (!user) return;
    await recordStreakCheckIn(user.id);
  }, [user]);

  return { recordCheckIn };
};