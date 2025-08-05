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
  tasks: any[];
}

interface CreateProjectDialogProps {
  onCreateProject: (project: Omit<Project, 'id'>) => void;
  children?: React.ReactNode;
}

export default function CreateProjectDialog({ onCreateProject, children }: CreateProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'work' | 'home' | 'personal'>('work');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreateProject({
        name: name.trim(),
        description: description.trim(),
        category,
        tasks: []
      });
      setName('');
      setDescription('');
      setCategory('work');
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