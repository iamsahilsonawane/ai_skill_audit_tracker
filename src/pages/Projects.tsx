import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMentorContext } from '@/contexts/MentorContext';
import { useProjects } from '@/hooks/useProfile';
import { PROJECT_STATUS_LABELS } from '@/lib/supabase-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Plus, Github, ExternalLink, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusColors: Record<string, string> = {
  not_started: 'bg-muted text-muted-foreground',
  in_progress: 'bg-info/10 text-info border-info/20',
  completed: 'bg-success/10 text-success border-success/20',
  abandoned: 'bg-destructive/10 text-destructive border-destructive/20',
};

export default function Projects() {
  const { profile } = useAuth();
  const { viewingProfileId } = useMentorContext();
  const { data: projects } = useProjects(viewingProfileId ?? undefined);
  const isMentor = profile?.role === 'mentor';
  const [addOpen, setAddOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">{projects?.filter(p => p.status === 'completed').length || 0} of {projects?.length || 0} completed</p>
        </div>
        {!isMentor && (
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gradient-primary text-primary-foreground">
                <Plus className="mr-1 h-4 w-4" /> Add Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Project</DialogTitle>
              </DialogHeader>
              <AddProjectForm profileId={viewingProfileId || ''} onDone={() => {
                setAddOpen(false);
                queryClient.invalidateQueries({ queryKey: ['projects'] });
              }} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects?.map(project => (
          <ProjectCard key={project.id} project={project} isMentor={isMentor} />
        ))}
      </div>
    </div>
  );
}

function ProjectCard({ project, isMentor }: { project: any; isMentor: boolean }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateStatus = async (status: string) => {
    const { error } = await supabase.from('projects').update({ status }).eq('id', project.id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else queryClient.invalidateQueries({ queryKey: ['projects'] });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Card className="shadow-card hover:shadow-card-hover transition-all cursor-pointer group">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{project.title}</h3>
              <Badge className={cn('text-xs', statusColors[project.status])}>
                {PROJECT_STATUS_LABELS[project.status as keyof typeof PROJECT_STATUS_LABELS]}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{project.description}</p>
            <div className="flex flex-wrap gap-1 mb-3">
              {(project.tools_used || []).map((t: string) => (
                <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
              ))}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {Number(project.actual_hours)}/{Number(project.estimated_hours)}h
              </div>
              {project.github_url && <Github className="h-3.5 w-3.5" />}
              {project.deployed_url && <ExternalLink className="h-3.5 w-3.5" />}
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{project.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{project.description}</p>
          
          {!isMentor && (
            <div>
              <Label className="text-sm">Status</Label>
              <Select value={project.status} onValueChange={updateStatus}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PROJECT_STATUS_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {project.github_url && (
            <a href={project.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
              <Github className="h-4 w-4" /> GitHub Repository
            </a>
          )}
          {project.deployed_url && (
            <a href={project.deployed_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
              <ExternalLink className="h-4 w-4" /> Live Demo
            </a>
          )}
          {project.notes && (
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Notes</Label>
              <p className="text-sm mt-1 whitespace-pre-wrap">{project.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddProjectForm({ profileId, onDone }: { profileId: string; onDone: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tools, setTools] = useState('');
  const [estHours, setEstHours] = useState(0);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('projects').insert({
      profile_id: profileId,
      title,
      description,
      tools_used: tools.split(',').map(t => t.trim()).filter(Boolean),
      estimated_hours: estHours,
    });
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else onDone();
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div><Label>Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} required className="mt-1" /></div>
      <div><Label>Description</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} className="mt-1" /></div>
      <div><Label>Tools (comma separated)</Label><Input value={tools} onChange={e => setTools(e.target.value)} className="mt-1" placeholder="LangChain, OpenAI" /></div>
      <div><Label>Estimated Hours</Label><Input type="number" value={estHours} onChange={e => setEstHours(Number(e.target.value))} className="mt-1" /></div>
      <Button type="submit" disabled={saving} className="w-full gradient-primary text-primary-foreground">{saving ? 'Adding...' : 'Add Project'}</Button>
    </form>
  );
}
