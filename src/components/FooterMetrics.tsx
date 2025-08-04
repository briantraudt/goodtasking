import React, { useState } from 'react';
import { CheckSquare, Calendar, Brain, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { format, isToday } from 'date-fns';

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
    estimated_duration?: number;
  }>;
}

interface FooterMetricsProps {
  projects: Project[];
  selectedDate: string;
  lastAISequence?: Date | null;
}

const FooterMetrics: React.FC<FooterMetricsProps> = ({ 
  projects, 
  selectedDate,
  lastAISequence 
}) => {
  const { events } = useGoogleCalendar();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Calculate metrics for selected date
  const targetDate = selectedDate;
  
  // Tasks completed today
  const completedTasks = projects.flatMap(project => 
    project.tasks.filter(task => 
      task.completed && 
      task.scheduled_date?.split('T')[0] === targetDate
    )
  );

  // Calendar events for the selected date
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.start).toLocaleDateString('en-CA');
    return eventDate === targetDate;
  });

  // Scheduled tasks for the selected date
  const scheduledTasks = projects.flatMap(project => 
    project.tasks.filter(task => 
      !task.completed && 
      task.scheduled_date?.split('T')[0] === targetDate &&
      task.start_time && 
      task.end_time
    )
  );

  // Calculate total focus time scheduled (in minutes)
  const totalFocusTime = scheduledTasks.reduce((total, task) => {
    if (task.estimated_duration) {
      return total + task.estimated_duration;
    }
    // Fallback: calculate from start/end times
    if (task.start_time && task.end_time) {
      const [startHour, startMin] = task.start_time.split(':').map(Number);
      const [endHour, endMin] = task.end_time.split(':').map(Number);
      const startTotalMin = startHour * 60 + startMin;
      const endTotalMin = endHour * 60 + endMin;
      return total + (endTotalMin - startTotalMin);
    }
    return total;
  }, 0);

  // Format focus time
  const formatFocusTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Format last AI sequence time
  const formatLastAISequence = (date: Date | null) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getDateLabel = () => {
    const date = new Date(selectedDate);
    if (isToday(date)) return 'Today';
    return format(date, 'MMM d');
  };

  if (isCollapsed) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-navy-blue backdrop-blur-sm border-t border-timeline-gray z-40">
        <div className="max-w-7xl mx-auto px-6 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6 text-sm text-white">
              <span className="font-medium">{getDateLabel()}</span>
              <div className="flex items-center gap-1">
                <CheckSquare className="h-3 w-3 text-footer-accent-green" />
                <span>{completedTasks.length}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-footer-accent-blue" />
                <span>{dayEvents.length}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-footer-accent-yellow" />
                <span>{formatFocusTime(totalFocusTime)}</span>
              </div>
            </div>
            
            <button 
              onClick={() => setIsCollapsed(false)}
              className="p-1 hover:bg-navy-blue-light rounded transition-colors"
              title="Expand metrics"
            >
              <ChevronUp className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-navy-blue backdrop-blur-sm border-t border-timeline-gray z-40">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="text-sm font-bold text-white">
              {getDateLabel()} Metrics
            </div>
            
            {/* Tasks Completed - Forest Green */}
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-forest-green/20">
                <CheckSquare className="h-4 w-4 text-footer-accent-green" />
              </div>
              <div>
                <div className="text-lg font-semibold text-white">
                  {completedTasks.length}
                </div>
                <div className="text-xs text-gray-300">
                  Tasks Completed
                </div>
              </div>
            </div>

            {/* Calendar Events - Sky Blue */}
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-sky-blue/20">
                <Calendar className="h-4 w-4 text-footer-accent-blue" />
              </div>
              <div>
                <div className="text-lg font-semibold text-white">
                  {dayEvents.length}
                </div>
                <div className="text-xs text-gray-300">
                  Calendar Events
                </div>
              </div>
            </div>

            {/* Last AI Sequence - Indigo Purple */}
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-indigo-purple/20">
                <Brain className="h-4 w-4 text-indigo-purple" />
              </div>
              <div>
                <div className="text-lg font-semibold text-white">
                  {formatLastAISequence(lastAISequence)}
                </div>
                <div className="text-xs text-gray-300">
                  Last AI Sequence
                </div>
              </div>
            </div>

            {/* Total Focus Time - Golden Yellow */}
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-golden-yellow/20">
                <Clock className="h-4 w-4 text-footer-accent-yellow" />
              </div>
              <div>
                <div className="text-lg font-semibold text-white">
                  {formatFocusTime(totalFocusTime)}
                </div>
                <div className="text-xs text-gray-300">
                  Focus Time Scheduled
                </div>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => setIsCollapsed(true)}
            className="p-1 hover:bg-navy-blue-light rounded transition-colors"
            title="Collapse metrics"
          >
            <ChevronDown className="h-4 w-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FooterMetrics;