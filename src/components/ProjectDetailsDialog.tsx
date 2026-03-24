import { useEffect, useState } from 'react';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ProjectTechStackPicker from '@/components/ProjectTechStackPicker';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

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
const PROJECT_COLORS = [
  { label: 'Bright Blue', value: '#2684FF' },
  { label: 'Deep Navy', value: '#16324F' },
  { label: 'Emerald', value: '#1F9D55' },
  { label: 'Teal', value: '#0F766E' },
  { label: 'Violet', value: '#7C3AED' },
  { label: 'Magenta', value: '#DB2777' },
  { label: 'Amber', value: '#D97706' },
  { label: 'Coral', value: '#EA580C' },
  { label: 'Slate', value: '#475569' },
  { label: 'Graphite', value: '#1E293B' },
];

export default function ProjectDetailsDialog({
  isOpen,
  mode,
  initialValue,
  onClose,
  onSubmit,
  onDelete,
}: ProjectDetailsDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
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

  const uploadLogo = async (file: File) => {
    if (!user) return;

    setIsUploadingLogo(true);
    try {
      const fileExt = file.name.split('.').pop() || 'png';
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '-');
      const path = `${user.id}/logos/${Date.now()}-${safeName || `logo.${fileExt}`}`;

      const { error } = await supabase.storage
        .from('project-assets')
        .upload(path, file, { upsert: false });

      if (error) throw error;

      const { data } = supabase.storage.from('project-assets').getPublicUrl(path);

      setFormState((prev) => ({ ...prev, logoUrl: data.publicUrl }));
      toast({
        title: 'Logo uploaded',
        description: 'Your project logo asset is ready to use.',
      });
    } catch (error) {
      console.error('Error uploading logo asset:', error);
      toast({
        title: 'Upload failed',
        description: 'We could not upload that asset. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingLogo(false);
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
              <div className="grid grid-cols-5 gap-2 rounded-xl border p-3">
                {PROJECT_COLORS.map((colorOption) => {
                  const isSelected = formState.color === colorOption.value;

                  return (
                    <button
                      key={colorOption.value}
                      type="button"
                      title={colorOption.label}
                      onClick={() =>
                        setFormState((prev) => ({ ...prev, color: colorOption.value }))
                      }
                      className={`h-10 w-full rounded-lg border-2 transition-transform hover:scale-105 ${
                        isSelected ? 'border-slate-950 ring-2 ring-slate-300' : 'border-slate-200'
                      }`}
                      style={{ backgroundColor: colorOption.value }}
                    />
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Project Asset / Logo</Label>
              <div className="flex items-center gap-3 rounded-2xl border bg-muted/10 p-3">
                {formState.logoUrl && (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-background">
                    <img
                      src={formState.logoUrl}
                      alt="Project logo preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}

                <div className="flex flex-1 flex-wrap items-center gap-2">
                  <Label
                    htmlFor="project-logo-upload"
                    className="inline-flex cursor-pointer items-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                  >
                    {isUploadingLogo ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <ImagePlus className="mr-2 h-4 w-4" />
                        Upload Asset
                      </>
                    )}
                  </Label>
                  <input
                    id="project-logo-upload"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        void uploadLogo(file);
                      }
                      event.currentTarget.value = '';
                    }}
                  />
                  {formState.logoUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-9 px-3 text-muted-foreground hover:text-foreground"
                      onClick={() => setFormState((prev) => ({ ...prev, logoUrl: '' }))}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove
                    </Button>
                  )}
                </div>
              </div>
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
