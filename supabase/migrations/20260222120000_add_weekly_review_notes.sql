-- Add notes field to weekly_reviews table
ALTER TABLE public.weekly_reviews ADD COLUMN notes text DEFAULT '';

-- Update the policies to allow updating notes
-- (existing policies should already cover this since they allow ALL operations for owners)