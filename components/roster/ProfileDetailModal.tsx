'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Profile } from '@/lib/types';
import TagBadge from '@/components/ui/TagBadge';
import GoldButton from '@/components/ui/GoldButton';
import { createClient } from '@/lib/supabase/client';
import { updateProfile } from '@/lib/db';

interface ProfileDetailModalProps {
  profile: Profile;
  canEdit: boolean;
  isAdminOrOwner: boolean;
  isOwner: boolean;
  isSelf: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSetAdmin?: () => void;
  onRemoveAdmin?: () => void;
  onRefresh?: () => void;
}

export default function ProfileDetailModal({
  profile,
  canEdit,
  isAdminOrOwner,
  isOwner,
  isSelf,
  onClose,
  onEdit,
  onDelete,
  onSetAdmin,
  onRemoveAdmin,
  onRefresh,
}: ProfileDetailModalProps) {
  const firstChar = profile.nickname.charAt(0);
  const [showcaseUrl, setShowcaseUrl] = useState(profile.showcase_url || '');
  const [uploading, setUploading] = useState(false);
  const [viewingShowcase, setViewingShowcase] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleShowcaseUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop();
      const path = `showcase/${profile.id}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
      if (error) {
        // try gallery bucket
        const { error: err2 } = await supabase.storage.from('gallery').upload(path, file, { upsert: true });
        if (err2) { alert('上传失败: ' + err2.message); setUploading(false); return; }
        const { data: d2 } = supabase.storage.from('gallery').getPublicUrl(path);
        setShowcaseUrl(d2.publicUrl);
        await updateProfile(profile.id, { showcase_url: d2.publicUrl } as any);
      } else {
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
        setShowcaseUrl(urlData.publicUrl);
        await updateProfile(profile.id, { showcase_url: urlData.publicUrl } as any);
      }
      onRefresh?.();
    } catch (err) {
      console.error(err);
      alert('上传失败');
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Showcase fullscreen viewer */}
        {viewingShowcase && showcaseUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[60] bg-black/90 flex items-center justify-center cursor-pointer"
            onClick={() => setViewingShowcase(false)}
          >
            <img src={showcaseUrl} alt={profile.nickname} className="max-w-[90vw] max-h-[90vh] object-contain" />
            <div className="absolute top-6 right-6 text-white/50 text-sm">点击任意处关闭</div>
          </motion.div>
        )}

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="relative bg-bg-panel border border-gold/20 rounded-sm w-[600px] max-h-[90vh] overflow-y-auto"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center
                       text-text-secondary/60 hover:text-gold bg-black/40 backdrop-blur-sm
                       rounded-full border border-gold/10 hover:border-gold/30 transition-all"
          >
            ✕
          </button>

          {/* Large Image */}
          <div className="relative w-full h-[280px] overflow-hidden">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.nickname}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${profile.node_color || '#9a8a6a'}22, ${profile.node_color || '#9a8a6a'}55)`,
                }}
              >
                <span
                  className="font-brush text-8xl opacity-50 select-none"
                  style={{ color: profile.node_color || '#9a8a6a' }}
                >
                  {firstChar}
                </span>
              </div>
            )}

            {/* Gradient overlay at bottom of image */}
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-bg-panel to-transparent" />
          </div>

          {/* Content */}
          <div className="px-8 pb-8 -mt-6 relative">
            {/* Nickname & badges */}
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h2 className="font-title text-2xl text-text-primary">{profile.nickname}</h2>
              {profile.identity && (
                <span className="px-2.5 py-0.5 text-xs bg-gold/15 text-gold rounded border border-gold/20">
                  {profile.identity}
                </span>
              )}
              {profile.role === 'owner' && (
                <span className="px-2.5 py-0.5 text-xs bg-cinnabar/20 text-cinnabar-light rounded border border-cinnabar/30">
                  坛主
                </span>
              )}
              {profile.role === 'admin' && (
                <span className="px-2.5 py-0.5 text-xs bg-blue-900/30 text-blue-300 rounded border border-blue-500/30">
                  管理员
                </span>
              )}
              {isSelf && (
                <span className="px-2.5 py-0.5 text-xs bg-green-900/30 text-green-300 rounded border border-green-500/30">
                  我
                </span>
              )}
            </div>

            {/* Intro */}
            {profile.intro && (
              <p className="text-text-primary/80 text-sm mb-3 leading-relaxed">{profile.intro}</p>
            )}

            {/* Description */}
            {profile.description && (
              <p className="text-text-secondary text-sm mb-4 leading-relaxed whitespace-pre-wrap">
                {profile.description}
              </p>
            )}

            {/* Tags */}
            {profile.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {profile.tags.map(tag => (
                  <TagBadge key={tag} tag={tag} size="sm" />
                ))}
              </div>
            )}

            {/* Showcase Image */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-text-secondary text-xs">展示大图</span>
                {(canEdit) && (
                  <>
                    <input ref={fileRef} type="file" accept="image/*" onChange={handleShowcaseUpload} className="hidden" />
                    <button
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                      className="text-[10px] text-gold/50 hover:text-gold border border-gold/15 hover:border-gold/40 px-2 py-0.5 rounded-sm transition-colors"
                    >
                      {uploading ? '上传中...' : showcaseUrl ? '更换' : '上传'}
                    </button>
                  </>
                )}
              </div>
              {showcaseUrl ? (
                <motion.div
                  className="relative rounded-sm overflow-hidden border border-gold/10 cursor-pointer group/showcase"
                  whileHover={{ scale: 1.01 }}
                  onClick={() => setViewingShowcase(true)}
                >
                  <img
                    src={showcaseUrl}
                    alt={`${profile.nickname} 展示图`}
                    className="w-full max-h-[400px] object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover/showcase:bg-black/20 transition-colors flex items-center justify-center">
                    <span className="text-white/0 group-hover/showcase:text-white/80 transition-colors text-sm">
                      点击查看大图
                    </span>
                  </div>
                </motion.div>
              ) : (
                <div className="h-24 rounded-sm border border-dashed border-gold/10 flex items-center justify-center">
                  <span className="text-text-secondary/20 text-xs">暂无展示图</span>
                </div>
              )}
            </div>

            {/* Discord */}
            {profile.discord_username && (
              <div className="flex items-center gap-2 text-sm text-text-secondary mb-6 py-2 px-3 bg-bg-card rounded border border-gold/5">
                <svg className="w-4 h-4 text-[#5865F2] flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
                </svg>
                <span>{profile.discord_username}</span>
              </div>
            )}

            {/* Action Buttons */}
            {(canEdit || isAdminOrOwner) && (
              <div className="flex gap-3 pt-4 border-t border-gold/10">
                {canEdit && (
                  <GoldButton variant="secondary" size="sm" onClick={onEdit}>
                    {isSelf ? '编辑我的档案' : '编辑档案'}
                  </GoldButton>
                )}
                {isAdminOrOwner && (
                  <GoldButton
                    variant="ghost"
                    size="sm"
                    onClick={onDelete}
                    className="text-cinnabar-light/70 hover:text-cinnabar-light"
                  >
                    删除
                  </GoldButton>
                )}
                {isOwner && profile.role === 'member' && onSetAdmin && (
                  <GoldButton variant="ghost" size="sm" onClick={onSetAdmin} className="text-blue-300/70 hover:text-blue-300">
                    设为管理
                  </GoldButton>
                )}
                {isOwner && profile.role === 'admin' && onRemoveAdmin && (
                  <GoldButton variant="ghost" size="sm" onClick={onRemoveAdmin} className="text-yellow-300/70 hover:text-yellow-300">
                    取消管理
                  </GoldButton>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
