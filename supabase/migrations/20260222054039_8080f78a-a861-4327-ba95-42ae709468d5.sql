
-- ========== TABLES FIRST ==========

-- Profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'learner' CHECK (role IN ('learner', 'mentor')),
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Mentor-Learner pairs
CREATE TABLE public.mentor_learner_pairs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  learner_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(mentor_id, learner_id)
);

-- Skills
CREATE TABLE public.skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('Deep Fundamentals', 'Agents', 'Frameworks', 'Tools & Infra', 'Building')),
  target_week integer NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Skill assessments
CREATE TABLE public.skill_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  skill_id uuid REFERENCES public.skills(id) ON DELETE CASCADE NOT NULL,
  week integer NOT NULL CHECK (week >= 1 AND week <= 10),
  level text NOT NULL DEFAULT 'not_started' CHECK (level IN ('not_started', 'learning', 'confident', 'can_teach')),
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(profile_id, skill_id, week)
);

-- Weekly reviews
CREATE TABLE public.weekly_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  week integer NOT NULL CHECK (week >= 1 AND week <= 10),
  what_learned text DEFAULT '',
  what_built text DEFAULT '',
  build_links jsonb DEFAULT '[]'::jsonb,
  what_blocked text DEFAULT '',
  hypothesis_tested text DEFAULT '',
  business_connection text DEFAULT '',
  hours_spent numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'reviewed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(profile_id, week)
);

-- Mentor comments
CREATE TABLE public.mentor_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid REFERENCES public.weekly_reviews(id) ON DELETE CASCADE NOT NULL,
  mentor_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  comment_text text NOT NULL,
  comment_type text NOT NULL DEFAULT 'general' CHECK (comment_type IN ('general', 'praise', 'correction', 'action_item')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Daily logs
CREATE TABLE public.daily_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  log_date date NOT NULL,
  hours_spent numeric DEFAULT 0,
  summary text DEFAULT '',
  mood text NOT NULL DEFAULT 'neutral' CHECK (mood IN ('struggling', 'neutral', 'productive', 'breakthrough')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(profile_id, log_date)
);

-- Projects
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  skills_practiced text[] DEFAULT '{}',
  tools_used text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'abandoned')),
  github_url text DEFAULT '',
  deployed_url text DEFAULT '',
  notes text DEFAULT '',
  estimated_hours numeric DEFAULT 0,
  actual_hours numeric DEFAULT 0,
  is_preloaded boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Resources
CREATE TABLE public.resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  url text DEFAULT '',
  resource_type text NOT NULL DEFAULT 'article' CHECK (resource_type IN ('video', 'article', 'course', 'book', 'tool', 'repo')),
  related_skills text[] DEFAULT '{}',
  notes text DEFAULT '',
  is_completed boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Learning plan weeks
CREATE TABLE public.learning_plan_weeks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  week integer NOT NULL CHECK (week >= 1 AND week <= 10),
  title text NOT NULL,
  description text DEFAULT '',
  theory_hours numeric DEFAULT 0,
  handson_hours numeric DEFAULT 0,
  hypothesis_exercise text DEFAULT '',
  status text NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'current', 'completed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(profile_id, week)
);

-- Week tasks
CREATE TABLE public.week_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learning_plan_week_id uuid REFERENCES public.learning_plan_weeks(id) ON DELETE CASCADE NOT NULL,
  description text NOT NULL,
  task_type text NOT NULL DEFAULT 'theory' CHECK (task_type IN ('theory', 'handson')),
  is_completed boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ========== HELPER FUNCTIONS ==========

CREATE OR REPLACE FUNCTION public.get_profile_id()
RETURNS uuid AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_profile_owner(p_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_id AND user_id = auth.uid());
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_mentor()
RETURNS boolean AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'mentor');
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_linked_mentor(learner_profile_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.mentor_learner_pairs mlp
    JOIN public.profiles p ON p.id = mlp.mentor_id
    WHERE mlp.learner_id = learner_profile_id AND p.user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- ========== RLS ==========

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users read own profile during signup" ON public.profiles FOR SELECT USING (user_id = auth.jwt()->>'sub');
CREATE POLICY "Mentors read linked profiles" ON public.profiles FOR SELECT USING (
  public.is_linked_mentor(id)
);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Insert own profile" ON public.profiles FOR INSERT WITH CHECK (user_id = auth.uid());

ALTER TABLE public.mentor_learner_pairs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own pairs" ON public.mentor_learner_pairs FOR SELECT USING (
  public.is_profile_owner(mentor_id) OR public.is_profile_owner(learner_id)
);

ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads skills" ON public.skills FOR SELECT USING (true);

ALTER TABLE public.skill_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Learners manage assessments" ON public.skill_assessments FOR ALL USING (public.is_profile_owner(profile_id));
CREATE POLICY "Mentors read assessments" ON public.skill_assessments FOR SELECT USING (public.is_linked_mentor(profile_id));

ALTER TABLE public.weekly_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Learners manage reviews" ON public.weekly_reviews FOR ALL USING (public.is_profile_owner(profile_id));
CREATE POLICY "Mentors read reviews" ON public.weekly_reviews FOR SELECT USING (public.is_linked_mentor(profile_id));
CREATE POLICY "Mentors update review status" ON public.weekly_reviews FOR UPDATE USING (public.is_linked_mentor(profile_id));

