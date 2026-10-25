import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Keep the storefront able to render before environment variables are configured.
  // Database calls will report a clear setup error rather than exposing any secret.
  console.warn(
    '[MOMILK] Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your local/Vercel environment.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://rqgmusootopwdaqnmsrs.supabase.co',
  supabaseAnonKey || 'sb_publishable_LIbjRurOFPfwMh9ibBBaTQ_i_o9tj2Y',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

export function assertSupabaseConfigured(): void {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'ยังไม่ได้ตั้งค่า Supabase: กรุณากำหนด VITE_SUPABASE_URL และ VITE_SUPABASE_ANON_KEY'
    );
  }
}
