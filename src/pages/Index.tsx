import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/hooks/useProjects';
import Header from '@/components/Header';
import DashboardView from '@/components/DashboardView';
import EnableAIAssistant from '@/components/EnableAIAssistant';
import StatsFooter from '@/components/StatsFooter';

const Index = () => {
  const { user } = useAuth();
  const { 
    projects, 
    loading, 
    createProject, 
    createTask,
    updateTask,
    refetch
  } = useProjects();

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-screen grid grid-rows-[auto_1fr_auto] overflow-hidden bg-background">
      <EnableAIAssistant />
      
      {/* Fixed Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="max-w-app mx-auto px-6 py-4">
          <Header />
        </div>
      </header>
      
      {/* Scrollable Main Content */}
      <main className="overflow-y-auto">
        <div className="max-w-app mx-auto px-6 py-6">
          <DashboardView
            projects={projects}
            onUpdateTask={updateTask}
            onCreateTask={createTask}
            onCreateProject={(data) => createProject(data.name, data.description)}
            onRefreshTasks={refetch}
            userName={getUserName()}
          />
        </div>
      </main>
      
      {/* Fixed Footer */}
      <footer className="border-t bg-muted/30">
        <div className="max-w-app mx-auto px-6 py-3">
          <StatsFooter projects={projects} />
        </div>
      </footer>
    </div>
  );
};

export default Index;
