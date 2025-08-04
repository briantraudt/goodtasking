import React, { useMemo } from 'react';
import Timeline from 'react-calendar-timeline';
import moment from 'moment';
import 'react-calendar-timeline/lib/Timeline.css';

interface Task {
  id: string;
  title: string;
  priority?: 'high' | 'medium' | 'low';
  estimated_duration?: number;
  start_time?: string;
  end_time?: string;
  scheduled_date?: string | null;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  location?: string;
  description?: string;
}

interface CalendarTimelineProps {
  events: CalendarEvent[];
  scheduledTasks: Task[];
  selectedDate: Date;
  onItemMove: (itemId: string, dragTime: number, newGroupOrder: number) => void;
  onItemResize: (itemId: string, time: number, edge: 'left' | 'right') => void;
  onCanvasClick: (groupId: number, time: number, e: React.SyntheticEvent) => void;
  className?: string;
}

const CalendarTimeline: React.FC<CalendarTimelineProps> = ({
  events,
  scheduledTasks,
  selectedDate,
  onItemMove,
  onItemResize,
  onCanvasClick,
  className
}) => {
  const groups = useMemo(() => [
    { id: 1, title: 'Schedule', rightTitle: 'Events & Tasks' }
  ], []);

  const items = useMemo(() => {
    const timelineItems = [];
    
    // Add calendar events
    events.forEach((event) => {
      const startTime = moment(event.start);
      const endTime = moment(event.end);
      
      timelineItems.push({
        id: `event-${event.id}`,
        group: 1,
        title: event.title,
        start_time: startTime,
        end_time: endTime,
        canMove: false,
        canResize: false,
        itemProps: {
          style: {
            backgroundColor: 'hsl(var(--calendar-event))',
            borderColor: 'hsl(var(--calendar-event-border))',
            color: 'hsl(var(--calendar-event-foreground))',
            borderRadius: '6px',
            border: '1px solid',
          }
        }
      });
    });

    // Add scheduled tasks
    scheduledTasks.forEach((task) => {
      if (task.start_time && task.end_time && task.scheduled_date) {
        const taskDate = moment(task.scheduled_date);
        const [startHour, startMin] = task.start_time.split(':').map(Number);
        const [endHour, endMin] = task.end_time.split(':').map(Number);
        
        const startTime = taskDate.clone().hour(startHour).minute(startMin);
        const endTime = taskDate.clone().hour(endHour).minute(endMin);

        let backgroundColor = 'hsl(var(--task-default))';
        if (task.priority === 'high') backgroundColor = 'hsl(var(--priority-high))';
        else if (task.priority === 'medium') backgroundColor = 'hsl(var(--priority-medium))';
        else if (task.priority === 'low') backgroundColor = 'hsl(var(--priority-low))';

        timelineItems.push({
          id: `task-${task.id}`,
          group: 1,
          title: task.title,
          start_time: startTime,
          end_time: endTime,
          canMove: true,
          canResize: true,
          itemProps: {
            style: {
              backgroundColor,
              borderColor: 'hsl(var(--border))',
              color: 'hsl(var(--foreground))',
              borderRadius: '6px',
              border: '1px solid',
            }
          }
        });
      }
    });

    return timelineItems;
  }, [events, scheduledTasks]);

  const timeStart = moment(selectedDate).startOf('day');
  const timeEnd = moment(selectedDate).endOf('day');

  return (
    <div className={className}>
      <Timeline
        groups={groups}
        items={items}
        defaultTimeStart={timeStart.valueOf()}
        defaultTimeEnd={timeEnd.valueOf()}
        timeSteps={{
          second: 1,
          minute: 15,
          hour: 1,
          day: 1,
          month: 1,
          year: 1
        }}
        onItemMove={onItemMove}
        onItemResize={onItemResize}
        onCanvasClick={onCanvasClick}
        stackItems={true}
        lineHeight={60}
        itemHeightRatio={0.75}
        canMove={true}
        canResize={true}
        traditionalZoom={true}
        style={{
          fontFamily: 'inherit',
        }}
      />
    </div>
  );
};

export default CalendarTimeline;