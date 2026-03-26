'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
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
    const { error } = await deleteGalleryImage(url);
    if (!error) {
      const updated = images.filter((_, i) => i !== current);
      setImages(updated);
      setCurrent(prev => Math.min(prev, Math.max(0, updated.length - 1)));
    } else {
      alert('删除失败');
    }
    setDeleting(false);
  };

  const prev = () => setCurrent(c => (c - 1 + images.length) % images.length);
  const next = () => setCurrent(c => (c + 1) % images.length);

  // Empty state
  if (images.length === 0) {
    return (
      <div className="aspect-[4/3] rounded-sm gold-border bg-gradient-to-br from-bg-card to-bg-panel flex flex-col items-center justify-center relative">
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
    );
  }

  return (
    <div className="aspect-[4/3] rounded-sm gold-border bg-bg-card relative overflow-hidden group">
      {/* Current image */}
      <img
        src={images[current]}
        alt={`集结图 ${current + 1}`}
        className="w-full h-full object-cover transition-opacity duration-300"
      />

      {/* Left arrow */}
      {images.length > 1 && (
        <button
          onClick={prev}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-gold/80 hover:text-gold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-xl"
        >
          ‹
        </button>
      )}

      {/* Right arrow */}
      {images.length > 1 && (
        <button
          onClick={next}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-gold/80 hover:text-gold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-xl"
        >
          ›
        </button>
      )}

      {/* Dots indicator */}
      {images.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === current ? 'bg-gold w-4' : 'bg-white/40 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      )}

      {/* Counter */}
      <div className="absolute top-3 right-3 bg-black/50 text-gold/80 text-xs px-2 py-0.5 rounded-sm">
        {current + 1} / {images.length}
      </div>

      {/* Admin controls */}
      {isAdmin && (
        <div className="absolute top-3 left-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="bg-black/60 hover:bg-black/80 text-gold/80 hover:text-gold text-xs px-2 py-1 rounded-sm transition-colors"
          >
            {uploading ? '上传中...' : '＋ 上传'}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="bg-black/60 hover:bg-red-900/80 text-red-400/80 hover:text-red-300 text-xs px-2 py-1 rounded-sm transition-colors"
          >
            {deleting ? '删除中...' : '✕ 删除'}
          </button>
        </div>
      )}
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
    <section className="py-24 px-8">
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        {/* Left: Image Carousel */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <ImageCarousel isAdmin={isAdminOrOwner} />
        </motion.div>

        {/* Right: Text */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="font-display text-xs tracking-[0.3em] text-text-secondary/50 uppercase mb-2">
            ABOUT YUEMIAN
          </p>
          <div className="flex items-center gap-3 mb-6">
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
            <div className="space-y-4">
              <textarea
                value={draft}
                onChange={e => setDraft(e.target.value)}
                rows={8}
                className="w-full p-4 bg-bg-card border border-gold/20 rounded-sm text-text-secondary text-sm leading-relaxed resize-y focus:border-gold/40 focus:outline-none"
                placeholder="输入简介内容，用空行分段..."
              />
              <div className="flex gap-2">
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
            <div className="space-y-4 text-text-secondary leading-relaxed">
              {paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
