import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import {
  Bot,
  Calendar,
  CheckCircle2,
  FolderKanban,
  Globe,
  Link as LinkIcon,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Idea, Project, Task } from '@/hooks/useProjects';
import AddIdeaDialog from '@/components/AddIdeaDialog';
import ProjectDetailsDialog, { EditableProjectDetails } from '@/components/ProjectDetailsDialog';

interface SimpleWorkspaceProps {
  projects: Project[];
  ideas: Idea[];
  onCreateProject: (data: EditableProjectDetails) => Promise<void>;
  onUpdateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  onDeleteProject: (id: string) => Promise<void>;
  onCreateIdea: (idea: {
    id?: string;
    title?: string;
    rawIdea: string;
    distilledSummary?: string;
    gtmStrategy?: string;
    launchNeeds?: string[];
    launchChecklist?: string[];
    suggestedTechStack?: string[];
    status?: string;
  }) => Promise<Idea | null | void>;
  onUpdateIdea: (id: string, updates: {
    title?: string | null;
    rawIdea?: string;
    distilledSummary?: string | null;
    gtmStrategy?: string | null;
    launchNeeds?: string[];
    launchChecklist?: string[];
    suggestedTechStack?: string[];
    status?: string;
    projectId?: string | null;
  }) => Promise<void>;
  onDeleteIdea: (id: string) => Promise<void>;
  onConvertIdea: (id: string) => Promise<void>;
  onCreateTask: (projectId: string, title: string, description?: string, dueDate?: Date) => Promise<void>;
  onUpdateTask: (id: string, updates: Partial<Task>) => void | Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
}

