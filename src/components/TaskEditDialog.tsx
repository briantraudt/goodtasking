import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar, CalendarDays, Trash2, Save } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface Task {
  id: string;
  title: string;
  description?: string;
  priority?: 'high' | 'medium' | 'low';
  estimated_duration?: number;
  due_date?: string | null;
  scheduled_date?: string | null;
  completed: boolean;
  vibe_projects?: { name: string };
}

interface TaskEditDialogProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
}

const TaskEditDialog = ({ task, isOpen, onClose, onSave, onDelete }: TaskEditDialogProps) => {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Reset form when task changes
  React.useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setPriority(task.priority || 'medium');
      setEstimatedDuration(task.estimated_duration?.toString() || '');
      setDueDate(task.due_date ? format(new Date(task.due_date), 'yyyy-MM-dd') : '');
    }
  }, [task]);

  const handleSave = async () => {
    if (!task || !title.trim()) return;

    setIsLoading(true);
    try {
      const updates: Partial<Task> = {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        estimated_duration: estimatedDuration ? parseInt(estimatedDuration) : undefined,
        due_date: dueDate || null,
      };

      await onSave(task.id, updates);
      toast({
        title: "Task updated",
        description: "Your task has been successfully updated.",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;

    setIsLoading(true);
    try {
      await onDelete(task.id);
      toast({
        title: "Task deleted",
        description: "Your task has been successfully deleted.",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-[#DC2626] text-white';
      case 'medium':
        return 'bg-[#F59E0B] text-white';
      case 'low':
        return 'bg-[#059669] text-white';
      default:
        return 'bg-[#64748B] text-white';
    }
  };

  if (!task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#0F172A]">
            <CalendarDays className="h-5 w-5" />
            Edit Task
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Project Badge */}
          {task.vibe_projects?.name && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {task.vibe_projects.name}
              </Badge>
              <Badge className={getPriorityColor(task.priority || 'medium')}>
                {(task.priority || 'medium').toUpperCase()}
              </Badge>
            </div>
          )}

          {/* Task Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-[#0F172A] font-medium">
              Task Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title..."
              className="border-[#E2E8F0]"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-[#0F172A] font-medium">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add task description..."
              className="border-[#E2E8F0] min-h-[80px]"
            />
          </div>

          {/* Priority and Duration Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority" className="text-[#0F172A] font-medium">
                Priority
              </Label>
              <Select value={priority} onValueChange={(value: 'high' | 'medium' | 'low') => setPriority(value)}>
                <SelectTrigger className="border-[#E2E8F0]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration" className="text-[#0F172A] font-medium">
                Duration (mins)
              </Label>
              <Input
                id="duration"
                type="number"
                value={estimatedDuration}
                onChange={(e) => setEstimatedDuration(e.target.value)}
                placeholder="60"
                className="border-[#E2E8F0]"
              />
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="dueDate" className="text-[#0F172A] font-medium">
              Due Date
            </Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="border-[#E2E8F0]"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-[#E2E8F0]">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-[#DC2626] border-[#DC2626] hover:bg-[#DC2626] hover:text-white">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Task</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{task.title}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={isLoading}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isLoading || !title.trim()}
              className="bg-[#2563EB] hover:bg-[#1d4ed8]"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskEditDialog;