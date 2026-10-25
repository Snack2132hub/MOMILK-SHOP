import React, { useState, useRef, useEffect } from 'react';
import {
  Edit3,
  Star,
  Mail,
  BarChart2,
  Settings,
  ExternalLink,
  Upload,
  Trash2,
  Eye,
  Check,
  RotateCcw,
  Users,
  Shield,
  MessageSquareReply,
  Pin,
  CheckCircle,
  EyeOff,
  LogOut,
  Plus,
  Lock,
  Sparkles,
  X,
  Music,
  Volume2,
  VolumeX,
  Play,
  Pause,
  FileAudio,
} from 'lucide-react';
import {
  AdminRole,
  DatabaseSchema,
  ReviewItem,
  StoreSettings,
  UserAccount,
} from '../types/database';
import {
  DEFAULT_BANNER_SVG,
  DEFAULT_LOGO_SVG,
  DEFAULT_MASCOT_SVG,
  INITIAL_DATABASE,
  ROLE_PERMISSIONS_MAP,
} from '../data/initialDatabase';
import { RealtimeAnalyticsView } from './RealtimeAnalyticsView';
import { DeploymentAndDbGuide } from './DeploymentAndDbGuide';
import { resolveContactUrl } from '../utils/urlHelper';
import { uploadStoreAsset } from '../lib/supabaseData';

export type AdminTabId =
  | 'customizer'
  | 'reviews'
  | 'users'
  | 'contacts'
  | 'analytics'
  | 'settings';

interface AdminDashboardViewProps {
  db: DatabaseSchema;
  currentUser: UserAccount;
  onSwitchToStorefront: () => void;
  onLogout: () => void;
  onSwitchUserRole: (user: UserAccount) => void;
  onSaveStoreSettings: (newSettings: StoreSettings) => void;
  onUpdateReview: (reviewId: string, patch: Partial<ReviewItem>) => void;
  onDeleteReview: (reviewId: string) => void;
  onAddUser: (newUser: Omit<UserAccount, 'id' | 'lastActive' | 'totalReviews' | 'permissions'>) => void;
  onUpdateUserRole: (userId: string, newRole: AdminRole) => void;
  onToggleUserStatus: (userId: string) => void;
  onSimulateRealtimeEvent: () => void;
  onResetDatabase: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  db,
  currentUser,
  onSwitchToStorefront,
  onLogout,
  onSwitchUserRole,
  onSaveStoreSettings,
  onUpdateReview,
  onDeleteReview,
  onAddUser,
  onUpdateUserRole,
  onToggleUserStatus,
  onSimulateRealtimeEvent,
  onResetDatabase,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTabId>('customizer');

  // Local draft state for Store Customizer (matching Image 3 & Image 4)
  const [draftSettings, setDraftSettings] = useState<StoreSettings>(db.storeSettings);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // File input refs for branding assets
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const bannerInputRef = useRef<HTMLInputElement | null>(null);
  const bgmFileInputRef = useRef<HTMLInputElement | null>(null);

