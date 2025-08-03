-- Clean up any existing tokens and restart the connection
DELETE FROM google_calendar_tokens WHERE user_id = '61a8ec1a-f39c-4028-9636-213ba6fe02ca';
UPDATE user_preferences 
SET google_calendar_enabled = false, updated_at = now()
WHERE user_id = '61a8ec1a-f39c-4028-9636-213ba6fe02ca';