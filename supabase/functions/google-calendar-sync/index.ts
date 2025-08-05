import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  location?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the authorization header
    const authorization = req.headers.get('Authorization');
    
    if (!authorization) {
      throw new Error('No authorization header');
    }

    // Get user from JWT token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authorization.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { action, timeMin, timeMax, event, eventId } = await req.json();

    // Get user's Google Calendar tokens
    const { data: tokenData, error: tokenError } = await supabaseClient
      .from('google_calendar_tokens')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (tokenError || !tokenData) {
      throw new Error('Google Calendar not connected');
    }

    // Check if token is expired and refresh if needed
    let accessToken = tokenData.access_token;
    if (new Date(tokenData.expires_at) <= new Date()) {
      if (!tokenData.refresh_token) {
        throw new Error('Token expired and no refresh token available');
      }

      // Refresh the token
      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: Deno.env.get('GOOGLE_CLIENT_ID') ?? '',
          client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET') ?? '',
          refresh_token: tokenData.refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      if (!refreshResponse.ok) {
        throw new Error('Failed to refresh Google Calendar token');
      }

      const refreshData = await refreshResponse.json();
      accessToken = refreshData.access_token;

      // Update token in database
      const expiresAt = new Date(Date.now() + refreshData.expires_in * 1000).toISOString();
      await supabaseClient
        .from('google_calendar_tokens')
        .update({
          access_token: accessToken,
          expires_at: expiresAt,
        })
        .eq('user_id', user.id);
    }

    const calendarApiBase = 'https://www.googleapis.com/calendar/v3/calendars/primary';

    switch (action) {
      case 'sync': {
        // Fetch events from Google Calendar
        const params = new URLSearchParams({
          timeMin: timeMin || new Date().toISOString(),
          timeMax: timeMax || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          singleEvents: 'true',
          orderBy: 'startTime',
        });

        const eventsResponse = await fetch(`${calendarApiBase}/events?${params}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!eventsResponse.ok) {
          throw new Error('Failed to fetch Google Calendar events');
        }

        const eventsData = await eventsResponse.json();
        
        // Store events in our database
        const events = eventsData.items || [];
        const formattedEvents = events.map((event: any) => ({
          user_id: user.id,
          google_event_id: event.id,
          title: event.summary || 'Untitled Event',
          description: event.description || null,
          start_time: event.start?.dateTime || event.start?.date,
          end_time: event.end?.dateTime || event.end?.date,
          is_all_day: !!(event.start?.date),
          location: event.location || null,
          status: event.status || 'confirmed',
        }));

        // Upsert events to avoid duplicates
        if (formattedEvents.length > 0) {
          const { error: upsertError } = await supabaseClient
            .from('calendar_events')
            .upsert(formattedEvents, {
              onConflict: 'user_id,google_event_id',
            });

          if (upsertError) {
            console.error('Error upserting events:', upsertError);
          }
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            events: formattedEvents,
            count: events.length 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        );
      }

      case 'create': {
        // Create a new event in Google Calendar
        const createResponse = await fetch(`${calendarApiBase}/events`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        });

        if (!createResponse.ok) {
          const errorData = await createResponse.text();
          throw new Error(`Failed to create Google Calendar event: ${errorData}`);
        }

        const createdEvent = await createResponse.json();
        
        // Store the created event in our database
        const { error: insertError } = await supabaseClient
          .from('calendar_events')
          .insert({
            user_id: user.id,
            google_event_id: createdEvent.id,
            title: createdEvent.summary || 'Untitled Event',
            description: createdEvent.description || null,
            start_time: createdEvent.start?.dateTime || createdEvent.start?.date,
            end_time: createdEvent.end?.dateTime || createdEvent.end?.date,
            is_all_day: !!(createdEvent.start?.date),
            location: createdEvent.location || null,
            status: createdEvent.status || 'confirmed',
          });

        if (insertError) {
          console.error('Error inserting created event:', insertError);
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            event: createdEvent 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        );
      }

      case 'delete': {
        // Delete an event from Google Calendar
        const deleteResponse = await fetch(`${calendarApiBase}/events/${eventId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (!deleteResponse.ok && deleteResponse.status !== 404) {
          throw new Error('Failed to delete Google Calendar event');
        }

        // Remove from our database
        const { error: deleteError } = await supabaseClient
          .from('calendar_events')
          .delete()
          .eq('user_id', user.id)
          .eq('google_event_id', eventId);

        if (deleteError) {
          console.error('Error deleting event from database:', deleteError);
        }

        return new Response(
          JSON.stringify({ success: true }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        );
      }

      default:
        throw new Error('Invalid action');
    }

  } catch (error) {
    console.error('Google Calendar sync error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Google Calendar synchronization failed'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
})