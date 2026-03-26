import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Map,
  BookOpen,
  FolderKanban,
  GraduationCap,
  FileText,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Clock,
  Loader2,
  Command,
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type SearchCategory = 'skill' | 'resource' | 'project' | 'plan' | 'page';

interface SearchItem {
  id: string;
  title: string;
  subtitle?: string;
  category: SearchCategory;
  meta?: string;
  url?: string;
  route?: string;
  tags?: string[];
}

interface SearchIndexRow {
  id: string;
  source_type: 'skill' | 'resource' | 'project' | 'learning_plan';
  source_id: string;
  title: string;
  content: string;
  metadata: Record<string, string>;
}

/* ------------------------------------------------------------------ */
/*  Category config                                                    */
/* ------------------------------------------------------------------ */

const CATEGORY_CONFIG: Record<
  SearchCategory,
  { label: string; icon: React.ReactNode; color: string; bgColor: string }
> = {
  skill: {
    label: 'Skills',
    icon: <Map className="h-3.5 w-3.5" />,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  resource: {
    label: 'Resources',
    icon: <BookOpen className="h-3.5 w-3.5" />,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
  },
  project: {
    label: 'Projects',
    icon: <FolderKanban className="h-3.5 w-3.5" />,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
  plan: {
    label: 'Learning Plan',
    icon: <GraduationCap className="h-3.5 w-3.5" />,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  page: {
    label: 'Pages',
    icon: <FileText className="h-3.5 w-3.5" />,
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
  },
};

const QUICK_PAGES: SearchItem[] = [
  { id: 'page-dashboard', title: 'Dashboard', subtitle: 'Overview & stats', category: 'page', route: '/' },
  { id: 'page-skills', title: 'Skill Map', subtitle: 'Track skill progress', category: 'page', route: '/skills' },
  { id: 'page-reviews', title: 'Weekly Reviews', subtitle: 'Reflections & feedback', category: 'page', route: '/reviews' },
  { id: 'page-projects', title: 'Projects', subtitle: 'Hands-on builds', category: 'page', route: '/projects' },
  { id: 'page-daily-log', title: 'Daily Log', subtitle: 'Time & mood tracking', category: 'page', route: '/daily-log' },
  { id: 'page-resources', title: 'Resources', subtitle: 'Videos, articles, tools', category: 'page', route: '/resources' },
  { id: 'page-plan', title: 'Learning Plan', subtitle: '10-week curriculum', category: 'page', route: '/plan' },
];

/* ------------------------------------------------------------------ */
/*  Resource type badge colors                                         */
/* ------------------------------------------------------------------ */

const RESOURCE_TYPE_STYLES: Record<string, string> = {
  video: 'bg-red-500/10 text-red-500 border-red-500/20',
  article: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  course: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  book: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  tool: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  repo: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function mapRowToSearchItem(row: SearchIndexRow): SearchItem {
  const base = {
    id: row.id,
    title: row.title,
  };

  switch (row.source_type) {
    case 'skill':
      return {
        ...base,
        category: 'skill',
        subtitle: row.metadata?.category,
        route: '/skills',
      };

    case 'resource':
      return {
        ...base,
        category: 'resource',
        meta: row.metadata?.resource_type,
        url: row.metadata?.url,
        route: '/resources',
      };

    case 'project': {
      const rawContent = row.content !== row.title ? row.content : undefined;
      return {
        ...base,
        category: 'project',
        subtitle: rawContent ? rawContent.slice(0, 100) + (rawContent.length > 100 ? '…' : '') : undefined,
        meta: row.metadata?.status?.replace('_', ' '),
        route: '/projects',
      };
    }

    case 'learning_plan':
      return {
        ...base,
        category: 'plan',
        subtitle: row.content !== row.title ? row.content : undefined,
        meta: row.metadata?.status,
        route: '/plan',
      };

    default:
      return { ...base, category: 'page' };
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function SmartSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [aiResults, setAiResults] = useState<SearchItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { session } = useAuth();

  /* ---- Cmd + K listener ---- */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  /* ---- Reset on dialog close ---- */
  useEffect(() => {
    if (!open) {
      setQuery('');
      setAiResults([]);
      setIsLoading(false);
    }
  }, [open]);

  /* ---- Debounced AI search ---- */
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setAiResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const timer = setTimeout(async () => {
      try {
        const { data, error } = await supabase.functions.invoke('ai_search_across', {
          body: { query: trimmed },
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        });
        if (!error && Array.isArray(data)) {
          setAiResults((data as SearchIndexRow[]).map(mapRowToSearchItem));
        } else {
          setAiResults([]);
        }
      } catch {
        setAiResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  /* ---- Build display items ---- */
  const hasQuery = query.trim().length > 0;

  const filteredPages = useMemo(() => {
    if (!hasQuery) return QUICK_PAGES;
    const q = query.toLowerCase();
    return QUICK_PAGES.filter(
      (p) => p.title.toLowerCase().includes(q) || p.subtitle?.toLowerCase().includes(q),
    );
  }, [query, hasQuery]);

  // Combine pages + AI results when searching
  const allDisplayItems = useMemo<SearchItem[]>(() => {
    if (!hasQuery) return QUICK_PAGES;
    return [...filteredPages, ...aiResults];
  }, [hasQuery, filteredPages, aiResults]);

  const categoryOrder: SearchCategory[] = ['page', 'skill', 'project', 'resource', 'plan'];

  const groupedItems = useMemo(() => {
    const groups: Partial<Record<SearchCategory, SearchItem[]>> = {};
    allDisplayItems.forEach((item) => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category]!.push(item);
    });
    return groups;
  }, [allDisplayItems]);

  const resultCount = allDisplayItems.length;

  /* ---- Flat list for keyboard nav ---- */
  const flatDisplayList = useMemo(() => {
    const list: SearchItem[] = [];
    categoryOrder.forEach((cat) => {
      const items = groupedItems[cat];
      if (!items?.length) return;
      list.push(...items);
    });
    return list;
  }, [groupedItems]);

  /* ---- Keyboard navigation ---- */
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedIndex(-1);
  }, [query, resultCount]);

  /* ---- Handle selection ---- */
  const handleSelect = useCallback(
    (item: SearchItem) => {
      setOpen(false);
      setQuery('');
      if (item.url) {
        window.open(item.url, '_blank', 'noopener');
      } else if (item.route) {
        navigate(item.route);
      }
    },
    [navigate],
  );

  /* ---- Keyboard handler ---- */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < flatDisplayList.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : flatDisplayList.length - 1));
      } else if (e.key === 'Enter' && selectedIndex >= 0 && selectedIndex < flatDisplayList.length) {
        e.preventDefault();
        handleSelect(flatDisplayList[selectedIndex]);
      }
    },
    [flatDisplayList, selectedIndex, handleSelect],
  );

  useEffect(() => {
    if (selectedIndex < 0) return;
    const container = scrollContainerRef.current;
    if (!container) return;
    const selected = container.querySelector(`[data-search-index="${selectedIndex}"]`);
    selected?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          'group flex items-center gap-2 rounded-lg border border-border/60',
          'bg-card/60 backdrop-blur-sm px-3 py-1.5',
          'text-sm text-muted-foreground',
          'transition-all duration-200',
          'hover:border-primary/30 hover:bg-card hover:shadow-sm hover:shadow-primary/5',
          'focus:outline-none focus:ring-2 focus:ring-primary/20',
          'w-64',
        )}
      >
        <Search className="h-3.5 w-3.5 text-muted-foreground/70 transition-colors group-hover:text-primary/70" />
        <span className="flex-1 text-left text-muted-foreground/70">Search anything...</span>
        <kbd
          className={cn(
            'pointer-events-none hidden h-5 select-none items-center gap-0.5 rounded border border-border/80',
            'bg-muted/50 px-1.5 font-mono text-[10px] font-medium text-muted-foreground/60',
            'sm:inline-flex',
          )}
        >
          <Command className="h-2.5 w-2.5" />K
        </kbd>
      </button>

      {/* Search dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className={cn(
            'overflow-hidden p-0 shadow-2xl shadow-primary/5',
            'sm:max-w-[640px] sm:rounded-xl',
            'border border-border/50',
            'bg-card/95 backdrop-blur-xl',
            '[&>button]:hidden',
          )}
        >
          <DialogTitle className="sr-only">Search</DialogTitle>

          {/* Animated glow border */}
          <div className="absolute inset-0 rounded-xl opacity-50 pointer-events-none">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          </div>

          {/* Search input area */}
          <div className="relative flex items-center gap-3 border-b border-border/50 px-4 py-3">
            <div
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                'bg-primary/10 transition-all duration-300',
                hasQuery && 'bg-primary/20 shadow-sm shadow-primary/10',
              )}
            >
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Loader2 className="h-4 w-4 text-primary animate-spin" />
                  </motion.div>
                ) : hasQuery ? (
                  <motion.div
                    key="sparkle"
                    initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.5, rotate: 20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Sparkles className="h-4 w-4 text-primary" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="search"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Search className="h-4 w-4 text-primary/70" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search skills, projects, resources, pages..."
              className={cn(
                'flex-1 bg-transparent text-[15px] font-medium',
                'placeholder:text-muted-foreground/50',
                'outline-none border-none',
                'text-foreground',
              )}
              autoFocus
            />

            {hasQuery && !isLoading && (
              <motion.span
                initial={{ opacity: 0, x: 4 }}
                animate={{ opacity: 1, x: 0 }}
                className="shrink-0 rounded-md bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
              >
                {resultCount} result{resultCount !== 1 ? 's' : ''}
              </motion.span>
            )}

            <kbd
              className={cn(
                'hidden sm:flex shrink-0 items-center gap-0.5 rounded-md border border-border/60',
                'bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground/50',
              )}
            >
              ESC
            </kbd>
          </div>

          {/* Results area */}
          <div
            ref={scrollContainerRef}
            className="max-h-[min(60vh,420px)] overflow-y-auto overscroll-contain px-2 py-2"
          >
            {/* Loading skeleton */}
            {isLoading && (
              <div className="space-y-1 px-2 py-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg px-1 py-2">
                    <div className="h-8 w-8 rounded-lg bg-muted/40 animate-pulse" />
                    <div className="flex-1 space-y-1.5">
                      <div
                        className="h-3 rounded bg-muted/40 animate-pulse"
                        style={{ width: `${55 + i * 10}%` }}
                      />
                      <div className="h-2.5 w-1/3 rounded bg-muted/30 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* No results state */}
            {!isLoading && hasQuery && resultCount === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-12 px-4"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/50 mb-3">
                  <Search className="h-5 w-5 text-muted-foreground/40" />
                </div>
                <p className="text-sm font-medium text-muted-foreground/70">
                  No results for &ldquo;{query}&rdquo;
                </p>
                <p className="mt-1 text-xs text-muted-foreground/50">
                  Try a different search term
                </p>
              </motion.div>
            )}

            {/* Initial hint (no query) */}
            {!hasQuery && (
              <div className="mx-1 mb-3 flex items-center gap-2.5 rounded-lg border border-primary/10 bg-primary/[0.03] px-3 py-2.5">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10">
                  <Sparkles className="h-3 w-3 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground/80">Smart Search</p>
                  <p className="text-[11px] text-muted-foreground/60 leading-tight">
                    AI-powered hybrid search — type anything to find skills, resources, projects, and more.
                  </p>
                </div>
              </div>
            )}

            {/* Grouped results */}
            {!isLoading &&
              (() => {
                let flatIndex = 0;
                return categoryOrder.map((cat) => {
                  const items = groupedItems[cat];
                  if (!items?.length) return null;
                  const config = CATEGORY_CONFIG[cat];

                  const group = (
                    <div key={cat} className="mb-1">
                      {/* Group heading */}
                      <div className="flex items-center gap-2 px-2 py-1.5 mt-1">
                        <div
                          className={cn(
                            'flex h-5 w-5 items-center justify-center rounded',
                            config.bgColor,
                            config.color,
                          )}
                        >
                          {config.icon}
                        </div>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                          {config.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground/40">{items.length}</span>
                      </div>

                      {/* Items */}
                      {items.map((item, i) => {
                        const currentFlatIndex = flatIndex++;
                        const isSelected = currentFlatIndex === selectedIndex;

                        return (
                          <motion.button
                            key={item.id}
                            data-search-index={currentFlatIndex}
                            initial={hasQuery ? { opacity: 0, y: 4 } : false}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.02 }}
                            onClick={() => handleSelect(item)}
                            onMouseEnter={() => setSelectedIndex(currentFlatIndex)}
                            className={cn(
                              'group flex w-full items-center gap-3 rounded-lg px-3 py-2.5',
                              'text-left transition-all duration-150',
                              'hover:bg-accent/10',
                              'focus:outline-none cursor-pointer',
                              isSelected && 'bg-accent/10 ring-1 ring-primary/20',
                            )}
                          >
                            {/* Icon */}
                            <div
                              className={cn(
                                'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                                'bg-muted/50 transition-colors group-hover:bg-muted/80',
                                isSelected && 'bg-muted/80',
                                config.color,
                              )}
                            >
                              {cat === 'skill' && <Map className="h-3.5 w-3.5" />}
                              {cat === 'resource' && <BookOpen className="h-3.5 w-3.5" />}
                              {cat === 'project' && <FolderKanban className="h-3.5 w-3.5" />}
                              {cat === 'plan' && <GraduationCap className="h-3.5 w-3.5" />}
                              {cat === 'page' && <FileText className="h-3.5 w-3.5" />}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-foreground/90 truncate">
                                  {item.title}
                                </span>
                                {item.meta && cat === 'resource' && (
                                  <span
                                    className={cn(
                                      'inline-flex items-center rounded-full border px-1.5 py-px text-[10px] font-medium capitalize',
                                      RESOURCE_TYPE_STYLES[item.meta] ||
                                        'bg-muted/50 text-muted-foreground',
                                    )}
                                  >
                                    {item.meta}
                                  </span>
                                )}
                                {item.meta && cat === 'project' && (
                                  <span className="inline-flex items-center rounded-full bg-muted/50 px-1.5 py-px text-[10px] font-medium text-muted-foreground capitalize">
                                    {item.meta}
                                  </span>
                                )}
                                {item.meta && cat === 'skill' && (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground/50">
                                    <Clock className="h-2.5 w-2.5" />
                                    {item.meta}
                                  </span>
                                )}
                                {item.meta && cat === 'plan' && (
                                  <span
                                    className={cn(
                                      'inline-flex items-center rounded-full px-1.5 py-px text-[10px] font-medium capitalize',
                                      item.meta === 'current'
                                        ? 'bg-primary/10 text-primary'
                                        : item.meta === 'completed'
                                          ? 'bg-emerald-500/10 text-emerald-500'
                                          : 'bg-muted/50 text-muted-foreground',
                                    )}
                                  >
                                    {item.meta}
                                  </span>
                                )}
                              </div>
                              {item.subtitle && (
                                <p className="mt-0.5 text-xs text-muted-foreground/60 truncate max-w-[400px]">
                                  {item.subtitle}
                                </p>
                              )}
                            </div>

                            {/* Action hint */}
                            <div
                              className={cn(
                                'shrink-0 transition-opacity',
                                isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
                              )}
                            >
                              {item.url ? (
                                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/40" />
                              ) : (
                                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40" />
                              )}
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  );
                  return group;
                });
              })()}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-border/50 px-4 py-2.5 bg-muted/20">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <kbd className="flex h-5 min-w-[20px] items-center justify-center rounded border border-border/60 bg-muted/40 px-1 font-mono text-[10px] text-muted-foreground/50">
                  &uarr;
                </kbd>
                <kbd className="flex h-5 min-w-[20px] items-center justify-center rounded border border-border/60 bg-muted/40 px-1 font-mono text-[10px] text-muted-foreground/50">
                  &darr;
                </kbd>
                <span className="text-[11px] text-muted-foreground/40 ml-1">navigate</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="flex h-5 items-center justify-center rounded border border-border/60 bg-muted/40 px-1.5 font-mono text-[10px] text-muted-foreground/50">
                  &crarr;
                </kbd>
                <span className="text-[11px] text-muted-foreground/40 ml-1">open</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-primary/30" />
              <span className="text-[11px] text-muted-foreground/40">AI Search</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
