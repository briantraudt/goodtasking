import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string;
  category: 'work' | 'home' | 'personal';
  color: string;
  tasks: any[];
}

interface CreateProjectDialogProps {
  onCreateProject: (project: Omit<Project, 'id'>) => void;
  children?: React.ReactNode;
}

// 10 beautiful colors that match the design palette
const PROJECT_COLORS = [
  { name: 'Ocean Blue', value: '#4DA8DA' },
  { name: 'Sunset Orange', value: '#FF7B47' },
  { name: 'Forest Green', value: '#10B981' },
  { name: 'Royal Purple', value: '#8B5CF6' },
  { name: 'Cherry Red', value: '#EF4444' },
  { name: 'Golden Yellow', value: '#F59E0B' },
  { name: 'Rose Pink', value: '#F472B6' },
  { name: 'Slate Gray', value: '#64748B' },
  { name: 'Mint Green', value: '#14B8A6' },
  { name: 'Lavender', value: '#A78BFA' }
];

export default function CreateProjectDialog({ onCreateProject, children }: CreateProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'work' | 'home' | 'personal'>('work');
  const [selectedColor, setSelectedColor] = useState(PROJECT_COLORS[0].value);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreateProject({
        name: name.trim(),
        description: description.trim(),
        category,
        color: selectedColor,
        tasks: []
      });
      setName('');
      setDescription('');
      setCategory('work');
      setSelectedColor(PROJECT_COLORS[0].value);
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
            <div className="flex gap-4 mt-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="work"
                  checked={category === 'work'}
                  onCheckedChange={() => setCategory('work')}
                />
                <Label htmlFor="work" className="text-sm font-normal">Work</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="personal"
                  checked={category === 'personal'}
                  onCheckedChange={() => setCategory('personal')}
                />
                <Label htmlFor="personal" className="text-sm font-normal">Personal</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="home"
                  checked={category === 'home'}
                  onCheckedChange={() => setCategory('home')}
                />
                <Label htmlFor="home" className="text-sm font-normal">Home</Label>
              </div>
            </div>
          </div>
          
          {/* Color Picker */}
          <div>
            <Label>Project Color</Label>
            <div className="grid grid-cols-5 gap-2 mt-2">
              {PROJECT_COLORS.map((color) => (
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
              ))}
            </div>
          </div>
          
          <div className="flex gap-2 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!name.trim()}
              className="flex-1"
            >
              Create Project
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}