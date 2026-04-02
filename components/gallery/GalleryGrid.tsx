'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { GalleryItem } from '@/app/gallery/page';

interface GalleryGridProps {
  items: GalleryItem[];
  onItemClick: (index: number) => void;
  onDelete?: (url: string) => void;
  deletingUrl?: string | null;
}

export default function GalleryGrid({ items, onItemClick, onDelete, deletingUrl }: GalleryGridProps) {
  return (
    <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
      {items.map((item, index) => (
        <GalleryCard
          key={item.url}
          item={item}
          index={index}
          onClick={() => onItemClick(index)}
          onDelete={onDelete}
          isDeleting={deletingUrl === item.url}
        />
      ))}
    </div>
  );
}

function GalleryCard({
  item,
  index,
  onClick,
  onDelete,
  isDeleting,
}: {
  item: GalleryItem;
  index: number;
  onClick: () => void;
  onDelete?: (url: string) => void;
  isDeleting: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.5), duration: 0.4 }}
      className="break-inside-avoid group relative cursor-pointer"
      onClick={onClick}
    >
      <div
        className={`relative overflow-hidden border border-gold/10 transition-all duration-300 group-hover:border-gold/40 group-hover:shadow-[0_4px_20px_rgba(201,168,76,0.12)] ${
          isDeleting ? 'opacity-40 pointer-events-none' : ''
        }`}
      >
        {/* Loading skeleton */}
        {!loaded && !error && (
          <div className="aspect-square bg-bg-card animate-pulse" />
        )}

        {/* Error state */}
        {error && (
          <div className="aspect-square bg-bg-card flex items-center justify-center">
            <span className="text-text-secondary text-sm">加载失败</span>
          </div>
        )}

        {item.type === 'video' ? (
          <div className="relative">
            <video
              src={item.url}
              className={`w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                loaded ? '' : 'h-0 overflow-hidden'
              }`}
              muted
              preload="metadata"
              onLoadedData={() => setLoaded(true)}
              onError={() => setError(true)}
            />
            {/* Video play icon overlay */}
            {loaded && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm border border-gold/30 flex items-center justify-center group-hover:bg-black/70 group-hover:scale-110 transition-all">
                  <svg className="w-5 h-5 text-gold ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        ) : (
          <img
            src={item.url}
            alt={item.title || '月冕影阁'}
            className={`w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
              loaded ? '' : 'h-0 overflow-hidden'
            }`}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
          />
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Tag badge */}
        {item.tag && loaded && (
          <div className="absolute top-2 left-2 px-2 py-0.5 text-xs bg-black/50 backdrop-blur-sm border border-gold/20 text-gold/80">
            {item.tag}
          </div>
        )}

        {/* Delete button (admin only) */}
        {onDelete && loaded && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item.url);
            }}
            className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center bg-black/50 backdrop-blur-sm border border-cinnabar/30 text-cinnabar-light opacity-0 group-hover:opacity-100 transition-all hover:bg-cinnabar/20 hover:border-cinnabar/60"
            title="删除"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        )}

        {/* Deleting spinner */}
        {isDeleting && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
          </div>
        )}
      </div>
    </motion.div>
  );
}
