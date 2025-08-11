import React, { useCallback } from "react";
import { Home, Settings, CheckSquare, FolderOpen } from "lucide-react";
import { Link } from "react-router-dom";
import AddTaskDialog from "@/components/AddTaskDialog";

interface Project {
  id: string;
  name: string;
}

interface MobileNavProps {
  projects: Project[];
  onCreateTask: (projectId: string, title: string, description?: string, dueDate?: Date) => Promise<any> | void;
}

// Mobile bottom navigation with Tasks/Projects switches
const MobileNav: React.FC<MobileNavProps> = ({ projects, onCreateTask }) => {
  const showTasks = useCallback(() => {
    window.dispatchEvent(new CustomEvent('dashboard-show-tasks'));
  }, []);
  const showProjects = useCallback(() => {
    window.dispatchEvent(new CustomEvent('dashboard-show-projects'));
  }, []);

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="max-w-app mx-auto px-4">
        <div className="grid grid-cols-4 h-16 items-center">
  <Link
            to="/dashboard"
            onClick={() => window.dispatchEvent(new CustomEvent('dashboard-show-home'))}
            className="flex flex-col items-center justify-center text-navy-blue hover:text-navy-blue transition-colors"
            aria-label="Home"
          >
            <Home className="h-5 w-5" />
            <span className="text-[11px] mt-1">Home</span>
          </Link>

          <button
            onClick={showTasks}
            className="flex flex-col items-center justify-center text-navy-blue hover:text-navy-blue transition-colors"
            aria-label="Tasks"
          >
            <CheckSquare className="h-5 w-5" />
            <span className="text-[11px] mt-1">Tasks</span>
          </button>


          <button
            onClick={showProjects}
            className="flex flex-col items-center justify-center text-navy-blue hover:text-navy-blue transition-colors"
            aria-label="Projects"
          >
            <FolderOpen className="h-5 w-5" />
            <span className="text-[11px] mt-1">Projects</span>
          </button>

          <Link
            to="/settings"
            className="flex flex-col items-center justify-center text-navy-blue hover:text-navy-blue transition-colors"
            aria-label="Settings"
          >
            <Settings className="h-5 w-5" />
            <span className="text-[11px] mt-1">Settings</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default MobileNav;
