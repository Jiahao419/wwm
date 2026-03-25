'use client';

import { useState, useEffect } from 'react';
import { BattleEvent } from '@/lib/types';
import { EVENT_TYPES } from '@/lib/constants';
import GoldButton from '@/components/ui/GoldButton';

interface EventOverviewProps {
  event: BattleEvent;
  isAdmin?: boolean;
  onUpdateEvent?: (data: Partial<BattleEvent>) => Promise<void>;
}

function useCountdown(targetTime: string | null) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!targetTime) return;

    const update = () => {
      const diff = new Date(targetTime).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('已开始');
        return;
      }
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      if (days > 0) {
        setTimeLeft(`${days}天${hours}小时${mins}分${secs}秒`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}小时${mins}分${secs}秒`);
      } else {
        setTimeLeft(`${mins}分${secs}秒`);
      }
    };

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [targetTime]);

  return timeLeft;
}

const statusLabels: Record<string, { text: string; class: string }> = {
  upcoming: { text: '即将开始', class: 'bg-blue-900/30 text-blue-400' },
  active: { text: '进行中', class: 'bg-gold/20 text-gold' },
  closed: { text: '报名截止', class: 'bg-orange-900/30 text-orange-400' },
  finished: { text: '已结束', class: 'bg-bg-panel text-text-secondary' },
};

export default function EventOverview({ event, isAdmin, onUpdateEvent }: EventOverviewProps) {
  const status = statusLabels[event.status] || statusLabels.upcoming;
  const typeLabel = EVENT_TYPES[event.event_type]?.label || event.event_type;
  const countdown = useCountdown(event.battle_time);

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(event.title);
  const [opponent, setOpponent] = useState(event.opponent || '');
  const [battleTime, setBattleTime] = useState(event.battle_time || '');
  const [description, setDescription] = useState(event.description || '');
  const [eventStatus, setEventStatus] = useState(event.status);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!onUpdateEvent) return;
    setSaving(true);
    await onUpdateEvent({
      title,
      opponent: opponent || null,
      battle_time: battleTime || null,
      description: description || null,
      status: eventStatus,
    });
    setSaving(false);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="p-6 bg-bg-card gold-border rounded-sm mb-6 space-y-4">
        <h3 className="font-title text-lg text-gold mb-2">编辑战务信息</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-text-secondary text-xs block mb-1">标题</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              className="w-full bg-bg-panel border border-gold/20 rounded px-3 py-2 text-text-primary text-sm focus:border-gold/40 outline-none" />
          </div>
          <div>
            <label className="text-text-secondary text-xs block mb-1">对手</label>
            <input value={opponent} onChange={e => setOpponent(e.target.value)}
              className="w-full bg-bg-panel border border-gold/20 rounded px-3 py-2 text-text-primary text-sm focus:border-gold/40 outline-none" />
          </div>
          <div>
            <label className="text-text-secondary text-xs block mb-1">比赛时间</label>
            <input type="datetime-local" value={battleTime ? battleTime.slice(0, 16) : ''}
              onChange={e => setBattleTime(e.target.value ? new Date(e.target.value).toISOString() : '')}
              className="w-full bg-bg-panel border border-gold/20 rounded px-3 py-2 text-text-primary text-sm focus:border-gold/40 outline-none" />
          </div>
          <div>
            <label className="text-text-secondary text-xs block mb-1">状态</label>
            <select value={eventStatus} onChange={e => setEventStatus(e.target.value as BattleEvent['status'])}
              className="w-full bg-bg-panel border border-gold/20 rounded px-3 py-2 text-text-primary text-sm focus:border-gold/40 outline-none">
              <option value="upcoming">即将开始</option>
              <option value="active">进行中</option>
              <option value="closed">报名截止</option>
              <option value="finished">已结束</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-text-secondary text-xs block mb-1">描述/公告</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
            className="w-full bg-bg-panel border border-gold/20 rounded px-3 py-2 text-text-primary text-sm focus:border-gold/40 outline-none resize-none" />
        </div>
        <div className="flex gap-2">
          <GoldButton variant="primary" size="sm" onClick={handleSave} disabled={saving}>
            {saving ? '保存中...' : '保存'}
          </GoldButton>
          <GoldButton variant="ghost" size="sm" onClick={() => setEditing(false)}>取消</GoldButton>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-bg-card gold-border rounded-sm mb-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className={`px-2 py-0.5 text-xs rounded ${status.class}`}>{status.text}</span>
            <span className="px-2 py-0.5 text-xs bg-bg-panel text-text-secondary rounded">{typeLabel}</span>
            {isAdmin && (
              <button onClick={() => setEditing(true)}
                className="text-xs text-gold/50 hover:text-gold border border-gold/20 hover:border-gold/40 px-2 py-0.5 rounded-sm transition-colors">
                编辑
              </button>
            )}
          </div>
          <h2 className="font-title text-2xl text-text-primary mb-2">{event.title}</h2>
          <div className="flex items-center gap-6 text-sm text-text-secondary">
            {event.opponent && <span>对手：{event.opponent}</span>}
            {event.battle_time && (
              <span>比赛时间：{new Date(event.battle_time).toLocaleString('zh-CN')}</span>
            )}
            {event.battle_time && countdown && (
              <span>距比赛开始：<span className="text-gold font-mono">{countdown}</span></span>
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
