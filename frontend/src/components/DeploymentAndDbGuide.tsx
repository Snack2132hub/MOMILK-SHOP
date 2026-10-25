import React, { useState } from 'react';
import {
  Server,
  Flame,
  Triangle,
  Database,
  Download,
  Copy,
  Check,
  Code2,
  ShieldCheck,
  Zap,
  RefreshCw,
  FileCode,
} from 'lucide-react';
import { DatabaseSchema, UserAccount } from '../types/database';

interface DeploymentAndDbGuideProps {
  db: DatabaseSchema;
  currentUser: UserAccount;
  onResetDatabase: () => void;
}

export const DeploymentAndDbGuide: React.FC<DeploymentAndDbGuideProps> = ({
  db,
  currentUser,
  onResetDatabase,
}) => {
  const [selectedPlatform, setSelectedPlatform] = useState<'vercel' | 'firebase' | 'database'>('vercel');
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  const copyCode = (key: string, text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedSnippet(key);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  // Export current database as JSON file
  const handleDownloadJsonDb = () => {
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `momilk-shop-database-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Generate and download a standalone, customized HTML file reflecting current StoreSettings and Reviews
  const handleDownloadStandaloneHtml = () => {
    const { storeSettings, reviews } = db;
    const approvedReviews = reviews.filter((r) => r.status === 'approved');
    const htmlContent = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${storeSettings.storeName} - ระบบรีวิวและเครดิตความน่าเชื่อถือ</title>
  <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body {
      background-color: ${storeSettings.bgColor};
      color: ${storeSettings.textColor};
      font-family: 'Prompt', sans-serif;
    }
  </style>
</head>
<body class="min-h-screen flex flex-col antialiased">
  <header class="bg-white/90 backdrop-blur border-b border-pink-100 sticky top-0 z-50">
    <div class="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
      <span class="font-bold text-lg" style="color: ${storeSettings.primaryColor}">${storeSettings.storeName} ♥</span>
      <span class="text-xs text-gray-500">${storeSettings.businessHours}</span>
    </div>
  </header>
  <main class="max-w-5xl mx-auto w-full px-4 py-8 space-y-6 flex-1">
    <section class="rounded-3xl p-2 border border-pink-100 overflow-hidden flex justify-center" style="background-color: ${storeSettings.cardColor}">
      <img src="${storeSettings.bannerUrl}" alt="${storeSettings.storeName}" class="w-full h-auto max-h-[300px] object-contain rounded-2xl" />
    </section>
    <section class="rounded-3xl p-6 border border-pink-100 space-y-4" style="background-color: ${storeSettings.cardColor}">
      <h2 class="text-lg font-bold">รีวิวจากลูกค้า (${approvedReviews.length})</h2>
      <div class="space-y-3">
        ${approvedReviews
          .map(
            (r) => `
        <article class="p-4 rounded-2xl border border-pink-100 bg-white space-y-1">
          <div class="flex justify-between text-xs">
            <strong>${r.customerName} (${r.rating} ★)</strong>
            <span class="text-gray-400">${r.createdAt}</span>
          </div>
          <p class="text-sm text-gray-700">${r.comment}</p>
        </article>`
          )
          .join('\n')}
      </div>
    </section>
  </main>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `momilk-shop-storefront.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const vercelJsonSnippet = `{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ],
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}`;

  const firestoreRulesSnippet = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() {
      return request.auth != null;
    }
    function getRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }
    function isSuperAdmin() {
      return isSignedIn() && getRole() == 'super_admin';
    }
    function isEditorOrAdmin() {
      return isSignedIn() && (getRole() == 'super_admin' || getRole() == 'editor');
    }

    // ข้อมูลตั้งค่าหน้าร้าน: ทุกคนอ่านได้, เฉพาะ Super Admin และ Editor แก้ไขได้
    match /storeSettings/{docId} {
      allow read: if true;
      allow write: if isEditorOrAdmin();
    }

    // รีวิวลูกค้า: ทุกคนอ่านและสร้างรีวิวใหม่ได้, แอดมินอนุมัติ/ตอบกลับ/ลบได้
    match /reviews/{reviewId} {
      allow read: if true;
      allow create: if request.resource.data.rating >= 1 && request.resource.data.rating <= 5;
      allow update: if isEditorOrAdmin() || request.resource.data.diff(resource.data).affectedKeys().hasOnly(['likes']);
      allow delete: if isSuperAdmin();
    }

    // ตารางผู้ใช้งานและสิทธิ์ RBAC: เฉพาะ Super Admin จัดการได้
    match /users/{userId} {
      allow read: if isSignedIn();
      allow write: if isSuperAdmin();
    }
  }
}`;

  const firebaseDeployCliSnippet = `# 1. ติดตั้ง Firebase CLI และเข้าสู่ระบบ
