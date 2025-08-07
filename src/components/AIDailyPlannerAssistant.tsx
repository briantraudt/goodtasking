import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { useProjects } from '@/hooks/useProjects';
import { format } from 'date-fns';
import { Calendar, Clock, CheckCircle2, MessageCircle, Sparkles, Send } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ScheduledTask {
  taskId: string;
  title: string;
  projectName: string;
  startTime: string;
  endTime: string;
  priority: 'high' | 'medium' | 'low';
  rationale: string;
}

interface PlannerResponse {
  message: string;
  scheduledTasks?: ScheduledTask[];
  unassignedTasks?: Array<{
    taskId: string;
    title: string;
    reason: string;
  }>;
  awaitingApproval?: boolean;
  planComplete?: boolean;
}

interface AIDailyPlannerAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIDailyPlannerAssistant = ({ isOpen, onClose }: AIDailyPlannerAssistantProps) => {
  const { session } = useAuth();
  const { toast } = useToast();
  const { events, syncCalendar } = useGoogleCalendar();
  const { projects } = useProjects();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<ScheduledTask[]>([]);
  const [conversationState, setConversationState] = useState<'greeting' | 'collecting' | 'planning' | 'approval' | 'complete'>('greeting');
  const [targetDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen && session) {
      setMessages([]);
      setCurrentInput('');
      setIsProcessing(false);
      setCurrentPlan([]);
      setConversationState('greeting');
      initializeConversation();
      syncCalendar(targetDate);
    }
  }, [isOpen, session, targetDate]);

  const initializeConversation = () => {
    const hour = new Date().getHours();
    let greeting = 'Good morning!';
    if (hour >= 12 && hour < 18) greeting = 'Good afternoon!';
    if (hour >= 18) greeting = 'Good evening!';

    const initialMessage: Message = {
      id: '1',
      role: 'assistant',
      content: `${greeting} What would you like to get done today? I'll help you create a smart schedule that works with your calendar and existing tasks.`,
      timestamp: new Date()
    };

    setMessages([initialMessage]);
  };

  const getAllTasks = () => {
    return projects.flatMap(project => 
      project.tasks?.map(task => ({
        ...task,
        projectName: project.name,
        projectId: project.id
      })) || []
    );
  };

  const sendMessage = async () => {
    if (!currentInput.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: currentInput,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentInput('');
    setIsProcessing(true);

    try {
      const allTasks = getAllTasks();
      const conversationHistory = messages.map(m => `${m.role}: ${m.content}`).join('\n');

      const { data, error } = await supabase.functions.invoke('ai-daily-planner', {
        body: {
          userMessage: currentInput,
          conversationHistory,
          conversationState,
          tasks: allTasks,
          calendarEvents: events,
          targetDate
        },
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;

      const response: PlannerResponse = data;
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (response.scheduledTasks) {
        setCurrentPlan(response.scheduledTasks);
      }

      if (response.awaitingApproval) {
        setConversationState('approval');
      } else if (response.planComplete) {
        setConversationState('complete');
      }

    } catch (error) {
      console.error('Error communicating with AI planner:', error);
      toast({
        title: "Communication Error",
        description: "Failed to communicate with the AI planner. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApproval = async (approved: boolean) => {
    if (approved && currentPlan.length > 0) {
      // Save scheduled tasks to calendar/database
      try {
        for (const task of currentPlan) {
          // Update task with scheduled time
          await supabase
            .from('vibe_tasks')
            .update({
              scheduled_date: targetDate,
              start_time: task.startTime,
              end_time: task.endTime
            })
            .eq('id', task.taskId);
        }

        toast({
          title: "Schedule Created! 📅",
          description: `Scheduled ${currentPlan.length} tasks for today.`,
        });

        setConversationState('complete');
      } catch (error) {
        console.error('Error saving schedule:', error);
        toast({
          title: "Save Error",
          description: "Failed to save your schedule. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      // Restart planning process
      setConversationState('collecting');
      setCurrentPlan([]);
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Daily Planner Assistant
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 flex-1 overflow-hidden">
          <ScrollArea className="h-80 w-full rounded border p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground ml-4'
                        : 'bg-muted mr-4'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {message.role === 'assistant' && (
                        <MessageCircle className="h-4 w-4 mt-1 flex-shrink-0" />
                      )}
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                    <p className="text-xs opacity-70 mt-1">
                      {format(message.timestamp, 'HH:mm')}
                    </p>
                  </div>
                </div>
              ))}
              {isProcessing && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-3 mr-4">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                      <span className="text-sm">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {currentPlan.length > 0 && conversationState === 'approval' && (
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Proposed Schedule for {format(new Date(targetDate), 'MMMM d, yyyy')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {currentPlan.map((task, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {formatTime(task.startTime)} - {formatTime(task.endTime)}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {task.projectName}
                        </Badge>
                      </div>
                      <h4 className="font-medium mt-1">{task.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{task.rationale}</p>
                    </div>
                    <Badge 
                      variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'default' : 'secondary'}
                    >
                      {task.priority}
                    </Badge>
                  </div>
                ))}
                
                <Separator />
                
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => handleApproval(false)}>
                    Revise Plan
                  </Button>
                  <Button onClick={() => handleApproval(true)} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Approve & Schedule
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {conversationState !== 'complete' && (
            <div className="flex gap-2">
              <Input
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                placeholder="Type your message..."
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                disabled={isProcessing}
              />
              <Button onClick={sendMessage} disabled={isProcessing || !currentInput.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          )}

          {conversationState === 'complete' && (
            <div className="text-center py-4">
              <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Your day is planned! Check your calendar and task list for the scheduled items.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};