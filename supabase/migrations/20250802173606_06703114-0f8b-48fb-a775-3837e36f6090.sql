-- Add scheduled_day column to vibe_projects table
ALTER TABLE public.vibe_projects 
ADD COLUMN scheduled_day DATE;