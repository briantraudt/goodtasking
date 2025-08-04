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
  const { user, session } = useAuth();
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
        .select('google_calendar_enabled, calendar_last_sync')
        .eq('user_id', user.id)
        .single();

      if (!error && data) {
        setCalendarData(prev => ({
          ...prev,
          isConnected: data.google_calendar_enabled || false,
          loading: false,
        }));

        // If connected, fetch events from local database
        if (data.google_calendar_enabled) {
          await fetchEventsFromDatabase();
          
          // Check if we need to sync (if never synced or last sync was more than 1 hour ago)
          const lastSync = data.calendar_last_sync ? new Date(data.calendar_last_sync) : null;
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
          
          if (!lastSync || lastSync < oneHourAgo) {
            console.log('Calendar data is stale, triggering background sync...');
            syncCalendarData();
          }
        }
      } else {
        setCalendarData(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Error checking calendar connection:', error);
      setCalendarData(prev => ({ ...prev, loading: false }));
    }
  };

  const fetchEventsFromDatabase = async (date?: string) => {
    if (!user) return;

    try {
      // Always fetch all events first for the comprehensive view
      const { data: allEvents, error: allEventsError } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time');

      if (allEventsError) {
        console.error('Error fetching events from database:', allEventsError);
        return;
      }

      // Transform database events to match the interface
      const transformedEvents: CalendarEvent[] = (allEvents || []).map(event => ({
        id: event.google_event_id,
        title: event.title,
        start: event.start_time,
        end: event.end_time,
        location: event.location,
        description: event.description,
        isAllDay: event.is_all_day,
      }));

      // If date filter is provided, filter the events client-side to avoid multiple DB calls
      let filteredEvents = transformedEvents;
      if (date) {
        const startOfDay = new Date(`${date}T00:00:00`);
        const endOfDay = new Date(`${date}T23:59:59`);
        
        filteredEvents = transformedEvents.filter(event => {
          const eventStart = new Date(event.start);
          return eventStart >= startOfDay && eventStart <= endOfDay;
        });
      }

      setCalendarData(prev => ({
        ...prev,
        events: filteredEvents,
        loading: false,
      }));

    } catch (error) {
      console.error('Error fetching events from database:', error);
      setCalendarData(prev => ({ ...prev, loading: false }));
    }
  };

  const syncCalendarData = async () => {
    if (!user || !session) return;

    try {
      console.log('Starting calendar sync...');
      
      const { data, error } = await supabase.functions.invoke('calendar-sync', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Calendar sync error:', error);
        return;
      }

      console.log('Calendar sync completed:', data);
      
      // Refresh events from database after sync
      await fetchEventsFromDatabase();
      
    } catch (error) {
      console.error('Error syncing calendar:', error);
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
      const redirectUri = `https://ychheamigqjpxtnzqina.supabase.co/functions/v1/google-calendar-callback`;
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
          toast({
            title: "Calendar Connected",
            description: "Google Calendar has been connected successfully! Syncing your events...",
          });
          // Add a small delay to ensure tokens are fully saved
          setTimeout(() => {
            checkConnection();
            syncCalendarData();
          }, 1000);
        }
      };

      window.addEventListener('message', messageHandler);

      // Fallback: check if popup is closed manually
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageHandler);
          // Give a moment for the message to arrive before checking connection
          setTimeout(() => {
            checkConnection();
            // Try syncing after connection check
            setTimeout(() => syncCalendarData(), 500);
          }, 1000);
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
    if (!user || !session) return;

    try {
      const { error } = await supabase.functions.invoke('google-calendar-integration', {
        body: { action: 'disconnect' },
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw error;
      }

      // Clear local calendar events
      await supabase
        .from('calendar_events')
        .delete()
        .eq('user_id', user.id);

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
    refreshEvents: fetchEventsFromDatabase, // This now queries local DB instantly
    syncCalendar: syncCalendarData, // Manual sync function if needed
  };
};