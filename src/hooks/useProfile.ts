import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

// Returns all learners linked to the currently-authenticated mentor
export function useLinkedLearners(mentorProfileId?: string) {
  return useQuery({
    queryKey: ['linked_learners', mentorProfileId],
    enabled: !!mentorProfileId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mentor_learner_pairs')
        .select('learner_id, profiles!mentor_learner_pairs_learner_id_fkey(id, full_name, role, created_at)')
        .eq('mentor_id', mentorProfileId!);
      if (error) throw error;
      return (data || []).map((row: any) => row.profiles).filter(Boolean);
    },
  });
}

// Returns all profiles with role=learner (for the add-learner search)
export function useAllLearnerProfiles() {
  return useQuery({
    queryKey: ['all_learner_profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, created_at')
        .eq('role', 'learner')
        .order('full_name');
      if (error) throw error;
      return data || [];
    },
  });
}

export function useSkills() {
  return useQuery({
    queryKey: ['skills'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('skills')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });
}

export function useSkillAssessments(profileId?: string, week?: number) {
  return useQuery({
    queryKey: ['skill_assessments', profileId, week],
    enabled: !!profileId,
    queryFn: async () => {
      let query = supabase.from('skill_assessments').select('*').eq('profile_id', profileId!);
      if (week) query = query.eq('week', week);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useWeeklyReviews(profileId?: string) {
  return useQuery({
    queryKey: ['weekly_reviews', profileId],
    enabled: !!profileId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('weekly_reviews')
        .select('*')
        .eq('profile_id', profileId!)
        .order('week');
      if (error) throw error;
      return data;
    },
  });
}

export function useDailyLogs(profileId?: string) {
  return useQuery({
    queryKey: ['daily_logs', profileId],
    enabled: !!profileId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('profile_id', profileId!)
        .order('log_date', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useDailyLogsByWeek(profileId?: string, week?: number) {
  return useQuery({
    queryKey: ['daily_logs_week', profileId, week],
    enabled: !!profileId && !!week,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('profile_id', profileId!)
        .eq('week', week!)
        .order('log_date', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useProjects(profileId?: string) {
  return useQuery({
    queryKey: ['projects', profileId],
    enabled: !!profileId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('profile_id', profileId!);
      if (error) throw error;
      return data;
    },
  });
}

export function useResources(profileId?: string) {
  return useQuery({
    queryKey: ['resources', profileId],
    enabled: !!profileId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .eq('profile_id', profileId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useLearningPlan(profileId?: string) {
  return useQuery({
    queryKey: ['learning_plan', profileId],
    enabled: !!profileId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('learning_plan_weeks')
        .select('*')
        .eq('profile_id', profileId!)
        .order('week');
      if (error) throw error;
      return data;
    },
  });
}

export function useWeekTasks(weekIds?: string[]) {
  return useQuery({
    queryKey: ['week_tasks', weekIds],
    enabled: !!weekIds?.length,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('week_tasks')
        .select('*')
        .in('learning_plan_week_id', weekIds!);
      if (error) throw error;
      return data;
    },
  });
}

export function useMentorComments(reviewId?: string) {
  return useQuery({
    queryKey: ['mentor_comments', reviewId],
    enabled: !!reviewId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mentor_comments')
        .select('*')
        .eq('review_id', reviewId!)
        .order('created_at');
      if (error) throw error;
      return data;
    },
  });
}

export function useWeeklyReviewFiles(reviewId?: string) {
  return useQuery({
    queryKey: ['weekly_review_files', reviewId],
    enabled: !!reviewId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('weekly_review_files')
        .select('*')
        .eq('review_id', reviewId!)
        .order('uploaded_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}
