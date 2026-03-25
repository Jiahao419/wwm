'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { mockBattleEvent, mockNotices, mockActivityRecords } from '@/lib/mockData';
import { NOTICE_TYPES } from '@/lib/constants';

function getNoticeTypeLabel(type: string) {
  return NOTICE_TYPES.find(t => t.value === type)?.label || type;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

export default function RecentSection() {
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
              <div className="p-5 bg-bg-card gold-border rounded-sm">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2 py-0.5 text-xs bg-gold/20 text-gold rounded">进行中</span>
                  <span className="text-text-secondary text-xs">{formatDate(mockBattleEvent.battle_time!)}</span>
                </div>
                <h3 className="text-text-primary font-title mb-1">{mockBattleEvent.title}</h3>
                <p className="text-text-secondary text-sm">{mockBattleEvent.description}</p>
              </div>
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
              {mockNotices.slice(0, 3).map(notice => (
                <div key={notice.id} className="p-5 bg-bg-card gold-border rounded-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-2 py-0.5 text-xs bg-cinnabar/30 text-cinnabar-light rounded">
                      {getNoticeTypeLabel(notice.type)}
                    </span>
                    <span className="text-text-secondary text-xs">{formatDate(notice.created_at)}</span>
                    {notice.is_pinned && <span className="text-gold/60 text-xs">置顶</span>}
                  </div>
                  <h3 className="text-text-primary font-title text-sm">{notice.title}</h3>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Activity Timeline */}
        <div>
          <div className="text-center mb-8">
            <p className="font-display text-xs tracking-[0.3em] text-text-secondary/50 uppercase mb-1">ACTIVITY LOG</p>
            <h2 className="font-title text-2xl text-text-primary">近期活动记录</h2>
          </div>
          <div className="flex gap-6 overflow-x-auto pb-4">
            {mockActivityRecords.map((record, i) => (
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
                <p className="text-text-secondary text-xs mb-2">{record.description}</p>
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
        </div>
      </div>
    </section>
  );
}
