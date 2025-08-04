import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WatchRequest {
  action: 'subscribe' | 'unsubscribe' | 'renew';
  userId?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, userId }: WatchRequest = await req.json();
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get Google API credentials
    const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const googleClientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

    if (!googleClientId || !googleClientSecret) {
      throw new Error('Google credentials not configured');
    }

    // Get auth header if provided
    const authHeader = req.headers.get('authorization');
    let currentUserId = userId;

    // If no userId provided, extract from auth token
    if (!currentUserId && authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      currentUserId = user?.id;
    }

    if (!currentUserId) {
      return new Response('User not authenticated', { 
        status: 401, 
        headers: corsHeaders 
      });
    }

    if (action === 'subscribe') {
      return await subscribeToCalendarChanges(supabase, currentUserId);
    } else if (action === 'unsubscribe') {
      return await unsubscribeFromCalendarChanges(supabase, currentUserId);
    } else if (action === 'renew') {
      return await renewCalendarSubscription(supabase, currentUserId);
    } else {
      return new Response('Invalid action', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

  } catch (error) {
    console.error('Watch manager error:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function subscribeToCalendarChanges(supabase: any, userId: string) {
  try {
    console.log('Setting up calendar watch for user:', userId);

    // Get user's access token
    const { data: tokenData, error: tokenError } = await supabase
      .from('google_calendar_tokens')
      .select('access_token, refresh_token, expires_at')
      .eq('user_id', userId)
      .single();

    if (tokenError || !tokenData) {
      throw new Error('No calendar token found for user');
    }

    // Check if token is expired and refresh if needed
    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);
    
    let accessToken = tokenData.access_token;

    if (now >= expiresAt && tokenData.refresh_token) {
      console.log('Token expired, refreshing...');
      accessToken = await refreshAccessToken(supabase, userId, tokenData.refresh_token);
    }

    // Generate unique channel ID and token
    const channelId = `calendar-${userId}-${crypto.randomUUID()}`;
    const channelToken = crypto.randomUUID();
    
    // Set up webhook URL
    const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/google-calendar-webhook`;

    // Subscribe to calendar changes
    const watchResponse = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events/watch',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: channelId,
          type: 'web_hook',
          address: webhookUrl,
          token: channelToken,
          params: {
            ttl: '604800' // 7 days in seconds
          }
        }),
      }
    );

    if (!watchResponse.ok) {
      const errorText = await watchResponse.text();
      console.error('Failed to set up calendar watch:', errorText);
      throw new Error(`Failed to set up calendar watch: ${errorText}`);
    }

    const watchData = await watchResponse.json();
    console.log('Calendar watch established:', watchData);

    // Calculate expiration time (current time + 7 days)
    const expirationTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Store webhook information
    await supabase
      .from('calendar_webhooks')
      .upsert({
        user_id: userId,
        channel_id: channelId,
        resource_id: watchData.resourceId,
        channel_token: channelToken,
        expiration_time: expirationTime.toISOString(),
        status: 'active'
      });

    // Update user preferences with watch info
    await supabase
      .from('user_preferences')
      .update({
        calendar_watch_channel_id: channelId,
        calendar_watch_resource_id: watchData.resourceId,
        calendar_watch_token: channelToken,
        calendar_watch_expiration: expirationTime.toISOString()
      })
      .eq('user_id', userId);

    return new Response(JSON.stringify({ 
      success: true,
      channelId,
      resourceId: watchData.resourceId,
      expirationTime: expirationTime.toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error setting up calendar watch:', error);
    throw error;
  }
}

async function unsubscribeFromCalendarChanges(supabase: any, userId: string) {
  try {
    console.log('Unsubscribing from calendar changes for user:', userId);

    // Get current watch info
    const { data: prefs, error: prefsError } = await supabase
      .from('user_preferences')
      .select('calendar_watch_channel_id, calendar_watch_resource_id')
      .eq('user_id', userId)
      .single();

    if (prefsError || !prefs?.calendar_watch_channel_id) {
      console.log('No active watch found for user');
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get access token
    const { data: tokenData, error: tokenError } = await supabase
      .from('google_calendar_tokens')
      .select('access_token, refresh_token, expires_at')
      .eq('user_id', userId)
      .single();

    if (!tokenError && tokenData) {
      // Check if token is expired and refresh if needed
      const now = new Date();
      const expiresAt = new Date(tokenData.expires_at);
      
      let accessToken = tokenData.access_token;

      if (now >= expiresAt && tokenData.refresh_token) {
        console.log('Token expired, refreshing...');
        accessToken = await refreshAccessToken(supabase, userId, tokenData.refresh_token);
      }

      // Stop the watch channel
      try {
        const stopResponse = await fetch(
          'https://www.googleapis.com/calendar/v3/channels/stop',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id: prefs.calendar_watch_channel_id,
              resourceId: prefs.calendar_watch_resource_id
            }),
          }
        );

        if (!stopResponse.ok) {
          console.warn('Failed to stop watch channel (may already be expired)');
        } else {
          console.log('Successfully stopped watch channel');
        }
      } catch (stopError) {
        console.warn('Error stopping watch channel:', stopError);
      }
    }

    // Update webhook status to inactive
    await supabase
      .from('calendar_webhooks')
      .update({ status: 'inactive' })
      .eq('user_id', userId);

    // Clear watch info from user preferences
    await supabase
      .from('user_preferences')
      .update({
        calendar_watch_channel_id: null,
        calendar_watch_resource_id: null,
        calendar_watch_token: null,
        calendar_watch_expiration: null
      })
      .eq('user_id', userId);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error unsubscribing from calendar changes:', error);
    throw error;
  }
}

async function renewCalendarSubscription(supabase: any, userId: string) {
  console.log('Renewing calendar subscription for user:', userId);
  
  // First unsubscribe from current watch
  await unsubscribeFromCalendarChanges(supabase, userId);
  
  // Then set up a new watch
  return await subscribeToCalendarChanges(supabase, userId);
}

async function refreshAccessToken(supabase: any, userId: string, refreshToken: string) {
  console.log('Refreshing access token for user:', userId);
  
  const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID')!;
  const googleClientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')!;

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: googleClientId,
      client_secret: googleClientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    throw new Error(`Failed to refresh token: ${errorText}`);
  }

  const tokenData = await tokenResponse.json();
  const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

  // Update stored token
  await supabase
    .from('google_calendar_tokens')
    .update({
      access_token: tokenData.access_token,
      expires_at: expiresAt.toISOString(),
    })
    .eq('user_id', userId);

  return tokenData.access_token;
}