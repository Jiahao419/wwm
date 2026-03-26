'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Profile } from '@/lib/types';
import TagBadge from '@/components/ui/TagBadge';
import GoldButton from '@/components/ui/GoldButton';
import ImageCropper from '@/components/ui/ImageCropper';
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
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Step 1: User selects a file → show cropper
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(file);
    if (fileRef.current) fileRef.current.value = '';
  };

  // Step 2: After cropping → upload the cropped blob
  const handleCroppedUpload = async (blob: Blob) => {
    setCropSrc(null);
    setUploading(true);
    try {
      const supabase = createClient();
      const path = `showcase/${profile.id}-${Date.now()}.jpg`;
      let publicUrl = '';
      const { error: err1 } = await supabase.storage.from('gallery').upload(path, blob, { upsert: true, contentType: 'image/jpeg' });
      if (!err1) {
        const { data } = supabase.storage.from('gallery').getPublicUrl(path);
        publicUrl = data.publicUrl;
      } else {
        const { error: err2 } = await supabase.storage.from('avatars').upload(path, blob, { upsert: true, contentType: 'image/jpeg' });
        if (err2) { alert('上传失败: ' + err2.message); setUploading(false); return; }
        const { data } = supabase.storage.from('avatars').getPublicUrl(path);
        publicUrl = data.publicUrl;
      }
      setShowcaseUrl(publicUrl);
      await updateProfile(profile.id, { showcase_url: publicUrl } as any);
      onRefresh?.();
    } catch (err) {
      console.error(err);
      alert('上传失败');
    }
    setUploading(false);
  };

  const handleRemoveShowcase = async () => {
    setShowcaseUrl('');
    await updateProfile(profile.id, { showcase_url: null } as any);
    onRefresh?.();
  };

  const hasShowcase = !!showcaseUrl;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Fullscreen image viewer */}
        <AnimatePresence>
          {viewingImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[60] bg-black/95 flex items-center justify-center cursor-pointer"
              onClick={() => setViewingImage(null)}
            >
              <motion.img
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                src={viewingImage}
                alt={profile.nickname}
                className="max-w-[92vw] max-h-[92vh] object-contain drop-shadow-2xl"
              />
              <div className="absolute top-6 right-8 text-white/40 text-sm font-title">点击关闭</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Image Cropper */}
        {cropSrc && (
          <ImageCropper
            imageSrc={cropSrc}
            aspectRatio={220 / 580}
            onCrop={handleCroppedUpload}
            onCancel={() => setCropSrc(null)}
          />
        )}

        {/* Modal - wide layout */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 30 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          className="relative z-10 flex rounded-lg overflow-hidden border border-gold/15 shadow-2xl"
          style={{
            width: hasShowcase ? 'min(1100px, 92vw)' : 'min(600px, 92vw)',
            maxHeight: '88vh',
            boxShadow: '0 25px 80px rgba(0,0,0,0.6), 0 0 40px rgba(201,168,76,0.05)',
          }}
        >
          {/* LEFT - Showcase Image */}
          {hasShowcase && (
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="relative flex-shrink-0 bg-black cursor-pointer group/img hidden md:block"
              style={{ width: '440px' }}
              onClick={() => setViewingImage(showcaseUrl)}
            >
              <img
                src={showcaseUrl}
                alt={profile.nickname}
                className="w-full h-full object-cover group-hover/img:scale-[1.02] transition-transform duration-700"
              />
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                <motion.span
                  className="text-white/0 group-hover/img:text-white/70 transition-all duration-300 text-sm font-title tracking-wider"
                >
                  查看大图
                </motion.span>
              </div>
              {/* Bottom gradient */}
              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
              {/* Admin actions on showcase */}
              {canEdit && (
                <div className="absolute top-3 left-3 flex gap-2 opacity-0 group-hover/img:opacity-100 transition-opacity">
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                  <button
                    onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
                    disabled={uploading}
                    className="px-2.5 py-1 text-[11px] bg-black/60 backdrop-blur-md text-white/80 hover:text-gold border border-white/10 hover:border-gold/30 rounded transition-all"
                  >
                    {uploading ? '上传中...' : '更换图片'}
                  </button>
                  {isAdminOrOwner && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRemoveShowcase(); }}
                      className="px-2.5 py-1 text-[11px] bg-black/60 backdrop-blur-md text-red-300/70 hover:text-red-300 border border-white/10 hover:border-red-400/30 rounded transition-all"
                    >
                      删除图片
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* RIGHT - Info panel */}
          <div className="flex-1 bg-bg-panel flex flex-col max-h-[88vh] overflow-y-auto">
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 w-9 h-9 flex items-center justify-center
                         text-text-secondary/50 hover:text-gold bg-bg-panel/80 backdrop-blur-sm
                         rounded-full border border-gold/10 hover:border-gold/30 transition-all"
            >
              ✕
            </button>

            {/* Avatar header - only show when NO showcase on the left */}
            {!hasShowcase && (
              <div className="relative h-[200px] overflow-hidden flex-shrink-0">
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
                      background: `linear-gradient(135deg, ${profile.node_color || '#9a8a6a'}15, ${profile.node_color || '#9a8a6a'}35)`,
                    }}
                  >
                    <span
                      className="font-brush text-7xl opacity-40 select-none"
                      style={{ color: profile.node_color || '#9a8a6a' }}
                    >
                      {firstChar}
                    </span>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-bg-panel to-transparent" />
              </div>
            )}

            {/* Content */}
            <div className={`px-7 pb-7 relative flex-1 ${hasShowcase ? 'pt-7 flex flex-col justify-center' : '-mt-8'}`}>
              {/* Name & badges */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="flex items-center gap-2.5 mb-3 flex-wrap"
              >
                {/* Small avatar when showcase is shown on left */}
                {hasShowcase && (
                  <div className="w-12 h-12 rounded-full border-2 border-gold/20 overflow-hidden flex-shrink-0">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-bg-card">
                        <span className="font-brush text-lg" style={{ color: profile.node_color || '#9a8a6a' }}>{firstChar}</span>
                      </div>
                    )}
                  </div>
                )}
                <h2 className="font-title text-2xl text-text-primary">{profile.nickname}</h2>
                {profile.identity && (
                  <span className="px-2 py-0.5 text-[11px] bg-gold/12 text-gold/90 rounded-sm border border-gold/15">
                    {profile.identity}
                  </span>
                )}
                {profile.role === 'owner' && (
                  <span className="px-2 py-0.5 text-[11px] bg-cinnabar/15 text-cinnabar-light rounded-sm border border-cinnabar/25">
                    坛主
                  </span>
                )}
                {profile.role === 'admin' && (
                  <span className="px-2 py-0.5 text-[11px] bg-blue-900/25 text-blue-300 rounded-sm border border-blue-500/25">
                    管理员
                  </span>
                )}
                {isSelf && (
                  <span className="px-2 py-0.5 text-[11px] bg-green-900/25 text-green-300 rounded-sm border border-green-500/25">
                    我
                  </span>
                )}
              </motion.div>

              {/* Divider */}
              <div className="h-[1px] bg-gradient-to-r from-gold/20 via-gold/10 to-transparent mb-4" />

              {/* Intro */}
              {profile.intro && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-text-primary/80 text-sm mb-3 leading-relaxed italic"
                >
                  「{profile.intro}」
                </motion.p>
              )}

              {/* Description */}
              {profile.description && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25 }}
                  className="text-text-secondary text-sm mb-4 leading-relaxed whitespace-pre-wrap"
                >
                  {profile.description}
                </motion.p>
              )}

              {/* Tags */}
              {profile.tags.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-wrap gap-1.5 mb-4"
                >
                  {profile.tags.map(tag => (
                    <TagBadge key={tag} tag={tag} size="sm" />
                  ))}
                </motion.div>
              )}

              {/* Upload showcase if none exists */}
              {!hasShowcase && canEdit && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.35 }}
                  className="mb-4"
                >
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="w-full h-28 rounded border border-dashed border-gold/15 hover:border-gold/40
                               flex flex-col items-center justify-center gap-2 transition-all duration-300
                               hover:bg-gold/[0.03] group/upload"
                  >
                    <svg className="w-6 h-6 text-gold/20 group-hover/upload:text-gold/50 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    <span className="text-text-secondary/30 group-hover/upload:text-text-secondary/60 text-xs transition-colors">
                      {uploading ? '上传中...' : '上传展示图'}
                    </span>
                  </button>
                </motion.div>
              )}

              {/* Mobile showcase (shown below info on small screens) */}
              {hasShowcase && (
                <div className="md:hidden mb-4">
                  <div
                    className="relative rounded overflow-hidden border border-gold/10 cursor-pointer"
                    onClick={() => setViewingImage(showcaseUrl)}
                  >
                    <img src={showcaseUrl} alt={profile.nickname} className="w-full object-cover max-h-[300px]" />
                  </div>
                </div>
              )}

              {/* Discord */}
              {profile.discord_username && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.35 }}
                  className="flex items-center gap-2 text-sm text-text-secondary mb-5 py-2 px-3 bg-bg-card/50 rounded border border-gold/5"
                >
                  <svg className="w-4 h-4 text-[#5865F2] flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
                  </svg>
                  <span className="text-xs">{profile.discord_username}</span>
                </motion.div>
              )}

              {/* Action Buttons */}
              {(canEdit || isAdminOrOwner) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex gap-2.5 pt-4 border-t border-gold/8 flex-wrap"
                >
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
                      className="text-cinnabar-light/60 hover:text-cinnabar-light"
                    >
                      删除
                    </GoldButton>
                  )}
                  {isOwner && profile.role === 'member' && onSetAdmin && (
                    <GoldButton variant="ghost" size="sm" onClick={onSetAdmin} className="text-blue-300/60 hover:text-blue-300">
                      设为管理
                    </GoldButton>
                  )}
                  {isOwner && profile.role === 'admin' && onRemoveAdmin && (
                    <GoldButton variant="ghost" size="sm" onClick={onRemoveAdmin} className="text-yellow-300/60 hover:text-yellow-300">
                      取消管理
                    </GoldButton>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
