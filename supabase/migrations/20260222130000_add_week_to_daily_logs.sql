-- Add week column to daily_logs table
ALTER TABLE public.daily_logs ADD COLUMN week integer;

-- Update existing logs to set week based on log_date (approximate)
-- This is a rough approximation: assuming weeks start on Sunday
UPDATE public.daily_logs
SET week = CASE
  WHEN log_date >= '2024-01-01' AND log_date < '2024-01-08' THEN 1
  WHEN log_date >= '2024-01-08' AND log_date < '2024-01-15' THEN 2
  WHEN log_date >= '2024-01-15' AND log_date < '2024-01-22' THEN 3
  WHEN log_date >= '2024-01-22' AND log_date < '2024-01-29' THEN 4
  WHEN log_date >= '2024-01-29' AND log_date < '2024-02-05' THEN 5
  WHEN log_date >= '2024-02-05' AND log_date < '2024-02-12' THEN 6
  WHEN log_date >= '2024-02-12' AND log_date < '2024-02-19' THEN 7
  WHEN log_date >= '2024-02-19' AND log_date < '2024-02-26' THEN 8
  WHEN log_date >= '2024-02-26' AND log_date < '2024-03-05' THEN 9
  WHEN log_date >= '2024-03-05' AND log_date < '2024-03-12' THEN 10
  ELSE 1 -- Default to week 1 for any other dates
END
WHERE week IS NULL;