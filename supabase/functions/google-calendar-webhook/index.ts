import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Webhook received:', req.method, req.url);
    
    // Validate this is a webhook request
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { 
        status: 405, 
        headers: corsHeaders 
      });
    }

    // Get Google webhook headers
    const channelId = req.headers.get('x-goog-channel-id');
    const resourceId = req.headers.get('x-goog-resource-id');
    const channelToken = req.headers.get('x-goog-channel-token');
    const resourceState = req.headers.get('x-goog-resource-state');
    
    console.log('Webhook headers:', {
      channelId,
      resourceId,
      channelToken,
      resourceState
    });

    if (!channelId) {
      console.error('Missing channel ID in webhook');
      return new Response('Missing channel ID', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find the webhook record and associated user
    const { data: webhook, error: webhookError } = await supabase
      .from('calendar_webhooks')
      .select('user_id, channel_token, status')
      .eq('channel_id', channelId)
      .single();

    if (webhookError || !webhook) {
      console.error('Webhook not found:', webhookError);
      return new Response('Webhook not found', { 
        status: 404, 
        headers: corsHeaders 
      });
    }

    // Validate channel token if it exists
    if (webhook.channel_token && webhook.channel_token !== channelToken) {
      console.error('Invalid channel token');
      return new Response('Invalid token', { 
        status: 403, 
        headers: corsHeaders 
      });
    }

    // Check if webhook is still active
    if (webhook.status !== 'active') {
      console.log('Webhook is not active, ignoring notification');
      return new Response('OK', { headers: corsHeaders });
    }

    // Update last notification time
    await supabase
      .from('calendar_webhooks')
      .update({ 
        last_notification: new Date().toISOString(),
        resource_id: resourceId 
      })
      .eq('channel_id', channelId);

    // Handle different resource states
    if (resourceState === 'sync') {
      console.log('Initial sync notification - no action needed');
      return new Response('OK', { headers: corsHeaders });
    }

    if (resourceState === 'exists') {
      console.log('Calendar change detected, triggering sync for user:', webhook.user_id);
      
      // Trigger calendar sync for this user
      try {
        const { error: syncError } = await supabase.functions.invoke('calendar-sync', {
          body: { 
            userId: webhook.user_id,
            source: 'webhook'
          },
        });

        if (syncError) {
          console.error('Error triggering calendar sync:', syncError);
        } else {
          console.log('Calendar sync triggered successfully');
        }
      } catch (syncErr) {
        console.error('Failed to trigger sync:', syncErr);
      }
    }

    return new Response('OK', { headers: corsHeaders });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response('Internal server error', { 
      status: 500, 
      headers: corsHeaders 
    });
  }
})