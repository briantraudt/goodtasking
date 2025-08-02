import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, MoreVertical, Edit, Trash2 } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  completed: boolean;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  tasks: Task[];
}

interface ProjectCardProps {
  project: Project;
  onUpdateProject: (id: string, updates: Partial<Project>) => void;
  onDeleteProject: (id: string) => void;
  onCreateTask: (projectId: string, title: string) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
}

export default function ProjectCard({ project, onUpdateProject, onDeleteProject, onCreateTask, onUpdateTask }: ProjectCardProps) {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(project.name);

  const completedTasks = project.tasks.filter(task => task.completed).length;
  const progressPercentage = project.tasks.length > 0 ? (completedTasks / project.tasks.length) * 100 : 0;

  const addTask = () => {
    if (newTaskTitle.trim()) {
      onCreateTask(project.id, newTaskTitle.trim());
      setNewTaskTitle('');
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

  const handleDeleteProject = () => {
    onDeleteProject(project.id);
  };

  return (
    <Card className="p-6 bg-gradient-card shadow-card hover:shadow-elevated transition-all duration-200 border-0">
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
              <h3 className="text-xl font-semibold text-foreground">{project.name}</h3>
            )}
            {project.description && <p className="text-sm text-muted-foreground">{project.description}</p>}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="opacity-60 hover:opacity-100">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditingName(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Name
              </DropdownMenuItem>
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
                <span
                  className={`flex-1 text-sm transition-all ${
                    task.completed 
                      ? 'line-through text-muted-foreground' 
                      : 'text-foreground'
                  }`}
                >
                  {task.title}
                </span>
              </div>
            ))}
          </div>

          {isAddingTask ? (
            <div className="flex space-x-2">
              <Input
                placeholder="Enter task title..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTask()}
                className="flex-1"
                autoFocus
              />
              <Button onClick={addTask} size="sm">
                Add
              </Button>
              <Button onClick={() => setIsAddingTask(false)} variant="outline" size="sm">
                Cancel
              </Button>
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