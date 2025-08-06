import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, FolderOpen, Edit2, Trash2 } from 'lucide-react';
import CreateProjectDialog from './CreateProjectDialog';
import ProjectEditDialog from './ProjectEditDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { useDraggable } from '@dnd-kit/core';

interface Project {
  id: string;
  name: string;
  description?: string;
  category: 'work' | 'home' | 'personal';
  color?: string;
  tasks: any[];
}

interface ProjectsColumnProps {
  projects: Project[];
  onCreateProject: (data: { name: string; description?: string; category: 'work' | 'home' | 'personal' }) => Promise<void>;
  onUpdateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  onDeleteProject: (id: string) => Promise<void>;
  onMoveProjectToTasks?: (projectId: string) => void;
}

const ProjectsColumn = ({ projects, onCreateProject, onUpdateProject, onDeleteProject, onMoveProjectToTasks }: ProjectsColumnProps) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deleteConfirmProject, setDeleteConfirmProject] = useState<Project | null>(null);

  // Filter projects that have no tasks
  const projectsWithoutTasks = projects.filter(project => 
    !project.tasks || project.tasks.length === 0
  );

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'work':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'home':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'personal':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getProjectColor = (category: string = 'work', customColor?: string) => {
    // Always use custom color if provided
    if (customColor) return customColor;
    
    switch (category) {
      case 'personal': return 'hsl(150, 45%, 45%)';
      case 'home': return 'hsl(25, 95%, 53%)';
      case 'work':
      default: return '#4DA8DA';
    }
  };

  // Draggable Project Chip Component
  const DraggableProjectChip = ({ project }: { project: Project }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      isDragging,
    } = useDraggable({
      id: `project-${project.id}`,
      data: {
        type: 'project',
        project,
      },
    });

    const style = transform ? {
      transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      zIndex: isDragging ? 1000 : 'auto',
      opacity: isDragging ? 0.8 : 1,
    } : undefined;

    const projectColor = getProjectColor(project.category, project.color);

    return (
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        className={cn(
          "inline-flex items-center gap-2 px-4 py-2 rounded-full text-white font-medium cursor-grab select-none transition-transform",
          "hover:scale-105 active:scale-95",
          isDragging && "cursor-grabbing shadow-lg"
        )}
        style={{
          backgroundColor: projectColor,
          ...style
        }}
        onClick={(e) => {
          if (!isDragging) {
            e.stopPropagation();
            setEditingProject(project);
          }
        }}
      >
        <span className="text-sm font-medium">{project.name}</span>
      </div>
    );
  };

  const handleDeleteProject = async (projectId: string) => {
    if (onDeleteProject) {
      await onDeleteProject(projectId);
    }
    setDeleteConfirmProject(null);
  };

  return (
    <div className="h-full">
      {/* Projects Section Header */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold text-foreground">Projects</h1>
        </div>
        <CreateProjectDialog
          onCreateProject={async (project) => {
            await onCreateProject({
              name: project.name,
              description: project.description,
              category: project.category
            });
          }}
        >
          <Button
            variant="default"
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </CreateProjectDialog>
      </div>

      {/* Projects Chips */}
      <div className="space-y-3 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 350px)' }}>
        {projectsWithoutTasks.map((project) => (
          <DraggableProjectChip key={project.id} project={project} />
        ))}

        {/* Empty State */}
        {projectsWithoutTasks.length === 0 && (
          <div className="text-center py-12">
            <div className="rounded-xl bg-white p-8 border-2 border-dashed border-[#E2E8F0] shadow-sm">
              <div className="text-4xl mb-4">📁</div>
              <h3 className="text-lg font-semibold text-[#0F172A] mb-2">No Empty Projects</h3>
              <p className="text-[#64748B] mb-4">All your projects have tasks assigned to them.</p>
              <Button
                variant="outline"
                className="flex items-center gap-2"
              >
                <CreateProjectDialog
                  onCreateProject={async (project) => {
                    await onCreateProject({
                      name: project.name,
                      description: project.description,
                      category: project.category
                    });
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Create Project
                  </div>
                </CreateProjectDialog>
              </Button>
            </div>
          </div>
        )}
      </div>


      {/* Edit Project Dialog */}
      <ProjectEditDialog
        project={editingProject}
        isOpen={!!editingProject}
        onClose={() => setEditingProject(null)}
        onSave={onUpdateProject}
        onDelete={onDeleteProject}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmProject} onOpenChange={() => setDeleteConfirmProject(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteConfirmProject?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteConfirmProject && handleDeleteProject(deleteConfirmProject.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProjectsColumn;