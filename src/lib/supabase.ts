import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  as string | undefined;
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnon) {
  console.warn(
    '[LoreKit] Missing Supabase env vars — auth features will be unavailable. ' +
    'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.',
  );
}

export const supabase = createClient(
  supabaseUrl  ?? 'https://placeholder.supabase.co',
  supabaseAnon ?? 'placeholder',
);
