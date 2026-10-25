import { DatabaseSchema, RolePermissions, AdminRole } from '../types/database';

export const ROLE_PERMISSIONS_MAP: Record<AdminRole, { label: string; permissions: RolePermissions }> = {
  super_admin: {
    label: 'ผู้ดูแลระบบสูงสุด (Super Admin)',
    permissions: {
      canEditStore: true,
      canModerateReviews: true,
      canDeleteReviews: true,
      canManageUsers: true,
      canExportDatabase: true,
    },
  },
  editor: {
    label: 'แอดมินดูแลร้าน (Store Editor)',
    permissions: {
      canEditStore: true,
      canModerateReviews: true,
      canDeleteReviews: false,
      canManageUsers: false,
      canExportDatabase: true,
    },
  },
  viewer: {
    label: 'นักวิเคราะห์สถิติ (Analytics Viewer)',
    permissions: {
      canEditStore: false,
      canModerateReviews: false,
      canDeleteReviews: false,
      canManageUsers: false,
      canExportDatabase: false,
    },
  },
  customer: {
    label: 'ลูกค้าสมาชิก (Verified Customer)',
    permissions: {
      canEditStore: false,
      canModerateReviews: false,
      canDeleteReviews: false,
      canManageUsers: false,
      canExportDatabase: false,
    },
  },
};

// High-craft SVG data URIs for crisp, zero-broken-image fallbacks and cute pastel branding
export const DEFAULT_MASCOT_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFE3EC"/>
      <stop offset="100%" stop-color="#FFC2D4"/>
    </linearGradient>
    <linearGradient id="hair" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#8F6570"/>
      <stop offset="100%" stop-color="#6B4851"/>
    </linearGradient>
  </defs>
  <circle cx="120" cy="120" r="116" fill="url(#bg)" stroke="#FFFFFF" stroke-width="6"/>
  <circle cx="48" cy="58" r="4" fill="#FF85A2"/>
  <circle cx="192" cy="68" r="5" fill="#FF85A2"/>
  <circle cx="185" cy="175" r="4" fill="#FFFFFF"/>
  <!-- Cute Anime Mascot Silhouette & Face -->
  <ellipse cx="120" cy="128" rx="64" ry="68" fill="url(#hair)"/>
  <path d="M72 185 Q120 220 168 185 L178 228 L62 228 Z" fill="#FF85A2"/>
  <ellipse cx="120" cy="132" rx="46" ry="44" fill="#FFF5F0"/>
  <!-- Bangs -->
  <path d="M74 118 Q95 85 120 112 Q145 85 166 118 Q160 80 120 75 Q80 80 74 118 Z" fill="url(#hair)"/>
  <!-- Cute Ribbon -->
  <path d="M148 76 L168 66 L164 88 Z" fill="#FF6B8F"/>
  <path d="M148 76 L132 64 L134 86 Z" fill="#FF6B8F"/>
  <circle cx="149" cy="76" r="5" fill="#FFF0F3"/>
  <!-- Eyes -->
  <ellipse cx="102" cy="134" rx="5.5" ry="6.5" fill="#4A3E3D"/>
  <ellipse cx="138" cy="134" rx="5.5" ry="6.5" fill="#4A3E3D"/>
  <circle cx="100" cy="131" r="2" fill="#FFFFFF"/>
  <circle cx="136" cy="131" r="2" fill="#FFFFFF"/>
  <!-- Blush -->
  <ellipse cx="92" cy="145" rx="8" ry="4.5" fill="#FFA2B5" opacity="0.7"/>
  <ellipse cx="148" cy="145" rx="8" ry="4.5" fill="#FFA2B5" opacity="0.7"/>
  <!-- Smile -->
  <path d="M114 146 Q120 152 126 146" fill="none" stroke="#4A3E3D" stroke-width="2.5" stroke-linecap="round"/>
  <!-- Badge Text -->
  <rect x="56" y="186" width="128" height="28" rx="14" fill="#FFFFFF" opacity="0.92"/>
  <text x="120" y="205" font-family="Prompt, sans-serif" font-size="13" font-weight="700" fill="#E84D74" text-anchor="middle">MOMILK SHOP ♥</text>
</svg>
`)}`;