const SimpleWorkspace = ({
  projects,
  ideas,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
  onCreateIdea,
  onUpdateIdea,
  onDeleteIdea,
  onConvertIdea,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
}: SimpleWorkspaceProps) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [taskFilter, setTaskFilter] = useState<'open' | 'completed'>('open');
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [quickTaskProjectId, setQuickTaskProjectId] = useState('');
  const [quickTaskDueDate, setQuickTaskDueDate] = useState('');
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isIdeaDialogOpen, setIsIdeaDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);

  const allTasks = useMemo(
    () =>
      projects.flatMap((project) =>
        project.tasks.map((task) => ({
          ...task,
          projectName: project.name,
          projectColor: project.color || '#2684FF',
        }))
      ),
    [projects]
  );

  const selectedProject =
    selectedProjectId === 'all'
      ? null
      : projects.find((project) => project.id === selectedProjectId) || null;

  const filteredTasks = useMemo(() => {
    const todayKey = new Date().toISOString().split('T')[0];

    return allTasks
      .filter((task) => {
        if (selectedProjectId !== 'all' && task.project_id !== selectedProjectId) {
          return false;
        }

        if (taskFilter === 'open') {
          if (!task.completed) return true;
          return task.updated_at?.startsWith(todayKey);
        }

        return task.completed;
      })
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        if ((a.due_date || '') !== (b.due_date || '')) {
          return (a.due_date || '9999-12-31').localeCompare(b.due_date || '9999-12-31');
        }
        return b.created_at.localeCompare(a.created_at);
      });
  }, [allTasks, selectedProjectId, taskFilter]);

  const projectStats = useMemo(() => {
    return projects.map((project) => ({
      ...project,
      openCount: project.tasks.filter((task) => !task.completed).length,
      completedCount: project.tasks.filter((task) => task.completed).length,
    }));
  }, [projects]);

  const submitQuickTask = async () => {
    const projectId = selectedProjectId !== 'all' ? selectedProjectId : quickTaskProjectId;
    if (!quickTaskTitle.trim() || !projectId) return;

    const dueDate = quickTaskDueDate ? new Date(`${quickTaskDueDate}T12:00:00`) : undefined;

    await onCreateTask(projectId, quickTaskTitle.trim(), undefined, dueDate);
    setQuickTaskTitle('');
    setQuickTaskProjectId('');
    setQuickTaskDueDate('');
  };

  return (
    <>
      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <Card className="h-fit border-slate-200 shadow-sm">
          <CardHeader className="space-y-3 pb-4">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setSelectedProjectId('all')}
                className="flex items-center gap-2 text-left"
              >
                <FolderKanban className="h-5 w-5 text-primary" />
                <CardTitle className="text-2xl">Projects</CardTitle>
              </button>
            </div>
            <div className="grid gap-2">
              <Button
                onClick={() => {
                  setEditingIdea(null);
                  setIsIdeaDialogOpen(true);
                }}
                className="justify-start rounded-xl border-0 bg-emerald-500 text-white hover:bg-emerald-600"
              >
                <Bot className="mr-2 h-4 w-4" />
                Add Idea
              </Button>
              <Button
                onClick={() => setIsCreateProjectOpen(true)}
                className="justify-start rounded-xl"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Project
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {projectStats.map((project) => (
              <button
                key={project.id}
                type="button"
                onClick={() => setSelectedProjectId(project.id)}
                className={`group w-full rounded-2xl border px-4 py-3 text-left transition-colors ${
                  selectedProjectId === project.id
                    ? 'border-primary/30 bg-primary/5'
                    : 'border-transparent hover:bg-muted/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    {project.logo_url ? (
                      <img
                        src={project.logo_url}
                        alt={`${project.name} logo`}
                        className="h-10 w-10 rounded-md border object-cover"
                      />
                    ) : (
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-md text-sm font-semibold text-white"
                        style={{ backgroundColor: project.color || '#2684FF' }}
                      >
                        {project.name.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-medium">{project.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {project.openCount} open
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                    onClick={(event) => {
                      event.stopPropagation();
                      setEditingProject(project);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
                {(project.tech_stack || []).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {project.tech_stack?.slice(0, 2).map((item) => (
                      <Badge key={item} variant="outline" className="text-xs">
                        {item}
                      </Badge>
                    ))}
                  </div>
                )}
              </button>
            ))}

            {ideas.filter((idea) => idea.status !== 'converted').length > 0 && (
              <div className="pt-4">
                <div className="mb-2 flex items-center gap-2 px-1">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <p className="text-sm font-medium">Ideas</p>
                </div>
                <div className="space-y-2">
                  {ideas
                    .filter((idea) => idea.status !== 'converted')
                    .map((idea) => (
                      <button
                        key={idea.id}
                        type="button"
                        onClick={() => {
                          setEditingIdea(idea);
                          setIsIdeaDialogOpen(true);
                        }}
                        className="w-full rounded-2xl border border-transparent px-4 py-3 text-left transition-colors hover:bg-muted/50"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-medium">{idea.title || 'Untitled idea'}</p>
                            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                              {idea.distilledSummary || idea.rawIdea}
                            </p>
                          </div>
                          <Badge variant="outline">{idea.launchChecklist.length}</Badge>
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <CardTitle>Task List</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={taskFilter === 'open' ? 'default' : 'outline'}
                    onClick={() => setTaskFilter('open')}
                    size="sm"
                  >
                    Open
                  </Button>
                  <Button
                    variant={taskFilter === 'completed' ? 'default' : 'outline'}
                    onClick={() => setTaskFilter('completed')}
                    size="sm"
                  >
                    Completed
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              {selectedProject && (
                <div className="grid gap-3 rounded-2xl bg-muted/30 p-4 md:grid-cols-2">
                  <div className="space-y-2">
                    {selectedProject.website_url && (
                      <a
                        href={selectedProject.website_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <Globe className="h-4 w-4" />
                        Website
                      </a>
                    )}
                    {selectedProject.repo_url && (
                      <a
                        href={selectedProject.repo_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <LinkIcon className="h-4 w-4" />
                        Repository
                      </a>
                    )}
                  </div>
                  {(selectedProject.tech_stack || []).length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedProject.tech_stack?.map((item) => (
                        <Badge key={item} variant="secondary">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="grid gap-3 rounded-2xl bg-muted/20 p-4 md:grid-cols-[minmax(0,1fr)_180px_220px_auto]">
                <div className="space-y-2">
                  <Label htmlFor="quick-task-title" className="text-xs uppercase tracking-wide text-muted-foreground">
                    Add Task
                  </Label>
                  <Input
                    id="quick-task-title"
                    placeholder="What needs to get done?"
                    value={quickTaskTitle}
                    onChange={(event) => setQuickTaskTitle(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        void submitQuickTask();
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quick-task-date" className="text-xs uppercase tracking-wide text-muted-foreground">
                    Date
                  </Label>
                  <div className="relative">
                    <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="quick-task-date"
                      type="date"
                      value={quickTaskDueDate}
                      onChange={(event) => setQuickTaskDueDate(event.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Project</Label>
                  <Select
                    value={selectedProjectId !== 'all' ? selectedProjectId : quickTaskProjectId}
                    onValueChange={(value) => setQuickTaskProjectId(value)}
                    disabled={selectedProjectId !== 'all'}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={() => void submitQuickTask()} disabled={!quickTaskTitle.trim()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {filteredTasks.length > 0 ? (
                  filteredTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 px-4 py-3"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={(checked) =>
                            onUpdateTask(task.id, { completed: checked === true })
                          }
                          className="mt-1 h-5 w-5 rounded-md border-slate-400 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                        />
                        <div className="min-w-0">
                          <div className="mb-1.5 flex flex-wrap items-center gap-2">
                            <Badge
                              variant="outline"
                              className="rounded-full border-0"
                              style={{
                                backgroundColor: `${task.projectColor}1A`,
                                color: task.projectColor,
                              }}
                            >
                              {task.projectName}
                            </Badge>
                          </div>
                          <p className={`${task.completed ? 'text-muted-foreground line-through' : 'font-medium text-slate-950'}`}>
                            {task.title}
                          </p>
                          {(task.due_date || task.completed) && (
                            <div className="mt-1.5 flex flex-wrap items-center gap-2">
                              {task.due_date && (
                                <Badge variant="secondary" className="rounded-full">
                                  <Calendar className="mr-1 h-3 w-3" />
                                  Due {format(new Date(`${task.due_date}T12:00:00`), 'MMM d')}
                                </Badge>
                              )}
                              {task.completed && (
                                <Badge variant="secondary" className="rounded-full">
                                  <CheckCircle2 className="mr-1 h-3 w-3" />
                                  Done today
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => void onDeleteTask(task.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center text-sm text-muted-foreground">
                    No tasks match this view yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ProjectDetailsDialog
        isOpen={isCreateProjectOpen}
        mode="create"
        onClose={() => setIsCreateProjectOpen(false)}
        onSubmit={async (value) => {
          await onCreateProject(value);
        }}
      />

      <ProjectDetailsDialog
        isOpen={!!editingProject}
        mode="edit"
        initialValue={
          editingProject
            ? {
                name: editingProject.name,
                description: editingProject.description || '',
                category: editingProject.category || 'work',
                color: editingProject.color || '#2684FF',
                logoUrl: editingProject.logo_url || '',
                websiteUrl: editingProject.website_url || '',
                repoUrl: editingProject.repo_url || '',
                techStack: editingProject.tech_stack || [],
              }
            : null
        }
        onClose={() => setEditingProject(null)}
        onSubmit={async (value) => {
          if (!editingProject) return;
          await onUpdateProject(editingProject.id, {
            name: value.name,
            description: value.description,
            category: value.category,
            color: value.color,
            logo_url: value.logoUrl,
            website_url: value.websiteUrl,
            repo_url: value.repoUrl,
            tech_stack: value.techStack,
          });
        }}
        onDelete={
          editingProject
            ? async () => {
                await onDeleteProject(editingProject.id);
                setEditingProject(null);
              }
            : undefined
        }
      />

      <AddIdeaDialog
        isOpen={isIdeaDialogOpen}
        initialIdea={editingIdea}
        onClose={() => {
          setIsIdeaDialogOpen(false);
          setEditingIdea(null);
        }}
        onSave={async (idea) => {
          if (idea.id) {
            await onUpdateIdea(idea.id, {
              title: idea.title || null,
              rawIdea: idea.rawIdea,
              distilledSummary: idea.distilledSummary || null,
              gtmStrategy: idea.gtmStrategy || null,
              launchNeeds: idea.launchNeeds || [],
              launchChecklist: idea.launchChecklist || [],
              suggestedTechStack: idea.suggestedTechStack || [],
              status: idea.status || 'draft',
            });
            return editingIdea;
          }

          const created = await onCreateIdea(idea);
          return created || null;
        }}
        onDelete={async (id) => {
          await onDeleteIdea(id);
          setIsIdeaDialogOpen(false);
          setEditingIdea(null);
        }}
        onConvert={async (id) => {
          await onConvertIdea(id);
          setIsIdeaDialogOpen(false);
          setEditingIdea(null);
        }}
      />
    </>
  );
};

export default SimpleWorkspace;
