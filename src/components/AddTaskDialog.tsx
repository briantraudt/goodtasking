import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, CalendarIcon, AlertCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface Project {
  id: string;
  name: string;
}

interface AddTaskDialogProps {
  projects: Project[];
  onCreateTask: (projectId: string, title: string, description?: string, dueDate?: Date, duration?: number, priority?: 'low' | 'medium' | 'high') => void;
  triggerButton?: React.ReactNode;
}

const AddTaskDialog = ({ projects, onCreateTask, triggerButton }: AddTaskDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    projectId: '',
    dueDate: undefined as Date | undefined,
    duration: '30', // Default to 30 minutes
    priority: 'medium' as 'low' | 'medium' | 'high'
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; projectId?: string }>({});

  const durationOptions = [
    { value: '30', label: '30 minutes' },
    { value: '60', label: '1 hour' },
    { value: '120', label: '2 hours' },
    { value: '180', label: '3 hours' },
    { value: '360', label: '6 hours' },
    { value: '480', label: '8 hours' }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'text-green-600' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
    { value: 'high', label: 'High', color: 'text-red-600' }
  ];

  const validateForm = () => {
    const newErrors: { title?: string; projectId?: string } = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Task name is required';
    } else if (formData.title.trim().length < 2) {
      newErrors.title = 'Task name must be at least 2 characters';
    }
    
    if (!formData.projectId) {
      newErrors.projectId = 'Please select a project';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      await onCreateTask(
        formData.projectId, 
        formData.title.trim(), 
        undefined, // description
        formData.dueDate,
        parseInt(formData.duration),
        formData.priority
      );
      
      const projectName = projects.find(p => p.id === formData.projectId)?.name || 'project';
      
      toast({
        title: "Task created! ✓",
        description: `"${formData.title.trim()}" added to ${projectName}`,
      });
      
      setFormData({ 
        title: '', 
        projectId: '', 
        dueDate: undefined,
        duration: '30',
        priority: 'medium'
      });
      setErrors({});
      setOpen(false);
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Failed to create task",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const defaultTrigger = (
    <Button size="sm" className="gap-2">
      <Plus className="h-4 w-4" />
      Add Task
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || defaultTrigger}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Task Name <span className="text-destructive">*</span></Label>
            <Input
              id="title"
              placeholder="What needs to be done?"
              value={formData.title}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, title: e.target.value }));
                if (errors.title) setErrors(prev => ({ ...prev, title: undefined }));
              }}
              className={cn(errors.title && "border-destructive focus-visible:ring-destructive")}
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? "title-error" : undefined}
            />
            {errors.title && (
              <p id="title-error" className="flex items-center gap-1 mt-1 text-sm text-destructive">
                <AlertCircle className="h-3 w-3" />
                {errors.title}
              </p>
            )}
          </div>
          
          <div>
            <Label>Project <span className="text-destructive">*</span></Label>
            <Select 
              value={formData.projectId} 
              onValueChange={(value) => {
                setFormData(prev => ({ ...prev, projectId: value }));
                if (errors.projectId) setErrors(prev => ({ ...prev, projectId: undefined }));
              }}
            >
              <SelectTrigger className={cn(errors.projectId && "border-destructive focus:ring-destructive")}>
                <SelectValue placeholder="Choose a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    No projects yet. Create one first.
                  </div>
                ) : (
                  projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.projectId && (
              <p className="flex items-center gap-1 mt-1 text-sm text-destructive">
                <AlertCircle className="h-3 w-3" />
                {errors.projectId}
              </p>
            )}
          </div>
          
          <div>
            <Label>Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.dueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.dueDate ? format(formData.dueDate, "PPP") : <span>Choose a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.dueDate}
                  onSelect={(date) => setFormData(prev => ({ ...prev, dueDate: date }))}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label>Duration</Label>
            <Select 
              value={formData.duration} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, duration: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose duration" />
              </SelectTrigger>
              <SelectContent>
                {durationOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Priority</Label>
            <Select 
              value={formData.priority} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as 'low' | 'medium' | 'high' }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose priority" />
              </SelectTrigger>
              <SelectContent>
                {priorityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-3 pt-4 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setOpen(false);
                setErrors({});
              }}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || projects.length === 0}
              className="flex-1 gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Add Task
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTaskDialog;