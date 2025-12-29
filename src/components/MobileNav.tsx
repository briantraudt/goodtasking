import React, { useCallback, useState, useEffect } from "react";
import { Home, Settings, CheckSquare, FolderOpen } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import SmartAddButton from "@/components/SmartAddButton";
import { cn } from "@/lib/utils";

interface Project {
  id: string;
  name: string;
}

interface MobileNavProps {
  projects: Project[];
  onCreateTask: (projectId: string, title: string, description?: string, dueDate?: Date) => Promise<any> | void;
  onCreateProject?: (project: { name: string; description?: string; category: string; color?: string; tasks: any[] }) => void;
}

// Mobile bottom navigation with Tasks/Projects switches and center + button
const MobileNav: React.FC<MobileNavProps> = ({ projects, onCreateTask, onCreateProject }) => {
  const location = useLocation();
  const [activePane, setActivePane] = useState<'home' | 'tasks' | 'projects'>('home');

  // Listen for pane changes from dashboard
  useEffect(() => {
    const handlePaneChange = (pane: 'home' | 'tasks' | 'projects') => () => setActivePane(pane);
    
    window.addEventListener('dashboard-show-home', handlePaneChange('home'));
    window.addEventListener('dashboard-show-tasks', handlePaneChange('tasks'));
    window.addEventListener('dashboard-show-projects', handlePaneChange('projects'));
    
    return () => {
      window.removeEventListener('dashboard-show-home', handlePaneChange('home'));
      window.removeEventListener('dashboard-show-tasks', handlePaneChange('tasks'));
      window.removeEventListener('dashboard-show-projects', handlePaneChange('projects'));
    };
  }, []);

  const showTasks = useCallback(() => {
    setActivePane('tasks');
    window.dispatchEvent(new CustomEvent('dashboard-show-tasks'));
  }, []);
  
  const showProjects = useCallback(() => {
    setActivePane('projects');
    window.dispatchEvent(new CustomEvent('dashboard-show-projects'));
  }, []);

  const showHome = useCallback(() => {
    setActivePane('home');
    window.dispatchEvent(new CustomEvent('dashboard-show-home'));
  }, []);

  const isSettings = location.pathname === '/settings';
  const isDashboard = location.pathname === '/dashboard' || location.pathname === '/';

  const NavButton = ({ 
    isActive, 
    onClick, 
    icon: Icon, 
    label 
  }: { 
    isActive: boolean; 
    onClick: () => void; 
    icon: React.ElementType; 
    label: string; 
  }) => (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center transition-all duration-200 min-h-[44px] min-w-[44px] rounded-lg",
        isActive 
          ? "text-primary bg-primary/10" 
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
      )}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon className={cn("h-5 w-5 transition-transform", isActive && "scale-110")} />
      <span className={cn(
        "text-[11px] mt-0.5 font-medium transition-colors",
        isActive && "text-primary"
      )}>{label}</span>
    </button>
  );

  return (
    <nav 
      className="fixed bottom-0 inset-x-0 z-50 border-t border-border bg-card/98 backdrop-blur-lg supports-[backdrop-filter]:bg-card/95 safe-area-inset-bottom"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="mx-auto px-4 pb-safe">
        <div className="grid grid-cols-5 h-16 items-center gap-2">

          <NavButton
            isActive={isDashboard && activePane === 'home'}
            onClick={showHome}
            icon={Home}
            label="Home"
          />

          <NavButton
            isActive={isDashboard && activePane === 'tasks'}
            onClick={showTasks}
            icon={CheckSquare}
            label="Tasks"
          />

          {/* Center + button */}
          <div className="flex items-center justify-center">
            <SmartAddButton
              projects={projects as any}
              onCreateTask={onCreateTask as any}
              onCreateProject={onCreateProject as any}
            />
          </div>

          <NavButton
            isActive={isDashboard && activePane === 'projects'}
            onClick={showProjects}
            icon={FolderOpen}
            label="Projects"
          />

          <Link
            to="/settings"
            className={cn(
              "flex flex-col items-center justify-center transition-all duration-200 min-h-[44px] min-w-[44px] rounded-lg",
              isSettings 
                ? "text-primary bg-primary/10" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
            aria-label="Settings"
            aria-current={isSettings ? 'page' : undefined}
          >
            <Settings className={cn("h-5 w-5 transition-transform", isSettings && "scale-110")} />
            <span className={cn(
              "text-[11px] mt-0.5 font-medium transition-colors",
              isSettings && "text-primary"
            )}>Settings</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default MobileNav;
