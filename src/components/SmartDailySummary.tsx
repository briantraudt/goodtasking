import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Sparkles, Target, RefreshCw, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SmartSummaryData {
  summary: string;
  priority: string | null;
  reasoning: string;
  projectName?: string;
  taskCount: number;
  projects?: { name: string; taskCount: number }[];
}

interface SmartDailySummaryProps {
  targetDate: string; // YYYY-MM-DD format
  isToday: boolean;
}

export default function SmartDailySummary({ targetDate, isToday }: SmartDailySummaryProps) {
  const [summary, setSummary] = useState<SmartSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const { toast } = useToast();

  const analyzeTasks = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-daily-tasks', {
        body: { targetDate }
      });

      if (error) {
        throw error;
      }

      setSummary(data);
      setShowSummary(true);
      
      if (data.taskCount > 0) {
        toast({
          title: "Smart Analysis Complete",
          description: `Found ${data.taskCount} task${data.taskCount > 1 ? 's' : ''} to analyze`,
        });
      }
    } catch (error) {
      console.error('Error analyzing tasks:', error);
      toast({
        title: "Analysis Failed",
        description: "Unable to analyze tasks. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-analyze for today on component mount
  useEffect(() => {
    if (isToday && !summary) {
      analyzeTasks();
    }
  }, [isToday, targetDate]);

  if (!showSummary && !isLoading) {
    return (
      <div className="mb-4">
        <Button
          onClick={analyzeTasks}
          disabled={isLoading}
          variant="outline"
          size="sm"
          className="w-full bg-gradient-accent hover:bg-gradient-accent/80 border-accent"
        >
          <Brain className="h-4 w-4 mr-2" />
          {isToday ? "Get Smart Daily Summary" : "Analyze This Day"}
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <Card className="mb-4 bg-gradient-card border-accent/20">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <RefreshCw className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm font-medium">Analyzing your tasks...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summary) return null;

  return (
    <TooltipProvider>
      <Card className="mb-4 bg-gradient-card border-accent/20 shadow-card">
        <CardContent className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="font-semibold text-foreground">
                {isToday ? "Smart Daily Summary" : "Day Analysis"}
              </span>
              {summary.taskCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {summary.taskCount} task{summary.taskCount > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            <Button
              onClick={analyzeTasks}
              disabled={isLoading}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>

          {/* Summary */}
          <p className="text-sm text-foreground leading-relaxed">
            {summary.summary}
          </p>

          {/* Priority Task */}
          {summary.priority && (
            <div className="flex items-start space-x-2 p-3 bg-primary/5 rounded-lg border border-primary/10">
              <Target className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-foreground">
                    Recommended Priority:
                  </span>
                  {summary.reasoning && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-xs">{summary.reasoning}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
                <p className="text-sm text-primary font-medium">
                  {summary.priority}
                  {summary.projectName && (
                    <span className="text-muted-foreground font-normal">
                      {" "}({summary.projectName})
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Project Breakdown */}
          {summary.projects && summary.projects.length > 1 && (
            <div className="flex flex-wrap gap-1">
              {summary.projects.map((project, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {project.name}: {project.taskCount}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}