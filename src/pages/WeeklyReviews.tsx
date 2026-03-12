import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMentorContext } from '@/contexts/MentorContext';
import { useWeeklyReviews, useLearningPlan, useMentorComments, useDailyLogsByWeek, useWeeklyReviewFiles } from '@/hooks/useProfile';
import { REVIEW_STATUS_LABELS } from '@/lib/supabase-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { RichTextEditor } from '@/components/RichTextEditor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Send, Save, MessageSquare, Star, AlertTriangle, CheckCircle } from 'lucide-react';
import { FileUploadDropzone } from '@/components/FileUploadDropzone';
import { useWeeklyReviewFiles as useFileUpload } from '@/hooks/useWeeklyReviewFiles';

export default function WeeklyReviews() {
  const { profile } = useAuth();
  const { viewingProfileId } = useMentorContext();
  const isMentor = profile?.role === 'mentor';

  const { data: reviews } = useWeeklyReviews(viewingProfileId ?? undefined);
  const { data: plans } = useLearningPlan(viewingProfileId ?? undefined);
  const currentWeek = plans?.find((p: any) => p.status === 'current')?.week || 1;
  const [selectedWeek, setSelectedWeek] = useState(currentWeek);

  const review = reviews?.find((r: any) => r.week === selectedWeek);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Weekly Reviews</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isMentor ? "Review your learners' weekly reflections" : 'Reflect on your learning each week'}
          </p>
        </div>
      </div>

      {/* Week selector */}
      <div className="flex gap-2 flex-wrap">
        {Array.from({ length: 10 }, (_, i) => i + 1).map(week => {
          const r = reviews?.find((rv: any) => rv.week === week);
          return (
            <Button
              key={week}
              variant={selectedWeek === week ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedWeek(week)}
              className={selectedWeek === week ? 'gradient-primary text-primary-foreground' : ''}
            >
              W{week}
              {r && (
                <span className="ml-1.5">
                  {r.status === 'reviewed' ? '✓' : r.status === 'submitted' ? '→' : '·'}
                </span>
              )}
            </Button>
          );
        })}
      </div>

      {/* Review form / view */}
      {isMentor ? (
        viewingProfileId ? (
          <MentorReviewView review={review} week={selectedWeek} profileId={viewingProfileId} />
        ) : (
          <Card className="shadow-card">
            <CardContent className="py-12 text-center text-muted-foreground">
              Select a learner in the sidebar to view their reviews.
            </CardContent>
          </Card>
        )
      ) : (
        <ReviewForm review={review} week={selectedWeek} profileId={profile?.id || ''} />
      )}
    </div>
  );
}

