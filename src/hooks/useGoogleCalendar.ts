import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  location?: string;
  description?: string;
  isAllDay: boolean;
}

interface CalendarData {
  isConnected: boolean;
  events: CalendarEvent[];
  loading: boolean;
}

export const useGoogleCalendar = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [calendarData, setCalendarData] = useState<CalendarData>({
    isConnected: false,
    events: [],
    loading: true,
  });

  const checkConnection = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('google_calendar_enabled')
        .eq('user_id', user.id)
        .single();

      if (!error && data) {
        setCalendarData(prev => ({
          ...prev,
          isConnected: data.google_calendar_enabled || false,
          loading: false,
        }));

        // If connected, fetch today's events
        if (data.google_calendar_enabled) {
          await fetchEvents();
        }
      } else {
        setCalendarData(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Error checking calendar connection:', error);
      setCalendarData(prev => ({ ...prev, loading: false }));
    }
  };

  const fetchEvents = async (date?: string) => {
    if (!user) return;

    try {
      setCalendarData(prev => ({ ...prev, loading: true }));

      const targetDate = date || new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase.functions.invoke('google-calendar-integration', {
        body: { action: 'events', date: targetDate },
      });

      if (error) {
        throw error;
      }

      if (data.events) {
        setCalendarData(prev => ({
          ...prev,
          events: data.events,
          loading: false,
        }));
      }
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      toast({
        title: "Calendar Error",
        description: "Failed to fetch calendar events. Please try reconnecting.",
        variant: "destructive",
      });
      setCalendarData(prev => ({ ...prev, loading: false }));
    }
  };

  const connectCalendar = () => {
    // Generate Google OAuth URL
    const clientId = 'YOUR_GOOGLE_CLIENT_ID'; // This should be set in environment
    const redirectUri = `${window.location.origin}/auth/google/callback`;
    const scope = 'https://www.googleapis.com/auth/calendar.readonly';
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `response_type=code&` +
      `access_type=offline&` +
      `prompt=consent`;

    // Open OAuth popup
    const popup = window.open(authUrl, 'google-calendar-auth', 'width=500,height=600');
    
    // Listen for popup completion
    const checkClosed = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkClosed);
        // Refresh connection status
        checkConnection();
      }
    }, 1000);
  };

  const disconnectCalendar = async () => {
    if (!user) return;

    try {
      const { error } = await supabase.functions.invoke('google-calendar-integration', {
        body: { action: 'disconnect' },
      });

      if (error) {
        throw error;
      }

      setCalendarData({
        isConnected: false,
        events: [],
        loading: false,
      });

      toast({
        title: "Calendar Disconnected",
        description: "Google Calendar has been disconnected successfully.",
      });
    } catch (error) {
      console.error('Error disconnecting calendar:', error);
      toast({
        title: "Error",
        description: "Failed to disconnect calendar. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (user) {
      checkConnection();
    }
  }, [user]);

  return {
    ...calendarData,
    connectCalendar,
    disconnectCalendar,
    refreshEvents: fetchEvents,
  };
};