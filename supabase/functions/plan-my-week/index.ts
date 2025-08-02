import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TaskSuggestion {
  taskName: string;
  project: string;
  projectId: string;
  suggestedDate: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
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

    console.log('Generating weekly plan for user:', user.id);

    // Check if user has AI assistant enabled
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('ai_assistant_enabled')
      .eq('user_id', user.id)
      .single();

    if (!profile?.ai_assistant_enabled) {
      return new Response(
        JSON.stringify({ suggestions: [], message: 'AI assistant is not enabled' }), 
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Calculate date ranges
    const today = new Date();
    const startOfLastWeek = new Date();
    startOfLastWeek.setDate(today.getDate() - 13); // 2 weeks ago
    const endOfLastWeek = new Date();
    endOfLastWeek.setDate(today.getDate() - 1); // Yesterday

    const startOfNextWeek = new Date();
    startOfNextWeek.setDate(today.getDate() + (7 - today.getDay())); // Next Sunday
    const endOfNextWeek = new Date(startOfNextWeek);
    endOfNextWeek.setDate(startOfNextWeek.getDate() + 6); // Next Saturday

    console.log('Analyzing period:', startOfLastWeek.toISOString().split('T')[0], 'to', endOfLastWeek.toISOString().split('T')[0]);

    // Get user's projects with task counts
    const { data: projects, error: projectsError } = await supabaseClient
      .from('vibe_projects')
      .select(`
        id,
        name,
        description,
        created_at
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (projectsError) {
      console.error('Error fetching projects:', projectsError);
      throw projectsError;
    }

    // Get tasks from the last 2 weeks
    const { data: recentTasks, error: tasksError } = await supabaseClient
      .from('vibe_tasks')
      .select(`
        id,
        title,
        completed,
        scheduled_date,
        created_at,
        project_id,
        vibe_projects!inner(name)
      `)
      .eq('user_id', user.id)
      .gte('created_at', startOfLastWeek.toISOString())
      .order('created_at', { ascending: false });

    if (tasksError) {
      console.error('Error fetching recent tasks:', tasksError);
      throw tasksError;
    }

    // Get tasks already scheduled for next week
    const { data: nextWeekTasks } = await supabaseClient
      .from('vibe_tasks')
      .select('scheduled_date, title')
      .eq('user_id', user.id)
      .gte('scheduled_date', startOfNextWeek.toISOString().split('T')[0])
      .lte('scheduled_date', endOfNextWeek.toISOString().split('T')[0]);

    console.log('Found projects:', projects?.length || 0);
    console.log('Found recent tasks:', recentTasks?.length || 0);
    console.log('Tasks already scheduled next week:', nextWeekTasks?.length || 0);

    // Analyze user patterns
    const analysis = analyzeUserPatterns(recentTasks || [], projects || []);
    
    // Generate AI suggestions
    const aiSuggestions = await generateAISuggestions(
      analysis, 
      projects || [], 
      nextWeekTasks || [],
      startOfNextWeek,
      endOfNextWeek
    );

    return new Response(
      JSON.stringify({ 
        suggestions: aiSuggestions,
        analysis,
        weekRange: {
          start: startOfNextWeek.toISOString().split('T')[0],
          end: endOfNextWeek.toISOString().split('T')[0]
        }
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in plan-my-week function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        suggestions: [] 
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function analyzeUserPatterns(tasks: any[], projects: any[]) {
  const completedTasks = tasks.filter(task => task.completed);
  const missedTasks = tasks.filter(task => !task.completed && task.scheduled_date);
  
  // Project activity analysis
  const projectActivity: { [key: string]: { total: number, completed: number, name: string } } = {};
  projects.forEach(project => {
    projectActivity[project.id] = { total: 0, completed: 0, name: project.name };
  });

  tasks.forEach(task => {
    if (projectActivity[task.project_id]) {
      projectActivity[task.project_id].total++;
      if (task.completed) {
        projectActivity[task.project_id].completed++;
      }
    }
  });

  // Find most and least active projects
  const sortedProjects = Object.entries(projectActivity)
    .sort(([,a], [,b]) => b.total - a.total);

  const mostActiveProject = sortedProjects[0];
  const underutilizedProjects = sortedProjects.filter(([,data]) => data.total < 3);

  return {
    totalTasks: tasks.length,
    completedTasks: completedTasks.length,
    missedTasks: missedTasks.length,
    completionRate: tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0,
    mostActiveProject: mostActiveProject ? { id: mostActiveProject[0], ...mostActiveProject[1] } : null,
    underutilizedProjects: underutilizedProjects.map(([id, data]) => ({ id, ...data })),
    missedTaskTitles: missedTasks.slice(0, 5).map(task => task.title),
    commonTaskPatterns: extractCommonPatterns(completedTasks)
  };
}

function extractCommonPatterns(tasks: any[]): string[] {
  const patterns: { [key: string]: number } = {};
  
  tasks.forEach(task => {
    const title = task.title.toLowerCase();
    // Look for common action words
    const actionWords = ['follow up', 'review', 'update', 'call', 'email', 'meeting', 'plan', 'prepare'];
    actionWords.forEach(action => {
      if (title.includes(action)) {
        patterns[action] = (patterns[action] || 0) + 1;
      }
    });
  });

  return Object.entries(patterns)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([pattern]) => pattern);
}

async function generateAISuggestions(
  analysis: any, 
  projects: any[], 
  existingTasks: any[], 
  weekStart: Date, 
  weekEnd: Date
): Promise<TaskSuggestion[]> {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const projectList = projects.map(p => `- ${p.name} (ID: ${p.id})`).join('\n');
  const existingTasksList = existingTasks.map(t => `- ${t.title} (${t.scheduled_date})`).join('\n');
  const weekDates = generateWeekDates(weekStart, weekEnd);

  const prompt = `You are a weekly planning assistant. Based on the user's task history and patterns, suggest 5-8 tasks for the upcoming week.

USER ANALYSIS:
- Total recent tasks: ${analysis.totalTasks}
- Completion rate: ${analysis.completionRate}%
- Missed tasks: ${analysis.missedTasks} (examples: ${analysis.missedTaskTitles.join(', ')})
- Most active project: ${analysis.mostActiveProject?.name || 'None'}
- Underutilized projects: ${analysis.underutilizedProjects.map((p: any) => p.name).join(', ')}
- Common task patterns: ${analysis.commonTaskPatterns.join(', ')}

AVAILABLE PROJECTS:
${projectList}

ALREADY SCHEDULED NEXT WEEK:
${existingTasksList || 'No tasks scheduled yet'}

WEEK DATES TO SCHEDULE:
${weekDates.map(d => `- ${d.date} (${d.day})`).join('\n')}

INSTRUCTIONS:
1. Suggest 5-8 productive tasks for next week
2. Prioritize follow-ups on missed tasks if relevant
3. Balance between active and underutilized projects
4. Distribute tasks across the week (avoid clustering on Monday)
5. Include mix of routine tasks and project advancement
6. Consider their completion rate - if low, suggest fewer, easier tasks
7. If completion rate is high, include some stretch/ambitious tasks

OUTPUT FORMAT (valid JSON only):
[
  {
    "taskName": "Follow up on client proposal",
    "project": "Work Project Name",
    "projectId": "actual-project-id-from-list",
    "suggestedDate": "2025-08-05",
    "reason": "Follow up on missed task from last week",
    "priority": "high"
  }
]

Return ONLY the JSON array, no additional text.`;

  console.log('Calling OpenAI for task suggestions...');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4.1-2025-04-14',
      messages: [
        { role: 'system', content: 'You are a helpful weekly planning assistant that returns only valid JSON arrays of task suggestions.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 800,
    }),
  });

  if (!response.ok) {
    console.error('OpenAI API error:', await response.text());
    throw new Error('Failed to generate task suggestions');
  }

  const data = await response.json();
  const content = data.choices[0].message.content.trim();
  
  try {
    // Clean up the response in case it has markdown formatting
    const jsonContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const suggestions = JSON.parse(jsonContent);
    
    console.log('Generated suggestions:', suggestions.length);
    return suggestions;
  } catch (parseError) {
    console.error('Error parsing AI response:', parseError, 'Content:', content);
    // Return fallback suggestions if AI response can't be parsed
    return generateFallbackSuggestions(projects, weekStart);
  }
}

function generateWeekDates(start: Date, end: Date) {
  const dates = [];
  const current = new Date(start);
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  while (current <= end) {
    dates.push({
      date: current.toISOString().split('T')[0],
      day: dayNames[current.getDay()]
    });
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function generateFallbackSuggestions(projects: any[], weekStart: Date): TaskSuggestion[] {
  if (projects.length === 0) return [];
  
  const fallbackTasks = [
    'Review project progress',
    'Plan upcoming tasks', 
    'Follow up on pending items',
    'Organize workspace',
    'Weekly review and reflection'
  ];

  return fallbackTasks.slice(0, Math.min(5, projects.length)).map((task, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index + 1); // Start from Monday
    
    return {
      taskName: task,
      project: projects[index % projects.length].name,
      projectId: projects[index % projects.length].id,
      suggestedDate: date.toISOString().split('T')[0],
      reason: 'General productivity suggestion',
      priority: 'medium' as const
    };
  });
}