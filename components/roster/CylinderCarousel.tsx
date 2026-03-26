'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Profile } from '@/lib/types';

interface CylinderCarouselProps {
  profiles: Profile[];
  onProfileClick: (profile: Profile) => void;
}

export default function CylinderCarousel({ profiles, onProfileClick }: CylinderCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startRotation, setStartRotation] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const animRef = useRef<number>(0);

  const count = profiles.length;
  const angleStep = count > 0 ? 360 / count : 0;
  // Radius scales with count for good spacing
  const radius = Math.max(280, count * 38);

  // Auto-rotate
  useEffect(() => {
    if (!autoRotate || count === 0) return;
    let lastTime = performance.now();

    const animate = (time: number) => {
      const delta = time - lastTime;
      lastTime = time;
      setRotation(prev => prev - delta * 0.008); // slow rotation
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [autoRotate, count]);

  // Mouse drag
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setAutoRotate(false);
    setStartX(e.clientX);
    setStartRotation(rotation);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    setRotation(startRotation + dx * 0.3);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    // Resume auto-rotate after 3 seconds
    setTimeout(() => setAutoRotate(true), 3000);
  };

  // Touch drag
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setAutoRotate(false);
    setStartX(e.touches[0].clientX);
    setStartRotation(rotation);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const dx = e.touches[0].clientX - startX;
    setRotation(startRotation + dx * 0.3);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setTimeout(() => setAutoRotate(true), 3000);
  };

  if (count === 0) return null;

  return (
    <div className="relative w-full overflow-hidden" style={{ height: '420px' }}>
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-bg-primary to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-bg-primary to-transparent z-10 pointer-events-none" />

      {/* 3D scene */}
      <div
        ref={containerRef}
        className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
        style={{ perspective: '1200px' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="relative"
          style={{
            width: '160px',
            height: '320px',
            transformStyle: 'preserve-3d',
            transform: `rotateY(${rotation}deg)`,
            transition: isDragging ? 'none' : undefined,
          }}
        >
          {profiles.map((profile, i) => {
            const angle = i * angleStep;
            const firstChar = profile.nickname.charAt(0);

            return (
              <motion.div
                key={profile.id}
                className="absolute top-0 left-0 w-[160px] h-[320px] cursor-pointer"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: `rotateY(${angle}deg) translateZ(${radius}px)`,
                  backfaceVisibility: 'hidden',
                }}
                whileHover={{ scale: 1.06 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onProfileClick(profile);
                }}
              >
                {/* Card */}
                <div className="w-full h-full rounded-lg overflow-hidden border border-gold/20 hover:border-gold/60 transition-all duration-300 shadow-lg hover:shadow-[0_0_30px_rgba(201,168,76,0.2)] group">
                  {/* Image */}
                  <div className="w-full h-[240px] overflow-hidden relative">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.nickname}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        draggable={false}
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{
                          background: `linear-gradient(135deg, ${profile.node_color || '#9a8a6a'}33, ${profile.node_color || '#9a8a6a'}66)`,
                        }}
                      >
                        <span
                          className="font-brush text-6xl opacity-60 select-none"
                          style={{ color: profile.node_color || '#9a8a6a' }}
                        >
                          {firstChar}
                        </span>
                      </div>
                    )}

                    {/* Vignette */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

                    {/* Role badge */}
                    {profile.role !== 'member' && (
                      <div className="absolute top-2 right-2">
                        <span className={`px-1.5 py-0.5 text-[10px] font-title rounded backdrop-blur-sm ${
                          profile.role === 'owner'
                            ? 'bg-cinnabar/80 text-white border border-cinnabar-light/40'
                            : 'bg-blue-900/80 text-blue-200 border border-blue-400/40'
                        }`}>
                          {profile.role === 'owner' ? '坛主' : '管理'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3 bg-gradient-to-b from-bg-card to-bg-panel h-[80px] flex flex-col justify-center">
                    <h4 className="font-title text-sm text-text-primary truncate text-center group-hover:text-gold transition-colors">
                      {profile.nickname}
                    </h4>
                    {profile.identity && (
                      <p className="text-[10px] text-gold/60 text-center truncate mt-0.5">{profile.identity}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Bottom reflection effect */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-bg-primary via-bg-primary/80 to-transparent pointer-events-none" />
    </div>
  );
}
