import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LucideIcon, Plus, FolderOpen, CheckSquare, Calendar, Sparkles } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'default' | 'minimal' | 'card';
  className?: string;
}

const EmptyState = ({ 
  icon: Icon = FolderOpen, 
  title, 
  description, 
  action, 
  secondaryAction,
  variant = 'default',
  className 
}: EmptyStateProps) => {
  if (variant === 'minimal') {
    return (
      <div className={cn("text-center py-6", className)}>
        <Icon className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">{description}</p>
        {action && (
          <Button 
            size="sm" 
            variant="link" 
            onClick={action.onClick}
            className="mt-2"
          >
            {action.label}
          </Button>
        )}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={cn(
        "rounded-xl bg-card border-2 border-dashed border-border p-6 text-center transition-all hover:border-primary/30 hover:bg-muted/20",
        className
      )}>
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">{description}</p>
        {action && (
          <Button onClick={action.onClick} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            {action.label}
          </Button>
        )}
        {secondaryAction && (
          <Button 
            onClick={secondaryAction.onClick} 
            variant="link" 
            size="sm"
            className="mt-2 block mx-auto"
          >
            {secondaryAction.label}
          </Button>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 px-6 text-center",
      className
    )}>
      <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
        <Icon className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">{description}</p>
      <div className="flex flex-col sm:flex-row gap-3">
        {action && (
          <Button onClick={action.onClick} className="gap-2">
            <Plus className="h-4 w-4" />
            {action.label}
          </Button>
        )}
        {secondaryAction && (
          <Button onClick={secondaryAction.onClick} variant="outline">
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );
};

// Pre-configured empty states for common scenarios
export const NoTasksEmptyState = ({ onAddTask }: { onAddTask: () => void }) => (
  <EmptyState
    icon={CheckSquare}
    title="No tasks yet"
    description="Add your first task to start organizing your day"
    action={{ label: "Add Task", onClick: onAddTask }}
    variant="card"
  />
);

export const NoProjectsEmptyState = ({ onAddProject }: { onAddProject: () => void }) => (
  <EmptyState
    icon={FolderOpen}
    title="No projects yet"
    description="Create a project to organize your tasks by category"
    action={{ label: "Create Project", onClick: onAddProject }}
    variant="card"
  />
);

export const NoEventsEmptyState = ({ onConnectCalendar }: { onConnectCalendar: () => void }) => (
  <EmptyState
    icon={Calendar}
    title="Your day is clear"
    description="No events scheduled. Connect your calendar or add tasks to your timeline."
    action={{ label: "Connect Calendar", onClick: onConnectCalendar }}
    variant="minimal"
  />
);

export const AIInsightsEmptyState = ({ onEnableAI }: { onEnableAI: () => void }) => (
  <EmptyState
    icon={Sparkles}
    title="AI insights available"
    description="Enable AI to get personalized productivity tips and smart scheduling suggestions"
    action={{ label: "Enable AI", onClick: onEnableAI }}
    variant="card"
  />
);

export default EmptyState;