npm install -g firebase-tools
firebase login

# 2. เชื่อมต่อโปรเจกต์ (เลือก Hosting และ Firestore)
firebase init hosting firestore

# 3. สั่ง Build โปรเจกต์ React + Tailwind CSS ให้ได้ไฟล์ Production ที่บีบอัดแล้ว
npm run build

# 4. อัปโหลดขึ้นเซิร์ฟเวอร์จริงพร้อมกฎความปลอดภัย Firestore Rules
firebase deploy --only hosting,firestore:rules`;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-pink-100 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-pink-600">
              สถาปัตยกรรมฐานข้อมูล · การนำขึ้นเซิร์ฟเวอร์จริง (Production Deployment)
            </p>
            <h2 className="text-xl sm:text-2xl font-bold text-stone-800">
              แนะนำการอัพขึ้นเซิฟเวอร์ Vercel & Firebase เพื่อประสิทธิภาพสูงสุด
            </h2>
            <p className="text-xs sm:text-sm text-stone-500">
              เปรียบเทียบข้อดี ขั้นตอนการตั้งค่า Edge CDN, กฎความปลอดภัยฐานข้อมูล (RBAC Security Rules) และระบบส่งออกโค้ด HTML / JSON
            </p>
          </div>

          {/* Export Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleDownloadStandaloneHtml}
              className="px-4 py-2.5 rounded-xl border border-pink-200 bg-pink-50 hover:bg-pink-100 text-pink-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <FileCode className="w-4 h-4" />
              <span>ดาวน์โหลดเว็บ HTML สำเร็จรูป</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadJsonDb}
              disabled={!currentUser.permissions.canExportDatabase}
              className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export ฐานข้อมูล (.JSON)</span>
            </button>
          </div>
        </div>

        {/* Platform Switcher Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-pink-50">
          <button
            type="button"
            onClick={() => setSelectedPlatform('vercel')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              selectedPlatform === 'vercel'
                ? 'bg-stone-900 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <Triangle className="w-3.5 h-3.5 fill-current" />
            <span>1. แนวทาง Vercel (Edge Network + Serverless DB)</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedPlatform('firebase')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              selectedPlatform === 'firebase'
                ? 'bg-amber-500 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5 fill-current" />
            <span>2. แนวทาง Firebase (Hosting + Firestore Realtime)</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedPlatform('database')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              selectedPlatform === 'database'
                ? 'bg-pink-500 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>3. โครงสร้างฐานข้อมูลสด (Live Database Inspector)</span>
          </button>
        </div>
      </section>

      {/* Platform 1: Vercel Guide */}
      {selectedPlatform === 'vercel' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-pink-100 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-stone-900 text-white flex items-center justify-center shrink-0">
                <Triangle className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-800">
                  ทำไมต้องเลือก Vercel สำหรับ React + Vite + Tailwind CSS?
                </h3>
                <p className="text-xs text-stone-500">
                  เหมาะสำหรับทีมที่ใช้ GitHub CI/CD และต้องการความเร็ว Global Edge CDN สูงสุด
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-stone-700 leading-relaxed">
              <div className="p-4 rounded-2xl bg-pink-50/40 border border-pink-100 space-y-1.5">
                <p className="font-bold text-stone-800 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-pink-500" />
                  <span>เทคนิคปรับจูนประสิทธิภาพสูงสุดบน Vercel:</span>
                </p>
                <ul className="list-disc list-inside space-y-1 text-xs text-stone-600">
                  <li>
                    <strong>Region ใกล้ประเทศไทย:</strong> ตั้งค่า Serverless Function Region เป็น{' '}
                    <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-pink-100">
                      sin1 (Singapore)
                    </code>{' '}
                    เพื่อลด Latency ของ API ฐานข้อมูลเหลือเพียง 25–40ms
                  </li>
                  <li>
                    <strong>Immutable Asset Caching:</strong> ตั้งค่า Cache-Control สำหรับไฟล์ JS/CSS ที่ผ่านการ Hash จาก Vite ให้แคชบน Edge ยาวนาน 1 ปีเต็ม
                  </li>
                  <li>
                    <strong>การเชื่อมต่อฐานข้อมูลบน Vercel:</strong> แนะนำให้ผูกกับ{' '}
                    <strong>Firebase Firestore</strong>, <strong>Vercel Postgres (Neon)</strong> หรือ{' '}
                    <strong>Supabase</strong> ผ่าน Environment Variables
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <p className="font-bold text-stone-800 text-xs">
                  ขั้นตอนการ Deploy ขึ้น Vercel ภายใน 3 นาที:
                </p>
                <ol className="list-decimal list-inside space-y-1.5 text-xs text-stone-600">
                  <li>อัปโหลดโค้ดโปรเจกต์ขึ้น GitHub Repository ของร้าน</li>
                  <li>ล็อกอินเข้าเว็บ vercel.com กดปุ่ม Add New Project แล้วเลือก Repository</li>
                  <li>
                    เลือก Framework Preset เป็น <strong>Vite</strong> (Build Command:{' '}
                    <code className="font-mono">npm run build</code>, Output Directory:{' '}
                    <code className="font-mono">dist</code>)
                  </li>
                  <li>กดปุ่ม Deploy ระบบจะสร้าง HTTPS Domain พร้อม SSL อัตโนมัติทันที</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-pink-100 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-pink-500" />
                <span>ไฟล์ตั้งค่า vercel.json แนะนำ</span>
              </span>
              <button
                type="button"
                onClick={() => copyCode('vercel', vercelJsonSnippet)}
                className="px-3 py-1 rounded-lg bg-pink-50 hover:bg-pink-100 text-pink-600 text-xs font-medium flex items-center gap-1 cursor-pointer"
              >
                {copiedSnippet === 'vercel' ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>คัดลอกแล้ว</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>คัดลอกโค้ด</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 rounded-2xl bg-stone-900 text-pink-200 text-xs font-mono overflow-x-auto leading-relaxed">
              {vercelJsonSnippet}
            </pre>
          </div>
        </div>
      )}

      {/* Platform 2: Firebase Guide */}
      {selectedPlatform === 'firebase' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-pink-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                <Flame className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-800">
                  ทำไมต้องเลือก Firebase (Hosting + Firestore + Auth)?
                </h3>
                <p className="text-xs text-stone-500">
                  เหมาะที่สุดสำหรับระบบรีวิวแบบเรียลไทม์ (`onSnapshot`) และระบบล็อกอินแอดมินครบวงจรในที่เดียว
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/70 space-y-2 text-xs text-stone-700">
              <p className="font-bold text-amber-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>จุดเด่นเมื่อรัน MOMILK SHOP บน Firebase:</span>
              </p>
              <ul className="list-disc list-inside space-y-1 text-stone-600">
                <li>
                  <strong>Real-time Listener (`onSnapshot`):</strong> เมื่อลูกค้าส่งรีวิวใหม่หรือกดหัวใจ หน้าจอของลูกค้าคนอื่นและหน้าแดชบอร์ดแอดมินจะอัปเดตทันทีโดยไม่ต้องรีเฟรชหน้าเว็บ
                </li>
                <li>
                  <strong>Firestore Region:</strong> เลือกสร้างฐานข้อมูลที่{' '}
                  <code className="font-mono bg-white px-1.5 py-0.5 rounded">
                    asia-southeast1 (Singapore)
                  </code>{' '}
                  เพื่อให้คนไทยเข้าถึงข้อมูลได้เร็วที่สุด
                </li>
                <li>
                  <strong>Firebase Security Rules:</strong> ป้องกันการโดนเจาะระบบด้วยการตรวจสอบสิทธิ์ Role (`super_admin`, `editor`, `viewer`) ในระดับฐานข้อมูลโดยตรง
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-800">
                  คำสั่ง Terminal สำหรับ Deploy ขึ้น Firebase:
                </span>
                <button
                  type="button"
                  onClick={() => copyCode('fb-cli', firebaseDeployCliSnippet)}
                  className="px-2.5 py-1 rounded-lg bg-pink-50 text-pink-600 text-xs font-medium flex items-center gap-1 cursor-pointer"
                >
                  {copiedSnippet === 'fb-cli' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>คัดลอกคำสั่ง</span>
                </button>
              </div>
              <pre className="p-4 rounded-2xl bg-stone-900 text-amber-200 text-xs font-mono overflow-x-auto leading-relaxed">
                {firebaseDeployCliSnippet}
              </pre>
            </div>
          </div>

          <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-pink-100 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>กฎความปลอดภัย firestore.rules (RBAC สำหรับแอดมิน)</span>
              </span>
              <button
                type="button"
                onClick={() => copyCode('rules', firestoreRulesSnippet)}
                className="px-3 py-1 rounded-lg bg-pink-50 hover:bg-pink-100 text-pink-600 text-xs font-medium flex items-center gap-1 cursor-pointer"
              >
                {copiedSnippet === 'rules' ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>คัดลอกแล้ว</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>คัดลอก Rules</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 rounded-2xl bg-stone-900 text-emerald-300 text-xs font-mono overflow-x-auto leading-relaxed max-h-[380px]">
              {firestoreRulesSnippet}
            </pre>
          </div>
        </div>
      )}

      {/* Platform 3: Live Database Inspector */}
      {selectedPlatform === 'database' && (
        <div className="bg-white rounded-3xl p-6 border border-pink-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-pink-50">
            <div>
              <h3 className="text-base font-bold text-stone-800">
                ตรวจสอบข้อมูลในฐานข้อมูลปัจจุบัน (Live JSON / REST Database State)
              </h3>
              <p className="text-xs text-stone-500">
                ซิงค์อัตโนมัติระหว่าง Express API (`/api/db`) และ LocalStorage พร้อมสถิติเรียลไทม์
              </p>
            </div>
            {currentUser.permissions.canDeleteReviews && (
              <button
                type="button"
                onClick={onResetDatabase}
                className="px-4 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer self-start"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>รีเซ็ตฐานข้อมูลกลับเป็นค่าเริ่มต้น</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-pink-50/40 border border-pink-100">
              <p className="text-xs text-stone-500">ตาราง reviews</p>
              <p className="text-xl font-bold text-stone-800 tabular-nums">
                {db.reviews.length} รายการ
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-pink-50/40 border border-pink-100">
              <p className="text-xs text-stone-500">ตาราง users (RBAC)</p>
              <p className="text-xl font-bold text-stone-800 tabular-nums">
                {db.users.length} บัญชี
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-pink-50/40 border border-pink-100">
              <p className="text-xs text-stone-500">ตาราง dailyStats</p>
              <p className="text-xl font-bold text-stone-800 tabular-nums">
                {db.analytics.dailyStats.length} วัน
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-pink-50/40 border border-pink-100">
              <p className="text-xs text-stone-500">ตาราง liveEvents</p>
              <p className="text-xl font-bold text-stone-800 tabular-nums">
                {db.analytics.liveEvents.length} เหตุการณ์
              </p>
            </div>
          </div>

          <pre className="p-4 rounded-2xl bg-stone-900 text-pink-200 text-xs font-mono overflow-x-auto max-h-[360px]">
            {JSON.stringify(
              {
                storeSettings: {
                  storeName: db.storeSettings.storeName,
                  heroTitle: db.storeSettings.heroTitle,
                  primaryColor: db.storeSettings.primaryColor,
                  updatedAt: db.storeSettings.updatedAt,
                },
                totalReviewsInDb: db.reviews.length,
                latestReviews: db.reviews.slice(0, 3),
                rbacUsers: db.users.map((u) => ({
                  username: u.username,
                  name: u.name,
                  role: u.role,
                  permissions: u.permissions,
                })),
              },
              null,
              2
            )}
          </pre>
        </div>
      )}
    </div>
  );
};
