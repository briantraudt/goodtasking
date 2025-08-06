import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { FolderOpen, Trash2, Save, Home, User, Briefcase } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCategories } from '@/hooks/useCategories';

interface Project {
  id: string;
  name: string;
  description?: string;
  category: string;
  color?: string;
  tasks: any[];
}

interface ProjectEditDialogProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (projectId: string, updates: Partial<Project>) => Promise<void>;
  onDelete: (projectId: string) => Promise<void>;
}

const ProjectEditDialog = ({ project, isOpen, onClose, onSave, onDelete }: ProjectEditDialogProps) => {
  const { categories } = useCategories();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('work');
  const [color, setColor] = useState('#4DA8DA');
  const [isLoading, setIsLoading] = useState(false);

  // Color options for projects
  const colorOptions = [
    '#4DA8DA', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];

  // Reset form when project changes
  React.useEffect(() => {
    if (project) {
      setName(project.name || '');
      setDescription(project.description || '');
      setCategory(project.category || 'work');
      setColor(project.color || '#4DA8DA');
    }
  }, [project]);

  const handleSave = async () => {
    if (!project || !name.trim()) return;

    setIsLoading(true);
    try {
      const updates: Partial<Project> = {
        name: name.trim(),
        description: description.trim() || undefined,
        category,
        color,
      };

      await onSave(project.id, updates);
      toast({
        title: "Project updated",
        description: "Your project has been successfully updated.",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!project) return;

    setIsLoading(true);
    try {
      await onDelete(project.id);
      toast({
        title: "Project deleted",
        description: "Your project and all associated tasks have been successfully deleted.",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    const categoryData = categories.find(cat => cat.name.toLowerCase() === category.toLowerCase());
    return categoryData?.icon || Briefcase;
  };

  if (!project) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <FolderOpen className="h-5 w-5" />
            Edit Project
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Category Badge */}
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              <div className="flex items-center gap-1.5">
                {(() => {
                  const CategoryIcon = getCategoryIcon(project.category);
                  return <CategoryIcon className="w-3 h-3" />;
                })()}
                {project.category.charAt(0).toUpperCase() + project.category.slice(1)}
              </div>
            </Badge>
            <div 
              className="w-4 h-4 rounded-full border border-border"
              style={{ backgroundColor: project.color }}
            />
          </div>

          {/* Project Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-foreground font-medium">
              Project Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter project name..."
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
              placeholder="Add project description..."
              className="border-border min-h-[80px]"
            />
          </div>

          {/* Category and Color Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category" className="text-foreground font-medium">
                Category
              </Label>
              <Select value={category} onValueChange={(value: string) => setCategory(value)}>
                <SelectTrigger className="border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name.toLowerCase()}>
                      <div className="flex items-center gap-2">
                        <cat.icon className="w-4 h-4" />
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground font-medium">
                Color
              </Label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((colorOption) => (
                  <button
                    key={colorOption}
                    type="button"
                    onClick={() => setColor(colorOption)}
                    className={`w-6 h-6 rounded-full border-2 ${
                      color === colorOption ? 'border-foreground' : 'border-border'
                    }`}
                    style={{ backgroundColor: colorOption }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Project</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{project.name}"? This will also delete all {project.tasks.length} associated tasks. This action cannot be undone.
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
              disabled={isLoading || !name.trim()}
              className="bg-primary hover:bg-primary/90"
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

export default ProjectEditDialog;