import { assertSupabaseConfigured, supabase } from './supabase';

export type ReviewStatus = 'approved' | 'pending' | 'hidden';

export interface SupabaseReview {
  id: string;
  customer_name: string;
  customer_handle: string | null;
  rating: number;
  service_type: 'good' | 'bad';
  comment: string;
  proof_image_url: string | null;
  likes: number;
  status: ReviewStatus;
  is_pinned: boolean;
  admin_reply: string | null;
  verified_slip: boolean;
  created_at: string;
}

export interface SupabaseTrack {
  id: string;
  title: string;
  storage_path: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export async function listPublicReviews(): Promise<SupabaseReview[]> {
  assertSupabaseConfigured();
  const { data, error } = await supabase
    .from('reviews')
    .select('id,customer_name,customer_handle,rating,service_type,comment,proof_image_url,likes,status,is_pinned,admin_reply,verified_slip,created_at')
    .eq('status', 'approved')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as SupabaseReview[];
}

export async function listAdminReviews(): Promise<SupabaseReview[]> {
  assertSupabaseConfigured();
  const { data, error } = await supabase
    .from('reviews')
    .select('id,customer_name,customer_handle,rating,service_type,comment,proof_image_url,likes,status,is_pinned,admin_reply,verified_slip,created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as SupabaseReview[];
}

export async function submitReview(input: {
  customer_name: string;
  customer_handle?: string;
  rating: number;
  service_type: 'good' | 'bad';
  comment: string;
  proof_image_url?: string;
}): Promise<SupabaseReview> {
  assertSupabaseConfigured();

  // Do not request the inserted row back: anonymous users are intentionally
  // unable to SELECT pending reviews. Generate the id/timestamp client-side,
  // insert once, and return the submitted representation only after success.
  const review: SupabaseReview = {
    id: crypto.randomUUID(),
    customer_name: input.customer_name.trim(),
    customer_handle: input.customer_handle?.trim() || null,
    rating: input.rating,
    service_type: input.service_type,
    comment: input.comment.trim(),
    proof_image_url: input.proof_image_url || null,
    status: 'approved',
    likes: 0,
    is_pinned: false,
    admin_reply: null,
    verified_slip: false,
    created_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('reviews').insert(review);
  if (error) throw error;
  return review;
}

export async function listPublicTracks(): Promise<Array<SupabaseTrack & { publicUrl: string }>> {
  assertSupabaseConfigured();
  const { data, error } = await supabase
    .from('tracks')
    .select('id,title,storage_path,is_active,sort_order,created_at')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (error) throw error;

  return (data ?? []).map((track) => {
    const { data: urlData } = supabase.storage.from('music').getPublicUrl(track.storage_path);
    return { ...(track as SupabaseTrack), publicUrl: urlData.publicUrl };
  });
}

export async function uploadPublicTrack(file: File, title: string, sortOrder = 0) {
  assertSupabaseConfigured();
  if (!file.type.startsWith('audio/')) throw new Error('กรุณาเลือกไฟล์เสียง');
  if (file.size > 50 * 1024 * 1024) throw new Error('ไฟล์เพลงต้องมีขนาดไม่เกิน 50 MB');

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `${crypto.randomUUID()}-${safeName}`;
  const { error: uploadError } = await supabase.storage.from('music').upload(storagePath, file, {
    contentType: file.type || 'audio/mpeg',
    upsert: false,
  });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from('tracks')
    .insert({ title: title.trim() || file.name, storage_path: storagePath, sort_order: sortOrder, is_active: true })
    .select()
    .single();

  if (error) {
    // Roll back the file upload if the metadata insert fails.
    await supabase.storage.from('music').remove([storagePath]);
    throw error;
  }

  const { data: publicData } = supabase.storage.from('music').getPublicUrl(storagePath);
  return { ...(data as SupabaseTrack), publicUrl: publicData.publicUrl };
}

export async function getStoreSettings(): Promise<Record<string, unknown> | null> {
  assertSupabaseConfigured();
  const { data, error } = await supabase
    .from('store_settings')
    .select('settings')
    .eq('id', true)
    .maybeSingle();
  if (error) throw error;
  return (data?.settings as Record<string, unknown> | undefined) ?? null;
}

export async function saveStoreSettings(settings: Record<string, unknown>) {
  assertSupabaseConfigured();
  const { error } = await supabase
    .from('store_settings')
    .upsert({ id: true, settings, updated_at: new Date().toISOString() }, { onConflict: 'id' });
  if (error) throw error;
}


/** Persist admin moderation changes in Supabase. RLS restricts updates to admins. */
export async function updatePublicReview(
  id: string,
  patch: Partial<Pick<SupabaseReview, 'status' | 'is_pinned' | 'admin_reply'>>,
) {
  assertSupabaseConfigured();
  const { error } = await supabase.from('reviews').update(patch).eq('id', id);
  if (error) throw error;
}


/** Upload storefront images/audio to Supabase Storage and return persistent public URLs. */
export async function uploadStoreAsset(file: File, kind: 'branding' | 'music'): Promise<string> {
  assertSupabaseConfigured();
  if (kind === 'music' && !file.type.startsWith('audio/')) throw new Error('กรุณาเลือกไฟล์เสียง');
  if (kind === 'branding' && !file.type.startsWith('image/')) throw new Error('กรุณาเลือกไฟล์รูปภาพ');
  const bucket = kind === 'music' ? 'music' : 'store-assets';
  const safeName = file.name.normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'upload';
  const path = `${kind}/${crypto.randomUUID()}-${safeName}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: false,
    contentType: file.type || undefined,
    cacheControl: '3600',
  });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
