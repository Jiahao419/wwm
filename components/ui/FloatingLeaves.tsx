'use client';

import { useEffect, useRef } from 'react';

interface Leaf {
  x: number;
  y: number;
  size: number;
  rotation: number;
  rotSpeed: number;
  speedX: number;
  speedY: number;
  opacity: number;
  type: number; // 0=maple, 1=willow, 2=small
  wobble: number;
  wobbleSpeed: number;
}

interface FloatingLeavesProps {
  count?: number;
  className?: string;
}

export default function FloatingLeaves({ count = 15, className = '' }: FloatingLeavesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const leavesRef = useRef<Leaf[]>([]);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Initialize leaves
    leavesRef.current = Array.from({ length: count }, () => createLeaf(canvas.width, canvas.height, true));

    function createLeaf(w: number, h: number, randomY = false): Leaf {
      return {
        x: Math.random() * w,
        y: randomY ? Math.random() * h : -20,
        size: 4 + Math.random() * 8,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.02,
        speedX: (Math.random() - 0.3) * 0.4,
        speedY: 0.3 + Math.random() * 0.6,
        opacity: 0.15 + Math.random() * 0.25,
        type: Math.floor(Math.random() * 3),
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.01 + Math.random() * 0.02,
      };
    }

    function drawLeaf(ctx: CanvasRenderingContext2D, leaf: Leaf) {
      ctx.save();
      ctx.translate(leaf.x, leaf.y);
      ctx.rotate(leaf.rotation);
      ctx.globalAlpha = leaf.opacity;

      if (leaf.type === 0) {
        // Maple-like leaf
        ctx.fillStyle = '#8b6914';
        ctx.beginPath();
        ctx.moveTo(0, -leaf.size);
        ctx.quadraticCurveTo(leaf.size * 0.8, -leaf.size * 0.3, leaf.size * 0.5, leaf.size * 0.2);
        ctx.quadraticCurveTo(leaf.size * 0.3, leaf.size * 0.5, 0, leaf.size * 0.8);
        ctx.quadraticCurveTo(-leaf.size * 0.3, leaf.size * 0.5, -leaf.size * 0.5, leaf.size * 0.2);
        ctx.quadraticCurveTo(-leaf.size * 0.8, -leaf.size * 0.3, 0, -leaf.size);
        ctx.fill();
        // Vein
        ctx.strokeStyle = '#a07820';
        ctx.lineWidth = 0.3;
        ctx.beginPath();
        ctx.moveTo(0, -leaf.size * 0.6);
        ctx.lineTo(0, leaf.size * 0.6);
        ctx.stroke();
      } else if (leaf.type === 1) {
        // Willow-like elongated leaf
        ctx.fillStyle = '#6b5a20';
        ctx.beginPath();
        ctx.ellipse(0, 0, leaf.size * 0.25, leaf.size, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Small round leaf / petal
        ctx.fillStyle = '#9a7030';
        ctx.beginPath();
        ctx.ellipse(0, 0, leaf.size * 0.4, leaf.size * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    function animate() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      leavesRef.current.forEach((leaf, i) => {
        // Wobble movement
        leaf.wobble += leaf.wobbleSpeed;
        leaf.x += leaf.speedX + Math.sin(leaf.wobble) * 0.3;
        leaf.y += leaf.speedY;
        leaf.rotation += leaf.rotSpeed;

        // Reset when off screen
        if (leaf.y > canvas.height + 20 || leaf.x < -30 || leaf.x > canvas.width + 30) {
          leavesRef.current[i] = createLeaf(canvas.width, canvas.height, false);
          leavesRef.current[i].x = Math.random() * canvas.width;
        }

        drawLeaf(ctx, leaf);
      });

      animRef.current = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [count]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none ${className}`}
      style={{ width: '100%', height: '100%' }}
    />
  );
}
