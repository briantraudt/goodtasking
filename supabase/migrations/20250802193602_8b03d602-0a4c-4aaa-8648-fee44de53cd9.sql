-- Add scheduled_date field to tasks for proper day-based scheduling
ALTER TABLE public.vibe_tasks 
ADD COLUMN scheduled_date DATE;