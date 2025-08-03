import { useState } from 'react';
import { Calendar, Sun, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import TodayView from './TodayView';
import WeeklySchedule from './WeeklySchedule';
import WeeklyAIReview from './WeeklyAIReview';
import UnifiedDailyPlanner from './UnifiedDailyPlanner';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  scheduled_date?: string;
  project_id: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  tasks: Task[];
}

interface DashboardViewProps {
  projects: Project[];
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onCreateTask: (projectId: string, title: string, description?: string, dueDate?: Date) => void;
  onCreateProject: (data: { name: string; description: string }) => void;
  onRefreshTasks?: () => void;
  userName?: string;
}

type ViewMode = 'planner' | 'today' | 'week';

const DashboardView = ({ 
  projects, 
  onUpdateTask, 
  onCreateTask, 
  onCreateProject,
  onRefreshTasks,
  userName = "there"
}: DashboardViewProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>('planner');

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Weekly AI Review - only show in week view */}
      {viewMode === 'week' && <WeeklyAIReview />}
      
      {/* View Toggle */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
            {viewMode === 'planner' ? `Hi ${userName} 🤖 Let's plan your day!` : 
             viewMode === 'today' ? `Hi ${userName} 👋` : 
             `Hi ${userName} 👋 Here's your week.`}
          </h1>
          {viewMode === 'planner' && (
            <p className="text-sm sm:text-base text-muted-foreground">
              AI-powered scheduling with your calendar integration
            </p>
          )}
          {viewMode === 'week' && (
            <p className="text-sm sm:text-base text-muted-foreground">
              Your weekly overview and planning space
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg self-start sm:self-auto">
          <Button
            variant={viewMode === 'planner' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('planner')}
            className={cn(
              "gap-2 transition-all text-xs sm:text-sm px-3 sm:px-4",
              viewMode === 'planner' && "shadow-sm"
            )}
          >
            <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
            AI Planner
          </Button>
          <Button
            variant={viewMode === 'today' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('today')}
            className={cn(
              "gap-2 transition-all text-xs sm:text-sm px-3 sm:px-4",
              viewMode === 'today' && "shadow-sm"
            )}
          >
            <Sun className="h-3 w-3 sm:h-4 sm:w-4" />
            Today
          </Button>
          <Button
            variant={viewMode === 'week' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('week')}
            className={cn(
              "gap-2 transition-all text-xs sm:text-sm px-3 sm:px-4",
              viewMode === 'week' && "shadow-sm"
            )}
          >
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
            Week
          </Button>
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'planner' ? (
        <UnifiedDailyPlanner
          projects={projects}
          onUpdateTask={onUpdateTask}
        />
      ) : viewMode === 'today' ? (
        <TodayView
          projects={projects}
          onUpdateTask={onUpdateTask}
          onCreateTask={onCreateTask}
          onCreateProject={onCreateProject}
          onRefreshTasks={onRefreshTasks}
          userName={userName}
        />
      ) : (
        <WeeklySchedule
          projects={projects}
          onUpdateTask={onUpdateTask}
          onCreateTask={onCreateTask}
          onCreateProject={onCreateProject}
          onRefreshTasks={onRefreshTasks}
          userName={userName}
        />
      )}
    </div>
  );
};

export default DashboardView;