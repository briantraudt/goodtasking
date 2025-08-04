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

  return (
    <div className="flex items-center justify-center gap-8">
      {/* Scheduled Tasks */}
      <div className="flex items-center gap-2">
        <CheckSquare className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">
          {scheduledTasks.length}
        </span>
        <span className="text-sm text-muted-foreground">
          Scheduled Tasks
        </span>
      </div>

      {/* Calendar Events */}
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">
          {todayEvents.length}
        </span>
        <span className="text-sm text-muted-foreground">
          Calendar Events
        </span>
      </div>

      {/* Total Blocks */}
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">
          {totalBlocks}
        </span>
        <span className="text-sm text-muted-foreground">
          Total Blocks
        </span>
      </div>
    </div>
  );
};

export default StatsFooter;