import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  throw new Error('.env에 VITE_SUPABASE_URL과 VITE_SUPABASE_PUBLISHABLE_KEY를 채워 주세요.');
}

export const supabase = createClient(url, key);
