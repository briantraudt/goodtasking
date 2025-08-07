import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { useProjects } from '@/hooks/useProjects';
import { format } from 'date-fns';
import { Calendar, Clock, CheckCircle2, Sparkles, Plus, Wand2 } from 'lucide-react';

interface ParsedTask {
  title: string;
  date: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  priority?: 'high' | 'medium' | 'low';
  projectSuggestion?: string;
  confidence: number;
  originalText: string;
}

interface SmartTaskParserProps {
  onTaskCreated?: (task: any) => void;
}

export const SmartTaskParser = ({ onTaskCreated }: SmartTaskParserProps) => {
  const { session } = useAuth();
  const { toast } = useToast();
  const { createEventFromTask, isConnected } = useGoogleCalendar();
  const { projects, createTask, createProject } = useProjects();
  
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedTasks, setParsedTasks] = useState<ParsedTask[]>([]);
  const [showResults, setShowResults] = useState(false);

  const examples = [
    "Meeting with Sarah tomorrow at 2pm for 1 hour",
    "Gym workout Monday 7am",
    "Doctor appointment Friday at 10:30am",
    "Team standup every weekday at 9am for 30 minutes",
    "Lunch with mom this Saturday at 12pm"
  ];

  const parseNaturalLanguage = async () => {
    if (!input.trim() || isProcessing) return;

    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('smart-task-parser', {
        body: {
          text: input,
          currentDate: format(new Date(), 'yyyy-MM-dd'),
          currentTime: format(new Date(), 'HH:mm'),
          existingProjects: projects.map(p => ({ id: p.id, name: p.name, category: p.category }))
        },
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;

      const allTasks = data.tasks || [];
      
      // Separate tasks by confidence level
      const highConfidenceTasks = allTasks.filter(task => task.confidence >= 0.75);
      const lowConfidenceTasks = allTasks.filter(task => task.confidence < 0.75);

      // Auto-add high confidence tasks
      if (highConfidenceTasks.length > 0) {
        for (const task of highConfidenceTasks) {
          await createTaskFromParsed(task);
        }
        
        toast({
          title: "Tasks Auto-Added! ✨",
          description: `Automatically added ${highConfidenceTasks.length} high-confidence task(s).`,
        });
      }

      // Only show results screen if there are low confidence tasks
      if (lowConfidenceTasks.length > 0) {
        setParsedTasks(lowConfidenceTasks);
        setShowResults(true);
        
        toast({
          title: "Review Required 🔍",
          description: `${lowConfidenceTasks.length} task(s) need manual review (confidence < 75%).`,
        });
      } else if (highConfidenceTasks.length > 0) {
        // All tasks were auto-added, clear the input
        setInput('');
      } else {
        // No tasks found
        toast({
          title: "No Tasks Found",
          description: "Could not parse any tasks from your input. Please try rephrasing.",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Error parsing tasks:', error);
      toast({
        title: "Parsing Error",
        description: "Failed to parse your tasks. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const createTaskFromParsed = async (parsedTask: ParsedTask) => {
    try {
      console.log('🎯 Creating task from parsed data:', parsedTask);
      
      // Find or create project
      let targetProject = projects.find(p => 
        p.name.toLowerCase().includes(parsedTask.projectSuggestion?.toLowerCase() || '') ||
        parsedTask.title.toLowerCase().includes(p.name.toLowerCase())
      );

      console.log('🔍 Found target project:', targetProject);

      if (!targetProject && parsedTask.projectSuggestion) {
        // Create new project
        console.log('📁 Creating new project:', parsedTask.projectSuggestion);
        await createProject(
          parsedTask.projectSuggestion,
          `Auto-created from smart parser`,
          'personal'
        );
        // Use a temporary project reference for now
        targetProject = projects.find(p => p.name === parsedTask.projectSuggestion) || projects[0];
      }

      if (!targetProject) {
        // Use default project or create one
        targetProject = projects[0];
        if (!targetProject) {
          // Create a default project if none exist
          console.log('📁 Creating default project');
          await createProject('General', 'Default project', 'personal');
          targetProject = projects[0];
        }
      }

      console.log('✅ Using project:', targetProject);

      // Create the task
      const newTask = await createTask(
        targetProject.id,
        parsedTask.title,
        `Parsed from: "${parsedTask.originalText}"`,
        new Date(parsedTask.date)
      );

      console.log('📝 Task created:', newTask);

      // If we have time info, schedule it
      if (newTask?.id && parsedTask.startTime) {
        console.log('⏰ Scheduling task with time:', parsedTask.startTime, '-', parsedTask.endTime);
        await supabase
          .from('vibe_tasks')
          .update({
            scheduled_date: parsedTask.date,
            start_time: parsedTask.startTime,
            end_time: parsedTask.endTime,
            priority: parsedTask.priority || 'medium'
          })
          .eq('id', newTask.id);

        // Create Google Calendar event if connected
        if (isConnected && parsedTask.startTime && parsedTask.endTime) {
          console.log('📅 Creating Google Calendar event');
          await createEventFromTask(
            newTask.id,
            parsedTask.title,
            parsedTask.startTime,
            parsedTask.endTime,
            parsedTask.date
          );
        }
      }

      toast({
        title: "Task Created! 📅",
        description: `"${parsedTask.title}" has been added to your calendar.`,
      });

      // Call the onTaskCreated callback to refresh the UI
      if (onTaskCreated) {
        console.log('🔄 Calling onTaskCreated callback');
        onTaskCreated(newTask);
      }

    } catch (error) {
      console.error('❌ Error creating task:', error);
      toast({
        title: "Creation Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatTime = (timeString: string) => {
    try {
      const [hours, minutes] = timeString.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return format(date, 'h:mm a');
    } catch {
      return timeString;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      // Parse the date string correctly to avoid timezone issues
      const [year, month, day] = dateString.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return format(date, 'EEEE, MMM d, yyyy');
    } catch {
      return dateString;
    }
  };

  const clearResults = () => {
    setShowResults(false);
    setParsedTasks([]);
    setInput('');
  };

  return (
    <div className="w-full space-y-4 max-w-2xl">
      <div className="text-left">
        <h2 className="text-xl font-semibold flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
            <Wand2 className="h-4 w-4 text-white" />
          </div>
          Smart Tasking
        </h2>
      </div>
      
      <div className="space-y-4">
        {!showResults ? (
          <>
            {/* Input Section */}
            <div className="space-y-3">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    parseNaturalLanguage();
                  }
                }}
                placeholder="Type your task naturally... e.g., 'dentist appointment tomorrow at 2pm'"
                className="min-h-[80px] resize-none border-2 border-primary/20 focus:border-primary"
                disabled={isProcessing}
              />
              
              <Button 
                onClick={parseNaturalLanguage}
                disabled={isProcessing || !input.trim()}
                className="w-full max-w-xs mx-auto flex items-center gap-2 bg-primary hover:bg-slate-800"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Processing...
                  </>
                ) : (
                  "Enter"
                )}
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Results Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={clearResults} className="hover:bg-slate-800 hover:text-white">
                  Parse New Tasks
                </Button>
              </div>

              <div className="space-y-3">
                {parsedTasks.map((task, index) => (
                  <Card key={index} className="border-primary/20">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{task.title}</h4>
                          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(task.date)}</span>
                            {task.startTime && (
                              <>
                                <Clock className="h-3 w-3 ml-2" />
                                <span>
                                  {formatTime(task.startTime)}
                                  {task.endTime && ` - ${formatTime(task.endTime)}`}
                                  {task.duration && !task.endTime && ` (${task.duration} min)`}
                                </span>
                              </>
                            )}
                          </div>
                          {task.projectSuggestion && (
                            <Badge variant="outline" className="mt-2">
                              Project: {task.projectSuggestion}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge 
                            variant={task.confidence >= 0.8 ? 'default' : task.confidence >= 0.6 ? 'secondary' : 'outline'}
                          >
                            {Math.round(task.confidence * 100)}% confident
                          </Badge>
                          <Button
                            size="sm"
                            onClick={() => createTaskFromParsed(task)}
                            className="flex items-center gap-1 hover:bg-slate-800"
                          >
                            <Plus className="h-3 w-3" />
                            Add to Calendar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};