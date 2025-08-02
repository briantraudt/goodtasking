import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    // Get user from Authorization header
    const authorization = req.headers.get('Authorization')
    if (!authorization) {
      throw new Error('No authorization header')
    }

    const { data: { user } } = await supabaseClient.auth.getUser(
      authorization.replace('Bearer ', '')
    )

    if (!user) {
      throw new Error('Invalid user')
    }

    console.log('Enabling AI assistant for user:', user.id);

    // Update or insert profile with AI assistant enabled
    const { data, error } = await supabaseClient
      .from('profiles')
      .upsert({
        user_id: user.id,
        ai_assistant_enabled: true
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      throw error;
    }

    console.log('AI assistant enabled successfully for user:', user.id);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'AI assistant enabled successfully',
        profile: data
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in enable-ai-assistant function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});