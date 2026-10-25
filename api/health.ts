import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  const configured = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
  res.setHeader('Cache-Control', 'no-store');
  return res.status(configured ? 200 : 503).json({
    ok: configured,
    service: 'momilk-shop-api',
    persistence: 'supabase',
    configured,
    message: configured ? 'Backend environment is configured.' : 'Set SUPABASE_URL and SUPABASE_ANON_KEY in Vercel server-side environment variables.',
  });
}
