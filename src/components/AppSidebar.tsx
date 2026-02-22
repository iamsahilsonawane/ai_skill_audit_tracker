import { Brain, LayoutDashboard, Map, FileText, FolderKanban, Calendar, BookOpen, GraduationCap, LogOut, User, Settings2, ChevronDown } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import { useMentorContext } from '@/contexts/MentorContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

const navItems = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Skill Map', url: '/skills', icon: Map },
  { title: 'Reviews', url: '/reviews', icon: FileText },
  { title: 'Projects', url: '/projects', icon: FolderKanban },
  { title: 'Daily Log', url: '/daily-log', icon: Calendar },
  { title: 'Resources', url: '/resources', icon: BookOpen },
  { title: 'Learning Plan', url: '/plan', icon: GraduationCap },
  { title: 'Manage', url: '/manage', icon: Settings2 },
];

export function AppSidebar() {
  const { profile, signOut } = useAuth();
  const { selectedLearner, linkedLearners, setSelectedLearnerId, selectedLearnerId } = useMentorContext();
  const isMentor = profile?.role === 'mentor';

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary shadow-glow">
            <Brain className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-sidebar-foreground">Skill Audit</span>
            <span className="text-xs text-muted-foreground capitalize">{profile?.role || 'learner'}</span>
          </div>
        </div>
      </SidebarHeader>

      {/* Mentor: learner picker */}
      {isMentor && (
        <div className="px-3 pb-2">
          {linkedLearners.length === 0 ? (
            <div className="rounded-lg border border-border/50 px-3 py-2.5 text-xs text-muted-foreground">
              No learners linked yet —{' '}
              <Link to="/manage" className="text-primary underline underline-offset-2">
                add them
              </Link>
            </div>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center gap-2 rounded-lg border border-border/50 px-3 py-2 text-left text-sm transition-colors hover:bg-sidebar-accent">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {selectedLearner?.full_name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <span className="flex-1 truncate font-medium text-sidebar-foreground">
                    {selectedLearner?.full_name ?? 'Select learner'}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {linkedLearners.map(l => (
                  <DropdownMenuItem
                    key={l.id}
                    onClick={() => setSelectedLearnerId(l.id)}
                    className={cn(
                      'cursor-pointer',
                      l.id === selectedLearnerId && 'bg-accent font-medium'
                    )}
                  >
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary mr-2">
                      {l.full_name[0]?.toUpperCase()}
                    </div>
                    {l.full_name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground/70">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/'}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      activeClassName="bg-sidebar-accent text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
            <User className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium truncate">{profile?.full_name || 'User'}</span>
            <span className="text-xs text-muted-foreground capitalize">{profile?.role}</span>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground hover:text-foreground" onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
