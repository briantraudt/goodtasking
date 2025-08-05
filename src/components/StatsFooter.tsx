import React from 'react';
import { Calendar, CheckSquare, Clock } from 'lucide-react';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';

interface Project {
  id: string;
  name: string;
  tasks: Array<{
    id: string;
    title: string;
    completed: boolean;
    scheduled_date?: string | null;
    start_time?: string | null;
    end_time?: string | null;
  }>;
}

interface StatsFooterProps {
  projects: Project[];
}

const StatsFooter = ({ projects }: StatsFooterProps) => {
  const { events, isConnected } = useGoogleCalendar();

  // Calculate scheduled tasks for today
  const today = new Date().toISOString().split('T')[0];
  const scheduledTasks = projects.flatMap(project => 
    project.tasks.filter(task => 
      !task.completed && 
      task.scheduled_date === today &&
      task.start_time && 
      task.end_time
    )
  );

  // Calculate calendar events for today
  const todayEvents = events.filter(event => {
    const eventDate = new Date(event.start).toLocaleDateString('en-CA');
    return eventDate === today;
  });

  // Calculate total time blocks (scheduled tasks + calendar events)
  const totalBlocks = scheduledTasks.length + todayEvents.length;

  const handleCalendarEventsClick = () => {
    const calendarSection = document.querySelector('[data-calendar-section]');
    if (calendarSection) {
      calendarSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleScheduledTasksClick = () => {
    const tasksSection = document.querySelector('[data-tasks-section]');
    if (tasksSection) {
      tasksSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleTimeBlocksClick = () => {
    const aiSection = document.querySelector('[data-ai-section]');
    if (aiSection) {
      aiSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="flex items-center justify-center gap-6 text-sm">
      <button 
        onClick={handleCalendarEventsClick}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors cursor-pointer"
      >
        <Calendar className="h-4 w-4" />
        <span className="font-semibold">{todayEvents.length}</span>
        <span className="hidden sm:inline">Calendar Events</span>
        <span className="sm:hidden">Events</span>
      </button>
      
      <button 
        onClick={handleScheduledTasksClick}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 text-green-600 font-medium hover:bg-green-500/20 transition-colors cursor-pointer"
      >
        <CheckSquare className="h-4 w-4" />
        <span className="font-semibold">{scheduledTasks.length}</span>
        <span className="hidden sm:inline">Scheduled Tasks</span>
        <span className="sm:hidden">Tasks</span>
      </button>
      
      <button 
        onClick={handleTimeBlocksClick}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-500/10 text-purple-600 font-medium hover:bg-purple-500/20 transition-colors cursor-pointer"
      >
        <Clock className="h-4 w-4" />
        <span className="font-semibold">{totalBlocks}</span>
        <span className="hidden sm:inline">Time Blocks</span>
        <span className="sm:hidden">Blocks</span>
      </button>
    </div>
  );
};

export default StatsFooter;