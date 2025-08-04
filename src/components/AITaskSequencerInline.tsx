import React, { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Brain, Clock, Calendar, Target, RefreshCw, Settings } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
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

interface AITaskSequencerInlineProps {
  targetDate: string;
  onTasksScheduled: (tasks: ScheduledTask[]) => void;
  className?: string;
}

const AITaskSequencerInline: React.FC<AITaskSequencerInlineProps> = ({
  targetDate,
  onTasksScheduled,
  className = ""
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTask[]>([]);
  const [availableBlocks, setAvailableBlocks] = useState<TimeBlock[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [preferences, setPreferences] = useState<SequencerPreferences>({
    work_start_hour: 9,
    work_end_hour: 17,
    break_duration: 60,
    max_focus_time: 120,
    min_task_duration: 15
  });

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
        title: "AI Schedule Generated",
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
  }, [user, targetDate, preferences, onTasksScheduled, toast]);

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

  return (
    <div className={`space-y-3 ${className}`}>
      {/* AI Sequencer Header */}
      <div className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 p-4 rounded-lg">
        <div className="pb-2 pt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Brain className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">AI Task Sequencer</h3>
                <p className="text-xs text-muted-foreground">
                  Intelligently schedule your unscheduled tasks into available time slots
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1 px-2">
                    <Settings className="h-3 w-3" />
                    Settings
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
                    
                    <div>
                      <Label>Min Task Duration (minutes): {preferences.min_task_duration}</Label>
                      <Slider
                        value={[preferences.min_task_duration]}
                        onValueChange={([value]) => setPreferences(prev => ({
                          ...prev,
                          min_task_duration: value
                        }))}
                        min={5}
                        max={60}
                        step={5}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Button 
                onClick={runAISequencer} 
                disabled={isLoading}
                className="gap-1 px-3"
                size="sm"
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Target className="h-4 w-4" />
                )}
                {isLoading ? 'Generating...' : 'Generate Schedule'}
              </Button>
            </div>
          </div>
        </div>
        
        {(availableBlocks.length > 0 || scheduledTasks.length > 0) && (
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Available Time Blocks */}
              {availableBlocks.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Available Time Blocks
                  </h4>
                  <div className="space-y-2">
                    {availableBlocks.map((block, index) => (
                      <div key={index} className="p-2 bg-blue-50 rounded border border-blue-200">
                        <div className="text-sm font-medium">
                          {formatTime(block.start)} - {formatTime(block.end)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {block.duration_minutes} minutes available
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Scheduled Tasks Preview */}
              {scheduledTasks.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    AI-Scheduled Tasks ({scheduledTasks.length})
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {scheduledTasks.map((task, index) => (
                      <div key={index} className="p-2 bg-green-50 rounded border border-green-200">
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-sm truncate flex-1">
                            {task.title}
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getPriorityColor(task.priority)}`}
                          >
                            {task.priority}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
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
            </div>
          </div>
        )}
      </div>
      
      {/* Drag & Drop Timeline Tasks */}
      {scheduledTasks.length > 0 && (
        <div className="bg-white rounded-lg border p-4">
          <div className="py-2">
            <h3 className="text-lg font-semibold">Drag & Drop Schedule</h3>
            <p className="text-sm text-muted-foreground">
              Drag these AI-scheduled tasks to the calendar timeline to finalize your schedule
            </p>
          </div>
          <div>
            <div className="grid gap-2">
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
        </div>
      )}
    </div>
  );
};

export default AITaskSequencerInline;