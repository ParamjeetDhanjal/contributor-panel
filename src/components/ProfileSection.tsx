import { Session } from '@supabase/supabase-js';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Mail, User, Calendar, Shield, IndianRupee } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface ProfileSectionProps {
  session: Session;
}

export default function ProfileSection({ session }: ProfileSectionProps) {
  const user = session.user;
  const metadata = user.user_metadata;
  const [pricing, setPricing] = useState<number | null>(null);

  useEffect(() => {
    const fetchPricing = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('pricing')
        .eq('id', user.id)
        .single();
      
      if (!error && data) {
        setPricing(data.pricing);
      }
    };

    fetchPricing();
  }, [user.id]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="border border-border bg-card shadow-sm rounded-lg overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border">
          <CardTitle className="text-foreground text-xl font-semibold">Author Profile</CardTitle>
          <CardDescription className="text-muted-foreground">Your verified contributor information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 pt-8">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div className="h-20 w-20 overflow-hidden rounded-full border border-border bg-muted shadow-sm">
                <img
                  src={metadata.avatar_url}
                  alt={metadata.full_name}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-foreground">{metadata.full_name}</h3>
              <p className="text-muted-foreground font-medium">{user.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex items-center space-x-3 rounded-md border border-border bg-muted/20 p-4">
              <User className="h-5 w-5 text-primary" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Author Name</p>
                <p className="text-sm font-semibold text-foreground">{metadata.full_name}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 rounded-md border border-border bg-muted/20 p-4">
              <Mail className="h-5 w-5 text-primary" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Email Address</p>
                <p className="text-sm font-semibold text-foreground">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 rounded-md border border-border bg-muted/20 p-4">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Joined Date</p>
                <p className="text-sm font-semibold text-foreground">{format(new Date(user.created_at), 'MMMM d, yyyy')}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 rounded-md border border-border bg-muted/20 p-4">
              <Shield className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Account Status</p>
                <p className="text-sm font-semibold text-emerald-600">Verified Contributor</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 rounded-md border border-emerald-500/20 bg-emerald-500/5 p-4">
              <IndianRupee className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Current Pay</p>
                <p className="text-sm font-bold text-emerald-600">₹{(pricing || 0).toFixed(2)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
