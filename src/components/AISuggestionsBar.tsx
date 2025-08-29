import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, X, Calendar, Brain, Target, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface AISuggestion {
  id: string;
  type: 'schedule' | 'priority' | 'productivity' | 'planning';
  title: string;
  description: string;
  action: string;
  actionFn: () => void;
  importance: 'high' | 'medium' | 'low';
  dismissible: boolean;
}

interface AISuggestionsBarProps {
  tasks: Array<{
    id: string;
    title: string;
    completed: boolean;
    scheduled_date?: string;
    priority?: 'high' | 'medium' | 'low';
    due_date?: string;
    start_time?: string;
    end_time?: string;
  }>;
  selectedDate: string;
  onSuggestionAction: (action: string, data?: any) => void;
}

const AISuggestionsBar: React.FC<AISuggestionsBarProps> = ({
  tasks,
  selectedDate,
  onSuggestionAction
}) => {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());

  const generateSuggestions = () => {
    if (!user || !tasks.length) return;

    const today = new Date().toISOString().split('T')[0];
    const todayTasks = tasks.filter(t => t.scheduled_date === selectedDate);
    const unscheduledTasks = tasks.filter(t => !t.completed && !t.scheduled_date);
    const highPriorityTasks = tasks.filter(t => !t.completed && t.priority === 'high');
    const isToday = selectedDate === today;

    const newSuggestions: AISuggestion[] = [];

    // Smart scheduling suggestion
    if (isToday && unscheduledTasks.length >= 3) {
      newSuggestions.push({
        id: 'smart-schedule',
        type: 'schedule',
        title: 'Smart Scheduling Available',
        description: `AI can schedule your ${unscheduledTasks.length} pending tasks`,
        action: 'Schedule with AI',
        actionFn: () => onSuggestionAction('ai-schedule', { tasks: unscheduledTasks }),
        importance: 'high',
        dismissible: true
      });
    }

    // Priority focus suggestion
    if (highPriorityTasks.length > 0 && todayTasks.filter(t => t.priority === 'high').length === 0) {
      newSuggestions.push({
        id: 'priority-focus',
        type: 'priority',
        title: 'High Priority Tasks Need Attention',
        description: `${highPriorityTasks.length} high-priority tasks are unscheduled`,
        action: 'Focus on Priority',
        actionFn: () => onSuggestionAction('focus-priority', { tasks: highPriorityTasks }),
        importance: 'high',
        dismissible: true
      });
    }

    // Daily planning suggestion
    if (isToday && todayTasks.length === 0 && unscheduledTasks.length > 0) {
      newSuggestions.push({
        id: 'daily-planning',
        type: 'planning',
        title: 'Plan Your Day',
        description: 'Let AI create an optimized schedule for today',
        action: 'Plan My Day',
        actionFn: () => onSuggestionAction('plan-day'),
        importance: 'medium',
        dismissible: true
      });
    }

    // Time optimization suggestion
    if (todayTasks.length >= 4) {
      const totalScheduledTime = todayTasks.reduce((acc, task) => {
        if (task.start_time && task.end_time) {
          const start = new Date(`2000-01-01T${task.start_time}`);
          const end = new Date(`2000-01-01T${task.end_time}`);
          return acc + (end.getTime() - start.getTime());
        }
        return acc;
      }, 0);

      const hours = Math.round(totalScheduledTime / (1000 * 60 * 60));
      if (hours >= 6) {
        newSuggestions.push({
          id: 'time-optimization',
          type: 'productivity',
          title: 'Optimize Your Schedule',
          description: `${hours}h scheduled - AI can suggest time optimizations`,
          action: 'Optimize Time',
          actionFn: () => onSuggestionAction('optimize-schedule'),
          importance: 'medium',
          dismissible: true
        });
      }
    }

    // Task sequencing suggestion
    if (unscheduledTasks.length >= 5) {
      newSuggestions.push({
        id: 'task-sequencing',
        type: 'productivity',
        title: 'AI Task Sequencing',
        description: 'Get optimal task ordering and time estimates',
        action: 'Sequence Tasks',
        actionFn: () => onSuggestionAction('sequence-tasks'),
        importance: 'low',
        dismissible: true
      });
    }

    // Filter out dismissed suggestions
    const filteredSuggestions = newSuggestions.filter(s => !dismissedSuggestions.has(s.id));
    
    // Sort by importance and take top 2
    filteredSuggestions.sort((a, b) => {
      const importanceOrder = { high: 3, medium: 2, low: 1 };
      return importanceOrder[b.importance] - importanceOrder[a.importance];
    });

    setSuggestions(filteredSuggestions.slice(0, 2));
  };

  useEffect(() => {
    generateSuggestions();
  }, [tasks, selectedDate, user, dismissedSuggestions]);

  const dismissSuggestion = (suggestionId: string) => {
    setDismissedSuggestions(prev => new Set([...prev, suggestionId]));
  };

  const getSuggestionIcon = (type: AISuggestion['type']) => {
    switch (type) {
      case 'schedule':
        return <Calendar className="h-4 w-4" />;
      case 'priority':
        return <Target className="h-4 w-4" />;
      case 'productivity':
        return <Clock className="h-4 w-4" />;
      case 'planning':
        return <Brain className="h-4 w-4" />;
      default:
        return <Sparkles className="h-4 w-4" />;
    }
  };

  const getSuggestionColor = (importance: AISuggestion['importance']) => {
    switch (importance) {
      case 'high':
        return 'border-orange-200 bg-orange-50 text-orange-800';
      case 'medium':
        return 'border-blue-200 bg-blue-50 text-blue-800';
      case 'low':
        return 'border-purple-200 bg-purple-50 text-purple-800';
      default:
        return 'border-gray-200 bg-gray-50 text-gray-800';
    }
  };

  if (!suggestions.length) return null;

  return (
    <div className="mb-4 space-y-2">
      {suggestions.map((suggestion) => (
        <div
          key={suggestion.id}
          className={`flex items-center gap-3 p-3 rounded-lg border ${getSuggestionColor(suggestion.importance)} transition-all hover:shadow-sm`}
        >
          <div className="flex items-center gap-2 flex-1">
            <div className="flex items-center gap-2">
              {getSuggestionIcon(suggestion.type)}
              <Sparkles className="h-3 w-3 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm leading-tight">
                {suggestion.title}
              </h4>
              <p className="text-xs text-muted-foreground leading-tight">
                {suggestion.description}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              AI
            </Badge>
            <Button
              size="sm"
              onClick={suggestion.actionFn}
              className="h-7 text-xs bg-primary/10 hover:bg-primary/20 text-primary border-primary/20"
              variant="outline"
            >
              {suggestion.action}
            </Button>
            {suggestion.dismissible && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => dismissSuggestion(suggestion.id)}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AISuggestionsBar;