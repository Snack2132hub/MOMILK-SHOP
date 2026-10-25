import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  Star,
  Heart,
  MousePointerClick,
  Activity,
  Play,
  Pause,
  PlusCircle,
} from 'lucide-react';
import { DatabaseSchema } from '../types/database';

interface RealtimeAnalyticsViewProps {
  db: DatabaseSchema;
  onSimulateRealtimeEvent: () => void;
}

export const RealtimeAnalyticsView: React.FC<RealtimeAnalyticsViewProps> = ({
  db,
  onSimulateRealtimeEvent,
}) => {
  const [autoSimulate, setAutoSimulate] = useState(false);

  useEffect(() => {
    if (!autoSimulate) return;
    const timer = window.setInterval(() => {
      onSimulateRealtimeEvent();
    }, 3200);
    return () => window.clearInterval(timer);
  }, [autoSimulate, onSimulateRealtimeEvent]);

  const { reviews, analytics } = db;
  const totalLikes = reviews.reduce((sum, r) => sum + r.likes, 0);
  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(2)
      : '5.00';
  const goodReviewsCount = reviews.filter((r) => r.serviceType === 'good').length;
  const satisfactionRate =
    reviews.length > 0 ? Math.round((goodReviewsCount / reviews.length) * 100) : 100;

  const totalContactClicks =
    analytics.lineClicks + analytics.fbClicks + analytics.igClicks;

  const maxDailyViews = Math.max(...analytics.dailyStats.map((d) => d.views), 100);

  // Star breakdown counts
  const starCounts = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => r.rating === star).length;
    const pct = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
    return { star, count, pct };
  });

  return (
    <div className="space-y-6">
      {/* Header & Real-time Stream Controls */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-pink-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-pink-600">
            ระบบวิเคราะห์ข้อมูลแบบเรียลไทม์ · Real-time Telemetry & Conversion
          </p>
          <h2 className="text-xl sm:text-2xl font-bold text-stone-800">
            สถิติและยอดชมหน้าร้านแบบเรียลไทม์
          </h2>
          <p className="text-xs sm:text-sm text-stone-500">
            ติดตามยอดผู้เข้าชม คะแนนความพึงพอใจ ยอดคลิกช่องทางติดต่อ และกระแสกิจกรรมสดวินาทีต่อวินาที
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onSimulateRealtimeEvent}
            className="px-4 py-2.5 rounded-xl border border-pink-200 bg-pink-50 hover:bg-pink-100 text-pink-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>จำลองเหตุการณ์ใหม่ทันที</span>
          </button>

          <button
            type="button"
            onClick={() => setAutoSimulate((prev) => !prev)}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              autoSimulate
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-stone-900 hover:bg-stone-800 text-white'
            }`}
          >
            {autoSimulate ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>กำลังจำลองเรียลไทม์อัตโนมัติ (หยุด)</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>เปิดจำลองข้อมูลเรียลไทม์อัตโนมัติ</span>
              </>
            )}
          </button>
        </div>
      </section>

      {/* 4 Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-pink-100 space-y-2">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>ยอดเข้าชมสะสมทั้งหมด</span>
            <Users className="w-4 h-4 text-pink-500" />
          </div>
          <p className="text-2xl font-bold text-stone-800 tabular-nums">
            {analytics.totalViews.toLocaleString()} ครั้ง
          </p>
          <p className="text-xs text-emerald-600 font-medium tabular-nums">
            ออนไลน์ขณะนี้ {analytics.activeVisitorsNow} คน · +14.2% สัปดาห์นี้
          </p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-pink-100 space-y-2">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>คะแนนความน่าเชื่อถือเฉลี่ย</span>
            <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
          </div>
          <p className="text-2xl font-bold text-stone-800 tabular-nums">{avgRating} / 5.00</p>
          <p className="text-xs text-pink-600 font-medium tabular-nums">
            บริการที่ดี {satisfactionRate}% · จาก {122 + reviews.length} รีวิว
          </p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-pink-100 space-y-2">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>ยอดกดถูกใจรีวิวรวม</span>
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
          </div>
          <p className="text-2xl font-bold text-stone-800 tabular-nums">
            {(340 + totalLikes).toLocaleString()} ครั้ง
          </p>
          <p className="text-xs text-stone-500 tabular-nums">
            ฐานข้อมูลปัจจุบัน +{totalLikes} ถูกใจ
          </p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-pink-100 space-y-2">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>คลิกติดต่อสั่งซื้อ (Conversion)</span>
            <MousePointerClick className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-stone-800 tabular-nums">
            {totalContactClicks.toLocaleString()} ครั้ง
          </p>
          <p className="text-xs text-emerald-600 font-medium tabular-nums">
            LINE {analytics.lineClicks} · FB {analytics.fbClicks} · IG {analytics.igClicks}
          </p>
        </div>
      </div>

      {/* Charts & Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 7-Day Traffic & Engagement Chart */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-pink-100 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-stone-800 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-pink-500" />
                <span>กราฟแนวโน้มยอดเข้าชมและยอดคลิกติดต่อ (7 วันล่าสุด)</span>
              </h3>
              <p className="text-xs text-stone-500">
                เปรียบเทียบจำนวนผู้เข้าชมหน้าร้าน (แท่งสีชมพู) และยอดคลิกติดต่อสั่งซื้อ (แท่งสีเข้ม)
              </p>
            </div>
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 tabular-nums">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>สูงสุดวันนี้</span>
            </span>
          </div>

          <div className="pt-4 grid grid-cols-7 gap-2 sm:gap-4 items-end h-52 border-b border-pink-100 pb-3">
            {analytics.dailyStats.map((day) => {
              const viewHeightPct = Math.max(15, Math.round((day.views / maxDailyViews) * 100));
              const clickHeightPct = Math.max(
                8,
                Math.round((day.contactClicks / maxDailyViews) * 100)
              );
              return (
                <div
                  key={day.date}
                  className="flex flex-col items-center justify-end h-full gap-1.5 group"
                >
                  <span className="text-[10px] font-mono text-stone-500 tabular-nums">
                    {day.views}
                  </span>
                  <div className="w-full flex items-end justify-center gap-1 h-36">
                    <div
                      className="w-3.5 sm:w-5 rounded-t-lg bg-gradient-to-t from-pink-500 to-pink-300 transition-all duration-300"
                      style={{ height: `${viewHeightPct}%` }}
                      title={`ยอดชม: ${day.views} ครั้ง`}
                    />
                    <div
                      className="w-2.5 sm:w-3.5 rounded-t-lg bg-stone-700 transition-all duration-300"
                      style={{ height: `${clickHeightPct}%` }}
                      title={`คลิกติดต่อ: ${day.contactClicks} ครั้ง`}
                    />
                  </div>
                  <span className="text-[10px] sm:text-xs font-medium text-stone-600 truncate max-w-full">
                    {day.date.replace(' (วันนี้)', '')}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Tabular Summary Row */}
          <div className="grid grid-cols-3 gap-3 text-center pt-1">
            <div className="p-3 rounded-2xl bg-pink-50/40">
              <p className="text-[11px] text-stone-500">อัตราการคลิกติดต่อ (CTR)</p>
              <p className="text-sm font-bold text-stone-800 tabular-nums">
                {((totalContactClicks / Math.max(1, analytics.totalViews)) * 100).toFixed(1)}%
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-pink-50/40">
              <p className="text-[11px] text-stone-500">ช่องทางยอดนิยมอันดับ 1</p>
              <p className="text-sm font-bold text-emerald-600">LINE Official</p>
            </div>
            <div className="p-3 rounded-2xl bg-pink-50/40">
              <p className="text-[11px] text-stone-500">เวลาที่มีลูกค้าเข้าชมสูงสุด</p>
              <p className="text-sm font-bold text-stone-800 tabular-nums">19:00 - 22:00 น.</p>
            </div>
          </div>
        </div>

        {/* Star Rating Distribution & Live Event Feed */}
        <div className="lg:col-span-5 space-y-6">
          {/* Star Rating Distribution */}
          <div className="bg-white rounded-3xl p-6 border border-pink-100 space-y-4">
            <h3 className="text-base font-bold text-stone-800">
              สัดส่วนคะแนนรีวิวลูกค้า (Rating Breakdown)
            </h3>
            <div className="space-y-2.5">
              {starCounts.map((row) => (
                <div key={row.star} className="flex items-center gap-3 text-xs tabular-nums">
                  <span className="w-12 font-semibold text-stone-700 flex items-center gap-1 shrink-0">
                    <span>{row.star}</span>
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  </span>
                  <div className="flex-1 h-2.5 rounded-full bg-pink-50 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-pink-500 transition-all duration-300"
                      style={{ width: `${row.pct}%` }}
                    />
                  </div>
                  <span className="w-16 text-right text-stone-500 font-mono">
                    {row.count} ({row.pct}%)
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Live Event Log */}
          <div className="bg-white rounded-3xl p-6 border border-pink-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-stone-800 flex items-center gap-2">
                <Activity className="w-4 h-4 text-pink-500" />
                <span>ความเคลื่อนไหวเรียลไทม์ล่าสุด</span>
              </h3>
              <span className="text-[11px] text-stone-400 tabular-nums">
                อัปเดตสด ({analytics.liveEvents.length} รายการ)
              </span>
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {analytics.liveEvents.slice(0, 8).map((ev) => (
                <div
                  key={ev.id}
                  className="p-3 rounded-2xl border border-pink-50 bg-pink-50/20 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5 min-w-0">
                    <p className="font-bold text-stone-800 truncate">{ev.actor}</p>
                    <p className="text-stone-600 leading-snug">{ev.message}</p>
                  </div>
                  <time className="text-[10px] text-stone-400 font-mono whitespace-nowrap shrink-0">
                    {ev.timestamp.split(' ').slice(-2).join(' ')}
                  </time>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
