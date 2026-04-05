'use client';

import { useEffect, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import type { GalleryItem } from '@/app/gallery/page';

interface GalleryLightboxProps {
  items: GalleryItem[];
  currentIndex: number;
  onClose: () => void;
  onChange: (index: number) => void;
}

export default function GalleryLightbox({ items, currentIndex, onClose, onChange }: GalleryLightboxProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const item = items[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < items.length - 1;

  // Reset loaded state when index changes
  useEffect(() => {
    setImageLoaded(false);
  }, [currentIndex]);

  const goPrev = useCallback(() => {
    if (hasPrev) onChange(currentIndex - 1);
  }, [hasPrev, currentIndex, onChange]);

  const goNext = useCallback(() => {
    if (hasNext) onChange(currentIndex + 1);
  }, [hasNext, currentIndex, onChange]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          goPrev();
          break;
        case 'ArrowRight':
          goNext();
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, goPrev, goNext]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  if (!item) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[100] flex items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />

      {/* Close button — outside content div so it's never blocked */}
      <button
        onClick={onClose}
        className="fixed top-4 right-4 md:top-6 md:right-6 w-10 h-10 flex items-center justify-center border border-gold/20 bg-black/60 backdrop-blur-sm text-text-secondary hover:text-gold hover:border-gold/50 transition-all z-[110]"
      >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
      </button>

      {/* Content */}
      <div
        className="relative z-10 w-full h-full flex items-center justify-center p-4 md:p-12"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Counter */}
        <div className="absolute top-4 left-4 md:top-6 md:left-6 px-3 py-1.5 bg-black/40 backdrop-blur-sm border border-gold/10 text-text-secondary text-sm z-20">
          <span className="text-gold">{currentIndex + 1}</span> / {items.length}
        </div>

        {/* Previous button */}
        {hasPrev && (
          <button
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center border border-gold/20 bg-black/40 backdrop-blur-sm text-text-secondary hover:text-gold hover:border-gold/50 transition-all z-20"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        )}

        {/* Next button */}
        {hasNext && (
          <button
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center border border-gold/20 bg-black/40 backdrop-blur-sm text-text-secondary hover:text-gold hover:border-gold/50 transition-all z-20"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        )}

        {/* Main media */}
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="max-w-full max-h-full flex items-center justify-center"
          onClick={onClose}
        >
          {item.type === 'video' ? (
            <video
              src={item.url}
              className="max-w-full max-h-[85vh] object-contain border border-gold/10"
              controls
              autoPlay
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <>
              {/* Loading indicator */}
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-gold/20 border-t-gold rounded-full animate-spin" />
                </div>
              )}
              <img
                src={item.url}
                alt={item.title || '月冕影阁'}
                className={`max-w-full max-h-[85vh] object-contain border border-gold/10 transition-opacity duration-300 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onClick={(e) => e.stopPropagation()}
                onLoad={() => setImageLoaded(true)}
              />
            </>
          )}
        </motion.div>

        {/* Tag info */}
        {item.tag && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 backdrop-blur-sm border border-gold/10 text-text-secondary text-sm z-20">
            {item.tag}
          </div>
        )}
      </div>
    </motion.div>
  );
}
