import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, TrendingUp, Clock, Target, Sparkles, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AIInsight {
  type: 'productivity' | 'scheduling' | 'priority' | 'recommendation';
  title: string;
  description: string;
  action?: string;
  actionFn?: () => void;
  confidence: number;
}

interface AIInsightsWidgetProps {
  tasks: Array<{
    id: string;
    title: string;
    completed: boolean;
    scheduled_date?: string;
    priority?: 'high' | 'medium' | 'low';
    due_date?: string;
  }>;
  onActionTrigger?: (action: string) => void;
}

const AIInsightsWidget: React.FC<AIInsightsWidgetProps> = ({ tasks, onActionTrigger }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const generateInsights = async () => {
    if (!user || !tasks.length) return;

    setIsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const completedTasks = tasks.filter(t => t.completed);
      const pendingTasks = tasks.filter(t => !t.completed);
      const todayTasks = tasks.filter(t => t.scheduled_date === today);
      const overdueTasks = tasks.filter(t => t.due_date && t.due_date < today && !t.completed);

      const generatedInsights: AIInsight[] = [];

      // Productivity insight
      if (completedTasks.length > 0) {
        const completionRate = Math.round((completedTasks.length / tasks.length) * 100);
        generatedInsights.push({
          type: 'productivity',
          title: `${completionRate}% Task Completion Rate`,
          description: completionRate > 70 ? 'Great productivity momentum!' : 'Room for improvement on task completion',
          confidence: 0.9
        });
      }

      // Scheduling insight
      if (todayTasks.length === 0 && pendingTasks.length > 0) {
        generatedInsights.push({
          type: 'scheduling',
          title: 'No Tasks Scheduled Today',
          description: `You have ${pendingTasks.length} pending tasks. Let AI help you plan your day.`,
          action: 'Plan My Day',
          actionFn: () => onActionTrigger?.('plan-day'),
          confidence: 0.85
        });
      }

      // Priority insight
      const highPriorityPending = pendingTasks.filter(t => t.priority === 'high').length;
      if (highPriorityPending > 0) {
        generatedInsights.push({
          type: 'priority',
          title: `${highPriorityPending} High Priority Tasks`,
          description: 'Focus on high-priority tasks first for maximum impact.',
          action: 'Show Priority Tasks',
          actionFn: () => onActionTrigger?.('show-priority'),
          confidence: 0.95
        });
      }

      // Overdue recommendation
      if (overdueTasks.length > 0) {
        generatedInsights.push({
          type: 'recommendation',
          title: `${overdueTasks.length} Overdue Tasks`,
          description: 'These tasks need immediate attention to stay on track.',
          action: 'Reschedule Tasks',
          actionFn: () => onActionTrigger?.('reschedule-overdue'),
          confidence: 1.0
        });
      }

      // General recommendation
      if (generatedInsights.length === 0) {
        generatedInsights.push({
          type: 'recommendation',
          title: 'AI Assistant Ready',
          description: 'Your AI assistant can help with task planning, scheduling, and productivity insights.',
          action: 'Explore AI Features',
          actionFn: () => onActionTrigger?.('explore-ai'),
          confidence: 0.8
        });
      }

      setInsights(generatedInsights.slice(0, 3)); // Show top 3 insights
    } catch (error) {
      console.error('Error generating insights:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    generateInsights();
  }, [tasks, user]);

  const getInsightIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'productivity':
        return <TrendingUp className="h-4 w-4" />;
      case 'scheduling':
        return <Clock className="h-4 w-4" />;
      case 'priority':
        return <Target className="h-4 w-4" />;
      case 'recommendation':
        return <Sparkles className="h-4 w-4" />;
      default:
        return <Brain className="h-4 w-4" />;
    }
  };

  const getInsightColor = (type: AIInsight['type']) => {
    switch (type) {
      case 'productivity':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'scheduling':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'priority':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'recommendation':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (!insights.length && !isLoading) return null;

  return (
    <Card className="border-2 border-gradient-to-r from-primary/20 to-accent/20 bg-gradient-to-r from-primary/5 to-accent/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">AI Insights</h3>
            <Badge variant="outline" className="text-xs">
              Live
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 w-6 p-0"
          >
            <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-sm">Analyzing your tasks...</span>
          </div>
        ) : (
          <div className="space-y-3">
            {insights.slice(0, isExpanded ? insights.length : 1).map((insight, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${getInsightColor(insight.type)} transition-all hover:shadow-sm`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {getInsightIcon(insight.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm leading-tight">
                      {insight.title}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1 leading-tight">
                      {insight.description}
                    </p>
                    {insight.action && insight.actionFn && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={insight.actionFn}
                        className="mt-2 h-7 text-xs"
                      >
                        {insight.action}
                      </Button>
                    )}
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {Math.round(insight.confidence * 100)}%
                  </Badge>
                </div>
              </div>
            ))}
            
            {insights.length > 1 && !isExpanded && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(true)}
                className="w-full h-8 text-xs text-muted-foreground"
              >
                Show {insights.length - 1} more insight{insights.length > 2 ? 's' : ''}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIInsightsWidget;