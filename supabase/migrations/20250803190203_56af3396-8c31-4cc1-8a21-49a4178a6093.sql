-- Add missing columns to vibe_tasks table for enhanced scheduling
ALTER TABLE public.vibe_tasks 
ADD COLUMN priority text DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
ADD COLUMN estimated_duration integer DEFAULT 30, -- duration in minutes
ADD COLUMN due_date date;

-- Add index for better performance on priority and due_date queries
CREATE INDEX idx_vibe_tasks_priority ON public.vibe_tasks(priority);
CREATE INDEX idx_vibe_tasks_due_date ON public.vibe_tasks(due_date);
CREATE INDEX idx_vibe_tasks_scheduled_date ON public.vibe_tasks(scheduled_date);