import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        global: {
          headers: {
            Authorization: req.headers.get('Authorization') || ''
          }
        }
      }
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Get the JWT from the auth header
    const jwt = authHeader.replace('Bearer ', '');
    
    // Get the user
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
    if (userError || !user) {
      throw new Error('Invalid user');
    }

    const { events, tasks, targetDate } = await req.json();

    console.log('Scheduling request for user:', user.id);
    console.log('Events:', events);
    console.log('Tasks:', tasks);

    // Create the AI prompt
    const prompt = `Here is the user's Google Calendar schedule and their task list for ${targetDate}. Based on available time gaps and task priorities, generate a suggested time slot for each task. 

RULES:
- Avoid overlaps with existing calendar events
- Consider task durations and priorities
- Start with high-priority tasks first
- Schedule tasks between 9 AM and 6 PM unless specified otherwise
- Leave 15-minute buffers between events when possible
- If a task is too long for available gaps, suggest splitting it

Calendar Events:
${JSON.stringify(events, null, 2)}

Tasks to Schedule:
${JSON.stringify(tasks, null, 2)}

Format your response as a JSON object with this structure:
{
  "scheduledTasks": [
    {
      "taskId": "string",
      "proposedStartTime": "HH:MM",
      "proposedEndTime": "HH:MM", 
      "rationale": "brief explanation of why this time slot was chosen"
    }
  ],
  "conflicts": [
    {
      "taskId": "string",
      "issue": "description of scheduling conflict or suggestion"
    }
  ],
  "summary": "Brief overview of the scheduling approach used"
}

Respond ONLY with valid JSON, no additional text.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert scheduling assistant that analyzes calendar events and suggests optimal time slots for tasks. Always respond with valid JSON only.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log('AI Response:', aiResponse);

    let schedulingSuggestions;
    try {
      schedulingSuggestions = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      throw new Error('Invalid AI response format');
    }

    return new Response(JSON.stringify(schedulingSuggestions), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-task-scheduler function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      scheduledTasks: [],
      conflicts: [],
      summary: 'Scheduling failed due to an error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});