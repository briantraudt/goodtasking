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

    const { userMessage, conversationHistory, conversationState, tasks, calendarEvents, targetDate } = await req.json();

    console.log('AI Daily Planner request:', { userMessage, conversationState, targetDate });

    // Get current time for context
    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });

    // Filter relevant tasks (due today, overdue, or high priority)
    const today = new Date(targetDate);
    const relevantTasks = tasks.filter(task => {
      if (task.completed) return false;
      
      const dueDate = task.due_date ? new Date(task.due_date) : null;
      const isOverdue = dueDate && dueDate < today;
      const isDueToday = dueDate && dueDate.toDateString() === today.toDateString();
      const isHighPriority = task.priority === 'high';
      
      return isOverdue || isDueToday || isHighPriority;
    });

    // Create system prompt based on conversation state
    let systemPrompt = '';
    
    if (conversationState === 'greeting' || conversationState === 'collecting') {
      systemPrompt = `You are a friendly, intelligent daily planning assistant. Your role is to help users plan their day effectively.

Current Context:
- Date: ${targetDate}
- Current time: ${currentTime}
- User has ${relevantTasks.length} relevant tasks
- User has ${calendarEvents.length} calendar events today

CONVERSATION FLOW:
1. GREETING: Welcome the user warmly and ask what they want to accomplish
2. COLLECTING: Gather goals, ask follow-up questions about:
   - Time estimates for tasks
   - Flexibility/urgency
   - Preferences for timing
   - Energy levels throughout day
3. PLANNING: Analyze and create schedule
4. APPROVAL: Present plan for user approval

CURRENT STAGE: ${conversationState}

GUIDELINES:
- Be conversational and supportive
- Ask one question at a time
- Reference their existing tasks when relevant
- Consider calendar conflicts
- Help estimate realistic time blocks
- If user seems ready to plan, ask "Should I create your daily schedule now?"

Relevant Tasks Available:
${relevantTasks.map(task => `- ${task.title} (${task.projectName}) - Priority: ${task.priority || 'medium'}`).join('\n')}

Calendar Events Today:
${calendarEvents.map(event => `- ${event.title}: ${event.start} - ${event.end}`).join('\n')}

Keep responses concise and engaging. Guide the conversation toward planning when appropriate.`;
    } else if (conversationState === 'planning') {
      systemPrompt = `You are a daily planning assistant creating an optimized schedule.

TASK: Create a detailed daily schedule for ${targetDate}

USER CONTEXT:
${conversationHistory}

AVAILABLE TASKS:
${tasks.map(task => `- ID: ${task.id}, Title: ${task.title}, Project: ${task.projectName}, Priority: ${task.priority || 'medium'}, Due: ${task.due_date || 'No due date'}`).join('\n')}

CALENDAR EVENTS:
${calendarEvents.map(event => `- ${event.title}: ${event.start} - ${event.end}`).join('\n')}

INSTRUCTIONS:
1. Analyze user goals from conversation
2. Match with available tasks
3. Consider calendar conflicts
4. Create realistic time blocks (30min minimum)
5. Include breaks between tasks
6. Prioritize by urgency and user preferences

RESPONSE FORMAT:
{
  "message": "Here's your optimized schedule for today...",
  "scheduledTasks": [
    {
      "taskId": "task_id",
      "title": "Task Title",
      "projectName": "Project Name",
      "startTime": "09:00",
      "endTime": "10:30",
      "priority": "high",
      "rationale": "Scheduled early when energy is high"
    }
  ],
  "unassignedTasks": [
    {
      "taskId": "task_id",
      "title": "Task Title", 
      "reason": "Not enough time available"
    }
  ],
  "awaitingApproval": true
}

Respond ONLY with valid JSON.`;
    }

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
            content: userMessage 
          }
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log('AI Response:', aiResponse);

    // Try to parse as JSON for planning responses
    if (conversationState === 'planning') {
      try {
        const parsedResponse = JSON.parse(aiResponse);
        return new Response(JSON.stringify(parsedResponse), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (parseError) {
        console.error('Failed to parse planning response:', parseError);
        // Fallback to simple message
      }
    }

    // Default response for conversation
    return new Response(JSON.stringify({
      message: aiResponse,
      awaitingApproval: false,
      planComplete: false
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-daily-planner function:', error);
    return new Response(JSON.stringify({ 
      message: 'Sorry, I encountered an error. Please try again.',
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});