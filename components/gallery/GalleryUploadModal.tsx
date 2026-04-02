'use client';

import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

const UPLOAD_TAGS = ['百业战', '日常', '风景', '搞笑', '合影', '活动'] as const;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];

interface GalleryUploadModalProps {
  onClose: () => void;
  onUpload: (file: File, tag: string) => Promise<void>;
}

export default function GalleryUploadModal({ onClose, onUpload }: GalleryUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [tag, setTag] = useState<string>(UPLOAD_TAGS[0]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (f: File): string | null => {
    if (!ACCEPTED_TYPES.includes(f.type)) {
      return '不支持的文件格式，请上传 JPG / PNG / GIF / WebP / MP4 / WebM';
    }
    if (f.size > MAX_FILE_SIZE) {
      return '文件大小不能超过 10MB';
    }
    return null;
  };

  const handleFile = useCallback((f: File) => {
    const err = validateFile(f);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setFile(f);

    // Generate preview
    if (f.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(f);
    } else if (f.type.startsWith('video/')) {
      setPreview(URL.createObjectURL(f));
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const handleSubmit = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      await onUpload(file, tag);
    } catch (err) {
      setError('上传失败，请重试');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const isVideo = file?.type.startsWith('video/');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.25 }}
        className="relative z-10 w-full max-w-lg bg-bg-card border border-gold/20 shadow-2xl shadow-black/50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gold/10">
          <h3 className="font-title text-lg text-text-primary tracking-wider">上传图片</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-text-secondary hover:text-gold transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Drop zone */}
          {!file ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => inputRef.current?.click()}
              className={`border-2 border-dashed rounded-sm py-12 text-center cursor-pointer transition-all duration-200 ${
                dragOver
                  ? 'border-gold bg-gold/5'
                  : 'border-gold/20 hover:border-gold/40 hover:bg-gold/5'
              }`}
            >
              <div className="text-4xl mb-3 opacity-40">📷</div>
              <p className="text-text-secondary text-sm mb-1">
                拖拽文件至此处，或 <span className="text-gold">点击选择</span>
              </p>
              <p className="text-text-secondary/60 text-xs">
                支持 JPG / PNG / GIF / WebP / MP4 / WebM，最大 10MB
              </p>
            </div>
          ) : (
            /* Preview */
            <div className="relative">
              <div className="border border-gold/20 overflow-hidden bg-bg-secondary">
                {isVideo ? (
                  <video
                    src={preview || undefined}
                    className="w-full max-h-64 object-contain bg-black"
                    controls
                    muted
                  />
                ) : (
                  <img
                    src={preview || undefined}
                    alt="预览"
                    className="w-full max-h-64 object-contain"
                  />
                )}
              </div>
              <button
                onClick={clearFile}
                className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center bg-black/60 backdrop-blur-sm border border-gold/20 text-text-secondary hover:text-gold hover:border-gold/40 transition-all"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
              <p className="mt-2 text-text-secondary text-xs truncate">{file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)</p>
            </div>
          )}

          {/* Hidden input */}
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(',')}
            onChange={handleInputChange}
            className="hidden"
          />

          {/* Tag selection */}
          <div>
            <label className="block text-text-secondary text-sm mb-2">分类标签</label>
            <div className="flex flex-wrap gap-2">
              {UPLOAD_TAGS.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTag(t)}
                  className={`px-3 py-1.5 text-sm border rounded-sm transition-all ${
                    tag === t
                      ? 'bg-gold/20 border-gold/50 text-gold'
                      : 'border-gold/10 text-text-secondary hover:border-gold/30'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-cinnabar-light text-sm">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gold/10">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
            disabled={uploading}
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!file || uploading}
            className={`relative overflow-hidden px-6 py-2 text-sm font-title tracking-wider transition-all duration-300 ${
              !file || uploading
                ? 'border border-gold/10 text-text-secondary/40 cursor-not-allowed'
                : 'border border-gold/40 text-gold hover:bg-gold/10 hover:border-gold shimmer-btn'
            }`}
          >
            {uploading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
                上传中...
              </span>
            ) : (
              '确认上传'
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
