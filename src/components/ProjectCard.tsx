import { useState } from 'react';
import { format } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, MoreVertical, Edit, Trash2, CalendarIcon, Home, User, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCategories } from '@/hooks/useCategories';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  due_date?: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  category: 'work' | 'home' | 'personal';
  tasks: Task[];
}

interface ProjectCardProps {
  project: Project;
  onUpdateProject: (id: string, updates: Partial<Project>) => void;
  onDeleteProject: (id: string) => void;
  onCreateTask: (projectId: string, title: string, description?: string, dueDate?: Date) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
}

export default function ProjectCard({ project, onUpdateProject, onDeleteProject, onCreateTask, onUpdateTask }: ProjectCardProps) {
  const { categories } = useCategories();
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState<Date>();
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(project.name);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editedTaskTitle, setEditedTaskTitle] = useState('');

  const completedTasks = project.tasks.filter(task => task.completed).length;
  const progressPercentage = project.tasks.length > 0 ? (completedTasks / project.tasks.length) * 100 : 0;

  const addTask = () => {
    if (newTaskTitle.trim()) {
      onCreateTask(project.id, newTaskTitle.trim(), undefined, newTaskDueDate);
      setNewTaskTitle('');
      setNewTaskDueDate(undefined);
      setIsAddingTask(false);
    }
  };

  const toggleTask = (taskId: string) => {
    const task = project.tasks.find(t => t.id === taskId);
    if (task) {
      onUpdateTask(taskId, { completed: !task.completed });
    }
  };

  const handleEditName = () => {
    if (editedName.trim() && editedName.trim() !== project.name) {
      onUpdateProject(project.id, { name: editedName.trim() });
    }
    setIsEditingName(false);
  };

  const handleEditTask = (taskId: string) => {
    const task = project.tasks.find(t => t.id === taskId);
    if (task) {
      setEditingTaskId(taskId);
      setEditedTaskTitle(task.title);
    }
  };

  const handleSaveTaskEdit = () => {
    if (editingTaskId && editedTaskTitle.trim()) {
      onUpdateTask(editingTaskId, { title: editedTaskTitle.trim() });
    }
    setEditingTaskId(null);
    setEditedTaskTitle('');
  };

  const handleDeleteProject = () => {
    onDeleteProject(project.id);
  };

  const getCategoryColors = (category: 'work' | 'home' | 'personal') => {
    switch (category) {
      case 'work':
        return 'border-l-primary bg-primary/5';
      case 'personal':
        return 'border-l-[hsl(var(--personal))] bg-[hsl(var(--personal))]/5';
      case 'home':
        return 'border-l-[hsl(var(--home))] bg-[hsl(var(--home))]/5';
      default:
        return 'border-l-primary bg-primary/5';
    }
  };

  const getCategoryIcon = (category: 'work' | 'home' | 'personal') => {
    const categoryData = categories.find(cat => cat.name.toLowerCase() === category);
    return categoryData?.icon || Briefcase;
  };

  const getCategoryLabel = (category: 'work' | 'home' | 'personal') => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  return (
    <Card className={cn(
      "p-6 shadow-card hover:shadow-elevated transition-all duration-200 border-0 border-l-4",
      getCategoryColors(project.category)
    )}>
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            {isEditingName ? (
              <div className="flex items-center space-x-2">
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleEditName();
                    if (e.key === 'Escape') {
                      setEditedName(project.name);
                      setIsEditingName(false);
                    }
                  }}
                  onBlur={handleEditName}
                  className="text-xl font-semibold"
                  autoFocus
                />
              </div>
            ) : (
              <h3 
                className="text-xl font-semibold text-foreground cursor-pointer hover:text-primary transition-colors"
                onClick={() => setIsEditingName(true)}
              >
                {project.name}
              </h3>
            )}
            {project.description && <p className="text-sm text-muted-foreground">{project.description}</p>}
            <Badge variant="outline" className="text-xs mt-1 w-fit">
              <div className="flex items-center gap-1.5">
                {(() => {
                  const CategoryIcon = getCategoryIcon(project.category);
                  return <CategoryIcon className="w-3 h-3" />;
                })()}
                {getCategoryLabel(project.category)}
              </div>
            </Badge>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="opacity-60 hover:opacity-100">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Project
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Project</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{project.name}"? This will permanently delete the project and all its tasks. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteProject} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="text-foreground font-medium">
              {completedTasks}/{project.tasks.length} tasks
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <Badge variant="secondary" className="text-xs">
            {Math.round(progressPercentage)}% complete
          </Badge>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground">Tasks</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {project.tasks.map((task) => (
              <div key={task.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-accent/50 transition-colors">
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={() => toggleTask(task.id)}
                  className="data-[state=checked]:bg-success data-[state=checked]:border-success"
                />
                <div className="flex-1">
                  {editingTaskId === task.id ? (
                    <Input
                      value={editedTaskTitle}
                      onChange={(e) => setEditedTaskTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveTaskEdit();
                        if (e.key === 'Escape') {
                          setEditingTaskId(null);
                          setEditedTaskTitle('');
                        }
                      }}
                      onBlur={handleSaveTaskEdit}
                      className="text-sm"
                      autoFocus
                    />
                  ) : (
                    <div>
                      <span
                        className={`text-sm transition-all cursor-pointer hover:text-primary ${
                          task.completed 
                            ? 'line-through text-muted-foreground' 
                            : 'text-foreground'
                        }`}
                        onClick={() => handleEditTask(task.id)}
                      >
                        {task.title}
                      </span>
                      {task.due_date && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Due: {format(new Date(task.due_date), 'MMM dd, yyyy')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {isAddingTask ? (
            <div className="space-y-3">
              <Input
                placeholder="Enter task title..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTask()}
                autoFocus
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !newTaskDueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newTaskDueDate ? format(newTaskDueDate, "PPP") : <span>Set due date (optional)</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={newTaskDueDate}
                    onSelect={setNewTaskDueDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              <div className="flex space-x-2">
                <Button onClick={addTask} size="sm" className="flex-1">
                  Add Task
                </Button>
                <Button 
                  onClick={() => {
                    setIsAddingTask(false);
                    setNewTaskTitle('');
                    setNewTaskDueDate(undefined);
                  }} 
                  variant="outline" 
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => setIsAddingTask(true)}
              variant="outline"
              size="sm"
              className="w-full border-dashed"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}