'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/components/providers/AuthProvider';
import { getSiteConfig, upsertSiteConfig, getGalleryImages, uploadGalleryImage, deleteGalleryImage } from '@/lib/db';

const DEFAULT_INTRO = `月冕总坛是《燕云十六声》中的百业综合公会，致力于百业战竞技与公会运营。我们拥有完善的指挥体系、灵活的战术策略，以及一群热爱游戏的伙伴。

从日常副本到百业争锋，从新人培养到战术研讨，月冕始终坚持「执剑天涯，护我月冕」的信念，在燕云江湖中书写属于我们的传奇。

无论你是久经沙场的老手，还是初入江湖的新侠，月冕都欢迎你的加入。`;

function ImageCarousel({ isAdmin }: { isAdmin: boolean }) {
  const [images, setImages] = useState<string[]>([]);
  const [current, setCurrent] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getGalleryImages().then(({ urls }) => {
      if (urls.length > 0) setImages(urls);
    });
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    const newUrls: string[] = [];
    const errors: string[] = [];
    for (let i = 0; i < files.length; i++) {
      console.log('上传文件:', files[i].name, files[i].size, files[i].type);
      const { url, error } = await uploadGalleryImage(files[i]);
      console.log('上传结果:', { url, error });
      if (url) newUrls.push(url);
      if (error) errors.push(`${files[i].name}: ${(error as any)?.message || JSON.stringify(error)}`);
    }
    if (newUrls.length > 0) {
      setImages(prev => [...newUrls, ...prev]);
      setCurrent(0);
    }
    if (errors.length > 0) {
      alert('上传失败:\n' + errors.join('\n'));
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleDelete = async () => {
    if (images.length === 0) return;
    if (!confirm('确定删除这张图片？')) return;
    setDeleting(true);
    const url = images[current];
    console.log('[gallery] deleting url:', url);
    const { error } = await deleteGalleryImage(url);
    console.log('[gallery] delete result:', { error });
    if (!error) {
      const updated = images.filter((_, i) => i !== current);
      setImages(updated);
      setCurrent(prev => Math.min(prev, Math.max(0, updated.length - 1)));
    } else {
      alert('删除失败: ' + ((error as any)?.message || JSON.stringify(error)));
    }
    setDeleting(false);
  };

  const [direction, setDirection] = useState(0);

  const goPrev = useCallback(() => {
    setDirection(-1);
    setCurrent(c => (c - 1 + images.length) % images.length);
  }, [images.length]);

  const goNext = useCallback(() => {
    setDirection(1);
    setCurrent(c => (c + 1) % images.length);
  }, [images.length]);

  // Auto-play: every 5 seconds
  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => goNext(), 5000);
    return () => clearInterval(timer);
  }, [images.length, goNext]);

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? '-100%' : '100%',
      opacity: 0,
      scale: 0.95,
    }),
  };

  // Empty state
  if (images.length === 0) {
    return (
      <div className="relative p-3">
        {/* Decorative corner frame */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-gold/40" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-gold/40" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-gold/40" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-gold/40" />

        <div className="aspect-[16/9] rounded-sm bg-gradient-to-br from-bg-card to-bg-panel flex flex-col items-center justify-center relative">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full border border-gold/30 flex items-center justify-center bg-gold/5">
              <span className="font-title text-3xl text-gold/40">月</span>
            </div>
            <p className="text-text-secondary/40 text-sm">月冕集结图</p>
          </div>
          {isAdmin && (
            <div className="mt-4">
              <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="text-xs text-gold/60 hover:text-gold border border-gold/20 hover:border-gold/40 px-3 py-1 rounded-sm transition-colors"
              >
                {uploading ? '上传中...' : '上传图片'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const ARROW_PREV = 'https://www.yysls.cn/pc/fab/20250723194326/img/feature_prev_d3634779.png?image_process=format,png';
  const ARROW_NEXT = 'https://www.yysls.cn/pc/fab/20250723194326/img/feature_next_6f404b40.png?image_process=format,png';

  return (
    <div className="relative group">
      {/* Carousel with external arrows layout */}
      <div className="flex items-center gap-4">
        {/* Left arrow - outside the image */}
        {images.length > 1 && (
          <button
            onClick={goPrev}
            className="flex-shrink-0 opacity-60 hover:opacity-100 transition-all duration-300 hover:scale-110 hidden md:block"
          >
            <img src={ARROW_PREV} alt="上一张" className="w-[70px] drop-shadow-lg" draggable={false} />
          </button>
        )}

        {/* Main carousel area */}
        <div className="flex-1 relative">
          {/* Decorative corner frame */}
          <div className="absolute -top-2 -left-2 w-10 h-10 border-t-2 border-l-2 border-gold/50 z-20 transition-all duration-300 group-hover:w-12 group-hover:h-12 group-hover:border-gold/70" />
          <div className="absolute -top-2 -right-2 w-10 h-10 border-t-2 border-r-2 border-gold/50 z-20 transition-all duration-300 group-hover:w-12 group-hover:h-12 group-hover:border-gold/70" />
          <div className="absolute -bottom-2 -left-2 w-10 h-10 border-b-2 border-l-2 border-gold/50 z-20 transition-all duration-300 group-hover:w-12 group-hover:h-12 group-hover:border-gold/70" />
          <div className="absolute -bottom-2 -right-2 w-10 h-10 border-b-2 border-r-2 border-gold/50 z-20 transition-all duration-300 group-hover:w-12 group-hover:h-12 group-hover:border-gold/70" />

          {/* Inner border */}
          <div className="absolute inset-0 border border-gold/15 rounded-lg pointer-events-none z-20" />

          <div className="aspect-[16/9] rounded-lg bg-bg-card relative overflow-hidden shadow-2xl" style={{ boxShadow: '0 0 60px rgba(201,168,76,0.08), 0 25px 50px rgba(0,0,0,0.5)' }}>
            {/* Sliding images */}
            <AnimatePresence initial={false} custom={direction} mode="popLayout">
              <motion.img
                key={current}
                src={images[current]}
                alt={`集结图 ${current + 1}`}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: 'tween', duration: 0.5, ease: [0.4, 0, 0.2, 1] },
                  opacity: { duration: 0.4 },
                  scale: { duration: 0.4 },
                }}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </AnimatePresence>

            {/* Vignette overlay */}
            <div className="absolute inset-0 pointer-events-none z-[1]"
              style={{ boxShadow: 'inset 0 0 80px rgba(0,0,0,0.5)' }}
            />

            {/* Mobile arrows (inside image for small screens) */}
            {images.length > 1 && (
              <>
                <button
                  onClick={goPrev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-20 md:hidden opacity-70 hover:opacity-100 transition-opacity"
                >
                  <img src={ARROW_PREV} alt="上一张" className="w-[50px]" draggable={false} />
                </button>
                <button
                  onClick={goNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-20 md:hidden opacity-70 hover:opacity-100 transition-opacity"
                >
                  <img src={ARROW_NEXT} alt="下一张" className="w-[50px]" draggable={false} />
                </button>
              </>
            )}

            {/* Bottom bar with progress + dots */}
            {images.length > 1 && (
              <div className="absolute bottom-0 left-0 right-0 z-20">
                <div className="h-[2px] bg-gold/10 mx-4 mb-3 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-gold/40 via-gold to-gold/40 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 5, ease: 'linear' }}
                    key={current}
                  />
                </div>
                <div className="flex justify-center gap-2 pb-4">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
                      className="relative"
                    >
                      <div className={`h-1.5 rounded-full transition-all duration-500 ${
                        i === current
                          ? 'w-6 bg-gradient-to-r from-gold/60 via-gold to-gold/60'
                          : 'w-1.5 bg-white/30 hover:bg-white/50'
                      }`} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Counter badge */}
            <div className="absolute top-3 right-3 z-20 bg-black/50 backdrop-blur-sm border border-gold/20 text-gold/80 text-xs px-2.5 py-1 rounded-full">
              {current + 1} / {images.length}
            </div>

            {/* Admin controls */}
            {isAdmin && (
              <div className="absolute top-3 left-3 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" />
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="bg-black/50 hover:bg-black/70 backdrop-blur-sm border border-gold/30 hover:border-gold/60 text-gold/80 hover:text-gold text-xs px-3 py-1.5 rounded-full transition-all"
                >
                  {uploading ? '上传中...' : '＋ 上传'}
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="bg-black/50 hover:bg-red-900/60 backdrop-blur-sm border border-red-500/20 hover:border-red-400/50 text-red-400/80 hover:text-red-300 text-xs px-3 py-1.5 rounded-full transition-all"
                >
                  {deleting ? '删除中...' : '✕ 删除'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right arrow - outside the image */}
        {images.length > 1 && (
          <button
            onClick={goNext}
            className="flex-shrink-0 opacity-60 hover:opacity-100 transition-all duration-300 hover:scale-110 hidden md:block"
          >
            <img src={ARROW_NEXT} alt="下一张" className="w-[70px] drop-shadow-lg" draggable={false} />
          </button>
        )}
      </div>

      {/* Caption below */}
      <div className="text-center mt-4">
        <p className="text-text-secondary/40 text-xs tracking-widest">月 冕 集 结 图</p>
      </div>
    </div>
  );
}

export default function IntroSection() {
  const { isAdminOrOwner } = useAuth();
  const [intro, setIntro] = useState(DEFAULT_INTRO);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSiteConfig('intro').then(({ data }) => {
      if (data?.value) setIntro(data.value);
    });
  }, []);

  const handleEdit = () => {
    setDraft(intro);
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await upsertSiteConfig('intro', draft);
    if (!error) {
      setIntro(draft);
      setEditing(false);
    } else {
      console.error('保存简介失败:', error);
      alert('保存失败：' + error.message);
    }
    setSaving(false);
  };

  const paragraphs = intro.split('\n').filter(line => line.trim());

  return (
    <section className="relative py-24 px-8 overflow-hidden">
      {/* Video background */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
        src="https://s3plus.meituan.net/opapisdk/op_ticket_885190757_1757106279712_qdqqd_lf6cky.mp4"
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 z-[1]" style={{
        background: 'linear-gradient(135deg, rgba(5,5,8,0.85) 0%, rgba(30,20,10,0.7) 50%, rgba(5,5,8,0.9) 100%)',
      }} />
      <div className="max-w-[1400px] mx-auto relative z-[2]">
        {/* Text above carousel */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 max-w-[800px] mx-auto text-center"
        >
          <p className="font-display text-xs tracking-[0.3em] text-text-secondary/50 uppercase mb-2">
            ABOUT YUEMIAN
          </p>
          <div className="flex items-center justify-center gap-3 mb-8">
            <h2 className="font-title text-3xl text-text-primary">月冕简介</h2>
            {isAdminOrOwner && !editing && (
              <button
                onClick={handleEdit}
                className="text-xs text-gold/50 hover:text-gold border border-gold/20 hover:border-gold/40 px-2 py-0.5 rounded-sm transition-colors"
              >
                编辑
              </button>
            )}
          </div>

          {editing ? (
            <div className="space-y-4 text-left">
              <textarea
                value={draft}
                onChange={e => setDraft(e.target.value)}
                rows={8}
                className="w-full p-4 bg-bg-card border border-gold/20 rounded-sm text-text-secondary text-sm leading-relaxed resize-y focus:border-gold/40 focus:outline-none"
                placeholder="输入简介内容，用空行分段..."
              />
              <div className="flex gap-2 justify-center">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-1.5 text-xs border border-gold/40 text-gold bg-gold/10 rounded-sm hover:bg-gold/20 transition-all disabled:opacity-50"
                >
                  {saving ? '保存中...' : '保存'}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="px-4 py-1.5 text-xs border border-gold/10 text-text-secondary rounded-sm hover:border-gold/30 transition-all"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-text-secondary leading-relaxed text-base">
              {paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          )}
        </motion.div>

        {/* Image Carousel below text */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <ImageCarousel isAdmin={isAdminOrOwner} />
        </motion.div>
      </div>
    </section>
  );
}
