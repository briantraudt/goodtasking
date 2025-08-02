import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    const { taskInput } = await req.json();
    
    if (!taskInput || taskInput.trim().length === 0) {
      throw new Error('No task input provided');
    }

    console.log('Processing task input:', taskInput);

    // Call OpenAI GPT-4 to analyze and sequence tasks
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
            content: `You are an expert productivity assistant that helps people organize their daily tasks efficiently. 

Your job is to:
1. Parse the user's task input and identify individual tasks
2. Sequence them in the most logical and time-efficient order
3. Consider dependencies, energy levels, and optimal timing
4. Provide brief reasoning for the sequence

Rules for sequencing:
- Start with quick wins or preparatory tasks
- Group similar tasks together to maintain focus
- Consider energy levels (harder tasks when fresh, easier ones later)
- Handle dependencies (tasks that must be done before others)
- Be practical about time estimates
- Aim for steady progress and momentum

Respond in JSON format:
{
  "tasks": [
    {
      "title": "Clear, actionable task title",
      "description": "Brief description if needed for clarity",
      "estimatedMinutes": 30,
      "reasoning": "Why this task is positioned here"
    }
  ],
  "overallStrategy": "Brief explanation of the sequencing strategy used",
  "totalEstimatedTime": "Total time in minutes"
}`
          },
          {
            role: 'user',
            content: `Here's what I need to get done today:\n\n${taskInput}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    const aiData = await response.json();
    
    if (!response.ok) {
      console.error('OpenAI API error:', aiData);
      throw new Error(`OpenAI API error: ${aiData.error?.message || 'Unknown error'}`);
    }

    const aiResponse = JSON.parse(aiData.choices[0].message.content);

    // Validate the response structure
    if (!aiResponse.tasks || !Array.isArray(aiResponse.tasks)) {
      throw new Error('Invalid AI response structure');
    }

    // Add sequence numbers and IDs to tasks
    const sequencedTasks = aiResponse.tasks.map((task, index) => ({
      id: `ai-task-${index + 1}`,
      sequenceNumber: index + 1,
      ...task,
      completed: false,
      startedAt: null,
      completedAt: null
    }));

    const result = {
      ...aiResponse,
      tasks: sequencedTasks,
      sessionId: `ai-session-${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    console.log('AI Task Sequence Result:', {
      taskCount: result.tasks.length,
      totalTime: result.totalEstimatedTime,
      strategy: result.overallStrategy
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-task-sequencer function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      tasks: [],
      overallStrategy: "Unable to process tasks at the moment. Please try again.",
      totalEstimatedTime: 0
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});