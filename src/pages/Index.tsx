import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/hooks/useProjects';
import Header from '@/components/Header';
import DashboardView from '@/components/DashboardView';
import EnableAIAssistant from '@/components/EnableAIAssistant';
import MobileNav from '@/components/MobileNav';
import SmartAddButton from '@/components/SmartAddButton';
import WelcomeTutorial, { useWelcomeTutorial } from '@/components/WelcomeTutorial';
import { useIsTabletOrBelow } from '@/hooks/use-breakpoints';
import { CalendarCheck } from 'lucide-react';


const Index = () => {
  const { user } = useAuth();
  const { 
    projects, 
    loading, 
    createProject, 
    updateProject,
    deleteProject,
    createTask,
    updateTask,
    deleteTask,
    refetch
  } = useProjects();
  const isCompact = useIsTabletOrBelow();
  const { showTutorial, completeTutorial } = useWelcomeTutorial();

  // Get user's first name from email for personalization
  const getUserName = () => {
    if (!user?.email) return "there";
    const emailPrefix = user.email.split('@')[0];
    // Capitalize first letter and handle common patterns
    return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1).toLowerCase();
  };

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
      <EnableAIAssistant />
      
      {/* Welcome Tutorial for first-time users */}
      {showTutorial && (
        <WelcomeTutorial onComplete={completeTutorial} />
      )}
      
      {/* Fixed Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="w-full lg:max-w-app mx-auto px-0 lg:px-6 py-4">
          <Header />
        </div>
      </header>
      
      {/* Fixed Height Main Content with Independent Scrolling */}
      <main className="overflow-hidden">
        <div className="w-full lg:max-w-app mx-auto px-0 lg:px-6 pt-0 md:py-0 pb-0 h-full overflow-hidden">
          <DashboardView
            projects={projects}
            onCreateProject={async (data) => {
              await createProject(data.name, data.description, data.category, data.color);
            }}
            onUpdateProject={updateProject}
            onDeleteProject={deleteProject}
            onCreateTask={createTask}
            onUpdateTask={updateTask}
            onDeleteTask={deleteTask}
            onRefreshTasks={refetch}
            userName={getUserName()}
          />
        </div>
      </main>
      {isCompact && (
        <MobileNav projects={projects} onCreateTask={createTask} onCreateProject={(p) => createProject(p.name, p.description, p.category, p.color)} />
      )}
    </div>
  );
};

export default Index;
