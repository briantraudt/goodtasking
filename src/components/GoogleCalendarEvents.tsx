import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, ExternalLink, Loader2, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

interface GoogleCalendarEventsProps {
  className?: string;
}

const GoogleCalendarEvents = ({ className }: GoogleCalendarEventsProps) => {
  const { isConnected, events, loading, connectCalendar, disconnectCalendar } = useGoogleCalendar();

  const formatEventTime = (start: string, end: string, isAllDay: boolean) => {
    if (isAllDay) {
      return 'All day';
    }

    try {
      const startTime = format(parseISO(start), 'h:mm a');
      const endTime = format(parseISO(end), 'h:mm a');
      return `${startTime} — ${endTime}`;
    } catch {
      return 'Time unavailable';
    }
  };

  const getEventDuration = (start: string, end: string, isAllDay: boolean) => {
    if (isAllDay) return null;

    try {
      const startDate = parseISO(start);
      const endDate = parseISO(end);
      const diffMinutes = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));
      
      if (diffMinutes < 60) {
        return `${diffMinutes}m`;
      } else {
        const hours = Math.floor(diffMinutes / 60);
        const minutes = diffMinutes % 60;
        return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
      }
    } catch {
      return null;
    }
  };

  if (!isConnected) {
    return (
      <Card className={cn("border-dashed border-2", className)}>
        <CardContent className="flex flex-col items-center justify-center py-6 text-center">
          <Calendar className="h-8 w-8 text-muted-foreground mb-3" />
          <h3 className="text-lg font-semibold mb-2">Connect Your Calendar</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm">
            Connect your Google Calendar to see upcoming events alongside your tasks.
          </p>
          <Button onClick={connectCalendar} variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Connect Google Calendar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            📅 Upcoming Events
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              asChild
            >
              <a
                href="https://calendar.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                <span className="text-xs">Open Calendar</span>
              </a>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={disconnectCalendar}
              className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <X className="h-3 w-3" />
              <span className="text-xs">Disconnect</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <span className="text-sm text-muted-foreground">Loading events...</span>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-4">
            <Calendar className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No events today</p>
          </div>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className="flex items-start gap-3 p-3 rounded-lg bg-blue-50/50 border border-blue-100 hover:bg-blue-50 transition-colors"
            >
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-medium text-sm text-gray-900 leading-tight">
                    {event.title}
                  </h4>
                  {!event.isAllDay && (
                    <Badge variant="outline" className="text-xs bg-white">
                      <Clock className="h-2.5 w-2.5 mr-1" />
                      {getEventDuration(event.start, event.end, event.isAllDay)}
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatEventTime(event.start, event.end, event.isAllDay)}
                  </div>
                  
                  {event.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate max-w-[120px]">{event.location}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default GoogleCalendarEvents;