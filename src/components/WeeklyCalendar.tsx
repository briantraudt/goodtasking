import { useState } from 'react';
import { format, addDays, startOfWeek } from 'date-fns';
import { useDroppable } from '@dnd-kit/core';
import { ChevronLeft, ChevronRight, Focus } from 'lucide-react';
import { cn } from '@/lib/utils';
import DraggableProjectCard from './DraggableProjectCard';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

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
  onFocusModeChange: (isFocused: boolean) => void;
}

interface DayColumnProps {
  day: Date;
  dayName: string;
  projects: Project[];
  onUpdateProject: (id: string, updates: Partial<Project>) => void;
  onDeleteProject: (id: string) => void;
  onCreateTask: (projectId: string, title: string, description?: string, dueDate?: Date) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onFocusToday?: () => void;
}

function DayColumn({ day, dayName, projects, onUpdateProject, onDeleteProject, onCreateTask, onUpdateTask, onFocusToday }: DayColumnProps) {
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
      <div className="text-center mb-3 relative">
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
        
        {/* Focus button - only show on today */}
        {isToday && onFocusToday && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onFocusToday}
            className="absolute -top-1 -right-1 h-6 w-6 p-0 opacity-60 hover:opacity-100"
          >
            <Focus className="h-3 w-3" />
          </Button>
        )}
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

export default function WeeklyCalendar({ projects, onUpdateProject, onDeleteProject, onCreateTask, onUpdateTask, onFocusModeChange }: WeeklyCalendarProps) {
  const isMobile = useIsMobile();
  const [startIndex, setStartIndex] = useState(0);
  const [focusMode, setFocusMode] = useState(false);
  const today = new Date();
  
  // Create 7 consecutive days starting from today
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));
  const dayNames = days.map(day => format(day, 'EEE')); // Get actual day names for each date

  // Today is always index 0 since we start from today
  const todayIndex = 0;
  
  const handleFocusToday = () => {
    const newFocusMode = !focusMode;
    setFocusMode(newFocusMode);
    onFocusModeChange(newFocusMode);
  };
  
  // Mobile: show all days in a single column starting with today
  if (isMobile) {
    // Get 7 consecutive days starting from today
    const allDaysFromToday = days.map((day, index) => ({
      day,
      name: dayNames[index],
      index
    }));
    
    // In focus mode, show only today
    const daysToShow = focusMode ? [{ day: days[0], name: dayNames[0], index: 0 }] : allDaysFromToday;

    return (
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-foreground mb-4">
          {focusMode ? "Today's Focus" : "Weekly Schedule"}
        </h3>
        <div className="space-y-4">
          {daysToShow.map(({ day, name }) => {
            const dayString = format(day, 'yyyy-MM-dd');
            const dayProjects = projects.filter(p => p.scheduledDay === dayString);
            
            return (
              <div key={dayString} className="w-full">
                <DayColumn
                  day={day}
                  dayName={name}
                  projects={dayProjects}
                  onUpdateProject={onUpdateProject}
                  onDeleteProject={onDeleteProject}
                  onCreateTask={onCreateTask}
                  onUpdateTask={onUpdateTask}
                  onFocusToday={handleFocusToday}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Desktop: show carousel-style navigation with 3 visible days
  // In focus mode, show only today
  if (focusMode) {
    const todayProjects = projects.filter(p => p.scheduledDay === format(days[0], 'yyyy-MM-dd'));
    
    return (
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-foreground mb-4">Today's Focus</h3>
        <div className="flex justify-center">
          <div className="w-1/3">
            <DayColumn
              day={days[0]}
              dayName={dayNames[0]}
              projects={todayProjects}
              onUpdateProject={onUpdateProject}
              onDeleteProject={onDeleteProject}
              onCreateTask={onCreateTask}
              onUpdateTask={onUpdateTask}
              onFocusToday={handleFocusToday}
            />
          </div>
        </div>
      </div>
    );
  }

  // Desktop: show carousel-style navigation with 3 visible days
  // Get 3 consecutive days starting from startIndex
  const visibleDays = [];
  for (let i = 0; i < 3; i++) {
    const dayIndex = startIndex + i;
    if (dayIndex < 7) {
      visibleDays.push({ day: days[dayIndex], name: dayNames[dayIndex], index: dayIndex });
    }
  }
  
  const canGoBack = startIndex > 0;
  const canGoForward = startIndex < 4; // We can show up to 4 more positions (0,1,2,3,4 = 5 total positions for 7 days showing 3 at a time)
  
  const goBack = () => {
    if (canGoBack) {
      setStartIndex(startIndex - 1);
    }
  };
  
  const goForward = () => {
    if (canGoForward) {
      setStartIndex(startIndex + 1);
    }
  };

  return (
    <div className="mb-8">
      <h3 className="text-xl font-semibold text-foreground mb-4">Weekly Schedule</h3>
      
      {/* Carousel layout with navigation arrows */}
      <div className="flex items-center gap-4">
        {/* Back arrow */}
        <Button
          variant="outline"
          size="icon"
          onClick={goBack}
          disabled={!canGoBack}
          className="shrink-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        {/* Three visible day cards */}
        <div className="grid grid-cols-3 gap-4 flex-1">
          {visibleDays.map(({ day, name }) => {
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
                onFocusToday={name === dayNames[0] ? handleFocusToday : undefined}
              />
            );
          })}
        </div>
        
        {/* Forward arrow */}
        <Button
          variant="outline"
          size="icon"
          onClick={goForward}
          disabled={!canGoForward}
          className="shrink-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}