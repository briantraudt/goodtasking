import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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

export default function AITasksDialog() {
  const [open, setOpen] = useState(false);
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

  const resetDialog = () => {
    setTaskInput('');
    setTaskSequence(null);
    setShowTaskFlow(false);
  };

  const handleClose = () => {
    setOpen(false);
    // Reset after dialog closes to avoid visual glitch
    setTimeout(resetDialog, 300);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="bg-gradient-accent hover:bg-gradient-accent/80 border-accent"
        >
          <Brain className="h-4 w-4 mr-2" />
          AI Tasks
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] bg-gradient-card border-0 shadow-elevated max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center">
            <Sparkles className="h-5 w-5 mr-2 text-primary" />
            AI Task Sequencer
          </DialogTitle>
        </DialogHeader>
        
        {!showTaskFlow ? (
          <form onSubmit={handleSubmit} className="space-y-4 flex-1">
            <div className="space-y-2">
              <Label htmlFor="task-input" className="text-base font-medium">
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
                className="min-h-[200px] resize-none"
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
                onClick={handleClose}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-gradient-primary hover:bg-gradient-primary/90"
                disabled={isProcessing || !taskInput.trim()}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sequencing Tasks...
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
              onComplete={handleClose}
              onRestart={resetDialog}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}