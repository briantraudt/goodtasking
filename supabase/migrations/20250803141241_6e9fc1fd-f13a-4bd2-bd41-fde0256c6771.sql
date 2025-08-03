-- Update user preferences to enable Google Calendar for the user who just connected
UPDATE user_preferences 
SET google_calendar_enabled = true, updated_at = now()
WHERE user_id = '61a8ec1a-f39c-4028-9636-213ba6fe02ca';