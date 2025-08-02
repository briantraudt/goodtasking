import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Task {
  id: string;
  title: string;
  completed: boolean;
  project_id: string;
}

interface Project {
  id: string;
  name: string;
  tasks: Task[];
}

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

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const { targetDate } = await req.json();
    
    // If no target date provided, use today
    const analysisDate = targetDate || new Date().toISOString().split('T')[0];
    
    console.log(`Analyzing tasks for date: ${analysisDate}`);

    // Fetch projects scheduled for the target date
    const { data: projects, error: projectsError } = await supabase
      .from('vibe_projects')
      .select('id, name, scheduled_day')
      .eq('scheduled_day', analysisDate);

    if (projectsError) {
      console.error('Error fetching projects:', projectsError);
      throw projectsError;
    }

    if (!projects || projects.length === 0) {
      return new Response(JSON.stringify({
        summary: "You have a clear day today! No tasks are scheduled. Perfect time to tackle unscheduled work or take a well-deserved break.",
        priority: null,
        reasoning: "No tasks found for today",
        taskCount: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch all tasks for these projects
    const projectIds = projects.map(p => p.id);
    const { data: tasks, error: tasksError } = await supabase
      .from('vibe_tasks')
      .select('id, title, completed, project_id')
      .in('project_id', projectIds)
      .eq('completed', false); // Only get incomplete tasks

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      throw tasksError;
    }

    // Group tasks by project
    const projectsWithTasks: Project[] = projects.map(project => ({
      id: project.id,
      name: project.name,
      tasks: (tasks || []).filter(task => task.project_id === project.id)
    })).filter(project => project.tasks.length > 0); // Only include projects with tasks

    const totalTasks = projectsWithTasks.reduce((sum, project) => sum + project.tasks.length, 0);

    if (totalTasks === 0) {
      return new Response(JSON.stringify({
        summary: "All your tasks for today are complete! 🎉 Great job staying on top of your work.",
        priority: null,
        reasoning: "All tasks completed",
        taskCount: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Prepare data for AI analysis
    const taskContext = projectsWithTasks.map(project => 
      `Project: ${project.name}\nTasks: ${project.tasks.map(t => `- ${t.title}`).join('\n')}`
    ).join('\n\n');

    // Call OpenAI GPT-4 for intelligent analysis
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
            content: `You are a productivity assistant helping users prioritize their daily tasks. Analyze the tasks and provide:
1. A friendly daily summary mentioning the task count and brief overview
2. The single highest priority task with reasoning
3. Keep the tone encouraging and actionable

Focus on these priority indicators:
- Tasks with action words like "start", "begin", "launch", "submit", "complete", "finish"
- Keywords suggesting urgency: "urgent", "important", "deadline", "due", "meeting"
- Project kickoffs or first tasks in a sequence
- Time-sensitive activities
- Dependencies that might block other work

Respond in JSON format:
{
  "summary": "A friendly 1-2 sentence overview of the day",
  "priority": "The single most important task title",
  "reasoning": "Brief explanation why this task should be the priority",
  "projectName": "Name of the project containing the priority task"
}`
          },
          {
            role: 'user',
            content: `Today's tasks:\n\n${taskContext}`
          }
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    const aiData = await response.json();
    
    if (!response.ok) {
      console.error('OpenAI API error:', aiData);
      throw new Error(`OpenAI API error: ${aiData.error?.message || 'Unknown error'}`);
    }

    const aiResponse = JSON.parse(aiData.choices[0].message.content);

    // Add task count to the response
    const result = {
      ...aiResponse,
      taskCount: totalTasks,
      projects: projectsWithTasks.map(p => ({ name: p.name, taskCount: p.tasks.length }))
    };

    console.log('AI Analysis Result:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-daily-tasks function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      summary: "Unable to analyze tasks at the moment. Please try again later.",
      priority: null,
      reasoning: "Analysis service temporarily unavailable"
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});