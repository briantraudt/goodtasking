import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, FolderOpen, Edit2, Trash2 } from 'lucide-react';
import CreateProjectDialog from './CreateProjectDialog';
import ProjectEditDialog from './ProjectEditDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

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
}

const ProjectsColumn = ({ projects, onCreateProject, onUpdateProject, onDeleteProject }: ProjectsColumnProps) => {
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

      {/* Projects Grid */}
      <div className="space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 350px)' }}>
        {projectsWithoutTasks.map((project) => {
          const projectColor = getProjectColor(project.category, project.color);
          
          return (
            <Card 
              key={project.id} 
              className={cn(
                "bg-white rounded-xl shadow-sm border-2 hover:shadow-md transition-all duration-150 group cursor-pointer"
              )}
              style={{ borderColor: projectColor }}
            >
              <CardContent className="p-4">
                {/* Project Header with Edit/Delete Options */}
                <div className="flex justify-between items-start mb-3 group">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="flex-1">
                      <h3 
                        className="font-semibold text-foreground cursor-pointer transition-colors hover:text-primary"
                        onClick={() => setEditingProject(project)}
                        title="Click to edit project"
                      >
                        {project.name}
                      </h3>
                      {project.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {project.description}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-transparent"
                      style={{ 
                        color: projectColor,
                        backgroundColor: 'transparent'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingProject(project);
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmProject(project);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

              </CardContent>
            </Card>
          );
        })}

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