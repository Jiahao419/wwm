'use client';

import { useState } from 'react';
import GoldButton from '@/components/ui/GoldButton';
import { useAuth } from '@/components/providers/AuthProvider';
import { createFeedback } from '@/lib/db';

const FEEDBACK_TYPES = [
  { value: 'suggestion', label: '功能建议' },
  { value: 'bug', label: 'Bug反馈' },
  { value: 'review', label: '评价吐槽' },
] as const;

interface FeedbackModalProps {
  onClose: () => void;
  onSubmitted?: () => void;
}

export default function FeedbackModal({ onClose, onSubmitted }: FeedbackModalProps) {
  const { user, profile } = useAuth();
  const [type, setType] = useState<string>('suggestion');
  const [content, setContent] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const nickname = anonymous || !profile ? '匿名用户' : profile.nickname;

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      const { error } = await createFeedback({
        user_id: anonymous ? null : (user?.id || null),
        nickname,
        type,
        content: content.trim(),
      });
      if (error) {
        alert('提交失败：' + error.message);
      } else {
        onSubmitted?.();
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg glass-heavy border border-gold/20 p-6 shadow-xl shadow-black/40"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-title text-gold tracking-wider">意见反馈</h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-gold transition-colors text-xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Type selector */}
        <div className="mb-4">
          <label className="block text-text-secondary text-sm mb-2">反馈类型</label>
          <div className="flex gap-2">
            {FEEDBACK_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setType(t.value)}
                className={`flex-1 px-3 py-2 text-sm border transition-all duration-200 ${
                  type === t.value
                    ? 'border-gold text-gold bg-gold/10'
                    : 'border-gold/20 text-text-secondary hover:border-gold/40 hover:text-text-primary'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="mb-4">
          <label className="block text-text-secondary text-sm mb-2">反馈内容</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="请描述你的建议或遇到的问题..."
            rows={5}
            className="w-full bg-black/30 border border-gold/20 text-text-primary placeholder-text-secondary/50 px-3 py-2.5 text-sm focus:outline-none focus:border-gold/50 resize-none"
          />
        </div>

        {/* Anonymous toggle - only for logged in users */}
        {user && profile && (
          <div className="mb-5 flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={anonymous}
                onChange={(e) => setAnonymous(e.target.checked)}
                className="w-4 h-4 accent-gold/80"
              />
              <span className="text-text-secondary text-sm">匿名提交</span>
            </label>
            {!anonymous && (
              <span className="text-text-secondary/60 text-xs">
                将以 <span className="text-gold/80">{profile.nickname}</span> 的身份提交
              </span>
            )}
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <GoldButton variant="ghost" size="sm" onClick={onClose}>
            取消
          </GoldButton>
          <GoldButton
            size="sm"
            onClick={handleSubmit}
            disabled={!content.trim() || submitting}
            className={!content.trim() || submitting ? 'opacity-50 cursor-not-allowed' : ''}
          >
            {submitting ? '提交中...' : '提交反馈'}
          </GoldButton>
        </div>
      </div>
    </div>
  );
}
