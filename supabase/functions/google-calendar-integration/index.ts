import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CalendarEvent {
  id: string;
  summary: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  location?: string;
  description?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const url = new URL(req.url);
    let action = url.searchParams.get('action');
    
    // If action is not in URL params, try to get it from request body
    if (!action && req.method === 'POST') {
      try {
        const requestClone = req.clone();
        const body = await requestClone.json();
        action = body.action;
      } catch {
        // If we can't parse JSON, that's okay, action will remain null
      }
    }

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Get the JWT from the auth header
    const jwt = authHeader.replace('Bearer ', '');
    
    // Set the JWT for this request
    supabase.auth.setSession({ access_token: jwt, refresh_token: '' });

    // Get the user
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
    if (userError || !user) {
      throw new Error('Invalid user');
    }
    
    const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];

    if (action === 'client-id') {
      // Return the public client ID for frontend OAuth
      return new Response(JSON.stringify({ 
        clientId: Deno.env.get('GOOGLE_CLIENT_ID') || '' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'connect') {
      // Handle OAuth callback
      const { code } = await req.json();
      
      if (!code) {
        throw new Error('No authorization code provided');
      }

      // Exchange code for tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: Deno.env.get('GOOGLE_CLIENT_ID') || '',
          client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET') || '',
          code,
          grant_type: 'authorization_code',
          redirect_uri: `${Deno.env.get('SUPABASE_URL')}/functions/v1/google-calendar-integration?action=callback`,
        }),
      });

      const tokenData = await tokenResponse.json();
      
      if (!tokenResponse.ok) {
        throw new Error(`Failed to exchange code for tokens: ${tokenData.error_description}`);
      }

      // Calculate expiration time
      const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));

      // Store tokens in database
      const { error: insertError } = await supabase
        .from('google_calendar_tokens')
        .upsert({
          user_id: user.id,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: expiresAt.toISOString(),
          scope: tokenData.scope,
          token_type: tokenData.token_type,
        });

      if (insertError) {
        throw insertError;
      }

      // Update user preferences
      await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          google_calendar_enabled: true,
        });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'disconnect') {
      // Delete tokens and disable calendar
      await supabase
        .from('google_calendar_tokens')
        .delete()
        .eq('user_id', user.id);

      await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          google_calendar_enabled: false,
        });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'events') {
      console.log('Fetching events for user:', user.id);
      
      // Fetch calendar events
      const { data: tokenData, error: tokenError } = await supabase
        .from('google_calendar_tokens')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      console.log('Token query result:', { tokenData, tokenError });

      if (tokenError) {
        console.error('Token query error:', tokenError);
        throw new Error(`Database error: ${tokenError.message}`);
      }

      if (!tokenData) {
        console.log('No tokens found for user:', user.id);
        throw new Error('No calendar connection found');
      }

      // Check if token is expired and refresh if needed
      let accessToken = tokenData.access_token;
      const expiresAt = new Date(tokenData.expires_at);
      
      if (expiresAt <= new Date()) {
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
            client_id: Deno.env.get('GOOGLE_CLIENT_ID') || '',
            client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET') || '',
            refresh_token: tokenData.refresh_token,
            grant_type: 'refresh_token',
          }),
        });

        const refreshData = await refreshResponse.json();
        
        if (!refreshResponse.ok) {
          throw new Error('Failed to refresh token');
        }

        accessToken = refreshData.access_token;
        const newExpiresAt = new Date(Date.now() + (refreshData.expires_in * 1000));

        // Update stored token
        await supabase
          .from('google_calendar_tokens')
          .update({
            access_token: accessToken,
            expires_at: newExpiresAt.toISOString(),
          })
          .eq('user_id', user.id);
      }

      // Fetch calendar events
      const startOfDay = new Date(date + 'T00:00:00Z').toISOString();
      const endOfDay = new Date(date + 'T23:59:59Z').toISOString();

      const calendarResponse = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
        `timeMin=${startOfDay}&timeMax=${endOfDay}&orderBy=startTime&singleEvents=true`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      const calendarData = await calendarResponse.json();
      
      if (!calendarResponse.ok) {
        throw new Error(`Failed to fetch calendar events: ${calendarData.error?.message}`);
      }

      // Format events for frontend
      const events = calendarData.items?.map((event: CalendarEvent) => ({
        id: event.id,
        title: event.summary || 'Untitled Event',
        start: event.start?.dateTime || event.start?.date,
        end: event.end?.dateTime || event.end?.date,
        location: event.location,
        description: event.description,
        isAllDay: !event.start?.dateTime, // If no dateTime, it's an all-day event
      })) || [];

      return new Response(JSON.stringify({ events }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else {
      throw new Error('Invalid action parameter');
    }

  } catch (error) {
    console.error('Error in google-calendar-integration function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});