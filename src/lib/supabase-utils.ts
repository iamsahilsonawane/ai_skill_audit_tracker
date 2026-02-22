import { supabase } from "@/integrations/supabase/client";

export type UserRole = 'learner' | 'mentor';

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export const SKILL_LEVELS = ['not_started', 'learning', 'confident', 'can_teach'] as const;
export type SkillLevel = typeof SKILL_LEVELS[number];

export const SKILL_LEVEL_LABELS: Record<SkillLevel, string> = {
  not_started: 'Not Started',
  learning: 'Learning',
  confident: 'Confident',
  can_teach: 'Can Teach Others',
};

export const SKILL_LEVEL_COLORS: Record<SkillLevel, string> = {
  not_started: 'bg-skill-not-started',
  learning: 'bg-skill-learning',
  confident: 'bg-skill-confident',
  can_teach: 'bg-skill-can-teach',
};

export const MOOD_LABELS = {
  struggling: 'Struggling',
  neutral: 'Neutral',
  productive: 'Productive',
  breakthrough: 'Breakthrough',
} as const;

export const PROJECT_STATUS_LABELS = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed: 'Completed',
  abandoned: 'Abandoned',
} as const;

export const REVIEW_STATUS_LABELS = {
  draft: 'Draft',
  submitted: 'Submitted',
  reviewed: 'Reviewed',
} as const;

export const SKILL_CATEGORIES = [
  'Deep Fundamentals',
  'Agents',
  'Frameworks',
  'Tools & Infra',
  'Building',
] as const;

export const PRELOADED_PROJECTS = [
  { title: 'Document Q&A Chatbot', description: 'Build a chatbot that can answer questions from uploaded documents.', tools_used: ['LangChain', 'Chroma', 'OpenAI'], estimated_hours: 5 },
  { title: 'Custom MCP Server', description: 'Build a custom MCP server in Python and TypeScript.', tools_used: ['MCP SDK', 'Python', 'TypeScript', 'Cursor'], estimated_hours: 3.5 },
  { title: 'n8n Business Automation', description: 'Automate a business workflow using n8n with AI.', tools_used: ['n8n', 'OpenAI', 'Supabase'], estimated_hours: 4.5 },
  { title: 'Multi-Agent Research Team', description: 'Build a team of AI agents that collaborate on research tasks.', tools_used: ['CrewAI', 'Search tools'], estimated_hours: 5.5 },
  { title: 'Full-Stack AI Web App', description: 'Build a complete AI-powered web application.', tools_used: ['Next.js', 'Vercel AI SDK', 'Supabase'], estimated_hours: 7 },
  { title: 'Local AI Setup', description: 'Set up and run AI models locally.', tools_used: ['Ollama', 'LM Studio', 'Open WebUI'], estimated_hours: 2.5 },
  { title: 'Autonomous Coding Agent', description: 'Build an agent that can write and debug code autonomously.', tools_used: ['OpenAI Agents SDK', 'LangGraph'], estimated_hours: 5.5 },
  { title: 'Customer Support Automation', description: 'Automate customer support with AI-powered workflows.', tools_used: ['n8n', 'OpenAI', 'Slack'], estimated_hours: 4.5 },
  { title: 'Advanced RAG with Evaluation', description: 'Build an advanced RAG pipeline with evaluation metrics.', tools_used: ['LangChain', 'Supabase', 'Cohere', 'RAGAS'], estimated_hours: 5.5 },
  { title: 'Business Idea Validator (Capstone)', description: 'Build a comprehensive system to validate business ideas using multiple AI techniques.', tools_used: ['LangGraph', 'n8n', 'MCP', 'LangSmith'], estimated_hours: 9 },
];

export const LEARNING_PLAN_WEEKS = [
  { week: 1, title: 'Deep AI Fundamentals', description: 'Master the core concepts behind how LLMs work.', theory_hours: 25, handson_hours: 7, hypothesis_exercise: 'Pick a business problem. Research how AI could solve it. Write a 1-page hypothesis.' },
  { week: 2, title: 'Prompt Engineering Mastery', description: 'Learn systematic approaches to prompting LLMs effectively.', theory_hours: 10, handson_hours: 22, hypothesis_exercise: 'Take the business hypothesis from Week 1. Design a prompt-based solution prototype.' },
  { week: 3, title: 'Embeddings + RAG Fundamentals', description: 'Understand vector representations and build your first RAG pipeline.', theory_hours: 8, handson_hours: 24, hypothesis_exercise: 'Identify what data your business hypothesis needs. Design a RAG pipeline for it.' },
  { week: 4, title: 'LangChain + Advanced RAG', description: 'Master LangChain framework and build production-quality RAG systems.', theory_hours: 8, handson_hours: 24, hypothesis_exercise: 'Build a RAG prototype for your business hypothesis. Evaluate with RAGAS.' },
  { week: 5, title: 'AI Agents + Tool Use', description: 'Learn agent patterns and build autonomous AI systems.', theory_hours: 10, handson_hours: 22, hypothesis_exercise: 'Design an agent that could automate part of your business hypothesis workflow.' },
  { week: 6, title: 'MCP Deep Dive + Multi-Agent', description: 'Master MCP protocol and multi-agent orchestration.', theory_hours: 8, handson_hours: 24, hypothesis_exercise: 'Design a multi-agent system for your business. Identify which agents need which tools.' },
  { week: 7, title: 'n8n + AI Workflow Automation', description: 'Build production AI workflows with n8n.', theory_hours: 5, handson_hours: 27, hypothesis_exercise: 'Build a complete automated workflow for one aspect of your business hypothesis.' },
  { week: 8, title: 'Full-Stack AI App + Deployment', description: 'Build and deploy complete AI-powered applications.', theory_hours: 5, handson_hours: 27, hypothesis_exercise: 'Build the MVP of your business hypothesis as a deployable web app.' },
  { week: 9, title: 'LangGraph + Observability', description: 'Master stateful workflows and production monitoring.', theory_hours: 8, handson_hours: 24, hypothesis_exercise: 'Add observability to your MVP. Measure and improve quality.' },
  { week: 10, title: 'Capstone + Business Integration', description: 'Complete capstone project and finalize business case.', theory_hours: 5, handson_hours: 25, hypothesis_exercise: 'Present final business hypothesis with working prototype, evaluation metrics, and cost analysis.' },
];

export async function seedUserData(profileId: string) {
  // Seed projects
  const projects = PRELOADED_PROJECTS.map(p => ({
    profile_id: profileId,
    ...p,
    is_preloaded: true,
    status: 'not_started' as const,
    actual_hours: 0,
  }));
  await supabase.from('projects').insert(projects);

  // Seed learning plan weeks
  const weeks = LEARNING_PLAN_WEEKS.map(w => ({
    profile_id: profileId,
    ...w,
    status: w.week === 1 ? 'current' as const : 'upcoming' as const,
  }));
  await supabase.from('learning_plan_weeks').insert(weeks);
}
