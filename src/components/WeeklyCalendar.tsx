import { format, addDays, startOfWeek } from 'date-fns';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
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
  created_at: string;
  updated_at: string;
  tasks: Task[];
  scheduledDay?: string;
}

interface WeeklyCalendarProps {
  projects: Project[];
  onUpdateProject: (id: string, updates: Partial<Project>) => void;
  onDeleteProject: (id: string) => void;
  onCreateTask: (projectId: string, title: string, description?: string, dueDate?: Date) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
}

interface DayColumnProps {
  day: Date;
  dayName: string;
  projects: Project[];
  onUpdateProject: (id: string, updates: Partial<Project>) => void;
  onDeleteProject: (id: string) => void;
  onCreateTask: (projectId: string, title: string, description?: string, dueDate?: Date) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
}

function DayColumn({ day, dayName, projects, onUpdateProject, onDeleteProject, onCreateTask, onUpdateTask }: DayColumnProps) {
  const dayString = format(day, 'yyyy-MM-dd');
  const { isOver, setNodeRef } = useDroppable({
    id: dayString,
  });

  const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex-1 min-h-[200px] p-2 border border-border rounded-lg transition-colors",
        isOver && "bg-accent/50 border-primary",
        isToday && "bg-primary/5 border-primary/20"
      )}
    >
      <div className="text-center mb-2">
        <div className={cn(
          "text-sm font-medium",
          isToday ? "text-primary" : "text-foreground"
        )}>
          {dayName}
        </div>
        <div className={cn(
          "text-xs",
          isToday ? "text-primary" : "text-muted-foreground"
        )}>
          {format(day, 'MMM d')}
        </div>
      </div>
      
      <div className="space-y-2">
        {projects.map((project) => (
          <div key={project.id} className="transform scale-90 origin-top">
            <ProjectCard
              project={project}
              onUpdateProject={onUpdateProject}
              onDeleteProject={onDeleteProject}
              onCreateTask={onCreateTask}
              onUpdateTask={onUpdateTask}
            />
          </div>
        ))}
      </div>
      
      {isOver && (
        <div className="mt-2 text-xs text-primary text-center">
          Drop here
        </div>
      )}
    </div>
  );
}

export default function WeeklyCalendar({ projects, onUpdateProject, onDeleteProject, onCreateTask, onUpdateTask }: WeeklyCalendarProps) {
  const today = new Date();
  const startOfThisWeek = startOfWeek(today, { weekStartsOn: 0 }); // Start on Sunday
  
  const days = Array.from({ length: 7 }, (_, i) => addDays(startOfThisWeek, i));
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="mb-8">
      <h3 className="text-xl font-semibold text-foreground mb-4">Weekly Schedule</h3>
      <div className="grid grid-cols-7 gap-3">
        {days.map((day, index) => {
          const dayString = format(day, 'yyyy-MM-dd');
          const dayProjects = projects.filter(p => p.scheduledDay === dayString);
          
          return (
            <DayColumn
              key={dayString}
              day={day}
              dayName={dayNames[index]}
              projects={dayProjects}
              onUpdateProject={onUpdateProject}
              onDeleteProject={onDeleteProject}
              onCreateTask={onCreateTask}
              onUpdateTask={onUpdateTask}
            />
          );
        })}
      </div>
    </div>
  );
}