export const DEFAULT_BANNER_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 340">
  <defs>
    <linearGradient id="bannerBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFF0F5"/>
      <stop offset="50%" stop-color="#FFE3EC"/>
      <stop offset="100%" stop-color="#FCE4EC"/>
    </linearGradient>
    <pattern id="polka" x="0" y="0" width="36" height="36" patternUnits="userSpaceOnUse">
      <circle cx="10" cy="10" r="2.5" fill="#FFCCD6" opacity="0.6"/>
      <circle cx="28" cy="26" r="2" fill="#FFB3C6" opacity="0.45"/>
    </pattern>
  </defs>
  <!-- Background with delicate borders -->
  <rect width="900" height="340" rx="30" fill="url(#bannerBg)"/>
  <rect width="900" height="340" rx="30" fill="url(#polka)"/>
  <rect x="8" y="8" width="884" height="324" rx="24" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-dasharray="10,8" opacity="0.7"/>

  <!-- Left Side Artistic Typography & Sparkles -->
  <g transform="translate(60, 45)">
    <!-- Decorative Stars -->
    <path d="M40 30 L43 45 L58 48 L43 51 L40 66 L37 51 L22 48 L37 45 Z" fill="#FF85A2" opacity="0.75"/>
    <path d="M430 40 L432 50 L442 52 L432 54 L430 64 L428 54 L418 52 L428 50 Z" fill="#FF85A2" opacity="0.75"/>
    <circle cx="460" cy="140" r="4" fill="#FFA2B5"/>
    <circle cx="20" cy="180" r="3.5" fill="#FFA2B5"/>

    <!-- Cute Welcome to -->
    <text x="240" y="55" font-family="'Prompt', sans-serif" font-size="36" font-weight="700" fill="#8F6570" text-anchor="middle" letter-spacing="4">welcome to</text>
    
    <!-- Big MOMILK SHOP Bubble Title -->
    <text x="240" y="118" font-family="'Prompt', sans-serif" font-size="52" font-weight="800" fill="#FF6B8F" text-anchor="middle" letter-spacing="3" stroke="#FFFFFF" stroke-width="6" paint-order="stroke fill">MOMILK SHOP</text>
    
    <!-- Business Hours Pill Graphic -->
    <rect x="80" y="148" width="320" height="38" rx="19" fill="#FFFFFF" opacity="0.85" stroke="#FFCCD6" stroke-width="1.5"/>
    <text x="240" y="173" font-family="'Prompt', sans-serif" font-size="20" font-weight="700" fill="#E84D74" text-anchor="middle">เปิด 09:30 - 23:00 น.</text>

    <!-- Thank you message in art text -->
    <text x="240" y="218" font-family="'Prompt', sans-serif" font-size="19" font-weight="500" fill="#755E64" text-anchor="middle">ขอบคุณลูกค้าทุกท่านที่ไว้วางใจ</text>
    <text x="240" y="246" font-family="'Prompt', sans-serif" font-size="19" font-weight="500" fill="#755E64" text-anchor="middle">ให้ทางร้านดูแลนะคะ 💖</text>
  </g>

  <!-- Right Side Cute Mascot Illustration -->
  <g transform="translate(610, 25)">
    <!-- Aura Glow -->
    <circle cx="130" cy="145" r="125" fill="#FFFFFF" opacity="0.75"/>
    <circle cx="130" cy="145" r="115" fill="#FFE0E9" stroke="#FFCCD6" stroke-width="3"/>
    
    <!-- Hair Back -->
    <ellipse cx="130" cy="160" rx="76" ry="85" fill="#7D5661"/>
    
    <!-- Shoulders & Outfit -->
    <path d="M70 240 Q130 280 190 240 L205 290 L55 290 Z" fill="#FFA2B5"/>
    <path d="M95 240 Q130 260 165 240 Z" fill="#FFFFFF"/>
    
    <!-- Face -->
    <ellipse cx="130" cy="155" rx="55" ry="52" fill="#FFF5EE"/>
    
    <!-- Hair Front / Bangs -->
    <path d="M72 135 Q102 90 130 128 Q158 90 188 135 Q180 82 130 78 Q80 82 72 135 Z" fill="#7D5661"/>
    
    <!-- Eyes -->
    <ellipse cx="108" cy="155" rx="7" ry="8.5" fill="#4A3E3D"/>
    <ellipse cx="152" cy="155" rx="7" ry="8.5" fill="#4A3E3D"/>
    <circle cx="105" cy="152" r="2.8" fill="#FFFFFF"/>
    <circle cx="149" cy="152" r="2.8" fill="#FFFFFF"/>
    
    <!-- Blush -->
    <ellipse cx="94" cy="170" rx="11" ry="6" fill="#FFA2B5" opacity="0.8"/>
    <ellipse cx="166" cy="170" rx="11" ry="6" fill="#FFA2B5" opacity="0.8"/>
    
    <!-- Cute Smile -->
    <path d="M122 172 Q130 179 138 172" fill="none" stroke="#4A3E3D" stroke-width="2.8" stroke-linecap="round"/>
    
    <!-- Cute Hair Ribbon -->
    <path d="M165 88 L192 74 L185 104 Z" fill="#FF6B8F"/>
    <path d="M165 88 L142 72 L146 102 Z" fill="#FF6B8F"/>
    <circle cx="165" cy="88" r="7" fill="#FFF0F5"/>
  </g>
