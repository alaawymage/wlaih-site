// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

// خلّي الخطأ واضح لو المتغيرات ناقصة (عشان ما يصير فشل غامض)
if (!url || !anon) {
  throw new Error(
    'Missing Supabase env vars: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY'
  );
}

export const supabase = createClient(url, anon);
