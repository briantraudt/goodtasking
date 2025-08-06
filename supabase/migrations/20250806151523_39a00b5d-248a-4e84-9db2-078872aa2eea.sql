-- Fix the category constraint to be case-insensitive and more flexible
-- First, let's drop the existing constraint if it exists
ALTER TABLE public.vibe_projects DROP CONSTRAINT IF EXISTS vibe_projects_category_check;

-- Add a more flexible constraint that accepts both uppercase and lowercase
ALTER TABLE public.vibe_projects ADD CONSTRAINT vibe_projects_category_check 
CHECK (LOWER(category) IN ('work', 'home', 'personal'));

-- Update any existing records to ensure consistency (lowercase)
UPDATE public.vibe_projects 
SET category = LOWER(category) 
WHERE category IS NOT NULL;