  // Audio BGM player states for Admin Preview
  const adminAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isAdminPlayingBgm, setIsAdminPlayingBgm] = useState(false);
  const [bgmFileSize, setBgmFileSize] = useState<string | null>(null);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (adminAudioRef.current) {
        adminAudioRef.current.pause();
        adminAudioRef.current = null;
      }
    };
  }, []);

  // Review management states
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState('');
  const [adminReviewFilter, setAdminReviewFilter] = useState<'all' | 'approved' | 'pending' | 'hidden'>('all');

  // New user form state (in Users & RBAC tab)
  const [newUserName, setNewUserName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<AdminRole>('editor');

  const updateDraft = <K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) => {
    setDraftSettings((prev) => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
  };

  const handleAssetUpload = async (
    field: 'logoUrl' | 'avatarUrl' | 'bannerUrl',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setSaveToast('กำลังอัปโหลดรูปไปยัง Supabase Storage...');
      const publicUrl = await uploadStoreAsset(file, 'branding');
      updateDraft(field, publicUrl);
      setSaveToast('อัปโหลดรูปสำเร็จ กดบันทึกการเปลี่ยนแปลงเพื่อบันทึกลงฐานข้อมูล');
    } catch (error) {
      console.error('[MOMILK] Image upload failed:', error);
      setSaveToast('อัปโหลดรูปไม่สำเร็จ กรุณาตรวจสอบสิทธิ์ Storage ใน Supabase');
    }
  };

  const handleBgmFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    const sizeStr = file.size > 1024 * 1024 ? `${sizeMb} MB` : `${Math.round(file.size / 1024)} KB`;
    setBgmFileSize(sizeStr);
    setSaveToast('กำลังอัปโหลดเพลงไปยัง Supabase Storage...');
    try {
      const publicUrl = await uploadStoreAsset(file, 'music');
      setDraftSettings((prev) => ({
        ...prev,
        bgmAudioUrl: publicUrl,
        bgmAudioFileName: file.name,
        bgmAudioName: file.name.replace(/\.[^/.]+$/, ''),
        enableBgm: true,
      }));
      setHasUnsavedChanges(true);
      setSaveToast(`อัปโหลดไฟล์เพลง "${file.name}" สำเร็จ (${sizeStr}) กดบันทึกการเปลี่ยนแปลงเพื่อบันทึก`);
      if (adminAudioRef.current) {
        adminAudioRef.current.pause();
        setIsAdminPlayingBgm(false);
        adminAudioRef.current = null;
      }
    } catch (error) {
      console.error('[MOMILK] Audio upload failed:', error);
      setSaveToast('อัปโหลดเพลงไม่สำเร็จ กรุณาตรวจสอบสิทธิ์ Storage ใน Supabase');
    }
  };

  const handleToggleAdminBgm = () => {
    if (!draftSettings.bgmAudioUrl) return;

    if (isAdminPlayingBgm) {
      if (adminAudioRef.current) {
        adminAudioRef.current.pause();
      }
      setIsAdminPlayingBgm(false);
    } else {
      try {
        if (!adminAudioRef.current || adminAudioRef.current.src !== draftSettings.bgmAudioUrl) {
          const audio = new Audio(draftSettings.bgmAudioUrl);
          audio.loop = true;
          audio.volume = 0.5;
          audio.onended = () => setIsAdminPlayingBgm(false);
          adminAudioRef.current = audio;
        }
        adminAudioRef.current
          .play()
          .then(() => setIsAdminPlayingBgm(true))
          .catch(() => {
            setIsAdminPlayingBgm(false);
          });
      } catch {
        setIsAdminPlayingBgm(false);
      }
    }
  };

  const handleClearBgm = () => {
    if (adminAudioRef.current) {
      adminAudioRef.current.pause();
      setIsAdminPlayingBgm(false);
      adminAudioRef.current = null;
    }
    setBgmFileSize(null);
    setDraftSettings((prev) => ({
      ...prev,
      bgmAudioUrl: '',
      bgmAudioFileName: '',
      bgmAudioName: '',
      enableBgm: false,
    }));
    setHasUnsavedChanges(true);
    setSaveToast('ลบไฟล์เพลงประกอบเรียบร้อยแล้ว');
    setTimeout(() => setSaveToast(null), 2500);
  };

  const handleSelectPresetBgm = (name: string, url: string, fileName: string) => {
    if (adminAudioRef.current) {
      adminAudioRef.current.pause();
      setIsAdminPlayingBgm(false);
      adminAudioRef.current = null;
    }
    setBgmFileSize(null);
    setDraftSettings((prev) => ({
      ...prev,
      bgmAudioUrl: url,
      bgmAudioFileName: fileName,
      bgmAudioName: name,
      enableBgm: true,
    }));
    setHasUnsavedChanges(true);
    setSaveToast(`เลือกเพลงพรีเซ็ต "${name}" แล้ว`);
    setTimeout(() => setSaveToast(null), 3000);
  };

  const applyColorPalette = (
    name: string,
    primary: string,
    bg: string,
    card: string,
    text: string
  ) => {
    setDraftSettings((prev) => ({
      ...prev,
      primaryColor: primary,
      bgColor: bg,
      cardColor: card,
      textColor: text,
    }));
    setHasUnsavedChanges(true);
    setSaveToast(`เลือกชุดสี "${name}" แล้ว กดบันทึกการเปลี่ยนแปลงเพื่อใช้งานจริง`);
    setTimeout(() => setSaveToast(null), 3500);
  };

  const handleResetCustomizer = () => {
    setDraftSettings(INITIAL_DATABASE.storeSettings);
    setHasUnsavedChanges(true);
    setSaveToast('คืนค่าเริ่มต้นในฟอร์มแล้ว กดบันทึกการเปลี่ยนแปลงเพื่อยืนยัน');
    setTimeout(() => setSaveToast(null), 3500);
  };

  const handleSaveCustomizer = () => {
    if (!currentUser.permissions.canEditStore) {
      setSaveToast('สิทธิ์ของคุณ (Viewer) เป็นแบบอ่านอย่างเดียว ไม่สามารถบันทึกการแก้ไขหน้าร้านได้');
      setTimeout(() => setSaveToast(null), 4000);
      return;
    }
    const nowStr = new Date().toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const finalSettings: StoreSettings = {
      ...draftSettings,
      updatedAt: `วันนี้ ${nowStr} น.`,
    };
    onSaveStoreSettings(finalSettings);
    setDraftSettings(finalSettings);
    setHasUnsavedChanges(false);
    setSaveToast('บันทึกการเปลี่ยนแปลงเรียบร้อยแล้ว! ข้อมูลอัปเดตไปยังหน้าร้านทันที 💖');
    setTimeout(() => setSaveToast(null), 4000);
  };

  const handleCreateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUsername.trim() || !newUserEmail.trim()) return;
    onAddUser({
      name: newUserName.trim(),
      username: newUsername.trim(),
      email: newUserEmail.trim(),
      role: newUserRole,
      roleLabel: ROLE_PERMISSIONS_MAP[newUserRole].label,
      avatarUrl: DEFAULT_MASCOT_SVG,
      status: 'active',
    });
    setNewUserName('');
    setNewUsername('');
    setNewUserEmail('');
    setSaveToast('เพิ่มบัญชีผู้ใช้งานและกำหนดสิทธิ์ RBAC สำเร็จแล้ว');
    setTimeout(() => setSaveToast(null), 3500);
  };

  const filteredAdminReviews = db.reviews.filter((r) => {
    if (adminReviewFilter === 'all') return true;
    return r.status === adminReviewFilter;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF0F3] text-[#4A3E3D] antialiased">
      {/* Top Navigation Bar (Matches Image 3 & Image 4) */}
      <header className="bg-white/90 backdrop-blur-md border-b border-pink-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Brand Lockup */}
          <div className="flex items-center space-x-3.5 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-pink-50 p-1.5 border border-pink-200 flex items-center justify-center overflow-hidden shadow-2xs shrink-0">
              <img
                alt="MOMILK SHOP Logo"
                className="w-full h-full object-contain"
                src={draftSettings.logoUrl}
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base sm:text-lg text-stone-800 tracking-tight truncate">
                  {draftSettings.storeName}
                </span>
                <span className="text-xs text-pink-600 font-semibold whitespace-nowrap">
                  · หลังบ้าน
                </span>
              </div>
              <p className="text-xs text-stone-500 truncate">
                ระบบจัดการร้านค้า ฐานข้อมูล และวิเคราะห์ข้อมูลเรียลไทม์
              </p>
            </div>
          </div>

          {/* Right Action Items & Admin Profile */}
          <div className="flex items-center space-x-3 shrink-0">
            <button
              type="button"
              onClick={onSwitchToStorefront}
              className="inline-flex items-center space-x-2 bg-pink-50 hover:bg-pink-100 text-pink-600 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition border border-pink-200 cursor-pointer whitespace-nowrap"
            >
              <ExternalLink className="w-4 h-4" />
              <span>ดูหน้าเว็บไซต์จริง</span>
            </button>

            <div className="h-6 w-px bg-pink-100 hidden sm:block" />

            {/* Role Selector Dropdown for instant RBAC permission testing */}
            <div className="hidden md:flex items-center space-x-2.5 pl-1">
              <img
                alt={currentUser.name}
                className="w-9 h-9 rounded-full border-2 border-pink-300 object-cover bg-white"
                src={currentUser.avatarUrl}
                referrerPolicy="no-referrer"
              />
              <div className="text-left">
                <p className="text-xs font-bold text-stone-800 leading-none">{currentUser.name}</p>
                <p className="text-[11px] text-pink-600 font-medium mt-1">
                  {currentUser.roleLabel}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onLogout}
              title="ออกจากระบบแอดมิน"
              className="p-2 rounded-xl border border-stone-200 hover:border-rose-200 hover:bg-rose-50 text-stone-500 hover:text-rose-600 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Toast Notification Banner */}
      {saveToast && (
        <div className="fixed top-24 right-6 z-50 bg-stone-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-pink-400/30 text-xs sm:text-sm font-medium flex items-center gap-2.5 max-w-md">
          <Sparkles className="w-4 h-4 text-pink-400 shrink-0" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Main Container Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full flex flex-col lg:flex-row gap-8">
        {/* LEFT SIDEBAR NAVIGATION */}
        <aside className="w-full lg:w-64 shrink-0">
          <div className="bg-white rounded-3xl p-4 border border-pink-100 sticky top-28 space-y-6">
            <nav aria-label="Sidebar Navigation" className="space-y-1.5">
              <button
                type="button"
                onClick={() => setActiveTab('customizer')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-sm font-semibold transition cursor-pointer ${
                  activeTab === 'customizer'
                    ? 'bg-gradient-to-r from-pink-500 to-pink-400 text-white shadow-sm shadow-pink-200'
                    : 'text-stone-600 hover:bg-pink-50 hover:text-pink-600'
                }`}
              >
                <Edit3 className="w-4 h-4 shrink-0" />
                <span>ปรับแต่งหน้าเว็บ</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('reviews')}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition cursor-pointer ${
                  activeTab === 'reviews'
                    ? 'bg-gradient-to-r from-pink-500 to-pink-400 text-white shadow-sm shadow-pink-200'
                    : 'text-stone-600 hover:bg-pink-50 hover:text-pink-600'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Star className="w-4 h-4 shrink-0" />
                  <span>จัดการรีวิวลูกค้า</span>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-bold tabular-nums ${
                    activeTab === 'reviews'
                      ? 'bg-white/25 text-white'
                      : 'bg-pink-100 text-pink-600'
                  }`}
                >
                  {db.reviews.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition cursor-pointer ${
                  activeTab === 'users'
                    ? 'bg-gradient-to-r from-pink-500 to-pink-400 text-white shadow-sm shadow-pink-200'
                    : 'text-stone-600 hover:bg-pink-50 hover:text-pink-600'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Users className="w-4 h-4 shrink-0" />
                  <span>ผู้ใช้งาน & สิทธิ์แอดมิน</span>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-bold tabular-nums ${
                    activeTab === 'users'
                      ? 'bg-white/25 text-white'
                      : 'bg-pink-100 text-pink-600'
                  }`}
                >
                  {db.users.length}
                </span>
              </button>

              

              <button
                type="button"
                onClick={() => setActiveTab('analytics')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-sm font-semibold transition cursor-pointer ${
                  activeTab === 'analytics'
                    ? 'bg-gradient-to-r from-pink-500 to-pink-400 text-white shadow-sm shadow-pink-200'
                    : 'text-stone-600 hover:bg-pink-50 hover:text-pink-600'
                }`}
              >
                <BarChart2 className="w-4 h-4 shrink-0" />
                <span>สถิติและยอดชม</span>
              </button>

              
            </nav>

            {/* Quick Help Card (Matches Image 3 & Image 4) */}
            <div className="bg-pink-50/70 border border-pink-200/60 rounded-2xl p-4 text-center space-y-2">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mx-auto text-pink-500 shadow-2xs">
                💡
              </div>
              <p className="text-xs font-bold text-stone-700">ต้องการความช่วยเหลือ?</p>
              <p className="text-[11px] text-stone-500">
                ดูแนวทางการแต่งร้านและการอัพขึ้นเซิฟเวอร์ Vercel / Firebase
              </p>
              
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 space-y-6 min-w-0">
          {/* Role Permission Notice if Viewer */}
          {!currentUser.permissions.canEditStore && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 shrink-0" />
                <span>
                  คุณกำลังเข้าชมด้วยสิทธิ์ <strong>{currentUser.roleLabel}</strong> (โหมดอ่านอย่างเดียว)
                  หากต้องการแก้ไขข้อมูล สามารถสลับเป็น <strong>Super Admin</strong> ได้ที่เมนูด้านซ้าย
                </span>
              </div>
            </div>
          )}

          {/* TAB 1: STORE CUSTOMIZER (Matches Image 3 & Image 4) */}
          {activeTab === 'customizer' && (
            <div className="space-y-6 pb-20">
              {/* Page Intro Card */}
              <section className="bg-white rounded-3xl p-6 sm:p-8 border border-pink-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold text-pink-600 mb-1.5">
                      🎨 หน้าร้านพาสเทล · ปรับแต่งเนื้อหา & สีธีม
                    </p>
                    <h1 className="text-2xl sm:text-3xl font-bold text-stone-800">
                      ตั้งค่าและปรับแต่งหน้าเว็บไซต์
                    </h1>
                    <p className="text-xs sm:text-sm text-stone-500 mt-1">
                      กำหนดข้อความ ข้อมูลร้าน โลโก้ รูปภาพพื้นหลัง และโทนสีตามต้องการ ข้อมูลจะอัปเดตไปยังหน้าร้านทันที
                    </p>
                  </div>
                  <div className="text-xs text-stone-400 tabular-nums shrink-0">
                    ปรับปรุงล่าสุด: {draftSettings.updatedAt}
                  </div>
                </div>
              </section>

              {/* SECTION 1: Store Content */}
              <section className="bg-white rounded-3xl p-6 sm:p-8 border border-pink-100">
                <div className="flex items-center space-x-3 pb-5 border-b border-pink-50 mb-6">
                  <div className="w-9 h-9 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center font-bold text-base">
                    📝
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-stone-800">
                      1. ข้อมูลและข้อความหลักของร้าน (Store Content)
                    </h2>
                    <p className="text-xs text-stone-500">
                      ชื่อร้าน คำโปรย และข้อความต้อนรับสำหรับลูกค้า
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-stone-700 mb-2">
                      ชื่อร้าน (Store Name) <span className="text-pink-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={draftSettings.storeName}
                      onChange={(e) => updateDraft('storeName', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-pink-200 focus:border-pink-500 focus:outline-none text-sm bg-pink-50/20 text-stone-800 font-medium"
                    />
                    <p className="text-[11px] text-stone-400 mt-1.5">
                      แสดงบนหัวเว็บไซต์ การ์ดข้อมูลร้าน และแท็บบราวเซอร์
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-stone-700 mb-2">
                      เวลาทำการ (Business Hours)
                    </label>
                    <input
                      type="text"
                      value={draftSettings.businessHours}
                      onChange={(e) => updateDraft('businessHours', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-pink-200 focus:border-pink-500 focus:outline-none text-sm bg-pink-50/20 text-stone-800 font-medium"
                    />
                    <p className="text-[11px] text-stone-400 mt-1.5">
                      ระบุเวลาเปิด-ปิดร้านสำหรับให้ลูกค้ารับทราบ
                    </p>
                  </div>


                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-stone-700 mb-2">
                      หมวดหมู่ร้าน / ป้ายกำกับร้าน
                    </label>
                    <input
                      type="text"
                      value={draftSettings.storeCategory}
                      onChange={(e) => updateDraft('storeCategory', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-pink-200 focus:border-pink-500 focus:outline-none text-sm bg-pink-50/20 text-stone-800 font-medium"
                    />
                    <p className="text-[11px] text-stone-400 mt-1.5">
                      แสดงเป็นข้อความหมวดหมู่บนแบนเนอร์ต้อนรับ
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs sm:text-sm font-bold text-stone-700 mb-2">
                      คำโปรยและข้อความขอบคุณ (Store Slogan / Bio){' '}
                      <span className="text-pink-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={draftSettings.storeSlogan}
                      onChange={(e) => updateDraft('storeSlogan', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-pink-200 focus:border-pink-500 focus:outline-none text-sm bg-pink-50/20 text-stone-800"
                    />
                    <div className="flex justify-between items-center mt-1 text-[11px] text-stone-400 tabular-nums">
                      <span>ข้อความแสดงในกล่องการ์ดต้อนรับและใต้คะแนนรีวิวร้านค้า</span>
                      <span>{draftSettings.storeSlogan.length} / 200 ตัวอักษร</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* SECTION 2: Branding Assets */}
              <section className="bg-white rounded-3xl p-6 sm:p-8 border border-pink-100">
                <div className="flex items-center space-x-3 pb-5 border-b border-pink-50 mb-6">
                  <div className="w-9 h-9 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center font-bold text-base">
                    🖼️
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-stone-800">
                      2. โลโก้และภาพกราฟิกของร้าน (Branding Assets)
                    </h2>
                    <p className="text-xs text-stone-500">
                      จัดการภาพโลโก้ มาสคอต และภาพแบนเนอร์พื้นหลังของร้านค้า
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Store Logo */}
                  <div className="border border-pink-100 rounded-2xl p-4 bg-pink-50/10 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs sm:text-sm font-bold text-stone-700">
                          โลโก้ร้าน (Store Logo)
                        </span>
                        <span className="text-[11px] text-pink-600 font-medium">1:1</span>
                      </div>
                      <div className="w-full h-36 rounded-xl bg-white border border-pink-200 flex items-center justify-center p-3">
                        <img
                          src={draftSettings.logoUrl}
                          alt="Store Logo Preview"
                          referrerPolicy="no-referrer"
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <p className="text-[11px] text-stone-400 mt-2">
                        ขนาดแนะนำ: 500x500 px หรืออัตราส่วน 1:1
                      </p>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleAssetUpload('logoUrl', e)}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="flex-1 bg-white hover:bg-pink-50 text-pink-600 border border-pink-200 py-2 px-3 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>อัปโหลดใหม่</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => updateDraft('logoUrl', DEFAULT_LOGO_SVG)}
                        title="คืนค่าโลโก้เริ่มต้น"
                        className="text-stone-400 hover:text-rose-500 bg-white border border-pink-100 p-2 rounded-xl transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Store Avatar / Mascot */}
                  <div className="border border-pink-100 rounded-2xl p-4 bg-pink-50/10 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs sm:text-sm font-bold text-stone-700">
                          รูปโปรไฟล์/มาสคอต (Avatar)
                        </span>
                        <span className="text-[11px] text-pink-600 font-medium">วงกลมหน้าแรก</span>
                      </div>
                      <div className="w-full h-36 rounded-xl bg-pink-50/40 border border-pink-200 flex items-center justify-center p-2">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white shadow-sm bg-white">
                          <img
                            src={draftSettings.avatarUrl}
                            alt="Avatar Preview"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                      <p className="text-[11px] text-stone-400 mt-2">
                        แสดงเป็นการ์ตูนรูปโปรไฟล์กลางกล่องการ์ดร้าน
                      </p>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleAssetUpload('avatarUrl', e)}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        className="flex-1 bg-white hover:bg-pink-50 text-pink-600 border border-pink-200 py-2 px-3 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>เปลี่ยนรูปโปรไฟล์</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => updateDraft('avatarUrl', DEFAULT_MASCOT_SVG)}
                        title="คืนค่ารูปโปรไฟล์เริ่มต้น"
                        className="text-stone-400 hover:text-rose-500 bg-white border border-pink-100 p-2 rounded-xl transition cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Hero Banner */}
                  <div className="border border-pink-100 rounded-2xl p-4 bg-pink-50/10 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs sm:text-sm font-bold text-stone-700">
                          ภาพแบนเนอร์ (Hero Banner)
                        </span>
                        <span className="text-[11px] text-pink-600 font-medium">พื้นหลังหลัก</span>
                      </div>
                      <div className="w-full h-36 rounded-xl bg-white border border-pink-200 flex items-center justify-center overflow-hidden">
                        <img
                          src={draftSettings.bannerUrl}
                          alt="Hero Banner Preview"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-[11px] text-stone-400 mt-2">
                        ภาพกว้างสำหรับ Header หรือพื้นหลังหัวข้อหน้าแรก
                      </p>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <input
                        ref={bannerInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleAssetUpload('bannerUrl', e)}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => bannerInputRef.current?.click()}
                        className="flex-1 bg-white hover:bg-pink-50 text-pink-600 border border-pink-200 py-2 px-3 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>เปลี่ยนภาพแบนเนอร์</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => updateDraft('bannerUrl', DEFAULT_BANNER_SVG)}
                        title="คืนค่าแบนเนอร์เริ่มต้น"
                        className="text-stone-400 hover:text-rose-500 bg-white border border-pink-100 p-2 rounded-xl transition cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {/* SECTION 3: Theme & Colors */}
              <section className="bg-white rounded-3xl p-6 sm:p-8 border border-pink-100">
                <div className="flex items-center space-x-3 pb-5 border-b border-pink-50 mb-6">
                  <div className="w-9 h-9 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center font-bold text-base">
                    🎨
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-stone-800">
                      3. โทนสีและสไตล์การตกแต่ง (Theme & Colors)
                    </h2>
                    <p className="text-xs text-stone-500">
                      ปรับแต่งสีหลัก สีพื้นหลัง และรูปแบบความโค้งมนของการ์ด
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {/* Primary Color */}
                  <div className="p-4 rounded-2xl border border-pink-100 bg-pink-50/15">
                    <label className="block text-xs font-bold text-stone-700 mb-2">
                      สีหลักร้านค้า (Primary)
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={draftSettings.primaryColor}
                        onChange={(e) => updateDraft('primaryColor', e.target.value.toUpperCase())}
                        className="w-11 h-11 rounded-xl cursor-pointer border border-pink-200 p-0.5 bg-white"
                      />
                      <input
                        type="text"
                        value={draftSettings.primaryColor}
                        onChange={(e) => updateDraft('primaryColor', e.target.value)}
                        className="w-full px-3 py-1.5 text-xs font-mono font-medium rounded-lg border border-pink-200 uppercase bg-white"
                      />
                    </div>
                    <p className="text-[11px] text-stone-400 mt-2">ปุ่มกด, ขอบเน้น, หัวข้อย่อย</p>
                  </div>

                  {/* Background Color */}
                  <div className="p-4 rounded-2xl border border-pink-100 bg-pink-50/15">
                    <label className="block text-xs font-bold text-stone-700 mb-2">
                      สีพื้นหลังเว็บ (Background)
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={draftSettings.bgColor}
                        onChange={(e) => updateDraft('bgColor', e.target.value.toUpperCase())}
                        className="w-11 h-11 rounded-xl cursor-pointer border border-pink-200 p-0.5 bg-white"
                      />
                      <input
                        type="text"
                        value={draftSettings.bgColor}
                        onChange={(e) => updateDraft('bgColor', e.target.value)}
                        className="w-full px-3 py-1.5 text-xs font-mono font-medium rounded-lg border border-pink-200 uppercase bg-white"
                      />
                    </div>
                    <p className="text-[11px] text-stone-400 mt-2">พื้นหลังของทั้งเว็บไซต์หน้าร้าน</p>
                  </div>

                  {/* Card Background Color */}
                  <div className="p-4 rounded-2xl border border-pink-100 bg-pink-50/15">
                    <label className="block text-xs font-bold text-stone-700 mb-2">
                      สีกล่องการ์ด (Card BG)
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={draftSettings.cardColor}
                        onChange={(e) => updateDraft('cardColor', e.target.value.toUpperCase())}
                        className="w-11 h-11 rounded-xl cursor-pointer border border-pink-200 p-0.5 bg-white"
                      />
                      <input
                        type="text"
                        value={draftSettings.cardColor}
                        onChange={(e) => updateDraft('cardColor', e.target.value)}
                        className="w-full px-3 py-1.5 text-xs font-mono font-medium rounded-lg border border-pink-200 uppercase bg-white"
                      />
                    </div>
                    <p className="text-[11px] text-stone-400 mt-2">พื้นหลังการ์ดรีวิวและฟอร์ม</p>
                  </div>

                  {/* Text Color */}
                  <div className="p-4 rounded-2xl border border-pink-100 bg-pink-50/15">
                    <label className="block text-xs font-bold text-stone-700 mb-2">
                      สีตัวหนังสือ (Text Color)
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={draftSettings.textColor}
                        onChange={(e) => updateDraft('textColor', e.target.value.toUpperCase())}
                        className="w-11 h-11 rounded-xl cursor-pointer border border-pink-200 p-0.5 bg-white"
                      />
                      <input
                        type="text"
                        value={draftSettings.textColor}
                        onChange={(e) => updateDraft('textColor', e.target.value)}
                        className="w-full px-3 py-1.5 text-xs font-mono font-medium rounded-lg border border-pink-200 uppercase bg-white"
                      />
                    </div>
                    <p className="text-[11px] text-stone-400 mt-2">สีฟอนต์หัวข้อและเนื้อหา</p>
                  </div>
                </div>

                {/* Quick Color Palettes */}
                <div className="mt-6 pt-5 border-t border-pink-100 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-stone-700 block">
                      จานสีสำเร็จรูป (Quick Color Palettes):
                    </span>
                    <span className="text-[11px] text-stone-400">
                      คลิกเพื่อเลือกธีมสีพาสเทลยอดนิยมสำหรับร้านขนมและของน่ารัก
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        applyColorPalette(
                          'นมชมพู Momilk',
                          '#FF85A2',
                          '#FFF0F3',
                          '#FFFFFF',
                          '#4A3E3D'
                        )
                      }
                      className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                        draftSettings.primaryColor === '#FF85A2'
                          ? 'border-pink-400 bg-pink-50/70 text-pink-700'
                          : 'border-stone-200 bg-white text-stone-600 hover:border-pink-300'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full bg-[#FF85A2] inline-block" />
                      <span>นมชมพู Momilk</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        applyColorPalette(
                          'พีชละมุน (Peach)',
                          '#F9846B',
                          '#FFF6F2',
                          '#FFFFFF',
                          '#4A3B36'
                        )
                      }
                      className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                        draftSettings.primaryColor === '#F9846B'
                          ? 'border-orange-400 bg-orange-50/70 text-orange-700'
                          : 'border-stone-200 bg-white text-stone-600 hover:border-orange-300'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full bg-[#FFB5A7] inline-block" />
                      <span>พีชละมุน (Peach)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        applyColorPalette(
                          'ลาเวนเดอร์หวาน',
                          '#B57EDC',
                          '#F9F5FF',
                          '#FFFFFF',
                          '#3F364A'
                        )
                      }
                      className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                        draftSettings.primaryColor === '#B57EDC'
                          ? 'border-purple-400 bg-purple-50/70 text-purple-700'
                          : 'border-stone-200 bg-white text-stone-600 hover:border-purple-300'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full bg-[#D8B4E2] inline-block" />
                      <span>ลาเวนเดอร์หวาน</span>
                    </button>
                  </div>
                </div>

                {/* Special Atmospheric Effects Toggle */}
                <div className="mt-6 pt-5 border-t border-pink-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-pink-50/20 border border-pink-100">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🫧</span>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-stone-800">
                        เอฟเฟกฟรุ้งฟริ้งแบบฟองน้ำลอยขึ้นมา (Sparkling Floating Bubbles)
                      </h3>
                      <p className="text-[11px] text-stone-500">
                        แสดงฟองสบู่สีพาสเทลและประกายดาวฟรุ้งฟริ้งลอยจากด้านล่างขึ้นสู่ด้านบน ลูกค้าสามารถแตะระเบิดฟองได้
                      </p>
                    </div>
                  </div>
                  <label className="flex items-center space-x-2.5 bg-white border border-pink-200 px-3.5 py-2 rounded-xl cursor-pointer hover:bg-pink-50 transition shrink-0">
                    <input
                      type="checkbox"
                      checked={draftSettings.enableBubbleEffect !== false}
                      onChange={(e) => updateDraft('enableBubbleEffect', e.target.checked)}
                      className="w-4 h-4 accent-pink-500 rounded cursor-pointer"
                    />
                    <span className="text-xs font-bold text-stone-700">
                      {draftSettings.enableBubbleEffect !== false
                        ? '✓ เปิดเอฟเฟกฟองน้ำลอย'
                        : 'ปิดเอฟเฟกอยู่'}
                    </span>
                  </label>
                </div>
              </section>

              {/* SECTION 4: Contact & Social Links */}
              <section className="bg-white rounded-3xl p-6 sm:p-8 border border-pink-100">
                <div className="flex items-center space-x-3 pb-5 border-b border-pink-50 mb-6">
                  <div className="w-9 h-9 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center font-bold text-base">
                    💬
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-stone-800">
                      4. ช่องทางการติดต่อร้านค้า (Contact & Social Links)
                    </h2>
                    <p className="text-xs text-stone-500">
                      ระบุช่องทางให้ลูกค้ากดติดต่อสอบถามหรือสั่งซื้อได้สะดวก
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* LINE Official */}
                  <div className="p-4 rounded-2xl border border-pink-100 bg-pink-50/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                          LINE
                        </div>
                        <div>
                          <label className="text-sm font-bold text-stone-800 block">
                            LINE Official Account
                          </label>
                          <p className="text-[11px] text-stone-400">
                            ลูกค้ากดแล้วจะเปิดแอปหรือหน้าแชท LINE ทันที
                          </p>
                        </div>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <span className="text-xs text-stone-500">เปิดแสดงผล</span>
                        <input
                          type="checkbox"
                          checked={draftSettings.enableLine}
                          onChange={(e) => updateDraft('enableLine', e.target.checked)}
                          className="w-5 h-5 accent-pink-500 rounded cursor-pointer"
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-bold text-stone-700 mb-1">
                          1. ชื่อที่แสดง (Name)
                        </label>
                        <input
                          type="text"
                          value={draftSettings.contactLineName || draftSettings.contactLine || ''}
                          onChange={(e) => {
                            updateDraft('contactLineName', e.target.value);
                            updateDraft('contactLine', e.target.value);
                          }}
                          placeholder="เช่น LINE Official (@momilkshop)"
                          className="w-full px-3.5 py-2 rounded-xl border border-pink-200 text-xs sm:text-sm bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-stone-700 mb-1">
                          2. ลิงก์ปลายทาง (Link URL)
                        </label>
                        <input
                          type="url"
                          value={draftSettings.contactLineUrl || ''}
                          onChange={(e) => updateDraft('contactLineUrl', e.target.value)}
                          placeholder="เช่น https://line.me/ti/p/~@momilkshop"
                          className="w-full px-3.5 py-2 rounded-xl border border-pink-200 text-xs sm:text-sm bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Facebook Page */}
                  <div className="p-4 rounded-2xl border border-pink-100 bg-pink-50/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                          FB
                        </div>
                        <div>
                          <label className="text-sm font-bold text-stone-800 block">
                            Facebook Page
                          </label>
                          <p className="text-[11px] text-stone-400">
                            ลูกค้ากดแล้วจะเปิดไปยังหน้าเพจ Facebook
                          </p>
                        </div>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <span className="text-xs text-stone-500">เปิดแสดงผล</span>
                        <input
                          type="checkbox"
                          checked={draftSettings.enableFb}
                          onChange={(e) => updateDraft('enableFb', e.target.checked)}
                          className="w-5 h-5 accent-pink-500 rounded cursor-pointer"
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-bold text-stone-700 mb-1">
                          1. ชื่อที่แสดง (Name)
                        </label>
                        <input
                          type="text"
                          value={draftSettings.contactFbName || draftSettings.contactFb || ''}
                          onChange={(e) => {
                            updateDraft('contactFbName', e.target.value);
                            updateDraft('contactFb', e.target.value);
                          }}
                          placeholder="เช่น MOMILK SHOP (Buttxr Cxke)"
                          className="w-full px-3.5 py-2 rounded-xl border border-pink-200 text-xs sm:text-sm bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-stone-700 mb-1">
                          2. ลิงก์ปลายทาง (Link URL)
                        </label>
                        <input
                          type="url"
                          value={draftSettings.contactFbUrl || ''}
                          onChange={(e) => updateDraft('contactFbUrl', e.target.value)}
                          placeholder="เช่น https://facebook.com/momilkshop"
                          className="w-full px-3.5 py-2 rounded-xl border border-pink-200 text-xs sm:text-sm bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Instagram */}
                  <div className="p-4 rounded-2xl border border-pink-100 bg-pink-50/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                          IG
                        </div>
                        <div>
                          <label className="text-sm font-bold text-stone-800 block">
                            Instagram
                          </label>
                          <p className="text-[11px] text-stone-400">
                            ลูกค้ากดแล้วจะเปิดโปรไฟล์ Instagram
                          </p>
                        </div>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <span className="text-xs text-stone-500">เปิดแสดงผล</span>
                        <input
                          type="checkbox"
                          checked={draftSettings.enableIg}
                          onChange={(e) => updateDraft('enableIg', e.target.checked)}
                          className="w-5 h-5 accent-pink-500 rounded cursor-pointer"
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-bold text-stone-700 mb-1">
                          1. ชื่อที่แสดง (Name)
                        </label>
                        <input
                          type="text"
                          value={draftSettings.contactIgName || draftSettings.contactIg || ''}
                          onChange={(e) => {
                            updateDraft('contactIgName', e.target.value);
                            updateDraft('contactIg', e.target.value);
                          }}
                          placeholder="เช่น Instagram (@momilk.shop)"
                          className="w-full px-3.5 py-2 rounded-xl border border-pink-200 text-xs sm:text-sm bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-stone-700 mb-1">
                          2. ลิงก์ปลายทาง (Link URL)
                        </label>
                        <input
                          type="url"
                          value={draftSettings.contactIgUrl || ''}
                          onChange={(e) => updateDraft('contactIgUrl', e.target.value)}
                          placeholder="เช่น https://instagram.com/momilk.shop"
                          className="w-full px-3.5 py-2 rounded-xl border border-pink-200 text-xs sm:text-sm bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Other / TikTok Channel */}
                  <div className="p-4 rounded-2xl border border-pink-100 bg-pink-50/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-xl bg-stone-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                          ★
                        </div>
                        <div>
                          <label className="text-sm font-bold text-stone-800 block">
                            ช่องทางอื่นๆ (TikTok / เว็บไซต์สั่งซื้อ)
                          </label>
                          <p className="text-[11px] text-stone-400">
                            เพิ่มลิงก์ช่องทางติดต่อเพิ่มเติมตามต้องการ
                          </p>
                        </div>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <span className="text-xs text-stone-500">เปิดแสดงผล</span>
                        <input
                          type="checkbox"
                          checked={draftSettings.enableOther ?? false}
                          onChange={(e) => updateDraft('enableOther', e.target.checked)}
                          className="w-5 h-5 accent-pink-500 rounded cursor-pointer"
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-bold text-stone-700 mb-1">
                          1. ชื่อที่แสดง (Name)
                        </label>
                        <input
                          type="text"
                          value={draftSettings.contactOtherName || ''}
                          onChange={(e) => updateDraft('contactOtherName', e.target.value)}
                          placeholder="เช่น TikTok Shop (@momilk.cute)"
                          className="w-full px-3.5 py-2 rounded-xl border border-pink-200 text-xs sm:text-sm bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-stone-700 mb-1">
                          2. ลิงก์ปลายทาง (Link URL)
                        </label>
                        <input
                          type="url"
                          value={draftSettings.contactOtherUrl || ''}
                          onChange={(e) => updateDraft('contactOtherUrl', e.target.value)}
                          placeholder="เช่น https://tiktok.com/@momilk.cute"
                          className="w-full px-3.5 py-2 rounded-xl border border-pink-200 text-xs sm:text-sm bg-white"
                        />
                      </div>
                    </div>
                  </div>

                </div>
              </section>

              {/* SECTION 5: Background Music (BGM) */}
              <section className="bg-white rounded-3xl p-6 sm:p-8 border border-pink-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-pink-50 mb-6 gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center font-bold text-lg shadow-2xs shrink-0">
                      🎵
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-stone-800 flex items-center gap-2">
                        <span>5. เพลงประกอบหน้าร้าน (Background Music)</span>
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-pink-100 text-pink-700">
                          เพิ่มจากไฟล์ได้
                        </span>
                      </h2>
                      <p className="text-xs text-stone-500">
                        อัปโหลดไฟล์เพลงเพื่อเปิดคลอเบาๆ สร้างบรรยากาศน่ารักให้ลูกค้าขณะชมร้านค้า
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                    <label className="flex items-center space-x-2.5 bg-pink-50/70 border border-pink-200 px-3.5 py-2 rounded-xl cursor-pointer hover:bg-pink-100/60 transition">
                      <input
                        type="checkbox"
                        checked={draftSettings.enableBgm}
                        onChange={(e) => updateDraft('enableBgm', e.target.checked)}
                        className="w-4 h-4 accent-pink-500 rounded cursor-pointer"
                      />
                      <span className="text-xs font-bold text-stone-700">
                        {draftSettings.enableBgm ? '✓ เปิดใช้งานเพลงประกอบ' : 'ปิดเพลงประกอบอยู่'}
                      </span>
                    </label>

                    <label className="flex items-center space-x-2 bg-pink-50/40 border border-pink-200 px-3 py-2 rounded-xl cursor-pointer hover:bg-pink-100/40 transition">
                      <input
                        type="checkbox"
                        checked={draftSettings.autoplayBgm !== false}
                        onChange={(e) => updateDraft('autoplayBgm', e.target.checked)}
                        className="w-4 h-4 accent-pink-500 rounded cursor-pointer"
                      />
                      <span className="text-xs font-semibold text-stone-700">
                        {draftSettings.autoplayBgm !== false
                          ? '✓ เล่นอัตโนมัติเมื่อเข้าเว็บ'
                          : 'ไม่เล่นอัตโนมัติ'}
                      </span>
                    </label>
                  </div>
                </div>

                <div className="space-y-5">
                  {/* Current Active Music Card */}
                  <div className="p-4 sm:p-5 rounded-2xl border border-pink-200/80 bg-gradient-to-br from-pink-50/40 via-white to-pink-50/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start sm:items-center space-x-3.5 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-400 text-white flex items-center justify-center shrink-0 shadow-sm shadow-pink-200">
                        {isAdminPlayingBgm ? (
                          <Volume2 className="w-6 h-6 animate-pulse" />
                        ) : (
                          <FileAudio className="w-6 h-6" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                            เพลงปัจจุบันที่ตั้งค่าไว้
                          </span>
                          {draftSettings.bgmAudioUrl ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                              พร้อมใช้งาน
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-500">
                              ยังไม่ได้เลือกไฟล์
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-bold text-stone-800 truncate mt-0.5">
                          {draftSettings.bgmAudioFileName ||
                            draftSettings.bgmAudioName ||
                            (draftSettings.bgmAudioUrl
                              ? 'เพลงที่กำหนดผ่าน URL'
                              : 'ยังไม่มีไฟล์เพลง (จะใช้เสียงคอร์ดสังเคราะห์พาสเทลอัตโนมัติ)')}
                        </p>
                        {bgmFileSize && (
                          <p className="text-[11px] text-stone-400 font-mono mt-0.5">
                            ขนาดไฟล์: {bgmFileSize}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {draftSettings.bgmAudioUrl && (
                        <button
                          type="button"
                          onClick={handleToggleAdminBgm}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-2xs ${
                            isAdminPlayingBgm
                              ? 'bg-amber-500 hover:bg-amber-600 text-white'
                              : 'bg-pink-500 hover:bg-pink-600 text-white'
                          }`}
                        >
                          {isAdminPlayingBgm ? (
                            <>
                              <Pause className="w-3.5 h-3.5" />
                              <span>❚❚ หยุดฟัง</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5" />
                              <span>▶ ทดลองฟังเพลง</span>
                            </>
                          )}
                        </button>
                      )}

                      {draftSettings.bgmAudioUrl && (
                        <button
                          type="button"
                          onClick={handleClearBgm}
                          className="px-3 py-2 rounded-xl border border-stone-200 hover:border-rose-300 text-stone-600 hover:text-rose-600 bg-white text-xs font-medium transition flex items-center space-x-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>ลบเพลงออก</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Upload from file button & dropzone */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Method 1: Upload from local file */}
                    <div className="p-5 rounded-2xl border-2 border-dashed border-pink-200 bg-pink-50/20 hover:bg-pink-50/40 transition flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex items-center space-x-2 text-stone-800 font-bold text-sm mb-1">
                          <Upload className="w-4 h-4 text-pink-500" />
                          <span>วิธีที่ 1: อัปโหลดจากไฟล์ในเครื่อง (แนะนำ)</span>
                        </div>
                        <p className="text-xs text-stone-500 leading-relaxed">
                          เลือกไฟล์เพลงจากคอมพิวเตอร์หรือโทรศัพท์ของคุณ รองรับไฟล์ .mp3, .wav, .ogg, .m4a, .aac
                        </p>
                      </div>

                      <div>
                        <input
                          ref={bgmFileInputRef}
                          type="file"
                          accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac"
                          onChange={handleBgmFileUpload}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => bgmFileInputRef.current?.click()}
                          className="w-full py-2.5 px-4 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-pink-200 transition flex items-center justify-center space-x-2 cursor-pointer"
                        >
                          <FileAudio className="w-4 h-4" />
                          <span>+ เลือกไฟล์เพลงจากเครื่อง (MP3, WAV)</span>
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              </section>
            </div>
          )}

          {/* TAB 2: REVIEWS DATABASE MANAGEMENT */}
          {activeTab === 'reviews' && (
            <div className="space-y-6">
              <section className="bg-white rounded-3xl p-6 sm:p-8 border border-pink-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-pink-600 mb-1">
                    ฐานข้อมูลรีวิวลูกค้า · Review Moderation & Slip Verification
                  </p>
                  <h2 className="text-xl sm:text-2xl font-bold text-stone-800">
                    จัดการรีวิวและเครดิตความน่าเชื่อถือ ({db.reviews.length} รายการ)
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-500">
                    อนุมัติรีวิว ปักหมุดรีวิวแนะนำ ตอบกลับลูกค้า หรือลบรายการที่ไม่เหมาะสมตามสิทธิ์แอดมิน
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {(['all', 'approved', 'pending', 'hidden'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setAdminReviewFilter(st)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                        adminReviewFilter === st
                          ? 'bg-pink-500 text-white'
                          : 'bg-stone-100 text-stone-600 hover:bg-pink-50'
                      }`}
                    >
                      {st === 'all' && 'ทั้งหมด'}
                      {st === 'approved' && 'แสดงหน้าร้าน'}
                      {st === 'pending' && 'รอตรวจสอบ'}
                      {st === 'hidden' && 'ซ่อนไว้'}
                    </button>
                  ))}
                </div>
              </section>

              <div className="space-y-4">
                {filteredAdminReviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="bg-white rounded-3xl p-6 border border-pink-100 space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-pink-50">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-bold text-sm text-stone-800">{rev.customerName}</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-pink-600 font-semibold tabular-nums">
                          {rev.rating} ดาว ({rev.serviceType === 'good' ? 'บริการที่ดี' : 'บริการที่แย่'})
                        </span>
                        <span aria-hidden="true">·</span>
                        <span
                          className={`font-semibold ${
                            rev.status === 'approved'
                              ? 'text-emerald-600'
                              : rev.status === 'pending'
                              ? 'text-amber-600'
                              : 'text-stone-400'
                          }`}
                        >
                          สถานะ: {rev.status === 'approved' ? 'อนุมัติแล้ว' : rev.status === 'pending' ? 'รออนุมัติ' : 'ซ่อนจากหน้าร้าน'}
                        </span>
                        {rev.isPinned && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-amber-600 font-bold">★ ปักหมุดบนสุด</span>
                          </>
                        )}
                      </div>
                      <span className="text-xs text-stone-400 tabular-nums">{rev.createdAt}</span>
                    </div>

                    <p className="text-sm text-stone-700 leading-relaxed">{rev.comment}</p>

                    {rev.adminReply && (
                      <div className="p-3.5 rounded-2xl bg-pink-50/50 border border-pink-100 text-xs space-y-1">
                        <p className="font-bold text-pink-700">ข้อความตอบกลับจากแอดมิน:</p>
                        <p className="text-stone-600">{rev.adminReply}</p>
                      </div>
                    )}

                    {/* Reply Input Box */}
                    {replyingId === rev.id && (
                      <div className="flex flex-col sm:flex-row gap-2 pt-2">
                        <input
                          type="text"
                          value={replyDraft}
                          onChange={(e) => setReplyDraft(e.target.value)}
                          placeholder="พิมพ์ข้อความตอบกลับลูกค้าในนามร้าน MOMILK SHOP..."
                          className="flex-1 px-4 py-2 rounded-xl border border-pink-200 text-xs sm:text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateReview(rev.id, { adminReply: replyDraft.trim() || undefined });
                            setReplyingId(null);
                            setReplyDraft('');
                          }}
                          className="px-4 py-2 rounded-xl bg-pink-500 text-white text-xs font-bold cursor-pointer"
                        >
                          บันทึกคำตอบ
                        </button>
                      </div>
                    )}

                    {/* Moderation Action Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          disabled={!currentUser.permissions.canModerateReviews}
                          onClick={() =>
                            onUpdateReview(rev.id, {
                              status: rev.status === 'approved' ? 'hidden' : 'approved',
                            })
                          }
                          className="px-3 py-1.5 rounded-xl border border-pink-200 bg-white hover:bg-pink-50 disabled:opacity-40 text-xs font-semibold text-stone-700 flex items-center gap-1.5 cursor-pointer"
                        >
                          {rev.status === 'approved' ? (
                            <>
                              <EyeOff className="w-3.5 h-3.5 text-stone-500" />
                              <span>ซ่อนรีวิว</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                              <span>อนุมัติแสดงผล</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          disabled={!currentUser.permissions.canModerateReviews}
                          onClick={() => onUpdateReview(rev.id, { isPinned: !rev.isPinned })}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-40 ${
                            rev.isPinned
                              ? 'border-amber-300 bg-amber-50 text-amber-700'
                              : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                          }`}
                        >
                          <Pin className="w-3.5 h-3.5" />
                          <span>{rev.isPinned ? 'ยกเลิกปักหมุด' : 'ปักหมุดแนะนำ'}</span>
                        </button>

                        <button
                          type="button"
                          disabled={!currentUser.permissions.canModerateReviews}
                          onClick={() => {
                            setReplyingId(replyingId === rev.id ? null : rev.id);
                            setReplyDraft(rev.adminReply || '');
                          }}
                          className="px-3 py-1.5 rounded-xl border border-stone-200 bg-white hover:bg-pink-50 disabled:opacity-40 text-xs font-semibold text-stone-600 flex items-center gap-1.5 cursor-pointer"
                        >
                          <MessageSquareReply className="w-3.5 h-3.5 text-pink-500" />
                          <span>ตอบกลับลูกค้า</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        disabled={!currentUser.permissions.canDeleteReviews}
                        onClick={() => onDeleteReview(rev.id)}
                        title={
                          currentUser.permissions.canDeleteReviews
                            ? 'ลบรีวิวออกจากฐานข้อมูล'
                            : 'เฉพาะ Super Admin เท่านั้นที่ลบรีวิวได้'
                        }
                        className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 disabled:opacity-40 text-xs font-semibold text-rose-600 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>ลบรีวิว</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: USERS & RBAC PERMISSIONS DATABASE */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <section className="bg-white rounded-3xl p-6 sm:p-8 border border-pink-100 space-y-2">
                <p className="text-xs font-semibold text-pink-600">
                  ระบบฐานข้อมูลผู้ใช้งาน · Role-Based Access Control (RBAC)
                </p>
                <h2 className="text-xl sm:text-2xl font-bold text-stone-800">
                  จัดการข้อมูลผู้ใช้งานและกำหนดสิทธิ์ผู้ดูแล ({db.users.length} บัญชี)
                </h2>
                <p className="text-xs sm:text-sm text-stone-500">
                  กำหนดระดับสิทธิ์ผู้ดูแล (Super Admin, Store Editor, Analytics Viewer) และตรวจสอบรายชื่อลูกค้าในระบบ
                </p>
              </section>

              {/* Add New Admin / User Card */}
              {currentUser.permissions.canManageUsers && (
                <section className="bg-white rounded-3xl p-6 border border-pink-100 space-y-4">
                  <h3 className="text-sm font-bold text-stone-800 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-pink-500" />
                    <span>เพิ่มบัญชีผู้ดูแลหรือสมาชิกใหม่ลงฐานข้อมูล</span>
                  </h3>
                  <form
                    onSubmit={handleCreateUserSubmit}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3"
                  >
                    <input
                      type="text"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      placeholder="ชื่อ-นามสกุล / ชื่อแอดมิน"
                      className="px-3.5 py-2 rounded-xl border border-pink-200 text-xs sm:text-sm"
                    />
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="Username (สำหรับล็อกอิน)"
                      className="px-3.5 py-2 rounded-xl border border-pink-200 text-xs sm:text-sm"
                    />
                    <input
                      type="email"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      placeholder="อีเมลผู้ใช้งาน"
                      className="px-3.5 py-2 rounded-xl border border-pink-200 text-xs sm:text-sm"
                    />
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value as AdminRole)}
                      className="px-3.5 py-2 rounded-xl border border-pink-200 text-xs sm:text-sm bg-white"
                    >
                      <option value="super_admin">Super Admin (สิทธิ์สูงสุด)</option>
                      <option value="editor">Store Editor (ดูแลร้าน/รีวิว)</option>
                      <option value="viewer">Analytics Viewer (ดูสถิติ)</option>
                      <option value="customer">Customer (ลูกค้าสมาชิก)</option>
                    </select>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold transition cursor-pointer"
                    >
                      + บันทึกผู้ใช้ใหม่
                    </button>
                  </form>
                </section>
              )}

              {/* Users Database Table */}
              <section className="bg-white rounded-3xl border border-pink-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-pink-100 bg-pink-50/40 text-[11px] font-bold text-stone-600">
                        <th className="py-3.5 px-5">ผู้ใช้งาน (User / Account)</th>
                        <th className="py-3.5 px-4">ระดับสิทธิ์ (Role)</th>
                        <th className="py-3.5 px-4">สิทธิ์การเข้าถึง (Permissions)</th>
                        <th className="py-3.5 px-4 text-right">รีวิวสะสม</th>
                        <th className="py-3.5 px-5 text-right">การจัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-pink-50 text-xs">
                      {db.users.map((usr) => (
                        <tr key={usr.id} className="hover:bg-pink-50/20 transition">
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-3">
                              <img
                                src={usr.avatarUrl}
                                alt={usr.name}
                                referrerPolicy="no-referrer"
                                className="w-9 h-9 rounded-full border border-pink-200 object-cover bg-white shrink-0"
                              />
                              <div>
                                <p className="font-bold text-stone-800">{usr.name}</p>
                                <p className="text-[11px] text-stone-400 font-mono">
                                  @{usr.username} · {usr.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <select
                              disabled={!currentUser.permissions.canManageUsers}
                              value={usr.role}
                              onChange={(e) =>
                                onUpdateUserRole(usr.id, e.target.value as AdminRole)
                              }
                              className="px-2.5 py-1 rounded-lg border border-pink-200 bg-white text-xs font-semibold text-stone-700 disabled:opacity-60"
                            >
                              <option value="super_admin">Super Admin</option>
                              <option value="editor">Store Editor</option>
                              <option value="viewer">Analytics Viewer</option>
                              <option value="customer">Customer</option>
                            </select>
                          </td>
                          <td className="py-3.5 px-4 text-[11px] text-stone-600">
                            {[
                              usr.permissions.canEditStore && 'แต่งเว็บ',
                              usr.permissions.canModerateReviews && 'อนุมัติรีวิว',
                              usr.permissions.canDeleteReviews && 'ลบข้อมูล',
                              usr.permissions.canManageUsers && 'จัดการแอดมิน',
                            ]
                              .filter(Boolean)
                              .join(' · ') || 'ดูข้อมูล/รีวิวหน้าร้าน'}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-semibold text-stone-700 tabular-nums">
                            {usr.totalReviews}
                          </td>
                          <td className="py-3.5 px-5 text-right">
                            <button
                              type="button"
                              disabled={!currentUser.permissions.canManageUsers}
                              onClick={() => onToggleUserStatus(usr.id)}
                              className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-40 ${
                                usr.status === 'active'
                                  ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                                  : 'text-rose-700 bg-rose-50 hover:bg-rose-100'
                              }`}
                            >
                              {usr.status === 'active' ? 'ใช้งานปกติ' : 'ระงับชั่วคราว'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {/* TAB 4: CONTACT CHANNELS OVERVIEW */}
          {activeTab === 'contacts' && (
            <div className="space-y-6">
              <section className="bg-white rounded-3xl p-6 sm:p-8 border border-pink-100 space-y-2">
                <p className="text-xs font-semibold text-pink-600">
                  ระบบติดตามช่องทางติดต่อ · Omnichannel Conversion
                </p>
                <h2 className="text-xl sm:text-2xl font-bold text-stone-800">
                  ช่องทางติดต่อร้านค้าและสถิติการคลิกของลูกค้า
                </h2>
                <p className="text-xs sm:text-sm text-stone-500">
                  ตรวจสอบสถานะการเปิดใช้งานแต่ละช่องทาง พร้อมยอดคลิกสะสมแบบเรียลไทม์
                </p>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* LINE Card */}
                <div className="bg-white rounded-3xl p-6 border border-pink-100 space-y-3.5 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="w-9 h-9 rounded-xl bg-emerald-500 text-white font-bold text-xs flex items-center justify-center shadow-2xs">
                        LINE
                      </span>
                      <span className={`text-xs font-semibold ${draftSettings.enableLine ? 'text-emerald-600' : 'text-stone-400'}`}>
                        {draftSettings.enableLine ? '✓ เปิดใช้งาน' : 'ปิดอยู่'}
                      </span>
                    </div>
                    <div>
                      <p className="text-[11px] text-stone-400 font-medium">ชื่อที่แสดง</p>
                      <p className="text-sm font-bold text-stone-800 truncate">
                        {draftSettings.contactLineName || draftSettings.contactLine || 'LINE Official'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-stone-400 font-medium">ลิงก์ปลายทาง</p>
                      <p className="text-xs text-stone-600 truncate font-mono">
                        {draftSettings.contactLineUrl || 'ยังไม่ได้ระบุลิงก์'}
                      </p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-pink-50 flex items-center justify-between">
                    <span className="text-xs text-stone-500 tabular-nums">
                      คลิก: <strong className="text-stone-800">{db.analytics.lineClicks} ครั้ง</strong>
                    </span>
                    {(draftSettings.contactLineUrl || draftSettings.contactLineName) && (
                      <a
                        href={resolveContactUrl(draftSettings.contactLineUrl, draftSettings.contactLineName, 'line')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <span>ทดสอบลิงก์</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Facebook Card */}
                <div className="bg-white rounded-3xl p-6 border border-pink-100 space-y-3.5 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-2xs">
                        FB
                      </span>
                      <span className={`text-xs font-semibold ${draftSettings.enableFb ? 'text-blue-600' : 'text-stone-400'}`}>
                        {draftSettings.enableFb ? '✓ เปิดใช้งาน' : 'ปิดอยู่'}
                      </span>
                    </div>
                    <div>
                      <p className="text-[11px] text-stone-400 font-medium">ชื่อที่แสดง</p>
                      <p className="text-sm font-bold text-stone-800 truncate">
                        {draftSettings.contactFbName || draftSettings.contactFb || 'Facebook'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-stone-400 font-medium">ลิงก์ปลายทาง</p>
                      <p className="text-xs text-stone-600 truncate font-mono">
                        {draftSettings.contactFbUrl || 'ยังไม่ได้ระบุลิงก์'}
                      </p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-pink-50 flex items-center justify-between">
                    <span className="text-xs text-stone-500 tabular-nums">
                      คลิก: <strong className="text-stone-800">{db.analytics.fbClicks} ครั้ง</strong>
                    </span>
                    {(draftSettings.contactFbUrl || draftSettings.contactFbName) && (
                      <a
                        href={resolveContactUrl(draftSettings.contactFbUrl, draftSettings.contactFbName, 'fb')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <span>ทดสอบลิงก์</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Instagram Card */}
                <div className="bg-white rounded-3xl p-6 border border-pink-100 space-y-3.5 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center shadow-2xs">
                        IG
                      </span>
                      <span className={`text-xs font-semibold ${draftSettings.enableIg ? 'text-pink-600' : 'text-stone-400'}`}>
                        {draftSettings.enableIg ? '✓ เปิดใช้งาน' : 'ปิดอยู่'}
                      </span>
                    </div>
                    <div>
                      <p className="text-[11px] text-stone-400 font-medium">ชื่อที่แสดง</p>
                      <p className="text-sm font-bold text-stone-800 truncate">
                        {draftSettings.contactIgName || draftSettings.contactIg || 'Instagram'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-stone-400 font-medium">ลิงก์ปลายทาง</p>
                      <p className="text-xs text-stone-600 truncate font-mono">
                        {draftSettings.contactIgUrl || 'ยังไม่ได้ระบุลิงก์'}
                      </p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-pink-50 flex items-center justify-between">
                    <span className="text-xs text-stone-500 tabular-nums">
                      คลิก: <strong className="text-stone-800">{db.analytics.igClicks} ครั้ง</strong>
                    </span>
                    {(draftSettings.contactIgUrl || draftSettings.contactIgName) && (
                      <a
                        href={resolveContactUrl(draftSettings.contactIgUrl, draftSettings.contactIgName, 'ig')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <span>ทดสอบลิงก์</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                {/* TikTok / Other Card */}
                <div className="bg-white rounded-3xl p-6 border border-pink-100 space-y-3.5 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="w-9 h-9 rounded-xl bg-stone-900 text-white font-bold text-xs flex items-center justify-center shadow-2xs">
                        ★
                      </span>
                      <span className={`text-xs font-semibold ${draftSettings.enableOther ? 'text-stone-800' : 'text-stone-400'}`}>
                        {draftSettings.enableOther ? '✓ เปิดใช้งาน' : 'ปิดอยู่'}
                      </span>
                    </div>
                    <div>
                      <p className="text-[11px] text-stone-400 font-medium">ชื่อที่แสดง</p>
                      <p className="text-sm font-bold text-stone-800 truncate">
                        {draftSettings.contactOtherName || 'TikTok / อื่นๆ'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-stone-400 font-medium">ลิงก์ปลายทาง</p>
                      <p className="text-xs text-stone-600 truncate font-mono">
                        {draftSettings.contactOtherUrl || 'ยังไม่ได้ระบุลิงก์'}
                      </p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-pink-50 flex items-center justify-between">
                    <span className="text-xs text-stone-500">
                      ไปที่ <button type="button" onClick={() => setActiveTab('customizer')} className="text-pink-600 font-semibold underline">แก้ไขข้อมูล</button>
                    </span>
                    {(draftSettings.contactOtherUrl || draftSettings.contactOtherName) && (
                      <a
                        href={resolveContactUrl(draftSettings.contactOtherUrl, draftSettings.contactOtherName, 'other')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-stone-800 hover:text-pink-600 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <span>ทดสอบลิงก์</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: REALTIME ANALYTICS */}
          {activeTab === 'analytics' && (
            <RealtimeAnalyticsView
              db={db}
              onSimulateRealtimeEvent={onSimulateRealtimeEvent}
            />
          )}

          {/* TAB 6: SYSTEM SETTINGS & VERCEL / FIREBASE DEPLOYMENT GUIDE */}
          {activeTab === 'settings' && (
            <DeploymentAndDbGuide
              db={db}
              currentUser={currentUser}
              onResetDatabase={onResetDatabase}
            />
          )}
        </main>
      </div>

      {/* Sticky Bottom Action Bar (Active on Store Customizer Tab, matching Image 3 & Image 4) */}
      {activeTab === 'customizer' && (
        <aside className="sticky bottom-0 z-40 bg-white/95 backdrop-blur-md border-t border-pink-200 shadow-2xl py-4 px-4 sm:px-8">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2.5 text-xs sm:text-sm text-amber-800 bg-amber-50 border border-amber-200/80 px-4 py-2 rounded-xl">
              <span className="font-medium">
                {hasUnsavedChanges
                  ? 'คุณมีการแก้ไขที่ยังไม่ได้บันทึก: ตรวจสอบความถูกต้องก่อนกดบันทึก'
                  : 'ข้อมูลหน้าร้านซิงค์กับฐานข้อมูลล่าสุดเรียบร้อยแล้ว'}
              </span>
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleResetCustomizer}
                className="px-4 sm:px-5 py-2.5 rounded-xl border border-stone-300 hover:border-stone-400 text-stone-600 bg-white hover:bg-stone-50 text-xs sm:text-sm font-medium transition cursor-pointer whitespace-nowrap"
              >
                คืนค่าเริ่มต้น
              </button>

              <button
                type="button"
                onClick={() => setShowPreviewModal(true)}
                className="px-4 sm:px-5 py-2.5 rounded-xl border border-pink-300 text-pink-600 bg-pink-50 hover:bg-pink-100 text-xs sm:text-sm font-medium transition flex items-center space-x-1.5 cursor-pointer whitespace-nowrap"
              >
                <Eye className="w-4 h-4" />
                <span>ดูตัวอย่างการแสดงผล</span>
              </button>

              <button
                type="button"
                onClick={handleSaveCustomizer}
                className="px-6 sm:px-7 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-pink-200 transition flex items-center space-x-2 cursor-pointer whitespace-nowrap"
              >
                <Check className="w-4 h-4" />
                <span>บันทึกการเปลี่ยนแปลง</span>
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Live Preview Modal */}
      {showPreviewModal && (
        <div
          className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowPreviewModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-pink-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-pink-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-stone-800">
                  ตัวอย่างการแสดงผลหน้าร้าน (Live Theme Preview)
                </h3>
                <p className="text-xs text-stone-500">
                  จำลองสีพื้นหลัง การ์ดร้านค้า และแบนเนอร์ที่คุณกำลังปรับแต่ง
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              className="rounded-2xl p-6 border border-pink-100 space-y-4"
              style={{
                backgroundColor: draftSettings.bgColor,
                color: draftSettings.textColor,
              }}
            >
              {/* Banner Preview */}
              <div className="rounded-2xl overflow-hidden bg-white border border-pink-100 flex items-center justify-center p-1">
                <img
                  src={draftSettings.bannerUrl}
                  alt={draftSettings.storeName}
                  referrerPolicy="no-referrer"
                  className="w-full h-auto max-h-[160px] object-contain rounded-xl"
                />
              </div>

              {/* Store Profile Card Preview */}
              <div
                className="rounded-2xl p-5 border border-pink-100 flex flex-col sm:flex-row items-center gap-4"
                style={{ backgroundColor: draftSettings.cardColor }}
              >
                <img
                  src={draftSettings.avatarUrl}
                  alt={draftSettings.storeName}
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-full object-cover border-2 border-pink-200 shrink-0"
                />
                <div className="space-y-1 text-center sm:text-left">
                  <h4 className="text-base font-bold">{draftSettings.storeName}</h4>
                  <p className="text-xs opacity-80">{draftSettings.storeSlogan}</p>
                  <p className="text-xs font-bold pt-1" style={{ color: draftSettings.primaryColor }}>
                    {draftSettings.businessHours}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
              <button
                type="button"
                onClick={() => {
                  handleSaveCustomizer();
                  setShowPreviewModal(false);
                  onSwitchToStorefront();
                }}
                className="px-5 py-2 rounded-xl text-white text-xs font-bold cursor-pointer"
                style={{ backgroundColor: draftSettings.primaryColor }}
              >
                บันทึกและเปิดดูหน้าร้านจริง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
