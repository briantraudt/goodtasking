import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ProjectTechStackPicker from '@/components/ProjectTechStackPicker';

export interface EditableProjectDetails {
  name: string;
  description?: string;
  category: string;
  color?: string;
  logoUrl?: string;
  websiteUrl?: string;
  repoUrl?: string;
  techStack?: string[];
}

interface ProjectDetailsDialogProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialValue?: EditableProjectDetails | null;
  onClose: () => void;
  onSubmit: (value: EditableProjectDetails) => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
}

const CATEGORY_OPTIONS = [
  { label: 'Work', value: 'work' },
  { label: 'Personal', value: 'personal' },
  { label: 'Home', value: 'home' },
];

const DEFAULT_COLOR = '#2684FF';

export default function ProjectDetailsDialog({
  isOpen,
  mode,
  initialValue,
  onClose,
  onSubmit,
  onDelete,
}: ProjectDetailsDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [formState, setFormState] = useState<EditableProjectDetails>({
    name: '',
    description: '',
    category: 'work',
    color: DEFAULT_COLOR,
    logoUrl: '',
    websiteUrl: '',
    repoUrl: '',
    techStack: [],
  });

  useEffect(() => {
    if (initialValue) {
      setFormState({
        name: initialValue.name || '',
        description: initialValue.description || '',
        category: initialValue.category || 'work',
        color: initialValue.color || DEFAULT_COLOR,
        logoUrl: initialValue.logoUrl || '',
        websiteUrl: initialValue.websiteUrl || '',
        repoUrl: initialValue.repoUrl || '',
        techStack: initialValue.techStack || [],
      });
      return;
    }

    setFormState({
      name: '',
      description: '',
      category: 'work',
      color: DEFAULT_COLOR,
      logoUrl: '',
      websiteUrl: '',
      repoUrl: '',
      techStack: [],
    });
  }, [initialValue, isOpen]);

  const submit = async () => {
    if (!formState.name.trim()) return;

    setIsSaving(true);
    try {
      await onSubmit({
        ...formState,
        name: formState.name.trim(),
        description: formState.description?.trim() || '',
        logoUrl: formState.logoUrl?.trim() || '',
        websiteUrl: formState.websiteUrl?.trim() || '',
        repoUrl: formState.repoUrl?.trim() || '',
        techStack: formState.techStack || [],
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create Project' : 'Edit Project'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                placeholder="Good Tasking"
                value={formState.name}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, name: event.target.value }))
                }
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="project-description">Description</Label>
              <Textarea
                id="project-description"
                placeholder="What this project is and why it matters"
                value={formState.description}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, description: event.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={formState.category}
                onValueChange={(value) =>
                  setFormState((prev) => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-color">Color</Label>
              <Input
                id="project-color"
                type="color"
                value={formState.color}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, color: event.target.value }))
                }
                className="h-10 p-1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-logo">Logo URL</Label>
              <Input
                id="project-logo"
                placeholder="https://..."
                value={formState.logoUrl}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, logoUrl: event.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-website">Website URL</Label>
              <Input
                id="project-website"
                placeholder="https://..."
                value={formState.websiteUrl}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, websiteUrl: event.target.value }))
                }
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="project-repo">Repo URL</Label>
              <Input
                id="project-repo"
                placeholder="https://github.com/..."
                value={formState.repoUrl}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, repoUrl: event.target.value }))
                }
              />
            </div>
          </div>

          <ProjectTechStackPicker
            value={formState.techStack || []}
            onChange={(techStack) =>
              setFormState((prev) => ({ ...prev, techStack }))
            }
          />
        </div>

        <div className="flex items-center justify-between gap-3 border-t pt-4">
          <div>
            {mode === 'edit' && onDelete && (
              <Button type="button" variant="destructive" onClick={() => onDelete()}>
                Delete Project
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" onClick={submit} disabled={isSaving || !formState.name.trim()}>
              {mode === 'create' ? 'Create Project' : 'Save Project'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
