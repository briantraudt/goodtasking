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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Get user from the auth header and set the auth context
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''))
    
    if (authError || !user) {
      throw new Error('Invalid auth token')
    }

    // Create a new client with the user's auth token for RLS
    const authenticatedClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    )

    console.log('Calendar sync for user:', user.id)

    // Get the user's Google Calendar token using authenticated client
    const { data: tokenData, error: tokenError } = await authenticatedClient
      .from('google_calendar_tokens')
      .select('access_token, refresh_token, expires_at')
      .eq('user_id', user.id)
      .single()

    console.log('Token query result:', { tokenData, tokenError })

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
        .eq('user_id', user.id)

      tokenData.access_token = refreshData.access_token
    }

    // Fetch events from Google Calendar (next 30 days)
    const timeMin = new Date().toISOString()
    const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now

    const calendarUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
      `timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime&maxResults=2500`

    console.log('Fetching calendar events from Google API...')
    
    const calendarResponse = await fetch(calendarUrl, {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    })

    if (!calendarResponse.ok) {
      const errorText = await calendarResponse.text()
      console.error('Google Calendar API error:', errorText)
      throw new Error(`Failed to fetch calendar events: ${errorText}`)
    }

    const calendarData = await calendarResponse.json()
    const events: CalendarEvent[] = calendarData.items || []

    console.log(`Fetched ${events.length} events from Google Calendar`)

    // Delete existing events for this user (to handle deleted events)
    await authenticatedClient
      .from('calendar_events')
      .delete()
      .eq('user_id', user.id)

    // Insert new events
    if (events.length > 0) {
      const eventsToInsert = events.map(event => {
        // Handle both dateTime and date formats
        const startTime = event.start.dateTime || event.start.date
        const endTime = event.end.dateTime || event.end.date
        const isAllDay = !event.start.dateTime

        return {
          user_id: user.id,
          google_event_id: event.id,
          title: event.summary || 'Untitled Event',
          description: event.description || null,
          start_time: startTime,
          end_time: endTime,
          location: event.location || null,
          is_all_day: isAllDay,
          status: event.status || 'confirmed',
        }
      })

      const { error: insertError } = await authenticatedClient
        .from('calendar_events')
        .insert(eventsToInsert)

      if (insertError) {
        console.error('Error inserting events:', insertError)
        throw new Error('Failed to save calendar events')
      }
    }

    // Update last sync time
    await authenticatedClient
      .from('user_preferences')
      .update({ calendar_last_sync: new Date().toISOString() })
      .eq('user_id', user.id)

    console.log(`Successfully synced ${events.length} calendar events`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        eventCount: events.length,
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