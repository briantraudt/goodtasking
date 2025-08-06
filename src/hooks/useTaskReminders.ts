import { useEffect } from 'react';
import { useNotifications } from './useNotifications';
import { isToday, parseISO, format, differenceInMinutes } from 'date-fns';

interface Task {
  id: string;
  title: string;
  due_date?: string | null;
  start_time?: string;
  end_time?: string;
  scheduled_date?: string | null;
  completed: boolean;
  vibe_projects?: { name: string };
}

interface UseTaskRemindersProps {
  tasks: Task[];
}

export const useTaskReminders = ({ tasks }: UseTaskRemindersProps) => {
  const { notifyTaskDue, permission } = useNotifications();

  useEffect(() => {
    if (permission !== 'granted') return;

    // Check for upcoming tasks every minute
    const interval = setInterval(() => {
      const now = new Date();
      const todayString = format(now, 'yyyy-MM-dd');

      tasks.forEach(task => {
        if (task.completed) return;

        // Check scheduled tasks for today
        if (task.scheduled_date === todayString && task.start_time) {
          try {
            const [hours, minutes] = task.start_time.split(':').map(Number);
            const taskStartTime = new Date();
            taskStartTime.setHours(hours, minutes, 0, 0);
            
            const minutesUntilStart = differenceInMinutes(taskStartTime, now);
            
            // Notify 15 minutes before task starts
            if (minutesUntilStart === 15) {
              const timeStr = format(taskStartTime, 'h:mm a');
              notifyTaskDue(task.title, timeStr, task.id);
            }
          } catch (error) {
            console.error('Error parsing task start time:', error);
          }
        }

        // Check due date tasks
        if (task.due_date) {
          try {
            const dueDate = parseISO(task.due_date);
            
            // Only check if due today
            if (isToday(dueDate)) {
              const minutesUntilDue = differenceInMinutes(dueDate, now);
              
              // Notify 1 hour before due date
              if (minutesUntilDue === 60) {
                const timeStr = format(dueDate, 'h:mm a');
                notifyTaskDue(task.title, timeStr, task.id);
              }
              
              // Notify when overdue (5 minutes after due time)
              if (minutesUntilDue === -5) {
                notifyTaskDue(`OVERDUE: ${task.title}`, 'now', task.id);
              }
            }
          } catch (error) {
            console.error('Error parsing task due date:', error);
          }
        }
      });
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [tasks, permission, notifyTaskDue]);

  // Check for daily summary notification
  useEffect(() => {
    if (permission !== 'granted') return;

    // Send daily summary at 6 PM
    const checkDailySummary = () => {
      const now = new Date();
      if (now.getHours() === 18 && now.getMinutes() === 0) {
        const todayString = format(now, 'yyyy-MM-dd');
        const todayTasks = tasks.filter(task => 
          task.scheduled_date === todayString || 
          (task.due_date && isToday(parseISO(task.due_date)))
        );
        
        const completed = todayTasks.filter(task => task.completed).length;
        const pending = todayTasks.filter(task => !task.completed).length;
        
        if (todayTasks.length > 0) {
          // This would need to be implemented in useNotifications
          // notifyDailySummary(completed, pending);
        }
      }
    };

    const interval = setInterval(checkDailySummary, 60000);
    return () => clearInterval(interval);
  }, [tasks, permission]);
};