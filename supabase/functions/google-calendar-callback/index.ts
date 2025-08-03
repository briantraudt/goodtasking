import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state'); // This contains the user ID
    
    console.log('Callback received - code:', !!code, 'state:', state);
    
    if (!code || !state) {
      console.error('Missing code or state:', { code: !!code, state });
      return new Response('Authorization code or state not found', { status: 400 });
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
        redirect_uri: `https://ychheamigqjpxtnzqina.supabase.co/functions/v1/google-calendar-callback`,
      }),
    });

    const tokenData = await tokenResponse.json();
    console.log('Token exchange response:', tokenResponse.status, tokenData);
    
    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', tokenData);
      return new Response(`<html><body><script>window.close();</script><p>Authentication failed: ${tokenData.error_description}</p></body></html>`, {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    // Calculate expiration time
    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));

    // Create admin client to store tokens
    const adminSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Storing tokens for user:', state);

    // First, delete any existing tokens for this user
    const { error: deleteError } = await adminSupabase
      .from('google_calendar_tokens')
      .delete()
      .eq('user_id', state);

    if (deleteError) {
      console.log('Delete error (may be expected if no tokens exist):', deleteError);
    }

    // Then insert the new tokens
    const { error: insertError } = await adminSupabase
      .from('google_calendar_tokens')
      .insert({
        user_id: state, // Use the user ID passed in state
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: expiresAt.toISOString(),
        scope: tokenData.scope,
        token_type: tokenData.token_type,
      });

    console.log('Token insert result:', insertError);

    if (insertError) {
      console.error('Database insert error:', insertError);
      return new Response(`<html><body><script>window.close();</script><p>Database error: ${insertError.message}</p></body></html>`, {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    // Update user preferences
    const { error: prefsError } = await adminSupabase
      .from('user_preferences')
      .upsert({
        user_id: state,
        google_calendar_enabled: true,
      }, {
        onConflict: 'user_id'
      });

    console.log('Preferences update result:', prefsError);

    if (prefsError) {
      console.error('Preferences update error:', prefsError);
    }

    console.log('Calendar connection completed successfully for user:', state);

    // Return success page that closes popup
    return new Response(`
      <html>
        <body>
          <script>
            window.opener?.postMessage('google-calendar-connected', '*');
            window.close();
          </script>
          <p>Calendar connected successfully! You can close this window.</p>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' },
    });

  } catch (error) {
    console.error('Error in google-calendar-callback function:', error);
    return new Response(`<html><body><script>window.close();</script><p>Error: ${error.message}</p></body></html>`, {
      headers: { 'Content-Type': 'text/html' },
      status: 500,
    });
  }
});