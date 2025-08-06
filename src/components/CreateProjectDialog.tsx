import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';

interface Project {
  id: string;
  name: string;
  description?: string;
  category: string;
  color?: string;
  tasks: any[];
}

interface CreateProjectDialogProps {
  onCreateProject: (project: Omit<Project, 'id'>) => void;
  existingProjects?: Project[];
  children?: React.ReactNode;
}

// Brand color palette
const PROJECT_COLORS = [
  { name: 'Brand Green', value: '#36B37E' },
  { name: 'Brand Blue', value: '#2684FF' },
  { name: 'Brand Purple', value: '#6554C0' },
  { name: 'Brand Yellow', value: '#FFAB00' },
  { name: 'Brand Red', value: '#FF5630' },
  { name: 'Brand Orange', value: '#FF8B00' },
  { name: 'Brand Dark', value: '#172B4D' },
  { name: 'Light Gray', value: '#F4F5F7' },
  { name: 'Soft Muted Gray', value: '#EDEFF2' },
  { name: 'Teal', value: '#2BB673' }
];

export default function CreateProjectDialog({ onCreateProject, existingProjects = [], children }: CreateProjectDialogProps) {
  const { categories } = useCategories();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('');

  // Filter out colors already used by existing projects
  const usedColors = new Set(existingProjects.map(project => project.color));
  const availableColors = PROJECT_COLORS.filter(color => !usedColors.has(color.value));
  
  const [selectedColor, setSelectedColor] = useState(
    availableColors.length > 0 ? availableColors[0].value : PROJECT_COLORS[0].value
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreateProject({
        name: name.trim(),
        description: description.trim(),
        category: (category || categories[0]?.name || 'Work').toLowerCase(),
        color: selectedColor,
        tasks: []
      });
      setName('');
      setDescription('');
      setCategory('');
      setSelectedColor(availableColors.length > 0 ? availableColors[0].value : PROJECT_COLORS[0].value);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="bg-gradient-primary hover:bg-gradient-primary/90 shadow-card">
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              placeholder="What's your project called?"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="project-description">Description</Label>
            <Textarea
              id="project-description"
              placeholder="Brief description of your project..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div>
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.name}>
                    <div className="flex items-center gap-2">
                      <cat.icon className="w-4 h-4 text-muted-foreground" />
                      {cat.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Color Picker */}
          <div>
            <Label>Project Color</Label>
            <div className="grid grid-cols-5 gap-2 mt-2">
              {availableColors.length > 0 ? availableColors.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  className={`w-10 h-10 rounded-lg border-2 transition-all hover:scale-105 ${
                    selectedColor === color.value 
                      ? 'border-gray-800 ring-2 ring-gray-300' 
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => setSelectedColor(color.value)}
                  title={color.name}
                />
              )) : (
                <div className="col-span-5 text-center text-muted-foreground text-sm py-2">
                  All colors are currently in use. You can still create a project with a duplicate color.
                </div>
              )}
            </div>
          </div>
          
          <div className="flex gap-2 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="flex-1 hover:bg-slate-700 hover:text-white hover:border-slate-700"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!name.trim()}
              className="flex-1 text-white hover:opacity-90"
              style={{ 
                backgroundColor: name.trim() ? selectedColor : undefined,
                borderColor: name.trim() ? selectedColor : undefined
              }}
            >
              Create Project
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}