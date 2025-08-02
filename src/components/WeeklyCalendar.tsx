import { useState } from 'react';
import { format, addDays, startOfWeek } from 'date-fns';
import { useDroppable } from '@dnd-kit/core';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import ProjectCard from './ProjectCard';
import DraggableProjectCard from './DraggableProjectCard';
import { Button } from '@/components/ui/button';

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
        "flex-1 min-h-[200px] p-3 border border-border rounded-lg transition-colors",
        isOver && "bg-accent/50 border-primary",
        isToday && "bg-primary/5 border-primary/20"
      )}
    >
      <div className="text-center mb-3">
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
          <div key={project.id} className="transform scale-95 origin-top">
            <DraggableProjectCard
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
  const [showAllDays, setShowAllDays] = useState(false);
  const today = new Date();
  const startOfThisWeek = startOfWeek(today, { weekStartsOn: 0 }); // Start on Sunday
  
  const days = Array.from({ length: 7 }, (_, i) => addDays(startOfThisWeek, i));
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Find today's index
  const todayIndex = days.findIndex(day => format(day, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd'));
  
  // Get the first 3 days starting from today
  const primaryDays = [];
  for (let i = 0; i < 3; i++) {
    const dayIndex = (todayIndex + i) % 7;
    primaryDays.push({ day: days[dayIndex], name: dayNames[dayIndex], index: dayIndex });
  }
  
  // Get remaining days
  const remainingDays = [];
  for (let i = 3; i < 7; i++) {
    const dayIndex = (todayIndex + i) % 7;
    remainingDays.push({ day: days[dayIndex], name: dayNames[dayIndex], index: dayIndex });
  }

  return (
    <div className="mb-8">
      <h3 className="text-xl font-semibold text-foreground mb-4">Weekly Schedule</h3>
      
      {/* Primary 3 days */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {primaryDays.map(({ day, name }) => {
          const dayString = format(day, 'yyyy-MM-dd');
          const dayProjects = projects.filter(p => p.scheduledDay === dayString);
          
          return (
            <DayColumn
              key={dayString}
              day={day}
              dayName={name}
              projects={dayProjects}
              onUpdateProject={onUpdateProject}
              onDeleteProject={onDeleteProject}
              onCreateTask={onCreateTask}
              onUpdateTask={onUpdateTask}
            />
          );
        })}
      </div>
      
      {/* Toggle button and remaining days */}
      <div className="mt-4">
        <Button
          variant="outline"
          onClick={() => setShowAllDays(!showAllDays)}
          className="mb-4 w-full"
        >
          {showAllDays ? (
            <>
              <ChevronDown className="h-4 w-4 mr-2" />
              Show Less
            </>
          ) : (
            <>
              <ChevronRight className="h-4 w-4 mr-2" />
              Show More Days
            </>
          )}
        </Button>
        
        {showAllDays && (
          <div className="grid grid-cols-4 gap-3">
            {remainingDays.map(({ day, name }) => {
              const dayString = format(day, 'yyyy-MM-dd');
              const dayProjects = projects.filter(p => p.scheduledDay === dayString);
              
              return (
                <DayColumn
                  key={dayString}
                  day={day}
                  dayName={name}
                  projects={dayProjects}
                  onUpdateProject={onUpdateProject}
                  onDeleteProject={onDeleteProject}
                  onCreateTask={onCreateTask}
                  onUpdateTask={onUpdateTask}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}