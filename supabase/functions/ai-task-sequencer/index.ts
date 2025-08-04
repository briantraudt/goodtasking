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
  estimated_duration: number;
  priority: 'high' | 'medium' | 'low';
  due_date?: string;
  project_id: string;
  vibe_projects?: { name: string };
}

interface CalendarEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  is_all_day: boolean;
}

interface TimeBlock {
  start: string;
  end: string;
  duration_minutes: number;
}

interface ScheduledTask {
  task_id: string;
  title: string;
  project_name: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  priority: string;
  reasoning: string;
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
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the authenticated user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) {
      throw new Error('User not authenticated');
    }

    const { 
      target_date, 
      work_start_hour = 9, 
      work_end_hour = 17, 
      break_duration = 60, 
      max_focus_time = 120,
      min_task_duration = 15 
    } = await req.json();

    console.log('AI Task Sequencer request:', { target_date, work_start_hour, work_end_hour });

    // Fetch calendar events for the target date
    const startOfDay = new Date(target_date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(target_date);
    endOfDay.setHours(23, 59, 59, 999);

    const { data: calendarEvents, error: calendarError } = await supabaseClient
      .from('calendar_events')
      .select('*')
      .eq('user_id', user.id)
      .gte('start_time', startOfDay.toISOString())
      .lte('start_time', endOfDay.toISOString())
      .order('start_time');

    if (calendarError) {
      console.error('Calendar events fetch error:', calendarError);
      throw calendarError;
    }

    // Fetch unscheduled tasks
    const { data: unscheduledTasks, error: tasksError } = await supabaseClient
      .from('vibe_tasks')
      .select(`
        *,
        vibe_projects (name)
      `)
      .eq('user_id', user.id)
      .eq('completed', false)
      .or('scheduled_date.is.null,start_time.is.null');

    if (tasksError) {
      console.error('Tasks fetch error:', tasksError);
      throw tasksError;
    }

    console.log('Fetched data:', { 
      calendarEvents: calendarEvents?.length, 
      unscheduledTasks: unscheduledTasks?.length 
    });

    // Calculate available time blocks
    const availableBlocks = calculateAvailableTimeBlocks(
      calendarEvents || [],
      target_date,
      work_start_hour,
      work_end_hour
    );

    console.log('Available time blocks:', availableBlocks);

    // Generate AI-powered schedule
    const scheduledTasks = await generateOptimalSchedule(
      unscheduledTasks || [],
      availableBlocks,
      {
        break_duration,
        max_focus_time,
        min_task_duration,
        target_date
      }
    );

    console.log('Generated schedule:', scheduledTasks);

    return new Response(JSON.stringify({
      success: true,
      scheduled_tasks: scheduledTasks,
      available_blocks: availableBlocks,
      total_scheduled: scheduledTasks.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-task-sequencer:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function calculateAvailableTimeBlocks(
  events: CalendarEvent[],
  targetDate: string,
  workStartHour: number,
  workEndHour: number
): TimeBlock[] {
  const date = new Date(targetDate);
  const workStart = new Date(date);
  workStart.setHours(workStartHour, 0, 0, 0);
  
  const workEnd = new Date(date);
  workEnd.setHours(workEndHour, 0, 0, 0);

  // Sort events by start time
  const sortedEvents = events
    .filter(event => !event.is_all_day)
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  const blocks: TimeBlock[] = [];
  let currentTime = workStart;

  for (const event of sortedEvents) {
    const eventStart = new Date(event.start_time);
    const eventEnd = new Date(event.end_time);

    // Add block before event if there's time
    if (currentTime < eventStart) {
      const duration = Math.floor((eventStart.getTime() - currentTime.getTime()) / (1000 * 60));
      if (duration >= 15) { // Minimum 15 minutes
        blocks.push({
          start: currentTime.toISOString(),
          end: eventStart.toISOString(),
          duration_minutes: duration
        });
      }
    }

    // Move current time to after the event
    currentTime = new Date(Math.max(currentTime.getTime(), eventEnd.getTime()));
  }

  // Add final block if there's time left
  if (currentTime < workEnd) {
    const duration = Math.floor((workEnd.getTime() - currentTime.getTime()) / (1000 * 60));
    if (duration >= 15) {
      blocks.push({
        start: currentTime.toISOString(),
        end: workEnd.toISOString(),
        duration_minutes: duration
      });
    }
  }

  return blocks;
}

async function generateOptimalSchedule(
  tasks: Task[],
  availableBlocks: TimeBlock[],
  preferences: {
    break_duration: number;
    max_focus_time: number;
    min_task_duration: number;
    target_date: string;
  }
): Promise<ScheduledTask[]> {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!openAIApiKey) {
    console.log('No OpenAI API key, using simple scheduling algorithm');
    return generateSimpleSchedule(tasks, availableBlocks);
  }

  try {
    const prompt = `You are an intelligent task scheduler. Given the following:

AVAILABLE TIME BLOCKS:
${availableBlocks.map(block => 
  `- ${new Date(block.start).toLocaleTimeString()} to ${new Date(block.end).toLocaleTimeString()} (${block.duration_minutes} minutes)`
).join('\n')}

UNSCHEDULED TASKS:
${tasks.map(task => 
  `- "${task.title}" (${task.vibe_projects?.name || 'No Project'}) - ${task.estimated_duration || 30} min, Priority: ${task.priority || 'medium'}${task.due_date ? `, Due: ${task.due_date}` : ''}`
).join('\n')}

SCHEDULING PREFERENCES:
- Maximum focus time: ${preferences.max_focus_time} minutes
- Minimum task duration: ${preferences.min_task_duration} minutes
- Break duration: ${preferences.break_duration} minutes
- Target date: ${preferences.target_date}

Please create an optimal schedule that:
1. Prioritizes high-priority and overdue tasks
2. Fits tasks into available time blocks
3. Respects maximum focus time limits
4. Groups similar tasks when possible
5. Leaves appropriate breaks between demanding tasks

Return a JSON array of scheduled tasks with this exact format:
[
  {
    "task_id": "task_id_here",
    "title": "task_title",
    "project_name": "project_name",
    "start_time": "2024-01-01T09:00:00.000Z",
    "end_time": "2024-01-01T09:30:00.000Z",
    "duration_minutes": 30,
    "priority": "high",
    "reasoning": "Brief explanation of why this task was scheduled here"
  }
]

Only include tasks that can actually fit in the available time blocks. Do not schedule tasks outside of available time.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an expert task scheduler that creates optimal daily schedules. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 2000
      }),
    });

    const data = await response.json();
    
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid OpenAI response');
    }

    const aiResponse = data.choices[0].message.content.trim();
    console.log('AI Response:', aiResponse);

    // Parse the JSON response
    const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in AI response');
    }

    const scheduledTasks = JSON.parse(jsonMatch[0]);
    
    // Validate and ensure all required fields
    return scheduledTasks.map((task: any) => ({
      task_id: task.task_id,
      title: task.title,
      project_name: task.project_name || 'No Project',
      start_time: task.start_time,
      end_time: task.end_time,
      duration_minutes: task.duration_minutes,
      priority: task.priority,
      reasoning: task.reasoning || 'AI scheduled task'
    }));

  } catch (error) {
    console.error('OpenAI scheduling error:', error);
    console.log('Falling back to simple scheduling');
    return generateSimpleSchedule(tasks, availableBlocks);
  }
}

function generateSimpleSchedule(
  tasks: Task[],
  availableBlocks: TimeBlock[]
): ScheduledTask[] {
  const scheduledTasks: ScheduledTask[] = [];
  
  // Sort tasks by priority and due date
  const sortedTasks = [...tasks].sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 2;
    const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 2;
    
    if (aPriority !== bPriority) return bPriority - aPriority;
    
    // If same priority, sort by due date
    if (a.due_date && b.due_date) {
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    }
    if (a.due_date) return -1;
    if (b.due_date) return 1;
    
    return 0;
  });

  let blockIndex = 0;
  let currentBlockTime = availableBlocks[0] ? new Date(availableBlocks[0].start) : null;

  for (const task of sortedTasks) {
    const taskDuration = task.estimated_duration || 30;
    
    // Find a suitable time block
    while (blockIndex < availableBlocks.length) {
      const block = availableBlocks[blockIndex];
      const blockStart = new Date(block.start);
      const blockEnd = new Date(block.end);
      
      if (!currentBlockTime || currentBlockTime < blockStart) {
        currentBlockTime = blockStart;
      }
      
      const taskEndTime = new Date(currentBlockTime.getTime() + taskDuration * 60 * 1000);
      
      // Check if task fits in current block
      if (taskEndTime <= blockEnd) {
        scheduledTasks.push({
          task_id: task.id,
          title: task.title,
          project_name: task.vibe_projects?.name || 'No Project',
          start_time: currentBlockTime.toISOString(),
          end_time: taskEndTime.toISOString(),
          duration_minutes: taskDuration,
          priority: task.priority || 'medium',
          reasoning: 'Simple scheduling algorithm'
        });
        
        currentBlockTime = taskEndTime;
        break;
      } else {
        // Move to next block
        blockIndex++;
        currentBlockTime = blockIndex < availableBlocks.length ? 
          new Date(availableBlocks[blockIndex].start) : null;
      }
    }
    
    if (blockIndex >= availableBlocks.length) break;
  }
  
  return scheduledTasks;
}