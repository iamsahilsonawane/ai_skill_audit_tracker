import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  useLinkedLearners,
  useAllLearnerProfiles,
  useSkills,
  useProjects,
  useLearningPlan,
} from '@/hooks/useProfile';
import { SKILL_CATEGORIES, PROJECT_STATUS_LABELS, LEARNING_PLAN_WEEKS } from '@/lib/supabase-utils';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Pencil, UserPlus, UserMinus, BookOpen, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Page Shell ──────────────────────────────────────────────────────────────

export default function MentorManage() {
  const { profile } = useAuth();
  const isMentor = profile?.role === 'mentor';

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">{isMentor ? 'Mentor Management' : 'Manage'}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isMentor
            ? 'Manage learners, skills, projects and learning plans'
            : 'Manage your skills, projects and learning plan'}
        </p>
      </div>

      <Tabs defaultValue={isMentor ? 'learners' : 'skills'}>
        <TabsList className={`grid w-full ${isMentor ? 'grid-cols-4' : 'grid-cols-3'}`}>
          {isMentor && <TabsTrigger value="learners">Learners</TabsTrigger>}
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="plan">Learning Plan</TabsTrigger>
        </TabsList>

        {isMentor && (
          <TabsContent value="learners" className="mt-4">
            <LearnersTab mentorId={profile!.id} />
          </TabsContent>
        )}

        <TabsContent value="skills" className="mt-4">
          <SkillsTab />
        </TabsContent>

        <TabsContent value="projects" className="mt-4">
          {isMentor
            ? <ProjectsTab mentorId={profile!.id} />
            : <ProjectsTab profileId={profile?.id} />}
        </TabsContent>

        <TabsContent value="plan" className="mt-4">
          {isMentor
            ? <LearningPlanTab mentorId={profile!.id} />
            : <LearningPlanTab profileId={profile?.id} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-base font-semibold">{title}</h2>
      {action}
    </div>
  );
}

// ─── Learners Tab ─────────────────────────────────────────────────────────────

