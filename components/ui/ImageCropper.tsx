'use client';

import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import GoldButton from './GoldButton';

interface ImageCropperProps {
  imageSrc: string;
  aspectRatio: number; // width / height, e.g. 220/580 ≈ 0.379
  onCrop: (blob: Blob) => void;
  onCancel: () => void;
}

export default function ImageCropper({ imageSrc, aspectRatio: _ar, onCrop, onCancel }: ImageCropperProps) {
  void _ar; // Used for interface compatibility; crop frame dimensions define the ratio
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [dragging, setDragging] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });

  // Crop frame dimensions (display size)
  const FRAME_W = 220;
  const FRAME_H = 580;

  const onImgLoad = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;
    const natW = img.naturalWidth;
    const natH = img.naturalHeight;
    setImgSize({ w: natW, h: natH });

    // Calculate initial scale so the image at least covers the crop frame
    // We display the crop frame at FRAME_W x FRAME_H
    // The image needs to be scaled so it can cover that area
    const scaleToFitW = FRAME_W / natW;
    const scaleToFitH = FRAME_H / natH;
    const initialScale = Math.max(scaleToFitW, scaleToFitH);
    setScale(initialScale);

    // Center the image
    const displayW = natW * initialScale;
    const displayH = natH * initialScale;
    setOffset({
      x: (FRAME_W - displayW) / 2,
      y: (FRAME_H - displayH) / 2,
    });

    setImgLoaded(true);
  }, []);

  // Clamp offset so image covers the crop frame
  const clampOffset = useCallback((ox: number, oy: number, s: number) => {
    const displayW = imgSize.w * s;
    const displayH = imgSize.h * s;
    // Image left edge must be <= 0 (frame left), right edge >= FRAME_W
    const maxX = 0;
    const minX = FRAME_W - displayW;
    const maxY = 0;
    const minY = FRAME_H - displayH;
    return {
      x: Math.min(maxX, Math.max(minX, ox)),
      y: Math.min(maxY, Math.max(minY, oy)),
    };
  }, [imgSize]);

  // Mouse/touch drag
  const handlePointerDown = (e: React.PointerEvent) => {
    setDragging(true);
    lastPos.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setOffset(prev => clampOffset(prev.x + dx, prev.y + dy, scale));
  };

  const handlePointerUp = () => setDragging(false);

  // Scroll to zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    const minScale = Math.max(FRAME_W / imgSize.w, FRAME_H / imgSize.h);
    const newScale = Math.max(minScale, Math.min(3, scale + delta));

    // Zoom towards center of crop frame
    const cx = FRAME_W / 2;
    const cy = FRAME_H / 2;
    const newOx = cx - ((cx - offset.x) / scale) * newScale;
    const newOy = cy - ((cy - offset.y) / scale) * newScale;

    setScale(newScale);
    setOffset(clampOffset(newOx, newOy, newScale));
  };

  // Crop and export
  const handleCrop = () => {
    const img = imgRef.current;
    if (!img) return;

    const canvas = document.createElement('canvas');
    // Output at 2x for quality (440×1160)
    const outputW = FRAME_W * 2;
    const outputH = FRAME_H * 2;
    canvas.width = outputW;
    canvas.height = outputH;
    const ctx = canvas.getContext('2d')!;

    // Calculate which part of the original image to draw
    // offset.x, offset.y are in display coords (relative to crop frame)
    // scale maps natural px to display px
    const srcX = -offset.x / scale;
    const srcY = -offset.y / scale;
    const srcW = FRAME_W / scale;
    const srcH = FRAME_H / scale;

    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, outputW, outputH);

    canvas.toBlob((blob) => {
      if (blob) onCrop(blob);
    }, 'image/jpeg', 0.9);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onCancel} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 bg-bg-panel border border-gold/20 rounded-sm p-6 flex flex-col items-center"
      >
        <h3 className="font-title text-lg text-text-primary mb-2">裁剪展示图</h3>
        <p className="text-text-secondary/50 text-xs mb-4">拖动调整位置，滚轮缩放</p>

        {/* Crop area */}
        <div
          ref={containerRef}
          className="relative overflow-hidden cursor-grab active:cursor-grabbing bg-black"
          style={{ width: FRAME_W, height: FRAME_H, borderRadius: 8 }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onWheel={handleWheel}
        >
          {/* The image being moved/scaled */}
          <img
            ref={imgRef}
            src={imageSrc}
            alt="crop"
            onLoad={onImgLoad}
            draggable={false}
            className="absolute select-none"
            style={{
              left: offset.x,
              top: offset.y,
              width: imgSize.w * scale || 'auto',
              height: imgSize.h * scale || 'auto',
              maxWidth: 'none',
            }}
          />

          {/* Border overlay */}
          <div className="absolute inset-0 border-2 border-gold/40 rounded-lg pointer-events-none z-10" />

          {/* Rule of thirds grid */}
          <div className="absolute inset-0 pointer-events-none z-10">
            <div className="absolute top-1/3 left-0 right-0 h-[1px] bg-white/10" />
            <div className="absolute top-2/3 left-0 right-0 h-[1px] bg-white/10" />
            <div className="absolute left-1/3 top-0 bottom-0 w-[1px] bg-white/10" />
            <div className="absolute left-2/3 top-0 bottom-0 w-[1px] bg-white/10" />
          </div>
        </div>

        {/* Zoom indicator */}
        {imgLoaded && (
          <div className="mt-3 flex items-center gap-3">
            <span className="text-text-secondary/40 text-xs">缩放</span>
            <input
              type="range"
              min={Math.max(FRAME_W / imgSize.w, FRAME_H / imgSize.h) * 100}
              max={300}
              value={scale * 100}
              onChange={e => {
                const newScale = parseInt(e.target.value) / 100;
                const cx = FRAME_W / 2;
                const cy = FRAME_H / 2;
                const newOx = cx - ((cx - offset.x) / scale) * newScale;
                const newOy = cy - ((cy - offset.y) / scale) * newScale;
                setScale(newScale);
                setOffset(clampOffset(newOx, newOy, newScale));
              }}
              className="w-32 accent-gold"
            />
            <span className="text-text-secondary/40 text-xs w-10">{Math.round(scale * 100)}%</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-4">
          <GoldButton variant="ghost" size="sm" onClick={onCancel}>取消</GoldButton>
          <GoldButton variant="primary" size="sm" onClick={handleCrop}>确认裁剪</GoldButton>
        </div>
      </motion.div>
    </div>
  );
}
