'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Profile, ProfileImage } from '@/lib/types';
import { FACTION_COLORS } from '@/lib/constants';
import TagBadge from '@/components/ui/TagBadge';
import { createClient } from '@/lib/supabase/client';
import { addProfileImage, deleteProfileImage } from '@/lib/db';

type ProfileWithImages = Profile & { profile_images: ProfileImage[] };

interface CharacterShowcaseProps {
  profiles: ProfileWithImages[];
  currentUserId: string | null;
  isAdminOrOwner: boolean;
  onRefresh: () => void;
  onEditProfile: (profile: Profile) => void;
}

const ARROW_PREV = 'https://www.yysls.cn/pc/fab/20250723194326/img/feature_prev_d3634779.png?image_process=format,png';
const ARROW_NEXT = 'https://www.yysls.cn/pc/fab/20250723194326/img/feature_next_6f404b40.png?image_process=format,png';

export default function CharacterShowcase({ profiles, currentUserId, isAdminOrOwner, onRefresh, onEditProfile }: CharacterShowcaseProps) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [imgIdx, setImgIdx] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [thumbPage, setThumbPage] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const THUMBS_PER_PAGE = 12;

  const profile = profiles[selectedIdx] || null;
  const images = profile?.profile_images || [];
  const currentImage = images[imgIdx]?.image_url || profile?.showcase_url || profile?.avatar_url || '';

  const canEdit = useCallback((p: Profile) => {
    if (isAdminOrOwner) return true;
    if (currentUserId && p.user_id === currentUserId) return true;
    return false;
  }, [isAdminOrOwner, currentUserId]);

  // Reset image index when profile changes
  useEffect(() => {
    setImgIdx(0);
  }, [selectedIdx]);

  // Click to next image with 3D flip
  const nextImage = useCallback(() => {
    if (images.length <= 1 || isFlipping) return;
    setIsFlipping(true);
    setTimeout(() => {
      setImgIdx(prev => (prev + 1) % images.length);
      setTimeout(() => setIsFlipping(false), 400);
    }, 300);
  }, [images.length, isFlipping]);

  // Select profile
  const selectProfile = useCallback((idx: number) => {
    if (idx === selectedIdx || isFlipping) return;
    setIsFlipping(true);
    setTimeout(() => {
      setSelectedIdx(idx);
      setImgIdx(0);
      setTimeout(() => setIsFlipping(false), 400);
    }, 300);
  }, [selectedIdx, isFlipping]);

  // Upload image
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `showcase/${profile.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('gallery').upload(path, file, { upsert: false });
      if (upErr) { alert('上传失败: ' + upErr.message); setUploading(false); return; }
      const { data: urlData } = supabase.storage.from('gallery').getPublicUrl(path);
      await addProfileImage(profile.id, urlData.publicUrl, images.length);
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('上传失败');
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  // Delete current image
  const handleDeleteImage = async () => {
    if (!images[imgIdx]) return;
    if (!confirm('确定删除这张展示图？')) return;
    await deleteProfileImage(images[imgIdx].id);
    onRefresh();
    setImgIdx(prev => Math.max(0, prev - 1));
  };

  // Thumbnail pagination
  const totalThumbPages = Math.ceil(profiles.length / THUMBS_PER_PAGE);
  const thumbStart = thumbPage * THUMBS_PER_PAGE;
  const thumbProfiles = profiles.slice(thumbStart, thumbStart + THUMBS_PER_PAGE);

  if (!profile) return null;

  const firstChar = profile.nickname.charAt(0);

  return (
    <section className="relative w-full h-screen overflow-hidden bg-black">
      {/* Background image with 3D flip */}
      <div className="absolute inset-0" style={{ perspective: '1200px' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${selectedIdx}-${imgIdx}`}
            initial={{ rotateY: -90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: 90, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0"
            style={{ transformStyle: 'preserve-3d', backfaceVisibility: 'hidden' }}
          >
            {currentImage ? (
              <img
                src={currentImage}
                alt={profile.nickname}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center"
                style={{ background: `radial-gradient(ellipse at center, ${profile.node_color || '#9a8a6a'}30, #050508)` }}
              >
                <span className="font-brush text-[20rem] text-white/5 select-none">{firstChar}</span>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dark overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent z-[1]" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/20 z-[1]" />

      {/* Click to next image */}
      {images.length > 1 && (
        <button
          onClick={nextImage}
          className="absolute inset-0 z-[2] cursor-pointer"
          aria-label="下一张"
        />
      )}

      {/* Left info panel */}
      <div className="absolute left-0 top-0 bottom-0 z-[5] flex flex-col justify-center px-8 md:px-16 max-w-[600px]">
        <motion.div
          key={selectedIdx}
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Name */}
          <h1
            className="font-brush text-[5rem] md:text-[8rem] leading-none mb-2 select-none"
            style={{
              color: '#ffffff',
              textShadow: '0 0 5px #000, 0 0 10px #000, 0 0 20px #000, 0 0 40px rgba(201,168,76,0.2)',
            }}
          >
            {profile.nickname}
          </h1>

          {/* Identity */}
          {profile.identity && (
            <p className="text-gold/80 text-2xl md:text-3xl font-title mb-4"
              style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}
            >
              {profile.identity}
            </p>
          )}

          {/* Faction */}
          {profile.faction && (
            <span
              className="inline-block px-3 py-1 text-sm rounded-sm border mb-4 font-title"
              style={{
                backgroundColor: FACTION_COLORS[profile.faction]?.bg || 'rgba(201,168,76,0.1)',
                color: FACTION_COLORS[profile.faction]?.text || '#c9a84c',
                borderColor: FACTION_COLORS[profile.faction]?.border || 'rgba(201,168,76,0.25)',
              }}
            >
              {profile.faction}
            </span>
          )}

          {/* Tags */}
          {profile.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {profile.tags.map(tag => (
                <TagBadge key={tag} tag={tag} size="sm" />
              ))}
            </div>
          )}

          {/* Description */}
          {(profile.intro || profile.description) && (
            <p
              className="text-white/70 text-base md:text-lg leading-relaxed max-w-[400px]"
              style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}
            >
              {profile.intro || profile.description}
            </p>
          )}

          {/* Image counter */}
          {images.length > 1 && (
            <p className="text-white/30 text-sm mt-4">
              {imgIdx + 1} / {images.length} · 点击切换
            </p>
          )}
        </motion.div>

        {/* Edit buttons */}
        {profile && canEdit(profile) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex gap-2 mt-6"
          >
            <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
            <button
              onClick={(e) => { e.stopPropagation(); onEditProfile(profile); }}
              className="px-4 py-2 text-xs bg-black/50 backdrop-blur-md text-gold/80 hover:text-gold border border-gold/20 hover:border-gold/50 rounded-full transition-all"
            >
              编辑档案
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
              disabled={uploading}
              className="px-4 py-2 text-xs bg-black/50 backdrop-blur-md text-gold/80 hover:text-gold border border-gold/20 hover:border-gold/50 rounded-full transition-all"
            >
              {uploading ? '上传中...' : '+ 上传展示图'}
            </button>
            {images.length > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); handleDeleteImage(); }}
                className="px-4 py-2 text-xs bg-black/50 backdrop-blur-md text-red-300/60 hover:text-red-300 border border-red-500/20 hover:border-red-400/40 rounded-full transition-all"
              >
                删除当前图
              </button>
            )}
          </motion.div>
        )}
      </div>

      {/* Bottom thumbnail bar */}
      <div className="absolute bottom-0 left-0 right-0 z-[5] pb-4">
        <div className="flex items-center justify-center gap-2 px-4">
          {/* Prev page arrow */}
          {totalThumbPages > 1 && (
            <button
              onClick={() => setThumbPage(p => (p - 1 + totalThumbPages) % totalThumbPages)}
              className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
            >
              <img src={ARROW_PREV} alt="上一页" className="w-8" draggable={false} />
            </button>
          )}

          {/* Thumbnails */}
          <div className="flex gap-1.5 overflow-hidden">
            {thumbProfiles.map((p, i) => {
              const realIdx = thumbStart + i;
              const isActive = realIdx === selectedIdx;
              const thumbImg = p.avatar_url;
              return (
                <button
                  key={p.id}
                  onClick={() => selectProfile(realIdx)}
                  className={`flex-shrink-0 flex flex-col items-center gap-1 transition-all duration-300 ${
                    isActive ? 'scale-110' : 'opacity-60 hover:opacity-90'
                  }`}
                >
                  <div className={`w-14 h-14 rounded overflow-hidden border-2 transition-all ${
                    isActive ? 'border-gold shadow-lg shadow-gold/20' : 'border-white/10'
                  }`}>
                    {thumbImg ? (
                      <img src={thumbImg} alt={p.nickname} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-bg-card text-gold/40 font-title text-sm">
                        {p.nickname.charAt(0)}
                      </div>
                    )}
                  </div>
                  <span className={`text-[10px] leading-tight truncate max-w-[56px] ${
                    isActive ? 'text-gold' : 'text-white/40'
                  }`}>
                    {p.nickname}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Next page arrow */}
          {totalThumbPages > 1 && (
            <button
              onClick={() => setThumbPage(p => (p + 1) % totalThumbPages)}
              className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
            >
              <img src={ARROW_NEXT} alt="下一页" className="w-8" draggable={false} />
            </button>
          )}
        </div>

        {/* Page indicators */}
        {totalThumbPages > 1 && (
          <div className="flex justify-center gap-1.5 mt-2">
            {Array.from({ length: totalThumbPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setThumbPage(i)}
                className={`h-1 rounded-full transition-all ${
                  i === thumbPage ? 'w-4 bg-gold' : 'w-1.5 bg-white/20'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
