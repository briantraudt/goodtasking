import React from "react";
import { Home, PlusCircle, Settings } from "lucide-react";
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

// Simple, elegant mobile bottom navigation with primary actions
const MobileNav: React.FC<MobileNavProps> = ({ projects, onCreateTask }) => {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="max-w-app mx-auto px-4">
        <div className="grid grid-cols-3 h-16 items-center">
          <Link
            to="/dashboard"
            className="flex flex-col items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Dashboard"
          >
            <Home className="h-5 w-5" />
            <span className="text-[11px] mt-1">Home</span>
          </Link>

          <div className="flex items-center justify-center">
            <AddTaskDialog
              projects={projects}
              onCreateTask={onCreateTask as any}
              triggerButton={
                <button
                  className="inline-flex items-center justify-center rounded-full h-12 w-12 shadow-lg border border-border bg-primary text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  aria-label="Add task"
                >
                  <PlusCircle className="h-5 w-5" />
                </button>
              }
            />
          </div>

          <Link
            to="/settings"
            className="flex flex-col items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
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
