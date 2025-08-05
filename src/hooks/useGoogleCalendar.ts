import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format, startOfDay, endOfDay } from 'date-fns';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  type: 'task' | 'google_event';
  color?: string;
  description?: string;
  isAllDay?: boolean;
}

interface UseGoogleCalendarReturn {
  events: CalendarEvent[];
  isConnected: boolean;
  isLoading: boolean;
  connectGoogleCalendar: () => Promise<void>;
  disconnectGoogleCalendar: () => Promise<void>;
  syncCalendar: (date: string) => Promise<void>;
  createEventFromTask: (taskId: string, title: string, startTime: string, endTime: string, date: string) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
}

export const useGoogleCalendar = (): UseGoogleCalendarReturn => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Check if Google Calendar is connected
  const checkConnection = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('google_calendar_tokens')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking Google Calendar connection:', error);
        return;
      }

      setIsConnected(!!data && new Date(data.expires_at) > new Date());
    } catch (error) {
      console.error('Error checking connection:', error);
    }
  }, [user]);

  // Connect to Google Calendar
  const connectGoogleCalendar = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      // First get the client ID to construct the OAuth URL
      const { data, error } = await supabase.functions.invoke('google-calendar-integration', {
        body: { action: 'client-id' }
      });

      if (error) {
        throw error;
      }

      if (data?.clientId) {
        // Construct Google OAuth URL with Supabase callback
        const redirectUri = `https://ychheamigqjpxtnzqina.supabase.co/functions/v1/google-calendar-callback`;
        const scope = 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events';
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
          `client_id=${data.clientId}&` +
          `redirect_uri=${encodeURIComponent(redirectUri)}&` +
          `response_type=code&` +
          `scope=${encodeURIComponent(scope)}&` +
          `state=${user.id}&` +
          `access_type=offline&` +
          `prompt=consent`;
        
        // Open OAuth in a popup window
        const popup = window.open(
          authUrl,
          'google-oauth',
          'width=500,height=600,scrollbars=yes,resizable=yes'
        );

        // Listen for the popup to close or send a message
        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed);
            // Check connection status after popup closes and sync today's events
            setTimeout(async () => {
              await checkConnection();
              // Auto-sync today's events after successful connection
              const today = format(new Date(), 'yyyy-MM-dd');
              await syncCalendar(today);
            }, 1000);
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Error connecting Google Calendar:', error);
      toast({
        title: 'Connection Failed',
        description: 'Failed to connect to Google Calendar. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast, checkConnection]);

  // Disconnect from Google Calendar
  const disconnectGoogleCalendar = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('google_calendar_tokens')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      setIsConnected(false);
      setEvents([]);
      
      toast({
        title: 'Disconnected',
        description: 'Google Calendar has been disconnected.',
      });
    } catch (error) {
      console.error('Error disconnecting Google Calendar:', error);
      toast({
        title: 'Disconnection Failed',
        description: 'Failed to disconnect Google Calendar. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  // Sync calendar events for a specific date
  const syncCalendar = useCallback(async (date: string) => {
    if (!user || !isConnected) return;

    try {
      setIsLoading(true);

      // Expand date range to handle timezone differences
      const dateObj = new Date(date);
      const startDate = new Date(dateObj.getTime() - 12 * 60 * 60 * 1000).toISOString(); // Start 12 hours before
      const endDate = new Date(dateObj.getTime() + 36 * 60 * 60 * 1000).toISOString(); // End 36 hours after

      console.log('🔄 Syncing calendar for date:', date, 'Range:', startDate, 'to', endDate);

      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        body: {
          action: 'sync',
          timeMin: startDate,
          timeMax: endDate
        }
      });

      if (error) {
        throw error;
      }

      console.log('📅 Sync response:', data);

      if (data?.events) {
        const formattedEvents: CalendarEvent[] = data.events
          .map((event: any) => ({
            id: event.google_event_id || event.id,
            title: event.title || event.summary || 'Untitled Event',
            start: event.start_time || event.start?.dateTime || event.start?.date,
            end: event.end_time || event.end?.dateTime || event.end?.date,
            type: 'google_event' as const,
            description: event.description,
            isAllDay: !!(event.start?.date)
          }))
          .filter((event: CalendarEvent) => {
            // Convert event start time to local date and compare with requested date
            const eventStartLocal = new Date(event.start);
            const eventDateLocal = format(eventStartLocal, 'yyyy-MM-dd');
            return eventDateLocal === date;
          });

        console.log('📅 Filtered events for date', date, ':', formattedEvents);
        setEvents(formattedEvents);
      } else {
        console.log('📅 No events returned from sync');
        setEvents([]);
      }
    } catch (error) {
      console.error('Error syncing calendar:', error);
      toast({
        title: 'Sync Failed',
        description: 'Failed to sync Google Calendar events.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, isConnected, toast]);

  // Create Google Calendar event from task
  const createEventFromTask = useCallback(async (
    taskId: string,
    title: string,
    startTime: string,
    endTime: string,
    date: string
  ) => {
    if (!user || !isConnected) return;

    try {
      const startDateTime = `${date}T${startTime}`;
      const endDateTime = `${date}T${endTime}`;

      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        body: {
          action: 'create',
          event: {
            summary: title,
            start: {
              dateTime: startDateTime,
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            end: {
              dateTime: endDateTime,
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            description: `Task scheduled from productivity app (Task ID: ${taskId})`
          }
        }
      });

      if (error) {
        throw error;
      }

      // Refresh events for the current date
      await syncCalendar(date);
      
      toast({
        title: 'Event Created',
        description: 'Task has been added to your Google Calendar.',
      });
    } catch (error) {
      console.error('Error creating calendar event:', error);
      toast({
        title: 'Event Creation Failed',
        description: 'Failed to create Google Calendar event.',
        variant: 'destructive',
      });
    }
  }, [user, isConnected, syncCalendar, toast]);

  // Delete Google Calendar event
  const deleteEvent = useCallback(async (eventId: string) => {
    if (!user || !isConnected) return;

    try {
      const { error } = await supabase.functions.invoke('google-calendar-sync', {
        body: {
          action: 'delete',
          eventId
        }
      });

      if (error) {
        throw error;
      }

      // Remove event from local state
      setEvents(prev => prev.filter(event => event.id !== eventId));
      
      toast({
        title: 'Event Deleted',
        description: 'Event has been removed from your Google Calendar.',
      });
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      toast({
        title: 'Deletion Failed',
        description: 'Failed to delete Google Calendar event.',
        variant: 'destructive',
      });
    }
  }, [user, isConnected, toast]);

  // Check connection on mount and user change
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  // Auto-sync current day's events when connected (only once)
  useEffect(() => {
    if (isConnected && user) {
      const today = format(new Date(), 'yyyy-MM-dd');
      syncCalendar(today);
    }
  }, [isConnected, user]); // Removed syncCalendar from dependencies to prevent infinite loop

  return {
    events,
    isConnected,
    isLoading,
    connectGoogleCalendar,
    disconnectGoogleCalendar,
    syncCalendar,
    createEventFromTask,
    deleteEvent
  };
};