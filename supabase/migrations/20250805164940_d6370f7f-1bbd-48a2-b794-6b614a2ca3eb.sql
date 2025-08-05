-- Add category field to vibe_projects table
ALTER TABLE public.vibe_projects 
ADD COLUMN category text DEFAULT 'work' CHECK (category IN ('work', 'home', 'personal'));