import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Clock, RotateCcw, ArrowRight, Target, Lightbulb, Trophy } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

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

interface TaskFlowInterfaceProps {
  taskSequence: TaskSequenceResult;
  onComplete: () => void;
  onRestart: () => void;
}

export default function TaskFlowInterface({ taskSequence, onComplete, onRestart }: TaskFlowInterfaceProps) {
  const [tasks, setTasks] = useState<SequencedTask[]>(taskSequence.tasks);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [sessionStartTime] = useState(new Date());

  const currentTask = tasks[currentTaskIndex];
  const completedTasks = tasks.filter(task => task.completed);
  const progress = (completedTasks.length / tasks.length) * 100;
  const isAllComplete = completedTasks.length === tasks.length;

  useEffect(() => {
    // Auto-start the first task
    if (currentTask && !currentTask.startedAt && !currentTask.completed) {
      markTaskStarted(currentTaskIndex);
    }
  }, [currentTaskIndex]);

  const markTaskStarted = (taskIndex: number) => {
    setTasks(prev => prev.map((task, index) => 
      index === taskIndex 
        ? { ...task, startedAt: new Date().toISOString() }
        : task
    ));
  };

  const markTaskComplete = () => {
    const updatedTasks = [...tasks];
    updatedTasks[currentTaskIndex] = {
      ...updatedTasks[currentTaskIndex],
      completed: true,
      completedAt: new Date().toISOString()
    };
    
    setTasks(updatedTasks);

    // Move to next task or show completion
    if (currentTaskIndex < tasks.length - 1) {
      setTimeout(() => {
        setCurrentTaskIndex(currentTaskIndex + 1);
      }, 500);
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getTotalTimeSpent = () => {
    const endTime = isAllComplete ? new Date() : new Date();
    const diffMs = endTime.getTime() - sessionStartTime.getTime();
    return Math.round(diffMs / (1000 * 60)); // Convert to minutes
  };

  if (isAllComplete) {
    return (
      <TooltipProvider>
        <div className="space-y-6 p-4">
          {/* Completion Celebration */}
          <div className="text-center space-y-4">
            <div>
              <h3 className="text-2xl font-bold text-foreground">All Tasks Complete!</h3>
              <p className="text-muted-foreground mt-2">
                Fantastic work! You've completed all {tasks.length} tasks.
              </p>
            </div>
          </div>

          {/* Session Summary */}
          <Card className="bg-gradient-card">
            <CardHeader>
              <CardTitle className="text-lg">Session Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Tasks Completed:</span>
                <Badge variant="secondary">{tasks.length}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Time Spent:</span>
                <Badge variant="outline">{formatDuration(getTotalTimeSpent())}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Estimated Time:</span>
                <Badge variant="outline">{formatDuration(taskSequence.totalEstimatedTime)}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <Button
              onClick={onRestart}
              variant="outline"
              className="flex-1"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              New Session
            </Button>
            <Button
              onClick={onComplete}
              className="flex-1 bg-gradient-primary hover:bg-gradient-primary/90"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Done
            </Button>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6 p-4">
        {/* Progress Header */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Task Flow</h3>
            <Badge variant="outline">
              {completedTasks.length}/{tasks.length} Complete
            </Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Current Task Card */}
        <Card className="bg-gradient-accent border-accent/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl flex items-center">
                <Target className="h-5 w-5 mr-2 text-primary" />
                Current Task
              </CardTitle>
              <Badge variant="secondary">
                Step {currentTask.sequenceNumber}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-lg text-foreground mb-2">
                {currentTask.title}
              </h4>
              {currentTask.description && (
                <p className="text-muted-foreground text-sm mb-3">
                  {currentTask.description}
                </p>
              )}
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Est. {formatDuration(currentTask.estimatedMinutes)}
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center cursor-help">
                      <Lightbulb className="h-4 w-4 mr-1" />
                      Why now?
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">{currentTask.reasoning}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            <Button
              onClick={markTaskComplete}
              className="w-full bg-gradient-primary hover:bg-gradient-primary/90"
              size="lg"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Mark Complete
            </Button>
          </CardContent>
        </Card>

        {/* Strategy Overview */}
        <Card className="bg-gradient-card">
          <CardHeader>
            <CardTitle className="text-base">AI Strategy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {taskSequence.overallStrategy}
            </p>
          </CardContent>
        </Card>

        {/* Upcoming Tasks Preview */}
        {currentTaskIndex < tasks.length - 1 && (
          <Card className="bg-gradient-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <ArrowRight className="h-4 w-4 mr-2" />
                Coming Up
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {tasks.slice(currentTaskIndex + 1, currentTaskIndex + 3).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-2 rounded border border-border/50"
                  >
                    <span className="text-sm font-medium">{task.title}</span>
                    <Badge variant="outline" className="text-xs">
                      {formatDuration(task.estimatedMinutes)}
                    </Badge>
                  </div>
                ))}
                {tasks.length > currentTaskIndex + 3 && (
                  <p className="text-xs text-muted-foreground text-center">
                    + {tasks.length - currentTaskIndex - 3} more tasks
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Completed Tasks Summary */}
        {completedTasks.length > 0 && (
          <Card className="bg-gradient-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                Completed ({completedTasks.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {completedTasks.slice(-3).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center text-sm text-muted-foreground"
                  >
                    <CheckCircle2 className="h-3 w-3 mr-2 text-green-600" />
                    {task.title}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
}