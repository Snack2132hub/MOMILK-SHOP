export type AdminRole = 'super_admin' | 'editor' | 'viewer' | 'customer';

export interface RolePermissions {
  canEditStore: boolean;
  canModerateReviews: boolean;
  canDeleteReviews: boolean;
  canManageUsers: boolean;
  canExportDatabase: boolean;
}

export interface UserAccount {
  id: string;
  name: string;
  username: string;
  email: string;
  password?: string;
  role: AdminRole;
  roleLabel: string;
  avatarUrl: string;
  status: 'active' | 'suspended';
  totalReviews: number;
  lastActive: string;
  permissions: RolePermissions;
}

export interface ReviewItem {
  id: string;
  customerName: string;
  customerHandle?: string;
  rating: number;
  serviceType: 'good' | 'bad';
  comment: string;
  proofImageUrl?: string;
  likes: number;
  likedByMe?: boolean;
  createdAt: string;
  timestampMs: number;
  status: 'approved' | 'pending' | 'hidden';
  isPinned?: boolean;
  adminReply?: string;
  verifiedSlip?: boolean;
}

export interface StoreSettings {
  storeName: string;
  heroTitle: string;
  businessHours: string;
  storeCategory: string;
  storeSlogan: string;
  logoUrl: string;
  avatarUrl: string;
  bannerUrl: string;
  primaryColor: string;
  bgColor: string;
  cardColor: string;
  textColor: string;
  contactLineName: string;
  contactLineUrl: string;
  enableLine: boolean;
  contactFbName: string;
  contactFbUrl: string;
  enableFb: boolean;
  contactIgName: string;
  contactIgUrl: string;
  enableIg: boolean;
  contactOtherName?: string;
  contactOtherUrl?: string;
  enableOther?: boolean;
  // Backward compatibility fields
  contactLine?: string;
  contactFb?: string;
  contactIg?: string;
  bgmAudioUrl: string;
  bgmAudioFileName?: string;
  bgmAudioName?: string;
  enableBgm: boolean;
  autoplayBgm?: boolean;
  enableBubbleEffect?: boolean;
  deliverySuccessCount: string;
  authenticGuarantee: string;
  isStoreOnline: boolean;
  requireReviewApproval: boolean;
  updatedAt: string;
}

export interface DailyStat {
  date: string;
  views: number;
  reviews: number;
  likes: number;
  contactClicks: number;
}

export interface LiveEventLog {
  id: string;
  type: 'review' | 'like' | 'visit' | 'contact_click' | 'admin_action';
  message: string;
  timestamp: string;
  actor: string;
}

export interface DatabaseSchema {
  storeSettings: StoreSettings;
  reviews: ReviewItem[];
  users: UserAccount[];
  analytics: {
    totalViews: number;
    activeVisitorsNow: number;
    lineClicks: number;
    fbClicks: number;
    igClicks: number;
    dailyStats: DailyStat[];
    liveEvents: LiveEventLog[];
  };
}
