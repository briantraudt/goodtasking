import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, MoreVertical } from 'lucide-react';

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
}

export default function ProjectCard({ project, onUpdateProject }: ProjectCardProps) {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);

  const completedTasks = project.tasks.filter(task => task.completed).length;
  const progressPercentage = project.tasks.length > 0 ? (completedTasks / project.tasks.length) * 100 : 0;

  const addTask = () => {
    if (newTaskTitle.trim()) {
      const newTask: Task = {
        id: Date.now().toString(),
        title: newTaskTitle.trim(),
        completed: false
      };
      onUpdateProject(project.id, {
        tasks: [...project.tasks, newTask]
      });
      setNewTaskTitle('');
      setIsAddingTask(false);
    }
  };

  const toggleTask = (taskId: string) => {
    const updatedTasks = project.tasks.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    onUpdateProject(project.id, {
      tasks: updatedTasks
    });
  };

  return (
    <Card className="p-6 bg-gradient-card shadow-card hover:shadow-elevated transition-all duration-200 border-0">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="text-xl font-semibold text-foreground">{project.name}</h3>
            {project.description && <p className="text-sm text-muted-foreground">{project.description}</p>}
          </div>
          <Button variant="ghost" size="sm" className="opacity-60 hover:opacity-100">
            <MoreVertical className="h-4 w-4" />
          </Button>
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