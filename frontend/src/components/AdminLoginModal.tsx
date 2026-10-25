import React, { useState } from 'react';
import { Lock, ShieldAlert, X, KeyRound, LoaderCircle } from 'lucide-react';
import type { UserAccount, AdminRole } from '../types/database';
import { DEFAULT_MASCOT_SVG, ROLE_PERMISSIONS_MAP } from '../data/initialDatabase';
import { assertSupabaseConfigured, supabase } from '../lib/supabase';

interface AdminLoginModalProps {
  onClose: () => void;
  onLoginSuccess: (user: UserAccount) => void;
}

const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: 'ผู้ดูแลระบบสูงสุด (Super Admin)',
  editor: 'แอดมินดูแลร้าน (Store Editor)',
  viewer: 'นักวิเคราะห์สถิติ (Analytics Viewer)',
  customer: 'ลูกค้า',
};

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  onClose,
  onLoginSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError(null);
    setIsSubmitting(true);

    try {
      assertSupabaseConfigured();
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError || !authData.user) {
        throw new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id,display_name,username,role,status')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      const allowedRoles: AdminRole[] = ['super_admin', 'editor', 'viewer'];
      if (!profile || !allowedRoles.includes(profile.role as AdminRole)) {
        await supabase.auth.signOut();
        throw new Error('บัญชีนี้ไม่มีสิทธิ์เข้าใช้งานหลังบ้าน กรุณาติดต่อผู้ดูแลระบบ');
      }

      if (profile.status !== 'active') {
        await supabase.auth.signOut();
        throw new Error('บัญชีนี้ถูกระงับการใช้งาน');
      }

      const role = profile.role as AdminRole;
      const user: UserAccount = {
        id: profile.id,
        name: profile.display_name || authData.user.email || 'Admin',
        username: profile.username || (authData.user.email || '').split('@')[0],
        email: authData.user.email || '',
        role,
        roleLabel: ROLE_LABELS[role],
        avatarUrl: DEFAULT_MASCOT_SVG,
        status: 'active',
        totalReviews: 0,
        lastActive: new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }),
        permissions: ROLE_PERMISSIONS_MAP[role].permissions,
      };

      onLoginSuccess(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-login-title"
        className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-pink-100 shadow-2xl space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 id="admin-login-title" className="text-lg font-bold text-stone-800">เข้าสู่ระบบจัดการหลังบ้าน</h2>
              <p className="text-xs text-stone-500">ยืนยันตัวตนด้วยบัญชี Supabase Auth</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่าง"
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div role="alert" className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label htmlFor="admin-email" className="block text-xs font-bold text-stone-700 mb-1.5">
              อีเมลแอดมิน
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="  "
              className="w-full px-4 py-2.5 rounded-xl border border-pink-200 bg-pink-50/20 text-sm text-stone-800 focus:outline-none focus:border-pink-500"
            />
          </div>

          <div>
            <label htmlFor="admin-password" className="block text-xs font-bold text-stone-700 mb-1.5">รหัสผ่าน</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="รหัสผ่านบัญชี Supabase"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-pink-200 bg-pink-50/20 text-sm text-stone-800 focus:outline-none focus:border-pink-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500 disabled:opacity-60 text-white font-bold text-sm shadow-md shadow-pink-200 transition cursor-pointer flex items-center justify-center gap-2"
          >
            {isSubmitting && <LoaderCircle className="w-4 h-4 animate-spin" />}
            {isSubmitting ? 'กำลังตรวจสอบบัญชี…' : 'เข้าสู่ระบบแดชบอร์ด'}
          </button>
        </form>

        <p className="text-[11px] leading-relaxed text-stone-500">
          เข้าสู่ระบบได้เฉพาะบัญชีที่สร้างใน Supabase Authentication และได้รับสิทธิ์ผู้ดูแลแล้ว ไม่มีบัญชีทดลองหรือปุ่มข้ามการเข้าสู่ระบบ
        </p>
      </div>
    </div>
  );
};
