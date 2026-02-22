import { useState } from 'react';
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMentorContext } from '@/contexts/MentorContext';
import { useSkills, useSkillAssessments, useLearningPlan } from '@/hooks/useProfile';
import { SKILL_CATEGORIES, SKILL_LEVEL_LABELS, SKILL_LEVEL_COLORS, SkillLevel, LEARNING_PLAN_WEEKS } from '@/lib/supabase-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { RichTextEditor } from '@/components/RichTextEditor';
import { Eye, Edit } from 'lucide-react';

export default function SkillMap() {
  const [viewMode, setViewMode] = useState<'category' | 'weekly'>('category');
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
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'category' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('category')}
          >
            Category View
          </Button>
          <Button
            variant={viewMode === 'weekly' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('weekly')}
          >
            Weekly View
          </Button>
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

      {/* Skills by Category or Week */}
      {viewMode === 'category' ? (
        <>
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
                          assessments={assessments}
                        />
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </>
      ) : (
        <>
          {LEARNING_PLAN_WEEKS.map(week => {
            const weekSkills = skills?.filter(s => s.target_week === week.week) || [];
            const weekData = plans?.find(p => p.week === week.week);
            return (
              <Card key={week.week} className="shadow-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      Week {week.week}: {week.title}
                      <Badge variant="secondary" className="font-mono text-xs">
                        {weekSkills.length}
                      </Badge>
                    </div>
                    {!isMentor && (
                      <div className="flex gap-2">
                        {weekData?.notes && weekData.notes.trim() !== '' && (
                          <WeekNotesViewDialog weekData={weekData} />
                        )}
                        <WeekNotesEditDialog
                          weekData={weekData}
                          profileId={profile?.id || ''}
                          week={week}
                        />
                      </div>
                    )}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{week.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2">
                    {weekSkills.map(skill => {
                      const level = getLevel(skill.id);
                      return (
                        <SkillRow
                          key={skill.id}
                          skill={skill}
                          level={level}
                          currentWeek={currentWeek}
                          profileId={profile?.id || ''}
                          isMentor={isMentor}
                          assessments={assessments}
                        />
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </>
      )}
    </div>
  );
}

function SkillRow({ skill, level, currentWeek, profileId, isMentor, assessments }: {
  skill: any;
  level: SkillLevel;
  currentWeek: number;
  profileId: string;
  isMentor: boolean;
  assessments?: any[];
}) {
  const [open, setOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [newLevel, setNewLevel] = useState(level);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get existing assessment data when dialog opens
  const existingAssessment = assessments?.find(a => a.skill_id === skill.id && a.week === currentWeek);

  // Update state when dialog opens or existing assessment changes
  React.useEffect(() => {
    if (open && existingAssessment) {
      setNewLevel(existingAssessment.level as SkillLevel);
      setNotes(existingAssessment.notes || '');
    } else if (open) {
      setNewLevel(level);
      setNotes('');
    }
  }, [open, existingAssessment, level]);

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

  const hasNotes = existingAssessment?.notes && existingAssessment.notes.trim() !== '';

  return (
    <>
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
              {hasNotes && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    setNotesOpen(true);
                  }}
                >
                  <Eye className="h-3 w-3" />
                </Button>
              )}
            </div>
          </button>
        </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-base">{skill.name}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">
          {!isMentor ? (
            <div className="space-y-4 pr-2">
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
                <div className="mt-1">
                  <RichTextEditor
                    value={notes}
                    onChange={setNotes}
                    placeholder="What did you learn?"
                    maxHeight="200px"
                  />
                </div>
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
        </div>
      </DialogContent>
      </Dialog>

      {/* Notes View Dialog */}
      <Dialog open={notesOpen} onOpenChange={setNotesOpen}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-base">Notes for {skill.name}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">
          <div className="prose prose-sm max-w-none p-4">
            <div dangerouslySetInnerHTML={{ __html: existingAssessment?.notes || '' }} />
          </div>
        </div>
      </DialogContent>
      </Dialog>
    </>
  );
}

function WeekNotesViewDialog({ weekData }: { weekData: any }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
          <Eye className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-base">Notes for Week {weekData.week}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">
          <div className="prose prose-sm max-w-none p-4">
            <div dangerouslySetInnerHTML={{ __html: weekData.notes || '' }} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function WeekNotesEditDialog({ weekData, profileId, week }: { weekData: any; profileId: string; week: any }) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  React.useEffect(() => {
    if (open && weekData) {
      setNotes(weekData.notes || '');
    } else if (open) {
      setNotes('');
    }
  }, [open, weekData]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = weekData
      ? await supabase.from('learning_plan_weeks').update({ notes }).eq('id', weekData.id)
      : await supabase.from('learning_plan_weeks').insert({
          profile_id: profileId,
          week: week.week,
          title: week.title,
          description: week.description,
          theory_hours: week.theory_hours,
          handson_hours: week.handson_hours,
          hypothesis_exercise: week.hypothesis_exercise,
          notes,
          status: 'upcoming',
        });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Saved' });
      queryClient.invalidateQueries({ queryKey: ['learning_plan'] });
      setOpen(false);
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
          <Edit className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-base">Edit Notes for Week {week.week}: {week.title}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-2">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Week Notes</label>
              <div className="mt-1">
                <RichTextEditor
                  value={notes}
                  onChange={setNotes}
                  placeholder="Add your notes for this week..."
                  maxHeight="400px"
                />
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full gradient-primary text-primary-foreground">
              {saving ? 'Saving...' : 'Save Notes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
