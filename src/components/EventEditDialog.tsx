import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface EventEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string | null;
  onEventUpdated: () => void;
  onOptimisticUpdate?: (eventId: string, updates: Partial<EventData>) => void;
}

interface EventData {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
}

export const EventEditDialog: React.FC<EventEditDialogProps> = ({
  isOpen,
  onClose,
  eventId,
  onEventUpdated,
  onOptimisticUpdate
}) => {
  const { session } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  useEffect(() => {
    if (isOpen && eventId) {
      fetchEventData();
    } else if (!isOpen) {
      // Reset form when dialog closes
      setTitle('');
      setDescription('');
      setStartDate('');
      setStartTime('');
      setEndTime('');
    }
  }, [isOpen, eventId]);

  const fetchEventData = async () => {
    if (!eventId) return;

    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('id', eventId)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        toast({
          title: "Event Not Found",
          description: "The event could not be found.",
          variant: "destructive",
        });
        onClose();
        return;
      }

      setEventData(data);
      setTitle(data.title || '');
      setDescription(data.description || '');
      
      // Parse start time - convert UTC to local
      const startDateTime = new Date(data.start_time);
      const localStartDate = startDateTime.toISOString().split('T')[0];
      const localStartTime = startDateTime.toTimeString().slice(0, 5);
      setStartDate(localStartDate);
      setStartTime(localStartTime);
      
      // Parse end time - convert UTC to local
      const endDateTime = new Date(data.end_time);
      const localEndTime = endDateTime.toTimeString().slice(0, 5);
      setEndTime(localEndTime);

      console.log('Event data loaded:', {
        title: data.title,
        startDate: localStartDate,
        startTime: localStartTime,
        endTime: localEndTime
      });

    } catch (error) {
      console.error('Error fetching event:', error);
      toast({
        title: "Error",
        description: "Failed to load event data.",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    if (!eventId || !title.trim()) return;

    setLoading(true);
    try {
      // Convert local time to proper UTC timestamp
      const startDateTime = new Date(`${startDate}T${startTime}`);
      const endDateTime = new Date(`${startDate}T${endTime}`);
      
      console.log('🔄 Updating event with times:', {
        localStart: `${startDate}T${startTime}`,
        localEnd: `${startDate}T${endTime}`,
        utcStart: startDateTime.toISOString(),
        utcEnd: endDateTime.toISOString()
      });

      // Optimistic update - immediately update UI
      if (onOptimisticUpdate && eventId) {
        onOptimisticUpdate(eventId, {
          title: title.trim(),
          description: description.trim() || undefined,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
        });
      }

      const { error } = await supabase
        .from('calendar_events')
        .update({
          title: title.trim(),
          description: description.trim() || null,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
        })
        .eq('id', eventId);

      if (error) {
        // Revert optimistic update on error
        if (eventData && onOptimisticUpdate && eventId) {
          onOptimisticUpdate(eventId, {
            title: eventData.title,
            description: eventData.description,
            start_time: eventData.start_time,
            end_time: eventData.end_time,
          });
        }
        throw error;
      }

      toast({
        title: "Event Updated",
        description: "Your event has been successfully updated.",
      });

      onEventUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating event:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!eventId) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      toast({
        title: "Event Deleted",
        description: "Your event has been successfully deleted.",
      });

      onEventUpdated();
      onClose();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Event Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter event title..."
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter event description..."
              rows={3}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="start-time">Start Time</Label>
              <Input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end-time">End Time</Label>
              <Input
                id="end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete Event"}
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={loading || !title.trim()}
          >
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};