function LearnersTab({ mentorId }: { mentorId: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: learners, isLoading } = useLinkedLearners(mentorId);
  const { data: allLearners } = useAllLearnerProfiles();
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState('');

  const linkedIds = new Set((learners || []).map((l: any) => l.id));

  const filtered = (allLearners || []).filter(
    (l: any) =>
      !linkedIds.has(l.id) &&
      l.full_name.toLowerCase().includes(search.toLowerCase()),
  );

  const addLearner = async (learnerId: string) => {
    const { error } = await supabase
      .from('mentor_learner_pairs')
      .insert({ mentor_id: mentorId, learner_id: learnerId });
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else {
      toast({ title: 'Learner added' });
      queryClient.invalidateQueries({ queryKey: ['linked_learners'] });
      queryClient.invalidateQueries({ queryKey: ['all_learner_profiles'] });
    }
  };

  const removeLearner = async (learnerId: string) => {
    const { error } = await supabase
      .from('mentor_learner_pairs')
      .delete()
      .eq('mentor_id', mentorId)
      .eq('learner_id', learnerId);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else {
      toast({ title: 'Learner removed' });
      queryClient.invalidateQueries({ queryKey: ['linked_learners'] });
      queryClient.invalidateQueries({ queryKey: ['all_learner_profiles'] });
    }
  };

  return (
    <div className="space-y-4">
      <SectionHeader
        title={`Linked Learners (${learners?.length || 0})`}
        action={
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gradient-primary text-primary-foreground">
                <UserPlus className="mr-1 h-4 w-4" /> Add Learner
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Learner</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <Input
                  placeholder="Search by name…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {filtered.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No unlinked learners found.
                    </p>
                  )}
                  {filtered.map((l: any) => (
                    <div
                      key={l.id}
                      className="flex items-center justify-between rounded-lg border border-border px-4 py-2.5"
                    >
                      <span className="text-sm font-medium">{l.full_name}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addLearner(l.id)}
                      >
                        <UserPlus className="h-3.5 w-3.5 mr-1" /> Add
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      <div className="space-y-2">
        {(learners || []).map((l: any) => (
          <div
            key={l.id}
            className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium">{l.full_name}</p>
              <p className="text-xs text-muted-foreground">
                Joined {new Date(l.created_at).toLocaleDateString()}
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => removeLearner(l.id)}
            >
              <UserMinus className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {!isLoading && !learners?.length && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No learners linked yet. Click "Add Learner" to get started.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Skills Tab ───────────────────────────────────────────────────────────────

function SkillsTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: skills } = useSkills();
  const [addOpen, setAddOpen] = useState(false);
  const [editSkill, setEditSkill] = useState<any | null>(null);

  const deleteSkill = async (id: string) => {
    const { error } = await supabase.from('skills').delete().eq('id', id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else {
      toast({ title: 'Skill deleted' });
      queryClient.invalidateQueries({ queryKey: ['skills'] });
    }
  };

  return (
    <div className="space-y-4">
      <SectionHeader
        title={`Skills (${skills?.length || 0})`}
        action={
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gradient-primary text-primary-foreground">
                <Plus className="mr-1 h-4 w-4" /> Add Skill
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Skill</DialogTitle>
              </DialogHeader>
              <SkillForm
                onDone={() => {
                  setAddOpen(false);
                  queryClient.invalidateQueries({ queryKey: ['skills'] });
                }}
              />
            </DialogContent>
          </Dialog>
        }
      />

      {/* Edit dialog */}
      <Dialog open={!!editSkill} onOpenChange={open => !open && setEditSkill(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Skill</DialogTitle>
          </DialogHeader>
          {editSkill && (
            <SkillForm
              existing={editSkill}
              onDone={() => {
                setEditSkill(null);
                queryClient.invalidateQueries({ queryKey: ['skills'] });
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {SKILL_CATEGORIES.map(cat => {
        const catSkills = (skills || []).filter((s: any) => s.category === cat);
        return (
          <Card key={cat} className="shadow-card">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm flex items-center gap-2">
                {cat}
                <Badge variant="secondary" className="font-mono text-xs">
                  {catSkills.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 pb-4">
              {catSkills.map((s: any) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-sm truncate">{s.name}</span>
                    <Badge variant="outline" className="font-mono text-xs shrink-0">
                      W{s.target_week}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => setEditSkill(s)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => deleteSkill(s.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
              {catSkills.length === 0 && (
                <p className="text-xs text-muted-foreground px-1 py-2">No skills in this category.</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function SkillForm({
  existing,
  onDone,
}: {
  existing?: any;
  onDone: () => void;
}) {
  const { toast } = useToast();
  const [name, setName] = useState(existing?.name || '');
  const [category, setCategory] = useState(existing?.category || SKILL_CATEGORIES[0]);
  const [targetWeek, setTargetWeek] = useState<number>(existing?.target_week || 1);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);

    const payload = { name: name.trim(), category, target_week: targetWeek };

    const { error } = existing
      ? await supabase.from('skills').update(payload).eq('id', existing.id)
      : await supabase.from('skills').insert({ ...payload, sort_order: 999 });

    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else onDone();
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Skill Name</Label>
        <Input
          className="mt-1"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Prompt Engineering"
          required
        />
      </div>
      <div>
        <Label>Category</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SKILL_CATEGORIES.map(c => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Target Week</Label>
        <Select value={String(targetWeek)} onValueChange={v => setTargetWeek(Number(v))}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 10 }, (_, i) => i + 1).map(w => (
              <SelectItem key={w} value={String(w)}>Week {w}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button
        type="submit"
        disabled={saving}
        className="w-full gradient-primary text-primary-foreground"
      >
        {saving ? 'Saving…' : existing ? 'Update Skill' : 'Add Skill'}
      </Button>
    </form>
  );
}

// ─── Projects Tab ─────────────────────────────────────────────────────────────

function ProjectsTab({ mentorId, profileId }: { mentorId?: string; profileId?: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: learners } = useLinkedLearners(mentorId);
  const [selectedLearner, setSelectedLearner] = useState<string>('');
  const [addOpen, setAddOpen] = useState(false);
  const [editProject, setEditProject] = useState<any | null>(null);

  // If profileId is provided (learner self-service), use it directly
  const learnerId = profileId ?? (selectedLearner || learners?.[0]?.id);
  const { data: projects } = useProjects(learnerId);

  const deleteProject = async (id: string) => {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else {
      toast({ title: 'Project deleted' });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    }
  };

  if (!profileId && !learners?.length) {
    return (
      <p className="text-sm text-muted-foreground text-center py-12">
        Link at least one learner in the Learners tab first.
      </p>
    );
  }

  const activeLearner = learnerId;

  return (
    <div className="space-y-4">
      {/* Learner selector — only shown for mentor with linked learners */}
      {!profileId && learners && learners.length > 0 && (
        <div className="flex items-center gap-3">
          <Label className="shrink-0 text-sm">Learner:</Label>
          <Select
            value={activeLearner}
            onValueChange={setSelectedLearner}
          >
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Select learner" />
            </SelectTrigger>
            <SelectContent>
              {learners.map((l: any) => (
                <SelectItem key={l.id} value={l.id}>{l.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <SectionHeader
        title={`Projects (${projects?.length || 0})`}
        action={
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gradient-primary text-primary-foreground" disabled={!activeLearner}>
                <Plus className="mr-1 h-4 w-4" /> Add Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Project{learners?.find((l: any) => l.id === activeLearner)?.full_name ? ` for ${learners.find((l: any) => l.id === activeLearner)?.full_name}` : ''}</DialogTitle>
              </DialogHeader>
              <ProjectForm
                profileId={activeLearner!}
                onDone={() => {
                  setAddOpen(false);
                  queryClient.invalidateQueries({ queryKey: ['projects'] });
                }}
              />
            </DialogContent>
          </Dialog>
        }
      />

      {/* Edit dialog */}
      <Dialog open={!!editProject} onOpenChange={open => !open && setEditProject(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          {editProject && (
            <ProjectForm
              profileId={activeLearner!}
              existing={editProject}
              onDone={() => {
                setEditProject(null);
                queryClient.invalidateQueries({ queryKey: ['projects'] });
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <div className="grid gap-3 sm:grid-cols-2">
        {(projects || []).map((p: any) => (
          <Card key={p.id} className="shadow-card">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{p.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{p.description}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(p.tools_used || []).map((t: string) => (
                      <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => setEditProject(p)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => deleteProject(p.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="mt-2">
                <Badge
                  className={cn(
                    'text-xs',
                    p.status === 'completed'
                      ? 'bg-success/10 text-success border-success/20'
                      : p.status === 'in_progress'
                      ? 'bg-info/10 text-info border-info/20'
                      : p.status === 'abandoned'
                      ? 'bg-destructive/10 text-destructive border-destructive/20'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  {PROJECT_STATUS_LABELS[p.status as keyof typeof PROJECT_STATUS_LABELS]}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
        {!projects?.length && (
          <p className="text-sm text-muted-foreground text-center py-8 col-span-2">
            No projects yet. Add one above.
          </p>
        )}
      </div>
    </div>
  );
}

function ProjectForm({
  profileId,
  existing,
  onDone,
}: {
  profileId: string;
  existing?: any;
  onDone: () => void;
}) {
  const { toast } = useToast();
  const [title, setTitle] = useState(existing?.title || '');
  const [description, setDescription] = useState(existing?.description || '');
  const [tools, setTools] = useState((existing?.tools_used || []).join(', '));
  const [estHours, setEstHours] = useState<number>(existing?.estimated_hours || 0);
  const [status, setStatus] = useState(existing?.status || 'not_started');
  const [githubUrl, setGithubUrl] = useState(existing?.github_url || '');
  const [deployedUrl, setDeployedUrl] = useState(existing?.deployed_url || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);

    const payload = {
      profile_id: profileId,
      title: title.trim(),
      description,
      tools_used: tools.split(',').map(t => t.trim()).filter(Boolean),
      estimated_hours: estHours,
      status,
      github_url: githubUrl,
      deployed_url: deployedUrl,
    };

    const { error } = existing
      ? await supabase.from('projects').update(payload).eq('id', existing.id)
      : await supabase.from('projects').insert(payload);

    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else onDone();
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <Label>Title</Label>
        <Input className="mt-1" value={title} onChange={e => setTitle(e.target.value)} required />
      </div>
      <div>
        <Label>Description</Label>
        <Textarea className="mt-1" value={description} onChange={e => setDescription(e.target.value)} rows={2} />
      </div>
      <div>
        <Label>Tools (comma separated)</Label>
        <Input className="mt-1" value={tools} onChange={e => setTools(e.target.value)} placeholder="LangChain, OpenAI" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(PROJECT_STATUS_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Est. Hours</Label>
          <Input
            type="number"
            className="mt-1"
            value={estHours}
            onChange={e => setEstHours(Number(e.target.value))}
            min={0}
          />
        </div>
      </div>
      <div>
        <Label>GitHub URL</Label>
        <Input className="mt-1" value={githubUrl} onChange={e => setGithubUrl(e.target.value)} placeholder="https://github.com/…" />
      </div>
      <div>
        <Label>Deployed URL</Label>
        <Input className="mt-1" value={deployedUrl} onChange={e => setDeployedUrl(e.target.value)} placeholder="https://…" />
      </div>
      <Button type="submit" disabled={saving} className="w-full gradient-primary text-primary-foreground">
        {saving ? 'Saving…' : existing ? 'Update Project' : 'Add Project'}
      </Button>
    </form>
  );
}

// ─── Learning Plan Tab ────────────────────────────────────────────────────────

const WEEK_STATUSES = ['upcoming', 'current', 'completed'] as const;

function LearningPlanTab({ mentorId, profileId }: { mentorId?: string; profileId?: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: learners } = useLinkedLearners(mentorId);
  const [selectedLearner, setSelectedLearner] = useState<string>('');
  const [addOpen, setAddOpen] = useState(false);
  const [editWeek, setEditWeek] = useState<any | null>(null);

  // If profileId is provided (learner self-service), use it directly
  const learnerId = profileId ?? (selectedLearner || learners?.[0]?.id);
  const { data: weeks } = useLearningPlan(learnerId);

  const deleteWeek = async (id: string) => {
    const { error } = await supabase.from('learning_plan_weeks').delete().eq('id', id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else {
      toast({ title: 'Week deleted' });
      queryClient.invalidateQueries({ queryKey: ['learning_plan'] });
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from('learning_plan_weeks')
      .update({ status: newStatus })
      .eq('id', id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else queryClient.invalidateQueries({ queryKey: ['learning_plan'] });
  };

  if (!profileId && !learners?.length) {
    return (
      <p className="text-sm text-muted-foreground text-center py-12">
        Link at least one learner in the Learners tab first.
      </p>
    );
  }

  const activeLearner = learnerId;

  return (
    <div className="space-y-4">
      {/* Learner selector — only shown for mentor with linked learners */}
      {!profileId && learners && learners.length > 0 && (
        <div className="flex items-center gap-3">
          <Label className="shrink-0 text-sm">Learner:</Label>
          <Select value={activeLearner} onValueChange={setSelectedLearner}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Select learner" />
            </SelectTrigger>
            <SelectContent>
              {learners.map((l: any) => (
                <SelectItem key={l.id} value={l.id}>{l.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <SectionHeader
        title={`Learning Plan Weeks (${weeks?.length || 0})`}
        action={
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gradient-primary text-primary-foreground" disabled={!activeLearner}>
                <Plus className="mr-1 h-4 w-4" /> Add Week
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>New Week{learners?.find((l: any) => l.id === activeLearner)?.full_name ? ` for ${learners.find((l: any) => l.id === activeLearner)?.full_name}` : ''}</DialogTitle>
              </DialogHeader>
              <WeekForm
                profileId={activeLearner!}
                existingWeeks={(weeks || []).map((w: any) => w.week)}
                onDone={() => {
                  setAddOpen(false);
                  queryClient.invalidateQueries({ queryKey: ['learning_plan'] });
                }}
              />
            </DialogContent>
          </Dialog>
        }
      />

      {/* Edit dialog */}
      <Dialog open={!!editWeek} onOpenChange={open => !open && setEditWeek(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Week {editWeek?.week}</DialogTitle>
          </DialogHeader>
          {editWeek && (
            <WeekForm
              profileId={activeLearner!}
              existing={editWeek}
              existingWeeks={(weeks || []).map((w: any) => w.week).filter((n: number) => n !== editWeek.week)}
              onDone={() => {
                setEditWeek(null);
                queryClient.invalidateQueries({ queryKey: ['learning_plan'] });
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <div className="space-y-3">
        {(weeks || []).map((w: any) => (
          <Card key={w.id} className={cn(
            'shadow-card',
            w.status === 'current' && 'border-primary/30 ring-1 ring-primary/10',
            w.status === 'completed' && 'border-success/30',
          )}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge variant={w.status === 'current' ? 'default' : 'secondary'} className={cn(
                      'font-mono text-xs',
                      w.status === 'current' && 'gradient-primary text-primary-foreground',
                    )}>
                      Week {w.week}
                    </Badge>
                    <span className="text-sm font-semibold">{w.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{w.description}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3 text-info" />
                      Theory: {Number(w.theory_hours)}h
                    </span>
                    <span className="flex items-center gap-1">
                      <Wrench className="h-3 w-3 text-primary" />
                      Hands-on: {Number(w.handson_hours)}h
                    </span>
                  </div>
                  {/* Status changer */}
                  <Select value={w.status} onValueChange={v => updateStatus(w.id, v)}>
                    <SelectTrigger className="h-7 w-36 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WEEK_STATUSES.map(s => (
                        <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditWeek(w)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => deleteWeek(w.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {!weeks?.length && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No weeks in this learner's plan yet.
          </p>
        )}
      </div>
    </div>
  );
}

function WeekForm({
  profileId,
  existing,
  existingWeeks,
  onDone,
}: {
  profileId: string;
  existing?: any;
  existingWeeks: number[];
  onDone: () => void;
}) {
  const { toast } = useToast();
  // Weeks not yet used by this learner
  const availableWeeks = Array.from({ length: 10 }, (_, i) => i + 1).filter(
    w => !existingWeeks.includes(w),
  );

  const [week, setWeek] = useState<number>(existing?.week || availableWeeks[0] || 1);
  const [title, setTitle] = useState(existing?.title || '');
  const [description, setDescription] = useState(existing?.description || '');
  const [theoryHours, setTheoryHours] = useState<number>(existing?.theory_hours ?? 0);
  const [handsonHours, setHandsonHours] = useState<number>(existing?.handson_hours ?? 0);
  const [hypothesis, setHypothesis] = useState(existing?.hypothesis_exercise || '');
  const [status, setStatus] = useState(existing?.status || 'upcoming');
  const [saving, setSaving] = useState(false);

  // Pre-fill from template when week changes (only for new weeks)
  const prefillTemplate = (w: number) => {
    if (existing) return;
    const tpl = LEARNING_PLAN_WEEKS.find(x => x.week === w);
    if (tpl) {
      setTitle(tpl.title);
      setDescription(tpl.description);
      setTheoryHours(tpl.theory_hours);
      setHandsonHours(tpl.handson_hours);
      setHypothesis(tpl.hypothesis_exercise);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);

    const payload = {
      profile_id: profileId,
      week,
      title: title.trim(),
      description,
      theory_hours: theoryHours,
      handson_hours: handsonHours,
      hypothesis_exercise: hypothesis,
      status,
    };

    const { error } = existing
      ? await supabase.from('learning_plan_weeks').update(payload).eq('id', existing.id)
      : await supabase.from('learning_plan_weeks').insert(payload);

    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else onDone();
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {!existing && (
        <div>
          <Label>Week Number</Label>
          {availableWeeks.length === 0 ? (
            <p className="text-sm text-muted-foreground mt-1">All 10 weeks are already added.</p>
          ) : (
            <Select
              value={String(week)}
              onValueChange={v => {
                const w = Number(v);
                setWeek(w);
                prefillTemplate(w);
              }}
            >
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {availableWeeks.map(w => (
                  <SelectItem key={w} value={String(w)}>Week {w}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}
      <div>
        <Label>Title</Label>
        <Input className="mt-1" value={title} onChange={e => setTitle(e.target.value)} required />
      </div>
      <div>
        <Label>Description</Label>
        <Textarea className="mt-1" value={description} onChange={e => setDescription(e.target.value)} rows={2} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Theory Hours</Label>
          <Input type="number" className="mt-1" value={theoryHours} onChange={e => setTheoryHours(Number(e.target.value))} min={0} />
        </div>
        <div>
          <Label>Hands-on Hours</Label>
          <Input type="number" className="mt-1" value={handsonHours} onChange={e => setHandsonHours(Number(e.target.value))} min={0} />
        </div>
      </div>
      <div>
        <Label>Hypothesis Exercise</Label>
        <Textarea className="mt-1" value={hypothesis} onChange={e => setHypothesis(e.target.value)} rows={2} placeholder="The business case / hypothesis exercise for this week" />
      </div>
      <div>
        <Label>Status</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            {WEEK_STATUSES.map(s => (
              <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button
        type="submit"
        disabled={saving || (!existing && availableWeeks.length === 0)}
        className="w-full gradient-primary text-primary-foreground"
      >
        {saving ? 'Saving…' : existing ? 'Update Week' : 'Add Week'}
      </Button>
    </form>
  );
}
