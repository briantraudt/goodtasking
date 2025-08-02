-- Add unique constraint to prevent duplicate project names per user
ALTER TABLE public.vibe_projects 
ADD CONSTRAINT unique_project_name_per_user 
UNIQUE (user_id, name);