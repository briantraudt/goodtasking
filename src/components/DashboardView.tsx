import { useState } from 'react';
import { Calendar, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import TodayView from './TodayView';
import WeeklySchedule from './WeeklySchedule';
import WeeklyAIReview from './WeeklyAIReview';

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

type ViewMode = 'today' | 'week';

const DashboardView = ({ 
  projects, 
  onUpdateTask, 
  onCreateTask, 
  onCreateProject,
  onRefreshTasks,
  userName = "there"
}: DashboardViewProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>('today');

  return (
    <div className="space-y-6">
      {/* Weekly AI Review - only show in week view */}
      {viewMode === 'week' && <WeeklyAIReview />}
      
      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {viewMode === 'today' ? `Hi ${userName} 👋` : `Hi ${userName} 👋 Here's your week.`}
          </h1>
          {viewMode === 'week' && (
            <p className="text-muted-foreground mt-1">
              Your weekly overview and planning space
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
          <Button
            variant={viewMode === 'today' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('today')}
            className={cn(
              "gap-2 transition-all",
              viewMode === 'today' && "shadow-sm"
            )}
          >
            <Sun className="h-4 w-4" />
            Today
          </Button>
          <Button
            variant={viewMode === 'week' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('week')}
            className={cn(
              "gap-2 transition-all",
              viewMode === 'week' && "shadow-sm"
            )}
          >
            <Calendar className="h-4 w-4" />
            Week
          </Button>
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'today' ? (
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