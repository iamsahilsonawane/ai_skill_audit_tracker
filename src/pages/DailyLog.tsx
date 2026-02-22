import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMentorContext } from '@/contexts/MentorContext';
import { useDailyLogs } from '@/hooks/useProfile';
import { MOOD_LABELS } from '@/lib/supabase-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Plus, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay } from 'date-fns';

const moodColors: Record<string, string> = {
  struggling: 'bg-mood-struggling',
  neutral: 'bg-mood-neutral',
  productive: 'bg-mood-productive',
  breakthrough: 'bg-mood-breakthrough',
};

const moodEmojis: Record<string, string> = {
  struggling: '😤',
  neutral: '😐',
  productive: '⚡',
  breakthrough: '🌟',
};

export default function DailyLog() {
  const { profile } = useAuth();
  const { viewingProfileId } = useMentorContext();
  const { data: logs } = useDailyLogs(viewingProfileId ?? undefined);
  const [currentMonth] = useState(new Date());
  const [addOpen, setAddOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const isMentor = profile?.role === 'mentor';

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = getDay(monthStart);

  const getLogForDate = (date: Date) => {
    return logs?.find(l => isSameDay(new Date(l.log_date), date));
  };

  // This week hours
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  const thisWeekLogs = logs?.filter(l => new Date(l.log_date) >= weekStart) || [];
  const weekHours = thisWeekLogs.reduce((s, l) => s + Number(l.hours_spent || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Daily Log</h1>
          <p className="text-sm text-muted-foreground mt-1">
            <Clock className="inline h-3.5 w-3.5 mr-1" />
            {weekHours}h this week
          </p>
        </div>
        {!isMentor && (
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gradient-primary text-primary-foreground">
                <Plus className="mr-1 h-4 w-4" /> Log Today
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Daily Log — {format(selectedDate, 'MMM d, yyyy')}</DialogTitle></DialogHeader>
              <LogForm profileId={viewingProfileId || ''} date={selectedDate} existing={getLogForDate(selectedDate)} onDone={() => setAddOpen(false)} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Mood legend */}
      <div className="flex gap-4 text-xs">
        {Object.entries(MOOD_LABELS).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span>{moodEmojis[key]}</span>
            <span className="text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{format(currentMonth, 'MMMM yyyy')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 text-center">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-xs font-medium text-muted-foreground py-2">{d}</div>
            ))}
            {Array.from({ length: startDay }).map((_, i) => <div key={`e-${i}`} />)}
            {days.map(day => {
              const log = getLogForDate(day);
              const isToday = isSameDay(day, new Date());
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => {
                    setSelectedDate(day);
                    if (!isMentor) setAddOpen(true);
                  }}
                  className={cn(
                    'aspect-square rounded-lg text-xs flex flex-col items-center justify-center gap-0.5 transition-colors hover:bg-secondary/50',
                    isToday && 'ring-1 ring-primary',
                    log && 'font-medium'
                  )}
                >
                  <span>{format(day, 'd')}</span>
                  {log && (
                    <div className={cn('h-1.5 w-1.5 rounded-full', moodColors[log.mood])} />
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent logs */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Recent Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {logs?.slice(0, 7).map(log => (
              <div key={log.id} className="flex items-start gap-3 rounded-lg border border-border/50 p-3">
                <span className="text-lg">{moodEmojis[log.mood]}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium">{format(new Date(log.log_date), 'EEE, MMM d')}</span>
                    <Badge variant="outline" className="text-xs">{Number(log.hours_spent)}h</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{log.summary || 'No summary'}</p>
                </div>
              </div>
            ))}
            {!logs?.length && (
              <p className="text-sm text-muted-foreground text-center py-4">No logs yet. Start logging your daily progress!</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function LogForm({ profileId, date, existing, onDone }: { profileId: string; date: Date; existing: any; onDone: () => void }) {
  const [hours, setHours] = useState(existing?.hours_spent || 0);
  const [summary, setSummary] = useState(existing?.summary || '');
  const [mood, setMood] = useState(existing?.mood || 'neutral');
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      profile_id: profileId,
      log_date: format(date, 'yyyy-MM-dd'),
      hours_spent: hours,
      summary,
      mood,
    };

    const { error } = existing
      ? await supabase.from('daily_logs').update(payload).eq('id', existing.id)
      : await supabase.from('daily_logs').insert(payload);

    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else {
      queryClient.invalidateQueries({ queryKey: ['daily_logs'] });
      onDone();
    }
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Hours Spent</Label>
        <Input type="number" step="0.5" value={hours} onChange={e => setHours(Number(e.target.value))} className="mt-1" />
      </div>
      <div>
        <Label>Summary</Label>
        <Textarea value={summary} onChange={e => setSummary(e.target.value)} placeholder="What did you do today?" className="mt-1" rows={2} />
      </div>
      <div>
        <Label>Mood</Label>
        <div className="grid grid-cols-4 gap-2 mt-1">
          {Object.entries(MOOD_LABELS).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setMood(key)}
              className={cn(
                'rounded-lg border p-2 text-center text-xs transition-all',
                mood === key ? 'border-primary bg-primary/10 font-medium' : 'border-border hover:bg-secondary/50'
              )}
            >
              <div className="text-lg mb-0.5">{moodEmojis[key]}</div>
              {label}
            </button>
          ))}
        </div>
      </div>
      <Button type="submit" disabled={saving} className="w-full gradient-primary text-primary-foreground">
        {saving ? 'Saving...' : existing ? 'Update Log' : 'Save Log'}
      </Button>
    </form>
  );
}
