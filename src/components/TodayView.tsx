import { useState } from 'react';
import { format, isSameDay, addDays } from 'date-fns';
import { Sun, Plus, CheckCircle2, Circle, Target, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import AddTaskDialog from './AddTaskDialog';
import CreateProjectDialog from './CreateProjectDialog';
import DailyAISummary from './DailyAISummary';
import StreakDisplay from './StreakDisplay';

import { useStreakActions } from '@/hooks/useStreakActions';


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
  category: string;
  color?: string;
  tasks: Task[];
}

interface TodayViewProps {
  projects: Project[];
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onCreateTask: (projectId: string, title: string, description?: string, dueDate?: Date) => void;
  onCreateProject: (data: { name: string; description?: string; category: string; color?: string }) => void;
  onRefreshTasks?: () => void;
  userName?: string;
}

const TodayView = ({ 
  projects, 
  onUpdateTask, 
  onCreateTask, 
  onCreateProject,
  onRefreshTasks,
  userName = "there"
}: TodayViewProps) => {
  const { recordCheckIn } = useStreakActions();
  const [quickTask, setQuickTask] = useState('');
  
  const today = new Date();
  const tomorrow = addDays(today, 1);

  const getTasksForDay = (date: Date) => {
    const allTasks: (Task & { projectName: string; projectColor: string })[] = [];
    
    projects.forEach(project => {
      project.tasks.forEach(task => {
        if (task.scheduled_date && isSameDay(new Date(task.scheduled_date), date)) {
          allTasks.push({
            ...task,
            projectName: project.name,
            projectColor: getProjectColor(project.id)
          });
        }
      });
    });
    
    return allTasks.sort((a, b) => a.completed === b.completed ? 0 : a.completed ? 1 : -1);
  };

  const getProjectColor = (projectId: string) => {
    // Find the project to get its category
    const project = projects.find(p => p.id === projectId);
    const category = project?.category || 'work';
    
    switch (category) {
      case 'personal':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'home':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'work':
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const handleTaskToggle = async (taskId: string, completed: boolean) => {
    // Record check-in for task completion
    if (completed) {
      await recordCheckIn();
    }
    onUpdateTask(taskId, { completed });
  };

  const handleQuickTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTask.trim() || projects.length === 0) return;
    
    // Record check-in for task creation
    await recordCheckIn();
    
    // Use the first project as default, or could be made configurable
    onCreateTask(projects[0].id, quickTask.trim(), undefined, today);
    setQuickTask('');
  };

  const todayTasks = getTasksForDay(today);
  const tomorrowTasks = getTasksForDay(tomorrow);
  const completedToday = todayTasks.filter(task => task.completed).length;
  const totalToday = todayTasks.length;
  const completionRate = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* AI Daily Summary */}
      <DailyAISummary />
      
      {/* Streak Display */}
      <StreakDisplay />
      
      {/* Hero Card - Today's Focus */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 shadow-lg">
        <CardHeader className="pb-3 sm:pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
                <Sun className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg sm:text-2xl font-bold leading-tight">
                  Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {userName}! ☀️
                </CardTitle>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  {format(today, 'EEEE, MMMM d, yyyy')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <CreateProjectDialog existingProjects={projects} onCreateProject={onCreateProject} />
              <AddTaskDialog 
                projects={projects} 
                onCreateTask={(projectId, title) => onCreateTask(projectId, title, undefined, today)}
              />
            </div>
          </div>
          
          {/* Progress Indicator */}
          {totalToday > 0 && (
            <div className="flex items-center gap-3 sm:gap-4 mt-3 sm:mt-4 p-2.5 sm:p-3 bg-background/50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                <span className="text-xs sm:text-sm font-medium">
                  You've completed {completedToday} of {totalToday} tasks today ({completionRate}%) 💪
                </span>
              </div>
              <div className="flex-1 bg-muted rounded-full h-1.5 sm:h-2 min-w-0">
                <div 
                  className="bg-green-500 h-1.5 sm:h-2 rounded-full transition-all duration-500"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Quick Add Task */}
      {projects.length > 0 && (
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-base sm:text-lg">Quick Add</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleQuickTaskSubmit} className="flex gap-2">
              <Input
                placeholder="What would you like to work on today?"
                value={quickTask}
                onChange={(e) => setQuickTask(e.target.value)}
                className="flex-1 text-sm sm:text-base"
              />
              <Button type="submit" disabled={!quickTask.trim()} size="sm" className="px-3 sm:px-4">
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Add</span>
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Today's Tasks */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Target className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Today's Focus
            </CardTitle>
            {totalToday > 0 && (
              <Badge variant="outline" className="text-xs">
                {totalToday} task{totalToday !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-2 sm:space-y-3">
          {todayTasks.length === 0 ? (
            <div className="text-center py-6 sm:py-8">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Target className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold mb-2">No tasks today</h3>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-2">
                {projects.length > 0 && (
                  <AddTaskDialog 
                    projects={projects} 
                    onCreateTask={(projectId, title) => onCreateTask(projectId, title, undefined, today)}
                    triggerButton={
                      <Button size="sm" className="w-full sm:w-auto">
                        <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                        Add Task
                      </Button>
                    }
                  />
                )}
              </div>
            </div>
          ) : (
            todayTasks.map((task) => (
              <div
                key={task.id}
                className={cn(
                  "group p-3 sm:p-4 rounded-lg border bg-card transition-all duration-300 hover:shadow-md",
                  task.completed && "opacity-60 bg-muted/30"
                )}
              >
                <div className="flex items-start gap-2 sm:gap-3">
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={(checked) => 
                      handleTaskToggle(task.id, checked as boolean)
                    }
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm sm:text-base font-medium text-foreground transition-all duration-300",
                      task.completed && "line-through text-muted-foreground"
                    )}>
                      {task.title}
                    </p>
                    <Badge 
                      variant="outline" 
                      className={cn("text-xs mt-1.5 sm:mt-2", task.projectColor)}
                    >
                      {task.projectName}
                    </Badge>
                  </div>
                  {task.completed && (
                    <div className="text-green-600 animate-fade-in">
                      <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Tomorrow Preview */}
      {tomorrowTasks.length > 0 && (
        <Card className="border-dashed">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                What's coming up tomorrow?
                <ArrowRight className="h-4 w-4" />
              </CardTitle>
              <Badge variant="secondary" className="text-xs">
                {tomorrowTasks.length} task{tomorrowTasks.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tomorrowTasks.slice(0, 3).map((task) => (
                <div key={task.id} className="flex items-center gap-2 text-sm">
                  <Circle className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">{task.title}</span>
                  <Badge variant="outline" className="text-xs ml-auto">
                    {task.projectName}
                  </Badge>
                </div>
              ))}
              {tomorrowTasks.length > 3 && (
                <p className="text-xs text-muted-foreground">
                  + {tomorrowTasks.length - 3} more tasks
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TodayView;