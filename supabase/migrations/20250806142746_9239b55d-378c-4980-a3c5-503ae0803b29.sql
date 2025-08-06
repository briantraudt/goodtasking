-- Create a table for user-defined project categories
CREATE TABLE public.project_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#4DA8DA',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Enable Row Level Security
ALTER TABLE public.project_categories ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own categories" 
ON public.project_categories 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own categories" 
ON public.project_categories 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories" 
ON public.project_categories 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories" 
ON public.project_categories 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_project_categories_updated_at
BEFORE UPDATE ON public.project_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default categories for existing users
INSERT INTO public.project_categories (user_id, name, color)
SELECT DISTINCT user_id, 'Work', '#4DA8DA' 
FROM public.vibe_projects 
WHERE user_id IS NOT NULL
ON CONFLICT (user_id, name) DO NOTHING;

INSERT INTO public.project_categories (user_id, name, color)
SELECT DISTINCT user_id, 'Personal', 'hsl(150, 45%, 45%)' 
FROM public.vibe_projects 
WHERE user_id IS NOT NULL
ON CONFLICT (user_id, name) DO NOTHING;

INSERT INTO public.project_categories (user_id, name, color)
SELECT DISTINCT user_id, 'Home', 'hsl(25, 95%, 53%)' 
FROM public.vibe_projects 
WHERE user_id IS NOT NULL
ON CONFLICT (user_id, name) DO NOTHING;