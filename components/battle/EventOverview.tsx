'use client';

import { BattleEvent } from '@/lib/types';
import { EVENT_TYPES } from '@/lib/constants';

interface EventOverviewProps {
  event: BattleEvent;
}

function getCountdown(deadline: string) {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return '已截止';
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return `${days}天${hours}小时`;
  const mins = Math.floor((diff % 3600000) / 60000);
  return `${hours}小时${mins}分`;
}

const statusLabels: Record<string, { text: string; class: string }> = {
  upcoming: { text: '即将开始', class: 'bg-blue-900/30 text-blue-400' },
  active: { text: '进行中', class: 'bg-gold/20 text-gold' },
  closed: { text: '报名截止', class: 'bg-orange-900/30 text-orange-400' },
  finished: { text: '已结束', class: 'bg-bg-panel text-text-secondary' },
};

export default function EventOverview({ event }: EventOverviewProps) {
  const status = statusLabels[event.status] || statusLabels.upcoming;
  const typeLabel = EVENT_TYPES[event.event_type]?.label || event.event_type;

  return (
    <div className="p-6 bg-bg-card gold-border rounded-sm mb-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className={`px-2 py-0.5 text-xs rounded ${status.class}`}>{status.text}</span>
            <span className="px-2 py-0.5 text-xs bg-bg-panel text-text-secondary rounded">{typeLabel}</span>
          </div>
          <h2 className="font-title text-2xl text-text-primary mb-2">{event.title}</h2>
          <div className="flex items-center gap-6 text-sm text-text-secondary">
            {event.opponent && <span>对手：{event.opponent}</span>}
            {event.battle_time && (
              <span>比赛时间：{new Date(event.battle_time).toLocaleString('zh-CN')}</span>
            )}
            {event.signup_deadline && (
              <span>报名截止倒计时：<span className="text-gold">{getCountdown(event.signup_deadline)}</span></span>
            )}
          </div>
        </div>
        {event.description && (
          <p className="text-text-secondary text-sm max-w-sm text-right">{event.description}</p>
        )}
      </div>
    </div>
  );
}