</svg>
`)}`;

export const DEFAULT_LOGO_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <rect width="120" height="120" rx="28" fill="#FFE3EC"/>
  <rect x="10" y="10" width="100" height="100" rx="22" fill="#FFFFFF" stroke="#FFCCD6" stroke-width="3"/>
  <path d="M60 88 C60 88 30 68 30 46 C30 34 40 26 50 26 C56 26 60 31 60 35 C60 31 64 26 70 26 C80 26 90 34 90 46 C90 68 60 88 60 88 Z" fill="#FF85A2"/>
  <text x="60" y="61" font-family="Prompt, sans-serif" font-size="18" font-weight="700" fill="#FFFFFF" text-anchor="middle">M</text>
</svg>
`)}`;

export const INITIAL_DATABASE: DatabaseSchema = {
  storeSettings: {
    storeName: 'MOMILK SHOP',
    heroTitle: 'Welcome to MOMILK SHOP',
    businessHours: 'เปิด 09:30 - 23:00 น.',
    storeCategory: 'ร้านของตกแต่ง & บริการออนไลน์น่ารัก',
    storeSlogan: 'ยินดีต้อนรับสู่ร้าน MOMILK SHOP ขอบคุณลูกค้าทุกท่านที่ไว้วางใจให้ทางร้านดูแลนะคะ แล้วแวะมาใหม่น้า 💖✨',
    logoUrl: DEFAULT_LOGO_SVG,
    avatarUrl: DEFAULT_MASCOT_SVG,
    bannerUrl: DEFAULT_BANNER_SVG,
    primaryColor: '#FF85A2',
    bgColor: '#FFF0F3',
    cardColor: '#FFFFFF',
    textColor: '#4A3E3D',
    contactLineName: 'LINE Official (@momilkshop)',
    contactLineUrl: 'https://line.me/ti/p/~@momilkshop',
    enableLine: true,
    contactFbName: 'MOMILK SHOP (Buttxr Cxke)',
    contactFbUrl: 'https://facebook.com/momilkshop',
    enableFb: true,
    contactIgName: 'Instagram (@momilk.shop)',
    contactIgUrl: 'https://instagram.com/momilk.shop',
    enableIg: true,
    contactOtherName: 'TikTok Shop (@momilk.cute)',
    contactOtherUrl: 'https://tiktok.com/@momilk.cute',
    enableOther: false,
    contactLine: '@momilkshop',
    contactFb: 'MOMILK SHOP',
    bgmAudioUrl: 'https://actions.google.com/sounds/v1/ambiences/Gentle_Breeze.ogg',
    bgmAudioFileName: 'เพลงพาสเทลฟังสบาย (Gentle_Breeze.ogg)',
    bgmAudioName: 'MOMILK Pastel Lo-Fi Melody',
    enableBgm: true,
    autoplayBgm: true,
    enableBubbleEffect: true,
    deliverySuccessCount: '500+',
    authenticGuarantee: '100%',
    isStoreOnline: true,
    requireReviewApproval: false,
    updatedAt: '23 ต.ค. 2569 14:20 น.',
  },
  reviews: [
    {
      id: 'rev-101',
      customerName: 'แอดมินใจดี',
      customerHandle: '@kind_member',
      rating: 5,
      serviceType: 'good',
      comment: 'บริการดีมากกกกค่ะ แม่ค้าน่ารัก ตอบไว ส่งของเร็วมากกกกก ห่อบับเบิ้ลมาหนาแน่นปลอดภัย ประทับใจมาก มีของแถมขนมน่ารักๆ มาให้อีก ไว้จะมาอุดหนุนอีกแน่นอนน้า 🌹🌷',
      likes: 12,
      likedByMe: false,
      createdAt: '23 ต.ค. 2569 00:44 น.',
      timestampMs: 1792716240000,
      status: 'approved',
      isPinned: true,
      verifiedSlip: true,
      adminReply: 'ขอบคุณมากๆ เลยนะคะคุณลูกค้า ดีใจที่ชอบของแถมนะคะ ไว้แวะมาอุดหนุน MOMILK SHOP อีกน้า 💖',
    },
    {
      id: 'rev-102',
      customerName: 'ปอนด์ ปอนด์',
      customerHandle: '@pond_krub',
      rating: 5,
      serviceType: 'good',
      comment: 'ดีมากครับ สั่งรอบที่สามแล้ว ไว้วางใจร้าน MOMILK SHOP เสมอ ได้สินค้าตรงปก 100% สภาพกริบมาก',
      likes: 5,
      likedByMe: false,
      createdAt: '12 ต.ค. 2569 18:53 น.',
      timestampMs: 1791831180000,
      status: 'approved',
      isPinned: false,
      verifiedSlip: true,
    },
    {
      id: 'rev-103',
      customerName: 'Mayly_sweet',
      customerHandle: '@mayly.sweet',
      rating: 5,
      serviceType: 'good',
      comment: 'แพ็กมาน่ารักมาก มีสติ๊กเกอร์กับของแถมกุ๊กกิ๊กให้ด้วย แม่ค้าพูดจาดี น่ารักเป็นกันเองสุดๆ ค่ะ ขอให้ร้านปังๆ ยอดขายเฮงๆ นะคะ ✨🎀',
      likes: 8,
      likedByMe: false,
      createdAt: '08 ต.ค. 2569 14:20 น.',
      timestampMs: 1791469200000,
      status: 'approved',
      isPinned: false,
      verifiedSlip: true,
    },
    {
      id: 'rev-104',
      customerName: 'NongPloy_Pastel',
      customerHandle: '@ploy_pastel',
      rating: 5,
      serviceType: 'good',
      comment: 'ได้รับของไวมากค่ะ แจ้งเลขพัสดุเร็ว ตรวจสอบสถานะได้ตลอด แนะนำร้านนี้เลยค่ะ เครดิตแน่นมาก 10/10 ไม่หักเลย',
      likes: 6,
      likedByMe: false,
      createdAt: '05 ต.ค. 2569 11:15 น.',
      timestampMs: 1791198900000,
      status: 'approved',
      isPinned: false,
      verifiedSlip: true,
    },
    {
      id: 'rev-105',
      customerName: 'Kittipong_T',
      customerHandle: '@kittipong',
      rating: 4,
      serviceType: 'good',
      comment: 'สินค้าคุณภาพดีมากครับ แม่ค้าให้คำแนะนำละเอียด ตอบแชทดึกๆ ก็ยังใจดีมากครับ',
      likes: 4,
      likedByMe: false,
      createdAt: '02 ต.ค. 2569 21:08 น.',
      timestampMs: 1790975280000,
      status: 'approved',
      isPinned: false,
      verifiedSlip: false,
    },
    {
      id: 'rev-106',
      customerName: 'ลูกค้าสายด่วน',
      customerHandle: '@express_buyer',
      rating: 2,
      serviceType: 'bad',
      comment: 'ขนส่งเอกชนนำจ่ายช้ากว่ากำหนดไป 1 วันครับ แต่ทางร้านช่วยตามพัสดุให้ตลอด ขอบคุณที่ช่วยประสานงานครับ',
      likes: 1,
      likedByMe: false,
      createdAt: '29 ก.ย. 2569 16:40 น.',
      timestampMs: 1790700000000,
      status: 'approved',
      isPinned: false,
      verifiedSlip: true,
      adminReply: 'ทางร้านต้องขออภัยแทนขนส่งด้วยนะคะ และได้กำชับสาขาปลายทางให้เรียบร้อยแล้ว ขอบคุณที่ให้โอกาสทางร้านดูแลนะคะ 🙏💕',
    },
  ],
  users: [
    {
      id: 'usr-admin-1',
      name: 'เจ้าของร้าน Momilk',
      username: 'admin',
      email: 'nack2132@gmail.com',
      role: 'super_admin',
      roleLabel: 'ผู้ดูแลระบบสูงสุด',
      avatarUrl: DEFAULT_MASCOT_SVG,
      status: 'active',
      totalReviews: 0,
      lastActive: 'ออนไลน์ขณะนี้',
      permissions: ROLE_PERMISSIONS_MAP.super_admin.permissions,
    },
    {
      id: 'usr-admin-2',
      name: 'แอดมินมินนี่ (ฝ่ายดูแลลูกค้า)',
      username: 'editor',
      email: 'minnie.support@momilk.shop',
      role: 'editor',
      roleLabel: 'แอดมินดูแลร้าน',
      avatarUrl: DEFAULT_LOGO_SVG,
      status: 'active',
      totalReviews: 2,
      lastActive: '15 นาทีที่แล้ว',
      permissions: ROLE_PERMISSIONS_MAP.editor.permissions,
    },
    {
      id: 'usr-admin-3',
      name: 'ทีมการตลาด & วิเคราะห์สถิติ',
      username: 'viewer',
      email: 'analytics@momilk.shop',
      role: 'viewer',
      roleLabel: 'นักวิเคราะห์สถิติ',
      avatarUrl: DEFAULT_LOGO_SVG,
      status: 'active',
      totalReviews: 0,
      lastActive: '2 ชั่วโมงที่แล้ว',
      permissions: ROLE_PERMISSIONS_MAP.viewer.permissions,
    },
    {
      id: 'usr-cust-1',
      name: 'แอดมินใจดี',
      username: 'kind_member',
      email: 'kind.customer@gmail.com',
      role: 'customer',
      roleLabel: 'ลูกค้า VIP (ยืนยันตัวตนแล้ว)',
      avatarUrl: DEFAULT_MASCOT_SVG,
      status: 'active',
      totalReviews: 5,
      lastActive: 'วันนี้ 00:44 น.',
      permissions: ROLE_PERMISSIONS_MAP.customer.permissions,
    },
    {
      id: 'usr-cust-2',
      name: 'ปอนด์ ปอนด์',
      username: 'pond_krub',
      email: 'pond.buyer@gmail.com',
      role: 'customer',
      roleLabel: 'ลูกค้าประจำ (ซื้อซ้ำ 3 ครั้ง)',
      avatarUrl: DEFAULT_LOGO_SVG,
      status: 'active',
      totalReviews: 3,
      lastActive: '12 ต.ค. 2569',
      permissions: ROLE_PERMISSIONS_MAP.customer.permissions,
    },
    {
      id: 'usr-cust-3',
      name: 'Mayly_sweet',
      username: 'mayly_sweet',
      email: 'mayly.sweet@hotmail.com',
      role: 'customer',
      roleLabel: 'ลูกค้าสมาชิก',
      avatarUrl: DEFAULT_MASCOT_SVG,
      status: 'active',
      totalReviews: 2,
      lastActive: '08 ต.ค. 2569',
      permissions: ROLE_PERMISSIONS_MAP.customer.permissions,
    },
  ],
  analytics: {
    totalViews: 4820,
    activeVisitorsNow: 18,
    lineClicks: 642,
    fbClicks: 418,
    igClicks: 315,
    dailyStats: [
      { date: '17 ต.ค.', views: 540, reviews: 14, likes: 48, contactClicks: 82 },
      { date: '18 ต.ค.', views: 615, reviews: 19, likes: 62, contactClicks: 94 },
      { date: '19 ต.ค.', views: 590, reviews: 16, likes: 55, contactClicks: 88 },
      { date: '20 ต.ค.', views: 720, reviews: 22, likes: 79, contactClicks: 115 },
      { date: '21 ต.ค.', views: 685, reviews: 18, likes: 71, contactClicks: 109 },
      { date: '22 ต.ค.', views: 810, reviews: 21, likes: 93, contactClicks: 138 },
      { date: '23 ต.ค. (วันนี้)', views: 860, reviews: 18, likes: 104, contactClicks: 149 },
    ],
    liveEvents: [
      {
        id: 'evt-1',
        type: 'review',
        message: 'เขียนรีวิว 5 ดาว (บริการที่ดี) พร้อมแนบหลักฐาน',
        timestamp: '23 ต.ค. 2569 00:44 น.',
        actor: 'แอดมินใจดี',
      },
      {
        id: 'evt-2',
        type: 'contact_click',
        message: 'คัดลอกไอดี LINE @momilkshop จากหน้าร้าน',
        timestamp: '23 ต.ค. 2569 14:15 น.',
        actor: 'ผู้เยี่ยมชม #842',
      },
      {
        id: 'evt-3',
        type: 'like',
        message: 'กดถูกใจรีวิวของ Mayly_sweet',
        timestamp: '23 ต.ค. 2569 14:18 น.',
        actor: 'ผู้เยี่ยมชม #849',
      },
      {
        id: 'evt-4',
        type: 'admin_action',
        message: 'อัปเดตข้อมูลหน้าร้านและสีธีม (Momilk Pink)',
        timestamp: '23 ต.ค. 2569 14:20 น.',
        actor: 'เจ้าของร้าน Momilk',
      },
    ],
  },
};
