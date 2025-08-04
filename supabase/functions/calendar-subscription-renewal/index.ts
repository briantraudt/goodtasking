import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting calendar subscription renewal job...');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Find webhooks expiring in the next 2 days
    const twoDaysFromNow = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    
    const { data: expiringWebhooks, error } = await supabase
      .from('calendar_webhooks')
      .select('user_id, channel_id')
      .eq('status', 'active')
      .lt('expiration_time', twoDaysFromNow.toISOString());

    if (error) {
      console.error('Error fetching expiring webhooks:', error);
      return new Response('Error fetching webhooks', { status: 500, headers: corsHeaders });
    }

    console.log(`Found ${expiringWebhooks?.length || 0} webhooks to renew`);

    // Renew each webhook
    for (const webhook of expiringWebhooks || []) {
      try {
        console.log('Renewing webhook for user:', webhook.user_id);
        
        const { error: renewError } = await supabase.functions.invoke('calendar-watch-manager', {
          body: { 
            action: 'renew',
            userId: webhook.user_id
          }
        });

        if (renewError) {
          console.error('Error renewing webhook for user', webhook.user_id, ':', renewError);
        } else {
          console.log('Successfully renewed webhook for user:', webhook.user_id);
        }
      } catch (renewErr) {
        console.error('Failed to renew webhook for user', webhook.user_id, ':', renewErr);
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      renewedCount: expiringWebhooks?.length || 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Subscription renewal error:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});