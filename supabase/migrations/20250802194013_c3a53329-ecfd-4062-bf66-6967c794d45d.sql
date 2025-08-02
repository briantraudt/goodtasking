-- Create table for storing daily AI summaries
CREATE TABLE public.daily_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  summary_date DATE NOT NULL,
  summary TEXT NOT NULL,
  task_count INTEGER DEFAULT 0,
  completion_rate INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure one summary per user per day
  UNIQUE(user_id, summary_date)
);

-- Enable Row Level Security
ALTER TABLE public.daily_summaries ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own summaries" 
ON public.daily_summaries 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own summaries" 
ON public.daily_summaries 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own summaries" 
ON public.daily_summaries 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_daily_summaries_updated_at
BEFORE UPDATE ON public.daily_summaries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();