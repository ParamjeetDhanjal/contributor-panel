import React, { useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { CalendarIcon, Loader2, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface StoryFormProps {
  session: Session;
}

export default function StoryForm({ session }: StoryFormProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [date, setDate] = useState<Date>(new Date());
  const [headline, setHeadline] = useState('');
  const [storyId, setStoryId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!headline || !storyId || !date) return;

    try {
      setLoading(true);

      // Prepare story data
      const cleanStoryId = storyId.trim();
      
      // Check if story_id is numeric (required by your database schema)
      const isNumeric = /^\d+$/.test(cleanStoryId);
      if (!isNumeric && !cleanStoryId.startsWith('http')) {
        // If it's not a number and not a URL, warn the user
        // but we'll still try to send it as a number if possible
      }

      const { error } = await supabase.from('stories').insert({
        user_id: session.user.id,
        author_name: session.user.user_metadata.full_name,
        headline: headline.trim(),
        story_id: isNumeric ? parseFloat(cleanStoryId) : cleanStoryId,
        date: format(date, 'yyyy-MM-dd'),
        amount: 0
      });

      if (error) {
        console.error('Story Save Error:', error);
        if (error.code === '23503') {
          throw new Error('Your contributor profile is not fully registered in the database. Please try signing out and signing back in to refresh your profile.');
        }
        if (error.code === '22P02') {
          throw new Error('Invalid Story ID format. Please ensure you are entering a numeric ID or a valid URL.');
        }
        throw error;
      }

      setSuccess(true);
      setHeadline('');
      setStoryId('');
      setDate(new Date());
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      alert(error.message || 'Failed to save story');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="border border-border bg-card shadow-sm rounded-lg overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border">
          <CardTitle className="text-foreground text-xl font-semibold">Add</CardTitle>
          <CardDescription className="text-muted-foreground">Enter the details for your new story entry</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Author Name</label>
                <Input
                  value={session.user.user_metadata.full_name}
                  readOnly
                  className="border-border bg-muted/50 text-muted-foreground rounded-md h-10"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Select Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start border-border bg-background text-left font-normal text-foreground hover:bg-muted rounded-md h-10 shadow-none",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 border-border bg-card rounded-md shadow-lg" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(d) => d && setDate(d)}
                      initialFocus
                      className="p-3"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-foreground">Story Headline</label>
                <Input
                  placeholder="Enter a descriptive headline"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="border-border bg-background text-foreground placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-primary rounded-md h-10 shadow-none"
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-foreground">Story ID or Link</label>
                <Input
                  placeholder="Paste the URL or enter the unique identifier"
                  value={storyId}
                  onChange={(e) => setStoryId(e.target.value)}
                  className="border-border bg-background text-foreground placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-primary rounded-md h-10 shadow-none"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-4 pt-2">
              <AnimatePresence>
                {success && (
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-md border border-emerald-100"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    <span className="text-sm font-medium">Saved successfully</span>
                  </motion.div>
                )}
              </AnimatePresence>
              <Button
                type="submit"
                disabled={loading}
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md h-10 px-6 font-semibold shadow-sm transition-all"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Entry
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
