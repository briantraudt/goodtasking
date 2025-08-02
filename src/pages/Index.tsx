import { useState } from 'react';
import { Code2 } from 'lucide-react';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { format } from 'date-fns';
import Header from '@/components/Header';
import DraggableProjectCard from '@/components/DraggableProjectCard';
import WeeklyCalendar from '@/components/WeeklyCalendar';
import CreateProjectDialog from '@/components/CreateProjectDialog';
import { useProjects } from '@/hooks/useProjects';
import { useIsMobile } from '@/hooks/use-mobile';

const Index = () => {
  const { 
    projects, 
    loading, 
    createProject, 
    updateProject,
    deleteProject,
    createTask,
    updateTask
  } = useProjects();
  
  const [isFocusMode, setIsFocusMode] = useState(false);
  const isMobile = useIsMobile();

  const totalTasks = projects.reduce((sum, project) => sum + project.tasks.length, 0);
  const completedTasks = projects.reduce((sum, project) => 
    sum + project.tasks.filter(task => task.completed).length, 0
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const projectId = active.id as string;
    const dayString = over.id as string;
    
    // Update the project's scheduled day
    updateProject(projectId, { scheduledDay: dayString });
  };

  // Separate unscheduled projects for the bottom section
  const unscheduledProjects = projects.filter(project => !project.scheduledDay);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            {/* Hide "Your Projects" header on mobile */}
            {!isMobile && (
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-foreground">Your Projects</h2>
                  <p className="text-muted-foreground mt-1">
                    {projects.length} projects • {completedTasks}/{totalTasks} tasks completed
                  </p>
                </div>
                <CreateProjectDialog onCreateProject={(data) => createProject(data.name, data.description)} />
              </div>
            )}

            <WeeklyCalendar 
              projects={projects} 
              onUpdateProject={updateProject}
              onDeleteProject={deleteProject}
              onCreateTask={createTask}
              onUpdateTask={updateTask}
              onFocusModeChange={setIsFocusMode}
              isMobile={isMobile}
              onCreateProject={(data) => createProject(data.name, data.description)}
            />

            {/* Hide unscheduled projects when in focus mode */}
            {!isFocusMode && unscheduledProjects.length > 0 && (
              <div>
                <h3 className="text-2xl font-semibold text-foreground mb-6">Unscheduled Projects</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {unscheduledProjects.map((project) => (
                    <DraggableProjectCard
                      key={project.id}
                      project={project}
                      onUpdateProject={updateProject}
                      onDeleteProject={deleteProject}
                      onCreateTask={createTask}
                      onUpdateTask={updateTask}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </DndContext>
  );
};

export default Index;
