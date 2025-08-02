-- Add onboarding fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN has_completed_onboarding BOOLEAN DEFAULT false,
ADD COLUMN ai_assistant_enabled BOOLEAN DEFAULT false;