import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  AdminRole,
  DatabaseSchema,
  ReviewItem,
  StoreSettings,
  UserAccount,
} from './types/database';
import {
  DEFAULT_MASCOT_SVG,
  INITIAL_DATABASE,
  ROLE_PERMISSIONS_MAP,
} from './data/initialDatabase';
import { StorefrontView } from './components/StorefrontView';
import { AdminDashboardView } from './components/AdminDashboardView';
import { AdminLoginModal } from './components/AdminLoginModal';
import { supabase } from './lib/supabase';

const STORAGE_KEY = 'momilk_shop_fullstack_db_v1';

export default function App() {
  const [db, setDb] = useState<DatabaseSchema>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved) as DatabaseSchema;
      }
    } catch {
      // fallback
    }
    return INITIAL_DATABASE;
  });

  const [viewMode, setViewMode] = useState<'storefront' | 'admin'>('storefront');
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const isBackendAvailableRef = useRef<boolean | null>(null);

  // Restore an authenticated admin session on refresh. Demo/localStorage users
  // are deliberately never accepted as proof of administrator access.
  useEffect(() => {
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      setCurrentUser(null);
      return;
    }

    let active = true;
    const loadAdminFromSession = async (session: { user: { id: string; email?: string } } | null) => {
      if (!session) {
        if (active) setCurrentUser(null);
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('id,display_name,username,role,status')
          .eq('id', session.user.id)
          .maybeSingle();

        if (error) throw error;
        const role = profile?.role as AdminRole | undefined;
        if (!profile || profile.status !== 'active' || !role || role === 'customer') {
          if (active) setCurrentUser(null);
          return;
        }

        const roleConfig = ROLE_PERMISSIONS_MAP[role];
        const user: UserAccount = {
          id: profile.id,
          name: profile.display_name || session.user.email || 'Admin',
          username: profile.username || (session.user.email || '').split('@')[0],
          email: session.user.email || '',
          role,
          roleLabel: roleConfig.label,
          avatarUrl: DEFAULT_MASCOT_SVG,
          status: 'active',
          totalReviews: 0,
          lastActive: new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }),
          permissions: roleConfig.permissions,
        };
        if (active) setCurrentUser(user);
      } catch (error) {
        console.error('[MOMILK] Unable to restore admin session:', error);
        if (active) setCurrentUser(null);
      }
    };

    void supabase.auth.getSession().then(({ data, error }) => {
      if (error) console.error('[MOMILK] Unable to read auth session:', error);
      return loadAdminFromSession(data?.session ?? null);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      // Defer database work until after Supabase finishes its auth callback.
      Promise.resolve().then(() => loadAdminFromSession(session));
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Sync from Express backend API if running
  useEffect(() => {
    fetch('/api/db')
      .then((res) => {
        if (res.ok) {
          isBackendAvailableRef.current = true;
          return res.status === 204 ? null : res.json();
        }
        isBackendAvailableRef.current = false;
        return null;
      })
      .then((serverDb: DatabaseSchema | null) => {
        if (serverDb && serverDb.storeSettings && Array.isArray(serverDb.reviews)) {
          setDb(serverDb);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(serverDb));
          } catch {
            // ignore
          }
        }
      })
      .catch(() => {
        isBackendAvailableRef.current = false;
      });
  }, []);

  // Persist helper that updates React state, localStorage, and Express server DB
  const commitDatabase = useCallback((updater: (prev: DatabaseSchema) => DatabaseSchema) => {
    setDb((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      if (isBackendAvailableRef.current !== false) {
        fetch('/api/db', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(next),
        })
          .then((res) => {
            if (!res.ok) {
              isBackendAvailableRef.current = false;
            }
          })
          .catch(() => {
            isBackendAvailableRef.current = false;
          });
      }
      return next;
    });
  }, []);

  const formatThaiTimestamp = () => {
    try {
      const now = new Date();
      const dateStr = now.toLocaleDateString('th-TH', {
        timeZone: 'Asia/Bangkok',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      const timeStr = now.toLocaleTimeString('th-TH', {
        timeZone: 'Asia/Bangkok',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      return `${dateStr} ${timeStr} น.`;
    } catch {
      return '23 ต.ค. 2569 14:30 น.';
    }
  };

  // Add new customer review from Storefront
  const handleAddReview = (
    newRevData: Omit<ReviewItem, 'id' | 'likes' | 'createdAt' | 'timestampMs' | 'status'>
  ) => {
    const timestampStr = formatThaiTimestamp();
    const newReview: ReviewItem = {
      ...newRevData,
      id: `rev-${Date.now()}`,
      likes: 1,
      likedByMe: true,
      createdAt: timestampStr,
      timestampMs: Date.now(),
      status: db.storeSettings.requireReviewApproval ? 'pending' : 'approved',
    };

    commitDatabase((prev) => {
      const updatedDaily = prev.analytics.dailyStats.map((d, idx, arr) =>
        idx === arr.length - 1 ? { ...d, reviews: d.reviews + 1 } : d
      );

      const existingCustomer = prev.users.find(
        (u) => u.name.toLowerCase() === newRevData.customerName.toLowerCase()
      );
      const updatedUsers = existingCustomer
        ? prev.users.map((u) =>
            u.id === existingCustomer.id
              ? { ...u, totalReviews: u.totalReviews + 1, lastActive: timestampStr }
              : u
          )
        : [
            ...prev.users,
            {
              id: `usr-cust-${Date.now()}`,
              name: newRevData.customerName,
              username: newRevData.customerName.replace(/\s+/g, '_').toLowerCase(),
              email: `${newRevData.customerName.replace(/\s+/g, '').toLowerCase()}@customer.momilk.shop`,
              role: 'customer' as AdminRole,
              roleLabel: 'ลูกค้าสมาชิกใหม่',
              avatarUrl: DEFAULT_MASCOT_SVG,
              status: 'active' as const,
              totalReviews: 1,
              lastActive: timestampStr,
              permissions: ROLE_PERMISSIONS_MAP.customer.permissions,
            },
          ];

      return {
        ...prev,
        reviews: [newReview, ...prev.reviews],
        users: updatedUsers,
        analytics: {
          ...prev.analytics,
          totalViews: prev.analytics.totalViews + 1,
          dailyStats: updatedDaily,
          liveEvents: [
            {
              id: `evt-${Date.now()}`,
              type: 'review',
              message: `เขียนรีวิว ${newReview.rating} ดาว (${
                newReview.serviceType === 'good' ? 'บริการที่ดี' : 'บริการที่แย่'
              })`,
              timestamp: timestampStr,
              actor: newReview.customerName,
            },
            ...prev.analytics.liveEvents,
          ],
        },
      };
    });
  };

  // Toggle Like on a review
  const handleToggleLike = (reviewId: string) => {
    const timestampStr = formatThaiTimestamp();
    commitDatabase((prev) => {
      let targetAuthor = 'ลูกค้า';
      const updatedReviews = prev.reviews.map((r) => {
        if (r.id !== reviewId) return r;
        targetAuthor = r.customerName;
        const nextLiked = !r.likedByMe;
        return {
          ...r,
          likedByMe: nextLiked,
          likes: nextLiked ? r.likes + 1 : Math.max(0, r.likes - 1),
        };
      });

      const updatedDaily = prev.analytics.dailyStats.map((d, idx, arr) =>
        idx === arr.length - 1 ? { ...d, likes: d.likes + 1 } : d
      );

      return {
        ...prev,
        reviews: updatedReviews,
        analytics: {
          ...prev.analytics,
          dailyStats: updatedDaily,
          liveEvents: [
            {
              id: `evt-${Date.now()}`,
              type: 'like',
              message: `กดถูกใจรีวิวของ ${targetAuthor}`,
              timestamp: timestampStr,
              actor: currentUser ? currentUser.name : 'ผู้เยี่ยมชมหน้าร้าน',
            },
            ...prev.analytics.liveEvents,
          ],
        },
      };
    });
  };

  // Track Contact Click (LINE / FB / IG)
  const handleTrackContactClick = (channel: 'line' | 'fb' | 'ig') => {
    const timestampStr = formatThaiTimestamp();
    commitDatabase((prev) => {
      const updatedDaily = prev.analytics.dailyStats.map((d, idx, arr) =>
        idx === arr.length - 1 ? { ...d, contactClicks: d.contactClicks + 1 } : d
      );
      return {
        ...prev,
        analytics: {
          ...prev.analytics,
          lineClicks: channel === 'line' ? prev.analytics.lineClicks + 1 : prev.analytics.lineClicks,
          fbClicks: channel === 'fb' ? prev.analytics.fbClicks + 1 : prev.analytics.fbClicks,
          igClicks: channel === 'ig' ? prev.analytics.igClicks + 1 : prev.analytics.igClicks,
          dailyStats: updatedDaily,
          liveEvents: [
            {
              id: `evt-${Date.now()}`,
              type: 'contact_click',
              message: `คลิกช่องทางติดต่อ ${channel.toUpperCase()} จากหน้าเว็บ`,
              timestamp: timestampStr,
              actor: 'ผู้เยี่ยมชมหน้าร้าน',
            },
            ...prev.analytics.liveEvents,
          ],
        },
      };
    });
  };

  // Save Store Settings from Admin Customizer
  const handleSaveStoreSettings = (newSettings: StoreSettings) => {
    const timestampStr = formatThaiTimestamp();
    commitDatabase((prev) => ({
      ...prev,
      storeSettings: newSettings,
      analytics: {
        ...prev.analytics,
        liveEvents: [
          {
            id: `evt-${Date.now()}`,
            type: 'admin_action',
            message: `บันทึกการตั้งค่าหน้าร้าน "${newSettings.storeName}" และอัปเดตสีธีม`,
            timestamp: timestampStr,
            actor: currentUser?.name || 'แอดมิน',
          },
          ...prev.analytics.liveEvents,
        ],
      },
    }));
  };

  // Admin Review Moderation
  const handleUpdateReview = (reviewId: string, patch: Partial<ReviewItem>) => {
    const timestampStr = formatThaiTimestamp();
    commitDatabase((prev) => ({
      ...prev,
      reviews: prev.reviews.map((r) => (r.id === reviewId ? { ...r, ...patch } : r)),
      analytics: {
        ...prev.analytics,
        liveEvents: [
          {
            id: `evt-${Date.now()}`,
            type: 'admin_action',
            message: `อัปเดตสถานะ/คำตอบรีวิวรหัส ${reviewId}`,
            timestamp: timestampStr,
            actor: currentUser?.name || 'แอดมิน',
          },
          ...prev.analytics.liveEvents,
        ],
      },
    }));
  };

  const handleDeleteReview = (reviewId: string) => {
    const timestampStr = formatThaiTimestamp();
    commitDatabase((prev) => ({
      ...prev,
      reviews: prev.reviews.filter((r) => r.id !== reviewId),
      analytics: {
        ...prev.analytics,
        liveEvents: [
          {
            id: `evt-${Date.now()}`,
            type: 'admin_action',
            message: `ลบรายการรีวิวรหัส ${reviewId} ออกจากฐานข้อมูล`,
            timestamp: timestampStr,
            actor: currentUser?.name || 'Super Admin',
          },
          ...prev.analytics.liveEvents,
        ],
      },
    }));
  };

  // RBAC User Management
  const handleAddUser = (
    newUser: Omit<UserAccount, 'id' | 'lastActive' | 'totalReviews' | 'permissions'>
  ) => {
    const timestampStr = formatThaiTimestamp();
    const created: UserAccount = {
      ...newUser,
      id: `usr-${Date.now()}`,
      lastActive: timestampStr,
      totalReviews: 0,
      permissions: ROLE_PERMISSIONS_MAP[newUser.role].permissions,
    };
    commitDatabase((prev) => ({
      ...prev,
      users: [created, ...prev.users],
      analytics: {
        ...prev.analytics,
        liveEvents: [
          {
            id: `evt-${Date.now()}`,
            type: 'admin_action',
            message: `เพิ่มผู้ใช้งานใหม่ "${created.name}" (${created.roleLabel})`,
            timestamp: timestampStr,
            actor: currentUser?.name || 'Super Admin',
          },
          ...prev.analytics.liveEvents,
        ],
      },
    }));
  };

  const handleUpdateUserRole = (userId: string, newRole: AdminRole) => {
    commitDatabase((prev) => {
      const updatedUsers = prev.users.map((u) =>
        u.id === userId
          ? {
              ...u,
              role: newRole,
              roleLabel: ROLE_PERMISSIONS_MAP[newRole].label,
              permissions: ROLE_PERMISSIONS_MAP[newRole].permissions,
            }
          : u
      );
      const updatedSelf = updatedUsers.find((u) => u.id === currentUser?.id);
      if (updatedSelf) setCurrentUser(updatedSelf);
      return { ...prev, users: updatedUsers };
    });
  };

  const handleToggleUserStatus = (userId: string) => {
    commitDatabase((prev) => ({
      ...prev,
      users: prev.users.map((u) =>
        u.id === userId
          ? { ...u, status: u.status === 'active' ? 'suspended' : 'active' }
          : u
      ),
    }));
  };

  // Real-time Analytics Simulator
  const handleSimulateRealtimeEvent = useCallback(() => {
    const timestampStr = formatThaiTimestamp();
    const sampleActors = ['คุณแพรวา_สายหวาน', 'น้องมายด์_BKK', 'คุณนนท์_VIP', 'ผู้เยี่ยมชมใหม่ #918'];
    const actor = sampleActors[Math.floor(Math.random() * sampleActors.length)];

    commitDatabase((prev) => {
      const updatedDaily = prev.analytics.dailyStats.map((d, idx, arr) =>
        idx === arr.length - 1
          ? {
              ...d,
              views: d.views + Math.floor(Math.random() * 6) + 2,
              likes: d.likes + 1,
              contactClicks: d.contactClicks + (Math.random() > 0.5 ? 1 : 0),
            }
          : d
      );
      return {
        ...prev,
        analytics: {
          ...prev.analytics,
          totalViews: prev.analytics.totalViews + Math.floor(Math.random() * 6) + 2,
          activeVisitorsNow: Math.max(
            8,
            Math.min(45, prev.analytics.activeVisitorsNow + (Math.random() > 0.45 ? 2 : -1))
          ),
          lineClicks: prev.analytics.lineClicks + (Math.random() > 0.5 ? 1 : 0),
          dailyStats: updatedDaily,
          liveEvents: [
            {
              id: `evt-${Date.now()}`,
              type: 'visit',
              message: 'เข้าชมหน้าร้านและกดดูรีวิวเครดิตความน่าเชื่อถือ',
              timestamp: timestampStr,
              actor,
            },
            ...prev.analytics.liveEvents.slice(0, 25),
          ],
        },
      };
    });
  }, [commitDatabase]);

  // Reset full database
  const handleResetDatabase = () => {
    fetch('/api/db/reset', { method: 'POST' })
      .then((res) => res.json())
      .then((data) => {
        if (data?.db) {
          setDb(data.db);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data.db));
        }
      })
      .catch(() => {
        setDb(INITIAL_DATABASE);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DATABASE));
      });
  };

  return (
    <>
      {viewMode === 'storefront' || !currentUser ? (
        <StorefrontView
          db={db}
          currentUser={currentUser}
          onOpenLogin={() => setIsLoginModalOpen(true)}
          onSwitchToAdmin={() => {
            if (currentUser) {
              setViewMode('admin');
            } else {
              setIsLoginModalOpen(true);
            }
          }}
          onAddReview={handleAddReview}
          onToggleLike={handleToggleLike}
          onTrackContactClick={handleTrackContactClick}
        />
      ) : (
        <AdminDashboardView
          db={db}
          currentUser={currentUser}
          onSwitchToStorefront={() => setViewMode('storefront')}
          onLogout={() => {
            void supabase.auth.signOut();
            setCurrentUser(null);
            setViewMode('storefront');
          }}
          onSwitchUserRole={(user) => setCurrentUser(user)}
          onSaveStoreSettings={handleSaveStoreSettings}
          onUpdateReview={handleUpdateReview}
          onDeleteReview={handleDeleteReview}
          onAddUser={handleAddUser}
          onUpdateUserRole={handleUpdateUserRole}
          onToggleUserStatus={handleToggleUserStatus}
          onSimulateRealtimeEvent={handleSimulateRealtimeEvent}
          onResetDatabase={handleResetDatabase}
        />
      )}

      {isLoginModalOpen && (
        <AdminLoginModal
          onClose={() => setIsLoginModalOpen(false)}
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            setIsLoginModalOpen(false);
            setViewMode('admin');
          }}
        />
      )}
    </>
  );
}
