import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, CheckSquare, FolderPlus } from 'lucide-react';
import AddTaskDialog from '@/components/AddTaskDialog';
import CreateProjectDialog from '@/components/CreateProjectDialog';

interface Project {
  id: string;
  name: string;
  tasks: any[];
}

interface SmartAddButtonProps {
  projects: Project[];
  onCreateTask?: (projectId: string, title: string, scheduledDate: Date) => void;
  onCreateProject?: (project: { name: string; description: string; tasks: any[] }) => void;
}

const SmartAddButton = ({ projects, onCreateTask, onCreateProject }: SmartAddButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          className="btn-gradient-hover rounded-xl font-semibold shadow-soft hover:shadow-card transition-all duration-200"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-elevated bg-white z-50 p-1">
        <AddTaskDialog
          projects={projects}
          onCreateTask={onCreateTask}
          triggerButton={
            <button className="w-full cursor-pointer rounded-lg hover:bg-primary hover:text-white transition-colors flex items-center gap-3 p-3 text-left">
              <CheckSquare className="h-4 w-4" />
              <span className="font-medium">Task</span>
            </button>
          }
        />
        <CreateProjectDialog onCreateProject={onCreateProject}>
          <button className="w-full cursor-pointer rounded-lg hover:bg-primary hover:text-white transition-colors flex items-center gap-3 p-3 text-left">
            <FolderPlus className="h-4 w-4" />
            <span className="font-medium">Project</span>
          </button>
        </CreateProjectDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SmartAddButton;