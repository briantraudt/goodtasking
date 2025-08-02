import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WeeklyStats {
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  topProject: string;
  projectDistribution: { [key: string]: number };
  scheduledTasks: number;
  unscheduledTasks: number;
  streakDays: number;
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

    console.log('Generating weekly review for user:', user.id);

    // Check if user has AI assistant enabled
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('ai_assistant_enabled')
      .eq('user_id', user.id)
      .single();

    if (!profile?.ai_assistant_enabled) {
      return new Response(
        JSON.stringify({ review: null, message: 'AI assistant is not enabled' }), 
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Calculate current week dates
    const today = new Date();
    const currentWeek = getWeekNumber(today);
    const currentYear = today.getFullYear();
    const weekKey = `${currentYear}-W${currentWeek}`;

    // Check for forced refresh
    const { forceRefresh } = await req.json().catch(() => ({ forceRefresh: false }));

    // Check if we already have a review for this week
    const { data: existingReview } = await supabaseClient
      .from('weekly_reviews')
      .select('review, stats, created_at')
      .eq('user_id', user.id)
      .eq('week_key', weekKey)
      .single();

    if (existingReview && !forceRefresh) {
      console.log('Returning cached weekly review for user:', user.id);
      return new Response(
        JSON.stringify({ 
          review: existingReview.review,
          stats: existingReview.stats,
          cached: true,
          generatedAt: existingReview.created_at
        }), 
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Calculate date range for the past 7 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 6); // Past 7 days including today

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    console.log('Analyzing week from', startDateStr, 'to', endDateStr);

    // Get all tasks from the past week with project information
    const { data: weekTasks, error: tasksError } = await supabaseClient
      .from('vibe_tasks')
      .select(`
        id,
        title,
        completed,
        scheduled_date,
        created_at,
        vibe_projects!inner(name)
      `)
      .eq('user_id', user.id)
      .or(`scheduled_date.gte.${startDateStr},scheduled_date.lte.${endDateStr},scheduled_date.is.null`)
      .gte('created_at', startDate.toISOString());

    if (tasksError) {
      console.error('Error fetching week tasks:', tasksError);
      throw tasksError;
    }

    console.log('Found tasks for analysis:', weekTasks?.length || 0);

    // Calculate weekly statistics
    const stats = calculateWeeklyStats(weekTasks || []);
    
    // Calculate completion streak
    const streakDays = await calculateCompletionStreak(supabaseClient, user.id, endDate);
    stats.streakDays = streakDays;

    // Generate AI prompt
    const weeklyPrompt = generateWeeklyPrompt(stats, weekTasks || []);

    // Call OpenAI API
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log('Calling OpenAI API for weekly review...');

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
            content: 'You are a helpful productivity coach that provides encouraging, insightful weekly reviews. Be positive but honest about areas for improvement. Focus on actionable advice and specific recommendations.' 
          },
          { role: 'user', content: weeklyPrompt }
        ],
        temperature: 0.7,
        max_tokens: 400,
      }),
    });

    if (!openAIResponse.ok) {
      console.error('OpenAI API error:', await openAIResponse.text());
      throw new Error('Failed to generate AI weekly review');
    }

    const openAIData = await openAIResponse.json();
    const review = openAIData.choices[0].message.content;

    console.log('Generated weekly review:', review);

    // Save the review to database
    const { error: saveError } = await supabaseClient
      .from('weekly_reviews')
      .upsert({
        user_id: user.id,
        week_key: weekKey,
        review: review,
        stats: stats,
        week_start: startDateStr,
        week_end: endDateStr
      }, {
        onConflict: 'user_id,week_key'
      });

    if (saveError) {
      console.error('Error saving weekly review:', saveError);
      // Don't throw error, just log it - we can still return the review
    }

    return new Response(
      JSON.stringify({ 
        review,
        stats,
        cached: false,
        weekKey,
        generatedAt: new Date().toISOString()
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in generate-weekly-review function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        review: null 
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function calculateWeeklyStats(tasks: any[]): WeeklyStats {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.completed).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const scheduledTasks = tasks.filter(task => task.scheduled_date).length;
  const unscheduledTasks = totalTasks - scheduledTasks;

  // Calculate project distribution
  const projectCounts: { [key: string]: number } = {};
  tasks.forEach(task => {
    const projectName = task.vibe_projects.name;
    projectCounts[projectName] = (projectCounts[projectName] || 0) + 1;
  });

  // Find top project
  const topProject = Object.keys(projectCounts).reduce((a, b) => 
    projectCounts[a] > projectCounts[b] ? a : b, 'None'
  );

  return {
    totalTasks,
    completedTasks,
    completionRate,
    topProject,
    projectDistribution: projectCounts,
    scheduledTasks,
    unscheduledTasks,
    streakDays: 0 // Will be calculated separately
  };
}

async function calculateCompletionStreak(supabaseClient: any, userId: string, endDate: Date): Promise<number> {
  let streakDays = 0;
  const currentDate = new Date(endDate);
  
  // Check the last 14 days to find completion streak
  for (let i = 0; i < 14; i++) {
    const checkDate = new Date(currentDate);
    checkDate.setDate(currentDate.getDate() - i);
    const checkDateStr = checkDate.toISOString().split('T')[0];
    
    const { data: dayTasks } = await supabaseClient
      .from('vibe_tasks')
      .select('completed')
      .eq('user_id', userId)
      .eq('scheduled_date', checkDateStr);
    
    if (!dayTasks || dayTasks.length === 0) {
      // No tasks scheduled for this day, continue streak
      continue;
    }
    
    const hasCompletedTask = dayTasks.some((task: any) => task.completed);
    if (hasCompletedTask) {
      streakDays++;
    } else {
      break; // Streak broken
    }
  }
  
  return streakDays;
}

function generateWeeklyPrompt(stats: WeeklyStats, tasks: any[]): string {
  const projectList = Object.entries(stats.projectDistribution)
    .map(([project, count]) => `${project}: ${count} tasks`)
    .join(', ');

  const uncompletedTasks = tasks
    .filter(task => !task.completed)
    .slice(0, 3) // Show up to 3 uncompleted tasks
    .map(task => task.title);

  return `You are a helpful productivity coach analyzing a user's weekly performance.

WEEKLY STATS:
- Total tasks: ${stats.totalTasks}
- Completed: ${stats.completedTasks}/${stats.totalTasks} (${stats.completionRate}%)
- Top project: ${stats.topProject}
- Project distribution: ${projectList}
- Scheduled vs unscheduled: ${stats.scheduledTasks} scheduled, ${stats.unscheduledTasks} unscheduled
- Completion streak: ${stats.streakDays} days

AREAS TO ANALYZE:
${uncompletedTasks.length > 0 ? `- Uncompleted tasks: ${uncompletedTasks.join(', ')}` : '- All scheduled tasks completed! 🎉'}
- Task scheduling habits (${Math.round((stats.scheduledTasks / stats.totalTasks) * 100)}% of tasks were scheduled)

Provide a brief 4-5 sentence weekly review that:
1. Celebrates wins and progress
2. Identifies patterns or areas for improvement
3. Gives one specific, actionable recommendation for next week
4. Maintains an encouraging, coaching tone

Keep it concise but insightful. Use emojis sparingly but effectively.`;
}