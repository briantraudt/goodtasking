import { format } from 'date-fns';
import { AlertCircle, CalendarDays, Clock3, FolderKanban, ListTodo, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  scheduled_date?: string | null;
  priority?: 'high' | 'medium' | 'low';
  due_date?: string | null;
  project_id: string;
  vibe_projects?: { name: string };
}

interface Project {
  id: string;
  name: string;
  tasks: Task[];
}

interface DashboardMorningBriefProps {
  projects: Project[];
  tasks: Task[];
  selectedDate: string;
  userName?: string;
  viewMode: 'planner' | 'today' | 'week';
  onChangeView: (view: 'planner' | 'today' | 'week') => void;
  onPlanDay: () => void;
}

const DashboardMorningBrief = ({
  projects,
  tasks,
  selectedDate,
  userName = 'there',
  viewMode,
  onChangeView,
  onPlanDay,
}: DashboardMorningBriefProps) => {
  const selectedDateLabel = format(new Date(`${selectedDate}T12:00:00`), 'EEEE, MMMM d');
  const incompleteTasks = tasks.filter((task) => !task.completed);
  const todaysTasks = incompleteTasks.filter((task) => task.scheduled_date === selectedDate);
  const unscheduledTasks = incompleteTasks.filter((task) => !task.scheduled_date);
  const overdueTasks = incompleteTasks.filter(
    (task) => task.due_date && task.due_date < selectedDate
  );
  const highPriorityTasks = incompleteTasks.filter((task) => task.priority === 'high');
  const activeProjects = projects.filter((project) => project.tasks.some((task) => !task.completed));

  const topFocus = [...overdueTasks, ...todaysTasks, ...highPriorityTasks]
    .filter((task, index, list) => list.findIndex((item) => item.id === task.id) === index)
    .slice(0, 3);

  return (
    <Card className="mb-4 border-primary/20 bg-gradient-to-r from-primary/5 via-background to-accent/5 shadow-sm">
      <CardContent className="p-4 md:p-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                Morning brief for {selectedDateLabel}
              </div>
              <div>
                <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
                  Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {userName}.
                </h2>
                <p className="text-sm text-muted-foreground md:text-base">
                  {todaysTasks.length > 0
                    ? `You have ${todaysTasks.length} task${todaysTasks.length === 1 ? '' : 's'} lined up today.`
                    : 'Nothing is firmly lined up today yet, so this is a good time to shape the day.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant={viewMode === 'today' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onChangeView('today')}
              >
                Today
              </Button>
              <Button
                variant={viewMode === 'planner' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onChangeView('planner')}
              >
                Planner
              </Button>
              <Button
                variant={viewMode === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onChangeView('week')}
              >
                Week
              </Button>
              <Button size="sm" className="bg-success text-success-foreground hover:bg-success/90" onClick={onPlanDay}>
                Plan My Day
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg border bg-background/80 p-3">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                <CalendarDays className="h-4 w-4 text-primary" />
                Today
              </div>
              <p className="text-2xl font-semibold">{todaysTasks.length}</p>
              <p className="text-xs text-muted-foreground">Tasks already on today’s plan</p>
            </div>

            <div className="rounded-lg border bg-background/80 p-3">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                <ListTodo className="h-4 w-4 text-primary" />
                Unscheduled
              </div>
              <p className="text-2xl font-semibold">{unscheduledTasks.length}</p>
              <p className="text-xs text-muted-foreground">Open tasks that still need a home</p>
            </div>

            <div className="rounded-lg border bg-background/80 p-3">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                Overdue
              </div>
              <p className="text-2xl font-semibold">{overdueTasks.length}</p>
              <p className="text-xs text-muted-foreground">Tasks that have slipped past their due date</p>
            </div>

            <div className="rounded-lg border bg-background/80 p-3">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                <FolderKanban className="h-4 w-4 text-primary" />
                Active Projects
              </div>
              <p className="text-2xl font-semibold">{activeProjects.length}</p>
              <p className="text-xs text-muted-foreground">Projects with incomplete work in flight</p>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[2fr_1fr]">
            <div className="rounded-lg border bg-background/80 p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold">What deserves attention first</h3>
                  <p className="text-xs text-muted-foreground">
                    A quick shortlist pulled from overdue, scheduled, and high-priority work.
                  </p>
                </div>
                {highPriorityTasks.length > 0 && (
                  <Badge variant="outline">{highPriorityTasks.length} high priority</Badge>
                )}
              </div>

              {topFocus.length > 0 ? (
                <div className="space-y-2">
                  {topFocus.map((task) => (
                    <div key={task.id} className="flex items-start justify-between gap-3 rounded-md border px-3 py-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{task.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {task.vibe_projects?.name || 'Project task'}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-1">
                        {task.due_date && task.due_date < selectedDate && (
                          <Badge variant="destructive">Overdue</Badge>
                        )}
                        {task.scheduled_date === selectedDate && (
                          <Badge variant="secondary">Today</Badge>
                        )}
                        {task.priority === 'high' && <Badge variant="outline">High priority</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  You’re caught up enough that nothing is screaming for attention. This is a good moment to schedule the next important task.
                </p>
              )}
            </div>

            <div className="rounded-lg border bg-background/80 p-3">
              <div className="mb-3 flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Planning signal</h3>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  {unscheduledTasks.length > todaysTasks.length
                    ? 'Your backlog is heavier than today’s plan. Pull only the next few tasks into the day.'
                    : 'Today already has enough defined work. Focus on execution before adding more.'}
                </p>
                <p>
                  {activeProjects.length > 4
                    ? 'You have a lot of active projects open. Consider protecting one focus block for the highest-leverage project.'
                    : 'Your project load looks manageable enough to be intentional about what gets focus time.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardMorningBrief;
