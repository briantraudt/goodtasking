import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, FolderPlus, ListPlus } from 'lucide-react';
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
      <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-elevated">
        <DropdownMenuItem asChild>
          <div className="flex items-center gap-3 p-3 cursor-pointer rounded-lg hover:bg-primary/10 transition-colors">
            <AddTaskDialog
              projects={projects}
              onCreateTask={onCreateTask}
              triggerButton={
                <>
                  <ListPlus className="h-4 w-4 text-primary" />
                  <div className="flex flex-col">
                    <span className="text-task-title">Add Task</span>
                    <span className="text-caption">Create a new task</span>
                  </div>
                </>
              }
            />
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <div className="flex items-center gap-3 p-3 cursor-pointer rounded-lg hover:bg-primary/10 transition-colors">
            <CreateProjectDialog onCreateProject={onCreateProject}>
              <div className="flex items-center gap-3">
                <FolderPlus className="h-4 w-4 text-primary" />
                <div className="flex flex-col">
                  <span className="text-task-title">Add Project</span>
                  <span className="text-caption">Create a new project</span>
                </div>
              </div>
            </CreateProjectDialog>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SmartAddButton;