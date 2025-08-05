import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import ProjectCard from './ProjectCard';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  due_date?: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  category: 'work' | 'home' | 'personal';
  created_at: string;
  updated_at: string;
  tasks: Task[];
  scheduledDay?: string;
}

interface DraggableProjectCardProps {
  project: Project;
  onUpdateProject: (id: string, updates: Partial<Project>) => void;
  onDeleteProject: (id: string) => void;
  onCreateTask: (projectId: string, title: string, description?: string, dueDate?: Date) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
}

export default function DraggableProjectCard({
  project,
  onUpdateProject,
  onDeleteProject,
  onCreateTask,
  onUpdateTask,
}: DraggableProjectCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: project.id,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative"
    >
      {/* Drag handle - only the header area */}
      <div
        {...listeners}
        {...attributes}
        className="absolute top-2 right-2 w-6 h-6 cursor-grab active:cursor-grabbing opacity-50 hover:opacity-100 transition-opacity z-10"
      >
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
          <div className="w-1 h-1 bg-muted-foreground rounded-full ml-1"></div>
          <div className="w-1 h-1 bg-muted-foreground rounded-full ml-1"></div>
        </div>
      </div>
      
      {/* Project card with normal functionality */}
      <ProjectCard
        project={project}
        onUpdateProject={onUpdateProject}
        onDeleteProject={onDeleteProject}
        onCreateTask={onCreateTask}
        onUpdateTask={onUpdateTask}
      />
    </div>
  );
}