
-- ========== MENTOR MANAGEMENT PERMISSIONS ==========
-- Allow mentors to INSERT/UPDATE/DELETE skills (global skill catalog)
CREATE POLICY "Mentors manage skills" ON public.skills FOR ALL USING (public.is_mentor());

-- Allow mentors to INSERT projects for linked learners
CREATE POLICY "Mentors insert projects for learners" ON public.projects FOR INSERT WITH CHECK (
  public.is_mentor() AND public.is_linked_mentor(profile_id)
);

-- Allow mentors to UPDATE projects for linked learners
CREATE POLICY "Mentors update projects for learners" ON public.projects FOR UPDATE USING (
  public.is_mentor() AND public.is_linked_mentor(profile_id)
);

-- Allow mentors to DELETE projects for linked learners
CREATE POLICY "Mentors delete projects for learners" ON public.projects FOR DELETE USING (
  public.is_mentor() AND public.is_linked_mentor(profile_id)
);

-- Allow mentors to INSERT learning plan weeks for linked learners
CREATE POLICY "Mentors insert plan for learners" ON public.learning_plan_weeks FOR INSERT WITH CHECK (
  public.is_mentor() AND public.is_linked_mentor(profile_id)
);

-- Allow mentors to UPDATE learning plan weeks for linked learners
CREATE POLICY "Mentors update plan for learners" ON public.learning_plan_weeks FOR UPDATE USING (
  public.is_mentor() AND public.is_linked_mentor(profile_id)
);

-- Allow mentors to DELETE learning plan weeks for linked learners
CREATE POLICY "Mentors delete plan for learners" ON public.learning_plan_weeks FOR DELETE USING (
  public.is_mentor() AND public.is_linked_mentor(profile_id)
);

-- Allow mentors to INSERT mentor_learner_pairs (to add new learners)
CREATE POLICY "Mentors insert pairs" ON public.mentor_learner_pairs FOR INSERT WITH CHECK (
  public.is_profile_owner(mentor_id)
);

-- Allow mentors to DELETE mentor_learner_pairs (to remove learners)
CREATE POLICY "Mentors delete pairs" ON public.mentor_learner_pairs FOR DELETE USING (
  public.is_profile_owner(mentor_id)
);

-- Allow mentors to read all profiles (to search for learners to add)
CREATE POLICY "Mentors read all profiles" ON public.profiles FOR SELECT USING (
  public.is_mentor()
);
