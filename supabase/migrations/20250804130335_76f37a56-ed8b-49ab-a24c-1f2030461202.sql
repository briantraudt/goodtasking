-- Add start_time and end_time columns to vibe_tasks table
ALTER TABLE public.vibe_tasks
ADD COLUMN start_time TIME,
ADD COLUMN end_time TIME;