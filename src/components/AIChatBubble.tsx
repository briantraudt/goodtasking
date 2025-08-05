import React, { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Brain, MessageCircle, Clock, Calendar, Target, RefreshCw, Settings, X, Send } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import DraggableTimelineTask from './DraggableTimelineTask';

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

interface TimeBlock {
  start: string;
  end: string;
  duration_minutes: number;
}

interface SequencerPreferences {
  work_start_hour: number;
  work_end_hour: number;
  break_duration: number;
  max_focus_time: number;
  min_task_duration: number;
}

interface Project {
  id: string;
  name: string;
  tasks: Array<{
    id: string;
    title: string;
    completed: boolean;
    scheduled_date?: string | null;
    priority?: 'high' | 'medium' | 'low';
  }>;
}

interface AIChatBubbleProps {
  targetDate: string;
  projects: Project[];
  onTasksScheduled: (tasks: ScheduledTask[]) => void;
}

const AIChatBubble: React.FC<AIChatBubbleProps> = ({
  targetDate,
  projects,
  onTasksScheduled
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTask[]>([]);
  const [availableBlocks, setAvailableBlocks] = useState<TimeBlock[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [userGoals, setUserGoals] = useState('');
  
  const [preferences, setPreferences] = useState<SequencerPreferences>({
    work_start_hour: 9,
    work_end_hour: 17,
    break_duration: 60,
    max_focus_time: 120,
    min_task_duration: 15
  });

  // Get unscheduled tasks
  const unscheduledTasks = projects.flatMap(project => 
    project.tasks
      .filter(task => !task.completed && !task.scheduled_date)
      .map(task => ({
        ...task,
        project_name: project.name
      }))
  );

  const runAISequencer = useCallback(async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to use the AI task sequencer",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('Running AI Task Sequencer for date:', targetDate);
      
      const { data, error } = await supabase.functions.invoke('ai-task-sequencer', {
        body: {
          target_date: targetDate,
          user_goals: userGoals,
          ...preferences
        }
      });

      if (error) {
        console.error('AI Task Sequencer error:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate schedule');
      }

      console.log('AI Sequencer response:', data);
      
      setScheduledTasks(data.scheduled_tasks || []);
      setAvailableBlocks(data.available_blocks || []);
      
      // Pass scheduled tasks to parent component
      onTasksScheduled(data.scheduled_tasks || []);

      toast({
        title: "AI Schedule Generated! 🤖",
        description: `Successfully scheduled ${data.total_scheduled} tasks`,
      });

    } catch (error) {
      console.error('Error running AI Task Sequencer:', error);
      toast({
        title: "Scheduling failed",
        description: error instanceof Error ? error.message : 'Failed to generate schedule',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, targetDate, preferences, userGoals, onTasksScheduled, toast]);

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!isExpanded) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsExpanded(true)}
          className="rounded-full w-14 h-14 bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all duration-200 group"
          title="Need help planning?"
        >
          <div className="flex flex-col items-center">
            <Brain className="h-5 w-5 group-hover:scale-110 transition-transform" />
          </div>
        </Button>
        
        {/* Tooltip */}
        <div className="absolute bottom-16 right-0 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Need help planning?
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 max-h-[80vh] bg-white rounded-xl shadow-2xl border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Brain className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">AI Task Planner</h3>
            <p className="text-xs text-gray-500">Smart scheduling assistant</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Settings className="h-3 w-3" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Scheduling Preferences</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Work Start Hour</Label>
                    <Input
                      type="number"
                      min="0"
                      max="23"
                      value={preferences.work_start_hour}
                      onChange={(e) => setPreferences(prev => ({
                        ...prev,
                        work_start_hour: parseInt(e.target.value) || 9
                      }))}
                    />
                  </div>
                  <div>
                    <Label>Work End Hour</Label>
                    <Input
                      type="number"
                      min="0"
                      max="23"
                      value={preferences.work_end_hour}
                      onChange={(e) => setPreferences(prev => ({
                        ...prev,
                        work_end_hour: parseInt(e.target.value) || 17
                      }))}
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Max Focus Time (minutes): {preferences.max_focus_time}</Label>
                  <Slider
                    value={[preferences.max_focus_time]}
                    onValueChange={([value]) => setPreferences(prev => ({
                      ...prev,
                      max_focus_time: value
                    }))}
                    min={30}
                    max={240}
                    step={15}
                    className="mt-2"
                  />
                </div>
                
                <div>
                  <Label>Break Duration (minutes): {preferences.break_duration}</Label>
                  <Slider
                    value={[preferences.break_duration]}
                    onValueChange={([value]) => setPreferences(prev => ({
                      ...prev,
                      break_duration: value
                    }))}
                    min={15}
                    max={120}
                    step={15}
                    className="mt-2"
                  />
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsExpanded(false)}
            className="h-8 w-8 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-h-[60vh] overflow-y-auto space-y-4">
        {/* Task Summary */}
        <div className="bg-blue-50 rounded-lg p-3">
          <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
            <Target className="h-4 w-4" />
            Ready to Schedule
          </h4>
          <p className="text-sm text-blue-700">
            {unscheduledTasks.length} unscheduled tasks found
          </p>
          {unscheduledTasks.slice(0, 3).map((task, index) => (
            <div key={task.id} className="text-xs text-blue-600 mt-1">
              • {task.title} ({task.project_name})
            </div>
          ))}
          {unscheduledTasks.length > 3 && (
            <div className="text-xs text-blue-600 mt-1">
              + {unscheduledTasks.length - 3} more tasks
            </div>
          )}
        </div>

        {/* User Goals Input */}
        <div>
          <Label className="text-sm font-medium">Describe your goals for today:</Label>
          <Textarea
            placeholder="e.g., Focus on high-priority items, leave time for meetings, work in 90-minute blocks..."
            value={userGoals}
            onChange={(e) => setUserGoals(e.target.value)}
            className="mt-2 text-sm"
            rows={3}
          />
        </div>

        {/* Generate Button */}
        <Button 
          onClick={runAISequencer} 
          disabled={isLoading}
          className="w-full gap-2"
        >
          {isLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Brain className="h-4 w-4" />
          )}
          {isLoading ? 'Generating...' : 'Generate Smart Schedule'}
        </Button>

        {/* Available Blocks */}
        {availableBlocks.length > 0 && (
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Available Time Blocks
            </h4>
            <div className="space-y-2">
              {availableBlocks.map((block, index) => (
                <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                  <div className="font-medium">
                    {formatTime(block.start)} - {formatTime(block.end)}
                  </div>
                  <div className="text-xs text-gray-600">
                    {block.duration_minutes} minutes available
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scheduled Tasks */}
        {scheduledTasks.length > 0 && (
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              AI-Scheduled Tasks ({scheduledTasks.length})
            </h4>
            <div className="space-y-2">
              {scheduledTasks.map((task, index) => (
                <div key={index} className="p-2 bg-green-50 rounded text-sm border border-green-200">
                  <div className="flex items-center justify-between">
                    <div className="font-medium truncate flex-1">
                      {task.title}
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getPriorityColor(task.priority)}`}
                    >
                      {task.priority}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {formatTime(task.start_time)} - {formatTime(task.end_time)}
                    <span className="ml-2">• {task.project_name}</span>
                  </div>
                  {task.reasoning && (
                    <div className="text-xs text-blue-600 mt-1 italic">
                      {task.reasoning}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Drag & Drop Section */}
        {scheduledTasks.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Drag to Calendar</h4>
            <p className="text-xs text-gray-600 mb-3">
              Drag these tasks to the calendar timeline to finalize your schedule
            </p>
            <div className="space-y-2">
              {scheduledTasks.map((task) => {
                const timeBlock = {
                  id: `ai-${task.task_id}`,
                  title: task.title,
                  start: task.start_time,
                  end: task.end_time,
                  type: 'task' as const,
                  color: 'border-green-400',
                  priority: task.priority,
                  taskId: task.task_id
                };
                
                const taskData = {
                  id: task.task_id,
                  title: task.title,
                  priority: task.priority as 'high' | 'medium' | 'low',
                  estimated_duration: task.duration_minutes,
                  vibe_projects: { name: task.project_name }
                };

                return (
                  <DraggableTimelineTask 
                    key={task.task_id}
                    block={timeBlock}
                    task={taskData}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIChatBubble;