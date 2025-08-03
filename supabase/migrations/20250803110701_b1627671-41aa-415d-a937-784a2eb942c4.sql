-- Add streak tracking fields to user_preferences table
ALTER TABLE public.user_preferences 
ADD COLUMN check_in_dates DATE[] DEFAULT '{}',
ADD COLUMN current_streak INTEGER DEFAULT 0,
ADD COLUMN longest_streak INTEGER DEFAULT 0,
ADD COLUMN streak_tracking_enabled BOOLEAN DEFAULT true,
ADD COLUMN last_milestone_celebrated INTEGER DEFAULT 0;

-- Create function to calculate current streak from check-in dates
CREATE OR REPLACE FUNCTION public.calculate_current_streak(check_dates DATE[])
RETURNS INTEGER AS $$
DECLARE
    current_date DATE := CURRENT_DATE;
    streak_count INTEGER := 0;
    check_date DATE;
BEGIN
    -- Sort dates in descending order and check consecutive days from today
    FOR check_date IN 
        SELECT unnest(check_dates) AS date_val 
        ORDER BY date_val DESC
    LOOP
        -- If this date is current_date minus streak_count, continue streak
        IF check_date = current_date - streak_count THEN
            streak_count := streak_count + 1;
        ELSE
            -- Break streak if gap found
            EXIT;
        END IF;
    END LOOP;
    
    RETURN streak_count;
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = '';

-- Create function to add check-in and update streaks
CREATE OR REPLACE FUNCTION public.record_check_in(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
    today DATE := CURRENT_DATE;
    current_dates DATE[];
    new_dates DATE[];
    new_current_streak INTEGER;
    new_longest_streak INTEGER;
    existing_longest INTEGER;
    milestone_reached INTEGER := 0;
    last_milestone INTEGER;
BEGIN
    -- Get current check-in dates and streaks
    SELECT 
        check_in_dates, 
        longest_streak,
        last_milestone_celebrated
    INTO 
        current_dates, 
        existing_longest,
        last_milestone
    FROM public.user_preferences 
    WHERE user_id = user_uuid;
    
    -- If no record exists, create default values
    IF current_dates IS NULL THEN
        current_dates := '{}';
        existing_longest := 0;
        last_milestone := 0;
    END IF;
    
    -- Add today's date if not already present
    IF NOT (today = ANY(current_dates)) THEN
        new_dates := current_dates || today;
    ELSE
        new_dates := current_dates;
    END IF;
    
    -- Calculate new current streak
    new_current_streak := public.calculate_current_streak(new_dates);
    
    -- Update longest streak if needed
    new_longest_streak := GREATEST(existing_longest, new_current_streak);
    
    -- Check for milestone celebrations (3, 5, 7, 10, 14, 21, 30, 50, 100 days)
    IF new_current_streak >= 3 AND new_current_streak > last_milestone THEN
        IF new_current_streak >= 100 THEN
            milestone_reached := 100;
        ELSIF new_current_streak >= 50 THEN
            milestone_reached := 50;
        ELSIF new_current_streak >= 30 THEN
            milestone_reached := 30;
        ELSIF new_current_streak >= 21 THEN
            milestone_reached := 21;
        ELSIF new_current_streak >= 14 THEN
            milestone_reached := 14;
        ELSIF new_current_streak >= 10 THEN
            milestone_reached := 10;
        ELSIF new_current_streak >= 7 THEN
            milestone_reached := 7;
        ELSIF new_current_streak >= 5 THEN
            milestone_reached := 5;
        ELSIF new_current_streak >= 3 THEN
            milestone_reached := 3;
        END IF;
    END IF;
    
    -- Update user preferences
    INSERT INTO public.user_preferences (
        user_id, 
        check_in_dates, 
        current_streak, 
        longest_streak,
        last_milestone_celebrated
    )
    VALUES (
        user_uuid, 
        new_dates, 
        new_current_streak, 
        new_longest_streak,
        CASE WHEN milestone_reached > 0 THEN milestone_reached ELSE last_milestone END
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        check_in_dates = new_dates,
        current_streak = new_current_streak,
        longest_streak = new_longest_streak,
        last_milestone_celebrated = CASE 
            WHEN milestone_reached > 0 THEN milestone_reached 
            ELSE public.user_preferences.last_milestone_celebrated 
        END,
        updated_at = now();
    
    -- Return streak info and milestone status
    RETURN json_build_object(
        'current_streak', new_current_streak,
        'longest_streak', new_longest_streak,
        'milestone_reached', milestone_reached,
        'check_in_recorded', NOT (today = ANY(current_dates))
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';