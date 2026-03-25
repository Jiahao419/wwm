'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isAdminOrOwner: boolean;
  signInWithDiscord: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdminOrOwner: false,
  signInWithDiscord: async () => {},
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  useEffect(() => {
    let mounted = true;

    const fetchProfile = async (authUser: User) => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', authUser.id)
          .single<Profile>();

        if (!mounted) return;

        if (error && error.code === 'PGRST116') {
          const meta = authUser.user_metadata || {};
          const nickname = meta.full_name || meta.name || meta.custom_claims?.global_name || '新成员';
          const avatar_url = meta.avatar_url || meta.picture || null;
          const discord_username = meta.preferred_username || meta.user_name || null;
          const discord_id = meta.provider_id || null;

          const { data: newProfile, error: insertErr } = await supabase
            .from('profiles')
            .insert({
              user_id: authUser.id,
              nickname,
              avatar_url,
              discord_username,
              discord_id,
              identity: '成员',
              role: 'member',
              tags: [],
              is_public: true,
              node_color: '#9a8a6a',
              node_size: 'medium',
            })
            .select()
            .single<Profile>();

          if (!mounted) return;
          if (insertErr) {
            console.error('Auto-create profile error:', insertErr);
            setProfile(null);
          } else {
            setProfile(newProfile);
          }
        } else if (error) {
          console.error('fetchProfile error:', error);
          setProfile(null);
        } else {
          setProfile(data);
        }
      } catch (err) {
        console.error('fetchProfile exception:', err);
        if (mounted) setProfile(null);
      }
    };

    // Use getSession() first (local, fast) instead of getUser() (network call that can hang)
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;

        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          await fetchProfile(currentUser);
        }
      } catch (err) {
        console.error('Auth init error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    // Safety timeout — never stay loading more than 5 seconds
    const timeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('Auth loading timeout — forcing loading=false');
        setLoading(false);
      }
    }, 5000);

    init();

    // Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          await fetchProfile(currentUser);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signInWithDiscord = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const isAdminOrOwner = profile?.role === 'admin' || profile?.role === 'owner';

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdminOrOwner, signInWithDiscord, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
