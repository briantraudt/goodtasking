import { format, addDays, startOfWeek } from 'date-fns';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';

interface Project {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  tasks: any[];
  scheduledDay?: string;
}

interface WeeklyCalendarProps {
  projects: Project[];
}

interface DayColumnProps {
  day: Date;
  dayName: string;
  projects: Project[];
}

function DayColumn({ day, dayName, projects }: DayColumnProps) {
  const dayString = format(day, 'yyyy-MM-dd');
  const { isOver, setNodeRef } = useDroppable({
    id: dayString,
  });

  const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex-1 min-h-[120px] p-3 border border-border rounded-lg transition-colors",
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
          <div
            key={project.id}
            className="text-xs p-2 bg-card border border-border rounded text-card-foreground"
          >
            {project.name}
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

export default function WeeklyCalendar({ projects }: WeeklyCalendarProps) {
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
            />
          );
        })}
      </div>
    </div>
  );
}