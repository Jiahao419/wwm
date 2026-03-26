'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Profile } from '@/lib/types';

interface CylinderCarouselProps {
  profiles: Profile[];
  onProfileClick: (profile: Profile) => void;
}

export default function CylinderCarousel({ profiles, onProfileClick }: CylinderCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rotationRef = useRef(0);
  const velocityRef = useRef(0.15);
  const isDraggingRef = useRef(false);
  const lastXRef = useRef(0);
  const dragVelocityRef = useRef(0);
  const animRef = useRef<number>(0);

  const count = profiles.length;
  const angleStep = count > 0 ? 360 / count : 0;
  const radius = Math.max(600, count * 80);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      if (!isDraggingRef.current) {
        // Apply momentum or auto-rotate
        if (Math.abs(dragVelocityRef.current) > 0.01) {
          rotationRef.current += dragVelocityRef.current;
          dragVelocityRef.current *= 0.96; // friction
        } else {
          rotationRef.current += velocityRef.current;
          dragVelocityRef.current = 0;
        }
      }

      // Apply rotation directly to DOM for performance
      const el = containerRef.current;
      if (el) {
        el.style.transform = `rotateY(${rotationRef.current}deg)`;
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
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastXRef.current;
    lastXRef.current = e.clientX;
    dragVelocityRef.current = dx * 0.15;
    rotationRef.current += dx * 0.15;
  }, []);

  const handlePointerUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  if (count === 0) return null;

  return (
    <div
      className="relative w-full overflow-hidden select-none"
      style={{ height: '520px' }}
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-gold/[0.03] blur-[100px]" />
      </div>

      {/* Fade edges for depth */}
      <div className="absolute left-0 top-0 bottom-0 w-40 bg-gradient-to-r from-bg-primary via-bg-primary/80 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-40 bg-gradient-to-l from-bg-primary via-bg-primary/80 to-transparent z-10 pointer-events-none" />
      {/* Top/bottom fade */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-bg-primary to-transparent z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-bg-primary via-bg-primary/60 to-transparent z-10 pointer-events-none" />

      {/* 3D Scene */}
      <div
        className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
        style={{ perspective: '1000px', perspectiveOrigin: '50% 50%' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <div
          ref={containerRef}
          className="relative"
          style={{
            width: '200px',
            height: '380px',
            transformStyle: 'preserve-3d',
            transform: `rotateY(0deg)`,
          }}
        >
          {profiles.map((profile, i) => {
            const angle = i * angleStep;
            const firstChar = profile.nickname.charAt(0);

            return (
              <div
                key={profile.id}
                className="absolute top-0 left-[-40px] w-[280px] h-[380px]"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: `rotateY(${angle}deg) translateZ(${radius}px)`,
                  backfaceVisibility: 'hidden',
                }}
              >
                {/* Card */}
                <div
                  className="w-full h-full overflow-hidden border border-gold/15 hover:border-gold/60 transition-all duration-300 cursor-pointer group relative"
                  style={{
                    borderRadius: '12px',
                    boxShadow: '0 8px 40px rgba(0,0,0,0.5), 0 0 20px rgba(201,168,76,0.05)',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (Math.abs(dragVelocityRef.current) < 0.5) {
                      onProfileClick(profile);
                    }
                  }}
                >
                  {/* Full-card image */}
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.nickname}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      draggable={false}
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{
                        background: `linear-gradient(180deg, ${profile.node_color || '#9a8a6a'}15 0%, ${profile.node_color || '#9a8a6a'}40 50%, ${profile.node_color || '#9a8a6a'}20 100%)`,
                      }}
                    >
                      <span
                        className="font-brush text-8xl opacity-40 select-none"
                        style={{ color: profile.node_color || '#9a8a6a' }}
                      >
                        {firstChar}
                      </span>
                    </div>
                  )}

                  {/* Dark gradient overlay at bottom */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                  {/* Role badge */}
                  {profile.role !== 'member' && (
                    <div className="absolute top-3 right-3 z-10">
                      <span className={`px-2 py-1 text-[11px] font-title rounded backdrop-blur-md ${
                        profile.role === 'owner'
                          ? 'bg-cinnabar/70 text-white border border-cinnabar-light/40'
                          : 'bg-blue-900/70 text-blue-200 border border-blue-400/40'
                      }`}>
                        {profile.role === 'owner' ? '坛主' : '管理'}
                      </span>
                    </div>
                  )}

                  {/* Name & identity at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
                    <h3 className="font-title text-xl text-white mb-1 drop-shadow-lg group-hover:text-gold transition-colors">
                      {profile.nickname}
                    </h3>
                    {profile.identity && (
                      <p className="text-gold/60 text-sm drop-shadow-md">{profile.identity}</p>
                    )}
                    {profile.intro && (
                      <p className="text-white/40 text-xs mt-1 line-clamp-1">{profile.intro}</p>
                    )}
                  </div>

                  {/* Hover glow effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                       style={{ boxShadow: 'inset 0 0 60px rgba(201,168,76,0.15)' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
