'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useCredits() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!user) {
      setBalance(null);
      return;
    }

    const supabase = createClient();

    async function fetchBalance() {
      const { data } = await supabase
        .from('credit_wallets')
        .select('balance')
        .eq('user_id', user!.id)
        .single();
      setBalance(data?.balance ?? null);
    }

    fetchBalance();

    const channel = supabase
      .channel(`credits:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'credit_wallets', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const updated = payload.new as { balance?: number };
          if (typeof updated.balance === 'number') setBalance(updated.balance);
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return { balance };
}
