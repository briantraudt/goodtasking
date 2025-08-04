import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus } from 'lucide-react';
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
      <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-elevated bg-white z-50">
        <DropdownMenuItem asChild>
          <div className="p-3 cursor-pointer rounded-lg hover:bg-gray-50 transition-colors">
            <AddTaskDialog
              projects={projects}
              onCreateTask={onCreateTask}
              triggerButton={
                <span className="text-task-title text-gray-900">Add Task</span>
              }
            />
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <div className="p-3 cursor-pointer rounded-lg hover:bg-gray-50 transition-colors">
            <CreateProjectDialog onCreateProject={onCreateProject}>
              <span className="text-task-title text-gray-900">Add Project</span>
            </CreateProjectDialog>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SmartAddButton;