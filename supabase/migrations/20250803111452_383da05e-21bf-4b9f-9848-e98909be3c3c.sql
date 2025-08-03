-- Create table to store Google Calendar credentials
CREATE TABLE public.google_calendar_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  scope TEXT NOT NULL DEFAULT 'https://www.googleapis.com/auth/calendar.readonly',
  token_type TEXT DEFAULT 'Bearer',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.google_calendar_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own calendar tokens" 
ON public.google_calendar_tokens 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own calendar tokens" 
ON public.google_calendar_tokens 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar tokens" 
ON public.google_calendar_tokens 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar tokens" 
ON public.google_calendar_tokens 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add calendar integration preference to user_preferences
ALTER TABLE public.user_preferences 
ADD COLUMN google_calendar_enabled BOOLEAN DEFAULT false;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_google_calendar_tokens_updated_at
BEFORE UPDATE ON public.google_calendar_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_google_calendar_tokens_user_id ON public.google_calendar_tokens(user_id);
CREATE INDEX idx_google_calendar_tokens_expires_at ON public.google_calendar_tokens(expires_at);