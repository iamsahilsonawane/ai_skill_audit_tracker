import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Brain, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Auth() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (session) return <Navigate to="/" replace />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary shadow-glow">
            <Brain className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Skill Audit Tracker</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track your AI engineering journey</p>
        </div>

        <Card className="shadow-card border-border/50">
          <Tabs defaultValue="signin">
            <CardHeader className="pb-4">
              <TabsList className="grid w-full grid-cols-1">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                {/* <TabsTrigger value="signup">Sign Up</TabsTrigger> */}
              </TabsList>
            </CardHeader>
            <CardContent>
              <TabsContent value="signin" className="mt-0">
                <SignInForm />
              </TabsContent>
              {/* <TabsContent value="signup" className="mt-0">
                <SignUpForm />
              </TabsContent> */}
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}

function SignInForm() {
  const { signIn } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signin-email">Email</Label>
        <Input id="signin-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="sahil@example.com" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signin-password">Password</Label>
        <Input id="signin-password" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
      </div>
      <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={loading}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Sign In
      </Button>
    </form>
  );
}

function SignUpForm() {
  const { signUp } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'learner' | 'mentor'>('learner');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signUp(email, password, fullName, role);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Check your email', description: 'We sent you a confirmation link.' });
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signup-name">Full Name</Label>
        <Input id="signup-name" value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="Sahil" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>
        <Input id="signup-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="sahil@example.com" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-password">Password</Label>
        <Input id="signup-password" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} placeholder="••••••••" />
      </div>
      <div className="space-y-2">
        <Label>Role</Label>
        <Select value={role} onValueChange={(v: 'learner' | 'mentor') => setRole(v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="learner">Learner</SelectItem>
            <SelectItem value="mentor">Mentor</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={loading}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Create Account
      </Button>
    </form>
  );
}
