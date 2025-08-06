-- Add color field to vibe_projects table
ALTER TABLE public.vibe_projects 
ADD COLUMN color TEXT DEFAULT '#4DA8DA';