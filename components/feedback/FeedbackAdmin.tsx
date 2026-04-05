'use client';

import { useState, useEffect, useCallback } from 'react';
import GoldButton from '@/components/ui/GoldButton';
import { getFeedback, updateFeedback, deleteFeedback } from '@/lib/db';
import { useAuditLog } from '@/lib/useAuditLog';
import type { Feedback } from '@/lib/types';

const TYPE_LABELS: Record<string, string> = {
  suggestion: '功能建议',
  bug: 'Bug反馈',
  review: '评价吐槽',
};

const TYPE_COLORS: Record<string, string> = {
  suggestion: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10',
  bug: 'text-red-400 border-red-400/30 bg-red-400/10',
  review: 'text-blue-400 border-blue-400/30 bg-blue-400/10',
};

const STATUS_LABELS: Record<string, string> = {
  pending: '待处理',
  resolved: '已解决',
};

interface FeedbackAdminProps {
  onClose: () => void;
  onCountChange?: (count: number) => void;
}

export default function FeedbackAdmin({ onClose, onCountChange }: FeedbackAdminProps) {
  const audit = useAuditLog();
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const { data } = await getFeedback();
    if (data) {
      setFeedbackList(data);
      onCountChange?.(data.filter((f) => f.status === 'pending').length);
    }
    setLoading(false);
  }, [onCountChange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = feedbackList.filter((f) => {
    if (filterType !== 'all' && f.type !== filterType) return false;
    if (filterStatus !== 'all' && f.status !== filterStatus) return false;
    return true;
  });

  const handleReply = async (id: string) => {
    if (!replyText.trim()) return;
    setActionLoading(id);
    await updateFeedback(id, { admin_reply: replyText.trim() });
    audit({ action: '回复反馈', category: 'feedback', targetType: 'feedback', targetId: id });
    setReplyingId(null);
    setReplyText('');
    setActionLoading(null);
    fetchData();
  };

  const handleResolve = async (id: string) => {
    setActionLoading(id);
    await updateFeedback(id, { status: 'resolved' });
    audit({ action: '标记反馈已解决', category: 'feedback', targetType: 'feedback', targetId: id });
    setActionLoading(null);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除这条反馈？')) return;
    setActionLoading(id);
    await deleteFeedback(id);
    audit({ action: '删除反馈', category: 'feedback', targetType: 'feedback', targetId: id });
    setActionLoading(null);
    fetchData();
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-3xl max-h-[85vh] glass-heavy border border-gold/20 shadow-xl shadow-black/40 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gold/10 shrink-0">
          <h2 className="text-lg font-title text-gold tracking-wider">反馈管理</h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-gold transition-colors text-xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 px-5 py-3 border-b border-gold/10 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-text-secondary text-xs">类型:</span>
            {[{ v: 'all', l: '全部' }, { v: 'suggestion', l: '建议' }, { v: 'bug', l: 'Bug' }, { v: 'review', l: '吐槽' }].map((opt) => (
              <button
                key={opt.v}
                onClick={() => setFilterType(opt.v)}
                className={`px-2 py-0.5 text-xs border transition-colors ${
                  filterType === opt.v
                    ? 'border-gold/50 text-gold bg-gold/10'
                    : 'border-gold/10 text-text-secondary hover:text-text-primary'
                }`}
              >
                {opt.l}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-text-secondary text-xs">状态:</span>
            {[{ v: 'all', l: '全部' }, { v: 'pending', l: '待处理' }, { v: 'resolved', l: '已解决' }].map((opt) => (
              <button
                key={opt.v}
                onClick={() => setFilterStatus(opt.v)}
                className={`px-2 py-0.5 text-xs border transition-colors ${
                  filterStatus === opt.v
                    ? 'border-gold/50 text-gold bg-gold/10'
                    : 'border-gold/10 text-text-secondary hover:text-text-primary'
                }`}
              >
                {opt.l}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {loading ? (
            <div className="text-center text-text-secondary py-10">加载中...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-text-secondary py-10">暂无反馈</div>
          ) : (
            filtered.map((fb) => (
              <div
                key={fb.id}
                className={`border p-4 transition-colors ${
                  fb.status === 'resolved' ? 'border-gold/10 opacity-70' : 'border-gold/20'
                }`}
              >
                {/* Top row: type badge, nickname, date, status */}
                <div className="flex items-center flex-wrap gap-2 mb-2">
                  <span className={`px-2 py-0.5 text-xs border ${TYPE_COLORS[fb.type] || 'text-text-secondary border-gold/20'}`}>
                    {TYPE_LABELS[fb.type] || fb.type}
                  </span>
                  <span className="text-text-secondary text-xs">{fb.nickname}</span>
                  <span className="text-text-secondary/50 text-xs ml-auto">
                    {new Date(fb.created_at).toLocaleString('zh-CN')}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-xs border ${
                      fb.status === 'resolved'
                        ? 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10'
                        : 'text-amber-400 border-amber-400/30 bg-amber-400/10'
                    }`}
                  >
                    {STATUS_LABELS[fb.status] || fb.status}
                  </span>
                </div>

                {/* Content */}
                <p className="text-text-primary text-sm whitespace-pre-wrap mb-3">{fb.content}</p>

                {/* Admin reply display */}
                {fb.admin_reply && (
                  <div className="bg-gold/5 border-l-2 border-gold/30 px-3 py-2 mb-3">
                    <span className="text-gold text-xs font-semibold">管理员回复：</span>
                    <p className="text-text-secondary text-sm mt-1">{fb.admin_reply}</p>
                  </div>
                )}

                {/* Reply input */}
                {replyingId === fb.id && (
                  <div className="flex gap-2 mb-3">
                    <input
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="输入回复..."
                      className="flex-1 bg-black/30 border border-gold/20 text-text-primary text-sm px-3 py-1.5 focus:outline-none focus:border-gold/50"
                    />
                    <GoldButton size="sm" onClick={() => handleReply(fb.id)} disabled={actionLoading === fb.id}>
                      发送
                    </GoldButton>
                    <GoldButton variant="ghost" size="sm" onClick={() => { setReplyingId(null); setReplyText(''); }}>
                      取消
                    </GoldButton>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => { setReplyingId(fb.id); setReplyText(fb.admin_reply || ''); }}
                    className="text-xs text-text-secondary hover:text-gold transition-colors"
                  >
                    {fb.admin_reply ? '修改回复' : '回复'}
                  </button>
                  {fb.status !== 'resolved' && (
                    <button
                      onClick={() => handleResolve(fb.id)}
                      disabled={actionLoading === fb.id}
                      className="text-xs text-text-secondary hover:text-emerald-400 transition-colors"
                    >
                      标记已解决
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(fb.id)}
                    disabled={actionLoading === fb.id}
                    className="text-xs text-text-secondary hover:text-cinnabar transition-colors ml-auto"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
