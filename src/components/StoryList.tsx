import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Filter, Loader2, ExternalLink, History } from 'lucide-react';
import { format, subDays, subWeeks, subMonths, isAfter, startOfDay } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface Story {
  id: string;
  headline: string;
  story_id: string;
  date: string;
  author_name: string;
  is_deleted: boolean;
}

interface StoryListProps {
  session: Session;
}

type FilterRange = 'all' | 'day' | 'week' | 'month';

export default function StoryList({ session }: StoryListProps) {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterRange>('all');

  const fetchStories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('user_id', session.user.id)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStories(data || []);
    } catch (error: any) {
      console.error('Error fetching stories:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();

    // Set up real-time subscription
    const channel = supabase
      .channel('stories-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stories',
          filter: `user_id=eq.${session.user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setStories((prev) => [payload.new as Story, ...prev]);
          } else if (payload.eventType === 'DELETE') {
            setStories((prev) => prev.filter((s) => s.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            setStories((prev) =>
              prev.map((s) => (s.id === payload.new.id ? (payload.new as Story) : s))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session.user.id]);

  const filteredStories = stories.filter((story) => {
    // story.date is YYYY-MM-DD, so we parse it as a local date at start of day
    const storyDate = startOfDay(new Date(story.date + 'T00:00:00'));
    const now = new Date();
    const todayStart = startOfDay(now);

    if (filter === 'day') {
      // Last Day: Show today and yesterday
      const yesterdayStart = subDays(todayStart, 1);
      return isAfter(storyDate, yesterdayStart) || storyDate.getTime() === yesterdayStart.getTime();
    }
    if (filter === 'week') {
      // Last Week: Show last 7 days including today
      const weekAgoStart = subDays(todayStart, 7);
      return isAfter(storyDate, weekAgoStart) || storyDate.getTime() === weekAgoStart.getTime();
    }
    if (filter === 'month') {
      // Last Month: Show last 30 days including today
      const monthAgoStart = subDays(todayStart, 30);
      return isAfter(storyDate, monthAgoStart) || storyDate.getTime() === monthAgoStart.getTime();
    }
    return true;
  });

  const getFilterLabel = () => {
    switch (filter) {
      case 'day': return 'Last 24 Hours';
      case 'week': return 'Last Week';
      case 'month': return 'Last Month';
      default: return 'All Time';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="border border-border bg-card shadow-sm rounded-lg overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border bg-muted/30">
          <div>
            <CardTitle className="text-foreground text-xl font-semibold">Story History</CardTitle>
            <CardDescription className="text-muted-foreground">Manage and track your submitted stories</CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="border-border bg-background text-foreground hover:bg-muted font-medium">
                <Filter className="mr-2 h-3.5 w-3.5" />
                {getFilterLabel()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setFilter('all')}>All Time</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('day')}>Last Day</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('week')}>Last Week</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('month')}>Last Month</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
            </div>
          ) : filteredStories.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-muted-foreground">
              <History className="h-12 w-12 mb-4 opacity-10" />
              <p className="text-sm font-medium">No stories found for this period</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="border-b border-border hover:bg-transparent">
                    <TableHead className="w-[140px] text-foreground font-semibold py-4">Date</TableHead>
                    <TableHead className="text-foreground font-semibold py-4">Headline</TableHead>
                    <TableHead className="text-foreground font-semibold py-4">Story ID / URL</TableHead>
                    <TableHead className="text-foreground font-semibold py-4">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {filteredStories.map((story) => (
                      <TableRow
                        key={story.id}
                        className={cn(
                          "border-b border-border hover:bg-muted/20 transition-colors group",
                          story.is_deleted && "opacity-60 bg-muted/10"
                        )}
                      >
                        <TableCell className="font-medium text-foreground py-4">
                          {format(new Date(story.date), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className={cn(
                          "text-foreground font-medium py-4",
                          story.is_deleted && "line-through text-muted-foreground"
                        )}>
                          {story.headline}
                        </TableCell>
                        <TableCell className="text-foreground py-4">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "max-w-[200px] truncate font-mono text-xs px-2 py-1 rounded border",
                              story.is_deleted 
                                ? "bg-muted text-muted-foreground border-border" 
                                : "bg-primary/5 text-primary font-medium border-primary/10"
                            )}>
                              {story.story_id}
                            </span>
                            {story.story_id && String(story.story_id).startsWith('http') && !story.is_deleted && (
                              <a
                                href={story.story_id}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:text-primary/80 transition-colors"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          {story.is_deleted ? (
                            <span className="inline-flex items-center rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive">
                              Deleted
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600">
                              Active
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
