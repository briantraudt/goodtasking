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

  const connectCalendar = async () => {
    try {
      // Get the Google Client ID from our edge function
      const { data: clientData, error: clientError } = await supabase.functions.invoke('google-calendar-integration', {
        body: { action: 'client-id' },
      });

      if (clientError || !clientData?.clientId) {
        throw new Error('Failed to get Google Client ID');
      }

      // Generate Google OAuth URL
      const redirectUri = `https://ychheamigqjpxtnzqina.supabase.co/functions/v1/google-calendar-integration?action=callback`;
      const scope = 'https://www.googleapis.com/auth/calendar.readonly';
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientData.clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scope)}&` +
        `response_type=code&` +
        `access_type=offline&` +
        `prompt=consent&` +
        `state=${user?.id}`; // Include user ID for security

      // Open OAuth popup
      const popup = window.open(authUrl, 'google-calendar-auth', 'width=500,height=600');
      
      // Listen for popup completion message
      const messageHandler = (event: MessageEvent) => {
        if (event.data === 'google-calendar-connected') {
          window.removeEventListener('message', messageHandler);
          checkConnection();
          toast({
            title: "Calendar Connected",
            description: "Google Calendar has been connected successfully!",
          });
        }
      };

      window.addEventListener('message', messageHandler);

      // Fallback: check if popup is closed manually
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageHandler);
          // Give a moment for the message to arrive before checking connection
          setTimeout(() => checkConnection(), 500);
        }
      }, 1000);
    } catch (error) {
      console.error('Error connecting calendar:', error);
      toast({
        title: "Connection Error",
        description: "Failed to connect Google Calendar. Please try again.",
        variant: "destructive",
      });
    }
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