'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Profile } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { updateProfile } from '@/lib/db';
import ImageCropper from '@/components/ui/ImageCropper';
import GoldButton from '@/components/ui/GoldButton';

interface CylinderCarouselProps {
  profiles: Profile[];
  onProfileClick: (profile: Profile) => void;
  currentUserId?: string | null;
  isAdminOrOwner?: boolean;
  onRefresh?: () => void;
}

export default function CylinderCarousel({ profiles, onProfileClick, currentUserId, isAdminOrOwner, onRefresh }: CylinderCarouselProps) {
  const cylinderRef = useRef<HTMLDivElement>(null);
  const rotationRef = useRef(0);
  const velocityRef = useRef(0.12);
  const isDraggingRef = useRef(false);
  const lastXRef = useRef(0);
  const dragVelocityRef = useRef(0);
  const animRef = useRef<number>(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const [uploadTarget, setUploadTarget] = useState<Profile | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showProfilePicker, setShowProfilePicker] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const count = profiles.length;
  const angleStep = count > 0 ? 360 / count : 0;

  // Card dimensions
  const CARD_W = isMobile ? 130 : 160;
  const CARD_H = isMobile ? 325 : 380;

  // 根据卡片宽度 + 固定间距计算半径，保证不管多少人间距都一样
  // 圆周 = 2πr = count * (CARD_W + gap)，所以 r = count * (CARD_W + gap) / (2π)
  const CARD_GAP = 60; // 卡片间固定间距 px
  const minRadius = 400;
  const baseRadius = Math.max(minRadius, (count * (CARD_W + CARD_GAP)) / (2 * Math.PI));
  const radius = isMobile ? baseRadius * 0.55 : baseRadius;

  // 自动转速随人数增多而减慢，保持视觉舒适
  const autoSpeed = count > 1 ? Math.max(0.02, 0.12 / Math.sqrt(count)) : 0.12;

  // My own profile
  const myProfile = currentUserId ? profiles.find(p => p.user_id === currentUserId) : null;

  // Update auto speed when count changes
  useEffect(() => {
    velocityRef.current = autoSpeed;
  }, [autoSpeed]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      if (!isDraggingRef.current) {
        if (Math.abs(dragVelocityRef.current) > 0.01) {
          rotationRef.current += dragVelocityRef.current;
          dragVelocityRef.current *= 0.97;
        } else {
          rotationRef.current += velocityRef.current;
          dragVelocityRef.current = 0;
        }
      }

      if (cylinderRef.current) {
        cylinderRef.current.style.transform = `rotateY(${rotationRef.current}deg)`;
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDraggingRef.current = true;
    lastXRef.current = e.clientX;
    dragVelocityRef.current = 0;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastXRef.current;
    lastXRef.current = e.clientX;
    dragVelocityRef.current = dx * 0.12;
    rotationRef.current += dx * 0.12;
  }, []);

  const handlePointerUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  // Upload flow
  const startUpload = (profile: Profile) => {
    setUploadTarget(profile);
    setShowProfilePicker(false);
    fileRef.current?.click();
  };

  const handleUploadClick = () => {
    if (isAdminOrOwner) {
      // Admin can pick which profile to upload for
      setShowProfilePicker(true);
    } else if (myProfile) {
      startUpload(myProfile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) { setUploadTarget(null); return; }
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(file);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleCrop = async (blob: Blob) => {
    if (!uploadTarget) return;
    setCropSrc(null);
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = 'jpg';
      const path = `showcase/${uploadTarget.id}/cylinder_${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('gallery').upload(path, blob, { upsert: false });
      if (upErr) { alert('上传失败: ' + upErr.message); setUploading(false); return; }
      const { data: urlData } = supabase.storage.from('gallery').getPublicUrl(path);
      await updateProfile(uploadTarget.id, { showcase_url: urlData.publicUrl });
      onRefresh?.();
    } catch (err) {
      console.error(err);
      alert('上传失败');
    }
    setUploading(false);
    setUploadTarget(null);
  };

  const handleCropCancel = () => {
    setCropSrc(null);
    setUploadTarget(null);
  };

  // Mobile auto-scroll
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const mobileAutoScrollRef = useRef<number>(0);
  const mobileIsTouchingRef = useRef(false);

  useEffect(() => {
    if (!isMobile || !mobileScrollRef.current) return;
    const el = mobileScrollRef.current;
    let scrollPos = 0;

    const autoScroll = () => {
      if (!mobileIsTouchingRef.current && el) {
        scrollPos += 0.5;
        // Loop: when past half, reset to start seamlessly
        const halfWidth = el.scrollWidth / 2;
        if (scrollPos >= halfWidth) {
          scrollPos -= halfWidth;
        }
        el.scrollLeft = scrollPos;
      } else if (el) {
        scrollPos = el.scrollLeft;
      }
      mobileAutoScrollRef.current = requestAnimationFrame(autoScroll);
    };
    mobileAutoScrollRef.current = requestAnimationFrame(autoScroll);
    return () => cancelAnimationFrame(mobileAutoScrollRef.current);
  }, [isMobile, count]);

  if (count === 0) return null;

  // Shared card renderer
  const renderCard = (profile: Profile, opts?: { w?: number; h?: number; className?: string }) => {
    const firstChar = profile.nickname.charAt(0);
    const hasShowcase = !!profile.showcase_url;
    return (
      <div
        className={`overflow-hidden border border-gold/10 hover:border-gold/50 transition-all duration-500 cursor-pointer group relative flex-shrink-0 ${opts?.className || ''}`}
        style={{
          width: opts?.w ? `${opts.w}px` : undefined,
          height: opts?.h ? `${opts.h}px` : undefined,
          borderRadius: '8px',
          boxShadow: '0 10px 50px rgba(0,0,0,0.6), 0 0 15px rgba(201,168,76,0.04)',
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (Math.abs(dragVelocityRef.current) < 0.3) {
            onProfileClick(profile);
          }
        }}
      >
        {hasShowcase ? (
          <img src={profile.showcase_url!} alt={profile.nickname} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700" draggable={false} />
        ) : profile.avatar_url ? (
          <img src={profile.avatar_url} alt={profile.nickname} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700" draggable={false} />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(180deg, ${profile.node_color || '#9a8a6a'}10 0%, ${profile.node_color || '#9a8a6a'}30 40%, ${profile.node_color || '#9a8a6a'}10 100%)` }}>
            <span className="font-brush text-[60px] md:text-[100px] opacity-25 select-none" style={{ color: profile.node_color || '#9a8a6a' }}>{firstChar}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent pointer-events-none" />
        {profile.role !== 'member' && (
          <div className="absolute top-2 right-2 z-10">
            <span className={`px-1.5 py-0.5 text-[9px] md:text-[10px] font-title rounded-sm backdrop-blur-md ${profile.role === 'owner' ? 'bg-cinnabar/60 text-white/90 border border-cinnabar-light/30' : 'bg-blue-900/60 text-blue-200/90 border border-blue-400/30'}`}>
              {profile.role === 'owner' ? '坛主' : '管理'}
            </span>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-2 md:p-4 z-10">
          <h3 className="font-title text-sm md:text-lg text-white/90 mb-0.5 drop-shadow-lg group-hover:text-gold transition-colors duration-300 text-center">
            {profile.nickname}
          </h3>
          {profile.identity && (
            <p className="text-gold/40 text-[10px] md:text-xs drop-shadow-md text-center truncate">{profile.identity}</p>
          )}
        </div>
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-lg" style={{ boxShadow: 'inset 0 0 80px rgba(201,168,76,0.1)' }} />
      </div>
    );
  };

  // Duplicate profiles for seamless mobile looping
  const mobileProfiles = [...profiles, ...profiles];

  return (
    <>
      {/* Upload button - shared between mobile and desktop */}
      <div className="relative">
        {(myProfile || isAdminOrOwner) && (
          <div className="absolute top-4 right-4 md:right-8 z-20">
            <button
              onClick={handleUploadClick}
              disabled={uploading}
              className="px-2.5 py-1.5 md:px-4 md:py-2 text-[10px] md:text-xs bg-black/60 backdrop-blur-md text-gold/80 hover:text-gold border border-gold/20 hover:border-gold/50 rounded-full transition-all flex items-center gap-1.5 md:gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 md:w-3.5 md:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12" />
              </svg>
              {uploading ? '上传中...' : '上传转轮图'}
            </button>
            <p className="text-[10px] text-text-secondary/30 mt-1 text-right hidden md:block">建议竖版图片 · 自动裁剪</p>
          </div>
        )}

        {/* === MOBILE: Horizontal scroll carousel === */}
        <div className="md:hidden relative w-full overflow-hidden select-none h-[380px]">
          {/* Edge fades */}
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-bg-primary to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-bg-primary to-transparent z-10 pointer-events-none" />

          <div
            ref={mobileScrollRef}
            className="flex gap-3 px-6 py-6 h-full items-center overflow-x-auto scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            onTouchStart={() => { mobileIsTouchingRef.current = true; }}
            onTouchEnd={() => { mobileIsTouchingRef.current = false; }}
          >
            {mobileProfiles.map((profile, i) => (
              <div key={`${profile.id}-${i}`} className="flex-shrink-0">
                {renderCard(profile, { w: 120, h: 300 })}
              </div>
            ))}
          </div>
        </div>

        {/* === DESKTOP: 3D Cylinder === */}
        <div className="hidden md:block relative w-full overflow-hidden select-none" style={{ height: `${Math.ceil(CARD_H * (6000 / (6000 - radius))) + 120}px` }}>
          {/* Ambient glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full bg-gold/[0.03] blur-[120px]" />
          </div>

          {/* Edge fades */}
          <div className="absolute left-0 top-0 bottom-0 w-48 bg-gradient-to-r from-bg-primary via-bg-primary/70 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-48 bg-gradient-to-l from-bg-primary via-bg-primary/70 to-transparent z-10 pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-bg-primary to-transparent z-10 pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-bg-primary to-transparent z-10 pointer-events-none" />

          {/* 3D Scene */}
          <div
            className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
            style={{ perspective: '6000px', perspectiveOrigin: '50% 50%' }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            <div
              ref={cylinderRef}
              className="relative"
              style={{
                width: '1px',
                height: '1px',
                transformStyle: 'preserve-3d',
              }}
            >
              {profiles.map((profile, i) => {
                const angle = i * angleStep;
                return (
                  <div
                    key={profile.id}
                    className="absolute"
                    style={{
                      width: `${CARD_W}px`,
                      height: `${CARD_H}px`,
                      left: `${-CARD_W / 2}px`,
                      top: `${-CARD_H / 2}px`,
                      transformStyle: 'preserve-3d',
                      transform: `rotateY(${angle}deg) translateZ(${radius}px)`,
                      backfaceVisibility: 'hidden',
                    }}
                  >
                    {renderCard(profile, { w: CARD_W, h: CARD_H })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

      {/* Profile picker modal for admin */}
      {showProfilePicker && (
        <div className="fixed inset-0 z-[65] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowProfilePicker(false)} />
          <div className="relative z-10 bg-bg-panel border border-gold/20 rounded-sm p-6 max-w-md w-full max-h-[70vh] overflow-y-auto">
            <h3 className="font-title text-lg text-text-primary mb-1">选择要上传转轮图的成员</h3>
            <p className="text-text-secondary/50 text-xs mb-4">建议使用竖版图片，上传后将自动裁剪为 200×500 比例</p>
            <div className="grid grid-cols-3 gap-2">
              {profiles.map(p => (
                <button
                  key={p.id}
                  onClick={() => startUpload(p)}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-sm border border-gold/10 hover:border-gold/40 hover:bg-gold/5 transition-all"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-gold/20">
                    {p.avatar_url ? (
                      <img src={p.avatar_url} alt={p.nickname} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-bg-card text-gold/40 font-title text-sm">
                        {p.nickname.charAt(0)}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-text-secondary truncate max-w-full">{p.nickname}</span>
                  {p.showcase_url && (
                    <span className="text-[9px] text-gold/40">已有转轮图</span>
                  )}
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <GoldButton variant="ghost" size="sm" onClick={() => setShowProfilePicker(false)}>取消</GoldButton>
            </div>
          </div>
        </div>
      )}

      {/* Image Cropper Modal */}
      {cropSrc && (
        <ImageCropper
          imageSrc={cropSrc}
          aspectRatio={CARD_W / CARD_H}
          onCrop={handleCrop}
          onCancel={handleCropCancel}
        />
      )}
    </>
  );
}
