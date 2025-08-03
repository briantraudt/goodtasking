import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/hooks/useProjects';
import Header from '@/components/Header';
import DashboardView from '@/components/DashboardView';
import EnableAIAssistant from '@/components/EnableAIAssistant';

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
    <div className="min-h-screen bg-background">
      <EnableAIAssistant />
      <Header />
      
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        <DashboardView
          projects={projects}
          onUpdateTask={updateTask}
          onCreateTask={createTask}
          onCreateProject={(data) => createProject(data.name, data.description)}
          onRefreshTasks={refetch}
          userName={getUserName()}
        />
      </main>
    </div>
  );
};

export default Index;
