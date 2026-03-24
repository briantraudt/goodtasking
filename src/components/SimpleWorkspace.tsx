import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import {
  CheckCircle2,
  FolderKanban,
  Globe,
  Link as LinkIcon,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Project, Task } from '@/hooks/useProjects';
import ProjectDetailsDialog, { EditableProjectDetails } from '@/components/ProjectDetailsDialog';

interface SimpleWorkspaceProps {
  projects: Project[];
  onCreateProject: (data: EditableProjectDetails) => Promise<void>;
  onUpdateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  onDeleteProject: (id: string) => Promise<void>;
  onCreateTask: (projectId: string, title: string, description?: string, dueDate?: Date) => Promise<void>;
  onUpdateTask: (id: string, updates: Partial<Task>) => void | Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
}

const SimpleWorkspace = ({
  projects,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
}: SimpleWorkspaceProps) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [taskFilter, setTaskFilter] = useState<'open' | 'all' | 'completed'>('open');
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [quickTaskProjectId, setQuickTaskProjectId] = useState('');
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

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
    return allTasks
      .filter((task) => {
        if (selectedProjectId !== 'all' && task.project_id !== selectedProjectId) {
          return false;
        }

        if (taskFilter === 'open') return !task.completed;
        if (taskFilter === 'completed') return task.completed;
        return true;
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

    await onCreateTask(projectId, quickTaskTitle.trim());
    setQuickTaskTitle('');
    setQuickTaskProjectId('');
  };

  return (
    <>
      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <Card className="h-fit border-slate-200 shadow-sm">
          <CardHeader className="space-y-3 pb-4">
            <div className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5 text-primary" />
              <CardTitle className="text-2xl">Projects</CardTitle>
            </div>
            <Button onClick={() => setIsCreateProjectOpen(true)} className="justify-start rounded-xl">
              <Plus className="mr-2 h-4 w-4" />
              Add Project
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            <button
              type="button"
              onClick={() => setSelectedProjectId('all')}
              className={`w-full rounded-2xl border px-4 py-3 text-left transition-colors ${
                selectedProjectId === 'all'
                  ? 'border-primary/30 bg-primary/5'
                  : 'border-transparent hover:bg-muted/50'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">All Projects</p>
                  <p className="text-sm text-muted-foreground">Everything in one list</p>
                </div>
                <Badge variant="secondary">{allTasks.filter((task) => !task.completed).length}</Badge>
              </div>
            </button>

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
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle>
                    {selectedProject ? selectedProject.name : 'Running Task List'}
                  </CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selectedProject
                      ? selectedProject.description || 'Tasks and context for this project.'
                      : 'A simple list of active work.'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={taskFilter === 'open' ? 'default' : 'outline'}
                    onClick={() => setTaskFilter('open')}
                    size="sm"
                  >
                    Open
                  </Button>
                  <Button
                    variant={taskFilter === 'all' ? 'default' : 'outline'}
                    onClick={() => setTaskFilter('all')}
                    size="sm"
                  >
                    All
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

              <div className="grid gap-3 rounded-2xl bg-muted/20 p-4 md:grid-cols-[1fr_220px_auto]">
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
                          className="mt-1"
                        />
                        <div className="min-w-0">
                          <p className={`${task.completed ? 'text-muted-foreground line-through' : 'font-medium text-slate-950'}`}>
                            {task.title}
                          </p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="rounded-full">
                              {task.projectName}
                            </Badge>
                            {task.due_date && (
                              <Badge variant="secondary" className="rounded-full">
                                Due {format(new Date(`${task.due_date}T12:00:00`), 'MMM d')}
                              </Badge>
                            )}
                            {task.completed && (
                              <Badge variant="secondary" className="rounded-full">
                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                Done
                              </Badge>
                            )}
                          </div>
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
    </>
  );
};

export default SimpleWorkspace;
