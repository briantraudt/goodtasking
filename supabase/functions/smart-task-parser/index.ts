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

    const { text, currentDate, currentTime, existingProjects } = await req.json();

    console.log('Smart task parser request:', { text, currentDate, currentTime });

    // Create system prompt for parsing natural language tasks
    const systemPrompt = `You are an expert at parsing natural language text into structured task data. Your job is to extract task information from user input and convert it into a structured format.

CURRENT CONTEXT:
- Today's date: ${currentDate}
- Current time: ${currentTime}
- Day of week: ${new Date(currentDate).toLocaleDateString('en-US', { weekday: 'long' })}

EXISTING PROJECTS:
${existingProjects.map(p => `- ${p.name} (${p.category})`).join('\n')}

PARSING RULES:
1. Extract task title (main action/event)
2. Determine date (support relative terms like "tomorrow", "Monday", "next week")
3. Extract time (convert to 24-hour format HH:MM)
4. Calculate end time if duration is mentioned
5. Determine priority if mentioned (high/medium/low)
6. Suggest project based on task content and existing projects
7. Assign confidence score (0.0-1.0) based on clarity of input

RESPONSE FORMAT (JSON only):
{
  "tasks": [
    {
      "title": "extracted task title",
      "date": "YYYY-MM-DD",
      "startTime": "HH:MM",
      "endTime": "HH:MM",
      "duration": 60,
      "priority": "medium",
      "projectSuggestion": "suggested project name",
      "confidence": 0.95,
      "originalText": "original input text"
    }
  ]
}

EXAMPLES:
- "Meeting with John tomorrow at 2pm" → date: tomorrow's date, startTime: "14:00", title: "Meeting with John"
- "Gym workout Monday 7am for 1 hour" → date: next Monday, startTime: "07:00", endTime: "08:00", duration: 60
- "Doctor appointment Friday at 10:30am" → date: this/next Friday, startTime: "10:30"

Handle multiple tasks if the input contains them. Always respond with valid JSON.`;

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
            content: systemPrompt
          },
          { 
            role: 'user', 
            content: `Parse this text into structured task data: "${text}"` 
          }
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

    let parsedTasks;
    try {
      parsedTasks = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Fallback response
      parsedTasks = {
        tasks: [{
          title: text,
          date: currentDate,
          confidence: 0.5,
          originalText: text,
          projectSuggestion: "General"
        }]
      };
    }

    // Validate and enhance the parsed data
    if (parsedTasks.tasks) {
      parsedTasks.tasks = parsedTasks.tasks.map(task => ({
        ...task,
        originalText: text,
        confidence: Math.min(Math.max(task.confidence || 0.7, 0.0), 1.0)
      }));
    }

    return new Response(JSON.stringify(parsedTasks), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in smart-task-parser function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      tasks: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});