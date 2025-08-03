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

    const { targetDate, calendarEvents } = await req.json();
    
    console.log('Plan My Day request for user:', user.id, 'date:', targetDate);

    // Get today's and overdue tasks
    const today = new Date().toISOString().split('T')[0];
    const { data: tasks, error: tasksError } = await supabase
      .from('vibe_tasks')
      .select(`
        id,
        title,
        description,
        priority,
        estimated_duration,
        due_date,
        scheduled_date,
        completed,
        vibe_projects(name)
      `)
      .eq('user_id', user.id)
      .eq('completed', false)
      .or(`scheduled_date.eq.${targetDate},scheduled_date.is.null,due_date.lte.${targetDate}`)
      .order('priority', { ascending: false })
      .order('due_date', { ascending: true });

    if (tasksError) {
      throw tasksError;
    }

    console.log('Found tasks for planning:', tasks?.length || 0);

    // Create the AI prompt
    const prompt = `You are an AI assistant helping a user plan their day efficiently. You have access to their Google Calendar events and a list of tasks that need to be scheduled.

CURRENT CONTEXT:
- Target Date: ${targetDate}
- Available Time: 9:00 AM to 6:00 PM
- Current Time: ${new Date().toLocaleTimeString()}

CALENDAR EVENTS:
${JSON.stringify(calendarEvents, null, 2)}

TASKS TO SCHEDULE:
${JSON.stringify(tasks, null, 2)}

PLANNING INSTRUCTIONS:
1. Analyze available time gaps between calendar events
2. Prioritize high-priority tasks and overdue items first
3. Consider task duration and energy levels throughout the day
4. Schedule demanding tasks during peak hours (9-11 AM, 2-4 PM)
5. Leave 15-minute buffers between tasks and events
6. Group similar tasks when possible
7. If tasks don't fit, suggest which to defer to tomorrow

OUTPUT FORMAT (respond ONLY with valid JSON):
{
  "dayPlan": [
    {
      "taskId": "string",
      "title": "string", 
      "startTime": "HH:MM",
      "endTime": "HH:MM",
      "rationale": "why this time slot was chosen"
    }
  ],
  "deferredTasks": [
    {
      "taskId": "string",
      "title": "string",
      "reason": "why this task should be deferred"
    }
  ],
  "insights": {
    "totalPlannedTime": "minutes",
    "availableTime": "minutes", 
    "efficiency": "high/medium/low",
    "recommendations": ["array of suggestions for better planning"]
  },
  "summary": "Brief overview of the day plan and key priorities"
}`;

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
            content: 'You are an expert productivity coach and day planner. Always respond with valid JSON only.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log('AI Day Plan Response:', aiResponse);

    let dayPlan;
    try {
      dayPlan = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      throw new Error('Invalid AI response format');
    }

    return new Response(JSON.stringify(dayPlan), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in plan-my-day function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      dayPlan: [],
      deferredTasks: [],
      insights: {
        totalPlannedTime: 0,
        availableTime: 0,
        efficiency: 'low',
        recommendations: ['Please try again']
      },
      summary: 'Planning failed due to an error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});