ALTER TABLE public.mentor_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Mentors manage comments" ON public.mentor_comments FOR ALL USING (public.is_profile_owner(mentor_id));
CREATE POLICY "Learners read own review comments" ON public.mentor_comments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.weekly_reviews wr WHERE wr.id = review_id AND public.is_profile_owner(wr.profile_id))
);

ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Learners manage logs" ON public.daily_logs FOR ALL USING (public.is_profile_owner(profile_id));
CREATE POLICY "Mentors read logs" ON public.daily_logs FOR SELECT USING (public.is_linked_mentor(profile_id));

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Learners manage projects" ON public.projects FOR ALL USING (public.is_profile_owner(profile_id));
CREATE POLICY "Mentors read projects" ON public.projects FOR SELECT USING (public.is_linked_mentor(profile_id));

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Learners manage resources" ON public.resources FOR ALL USING (public.is_profile_owner(profile_id));
CREATE POLICY "Mentors read resources" ON public.resources FOR SELECT USING (public.is_linked_mentor(profile_id));

ALTER TABLE public.learning_plan_weeks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Learners manage plan" ON public.learning_plan_weeks FOR ALL USING (public.is_profile_owner(profile_id));
CREATE POLICY "Mentors read plan" ON public.learning_plan_weeks FOR SELECT USING (public.is_linked_mentor(profile_id));

ALTER TABLE public.week_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Manage tasks via plan" ON public.week_tasks FOR ALL USING (
  EXISTS (SELECT 1 FROM public.learning_plan_weeks lpw WHERE lpw.id = learning_plan_week_id AND public.is_profile_owner(lpw.profile_id))
);
CREATE POLICY "Mentors read tasks" ON public.week_tasks FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.learning_plan_weeks lpw WHERE lpw.id = learning_plan_week_id AND public.is_linked_mentor(lpw.profile_id))
);

-- ========== TRIGGERS ==========

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), COALESCE(NEW.raw_user_meta_data->>'role', 'learner'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_skill_assessments_updated_at BEFORE UPDATE ON public.skill_assessments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_weekly_reviews_updated_at BEFORE UPDATE ON public.weekly_reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_mentor_comments_updated_at BEFORE UPDATE ON public.mentor_comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_daily_logs_updated_at BEFORE UPDATE ON public.daily_logs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON public.resources FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_learning_plan_weeks_updated_at BEFORE UPDATE ON public.learning_plan_weeks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_week_tasks_updated_at BEFORE UPDATE ON public.week_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== PRE-LOAD SKILLS ==========

INSERT INTO public.skills (name, category, target_week, sort_order) VALUES
('Transformer architecture (attention, Q/K/V, positional encoding)', 'Deep Fundamentals', 1, 1),
('Training pipeline (pre-training, SFT, RLHF/DPO)', 'Deep Fundamentals', 1, 2),
('Autoregressive inference mechanics', 'Deep Fundamentals', 1, 3),
('Context window architecture', 'Deep Fundamentals', 1, 4),
('Temperature/top-p/top-k at probability level', 'Deep Fundamentals', 1, 5),
('Hallucination mechanics', 'Deep Fundamentals', 1, 6),
('Tokenization (BPE, token economics)', 'Deep Fundamentals', 1, 7),
('Model architectures (decoder-only, MoE, distillation)', 'Deep Fundamentals', 1, 8),
('Quantization (GGUF, GPTQ, AWQ)', 'Deep Fundamentals', 1, 9),
('Model benchmarks (MMLU, HumanEval)', 'Deep Fundamentals', 1, 10),
('Model selection', 'Deep Fundamentals', 1, 11),
('Prompt engineering (zero-shot, few-shot, CoT)', 'Deep Fundamentals', 2, 12),
('Structured outputs (JSON from LLMs)', 'Deep Fundamentals', 2, 13),
('Embeddings & vector similarity', 'Deep Fundamentals', 3, 14),
('Chunking strategies', 'Deep Fundamentals', 3, 15),
('RAG pipeline (end to end)', 'Deep Fundamentals', 4, 16),
('Function calling / tool use', 'Agents', 5, 17),
('ReAct agent pattern', 'Agents', 5, 18),
('Agent memory (in-context & external)', 'Agents', 5, 19),
('Multi-agent orchestration', 'Agents', 6, 20),
('Human-in-the-loop agents', 'Agents', 5, 21),
('LangChain (core + LCEL)', 'Frameworks', 4, 22),
('LangGraph (stateful workflows)', 'Frameworks', 9, 23),
('CrewAI (role-based agents)', 'Frameworks', 6, 24),
('LlamaIndex (RAG + data)', 'Frameworks', 4, 25),
('OpenAI Agents SDK', 'Frameworks', 5, 26),
('PydanticAI (type-safe agents)', 'Frameworks', 5, 27),
('MCP protocol', 'Tools & Infra', 6, 28),
('Building custom MCP servers', 'Tools & Infra', 6, 29),
('n8n workflow automation', 'Tools & Infra', 7, 30),
('Supabase (DB + vector)', 'Tools & Infra', 4, 31),
('Pinecone (managed vector search)', 'Tools & Infra', 4, 32),
('ChromaDB (local vector store)', 'Tools & Infra', 3, 33),
('Ollama (local models)', 'Tools & Infra', 1, 34),
('Docker for AI apps', 'Tools & Infra', 7, 35),
('Vercel AI SDK', 'Tools & Infra', 8, 36),
('LangSmith (observability)', 'Tools & Infra', 4, 37),
('Full-stack AI web app (Next.js)', 'Building', 8, 38),
('FastAPI backend for AI', 'Building', 8, 39),
('Streaming LLM responses', 'Building', 8, 40),
('Fine-tuning basics (LoRA/QLoRA)', 'Building', 9, 41),
('RAGAS evaluation framework', 'Building', 4, 42),
('Cost optimization & monitoring', 'Building', 8, 43);
