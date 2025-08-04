import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Brain, Sparkles } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import TaskFlowInterface from './TaskFlowInterface';

interface SequencedTask {
  id: string;
  title: string;
  description?: string;
  estimatedMinutes: number;
  reasoning: string;
  sequenceNumber: number;
  completed: boolean;
  startedAt: string | null;
  completedAt: string | null;
}

interface TaskSequenceResult {
  tasks: SequencedTask[];
  overallStrategy: string;
  totalEstimatedTime: number;
  sessionId: string;
  createdAt: string;
}

interface AITaskSequencerInlineProps {
  className?: string;
}

export default function AITaskSequencerInline({ className }: AITaskSequencerInlineProps) {
  const [taskInput, setTaskInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [taskSequence, setTaskSequence] = useState<TaskSequenceResult | null>(null);
  const [showTaskFlow, setShowTaskFlow] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!taskInput.trim()) {
      toast({
        title: "Input Required",
        description: "Please describe what you need to get done today.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-task-sequencer', {
        body: { taskInput: taskInput.trim() }
      });

      if (error) {
        throw error;
      }

      setTaskSequence(data);
      setShowTaskFlow(true);
      
      toast({
        title: "Tasks Sequenced!",
        description: `AI organized ${data.tasks.length} tasks for optimal productivity.`,
      });

    } catch (error) {
      console.error('Error processing tasks:', error);
      toast({
        title: "Processing Failed",
        description: "Unable to process your tasks. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setTaskInput('');
    setTaskSequence(null);
    setShowTaskFlow(false);
  };

  return (
    <Card className={`${className} rounded-xl border shadow-soft border-l-2 border-l-primary/20 bg-gradient-to-br from-primary/5 to-accent/5`}>
      <CardHeader className="pb-4 sticky top-0 bg-gradient-to-br from-primary/5 to-accent/5 backdrop-blur-sm z-20 border-b">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-foreground">AI Task Sequencer</CardTitle>
            <p className="text-sm text-muted-foreground">
              Organize your tasks optimally
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden flex flex-col">
        {!showTaskFlow ? (
          <form onSubmit={handleSubmit} className="space-y-4 flex-1 flex flex-col">
            <div className="space-y-2 flex-1">
              <Label htmlFor="task-input" className="text-sm font-medium text-muted-foreground">
                What do you need to get done today?
              </Label>
              <Textarea
                id="task-input"
                placeholder="List everything you need to accomplish today... 

Examples:
• Grocery shopping
• Finish quarterly report
• Call dentist to schedule appointment
• Review project proposals
• Workout at gym
• Meal prep for the week"
                value={taskInput}
                onChange={(e) => setTaskInput(e.target.value)}
                className="min-h-[300px] resize-none flex-1 border-border rounded-lg"
                disabled={isProcessing}
              />
              <p className="text-sm text-muted-foreground">
                The AI will analyze your tasks and sequence them for optimal productivity and energy flow.
              </p>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={resetForm}
                disabled={isProcessing}
              >
                Clear
              </Button>
              <Button 
                type="submit" 
                className="rounded-lg h-10 font-medium"
                disabled={isProcessing || !taskInput.trim()}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sequencing...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Sequence My Tasks
                  </>
                )}
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex-1 min-h-0">
            <TaskFlowInterface 
              taskSequence={taskSequence!}
              onComplete={resetForm}
              onRestart={resetForm}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}