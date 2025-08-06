import { useState } from 'react';
import { format, addDays, startOfDay, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Check, Edit3, Trash2, Plus, Target, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import AddTaskDialog from './AddTaskDialog';
import CreateProjectDialog from './CreateProjectDialog';
import DailyAISummary from './DailyAISummary';
import WeeklyAIReview from './WeeklyAIReview';
import PlanMyWeekDialog from './PlanMyWeekDialog';

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
  category?: string;
  color?: string;
  tasks: Task[];
}

interface WeeklyScheduleProps {
  projects: Project[];
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onCreateTask: (projectId: string, title: string, description?: string, dueDate?: Date) => void;
  onCreateProject: (data: { name: string; description: string; category: string }) => void;
  onUpdateProject?: (id: string, updates: { name?: string; category?: string }) => void;
  onDeleteProject?: (id: string) => void;
  onRefreshTasks?: () => void;
  userName?: string;
}

const WeeklySchedule = ({ 
  projects, 
  onUpdateTask, 
  onCreateTask, 
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
  onRefreshTasks,
  userName = "there"
}: WeeklyScheduleProps) => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editedProjectName, setEditedProjectName] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  
  // Start from today instead of Sunday
  const weekStart = startOfDay(currentWeek);
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
    // Find the project to get its color
    const project = projects.find(p => p.id === projectId);
    
    // Use custom color if set, otherwise fall back to category-based colors
    if (project?.color) {
      return `text-white`;
    }
    
    // Fallback to category-based colors for existing projects
    const category = project?.category || 'work';
    switch (category) {
      case 'personal':
        return 'bg-[hsl(150,45%,45%)] text-white';
      case 'home':
        return 'bg-[hsl(25,95%,53%)] text-white';
      case 'work':
      default:
        return 'bg-[#4DA8DA] text-white';
    }
  };

  const getProjectBackgroundColor = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    
    // Use custom color if set
    if (project?.color) {
      return project.color;
    }
    
    // Fallback to category-based colors for existing projects
    const category = project?.category || 'work';
    switch (category) {
      case 'personal':
        return 'hsl(150,45%,45%)'; // Professional green
      case 'home':
        return 'hsl(25,95%,53%)'; // Orange - this should fix your issue!
      case 'work':
      default:
        return '#4DA8DA'; // Blue
    }
  };

  const handleTaskToggle = (taskId: string, completed: boolean) => {
    onUpdateTask(taskId, { completed });
  };

  const handleCreateTaskForProject = async (projectId: string, title: string, description?: string, dueDate?: Date, duration?: number, priority?: 'low' | 'medium' | 'high') => {
    await onCreateTask(projectId, title, description, dueDate);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newWeek);
  };

  const handleEditProject = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setEditingProjectId(projectId);
      setEditedProjectName(project.name);
    }
  };

  const handleSaveProjectName = (projectId: string) => {
    if (editedProjectName.trim() && editedProjectName.trim() !== projects.find(p => p.id === projectId)?.name) {
      onUpdateProject?.(projectId, { name: editedProjectName.trim() });
    }
    setEditingProjectId(null);
    setEditedProjectName('');
  };

  const handleCancelEdit = () => {
    setEditingProjectId(null);
    setEditedProjectName('');
  };

  const handleDeleteProject = (projectId: string) => {
    onDeleteProject?.(projectId);
    setShowDeleteDialog(null);
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
          <p className="text-muted-foreground">
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
          <PlanMyWeekDialog 
            projects={projects}
            onTasksCreated={onRefreshTasks}
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
        <div className="bg-white border rounded-lg overflow-hidden">
          {/* Header Row */}
          <div className="grid grid-cols-8 border-b bg-gray-50">
            <div className="p-4 text-sm font-medium text-gray-600">Tasks</div>
            {weekDays.map((day, index) => {
              const isToday = isSameDay(day, new Date());
              return (
                <div key={index} className={cn(
                  "p-4 text-center text-sm font-medium border-l",
                  isToday ? "bg-blue-50 text-blue-600" : "text-gray-600"
                )}>
                  <div className="uppercase font-semibold text-xs mb-1">{format(day, 'EEE')}</div>
                  <div className={cn(
                    "text-lg font-bold",
                    isToday && "text-blue-600"
                  )}>{format(day, 'd')}</div>
                </div>
              );
            })}
          </div>

          {/* Tasks Rows */}
          <div className="divide-y">
            {projects.map((project) => {
              const projectTasks = project.tasks.filter(task => !task.completed);
              if (projectTasks.length === 0) return null;

              return (
                <div key={project.id} className="grid grid-cols-8 hover:bg-gray-50/50">
                   {/* Project Name Column */}
                   <div className="p-4 border-r">
                     <div className="flex items-center justify-between group">
                       {editingProjectId === project.id ? (
                         <div className="flex items-center gap-2 flex-1">
                           <Input
                             value={editedProjectName}
                             onChange={(e) => setEditedProjectName(e.target.value)}
                             onKeyDown={(e) => {
                               if (e.key === 'Enter') handleSaveProjectName(project.id);
                               if (e.key === 'Escape') handleCancelEdit();
                             }}
                             className="text-sm font-medium h-6 px-2"
                             autoFocus
                           />
                           <Button
                             size="sm"
                             variant="ghost"
                             onClick={() => handleSaveProjectName(project.id)}
                             className="h-6 w-6 p-0"
                           >
                             <Check className="h-3 w-3" />
                           </Button>
                         </div>
                       ) : (
                         <>
                           <div 
                             className="flex-1 cursor-pointer hover:bg-gray-100 rounded px-1 py-0.5 transition-colors"
                             onClick={() => handleEditProject(project.id)}
                           >
                             <div className="text-sm font-medium text-gray-900">{project.name}</div>
                             <div className="text-xs text-gray-500 capitalize">{project.category}</div>
                           </div>
                           <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             <Button
                               size="sm"
                               variant="ghost"
                               onClick={() => handleEditProject(project.id)}
                               className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                             >
                               <Edit3 className="h-3 w-3" />
                             </Button>
                             {onDeleteProject && (
                               <Button
                                 size="sm"
                                 variant="ghost"
                                 onClick={() => setShowDeleteDialog(project.id)}
                                 className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                               >
                                 <Trash2 className="h-3 w-3" />
                               </Button>
                             )}
                           </div>
                         </>
                       )}
                     </div>
                   </div>

                  {/* Day Columns */}
                  {weekDays.map((day, dayIndex) => {
                    const tasksForDay = getTasksForDay(day).filter(task => 
                      project.tasks.some(pt => pt.id === task.id)
                    );
                    
                    return (
                      <div key={dayIndex} className="p-2 border-l min-h-[80px] relative">
                        <div className="space-y-1">
                          {tasksForDay.map((task) => (
                            <div
                              key={task.id}
                              className={cn(
                                "px-2 py-1 rounded text-xs font-medium cursor-pointer shadow-sm text-white",
                                task.completed && "opacity-60 line-through"
                              )}
                              style={{ 
                                backgroundColor: getProjectBackgroundColor(task.project_id)
                              }}
                              onClick={() => handleTaskToggle(task.id, !task.completed)}
                            >
                              {task.title}
                            </div>
                          ))}
                        </div>
                        
                        {/* Quick add button for this project/day */}
                        {projects.length > 0 && (
                          <AddTaskDialog 
                            projects={[project]} 
                            onCreateTask={(projectId, title, description, dueDate) => 
                              handleCreateTaskForProject(projectId, title, description, day)
                            }
                            triggerButton={
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="absolute bottom-1 right-1 h-6 w-6 p-0 opacity-0 hover:opacity-100 text-gray-400 hover:text-gray-600"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            }
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Delete Project Dialog */}
      <AlertDialog open={showDeleteDialog !== null} onOpenChange={() => setShowDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{projects.find(p => p.id === showDeleteDialog)?.name}"? 
              This will permanently delete the project and all its tasks. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => showDeleteDialog && handleDeleteProject(showDeleteDialog)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default WeeklySchedule;