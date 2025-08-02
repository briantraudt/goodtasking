import { useState } from 'react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Check, Edit3, Trash2, Plus, Target, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import AddTaskDialog from './AddTaskDialog';
import CreateProjectDialog from './CreateProjectDialog';

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

interface WeeklyScheduleProps {
  projects: Project[];
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onCreateTask: (projectId: string, title: string, description?: string, dueDate?: Date) => void;
  onCreateProject: (data: { name: string; description: string }) => void;
  userName?: string;
}

const WeeklySchedule = ({ 
  projects, 
  onUpdateTask, 
  onCreateTask, 
  onCreateProject,
  userName = "there"
}: WeeklyScheduleProps) => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 }); // Sunday
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

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
    const colors = [
      'bg-blue-100 text-blue-800 border-blue-200',
      'bg-green-100 text-green-800 border-green-200',
      'bg-purple-100 text-purple-800 border-purple-200',
      'bg-orange-100 text-orange-800 border-orange-200',
      'bg-pink-100 text-pink-800 border-pink-200',
      'bg-indigo-100 text-indigo-800 border-indigo-200'
    ];
    const index = projects.findIndex(p => p.id === projectId) % colors.length;
    return colors[index];
  };

  const handleTaskToggle = (taskId: string, completed: boolean) => {
    onUpdateTask(taskId, { completed });
  };

  const handleCreateTaskForProject = async (projectId: string, title: string, scheduledDate: Date) => {
    await onCreateTask(projectId, title, undefined, scheduledDate);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newWeek);
  };

  const getTotalTasks = () => {
    return projects.reduce((sum, project) => sum + project.tasks.length, 0);
  };

  const getCompletedTasks = () => {
    return projects.reduce((sum, project) => 
      sum + project.tasks.filter(task => task.completed).length, 0
    );
  };

  const hasAnyTasks = getTotalTasks() > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Hi {userName} 👋 Here's your week.
          </h1>
          <p className="text-muted-foreground mt-1">
            {hasAnyTasks ? (
              `${getCompletedTasks()}/${getTotalTasks()} tasks completed this week`
            ) : (
              "Ready to plan your productive week?"
            )}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <CreateProjectDialog onCreateProject={onCreateProject} />
          <AddTaskDialog 
            projects={projects} 
            onCreateTask={handleCreateTaskForProject}
          />
        </div>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigateWeek('prev')}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous Week
        </Button>
        
        <h2 className="text-lg font-semibold">
          {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
        </h2>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigateWeek('next')}
        >
          Next Week
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Weekly Grid */}
      {!hasAnyTasks ? (
        <Card className="p-8 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold">No tasks yet</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Start by creating a project and adding your first task to get organized and productive.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <CreateProjectDialog onCreateProject={onCreateProject}>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Project
                </Button>
              </CreateProjectDialog>
              {projects.length > 0 && (
                <AddTaskDialog 
                  projects={projects} 
                  onCreateTask={handleCreateTaskForProject}
                  triggerButton={
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Task
                    </Button>
                  }
                />
              )}
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
          {weekDays.map((day, index) => {
            const tasksForDay = getTasksForDay(day);
            const isToday = isSameDay(day, new Date());
            
            return (
              <Card 
                key={index} 
                className={cn(
                  "min-h-[200px] transition-all duration-200",
                  isToday && "ring-2 ring-primary ring-offset-2"
                )}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className={cn(
                        "font-semibold text-sm",
                        isToday && "text-primary"
                      )}>
                        {format(day, 'EEE')}
                      </h3>
                      <p className={cn(
                        "text-2xl font-bold",
                        isToday && "text-primary"
                      )}>
                        {format(day, 'd')}
                      </p>
                    </div>
                    {isToday && (
                      <Badge variant="default" className="text-xs">
                        Today
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-2">
                  {tasksForDay.length === 0 ? (
                    <div className="text-center py-4">
                      <Clock className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No tasks</p>
                    </div>
                  ) : (
                    tasksForDay.map((task) => (
                      <div
                        key={task.id}
                        className={cn(
                          "p-3 rounded-lg border bg-card transition-all duration-200 hover:shadow-sm",
                          task.completed && "opacity-60"
                        )}
                      >
                        <div className="flex items-start gap-2">
                          <Checkbox
                            checked={task.completed}
                            onCheckedChange={(checked) => 
                              handleTaskToggle(task.id, checked as boolean)
                            }
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              "text-sm font-medium text-foreground",
                              task.completed && "line-through text-muted-foreground"
                            )}>
                              {task.title}
                            </p>
                            <Badge 
                              variant="outline" 
                              className={cn("text-xs mt-1", task.projectColor)}
                            >
                              {task.projectName}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  
                  {/* Quick add task for this day */}
                  {projects.length > 0 && (
                    <AddTaskDialog 
                      projects={projects} 
                      onCreateTask={(projectId, title) => 
                        handleCreateTaskForProject(projectId, title, day)
                      }
                      triggerButton={
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full h-8 text-muted-foreground hover:text-foreground"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add task
                        </Button>
                      }
                    />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WeeklySchedule;