function ReviewForm({ review, week, profileId }: { review: any; week: number; profileId: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const { data: weekLogs } = useDailyLogsByWeek(profileId, week);
  const { data: uploadedFiles } = useWeeklyReviewFiles(review?.id);
  const { uploadFiles, deleteFile, downloadFile, previewFile, uploading } = useFileUpload(review?.id);
  const weekHours = weekLogs?.reduce((s, l) => s + Number(l.hours_spent || 0), 0) || 0;
  const [form, setForm] = useState({
    what_learned: review?.what_learned || '',
    what_built: review?.what_built || '',
    build_links: (review?.build_links as any[]) || [],
    what_blocked: review?.what_blocked || '',
    hypothesis_tested: review?.hypothesis_tested || '',
    business_connection: review?.business_connection || '',
    notes: review?.notes || '',
    hours_spent: review?.hours_spent || 0,
  });

  useEffect(() => {
    setForm({
      what_learned: review?.what_learned || '',
      what_built: review?.what_built || '',
      build_links: (review?.build_links as any[]) || [],
      what_blocked: review?.what_blocked || '',
      hypothesis_tested: review?.hypothesis_tested || '',
      business_connection: review?.business_connection || '',
      notes: review?.notes || '',
      hours_spent: review?.hours_spent || 0,
    });
  }, [review]);

  const isReadOnly = review?.status === 'submitted' || review?.status === 'reviewed';

  const updateField = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const addBuildLink = () => {
    updateField('build_links', [...form.build_links, { label: '', url: '' }]);
  };

  const removeBuildLink = (index: number) => {
    updateField('build_links', form.build_links.filter((_: any, i: number) => i !== index));
  };

  const save = async (status: 'draft' | 'submitted') => {
    setSaving(true);
    const payload = {
      profile_id: profileId,
      week,
      ...form,
      status,
    };

    const { error } = review
      ? await supabase.from('weekly_reviews').update(payload).eq('id', review.id)
      : await supabase.from('weekly_reviews').insert(payload);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: status === 'submitted' ? 'Review submitted!' : 'Draft saved' });
      queryClient.invalidateQueries({ queryKey: ['weekly_reviews'] });
    }
    setSaving(false);
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Week {week} Review</CardTitle>
          {review && (
            <Badge variant={review.status === 'reviewed' ? 'default' : 'secondary'}>
              {REVIEW_STATUS_LABELS[review.status as keyof typeof REVIEW_STATUS_LABELS]}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <Field label="What I Learned" hint="1-3 concrete things, not vague.">
          <Textarea value={form.what_learned} onChange={e => updateField('what_learned', e.target.value)} disabled={isReadOnly} rows={3} />
        </Field>

        <Field label="What I Built" hint="Show the code, the app, the workflow.">
          <Textarea value={form.what_built} onChange={e => updateField('what_built', e.target.value)} disabled={isReadOnly} rows={3} />
        </Field>

        <div>
          <Label className="text-sm font-medium">Build Links</Label>
          <div className="space-y-2 mt-2">
            {form.build_links.map((link: any, i: number) => (
              <div key={i} className="flex gap-2">
                <Input placeholder="Label" value={link.label} onChange={e => {
                  const updated = [...form.build_links];
                  updated[i] = { ...link, label: e.target.value };
                  updateField('build_links', updated);
                }} disabled={isReadOnly} className="flex-1" />
                <Input placeholder="URL" value={link.url} onChange={e => {
                  const updated = [...form.build_links];
                  updated[i] = { ...link, url: e.target.value };
                  updateField('build_links', updated);
                }} disabled={isReadOnly} className="flex-1" />
                {!isReadOnly && (
                  <Button variant="ghost" size="icon" onClick={() => removeBuildLink(i)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            {!isReadOnly && (
              <Button variant="outline" size="sm" onClick={addBuildLink}>
                <Plus className="mr-1 h-3 w-3" /> Add Link
              </Button>
            )}
          </div>
        </div>

        <Field label="What Blocked Me" hint="Where models hallucinated, APIs broke.">
          <Textarea value={form.what_blocked} onChange={e => updateField('what_blocked', e.target.value)} disabled={isReadOnly} rows={2} />
        </Field>

        <Field label="Hypothesis Tested" hint="The business case exercise and result.">
          <Textarea value={form.hypothesis_tested} onChange={e => updateField('hypothesis_tested', e.target.value)} disabled={isReadOnly} rows={2} />
        </Field>

         <Field label="Business Connection" hint="Which business idea does this connect to?">
           <Textarea value={form.business_connection} onChange={e => updateField('business_connection', e.target.value)} disabled={isReadOnly} rows={2} />
         </Field>

         <Field label="Additional Notes" hint="Any other reflections, learnings, or thoughts about this week.">
           <div className="mt-1">
             <RichTextEditor
               value={form.notes}
               onChange={(value) => updateField('notes', value)}
               placeholder="Share your thoughts, challenges overcome, key insights, or anything else you'd like to document about this week..."
               maxHeight="300px"
             />
           </div>
         </Field>

          <Field label="Hours Spent">
            <div className="space-y-2">
              <Input type="number" value={form.hours_spent} onChange={e => updateField('hours_spent', Number(e.target.value))} disabled={isReadOnly} />
              <div className="text-sm text-muted-foreground">
                Total logged hours this week: <span className="font-semibold">{weekHours.toFixed(2)}h</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    updateField('hours_spent', weekHours);
                    toast({ title: 'Updated', description: `Set hours to ${weekHours.toFixed(2)} from daily logs` });
                  }}
                  className="ml-2 h-6 px-2 text-xs"
                  disabled={isReadOnly}
                >
                  Use Logged Hours
                </Button>
              </div>
            </div>
          </Field>

        {/* Note Files Section */}
        <Field label="Note Files" hint="Upload markdown files with your notes for this week.">
          {!review ? (
            <div className="border-2 border-dashed rounded-lg p-6 text-center text-muted-foreground">
              <p className="text-sm">Please save your review as a draft first before uploading files.</p>
            </div>
          ) : (
            <FileUploadDropzone
              files={uploadedFiles || []}
              onFilesAdded={(files) => uploadFiles(files, profileId)}
              onFileRemove={(fileId) => {
                const file = uploadedFiles?.find(f => f.id === fileId);
                if (file) deleteFile(fileId, file.file_path);
              }}
              onFileDownload={(file) => downloadFile(file.file_path, file.file_name)}
              onFilePreview={(file) => previewFile(file.file_path, file.file_name)}
              disabled={isReadOnly || uploading}
              accept=".md"
            />
          )}
        </Field>

        {!isReadOnly && (
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => save('draft')} disabled={saving} className="flex-1">
              <Save className="mr-2 h-4 w-4" />
              Save Draft
            </Button>
            <Button onClick={() => save('submitted')} disabled={saving} className="flex-1 gradient-primary text-primary-foreground">
              <Send className="mr-2 h-4 w-4" />
              Submit
            </Button>
          </div>
        )}

        {/* Show mentor comments */}
        {review && <CommentsSection reviewId={review.id} />}
      </CardContent>
    </Card>
  );
}

function MentorReviewView({ review, week, profileId }: { review: any; week: number; profileId: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { profile } = useAuth();
  const { data: uploadedFiles } = useWeeklyReviewFiles(review?.id);
  const { downloadFile, previewFile } = useFileUpload(review?.id);

  const markReviewed = async () => {
    if (!review) return;
    const { error } = await supabase.from('weekly_reviews').update({ status: 'reviewed' }).eq('id', review.id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else {
      toast({ title: 'Marked as reviewed' });
      queryClient.invalidateQueries({ queryKey: ['weekly_reviews'] });
    }
  };

  if (!review) {
    return (
      <Card className="shadow-card">
        <CardContent className="py-12 text-center text-muted-foreground">
          No review submitted for Week {week} yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Week {week} Review</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={review.status === 'reviewed' ? 'default' : 'secondary'}>
              {REVIEW_STATUS_LABELS[review.status as keyof typeof REVIEW_STATUS_LABELS]}
            </Badge>
            {review.status === 'submitted' && (
              <Button size="sm" onClick={markReviewed} className="gradient-primary text-primary-foreground">
                <CheckCircle className="mr-1 h-4 w-4" /> Mark Reviewed
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
       <CardContent className="space-y-4">
         {review.what_learned && <ReadField label="What Learned" value={review.what_learned} />}
         {review.what_built && <ReadField label="What Built" value={review.what_built} />}
         {review.what_blocked && <ReadField label="Blockers" value={review.what_blocked} />}
         {review.hypothesis_tested && <ReadField label="Hypothesis" value={review.hypothesis_tested} />}
         {review.business_connection && <ReadField label="Business Connection" value={review.business_connection} />}
         {review.notes && <ReadNotesField label="Additional Notes" value={review.notes} />}
         <ReadField label="Hours" value={`${review.hours_spent} hours`} />

        {/* Note Files Section */}
        {uploadedFiles && uploadedFiles.length > 0 && (
          <div className="space-y-2 border-t border-border pt-4">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Note Files</span>
            <FileUploadDropzone
              files={uploadedFiles}
              onFilesAdded={() => {}}
              onFileRemove={() => {}}
              onFileDownload={(file) => downloadFile(file.file_path, file.file_name)}
              onFilePreview={(file) => previewFile(file.file_path, file.file_name)}
              disabled={true}
            />
          </div>
        )}

        {/* Add comment */}
        {profile && <AddCommentForm reviewId={review.id} mentorId={profile.id} />}
        <CommentsSection reviewId={review.id} />
      </CardContent>
    </Card>
  );
}

function AddCommentForm({ reviewId, mentorId }: { reviewId: string; mentorId: string }) {
  const [text, setText] = useState('');
  const [type, setType] = useState('general');
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setSaving(true);
    const { error } = await supabase.from('mentor_comments').insert({
      review_id: reviewId,
      mentor_id: mentorId,
      comment_text: text,
      comment_type: type,
    });
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else {
      setText('');
      queryClient.invalidateQueries({ queryKey: ['mentor_comments'] });
    }
    setSaving(false);
  };

  return (
    <div className="space-y-2 border-t border-border pt-4">
      <Label className="text-sm font-medium">Add Comment</Label>
      <div className="flex gap-2">
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="general">General</SelectItem>
            <SelectItem value="praise">Praise</SelectItem>
            <SelectItem value="correction">Correction</SelectItem>
            <SelectItem value="action_item">Action Item</SelectItem>
          </SelectContent>
        </Select>
        <Textarea value={text} onChange={e => setText(e.target.value)} placeholder="Your feedback..." className="flex-1" rows={2} />
      </div>
      <Button size="sm" onClick={handleSubmit} disabled={saving}>
        <MessageSquare className="mr-1 h-3 w-3" /> Post Comment
      </Button>
    </div>
  );
}

function CommentsSection({ reviewId }: { reviewId: string }) {
  const { data: comments } = useMentorComments(reviewId);

  if (!comments?.length) return null;

  const typeIcons = {
    general: <MessageSquare className="h-3.5 w-3.5" />,
    praise: <Star className="h-3.5 w-3.5 text-skill-can-teach" />,
    correction: <AlertTriangle className="h-3.5 w-3.5 text-destructive" />,
    action_item: <CheckCircle className="h-3.5 w-3.5 text-info" />,
  };

  return (
    <div className="space-y-3 border-t border-border pt-4">
      <h4 className="text-sm font-medium text-muted-foreground">Mentor Feedback</h4>
      {comments.map((c: any) => (
        <div key={c.id} className="rounded-lg bg-secondary/50 p-3">
          <div className="flex items-center gap-2 mb-1">
            {typeIcons[c.comment_type as keyof typeof typeIcons]}
            <Badge variant="outline" className="text-xs capitalize">{c.comment_type.replace('_', ' ')}</Badge>
          </div>
          <p className="text-sm">{c.comment_text}</p>
        </div>
      ))}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-sm font-medium">{label}</Label>
      {hint && <p className="text-xs text-muted-foreground mt-0.5 mb-1">{hint}</p>}
      <div className="mt-1">{children}</div>
    </div>
  );
}

function ReadField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <p className="text-sm mt-1 whitespace-pre-wrap">{value}</p>
    </div>
  );
}

function ReadNotesField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="text-sm mt-1 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: value }} />
    </div>
  );
}
