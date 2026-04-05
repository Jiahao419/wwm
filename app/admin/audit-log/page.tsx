'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { getAuditLogs } from '@/lib/db';
import type { AuditLog } from '@/lib/types';

const CATEGORIES = [
  { key: '', label: '全部' },
  { key: 'event', label: '赛事' },
  { key: 'signup', label: '报名' },
  { key: 'assignment', label: '分配' },
  { key: 'dungeon', label: '副本' },
  { key: 'notice', label: '公告' },
  { key: 'relation', label: '关系' },
  { key: 'gallery', label: '画廊' },
  { key: 'roster', label: '名册' },
  { key: 'feedback', label: '反馈' },
];

export default function AuditLogPage() {
  const { user, loading } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [category, setCategory] = useState('');
  const [fetching, setFetching] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    // Check owner role from user metadata or profiles
    (async () => {
      const { getProfiles } = await import('@/lib/db');
      const { data } = await getProfiles();
      if (data) {
        const me = data.find(p => p.user_id === user.id);
        if (me?.role === 'owner') {
          setIsOwner(true);
        }
      }
    })();
  }, [user, loading]);

  useEffect(() => {
    if (!isOwner) return;
    (async () => {
      setFetching(true);
      const { data } = await getAuditLogs(500);
      if (data) setLogs(data);
      setFetching(false);
    })();
  }, [isOwner]);

  if (loading) return <div className="min-h-screen pt-24 text-center text-text-secondary">loading...</div>;
  if (!user || !isOwner) {
    return (
      <div className="min-h-screen pt-24 text-center text-text-secondary">
        <p className="text-lg">403 - 仅坛主可访问</p>
      </div>
    );
  }

  const filtered = category ? logs.filter(l => l.category === category) : logs;

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 md:px-8 max-w-[1200px] mx-auto">
      <h1 className="font-title text-2xl text-gold mb-6">审计日志</h1>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIES.map(c => (
          <button
            key={c.key}
            onClick={() => setCategory(c.key)}
            className={`px-3 py-1 text-xs border transition-colors ${
              category === c.key
                ? 'border-gold text-gold bg-gold/10'
                : 'border-gold/20 text-text-secondary hover:text-gold hover:border-gold/40'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {fetching ? (
        <div className="text-text-secondary text-sm">加载中...</div>
      ) : filtered.length === 0 ? (
        <div className="text-text-secondary text-sm">暂无记录</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gold/20 text-text-secondary text-xs">
                <th className="text-left py-2 px-2 w-32">时间</th>
                <th className="text-left py-2 px-2 w-24">操作者</th>
                <th className="text-left py-2 px-2 w-16">分类</th>
                <th className="text-left py-2 px-2">操作</th>
                <th className="text-left py-2 px-2">详情</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(log => (
                <tr key={log.id} className="border-b border-gold/5 hover:bg-gold/5 transition-colors">
                  <td className="py-2 px-2 text-text-secondary/60 text-xs whitespace-nowrap">{formatTime(log.created_at)}</td>
                  <td className="py-2 px-2 text-gold/80 text-xs">{log.user_nickname}</td>
                  <td className="py-2 px-2 text-xs">
                    <span className="px-1.5 py-0.5 bg-gold/10 text-gold/70 border border-gold/20 text-[10px]">
                      {CATEGORIES.find(c => c.key === log.category)?.label || log.category}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-text-primary text-xs">{log.action}</td>
                  <td className="py-2 px-2 text-text-secondary/60 text-xs max-w-xs truncate">
                    {log.details && Object.keys(log.details).length > 0
                      ? Object.entries(log.details).map(([k, v]) => `${k}: ${v}`).join(', ')
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
