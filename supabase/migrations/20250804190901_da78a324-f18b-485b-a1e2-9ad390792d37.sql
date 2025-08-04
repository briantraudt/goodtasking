-- Add columns for push notification management
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS calendar_watch_channel_id TEXT,
ADD COLUMN IF NOT EXISTS calendar_watch_resource_id TEXT,
ADD COLUMN IF NOT EXISTS calendar_watch_token TEXT,
ADD COLUMN IF NOT EXISTS calendar_watch_expiration TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS calendar_sync_token TEXT;

-- Create a table for webhook management and debugging
CREATE TABLE IF NOT EXISTS public.calendar_webhooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  channel_id TEXT NOT NULL,
  resource_id TEXT,
  channel_token TEXT,
  expiration_time TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active',
  last_notification TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on the new table
ALTER TABLE public.calendar_webhooks ENABLE ROW LEVEL SECURITY;

-- Create policies for calendar_webhooks
CREATE POLICY "Users can view their own webhook records" 
ON public.calendar_webhooks 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own webhook records" 
ON public.calendar_webhooks 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own webhook records" 
ON public.calendar_webhooks 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_calendar_webhooks_user_id ON public.calendar_webhooks(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_webhooks_channel_id ON public.calendar_webhooks(channel_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_calendar_webhooks_updated_at
BEFORE UPDATE ON public.calendar_webhooks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();