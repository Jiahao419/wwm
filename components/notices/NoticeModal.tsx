'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GoldButton from '@/components/ui/GoldButton';
import { NOTICE_TYPES } from '@/lib/constants';
import { createNotice, updateNotice } from '@/lib/db';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/providers/AuthProvider';
import { useAuditLog } from '@/lib/useAuditLog';
import type { Notice } from '@/lib/types';

interface NoticeModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  notice?: Notice | null;
}

export default function NoticeModal({ open, onClose, onSaved, notice }: NoticeModalProps) {
  const { user } = useAuth();
  const audit = useAuditLog();
  const isEdit = !!notice;
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('event');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const inputCls = 'w-full bg-bg-card border border-gold/10 px-4 py-2.5 text-text-primary text-sm focus:border-gold/40 focus:outline-none transition-colors rounded-sm';

  useEffect(() => {
    if (notice) {
      setTitle(notice.title);
      setType(notice.type);
      setSummary(notice.summary || '');
      setContent(notice.content || '');
      setIsPinned(notice.is_pinned);
      setImageUrl(notice.image_url || null);
    } else {
      setTitle('');
      setType('event');
      setSummary('');
      setContent('');
      setIsPinned(false);
      setImageUrl(null);
    }
  }, [notice, open]);

  const handleImageUpload = async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop();
      const path = `notices/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('avatars').upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      setImageUrl(publicUrl);
    } catch (err) {
      console.error('Upload failed:', err);
      alert('图片上传失败');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

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
          image_url: imageUrl,
          is_pinned: isPinned,
        });
      } else {
        await createNotice({
          title: title.trim(),
          type,
          summary: summary.trim() || null,
          content: content.trim() || null,
          image_url: imageUrl,
          is_pinned: isPinned,
          created_by: user.id,
        });
      }
      audit({ action: isEdit ? '编辑公告' : '发布公告', category: 'notice', targetType: 'notice', targetId: notice?.id, details: { title: title.trim() } });
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

                {/* Image upload */}
                <div>
                  <label className="block text-text-secondary text-sm mb-1.5">附图</label>
                  {imageUrl && (
                    <div className="relative mb-2">
                      <img src={imageUrl} alt="公告图片" className="w-full max-h-[200px] object-contain rounded-sm border border-gold/10" />
                      <button
                        onClick={() => setImageUrl(null)}
                        className="absolute top-1 right-1 w-6 h-6 bg-black/70 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 transition-colors"
                      >✕</button>
                    </div>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) handleImageUpload(f);
                    }}
                  />
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="text-sm text-gold/60 hover:text-gold border border-gold/10 hover:border-gold/30 px-3 py-1.5 rounded-sm transition-colors"
                  >
                    {uploading ? '上传中...' : imageUrl ? '更换图片' : '+ 上传图片'}
                  </button>
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
