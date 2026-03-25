'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { getBattleEvents, getNotices, getActivityRecords } from '@/lib/db';
import { NOTICE_TYPES } from '@/lib/constants';
import type { BattleEvent, Notice, ActivityRecord } from '@/lib/types';

function getNoticeTypeLabel(type: string) {
  return NOTICE_TYPES.find(t => t.value === type)?.label || type;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

const statusLabels: Record<string, { text: string; class: string }> = {
  upcoming: { text: '即将开始', class: 'bg-blue-900/30 text-blue-400' },
  active: { text: '进行中', class: 'bg-gold/20 text-gold' },
  closed: { text: '报名截止', class: 'bg-orange-900/30 text-orange-400' },
  finished: { text: '已结束', class: 'bg-bg-panel text-text-secondary' },
};

export default function RecentSection() {
  const [events, setEvents] = useState<BattleEvent[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      const [evtRes, noticeRes, actRes] = await Promise.all([
        getBattleEvents(),
        getNotices(),
        getActivityRecords(),
      ]);
      if (evtRes.data) setEvents(evtRes.data);
      if (noticeRes.data) setNotices(noticeRes.data);
      if (actRes.data) setActivities(actRes.data);
      setLoaded(true);
    }
    load();
  }, []);

  // Show up to 3 most relevant events (active first, then upcoming, then recent)
  const sortedEvents = [...events].sort((a, b) => {
    const order = { active: 0, upcoming: 1, closed: 2, finished: 3 };
    const oa = order[a.status] ?? 9;
    const ob = order[b.status] ?? 9;
    if (oa !== ob) return oa - ob;
    return new Date(b.battle_time || b.created_at).getTime() - new Date(a.battle_time || a.created_at).getTime();
  });
  const displayEvents = sortedEvents.slice(0, 3);

  // Notices: already sorted by pinned + created_at from DB
  const displayNotices = notices.slice(0, 3);

  // Activity records: show recent ones
  const displayActivities = activities.slice(0, 6);

  return (
    <section className="py-20 px-8">
      <div className="max-w-[1200px] mx-auto">
        {/* Two columns: Events + Notices */}
        <div className="grid grid-cols-2 gap-8 mb-16">
          {/* Left: Upcoming events */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="font-display text-xs tracking-[0.3em] text-text-secondary/50 uppercase mb-1">EVENTS</p>
                <h2 className="font-title text-2xl text-text-primary">近期赛程</h2>
              </div>
              <Link href="/battle" className="text-gold/60 text-sm hover:text-gold transition-colors">
                查看全部 →
              </Link>
            </div>
            <div className="space-y-4">
              {!loaded ? (
                <div className="p-5 bg-bg-card gold-border rounded-sm text-center">
                  <span className="text-text-secondary/50 text-sm">加载中...</span>
                </div>
              ) : displayEvents.length === 0 ? (
                <div className="p-5 bg-bg-card gold-border rounded-sm text-center">
                  <span className="text-text-secondary/50 text-sm">暂无赛程安排</span>
                </div>
              ) : (
                displayEvents.map(evt => {
                  const status = statusLabels[evt.status] || statusLabels.upcoming;
                  return (
                    <Link key={evt.id} href="/battle" className="block">
                      <div className="p-5 bg-bg-card gold-border rounded-sm hover:bg-bg-card/80 transition-colors">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-2 py-0.5 text-xs rounded ${status.class}`}>{status.text}</span>
                          {evt.battle_time && (
                            <span className="text-text-secondary text-xs">{formatDate(evt.battle_time)}</span>
                          )}
                        </div>
                        <h3 className="text-text-primary font-title mb-1">{evt.title}</h3>
                        {evt.description && (
                          <p className="text-text-secondary text-sm line-clamp-2">{evt.description}</p>
                        )}
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Latest notices */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="font-display text-xs tracking-[0.3em] text-text-secondary/50 uppercase mb-1">NOTICES</p>
                <h2 className="font-title text-2xl text-text-primary">最新公告</h2>
              </div>
              <Link href="/notices" className="text-gold/60 text-sm hover:text-gold transition-colors">
                查看全部 →
              </Link>
            </div>
            <div className="space-y-4">
              {!loaded ? (
                <div className="p-5 bg-bg-card gold-border rounded-sm text-center">
                  <span className="text-text-secondary/50 text-sm">加载中...</span>
                </div>
              ) : displayNotices.length === 0 ? (
                <div className="p-5 bg-bg-card gold-border rounded-sm text-center">
                  <span className="text-text-secondary/50 text-sm">暂无公告</span>
                </div>
              ) : (
                displayNotices.map(notice => (
                  <Link key={notice.id} href="/notices" className="block">
                    <div className="p-5 bg-bg-card gold-border rounded-sm hover:bg-bg-card/80 transition-colors">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-2 py-0.5 text-xs bg-cinnabar/30 text-cinnabar-light rounded">
                          {getNoticeTypeLabel(notice.type)}
                        </span>
                        <span className="text-text-secondary text-xs">{formatDate(notice.created_at)}</span>
                        {notice.is_pinned && <span className="text-gold/60 text-xs">置顶</span>}
                      </div>
                      <h3 className="text-text-primary font-title text-sm">{notice.title}</h3>
                      {notice.summary && (
                        <p className="text-text-secondary text-xs mt-1 line-clamp-1">{notice.summary}</p>
                      )}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Activity Timeline */}
        <div>
          <div className="text-center mb-8">
            <p className="font-display text-xs tracking-[0.3em] text-text-secondary/50 uppercase mb-1">ACTIVITY LOG</p>
            <h2 className="font-title text-2xl text-text-primary">近期活动记录</h2>
          </div>
          {!loaded ? (
            <div className="text-center py-8">
              <span className="text-text-secondary/50 text-sm">加载中...</span>
            </div>
          ) : displayActivities.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-text-secondary/50 text-sm">暂无活动记录</span>
            </div>
          ) : (
            <div className="flex gap-6 overflow-x-auto pb-4">
              {displayActivities.map((record, i) => (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="min-w-[280px] p-5 bg-bg-card gold-border-hover rounded-sm flex-shrink-0"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-0.5 text-xs bg-bg-panel text-text-secondary rounded">{record.type}</span>
                    <span className="text-text-secondary/50 text-xs">{record.activity_date}</span>
                  </div>
                  <h3 className="text-text-primary text-sm font-title mb-2 line-clamp-2">{record.title}</h3>
                  {record.description && (
                    <p className="text-text-secondary text-xs mb-2">{record.description}</p>
                  )}
                  {record.result && (
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      record.result === '胜利' ? 'bg-green-900/30 text-green-400' :
                      record.result === '失败' ? 'bg-red-900/30 text-red-400' :
                      'bg-gold/10 text-gold/70'
                    }`}>
                      {record.result}
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
