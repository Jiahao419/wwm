'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GoldButton from '@/components/ui/GoldButton';
import { NOTICE_TYPES } from '@/lib/constants';
import { createNotice, updateNotice } from '@/lib/db';
import { useAuth } from '@/components/providers/AuthProvider';
import type { Notice } from '@/lib/types';

interface NoticeModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  notice?: Notice | null; // if provided, edit mode
}

export default function NoticeModal({ open, onClose, onSaved, notice }: NoticeModalProps) {
  const { user } = useAuth();
  const isEdit = !!notice;
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('event');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);

  const inputCls = 'w-full bg-bg-card border border-gold/10 px-4 py-2.5 text-text-primary text-sm focus:border-gold/40 focus:outline-none transition-colors rounded-sm';

  // Populate fields when editing
  useEffect(() => {
    if (notice) {
      setTitle(notice.title);
      setType(notice.type);
      setSummary(notice.summary || '');
      setContent(notice.content || '');
      setIsPinned(notice.is_pinned);
    } else {
      setTitle('');
      setType('event');
      setSummary('');
      setContent('');
      setIsPinned(false);
    }
  }, [notice, open]);

  const handleSubmit = async () => {
    if (!title.trim() || !user) return;
    setSubmitting(true);
    try {
      if (isEdit && notice) {
        await updateNotice(notice.id, {
          title: title.trim(),
          type,
          summary: summary.trim() || null,
          content: content.trim() || null,
          is_pinned: isPinned,
        });
      } else {
        await createNotice({
          title: title.trim(),
          type,
          summary: summary.trim() || null,
          content: content.trim() || null,
          is_pinned: isPinned,
          created_by: user.id,
        });
      }
      onSaved();
      onClose();
    } catch (err) {
      console.error('Failed to save notice:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-lg bg-bg-primary border border-gold/20 rounded-sm shadow-2xl max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6">
              <h2 className="font-title text-xl text-gold mb-6">
                {isEdit ? '编辑公告' : '发布公告'}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-text-secondary text-sm mb-1.5">标题 *</label>
                  <input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="公告标题"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block text-text-secondary text-sm mb-1.5">类型</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value)}
                    className={inputCls}
                  >
                    {NOTICE_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-text-secondary text-sm mb-1.5">摘要</label>
                  <input
                    value={summary}
                    onChange={e => setSummary(e.target.value)}
                    placeholder="简短摘要"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block text-text-secondary text-sm mb-1.5">正文</label>
                  <textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="公告详细内容"
                    rows={6}
                    className={`${inputCls} resize-none`}
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPinned}
                    onChange={e => setIsPinned(e.target.checked)}
                    className="accent-gold w-4 h-4"
                  />
                  <span className="text-text-secondary text-sm">置顶</span>
                </label>
              </div>

              <div className="flex gap-3 mt-6">
                <GoldButton
                  variant="secondary"
                  className="flex-1"
                  onClick={onClose}
                  disabled={submitting}
                >
                  取消
                </GoldButton>
                <GoldButton
                  variant="primary"
                  className="flex-1"
                  onClick={handleSubmit}
                  disabled={submitting || !title.trim()}
                >
                  {submitting ? '保存中...' : isEdit ? '保存修改' : '发布公告'}
                </GoldButton>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
