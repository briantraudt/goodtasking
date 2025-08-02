-- Create user preferences table
CREATE TABLE public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- AI Assistant Settings
  ai_assistant_enabled BOOLEAN DEFAULT true,
  weekly_review_enabled BOOLEAN DEFAULT true,
  ai_tone_preference TEXT DEFAULT 'coaching' CHECK (ai_tone_preference IN ('coaching', 'friendly', 'direct', 'motivational')),
  ai_summary_time TEXT DEFAULT 'morning' CHECK (ai_summary_time IN ('morning', 'evening')),
  
  -- Default Behavior Settings
  default_task_day TEXT DEFAULT 'today' CHECK (default_task_day IN ('today', 'tomorrow', 'none')),
  default_project_id UUID REFERENCES public.vibe_projects(id) ON DELETE SET NULL,
  auto_schedule_unscheduled BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own preferences" 
ON public.user_preferences 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own preferences" 
ON public.user_preferences 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" 
ON public.user_preferences 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_user_preferences_user_id ON public.user_preferences(user_id);