-- Add reminder preferences and login tracking to user_preferences table
ALTER TABLE public.user_preferences 
ADD COLUMN reminders_enabled BOOLEAN DEFAULT true,
ADD COLUMN last_login_date DATE;

-- Create a table to track email notifications sent
CREATE TABLE public.daily_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_date DATE NOT NULL,
  email_sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on daily_reminders
ALTER TABLE public.daily_reminders ENABLE ROW LEVEL SECURITY;

-- Create policies for daily_reminders
CREATE POLICY "Users can view their own reminders" 
ON public.daily_reminders 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert reminders" 
ON public.daily_reminders 
FOR INSERT 
WITH CHECK (true);

-- Create index for better performance
CREATE INDEX idx_daily_reminders_user_date ON public.daily_reminders(user_id, reminder_date);
CREATE INDEX idx_user_preferences_last_login ON public.user_preferences(last_login_date);

-- Create function to update last login date
CREATE OR REPLACE FUNCTION public.update_last_login()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_preferences (user_id, last_login_date)
  VALUES (NEW.id, CURRENT_DATE)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    last_login_date = CURRENT_DATE,
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;