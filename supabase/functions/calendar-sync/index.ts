import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CalendarEvent {
  id: string;
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
  status?: string;
}

interface SyncRequest {
  userId?: string;
  source?: 'webhook' | 'manual' | 'polling';
  useSyncToken?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get request data for webhook calls
    let requestData: SyncRequest = {};
    if (req.method === 'POST') {
      try {
        requestData = await req.json();
      } catch {
        // If no body or invalid JSON, use empty object
      }
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    // Get user from auth token or request
    let userId = requestData.userId;
    let authHeader = req.headers.get('Authorization');
    
    if (!userId && authHeader) {
      // Get user from the auth header
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''))
      
      if (authError || !user) {
        throw new Error('Invalid auth token')
      }
      userId = user.id;
    }

    if (!userId) {
      throw new Error('User ID required')
    }

    console.log('Calendar sync for user:', userId, 'Source:', requestData.source || 'unknown')

    // Create authenticated client for this user
    const authenticatedClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: authHeader ? {
            Authorization: authHeader,
          } : {},
        },
      }
    )

    // Get the user's Google Calendar token
    const { data: tokenData, error: tokenError } = await authenticatedClient
      .from('google_calendar_tokens')
      .select('access_token, refresh_token, expires_at')
      .eq('user_id', userId)
      .single()

    console.log('Token query result:', { tokenData: !!tokenData, tokenError })

    if (tokenError || !tokenData) {
      throw new Error('No Google Calendar token found')
    }

    // Check if token needs refresh
    const now = new Date()
    const expiresAt = new Date(tokenData.expires_at)
    
    if (now >= expiresAt && tokenData.refresh_token) {
      console.log('Token expired, refreshing...')
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
      })

      if (!refreshResponse.ok) {
        throw new Error('Failed to refresh token')
      }

      const refreshData = await refreshResponse.json()
      const newExpiresAt = new Date(Date.now() + refreshData.expires_in * 1000)

      // Update the token in database
      await authenticatedClient
        .from('google_calendar_tokens')
        .update({
          access_token: refreshData.access_token,
          expires_at: newExpiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)

      tokenData.access_token = refreshData.access_token
    }

    // Get current sync token for incremental sync
    const { data: preferences } = await authenticatedClient
      .from('user_preferences')
      .select('calendar_sync_token')
      .eq('user_id', userId)
      .single();

    const syncToken = preferences?.calendar_sync_token;
    
    // Prepare Google Calendar API request
    const calendarUrl = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
    
    // Add query parameters for optimization
    if (syncToken && requestData.useSyncToken !== false) {
      // Use sync token for incremental sync
      calendarUrl.searchParams.set('syncToken', syncToken);
      console.log('Using sync token for incremental sync');
    } else {
      // Full sync - get events from beginning of today onwards
      const today = new Date()
      today.setHours(0, 0, 0, 0) // Start from beginning of today
      const timeMin = today.toISOString()
      const timeMax = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year from now
      
      calendarUrl.searchParams.set('timeMin', timeMin);
      calendarUrl.searchParams.set('timeMax', timeMax);
      calendarUrl.searchParams.set('singleEvents', 'true');
      calendarUrl.searchParams.set('orderBy', 'startTime');
      console.log('Performing full sync from', timeMin, 'to', timeMax);
    }

    calendarUrl.searchParams.set('maxResults', '2500');

    console.log('Fetching calendar events from Google API...')
    
    const calendarResponse = await fetch(calendarUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    })

    if (!calendarResponse.ok) {
      const errorText = await calendarResponse.text()
      console.error('Google Calendar API error:', errorText)
      
      if (calendarResponse.status === 410 && syncToken) {
        // Sync token is invalid, perform full sync
        console.log('Sync token invalid, performing full sync...');
        return await performFullSync(userId, tokenData.access_token, authenticatedClient);
      }
      
      throw new Error(`Failed to fetch calendar events: ${errorText}`)
    }

    const calendarData = await calendarResponse.json()
    const events: CalendarEvent[] = calendarData.items || []

    console.log(`Fetched ${events.length} events from Google Calendar`)

    // Process events based on sync type
    if (syncToken && requestData.useSyncToken !== false) {
      // Incremental sync - handle updates and deletions
      for (const event of events) {
        if (event.status === 'cancelled') {
          // Delete cancelled events
          await authenticatedClient
            .from('calendar_events')
            .delete()
            .eq('user_id', userId)
            .eq('google_event_id', event.id);
          console.log('Deleted cancelled event:', event.id);
        } else {
          // Upsert updated/new events
          await upsertEvent(event, userId, authenticatedClient);
        }
      }
    } else {
      // Full sync - replace all events
      await authenticatedClient
        .from('calendar_events')
        .delete()
        .eq('user_id', userId)

      // Insert new events
      if (events.length > 0) {
        const eventsToInsert = events
          .filter(event => event.status !== 'cancelled')
          .map(event => formatEventForDB(event, userId))

        const { error: insertError } = await authenticatedClient
          .from('calendar_events')
          .insert(eventsToInsert)

        if (insertError) {
          console.error('Error inserting events:', insertError)
          throw new Error('Failed to save calendar events')
        }
      }
    }

    // Update sync token and last sync time
    const updates: any = {
      calendar_last_sync: new Date().toISOString()
    };
    
    if (calendarData.nextSyncToken) {
      updates.calendar_sync_token = calendarData.nextSyncToken;
      console.log('Updated sync token for incremental sync');
    }

    await authenticatedClient
      .from('user_preferences')
      .update(updates)
      .eq('user_id', userId)

    console.log(`Successfully synced ${events.length} calendar events`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        eventCount: events.length,
        syncType: syncToken ? 'incremental' : 'full',
        source: requestData.source || 'unknown',
        message: `Synced ${events.length} calendar events`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error in calendar-sync function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

async function performFullSync(userId: string, accessToken: string, supabaseClient: any) {
  console.log('Performing full sync recovery for user:', userId);
  
  // Clear existing sync token
  await supabaseClient
    .from('user_preferences')
    .update({ calendar_sync_token: null })
    .eq('user_id', userId);
  
  // Recursively call sync without sync token
  const fullSyncResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/calendar-sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId,
      source: 'full_sync_recovery',
      useSyncToken: false
    })
  });
  
  return fullSyncResponse;
}

async function upsertEvent(event: CalendarEvent, userId: string, supabaseClient: any) {
  const eventData = formatEventForDB(event, userId);
  
  const { error } = await supabaseClient
    .from('calendar_events')
    .upsert(eventData, {
      onConflict: 'user_id,google_event_id',
      ignoreDuplicates: false
    });

  if (error) {
    console.error('Error upserting event:', error);
  }
}

function formatEventForDB(event: CalendarEvent, userId: string) {
  // Handle both dateTime and date formats
  const startTime = event.start.dateTime || event.start.date
  const endTime = event.end.dateTime || event.end.date
  const isAllDay = !event.start.dateTime

  return {
    user_id: userId,
    google_event_id: event.id,
    title: event.summary || 'Untitled Event',
    description: event.description || null,
    start_time: startTime,
    end_time: endTime,
    location: event.location || null,
    is_all_day: isAllDay,
    status: event.status || 'confirmed',
  }
}