'use client';

import { useState, useEffect, useRef } from 'react';
import { Notice, NoticeComment, Profile } from '@/lib/types';
import { NOTICE_TYPES } from '@/lib/constants';
import { getNoticeComments, createNoticeComment, deleteNoticeComment, getProfiles } from '@/lib/db';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/providers/AuthProvider';

interface NoticeCardProps {
  notice: Notice;
  isPinned?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  isAdminOrOwner?: boolean;
  onEdit?: (notice: Notice) => void;
  onDelete?: (notice: Notice) => void;
}

function getTypeLabel(type: string) {
  return NOTICE_TYPES.find(t => t.value === type)?.label || type;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return `${String(d.getMonth() + 1)}/${String(d.getDate())} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function NoticeCard({ notice, isPinned, expanded, onToggle, isAdminOrOwner, onEdit, onDelete }: NoticeCardProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<NoticeComment[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentImage, setCommentImage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchComments = async () => {
    const { data } = await getNoticeComments(notice.id);
    if (data) setComments(data as NoticeComment[]);
  };

  // Fetch profiles once
  useEffect(() => {
    getProfiles().then(({ data }) => { if (data) setProfiles(data); });
  }, []);

  useEffect(() => {
    if (expanded) fetchComments();
  }, [expanded, notice.id]);

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop();
      const path = `comments/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('avatars').upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      setCommentImage(publicUrl);
    } catch (err) {
      console.error('Upload failed:', err);
      alert('图片上传失败');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleSubmitComment = async () => {
    if ((!commentText.trim() && !commentImage) || !user) return;
    setSubmitting(true);
    try {
      await createNoticeComment({
        notice_id: notice.id,
        user_id: user.id,
        content: commentText.trim() || '(图片)',
        image_url: commentImage,
      });
      setCommentText('');
      setCommentImage(null);
      await fetchComments();
    } catch (err) {
      console.error('Comment failed:', err);
      alert('评论失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('确定删除该评论？')) return;
    await deleteNoticeComment(commentId);
    await fetchComments();
  };

  return (
    <div
      className={`bg-bg-card rounded-sm overflow-hidden transition-all ${
        isPinned ? 'border-l-4 border-l-gold gold-border' : 'gold-border-hover'
      }`}
    >
      <div
        className="p-5 cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3 mb-2">
          <span className="px-2 py-0.5 text-xs bg-cinnabar/20 text-cinnabar-light rounded">
            {getTypeLabel(notice.type)}
          </span>
          <span className="text-text-secondary/50 text-xs">{formatDate(notice.created_at)}</span>
          {notice.is_pinned && <span className="text-gold/60 text-xs">置顶</span>}

          {isAdminOrOwner && (
            <div className="ml-auto flex gap-2" onClick={e => e.stopPropagation()}>
              <button
                onClick={() => onEdit?.(notice)}
                className="text-xs text-gold/60 hover:text-gold transition-colors px-2 py-0.5 border border-gold/10 rounded-sm hover:border-gold/30"
              >编辑</button>
              <button
                onClick={() => onDelete?.(notice)}
                className="text-xs text-cinnabar-light/60 hover:text-cinnabar-light transition-colors px-2 py-0.5 border border-cinnabar/10 rounded-sm hover:border-cinnabar/30"
              >删除</button>
            </div>
          )}
        </div>
        <h3 className="font-title text-lg text-text-primary mb-1">{notice.title}</h3>
        {notice.summary && (
          <p className="text-text-secondary text-sm">{notice.summary}</p>
        )}
      </div>

      {/* Expanded content + image + comments */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-gold/10 pt-4" onClick={e => e.stopPropagation()}>
          {/* Notice content */}
          {notice.content && (
            <div className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap mb-4">
              {notice.content}
            </div>
          )}

          {/* Notice image */}
          {notice.image_url && (
            <div className="mb-4">
              <img
                src={notice.image_url}
                alt="公告图片"
                className="max-w-full max-h-[400px] object-contain rounded-sm border border-gold/10 cursor-pointer"
                onClick={() => window.open(notice.image_url!, '_blank')}
              />
            </div>
          )}

          {/* Comments section */}
          <div className="mt-4 border-t border-gold/10 pt-4">
            <h4 className="text-text-secondary text-sm font-title mb-3">
              评论 ({comments.length})
            </h4>

            {/* Comment list */}
            {comments.length > 0 && (
              <div className="space-y-3 mb-4">
                {comments.map(c => {
                  const p = profiles.find(pr => pr.user_id === c.user_id);
                  return (
                  <div key={c.id} className="flex gap-3 group">
                    {/* Avatar */}
                    <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden bg-gold/10 flex items-center justify-center">
                      {p?.avatar_url ? (
                        <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs text-gold/60">{p?.nickname?.charAt(0) || '?'}</span>
                      )}
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gold/80 font-title">{p?.nickname || '未知用户'}</span>
                        <span className="text-[10px] text-text-secondary/40">{formatTime(c.created_at)}</span>
                        {/* Delete button */}
                        {(isAdminOrOwner || c.user_id === user?.id) && (
                          <button
                            onClick={() => handleDeleteComment(c.id)}
                            className="text-[10px] text-red-400/0 group-hover:text-red-400/60 hover:!text-red-400 transition-colors ml-auto"
                          >删除</button>
                        )}
                      </div>
                      <p className="text-text-secondary text-sm mt-0.5">{c.content}</p>
                      {c.image_url && (
                        <img
                          src={c.image_url}
                          alt="评论图片"
                          className="mt-1.5 max-w-[200px] max-h-[150px] object-contain rounded-sm border border-gold/10 cursor-pointer"
                          onClick={() => window.open(c.image_url!, '_blank')}
                        />
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>
            )}

            {/* Comment input */}
            {user ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    placeholder="写评论..."
                    className="flex-1 bg-bg-primary border border-gold/10 px-3 py-2 text-text-primary text-sm focus:border-gold/40 focus:outline-none transition-colors rounded-sm"
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmitComment(); } }}
                  />
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
                    className="text-gold/40 hover:text-gold border border-gold/10 hover:border-gold/30 px-2 rounded-sm transition-colors text-sm"
                    title="上传图片"
                  >
                    {uploading ? '...' : '📷'}
                  </button>
                  <button
                    onClick={handleSubmitComment}
                    disabled={submitting || (!commentText.trim() && !commentImage)}
                    className="text-sm bg-gold/10 text-gold hover:bg-gold/20 disabled:opacity-30 px-3 py-2 rounded-sm transition-colors"
                  >
                    {submitting ? '...' : '发送'}
                  </button>
                </div>
                {commentImage && (
                  <div className="relative inline-block">
                    <img src={commentImage} alt="预览" className="max-w-[100px] max-h-[80px] object-contain rounded-sm border border-gold/10" />
                    <button
                      onClick={() => setCommentImage(null)}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-black/70 text-white rounded-full text-[10px] flex items-center justify-center hover:bg-red-600"
                    >✕</button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-text-secondary/40 text-xs">登录后可以评论</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
