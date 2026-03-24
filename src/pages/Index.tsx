import { useProjects } from '@/hooks/useProjects';
import Header from '@/components/Header';
import SimpleWorkspace from '@/components/SimpleWorkspace';
import { CalendarCheck } from 'lucide-react';


const Index = () => {
  const { 
    projects, 
    loading, 
    createProject, 
    updateProject,
    deleteProject,
    createTask,
    updateTask,
    deleteTask
  } = useProjects();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          {/* Branded loading spinner */}
          <div className="relative">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center animate-pulse">
              <CalendarCheck className="h-8 w-8 text-primary" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">Loading your workspace</p>
            <p className="text-xs text-muted-foreground mt-1">Just a moment...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen grid grid-rows-[auto_1fr] overflow-hidden bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="w-full lg:max-w-app mx-auto px-0 lg:px-6 py-4">
          <Header />
        </div>
      </header>
      <main className="overflow-auto">
        <div className="w-full lg:max-w-app mx-auto px-4 lg:px-6 py-6">
          <SimpleWorkspace
            projects={projects}
            onCreateProject={async (data) => {
              await createProject(
                data.name,
                data.description,
                data.category,
                data.color,
                data.logoUrl,
                data.websiteUrl,
                data.repoUrl,
                data.techStack
              );
            }}
            onUpdateProject={updateProject}
            onDeleteProject={deleteProject}
            onCreateTask={createTask}
            onUpdateTask={updateTask}
            onDeleteTask={deleteTask}
          />
        </div>
      </main>
    </div>
  );
};

export default Index;
