'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '@/components/ui/PageHeader';
import GoldButton from '@/components/ui/GoldButton';
import GalleryGrid from '@/components/gallery/GalleryGrid';
import GalleryLightbox from '@/components/gallery/GalleryLightbox';
import GalleryUploadModal from '@/components/gallery/GalleryUploadModal';
import { useAuth } from '@/components/providers/AuthProvider';
import { getGalleryImages, deleteGalleryImage, uploadGalleryImage } from '@/lib/db';
import { useAuditLog } from '@/lib/useAuditLog';

// Tags for filtering
const GALLERY_TAGS = ['全部', '百业战', '日常', '风景', '搞笑', '合影', '活动'] as const;
type GalleryTag = typeof GALLERY_TAGS[number];

export interface GalleryItem {
  url: string;
  type: 'image' | 'video';
  tag?: string;
  title?: string;
}

// Tag mapping: Chinese display name <-> English filename key
const TAG_TO_KEY: Record<string, string> = {
  '百业战': 'baiye',
  '日常': 'daily',
  '风景': 'scenery',
  '搞笑': 'funny',
  '合影': 'group',
  '活动': 'event',
};
const KEY_TO_TAG: Record<string, string> = Object.fromEntries(
  Object.entries(TAG_TO_KEY).map(([cn, en]) => [en, cn])
);

export default function GalleryPage() {
  const { user, isAdminOrOwner } = useAuth();
  const audit = useAuditLog();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState<GalleryTag>('全部');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const fetchImages = useCallback(async () => {
    try {
      const { urls, error } = await getGalleryImages();
      if (error || !urls || urls.length === 0) {
        setItems([]);
      } else {
        const mapped: GalleryItem[] = urls.map(url => {
          const ext = url.split('.').pop()?.toLowerCase().split('?')[0] || '';
          const isVideo = ['mp4', 'webm', 'mov'].includes(ext);
          // Try to extract tag from filename: key-timestamp.ext
          const rawFileName = url.split('/').pop() || '';
          const fileName = decodeURIComponent(rawFileName);
          // Match English key (new uploads) or Chinese tag (old uploads)
          const englishMatch = fileName.match(/^(baiye|daily|scenery|funny|group|event)-/);
          const chineseMatch = fileName.match(/^(百业战|日常|风景|搞笑|合影|活动)-/);
          const tag = englishMatch ? KEY_TO_TAG[englishMatch[1]] : chineseMatch ? chineseMatch[1] : undefined;
          return {
            url,
            type: isVideo ? 'video' : 'image',
            tag,
          };
        });
        setItems(mapped);
      }
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const filtered = activeTag === '全部'
    ? items
    : items.filter(item => item.tag === activeTag);

  const handleUpload = async (file: File, tag: string) => {
    // Use English key in filename (Supabase Storage doesn't allow Chinese characters)
    const key = TAG_TO_KEY[tag] || 'other';
    const ext = file.name.split('.').pop() || 'jpg';
    const taggedName = `${key}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const taggedFile = new File([file], taggedName, { type: file.type });

    const { url, error } = await uploadGalleryImage(taggedFile);
    if (error) {
      alert('上传失败：' + error.message);
      return;
    }
    if (url) {
      audit({ action: '上传画廊图片', category: 'gallery', details: { tag } });
      await fetchImages();
    }
    setShowUpload(false);
  };

  const handleDelete = async (url: string) => {
    if (!confirm('确认删除这张图片？此操作不可撤销。')) return;
    setDeleting(url);
    try {
      const { error } = await deleteGalleryImage(url);
      if (error) {
        alert('删除失败：' + error.message);
      } else {
        audit({ action: '删除画廊图片', category: 'gallery' });
        await fetchImages();
      }
    } catch {
      alert('删除失败，请检查权限。');
    } finally {
      setDeleting(null);
    }
  };

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  if (loading) {
    return (
      <>
        <PageHeader englishTitle="GALLERY" chineseTitle="月冕影阁" />
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 pb-20">
          {/* Skeleton grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square bg-bg-card border border-gold/10 animate-pulse"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Background */}
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-bg-primary via-bg-secondary to-bg-primary" />

      <div className="relative z-10">
        <PageHeader
          englishTitle="GALLERY"
          chineseTitle="月冕影阁"
          subtitle="记录月冕的每一个精彩瞬间"
        />

        <div className="max-w-[1200px] mx-auto px-4 md:px-8 pb-20">
          {/* Top bar: Upload button + Tag filter */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8"
          >
            {/* Tag filter */}
            <div className="flex flex-wrap gap-2">
              {GALLERY_TAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(tag)}
                  className={`px-3 py-1.5 text-sm border rounded-sm transition-all duration-200 ${
                    activeTag === tag
                      ? 'bg-gold/20 border-gold/50 text-gold'
                      : 'border-gold/10 text-text-secondary hover:border-gold/30 hover:text-text-primary'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Upload button — admin only */}
            {isAdminOrOwner && (
              <GoldButton
                variant="secondary"
                size="sm"
                onClick={() => setShowUpload(true)}
              >
                + 上传图片
              </GoldButton>
            )}
          </motion.div>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="flex items-center gap-4 mb-6 text-text-secondary text-sm"
          >
            <span>共 <span className="text-gold">{items.length}</span> 张</span>
            {activeTag !== '全部' && (
              <span>
                当前筛选：<span className="text-gold">{filtered.length}</span> 张
              </span>
            )}
          </motion.div>

          {/* Gallery grid */}
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <div className="text-6xl mb-4 opacity-30">🏔</div>
              <p className="text-text-secondary text-lg mb-2">
                {items.length === 0 ? '影阁中暂无图片' : `暂无「${activeTag}」分类的图片`}
              </p>
              {user && items.length === 0 && (
                <p className="text-text-secondary text-sm">
                  点击「上传图片」添加第一张吧
                </p>
              )}
            </motion.div>
          ) : (
            <div ref={gridRef}>
              <GalleryGrid
                items={filtered}
                onItemClick={openLightbox}
                onDelete={isAdminOrOwner ? handleDelete : undefined}
                deletingUrl={deleting}
              />
            </div>
          )}
        </div>

        {/* Lightbox */}
        <AnimatePresence>
          {lightboxIndex !== null && (
            <GalleryLightbox
              items={filtered}
              currentIndex={lightboxIndex}
              onClose={closeLightbox}
              onChange={setLightboxIndex}
            />
          )}
        </AnimatePresence>

        {/* Upload Modal */}
        <AnimatePresence>
          {showUpload && (
            <GalleryUploadModal
              onClose={() => setShowUpload(false)}
              onUpload={handleUpload}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
