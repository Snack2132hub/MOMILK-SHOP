import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Star,
  Heart,
  Clock,
  Copy,
  Check,
  ExternalLink,
  Music,
  Volume2,
  VolumeX,
  Send,
  Image as ImageIcon,
  CheckCircle2,
  MessageSquareHeart,
  ShieldCheck,
  Lock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
  Search,
} from 'lucide-react';
import { DatabaseSchema, ReviewItem, UserAccount } from '../types/database';
import { resolveContactUrl } from '../utils/urlHelper';
import { FloatingBubbles } from './FloatingBubbles';

interface StorefrontViewProps {
  db: DatabaseSchema;
  currentUser: UserAccount | null;
  onOpenLogin: () => void;
  onSwitchToAdmin: () => void;
  onAddReview: (review: Omit<ReviewItem, 'id' | 'likes' | 'createdAt' | 'timestampMs' | 'status'>) => void;
  onToggleLike: (reviewId: string) => void;
  onTrackContactClick: (channel: 'line' | 'fb' | 'ig') => void;
}

export const StorefrontView: React.FC<StorefrontViewProps> = ({
  db,
  currentUser,
  onOpenLogin,
  onSwitchToAdmin,
  onAddReview,
  onToggleLike,
  onTrackContactClick,
}) => {
  const { storeSettings, reviews } = db;

  // Navigation & filter state
  const [reviewFilter, setReviewFilter] = useState<'all' | 'good' | 'bad'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const reviewsPerPage = 4;

  // Review Form state
  const [customerName, setCustomerName] = useState('');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [serviceType, setServiceType] = useState<'good' | 'bad'>('good');
  const [comment, setComment] = useState('');
  const [proofImageUrl, setProofImageUrl] = useState<string | undefined>(undefined);
  const [proofFileName, setProofFileName] = useState<string>('');
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Copy LINE ID state
  const [copiedLine, setCopiedLine] = useState(false);

  // Live Thailand Clock (GMT+7)
  const [thaiTimeStr, setThaiTimeStr] = useState<string>('23 ต.ค. 2569 14:23:21 น.');

  // Lightbox modal for proof image
  const [previewSlipUrl, setPreviewSlipUrl] = useState<string | null>(null);

  // BGM Synthesizer / Audio state
  const [isPlayingBgm, setIsPlayingBgm] = useState(false);
  const [waitingForInteraction, setWaitingForInteraction] = useState(false);
  const userMutedRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const bgmIntervalRef = useRef<number | null>(null);
  const audioElemRef = useRef<HTMLAudioElement | null>(null);

  const stopBgm = useCallback(() => {
    if (audioElemRef.current) {
      audioElemRef.current.pause();
    }
    if (bgmIntervalRef.current) {
      window.clearInterval(bgmIntervalRef.current);
      bgmIntervalRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    setIsPlayingBgm(false);
  }, []);

  const playSynthMelody = useCallback(() => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;
      const notes = [523.25, 659.25, 783.99, 659.25, 880.0, 783.99, 659.25, 587.33];
      let step = 0;

      const playNote = () => {
        if (!audioCtxRef.current) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(notes[step % notes.length], ctx.currentTime);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0008, ctx.currentTime + 0.55);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.55);
        step++;
      };

      playNote();
      bgmIntervalRef.current = window.setInterval(playNote, 650);
      setIsPlayingBgm(true);
      setWaitingForInteraction(false);
    } catch {
      setIsPlayingBgm(false);
    }
  }, []);

  const startBgm = useCallback(() => {
    if (userMutedRef.current) return;

    if (storeSettings.bgmAudioUrl) {
      try {
        if (!audioElemRef.current || audioElemRef.current.src !== storeSettings.bgmAudioUrl) {
          const audio = new Audio(storeSettings.bgmAudioUrl);
          audio.loop = true;
          audio.volume = 0.45;
          audioElemRef.current = audio;
        }
        const promise = audioElemRef.current.play();
        if (promise !== undefined) {
          promise
            .then(() => {
              setIsPlayingBgm(true);
              setWaitingForInteraction(false);
            })
            .catch(() => {
              // Blocked by browser autoplay policy before user gesture
              setWaitingForInteraction(true);
            });
        }
      } catch {
        playSynthMelody();
      }
    } else {
      playSynthMelody();
    }
  }, [storeSettings.bgmAudioUrl, playSynthMelody]);

  // Toggle BGM manually
  const toggleBgm = () => {
    if (isPlayingBgm) {
      userMutedRef.current = true;
      setWaitingForInteraction(false);
      stopBgm();
    } else {
      userMutedRef.current = false;
      startBgm();
    }
  };

  // Autoplay BGM when landing on page + listen for first gesture if browser blocks immediate unprompted play
  useEffect(() => {
    if (!storeSettings.enableBgm || storeSettings.autoplayBgm === false) {
      if (!storeSettings.enableBgm) stopBgm();
      return;
    }

    // Attempt playback immediately upon landing
    startBgm();

    // Fallback: Listen for first user interaction (touch, click, scroll, keydown)
    const handleFirstGesture = () => {
      if (!userMutedRef.current) {
        startBgm();
      }
    };

    window.addEventListener('pointerdown', handleFirstGesture, { once: true });
    window.addEventListener('touchstart', handleFirstGesture, { once: true });
    window.addEventListener('keydown', handleFirstGesture, { once: true });
    window.addEventListener('scroll', handleFirstGesture, { once: true });

    return () => {
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
      window.removeEventListener('scroll', handleFirstGesture);
    };
  }, [storeSettings.enableBgm, storeSettings.autoplayBgm, storeSettings.bgmAudioUrl, startBgm, stopBgm]);

  useEffect(() => {
    return () => {
      if (audioElemRef.current) {
        audioElemRef.current.pause();
        audioElemRef.current = null;
      }
      if (bgmIntervalRef.current) window.clearInterval(bgmIntervalRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {});
    };
  }, []);

  // Filter approved reviews for public storefront
  const visibleReviews = reviews.filter((r) => r.status === 'approved');
  const goodCount = visibleReviews.filter((r) => r.serviceType === 'good').length;
  const badCount = visibleReviews.filter((r) => r.serviceType === 'bad').length;

  const baseOffset = 122;
  const totalDisplayReviews = baseOffset + visibleReviews.length;
  const goodDisplayCount = baseOffset - 3 + goodCount;
  const badDisplayCount = 2 + badCount;

  const avgRating =
    visibleReviews.length > 0
      ? (visibleReviews.reduce((acc, r) => acc + r.rating, 0) / visibleReviews.length).toFixed(1)
      : '5.0';

  const filteredReviews = visibleReviews
    .filter((r) => {
      if (reviewFilter === 'good') return r.serviceType === 'good';
      if (reviewFilter === 'bad') return r.serviceType === 'bad';
      return true;
    })
    .filter((r) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return r.customerName.toLowerCase().includes(q) || r.comment.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.timestampMs - a.timestampMs;
    });

  const totalPages = Math.max(1, Math.ceil(filteredReviews.length / reviewsPerPage));
  const paginatedReviews = filteredReviews.slice(
    (currentPage - 1) * reviewsPerPage,
    currentPage * reviewsPerPage
  );

  const handleCopyLine = () => {
    const idToCopy = storeSettings.contactLine || storeSettings.contactLineName || '@momilkshop';
    navigator.clipboard?.writeText(idToCopy).catch(() => {});
    setCopiedLine(true);
    onTrackContactClick('line');
    setTimeout(() => setCopiedLine(false), 2000);
  };

  const handleOpenContact = (
    url: string | undefined,
    defaultFallback: string,
    channel: 'line' | 'fb' | 'ig'
  ) => {
    onTrackContactClick(channel);
    let target = (url || defaultFallback || '').trim();
    if (!target) return;
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      if (channel === 'line' && target.startsWith('@')) {
        target = `https://line.me/ti/p/~${target}`;
      } else {
        target = `https://${target}`;
      }
    }
    window.open(target, '_blank', 'noopener,noreferrer');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProofFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setProofImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAttachSampleSlip = () => {
    const sampleSvg = `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 440">
        <rect width="360" height="440" rx="20" fill="#FFF9FB" stroke="#FFCCD6" stroke-width="4"/>
        <rect x="24" y="24" width="312" height="64" rx="12" fill="#FFE3EC"/>
        <text x="180" y="54" font-family="Prompt, sans-serif" font-size="16" font-weight="700" fill="#E84D74" text-anchor="middle">สลิปโอนเงินสำเร็จ (Verified Slip)</text>
        <text x="180" y="74" font-family="Prompt, sans-serif" font-size="11" fill="#8D7B7B" text-anchor="middle">MOMILK SHOP OFFICIAL RECEIPT</text>
        <line x1="36" y1="115" x2="324" y2="115" stroke="#FCE7ED" stroke-width="2" stroke-dasharray="6,6"/>
        <text x="40" y="150" font-family="Prompt, sans-serif" font-size="13" fill="#8D7B7B">ผู้รับเงิน:</text>
        <text x="320" y="150" font-family="Prompt, sans-serif" font-size="13" font-weight="600" fill="#4A3E3D" text-anchor="end">บจก. โมมิลค์ ช้อป</text>
        <text x="40" y="190" font-family="Prompt, sans-serif" font-size="13" fill="#8D7B7B">รายการสินค้า:</text>
        <text x="320" y="190" font-family="Prompt, sans-serif" font-size="13" font-weight="600" fill="#4A3E3D" text-anchor="end">เซ็ตกล่องสุ่มพาสเทลพรีเมียม</text>
        <text x="40" y="230" font-family="Prompt, sans-serif" font-size="13" fill="#8D7B7B">ยอดชำระสุทธิ:</text>
        <text x="320" y="230" font-family="JetBrains Mono, monospace" font-size="18" font-weight="700" fill="#E84D74" text-anchor="end">฿ 590.00</text>
        <rect x="40" y="270" width="280" height="110" rx="14" fill="#F0FDF4" stroke="#BBF7D0" stroke-width="2"/>
        <text x="180" y="318" font-family="Prompt, sans-serif" font-size="14" font-weight="700" fill="#15803D" text-anchor="middle">✓ ตรวจสอบสลิปและจัดส่งพัสดุแล้ว</text>
        <text x="180" y="344" font-family="JetBrains Mono, monospace" font-size="11" fill="#16A34A" text-anchor="middle">TRACKING: TH-MOMILK-882941</text>
      </svg>
    `)}`;
    setProofImageUrl(sampleSvg);
    setProofFileName('slip_momilk_verified.png');
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!customerName.trim()) {
      setFormError('กรุณากรอกชื่อของคุณหรือชื่อเล่นก่อนส่งรีวิว');
      return;
    }
    if (!comment.trim()) {
      setFormError('กรุณาพิมพ์รายละเอียดการรีวิวความประทับใจหรือข้อเสนอแนะ');
      return;
    }

    onAddReview({
      customerName: customerName.trim(),
      rating,
      serviceType,
      comment: comment.trim(),
      proofImageUrl,
      verifiedSlip: Boolean(proofImageUrl),
    });

    setCustomerName('');
    setRating(5);
    setServiceType('good');
    setComment('');
    setProofImageUrl(undefined);
    setProofFileName('');
    setCurrentPage(1);
    setSubmitSuccess(
      storeSettings.requireReviewApproval
        ? 'ส่งรีวิวเรียบร้อยแล้ว! รีวิวของคุณอยู่ในคิวรอแอดมินอนุมัติ 💖'
        : 'ส่งรีวิวสำเร็จแล้ว! ขอบคุณที่ร่วมรีวิวให้ร้าน MOMILK SHOP นะคะ 💖'
    );
    setTimeout(() => setSubmitSuccess(null), 5000);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col transition-colors duration-300 relative"
      style={{
        backgroundColor: storeSettings.bgColor,
        color: storeSettings.textColor,
        backgroundImage: `radial-gradient(${storeSettings.primaryColor}22 1.5px, transparent 1.5px)`,
        backgroundSize: '28px 28px',
      }}
    >
      {/* Dreamy Sparkling Floating Bubbles Effect */}
      <FloatingBubbles enabled={storeSettings.enableBubbleEffect !== false} />

      {/* Top Bar Following Strict 3-Zone Contract */}
      <header className="bg-white/90 backdrop-blur-md border-b border-pink-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Title */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-lg font-bold tracking-tight whitespace-nowrap shrink-0 flex items-center gap-2"
            style={{ color: storeSettings.primaryColor }}
          >
            {storeSettings.storeName} ♥
          </a>

          {/* Zone 2: 4 Single-line Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-600">
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="hover:text-pink-600 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              หน้าแรก
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('reviews-feed-section')}
              className="hover:text-pink-600 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              รีวิวและเครดิต
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('write-review-section')}
              className="hover:text-pink-600 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              เขียนรีวิว
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('contact-sidebar-section')}
              className="hover:text-pink-600 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              ช่องทางติดต่อ
            </button>
          </nav>

          {/* Zone 3: 1 Primary Action Button */}
          <div className="flex items-center shrink-0">
            {currentUser ? (
              <button
                type="button"
                onClick={onSwitchToAdmin}
                className="px-4 py-2 rounded-full text-xs sm:text-sm font-semibold text-white shadow-sm transition-transform active:scale-95 whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5"
                style={{ backgroundColor: storeSettings.primaryColor }}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>จัดการหลังบ้าน ({currentUser.name.split(' ')[0]})</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenLogin}
                className="px-4 py-2 rounded-full text-xs sm:text-sm font-semibold text-white shadow-sm transition-transform active:scale-95 whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5"
                style={{ backgroundColor: storeSettings.primaryColor }}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>เข้าสู่ระบบแอดมิน</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 flex-1 space-y-8">
        {/* Hero Welcome Banner (Pure Graphic Banner Image) */}
        <section className="flex justify-center">
          <div
            className="w-full max-w-2xl rounded-3xl p-2 bg-white shadow-sm border border-pink-100 overflow-hidden"
            style={{ backgroundColor: storeSettings.cardColor }}
          >
            <div className="relative rounded-2xl overflow-hidden bg-pink-50/70 flex items-center justify-center">
              <img
                src={storeSettings.bannerUrl}
                alt={storeSettings.storeName}
                referrerPolicy="no-referrer"
                className="w-full h-auto max-h-[300px] object-contain rounded-xl"
              />
            </div>
          </div>
        </section>

        {/* Two-Column Storefront Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT SIDEBAR: Store Info, Contact, Thai Clock, BGM Player */}
          <aside className="lg:col-span-4 space-y-4" id="contact-sidebar-section">
            {/* Store Profile Card */}
            <div
              className="rounded-3xl p-6 border border-pink-100 shadow-xs text-center space-y-5"
              style={{ backgroundColor: storeSettings.cardColor }}
            >
              {/* Avatar */}
              <div className="relative w-28 h-28 mx-auto">
                <div className="w-28 h-28 rounded-full p-1 bg-pink-100 border-2 border-pink-200 overflow-hidden shadow-xs">
                  <img
                    src={storeSettings.avatarUrl}
                    alt={storeSettings.storeName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full rounded-full object-cover bg-white"
                  />
                </div>
              </div>

              {/* Store Name & Rating Summary */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-center gap-1.5">
                  <h2 className="text-xl font-bold tracking-tight" style={{ color: storeSettings.textColor }}>
                    {storeSettings.storeName}
                  </h2>
                  <CheckCircle2 className="w-5 h-5 fill-pink-500 text-white shrink-0" />
                </div>

                <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-pink-600 tabular-nums">
                  <div className="flex items-center text-pink-500">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                  <span>{avgRating} / 5.0</span>
                  <span aria-hidden="true">·</span>
                  <span>{totalDisplayReviews} รีวิว</span>
                </div>
              </div>

              {/* Store Slogan */}
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                {storeSettings.storeSlogan}
              </p>

              {/* Business Hours Box */}
              <div className="bg-pink-50/50 rounded-2xl p-3.5 border border-pink-100/80 flex items-center gap-3 text-left">
                <div className="w-9 h-9 rounded-xl bg-pink-100/80 text-pink-600 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] text-stone-500">เวลาทำการ</p>
                  <p className="text-xs font-bold text-stone-800">{storeSettings.businessHours}</p>
                </div>
              </div>

              {/* Contact Channels */}
              <div className="space-y-2.5 text-left">
                <p className="text-xs font-bold text-stone-700">ช่องทางติดต่อร้านค้า (คลิกเพื่อเปิดลิงก์)</p>

                {storeSettings.enableLine && (
                  <div className="flex items-center justify-between p-2.5 rounded-2xl bg-emerald-50/60 hover:bg-emerald-50 border border-emerald-100 transition group">
                    <a
                      href={resolveContactUrl(
                        storeSettings.contactLineUrl,
                        storeSettings.contactLine || '@momilkshop',
                        'line'
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => onTrackContactClick('line')}
                      className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer"
                    >
                      <span className="w-7 h-7 rounded-lg bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-2xs">
                        LINE
                      </span>
                      <span className="text-xs font-semibold text-stone-700 truncate group-hover:text-emerald-700">
                        {storeSettings.contactLineName || storeSettings.contactLine || 'LINE Official'}
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 text-emerald-500/60 group-hover:text-emerald-600 shrink-0 ml-auto mr-1" />
                    </a>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyLine();
                      }}
                      title="คัดลอกไอดี"
                      className="px-2 py-1 rounded-lg bg-white hover:bg-emerald-100 text-stone-600 border border-emerald-200 text-[10px] font-medium flex items-center gap-1 transition cursor-pointer shrink-0 ml-1.5"
                    >
                      {copiedLine ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-600">คัดลอกแล้ว</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-stone-400" />
                          <span>คัดลอก</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {storeSettings.enableFb && (
                  <a
                    href={resolveContactUrl(
                      storeSettings.contactFbUrl,
                      storeSettings.contactFb || 'https://facebook.com',
                      'fb'
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => onTrackContactClick('fb')}
                    className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-blue-50/60 hover:bg-blue-50 border border-blue-100 transition cursor-pointer group text-left"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-7 h-7 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-2xs">
                        f
                      </span>
                      <span className="text-xs font-semibold text-stone-700 truncate group-hover:text-blue-700">
                        {storeSettings.contactFbName || storeSettings.contactFb || 'Facebook'}
                      </span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-stone-400 group-hover:text-blue-600 shrink-0 mr-1" />
                  </a>
                )}

                {storeSettings.enableIg && (
                  <a
                    href={resolveContactUrl(
                      storeSettings.contactIgUrl,
                      storeSettings.contactIg || 'https://instagram.com',
                      'ig'
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => onTrackContactClick('ig')}
                    className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-rose-50/60 hover:bg-rose-50 border border-rose-100 transition cursor-pointer group text-left"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-2xs">
                        IG
                      </span>
                      <span className="text-xs font-semibold text-stone-700 truncate group-hover:text-rose-700">
                        {storeSettings.contactIgName || storeSettings.contactIg || 'Instagram'}
                      </span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-stone-400 group-hover:text-rose-600 shrink-0 mr-1" />
                  </a>
                )}

                {storeSettings.enableOther && (storeSettings.contactOtherName || storeSettings.contactOtherUrl) && (
                  <a
                    href={resolveContactUrl(
                      storeSettings.contactOtherUrl,
                      'https://tiktok.com',
                      'other'
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => onTrackContactClick('line')}
                    className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-stone-50 hover:bg-stone-100 border border-stone-200 transition cursor-pointer group text-left"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-7 h-7 rounded-lg bg-stone-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-2xs">
                        ★
                      </span>
                      <span className="text-xs font-semibold text-stone-700 truncate group-hover:text-stone-900">
                        {storeSettings.contactOtherName || 'TikTok / อื่นๆ'}
                      </span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700 shrink-0 mr-1" />
                  </a>
                )}
              </div>

              {/* Trust Stats Footer inside Store Card */}
              <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-pink-50">
                <div className="bg-pink-50/40 rounded-2xl p-3 text-center">
                  <p className="text-sm font-bold text-pink-600 tabular-nums">
                    {storeSettings.deliverySuccessCount}
                  </p>
                  <p className="text-[11px] text-stone-500">จัดส่งสำเร็จ</p>
                </div>
                <div className="bg-pink-50/40 rounded-2xl p-3 text-center">
                  <p className="text-sm font-bold text-pink-600 tabular-nums">
                    {storeSettings.authenticGuarantee}
                  </p>
                  <p className="text-[11px] text-stone-500">ได้รับของแท้ชัวร์</p>
                </div>
              </div>
            </div>

            {/* Live Thailand Time GMT+7 Card */}
            <div
              className="rounded-2xl p-4 border border-pink-100 shadow-xs flex items-center gap-3.5"
              style={{ backgroundColor: storeSettings.cardColor }}
            >
              <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-500 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-stone-500">
                  เวลาปัจจุบัน (THAILAND TIME GMT+7)
                </p>
                <p className="text-xs sm:text-sm font-bold text-stone-800 tabular-nums truncate">
                  {thaiTimeStr}
                </p>
              </div>
            </div>

            {/* Website BGM Music Card */}
            <div
              className="rounded-2xl p-4 border border-pink-100 shadow-xs flex items-center justify-between gap-3"
              style={{ backgroundColor: storeSettings.cardColor }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-500 flex items-center justify-center shrink-0">
                  <Music className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-stone-500">เพลงประกอบเว็บไซต์</p>
                  <p className="text-xs font-bold text-stone-800 flex items-center gap-1.5 truncate">
                    {isPlayingBgm ? (
                      <>
                        <Volume2 className="w-3.5 h-3.5 text-pink-500 shrink-0 animate-pulse" />
                        <span className="text-pink-600 truncate">
                          {storeSettings.bgmAudioFileName || storeSettings.bgmAudioName || 'กำลังเล่นเพลง...'}
                        </span>
                      </>
                    ) : (
                      <>
                        <VolumeX className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span className="text-stone-500 truncate">
                          {storeSettings.bgmAudioFileName || storeSettings.bgmAudioName || 'ปิดเสียงเพลงประกอบอยู่'}
                        </span>
                      </>
                    )}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={toggleBgm}
                aria-label="เปิดหรือปิดเพลงประกอบ"
                className="w-10 h-10 rounded-full text-white flex items-center justify-center shadow-xs transition-transform active:scale-95 cursor-pointer shrink-0"
                style={{ backgroundColor: storeSettings.primaryColor }}
              >
                {isPlayingBgm ? (
                  <span className="text-xs font-bold">❚❚</span>
                ) : (
                  <span className="text-xs font-bold ml-0.5">▶</span>
                )}
              </button>
            </div>
          </aside>

          {/* RIGHT MAIN AREA: Write Review Form + Customer Reviews List */}
          <div className="lg:col-span-8 space-y-6">
            {/* Write a Service Review Card */}
            <section
              id="write-review-section"
              className="rounded-3xl p-6 sm:p-7 border border-pink-100 shadow-xs"
              style={{ backgroundColor: storeSettings.cardColor }}
            >
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-pink-50">
                <div className="flex items-center gap-2.5">
                  <MessageSquareHeart className="w-5 h-5 text-pink-500" />
                  <h2 className="text-base sm:text-lg font-bold text-stone-800">
                    เขียนรีวิวการให้บริการ
                  </h2>
                </div>
                <span className="text-xs text-stone-400">ข้อมูลบันทึกลงฐานข้อมูลเรียลไทม์</span>
              </div>

              {submitSuccess && (
                <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-medium flex items-center justify-between">
                  <span>{submitSuccess}</span>
                  <button
                    type="button"
                    onClick={() => setSubmitSuccess(null)}
                    className="text-emerald-600 hover:text-emerald-800 ml-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {formError && (
                <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-medium">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmitReview} className="space-y-5">
                {/* Row 1: Customer Name & Star Rating */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                  <div className="sm:col-span-7">
                    <label className="block text-xs font-bold text-stone-700 mb-2">
                      ชื่อของคุณ <span className="text-pink-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="กรอกชื่อของคุณหรือชื่อเล่น"
                      className="w-full px-4 py-2.5 rounded-xl bg-pink-50/30 border border-pink-100 focus:border-pink-400 focus:bg-white focus:outline-none text-sm text-stone-800 transition"
                    />
                  </div>

                  <div className="sm:col-span-5">
                    <label className="block text-xs font-bold text-stone-700 mb-2">
                      ให้คะแนนร้านค้า <span className="text-pink-500">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((starValue) => {
                          const active = (hoverRating ?? rating) >= starValue;
                          return (
                            <button
                              key={starValue}
                              type="button"
                              onMouseEnter={() => setHoverRating(starValue)}
                              onMouseLeave={() => setHoverRating(null)}
                              onClick={() => setRating(starValue)}
                              className="p-0.5 transition-transform hover:scale-110 cursor-pointer"
                            >
                              <Star
                                className={`w-6 h-6 ${
                                  active
                                    ? 'fill-pink-500 text-pink-500'
                                    : 'fill-stone-200 text-stone-200'
                                }`}
                              />
                            </button>
                          );
                        })}
                      </div>
                      <span className="text-xs font-bold text-pink-600 whitespace-nowrap tabular-nums">
                        {rating === 5 ? '5 ดาวเต็ม' : `${rating} ดาว`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Row 2: Service Type Selector */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-2">
                    ประเภทการบริการ <span className="text-pink-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3.5">
                    <button
                      type="button"
                      onClick={() => setServiceType('good')}
                      className={`py-3 px-4 rounded-2xl border text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                        serviceType === 'good'
                          ? 'border-pink-400 bg-pink-50/60 text-pink-600 shadow-2xs'
                          : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      <span
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                          serviceType === 'good' ? 'border-pink-500' : 'border-stone-300'
                        }`}
                      >
                        {serviceType === 'good' && (
                          <span className="w-2 h-2 rounded-full bg-pink-500" />
                        )}
                      </span>
                      <span>😊 บริการที่ดี</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setServiceType('bad')}
                      className={`py-3 px-4 rounded-2xl border text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                        serviceType === 'bad'
                          ? 'border-rose-400 bg-rose-50/60 text-rose-600 shadow-2xs'
                          : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      <span
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                          serviceType === 'bad' ? 'border-rose-500' : 'border-stone-300'
                        }`}
                      >
                        {serviceType === 'bad' && (
                          <span className="w-2 h-2 rounded-full bg-rose-500" />
                        )}
                      </span>
                      <span>☹️ บริการที่แย่</span>
                    </button>
                  </div>
                </div>

                {/* Row 3: Review Comment Textarea */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-2">
                    รายละเอียดการรีวิว <span className="text-pink-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="พิมพ์รีวิวเกี่ยวกับความประทับใจ หรือสิ่งที่ต้องการให้ทางร้านปรับปรุง..."
                    className="w-full px-4 py-3 rounded-2xl bg-pink-50/30 border border-pink-100 focus:border-pink-400 focus:bg-white focus:outline-none text-sm text-stone-800 transition"
                  />
                </div>

                {/* Row 4: Proof / Slip Attachment */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-2xl border border-pink-100 bg-pink-50/20 gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <ImageIcon className="w-4 h-4 text-pink-400 shrink-0 ml-1" />
                    <span className="text-xs text-stone-600 truncate">
                      {proofFileName
                        ? `แนบไฟล์แล้ว: ${proofFileName}`
                        : 'แนบภาพหลักฐาน / สลิป (ถ้ามี)'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    {proofImageUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setProofImageUrl(undefined);
                          setProofFileName('');
                        }}
                        className="px-2.5 py-1 rounded-xl text-xs text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      >
                        ลบภาพ
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleAttachSampleSlip}
                      className="px-3 py-1.5 rounded-xl border border-pink-200 bg-pink-50/70 hover:bg-pink-100 text-pink-600 text-xs font-medium transition cursor-pointer whitespace-nowrap"
                    >
                      ใช้สลิปตัวอย่าง
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-1.5 rounded-xl border border-pink-200 bg-white hover:bg-pink-50 text-pink-600 text-xs font-medium transition cursor-pointer whitespace-nowrap"
                    >
                      เลือกรูปภาพ
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl text-white font-bold text-sm shadow-md shadow-pink-200/80 hover:opacity-95 transition flex items-center justify-center gap-2 cursor-pointer"
                  style={{
                    background: `linear-gradient(90deg, ${storeSettings.primaryColor}, #EC4899)`,
                  }}
                >
                  <Send className="w-4 h-4" />
                  <span>ส่งรีวิว</span>
                </button>
              </form>
            </section>

            {/* Customer Reviews Feed Card */}
            <section
              id="reviews-feed-section"
              className="rounded-3xl p-6 sm:p-7 border border-pink-100 shadow-xs space-y-5"
              style={{ backgroundColor: storeSettings.cardColor }}
            >
              {/* Header & Interactive Filter Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-pink-50">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-pink-500" />
                  <h2 className="text-base sm:text-lg font-bold text-stone-800 tabular-nums">
                    รีวิวจากลูกค้า ( {totalDisplayReviews} )
                  </h2>
                </div>

                {/* Interactive Filter Tabs */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setReviewFilter('all');
                      setCurrentPage(1);
                    }}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer whitespace-nowrap tabular-nums ${
                      reviewFilter === 'all'
                        ? 'text-white shadow-2xs'
                        : 'bg-stone-100 text-stone-600 hover:bg-pink-50 hover:text-pink-600'
                    }`}
                    style={
                      reviewFilter === 'all'
                        ? { backgroundColor: storeSettings.primaryColor }
                        : undefined
                    }
                  >
                    ทั้งหมด ({totalDisplayReviews})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReviewFilter('good');
                      setCurrentPage(1);
                    }}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer whitespace-nowrap tabular-nums ${
                      reviewFilter === 'good'
                        ? 'text-white shadow-2xs'
                        : 'bg-stone-100 text-stone-600 hover:bg-pink-50 hover:text-pink-600'
                    }`}
                    style={
                      reviewFilter === 'good'
                        ? { backgroundColor: storeSettings.primaryColor }
                        : undefined
                    }
                  >
                    บริการที่ดี ({goodDisplayCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReviewFilter('bad');
                      setCurrentPage(1);
                    }}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer whitespace-nowrap tabular-nums ${
                      reviewFilter === 'bad'
                        ? 'bg-rose-500 text-white shadow-2xs'
                        : 'bg-stone-100 text-stone-600 hover:bg-rose-50 hover:text-rose-600'
                    }`}
                  >
                    บริการที่แย่ ({badDisplayCount})
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="ค้นหารีวิวจากชื่อลูกค้า หรือคำสำคัญ..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-pink-50/25 border border-pink-100 text-xs sm:text-sm text-stone-700 focus:outline-none focus:border-pink-300"
                />
              </div>

              {/* Review Cards List */}
              {paginatedReviews.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <p className="text-sm font-semibold text-stone-600">
                    ไม่พบรายการรีวิวที่ตรงกับเงื่อนไขการค้นหา
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setReviewFilter('all');
                      setSearchQuery('');
                    }}
                    className="text-xs font-semibold text-pink-600 underline cursor-pointer"
                  >
                    แสดงรีวิวทั้งหมด
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {paginatedReviews.map((item) => (
                    <article
                      key={item.id}
                      className="p-5 rounded-2xl border border-pink-100/90 bg-white space-y-3 transition hover:border-pink-200"
                    >
                      {/* Top Metadata Row */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-bold text-sm text-stone-800">
                            {item.customerName}
                          </span>
                          <span aria-hidden="true" className="text-stone-300">
                            ·
                          </span>
                          <span
                            className={`font-medium ${
                              item.serviceType === 'good' ? 'text-pink-600' : 'text-rose-600'
                            }`}
                          >
                            {item.serviceType === 'good' ? '😊 บริการที่ดี' : '☹️ บริการที่แย่'}
                          </span>
                          {item.verifiedSlip && (
                            <>
                              <span aria-hidden="true" className="text-stone-300">
                                ·
                              </span>
                              <span className="text-emerald-600 font-medium">
                                ✓ ยืนยันสลิปแล้ว
                              </span>
                            </>
                          )}
                          {item.isPinned && (
                            <>
                              <span aria-hidden="true" className="text-stone-300">
                                ·
                              </span>
                              <span className="text-amber-600 font-medium">★ รีวิวแนะนำ</span>
                            </>
                          )}
                        </div>
                        <time className="text-[11px] text-stone-400 tabular-nums">
                          {item.createdAt}
                        </time>
                      </div>

                      {/* Star Row */}
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= item.rating
                                ? 'fill-pink-400 text-pink-400'
                                : 'fill-stone-200 text-stone-200'
                            }`}
                          />
                        ))}
                      </div>

                      {/* Comment Body */}
                      <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
                        {item.comment}
                      </p>

                      {/* Proof Image Thumbnail */}
                      {item.proofImageUrl && (
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => setPreviewSlipUrl(item.proofImageUrl!)}
                            className="inline-flex items-center gap-2 text-xs text-pink-600 hover:text-pink-700 font-medium underline cursor-pointer"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>ดูรูปภาพหลักฐาน / สลิปที่แนบ</span>
                          </button>
                        </div>
                      )}

                      {/* Admin Reply Box */}
                      {item.adminReply && (
                        <div className="mt-2 p-3.5 rounded-xl bg-pink-50/50 border border-pink-100 text-xs space-y-1">
                          <p className="font-bold text-pink-700">
                            ตอบกลับจากร้าน {storeSettings.storeName}:
                          </p>
                          <p className="text-stone-600 leading-relaxed">{item.adminReply}</p>
                        </div>
                      )}

                      {/* Like Action Button */}
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => onToggleLike(item.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium transition cursor-pointer tabular-nums ${
                            item.likedByMe
                              ? 'border-pink-300 bg-pink-50 text-pink-600'
                              : 'border-stone-200 bg-white text-stone-600 hover:border-pink-200 hover:text-pink-600'
                          }`}
                        >
                          <Heart
                            className={`w-3.5 h-3.5 ${
                              item.likedByMe ? 'fill-pink-500 text-pink-500' : ''
                            }`}
                          />
                          <span>ถูกใจ ( {item.likes} )</span>
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {/* Pagination Controls */}
              <div className="flex items-center justify-center gap-2 pt-3">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="w-8 h-8 rounded-full border border-pink-100 flex items-center justify-center text-stone-500 hover:bg-pink-50 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-full text-xs font-bold transition cursor-pointer tabular-nums ${
                      currentPage === pageNum
                        ? 'text-white shadow-2xs'
                        : 'border border-pink-100 bg-white text-stone-600 hover:bg-pink-50'
                    }`}
                    style={
                      currentPage === pageNum
                        ? { backgroundColor: storeSettings.primaryColor }
                        : undefined
                    }
                  >
                    {pageNum}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="w-8 h-8 rounded-full border border-pink-100 flex items-center justify-center text-stone-500 hover:bg-pink-50 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Clean Footer */}
      <footer className="bg-white border-t border-pink-100 py-8 px-4 text-center space-y-1.5 mt-12">
        <p className="text-xs sm:text-sm font-bold" style={{ color: storeSettings.primaryColor }}>
          {storeSettings.storeName} - {storeSettings.businessHours}
        </p>
        <p className="text-xs text-stone-500">
          ขอบคุณลูกค้าทุกท่านที่ไว้วางใจและสนับสนุนร้านของเราเสมอมา ❤️
        </p>
        <p className="text-[11px] text-stone-400 tabular-nums">
          © 2026 {storeSettings.storeName}. All rights reserved.
        </p>
      </footer>

      {/* Proof / Slip Lightbox Modal */}
      {previewSlipUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPreviewSlipUrl(null)}
        >
          <div
            className="bg-white rounded-3xl p-4 max-w-md w-full space-y-3 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-pink-100 pb-2.5">
              <h3 className="text-sm font-bold text-stone-800">
                หลักฐานการโอนเงิน / รูปภาพประกอบรีวิว
              </h3>
              <button
                type="button"
                onClick={() => setPreviewSlipUrl(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden bg-pink-50/30 flex items-center justify-center max-h-[70vh]">
              <img
                src={previewSlipUrl}
                alt="Slip Proof"
                referrerPolicy="no-referrer"
                className="max-h-[65vh] w-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* Floating BGM Quick Controller */}
      {storeSettings.enableBgm && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-30 flex items-center gap-2">
          <button
            type="button"
            onClick={toggleBgm}
            title={isPlayingBgm ? 'คลิกเพื่อหยุดเพลงชั่วคราว' : 'คลิกเพื่อเล่นเพลง'}
            className={`px-3.5 py-2.5 rounded-full shadow-lg border backdrop-blur-md transition-all flex items-center gap-2 text-xs font-semibold cursor-pointer ${
              isPlayingBgm
                ? 'bg-white/95 border-pink-200 text-pink-700 shadow-pink-100/80 hover:bg-pink-50'
                : waitingForInteraction
                ? 'bg-gradient-to-r from-pink-500 to-rose-400 text-white border-white/40 shadow-pink-300 animate-pulse hover:brightness-105'
                : 'bg-stone-900/85 text-white border-stone-700 hover:bg-stone-800'
            }`}
          >
            <Music className={`w-3.5 h-3.5 ${isPlayingBgm ? 'animate-bounce text-pink-500' : 'text-white'}`} />
            <span className="truncate max-w-[150px] sm:max-w-[200px]">
              {isPlayingBgm
                ? (storeSettings.bgmAudioName || storeSettings.bgmAudioFileName || 'เพลงคลอหน้าร้าน')
                : waitingForInteraction
                ? '✨ แตะที่ใดก็ได้เพื่อเปิดเพลง'
                : 'เปิดเพลงประกอบ'}
            </span>
            <span className="w-5 h-5 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center text-[10px] ml-0.5 shrink-0">
              {isPlayingBgm ? '❚❚' : '▶'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
