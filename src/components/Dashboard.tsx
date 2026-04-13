import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Button } from './ui/button';
import { LogOut, User, PlusCircle, History, LayoutDashboard, IndianRupee } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useEffect, useState } from 'react';
import StoryForm from './StoryForm';
import StoryList from './StoryList';
import ProfileSection from './ProfileSection';
import ErrorBoundary from './ErrorBoundary';
import { motion } from 'motion/react';

interface DashboardProps {
  session: Session;
}

export default function Dashboard({ session }: DashboardProps) {
  const [pricing, setPricing] = useState<number | null>(null);

  useEffect(() => {
    const fetchPricing = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('pricing')
        .eq('id', session.user.id)
        .single();
      
      if (!error && data) {
        setPricing(data.pricing);
      }
    };

    fetchPricing();
  }, [session.user.id]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/10">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
              <LayoutDashboard className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">Contributor</span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-600 px-3 py-1.5 rounded-full border border-emerald-500/20">
              <IndianRupee className="h-4 w-4" />
              <span className="text-sm font-bold">Pay: ₹{(pricing || 0).toFixed(2)}</span>
            </div>
            <div className="hidden sm:flex flex-col items-end mr-2">
              <span className="text-sm font-semibold">{session.user.user_metadata.full_name}</span>
              <span className="text-xs text-muted-foreground">{session.user.email}</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/5 font-medium"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4 sm:px-6 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage your stories and contributor profile</p>
        </div>

        <Tabs defaultValue="stories" className="space-y-6">
          <TabsList className="bg-muted p-1 rounded-md border border-border inline-flex h-11">
            <TabsTrigger 
              value="stories" 
              className="rounded-sm px-6 py-2 text-sm font-semibold data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="rounded-sm px-6 py-2 text-sm font-semibold data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
            >
              <History className="mr-2 h-4 w-4" />
              History
            </TabsTrigger>
            <TabsTrigger 
              value="profile" 
              className="rounded-sm px-6 py-2 text-sm font-semibold data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
            >
              <User className="mr-2 h-4 w-4" />
              Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stories" className="mt-0 focus-visible:outline-none">
            <ErrorBoundary>
              <StoryForm session={session} />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="history" className="mt-0 focus-visible:outline-none">
            <ErrorBoundary>
              <StoryList session={session} />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="profile" className="mt-0 focus-visible:outline-none">
            <ErrorBoundary>
              <ProfileSection session={session} />
            </ErrorBoundary>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
