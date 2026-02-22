-- Add notes field to learning_plan_weeks table
ALTER TABLE public.learning_plan_weeks ADD COLUMN notes text DEFAULT '';

-- Update the policies to allow updating notes
-- (existing policies should already cover this since they allow ALL operations for owners)