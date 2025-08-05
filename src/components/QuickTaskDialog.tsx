import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarDays, Clock, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Project {
  id: string;
  name: string;
}

interface QuickTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  startTime: string;
  projects: Project[];
  onCreateTask: (projectId: string, title: string, description?: string, startTime?: string, endTime?: string) => Promise<void>;
}

const QuickTaskDialog = ({ 
  isOpen, 
  onClose, 
  selectedDate, 
  startTime, 
  projects,
  onCreateTask 
}: QuickTaskDialogProps) => {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [taskStartTime, setTaskStartTime] = useState('');
  const [taskEndTime, setTaskEndTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Initialize times when dialog opens
  useEffect(() => {
    if (isOpen && startTime) {
      setTaskStartTime(startTime);
      
      // Auto-set end time to 30 minutes later
      const [hours, minutes] = startTime.split(':').map(Number);
      const startMinutes = hours * 60 + minutes;
      const endMinutes = startMinutes + 30;
      const endHours = Math.floor(endMinutes / 60);
      const endMins = endMinutes % 60;
      
      if (endHours < 24) {
        setTaskEndTime(`${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`);
      } else {
        setTaskEndTime('23:59');
      }
    }
  }, [isOpen, startTime]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setTitle('');
      setDescription('');
      setSelectedProject('');
      setTaskStartTime('');
      setTaskEndTime('');
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!title.trim() || !selectedProject || !taskStartTime || !taskEndTime) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Validate end time is after start time
    const [startHours, startMinutes] = taskStartTime.split(':').map(Number);
    const [endHours, endMinutes] = taskEndTime.split(':').map(Number);
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;

    if (endTotalMinutes <= startTotalMinutes) {
      toast({
        title: "Invalid time range",
        description: "End time must be after start time.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await onCreateTask(
        selectedProject,
        title.trim(),
        description.trim() || undefined,
        `${taskStartTime}:00`,
        `${taskEndTime}:00`
      );
      
      toast({
        title: "Task created",
        description: "Your task has been created and scheduled.",
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimeForDisplay = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <CalendarDays className="h-5 w-5" />
            Create Task for {selectedDate}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Time display */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted p-2 rounded-lg">
            <Clock className="h-4 w-4" />
            <span>
              {formatTimeForDisplay(taskStartTime)} - {formatTimeForDisplay(taskEndTime)}
            </span>
          </div>

          {/* Project Selection */}
          <div className="space-y-2">
            <Label htmlFor="project" className="text-foreground font-medium">
              Project *
            </Label>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="border-border">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Task Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-foreground font-medium">
              Task Title *
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title..."
              className="border-border"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-foreground font-medium">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add task description..."
              className="border-border min-h-[60px]"
            />
          </div>

          {/* Time Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime" className="text-foreground font-medium">
                Start Time *
              </Label>
              <Input
                id="startTime"
                type="time"
                value={taskStartTime}
                onChange={(e) => setTaskStartTime(e.target.value)}
                className="border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime" className="text-foreground font-medium">
                End Time *
              </Label>
              <Input
                id="endTime"
                type="time"
                value={taskEndTime}
                onChange={(e) => setTaskEndTime(e.target.value)}
                className="border-border"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isLoading || !title.trim() || !selectedProject}
            className="bg-primary hover:bg-primary/90"
          >
            <Save className="h-4 w-4 mr-2" />
            Create Task
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuickTaskDialog;