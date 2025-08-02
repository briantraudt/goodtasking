-- Create table for storing weekly AI reviews
CREATE TABLE public.weekly_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_key TEXT NOT NULL, -- Format: "2025-W32"
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  review TEXT NOT NULL,
  stats JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure one review per user per week
  UNIQUE(user_id, week_key)
);

-- Enable Row Level Security
ALTER TABLE public.weekly_reviews ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own weekly reviews" 
ON public.weekly_reviews 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own weekly reviews" 
ON public.weekly_reviews 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weekly reviews" 
ON public.weekly_reviews 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_weekly_reviews_updated_at
BEFORE UPDATE ON public.weekly_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_weekly_reviews_week_key ON public.weekly_reviews(user_id, week_key);