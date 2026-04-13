/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import { Loader2 } from 'lucide-react';
import { Routes, Route, Navigate } from 'react-router-dom';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async (currentSession: Session | null) => {
      if (!currentSession) {
        setSession(null);
        setLoading(false);
        return;
      }

      try {
        // 1. Check if a profile already exists for this email (to handle ID mismatches)
        const { data: existingProfile, error: profileFetchError } = await supabase
          .from('profiles')
          .select('id, email')
          .ilike('email', currentSession.user.email)
          .maybeSingle();

        if (profileFetchError) throw profileFetchError;

        if (existingProfile) {
          if (existingProfile.id !== currentSession.user.id) {
            // CRITICAL: Email exists but with a different ID (Identity Conflict)
            // We try to update the ID to match the new auth user
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ id: currentSession.user.id })
              .eq('id', existingProfile.id);

            if (updateError) {
              console.error('Identity Resolution Failed:', updateError);
              setAuthError(`Identity Conflict: An old profile exists for ${currentSession.user.email} with a different ID. Please contact an administrator to clear your old profile.`);
              await supabase.auth.signOut();
              setSession(null);
              setLoading(false);
              return;
            }
          }
          // Profile is now synced or already matched
          setSession(currentSession);
          setAuthError(null);
        } else {
          // 2. No profile exists - check whitelist
          const { data: whitelisted, error: whitelistError } = await supabase
            .from('whitelist')
            .select('email')
            .ilike('email', currentSession.user.email)
            .maybeSingle();

          if (whitelistError) throw whitelistError;

          if (whitelisted) {
            // Create new profile for whitelisted user
            const { error: createError } = await supabase.from('profiles').insert({
              id: currentSession.user.id,
              email: currentSession.user.email,
              author_name: currentSession.user.user_metadata.full_name,
              avatar_url: currentSession.user.user_metadata.avatar_url,
            });

            if (createError) {
              console.error('Profile Creation Failed:', createError);
              setAuthError(`Profile Setup Failed: ${createError.message}. Please try again or contact support.`);
              await supabase.auth.signOut();
              setSession(null);
            } else {
              setSession(currentSession);
              setAuthError(null);
            }
          } else {
            // Not whitelisted
            await supabase.auth.signOut();
            setAuthError('Access Denied: Your email is not registered in our contributor list.');
            setSession(null);
          }
        }
      } catch (err: any) {
        console.error('Auth System Error:', err);
        setAuthError(`System Error: ${err.message || 'An unexpected error occurred during login.'}`);
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      checkUser(session);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (_event === 'SIGNED_IN') {
        checkUser(session);
      } else if (_event === 'SIGNED_OUT') {
        setSession(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);
  
if (loading) {
  return (
    <div className="flex h-screen items-center justify-center bg-zinc-950 text-white">
      <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
    </div>
  );
}

return (
  <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
    <Routes>
      <Route
        path="/"
        element={
          !session ? (
            <Auth error={authError} />
          ) : (
            <Navigate to="/dashboard" />
          )
        }
      />

      <Route
        path="/dashboard"
        element={
          session ? (
            <Dashboard session={session} />
          ) : (
            <Navigate to="/" />
          )
        }
      />
    </Routes>
  </div>
);
}
