import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Task {
  id: string;
  title: string;
  project_name: string;
  completed: boolean;
  scheduled_date: string;
}

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

    console.log('Generating daily summary for user:', user.id);

    // Check if user has AI assistant enabled
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('ai_assistant_enabled')
      .eq('user_id', user.id)
      .single();

    if (!profile?.ai_assistant_enabled) {
      return new Response(
        JSON.stringify({ summary: null, message: 'AI assistant is not enabled' }), 
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    // Check if we already have a summary for today
    const { data: existingSummary } = await supabaseClient
      .from('daily_summaries')
      .select('summary, created_at')
      .eq('user_id', user.id)
      .eq('summary_date', today)
      .single();

    // If we have a summary from today and it's not a forced refresh, return it
    const { forceRefresh } = await req.json().catch(() => ({ forceRefresh: false }));
    
    if (existingSummary && !forceRefresh) {
      console.log('Returning cached summary for user:', user.id);
      return new Response(
        JSON.stringify({ 
          summary: existingSummary.summary,
          cached: true,
          generatedAt: existingSummary.created_at
        }), 
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get today's tasks with project information
    const { data: tasks, error: tasksError } = await supabaseClient
      .from('vibe_tasks')
      .select(`
        id,
        title,
        completed,
        scheduled_date,
        vibe_projects!inner(name)
      `)
      .eq('user_id', user.id)
      .eq('scheduled_date', today);

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      throw tasksError;
    }

    console.log('Found tasks for today:', tasks?.length || 0);

    // Get completion stats from last 7 days for context
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const { data: recentTasks } = await supabaseClient
      .from('vibe_tasks')
      .select('completed')
      .eq('user_id', user.id)
      .gte('scheduled_date', sevenDaysAgo.toISOString().split('T')[0]);

    const totalRecentTasks = recentTasks?.length || 0;
    const completedRecentTasks = recentTasks?.filter(t => t.completed).length || 0;
    const completionRate = totalRecentTasks > 0 ? Math.round((completedRecentTasks / totalRecentTasks) * 100) : 0;

    // Format tasks for the AI prompt
    const taskList = tasks?.map((task: any) => 
      `- ${task.title} (Project: ${task.vibe_projects.name})${task.completed ? ' ✅ Completed' : ''}`
    ).join('\n') || 'No tasks scheduled for today';

    const todayFormatted = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    // Create AI prompt
    const prompt = `You are a helpful productivity assistant. Today is ${todayFormatted}.

The user has the following tasks scheduled for today:
${taskList}

Additional context:
- User's recent completion rate: ${completionRate}% (${completedRecentTasks}/${totalRecentTasks} tasks completed in the last 7 days)
- Number of tasks today: ${tasks?.length || 0}

Please provide a personalized daily focus summary. Include:
1. A brief prioritization of their tasks based on typical productivity principles
2. An encouraging and motivating tone
3. A specific recommendation for their top priority task
4. Keep it concise (3-4 sentences maximum)

If they have no tasks, encourage them to plan their day or acknowledge their open schedule.`;

    // Call OpenAI API
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log('Calling OpenAI API...');

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { 
            role: 'system', 
            content: 'You are a helpful productivity assistant that provides encouraging, concise daily summaries. Be positive, specific, and actionable.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!openAIResponse.ok) {
      console.error('OpenAI API error:', await openAIResponse.text());
      throw new Error('Failed to generate AI summary');
    }

    const openAIData = await openAIResponse.json();
    const summary = openAIData.choices[0].message.content;

    console.log('Generated summary:', summary);

    // Save the summary to database (upsert to handle refresh case)
    const { error: saveError } = await supabaseClient
      .from('daily_summaries')
      .upsert({
        user_id: user.id,
        summary_date: today,
        summary: summary,
        task_count: tasks?.length || 0,
        completion_rate: completionRate
      }, {
        onConflict: 'user_id,summary_date'
      });

    if (saveError) {
      console.error('Error saving summary:', saveError);
      // Don't throw error, just log it - we can still return the summary
    }

    return new Response(
      JSON.stringify({ 
        summary,
        cached: false,
        taskCount: tasks?.length || 0,
        completionRate,
        generatedAt: new Date().toISOString()
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in generate-daily-summary function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        summary: null 
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});