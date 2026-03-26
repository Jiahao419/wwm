'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Profile } from '@/lib/types';

interface CylinderCarouselProps {
  profiles: Profile[];
  onProfileClick: (profile: Profile) => void;
}

export default function CylinderCarousel({ profiles, onProfileClick }: CylinderCarouselProps) {
  const cylinderRef = useRef<HTMLDivElement>(null);
  const rotationRef = useRef(0);
  const velocityRef = useRef(0.12);
  const isDraggingRef = useRef(false);
  const lastXRef = useRef(0);
  const dragVelocityRef = useRef(0);
  const animRef = useRef<number>(0);

  const count = profiles.length;
  const angleStep = count > 0 ? 360 / count : 0;
  // Radius: bigger = cards more spread out
  const radius = Math.max(500, count * 65);

  // Animation loop - direct DOM manipulation for 60fps
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

  if (count === 0) return null;

  return (
    <div
      className="relative w-full overflow-hidden select-none"
      style={{ height: '680px' }}
    >
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
        style={{ perspective: '1200px', perspectiveOrigin: '50% 45%' }}
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
            const firstChar = profile.nickname.charAt(0);
            const hasShowcase = !!profile.showcase_url;

            return (
              <div
                key={profile.id}
                className="absolute"
                style={{
                  width: '220px',
                  height: '580px',
                  left: '-110px',
                  top: '-290px',
                  transformStyle: 'preserve-3d',
                  transform: `rotateY(${angle}deg) translateZ(${radius}px)`,
                  backfaceVisibility: 'hidden',
                }}
              >
                <div
                  className="w-full h-full overflow-hidden border border-gold/10 hover:border-gold/50 transition-all duration-500 cursor-pointer group relative"
                  style={{
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
                  {/* Image - showcase photo or avatar fallback or character */}
                  {hasShowcase ? (
                    <img
                      src={profile.showcase_url!}
                      alt={profile.nickname}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
                      draggable={false}
                    />
                  ) : profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.nickname}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
                      draggable={false}
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{
                        background: `linear-gradient(180deg, ${profile.node_color || '#9a8a6a'}10 0%, ${profile.node_color || '#9a8a6a'}30 40%, ${profile.node_color || '#9a8a6a'}10 100%)`,
                      }}
                    >
                      <span
                        className="font-brush text-[100px] opacity-25 select-none"
                        style={{ color: profile.node_color || '#9a8a6a' }}
                      >
                        {firstChar}
                      </span>
                    </div>
                  )}

                  {/* Bottom gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent pointer-events-none" />

                  {/* Top subtle gradient */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent pointer-events-none" />

                  {/* Role badge */}
                  {profile.role !== 'member' && (
                    <div className="absolute top-3 right-3 z-10">
                      <span className={`px-2 py-0.5 text-[10px] font-title rounded-sm backdrop-blur-md ${
                        profile.role === 'owner'
                          ? 'bg-cinnabar/60 text-white/90 border border-cinnabar-light/30'
                          : 'bg-blue-900/60 text-blue-200/90 border border-blue-400/30'
                      }`}>
                        {profile.role === 'owner' ? '坛主' : '管理'}
                      </span>
                    </div>
                  )}

                  {/* Name at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                    <h3 className="font-title text-lg text-white/90 mb-0.5 drop-shadow-lg group-hover:text-gold transition-colors duration-300 text-center">
                      {profile.nickname}
                    </h3>
                    {profile.identity && (
                      <p className="text-gold/40 text-xs drop-shadow-md text-center">{profile.identity}</p>
                    )}
                  </div>

                  {/* Hover inner glow */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-lg"
                    style={{ boxShadow: 'inset 0 0 80px rgba(201,168,76,0.1)' }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
