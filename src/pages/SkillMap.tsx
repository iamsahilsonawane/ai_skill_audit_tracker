import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMentorContext } from '@/contexts/MentorContext';
import { useSkills, useSkillAssessments, useLearningPlan } from '@/hooks/useProfile';
import { SKILL_CATEGORIES, SKILL_LEVEL_LABELS, SKILL_LEVEL_COLORS, SkillLevel } from '@/lib/supabase-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function SkillMap() {
  const { profile } = useAuth();
  const { viewingProfileId } = useMentorContext();
  const { data: skills } = useSkills();
  const { data: plans } = useLearningPlan(viewingProfileId ?? undefined);
  const currentWeek = plans?.find(p => p.status === 'current')?.week || 1;
  const { data: assessments } = useSkillAssessments(viewingProfileId ?? undefined);
  const isMentor = profile?.role === 'mentor';

  const getLevel = (skillId: string): SkillLevel => {
    // Get latest assessment for this skill
    const skillAssessments = assessments?.filter(a => a.skill_id === skillId).sort((a, b) => b.week - a.week);
    return (skillAssessments?.[0]?.level as SkillLevel) || 'not_started';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Skill Map</h1>
          <p className="text-sm text-muted-foreground mt-1">43 skills across 5 categories</p>
        </div>
      </div>

      {/* Heat Map Legend */}
      <div className="flex items-center gap-4 text-xs">
        <span className="text-muted-foreground">Legend:</span>
        {Object.entries(SKILL_LEVEL_LABELS).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className={cn('h-3 w-3 rounded-sm', SKILL_LEVEL_COLORS[key as SkillLevel])} />
            <span className="text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      {/* Skills by Category */}
      {SKILL_CATEGORIES.map(category => {
        const categorySkills = skills?.filter(s => s.category === category) || [];
        return (
          <Card key={category} className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                {category}
                <Badge variant="secondary" className="font-mono text-xs">
                  {categorySkills.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {categorySkills.map(skill => {
                  const level = getLevel(skill.id);
                  return (
                    <SkillRow
                      key={skill.id}
                      skill={skill}
                      level={level}
                      currentWeek={currentWeek}
                      profileId={profile?.id || ''}
                      isMentor={isMentor}
                    />
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function SkillRow({ skill, level, currentWeek, profileId, isMentor }: {
  skill: any;
  level: SkillLevel;
  currentWeek: number;
  profileId: string;
  isMentor: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [newLevel, setNewLevel] = useState(level);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from('skill_assessments').upsert({
      profile_id: profileId,
      skill_id: skill.id,
      week: currentWeek,
      level: newLevel,
      notes,
    }, { onConflict: 'profile_id,skill_id,week' });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Saved' });
      queryClient.invalidateQueries({ queryKey: ['skill_assessments'] });
      setOpen(false);
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center justify-between rounded-lg border border-border/50 px-4 py-3 text-left transition-colors hover:bg-secondary/50 w-full">
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn('h-2.5 w-2.5 rounded-full shrink-0', SKILL_LEVEL_COLORS[level])} />
            <span className="text-sm truncate">{skill.name}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            <Badge variant="outline" className="font-mono text-xs">W{skill.target_week}</Badge>
            <Badge variant="secondary" className="text-xs">{SKILL_LEVEL_LABELS[level]}</Badge>
          </div>
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-base">{skill.name}</DialogTitle>
        </DialogHeader>
        {!isMentor ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Level (Week {currentWeek})</label>
              <Select value={newLevel} onValueChange={(v) => setNewLevel(v as SkillLevel)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(SKILL_LEVEL_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Notes</label>
              <Textarea className="mt-1" value={notes} onChange={e => setNotes(e.target.value)} placeholder="What did you learn?" />
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full gradient-primary text-primary-foreground">
              {saving ? 'Saving...' : 'Save Assessment'}
            </Button>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            Current level: <Badge>{SKILL_LEVEL_LABELS[level]}</Badge>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
