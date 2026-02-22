import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMentorContext } from '@/contexts/MentorContext';
import { useResources } from '@/hooks/useProfile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Plus, ExternalLink, Video, BookOpen, GraduationCap, Wrench, Github, FileText } from 'lucide-react';

const typeIcons: Record<string, any> = {
  video: Video,
  article: FileText,
  course: GraduationCap,
  book: BookOpen,
  tool: Wrench,
  repo: Github,
};

const typeLabels: Record<string, string> = {
  video: 'Video', article: 'Article', course: 'Course', book: 'Book', tool: 'Tool', repo: 'Repo',
};

export default function Resources() {
  const { profile } = useAuth();
  const { viewingProfileId } = useMentorContext();
  const { data: resources } = useResources(viewingProfileId ?? undefined);
  const [addOpen, setAddOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const isMentor = profile?.role === 'mentor';
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const filtered = filter === 'all' ? resources : resources?.filter(r => r.resource_type === filter);

  const toggleCompleted = async (id: string, current: boolean) => {
    await supabase.from('resources').update({ is_completed: !current }).eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['resources'] });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Resources</h1>
          <p className="text-sm text-muted-foreground mt-1">{resources?.filter(r => r.is_completed).length || 0} of {resources?.length || 0} completed</p>
        </div>
        {!isMentor && (
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gradient-primary text-primary-foreground"><Plus className="mr-1 h-4 w-4" /> Add Resource</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Resource</DialogTitle></DialogHeader>
              <AddResourceForm profileId={viewingProfileId || ''} onDone={() => { setAddOpen(false); queryClient.invalidateQueries({ queryKey: ['resources'] }); }} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')}>All</Button>
        {Object.entries(typeLabels).map(([k, v]) => (
          <Button key={k} variant={filter === k ? 'default' : 'outline'} size="sm" onClick={() => setFilter(k)}>{v}</Button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered?.map(resource => {
          const Icon = typeIcons[resource.resource_type] || FileText;
          return (
            <Card key={resource.id} className="shadow-card hover:shadow-card-hover transition-shadow">
              <CardContent className="p-4 flex items-center gap-4">
                {!isMentor && (
                  <Checkbox
                    checked={resource.is_completed}
                    onCheckedChange={() => toggleCompleted(resource.id, resource.is_completed)}
                  />
                )}
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary shrink-0">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${resource.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                      {resource.title}
                    </span>
                    <Badge variant="outline" className="text-xs">{typeLabels[resource.resource_type]}</Badge>
                  </div>
                  {resource.notes && <p className="text-xs text-muted-foreground truncate mt-0.5">{resource.notes}</p>}
                </div>
                {resource.url && (
                  <a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </CardContent>
            </Card>
          );
        })}
        {!filtered?.length && (
          <p className="text-center text-sm text-muted-foreground py-8">No resources yet. Start building your library!</p>
        )}
      </div>
    </div>
  );
}

function AddResourceForm({ profileId, onDone }: { profileId: string; onDone: () => void }) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState('article');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('resources').insert({
      profile_id: profileId, title, url, resource_type: type, notes,
    });
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else onDone();
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div><Label>Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} required className="mt-1" /></div>
      <div><Label>URL</Label><Input value={url} onChange={e => setUrl(e.target.value)} className="mt-1" placeholder="https://" /></div>
      <div>
        <Label>Type</Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div><Label>Notes</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} className="mt-1" /></div>
      <Button type="submit" disabled={saving} className="w-full gradient-primary text-primary-foreground">{saving ? 'Adding...' : 'Add Resource'}</Button>
    </form>
  );
}
