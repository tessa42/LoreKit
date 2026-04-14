'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Profile {
  nickname: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }

    const supabase = createClient();

    async function fetchProfile() {
      const { data } = await supabase
        .from('profiles')
        .select('nickname, display_name, avatar_url')
        .eq('id', user!.id)
        .single();
      setProfile(data ?? null);
    }

    fetchProfile();

    const channel = supabase
      .channel(`profile:${user.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
        (payload) => {
          const updated = payload.new as Partial<Profile>;
          setProfile((prev) => prev ? { ...prev, ...updated } : null);
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return { profile };
}
