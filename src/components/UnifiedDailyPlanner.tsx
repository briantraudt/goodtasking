import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { useAIScheduler } from '@/hooks/useAIScheduler';
import { Calendar, Clock, Sparkles, Plus, Loader2 } from 'lucide-react';
import { format, parseISO, isToday } from 'date-fns';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  priority?: 'high' | 'medium' | 'low';
  duration?: number;
  completed: boolean;
  scheduled_date?: string | null;
}

interface Project {
  id: string;
  name: string;
  tasks: Task[];
}

interface UnifiedDailyPlannerProps {
  projects: Project[];
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  className?: string;
}

interface TimeBlock {
  id: string;
  title: string;
  start: string;
  end: string;
  type: 'event' | 'task';
  color: string;
  priority?: string;
}

const UnifiedDailyPlanner = ({ projects, onUpdateTask, className }: UnifiedDailyPlannerProps) => {
  const { events, isConnected, loading: calendarLoading } = useGoogleCalendar();
  const { scheduleTasksWithAI, loading: aiLoading } = useAIScheduler();
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Get today's tasks
  const todaysTasks = projects.flatMap(project => 
    project.tasks.filter(task => 
      !task.completed && 
      (task.scheduled_date === selectedDate || (!task.scheduled_date && isToday(new Date(selectedDate))))
    )
  );

  const formatTime = (timeStr: string) => {
    if (timeStr.includes('T')) {
      return format(parseISO(timeStr), 'HH:mm');
    }
    return timeStr;
  };

  const generateTimeBlocks = () => {
    const blocks: TimeBlock[] = [];

    // Add calendar events
    events.forEach(event => {
      blocks.push({
        id: `event-${event.id}`,
        title: event.title,
        start: formatTime(event.start),
        end: formatTime(event.end),
        type: 'event',
        color: 'bg-blue-100 border-blue-300 text-blue-800'
      });
    });

    // Add scheduled tasks (placeholder for now)
    todaysTasks.forEach((task, index) => {
      blocks.push({
        id: `task-${task.id}`,
        title: task.title,
        start: `${9 + index}:00`, // Placeholder times
        end: `${9 + index}:30`,
        type: 'task',
        color: getPriorityColor(task.priority),
        priority: task.priority
      });
    });

    // Sort by time
    blocks.sort((a, b) => a.start.localeCompare(b.start));
    setTimeBlocks(blocks);
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 border-red-300 text-red-800';
      case 'medium': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'low': return 'bg-green-100 border-green-300 text-green-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const handleSmartSchedule = async () => {
    const result = await scheduleTasksWithAI(events, todaysTasks, selectedDate);
    
    if (result && result.scheduledTasks.length > 0) {
      // Update time blocks with AI suggestions
      const updatedBlocks = [...timeBlocks];
      
      result.scheduledTasks.forEach(suggestion => {
        const blockIndex = updatedBlocks.findIndex(block => 
          block.id === `task-${suggestion.taskId}`
        );
        
        if (blockIndex !== -1) {
          updatedBlocks[blockIndex] = {
            ...updatedBlocks[blockIndex],
            start: suggestion.proposedStartTime,
            end: suggestion.proposedEndTime
          };
        }
      });
      
      setTimeBlocks(updatedBlocks.sort((a, b) => a.start.localeCompare(b.start)));
    }
  };

  useEffect(() => {
    generateTimeBlocks();
  }, [events, todaysTasks, selectedDate]);

  if (calendarLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading calendar...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Daily Planner
            <Badge variant="secondary">{format(new Date(selectedDate), 'MMM d')}</Badge>
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSmartSchedule}
              disabled={aiLoading || todaysTasks.length === 0}
              className="flex items-center gap-1"
            >
              {aiLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Sparkles className="h-3 w-3" />
              )}
              Smart Schedule
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!isConnected && (
          <div className="text-center py-4 text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Connect your Google Calendar to see a unified view</p>
          </div>
        )}

        {timeBlocks.length === 0 && isConnected ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No events or tasks scheduled for today</p>
            <Button variant="outline" size="sm" className="mt-2">
              <Plus className="h-3 w-3 mr-1" />
              Add Task
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {timeBlocks.map((block) => (
              <div
                key={block.id}
                className={cn(
                  "p-3 rounded-lg border-l-4 transition-all hover:shadow-sm",
                  block.color
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {block.start} - {block.end}
                    </span>
                    <Badge variant="outline">
                      {block.type}
                    </Badge>
                    {block.priority && (
                      <Badge variant="secondary">
                        {block.priority}
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="font-medium mt-1">{block.title}</p>
              </div>
            ))}
          </div>
        )}

        {/* Quick Stats */}
        <div className="mt-6 pt-4 border-t">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">{events.length}</p>
              <p className="text-xs text-muted-foreground">Calendar Events</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{todaysTasks.length}</p>
              <p className="text-xs text-muted-foreground">Tasks Today</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">{timeBlocks.length}</p>
              <p className="text-xs text-muted-foreground">Total Blocks</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UnifiedDailyPlanner;