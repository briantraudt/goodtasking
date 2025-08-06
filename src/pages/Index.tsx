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
    updateProject,
    deleteProject,
    createTask,
    updateTask,
    deleteTask,
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
      
      {/* Fixed Height Main Content with Independent Scrolling */}
      <main className="overflow-hidden">
        <div className="max-w-app mx-auto px-6 py-6 h-[calc(100vh-140px)] overflow-hidden">
          <DashboardView
            projects={projects}
            onCreateProject={(data) => createProject(data.name, data.description, data.category)}
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
    </div>
  );
};

export default Index;
