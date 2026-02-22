import { useAuth } from '@/contexts/AuthContext';
import { useMentorContext } from '@/contexts/MentorContext';
import { StatCard } from '@/components/StatCard';
import { useDailyLogs, useLearningPlan, useProjects, useSkillAssessments, useSkills, useWeeklyReviews } from '@/hooks/useProfile';
import { Clock, TrendingUp, FolderKanban, Flame, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { REVIEW_STATUS_LABELS, SKILL_CATEGORIES } from '@/lib/supabase-utils';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

const PROJECT_STATUS_COLORS: Record<string, string> = {
  not_started: 'bg-muted text-muted-foreground',
  in_progress: 'bg-info/10 text-info border-info/20',
  completed: 'bg-success/10 text-success border-success/20',
  abandoned: 'bg-destructive/10 text-destructive border-destructive/20',
};

const PROJECT_STATUS_LABELS: Record<string, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed: 'Completed',
  abandoned: 'Abandoned',
};

const MOOD_EMOJIS: Record<string, string> = {
  struggling: '😤',
  neutral: '😐',
  productive: '⚡',
  breakthrough: '🌟',
};

export default function Dashboard() {
  const { profile } = useAuth();
  const { viewingProfileId, selectedLearner } = useMentorContext();
  const isMentor = profile?.role === 'mentor';

  const { data: plans } = useLearningPlan(viewingProfileId ?? undefined);
  const { data: reviews } = useWeeklyReviews(viewingProfileId ?? undefined);
  const { data: projects } = useProjects(viewingProfileId ?? undefined);
  const { data: dailyLogs } = useDailyLogs(viewingProfileId ?? undefined);
  const { data: assessments } = useSkillAssessments(viewingProfileId ?? undefined);
  const { data: skills } = useSkills();

  const currentWeekPlan = plans?.find(p => p.status === 'current');
  const currentWeek = currentWeekPlan?.week || 1;

  // Stats
  const thisWeekLogs = dailyLogs?.filter(l => {
    const logDate = new Date(l.log_date);
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    return logDate >= weekStart;
  }) || [];
  const hoursThisWeek = thisWeekLogs.reduce((sum, l) => sum + Number(l.hours_spent || 0), 0);

  const completedProjects = projects?.filter(p => p.status === 'completed').length || 0;
  const totalProjects = projects?.length || 0;

  // Streak: consecutive days with logs
  let streak = 0;
  if (dailyLogs?.length) {
    const sorted = [...dailyLogs].sort((a, b) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime());
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < sorted.length; i++) {
      const expected = new Date(today);
      expected.setDate(today.getDate() - i);
      const logDate = new Date(sorted[i].log_date);
      logDate.setHours(0, 0, 0, 0);
      if (logDate.getTime() === expected.getTime()) {
        streak++;
      } else break;
    }
  }

  // Current week review
  const currentReview = reviews?.find(r => r.week === currentWeek);

  // Radar chart — join assessments to skills by skill_id for per-category averages
  const levelToNum = (l: string) => ({ not_started: 0, learning: 1, confident: 2, can_teach: 3 }[l] || 0);
  const radarData = SKILL_CATEGORIES.map(cat => {
    const catSkillIds = new Set((skills || []).filter(s => s.category === cat).map(s => s.id));
    const catAssessments = (assessments || []).filter(a => catSkillIds.has(a.skill_id));
    const avg = catAssessments.length
      ? catAssessments.reduce((s, a) => s + levelToNum(a.level), 0) / catAssessments.length
      : 0;
    return { category: cat.replace('Deep ', '').replace(' & Infra', ''), value: avg, fullMark: 3 };
  });

  // Recent projects (last 3)
  const recentProjects = (projects || []).slice(0, 3);

  // Recent daily logs (last 5)
  const recentLogs = (dailyLogs || []).slice(0, 5);

  const displayName = isMentor
    ? (selectedLearner?.full_name || 'a learner')
    : (profile?.full_name || 'Learner');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">
          {isMentor ? (
            <>
              Viewing: <span className="text-gradient">{displayName}</span>
              <Badge variant="secondary" className="ml-3 text-xs align-middle">learner</Badge>
            </>
          ) : (
            <>
              Welcome back, <span className="text-gradient">{displayName}</span>
            </>
          )}
        </h1>
        {currentWeekPlan && (
          <div className="mt-2 flex items-center gap-3">
            <Badge variant="secondary" className="font-mono text-xs">Week {currentWeek}/10</Badge>
            <span className="text-sm text-muted-foreground">{currentWeekPlan.title}</span>
            <Progress value={currentWeek * 10} className="w-32 h-1.5" />
          </div>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Hours This Week"
          value={hoursThisWeek}
          subtitle="of 35 target"
          icon={<Clock className="h-5 w-5" />}
          variant={hoursThisWeek >= 30 ? 'success' : hoursThisWeek >= 20 ? 'warning' : 'default'}
        />
        <StatCard
          title="Skills Progressed"
          value={assessments?.filter(a => a.level !== 'not_started').length || 0}
          subtitle="of 43 total"
          icon={<TrendingUp className="h-5 w-5" />}
          variant="primary"
        />
        <StatCard
          title="Projects Done"
          value={`${completedProjects}/${totalProjects}`}
          icon={<FolderKanban className="h-5 w-5" />}
          variant="success"
        />
        <StatCard
          title="Day Streak"
          value={streak}
          subtitle="consecutive days"
          icon={<Flame className="h-5 w-5" />}
          variant={streak >= 7 ? 'primary' : 'default'}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Radar Chart */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Skill Radar</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="category" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <PolarRadiusAxis domain={[0, 3]} tick={false} axisLine={false} />
                <Radar name="Skills" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Weekly Review Status */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Weekly Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentReview ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Week {currentWeek} Review</span>
                  <Badge variant={currentReview.status === 'reviewed' ? 'default' : 'secondary'}>
                    {REVIEW_STATUS_LABELS[currentReview.status as keyof typeof REVIEW_STATUS_LABELS]}
                  </Badge>
                </div>
                {currentReview.hours_spent > 0 && (
                  <div className="text-sm text-muted-foreground">
                    {Number(currentReview.hours_spent)} hours logged
                  </div>
                )}
                <Link to="/reviews">
                  <Button size="sm" variant="outline" className="w-full mt-2">
                    <FileText className="mr-2 h-4 w-4" />
                    {currentReview.status === 'draft' ? 'Continue Writing' : 'View Review'}
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground mb-3">No review started for Week {currentWeek}</p>
                {!isMentor && (
                  <Link to="/reviews">
                    <Button size="sm" className="gradient-primary text-primary-foreground">
                      <FileText className="mr-2 h-4 w-4" />
                      Write Weekly Review
                    </Button>
                  </Link>
                )}
              </div>
            )}

            {/* Hypothesis Exercise */}
            {currentWeekPlan?.hypothesis_exercise && (
              <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">This Week's Hypothesis</h4>
                <p className="text-sm text-foreground/80">{currentWeekPlan.hypothesis_exercise}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Projects */}
        <Card className="shadow-card">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Recent Projects</CardTitle>
            <Link to="/projects" className="text-xs text-primary hover:underline">View all</Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentProjects.length > 0 ? recentProjects.map(p => (
              <div key={p.id} className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2.5">
                <span className="text-sm truncate mr-2">{p.title}</span>
                <Badge className={`text-xs shrink-0 ${PROJECT_STATUS_COLORS[p.status]}`}>
                  {PROJECT_STATUS_LABELS[p.status] ?? p.status}
                </Badge>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground text-center py-4">No projects yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Daily Logs */}
        <Card className="shadow-card">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Recent Daily Logs</CardTitle>
            <Link to="/daily-log" className="text-xs text-primary hover:underline">View all</Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentLogs.length > 0 ? recentLogs.map(log => (
              <div key={log.id} className="flex items-center gap-3 rounded-lg border border-border/50 px-3 py-2">
                <span className="text-base">{MOOD_EMOJIS[log.mood] ?? '📝'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">{format(new Date(log.log_date), 'EEE, MMM d')}</span>
                    <Badge variant="outline" className="text-xs">{Number(log.hours_spent)}h</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{log.summary || 'No summary'}</p>
                </div>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground text-center py-4">No daily logs yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
