import { useAuth } from '@/contexts/AuthContext';
import { useMentorContext } from '@/contexts/MentorContext';
import { useLearningPlan } from '@/hooks/useProfile';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Clock, BookOpen, Wrench, Lightbulb, CheckCircle, Circle } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';

export default function LearningPlan() {
  const { profile } = useAuth();
  const { viewingProfileId } = useMentorContext();
  const { data: weeks } = useLearningPlan(viewingProfileId ?? undefined);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Learning Plan</h1>
        <p className="text-sm text-muted-foreground mt-1">10-week AI engineering journey</p>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-border" />

        <div className="space-y-4">
          {weeks?.map(week => (
            <WeekCard key={week.id} week={week} />
          ))}
          {!weeks?.length && (
            <p className="text-sm text-muted-foreground text-center py-8">Learning plan will be loaded when you sign up.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function WeekCard({ week }: { week: any }) {
  const [open, setOpen] = useState(week.status === 'current');

  const statusColors: Record<string, string> = {
    upcoming: 'border-border bg-card',
    current: 'border-primary/30 bg-card ring-1 ring-primary/10',
    completed: 'border-success/30 bg-card',
  };

  const dotColors: Record<string, string> = {
    upcoming: 'bg-muted',
    current: 'bg-primary animate-pulse-glow',
    completed: 'bg-success',
  };

  const totalHours = Number(week.theory_hours) + Number(week.handson_hours);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="relative pl-12">
        {/* Timeline dot */}
        <div className={cn('absolute left-[14px] top-5 h-3 w-3 rounded-full border-2 border-background', dotColors[week.status])} />

        <CollapsibleTrigger asChild>
          <Card className={cn('shadow-card cursor-pointer transition-all hover:shadow-card-hover', statusColors[week.status])}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant={week.status === 'current' ? 'default' : 'secondary'} className={cn(
                    'font-mono text-xs',
                    week.status === 'current' && 'gradient-primary text-primary-foreground'
                  )}>
                    Week {week.week}
                  </Badge>
                  <h3 className="font-semibold text-sm">{week.title}</h3>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {totalHours}h
                  {week.status === 'current' && <Badge className="bg-primary/10 text-primary border-0 text-xs">Current</Badge>}
                  {week.status === 'completed' && <CheckCircle className="h-4 w-4 text-success" />}
                </div>
              </div>
            </CardContent>
          </Card>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="mt-2 ml-4 space-y-3 pb-2">
            <p className="text-sm text-muted-foreground">{week.description}</p>

            {/* Hour split */}
            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-info" />
                <span className="text-muted-foreground">Theory: {Number(week.theory_hours)}h</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Wrench className="h-3.5 w-3.5 text-primary" />
                <span className="text-muted-foreground">Hands-on: {Number(week.handson_hours)}h</span>
              </div>
            </div>

            <Progress value={(Number(week.theory_hours) / totalHours) * 100} className="h-1.5" />

            {/* Hypothesis */}
            {week.hypothesis_exercise && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Lightbulb className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-primary">Hypothesis Exercise</span>
                </div>
                <p className="text-xs text-foreground/80">{week.hypothesis_exercise}</p>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
