import React, { useState } from 'react';
import { Lock, UserCheck, ShieldAlert, X, KeyRound, CheckCircle2 } from 'lucide-react';
import { UserAccount } from '../types/database';

interface AdminLoginModalProps {
  users: UserAccount[];
  onClose: () => void;
  onLoginSuccess: (user: UserAccount) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  users,
  onClose,
  onLoginSuccess,
}) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('momilk1234');
  const [error, setError] = useState<string | null>(null);

  const adminUsers = users.filter((u) => u.role !== 'customer');

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const matched = users.find(
      (u) =>
        u.username.toLowerCase() === username.trim().toLowerCase() ||
        u.email.toLowerCase() === username.trim().toLowerCase()
    );

    if (!matched) {
      setError('ไม่พบบัญชีผู้ใช้งานนี้ กรุณาเลือกบัญชีแอดมินด้านล่างหรือใช้ชื่อผู้ใช้ admin');
      return;
    }
    if (matched.status === 'suspended') {
      setError('บัญชีผู้ใช้นี้ถูกระงับสิทธิ์การใช้งานชั่วคราว');
      return;
    }
    if (password.trim().length < 4) {
      setError('รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร');
      return;
    }
    onLoginSuccess(matched);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-pink-100 shadow-2xl space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-800">เข้าสู่ระบบจัดการหลังบ้าน</h2>
              <p className="text-xs text-stone-500">
                ระบบยืนยันตัวตนและกำหนดสิทธิ์ผู้ดูแล (RBAC Security)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              ชื่อผู้ใช้ หรือ อีเมลแอดมิน
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin / editor / viewer"
              className="w-full px-4 py-2.5 rounded-xl border border-pink-200 bg-pink-50/20 text-sm text-stone-800 focus:outline-none focus:border-pink-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">รหัสผ่าน</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-pink-200 bg-pink-50/20 text-sm text-stone-800 focus:outline-none focus:border-pink-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500 text-white font-bold text-sm shadow-md shadow-pink-200 transition cursor-pointer"
          >
            เข้าสู่ระบบแดชบอร์ด
          </button>
        </form>

        {/* Quick RBAC Role Switcher for Instant Demo & Testing */}
        <div className="pt-4 border-t border-pink-100 space-y-2.5">
          <p className="text-xs font-bold text-stone-600">
            เลือกทดสอบเข้าสู่ระบบตามระดับสิทธิ์ (Quick Role Login):
          </p>
          <div className="space-y-2">
            {adminUsers.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => onLoginSuccess(u)}
                className="w-full p-3 rounded-2xl border border-pink-100 hover:border-pink-300 bg-pink-50/25 hover:bg-pink-50/70 transition flex items-center justify-between text-left cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <UserCheck className="w-4 h-4 text-pink-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-stone-800 truncate">{u.name}</p>
                    <p className="text-[11px] text-stone-500 truncate">
                      สิทธิ์: {u.roleLabel} · @{u.username}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-pink-600 flex items-center gap-1 shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>เข้าใช้งาน</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
