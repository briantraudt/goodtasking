-- Add source field to calendar_events table to distinguish local vs Google Calendar events
ALTER TABLE public.calendar_events ADD COLUMN source text DEFAULT 'local' NOT NULL;

-- Add a check constraint to ensure valid source values
ALTER TABLE public.calendar_events ADD CONSTRAINT calendar_events_source_check 
CHECK (source IN ('local', 'google'));

-- Update existing Google Calendar events to have 'google' source
UPDATE public.calendar_events 
SET source = 'google' 
WHERE google_event_id IS NOT NULL AND google_event_id != '' AND NOT google_event_id LIKE 'quick-created-%';

-- Create index for better performance when filtering by source
CREATE INDEX idx_calendar_events_source ON public.calendar_events(source);

-- Update the google_event_id to be nullable and remove the NOT NULL constraint since local events won't have it
ALTER TABLE public.calendar_events ALTER COLUMN google_event_id DROP NOT NULL;