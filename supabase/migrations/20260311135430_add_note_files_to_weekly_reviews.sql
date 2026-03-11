-- Create weekly_review_files table for storing uploaded note files
CREATE TABLE IF NOT EXISTS weekly_review_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES weekly_reviews(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add RLS policies for weekly_review_files
ALTER TABLE weekly_review_files ENABLE ROW LEVEL SECURITY;

-- Learners can manage their own weekly review files
CREATE POLICY "Users can view their own review files"
  ON weekly_review_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM weekly_reviews
      WHERE weekly_reviews.id = weekly_review_files.review_id
      AND weekly_reviews.profile_id = (SELECT get_profile_id())
    )
  );

CREATE POLICY "Users can insert their own review files"
  ON weekly_review_files FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weekly_reviews
      WHERE weekly_reviews.id = weekly_review_files.review_id
      AND weekly_reviews.profile_id = (SELECT get_profile_id())
    )
  );

CREATE POLICY "Users can delete their own review files"
  ON weekly_review_files FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM weekly_reviews
      WHERE weekly_reviews.id = weekly_review_files.review_id
      AND weekly_reviews.profile_id = (SELECT get_profile_id())
    )
  );

-- Mentors can view their learners' review files
CREATE POLICY "Mentors can view learner review files"
  ON weekly_review_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM weekly_reviews wr
      WHERE wr.id = weekly_review_files.review_id
      AND is_linked_mentor(wr.profile_id)
    )
  );

-- Create storage bucket for weekly review note files
INSERT INTO storage.buckets (id, name, public)
VALUES ('weekly-review-notes', 'weekly-review-notes', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for weekly-review-notes bucket
CREATE POLICY "Users can upload their own review note files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'weekly-review-notes'
    AND (storage.foldername(name))[1] = (SELECT get_profile_id()::text)
  );

CREATE POLICY "Users can view their own review note files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'weekly-review-notes'
    AND (storage.foldername(name))[1] = (SELECT get_profile_id()::text)
  );

CREATE POLICY "Users can delete their own review note files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'weekly-review-notes'
    AND (storage.foldername(name))[1] = (SELECT get_profile_id()::text)
  );

CREATE POLICY "Mentors can view learner review note files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'weekly-review-notes'
    AND is_linked_mentor((storage.foldername(name))[1]::uuid)
  );

-- Add index for better query performance
CREATE INDEX idx_weekly_review_files_review_id ON weekly_review_files(review_id);
