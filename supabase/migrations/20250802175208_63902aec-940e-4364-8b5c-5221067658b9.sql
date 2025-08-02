-- Update scheduled dates to align with new consecutive date logic
-- Today (Aug 2) stays the same, but other dates need to be consecutive from today

UPDATE vibe_projects 
SET scheduled_day = CASE 
  WHEN scheduled_day = '2025-07-27' THEN '2025-08-03'  -- Tomorrow (Sun Aug 3)
  WHEN scheduled_day = '2025-07-28' THEN '2025-08-04'  -- Monday (Aug 4)  
  WHEN scheduled_day = '2025-07-30' THEN '2025-08-05'  -- Tuesday (Aug 5)
  WHEN scheduled_day = '2025-07-31' THEN '2025-08-06'  -- Wednesday (Aug 6)
  WHEN scheduled_day = '2025-08-01' THEN '2025-08-07'  -- Thursday (Aug 7)
  WHEN scheduled_day = '2025-08-02' THEN '2025-08-02'  -- Today (unchanged)
  ELSE scheduled_day 
END;