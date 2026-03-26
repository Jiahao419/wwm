'use client';

import { motion } from 'framer-motion';
import ParticleBackground from '@/components/ui/ParticleBackground';
import FloatingLeaves from '@/components/ui/FloatingLeaves';

export default function HeroSection() {
  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Deep dark background */}
      <div className="absolute inset-0 bg-[#050508]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(201,168,76,0.06)_0%,transparent_55%)]" />

      {/* Ink/mist atmosphere */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,rgba(60,50,30,0.15)_0%,transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_50%,rgba(60,50,30,0.1)_0%,transparent_50%)]" />
      <div className="absolute bottom-0 left-0 right-0 h-[30%] bg-gradient-to-t from-[#050508] via-transparent to-transparent" />

      {/* Gold particles */}
      <ParticleBackground />

      {/* Floating leaves */}
      <div className="absolute inset-0 z-[2]">
        <FloatingLeaves count={12} />
      </div>

      {/* LEFT swordsman silhouette */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1.5, delay: 1.2 }}
        className="absolute left-[5%] bottom-[8%] z-[3] pointer-events-none select-none"
      >
        <svg width="280" height="520" viewBox="0 0 280 520" fill="none" className="opacity-[0.06]">
          {/* Swordsman with sword - left facing */}
          <g>
            {/* Flowing robe base */}
            <path d="M140 60 C120 60 100 80 95 120 L80 200 C70 240 50 300 40 360 L20 480 C20 500 60 510 140 510 C220 510 260 500 260 480 L240 360 C230 300 210 240 200 200 L185 120 C180 80 160 60 140 60Z" fill="currentColor" className="text-gold"/>
            {/* Head */}
            <circle cx="140" cy="45" r="25" fill="currentColor" className="text-gold"/>
            {/* Hat/crown */}
            <path d="M110 35 L140 10 L170 35" stroke="currentColor" strokeWidth="3" fill="none" className="text-gold"/>
            {/* Sword - held diagonally */}
            <line x1="60" y1="100" x2="20" y2="20" stroke="currentColor" strokeWidth="3" className="text-gold"/>
            <line x1="15" y1="22" x2="25" y2="18" stroke="currentColor" strokeWidth="4" className="text-gold"/>
            {/* Left arm holding sword */}
            <path d="M120 110 C100 100 80 95 60 100" stroke="currentColor" strokeWidth="3" fill="none" className="text-gold"/>
            {/* Right arm */}
            <path d="M160 110 C180 130 200 150 210 160" stroke="currentColor" strokeWidth="3" fill="none" className="text-gold"/>
            {/* Robe details */}
            <path d="M95 200 C100 250 90 320 80 400" stroke="currentColor" strokeWidth="1.5" fill="none" className="text-gold" opacity="0.5"/>
            <path d="M185 200 C180 250 190 320 200 400" stroke="currentColor" strokeWidth="1.5" fill="none" className="text-gold" opacity="0.5"/>
            {/* Sash/belt */}
            <path d="M100 190 L180 190" stroke="currentColor" strokeWidth="2" className="text-gold" opacity="0.6"/>
            <path d="M170 190 C175 220 180 260 190 300" stroke="currentColor" strokeWidth="1.5" fill="none" className="text-gold" opacity="0.4"/>
          </g>
        </svg>
      </motion.div>

      {/* RIGHT swordsman silhouette */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1.5, delay: 1.4 }}
        className="absolute right-[5%] bottom-[8%] z-[3] pointer-events-none select-none"
      >
        <svg width="280" height="520" viewBox="0 0 280 520" fill="none" className="opacity-[0.06]" style={{ transform: 'scaleX(-1)' }}>
          <g>
            <path d="M140 60 C120 60 100 80 95 120 L80 200 C70 240 50 300 40 360 L20 480 C20 500 60 510 140 510 C220 510 260 500 260 480 L240 360 C230 300 210 240 200 200 L185 120 C180 80 160 60 140 60Z" fill="currentColor" className="text-gold"/>
            <circle cx="140" cy="45" r="25" fill="currentColor" className="text-gold"/>
            <path d="M110 35 L140 10 L170 35" stroke="currentColor" strokeWidth="3" fill="none" className="text-gold"/>
            {/* Long sword held upright */}
            <line x1="200" y1="140" x2="230" y2="10" stroke="currentColor" strokeWidth="3" className="text-gold"/>
            <line x1="225" y1="12" x2="235" y2="8" stroke="currentColor" strokeWidth="4" className="text-gold"/>
            <path d="M160 110 C180 120 195 130 200 140" stroke="currentColor" strokeWidth="3" fill="none" className="text-gold"/>
            <path d="M120 110 C100 130 80 150 70 160" stroke="currentColor" strokeWidth="3" fill="none" className="text-gold"/>
            <path d="M95 200 C100 250 90 320 80 400" stroke="currentColor" strokeWidth="1.5" fill="none" className="text-gold" opacity="0.5"/>
            <path d="M185 200 C180 250 190 320 200 400" stroke="currentColor" strokeWidth="1.5" fill="none" className="text-gold" opacity="0.5"/>
            <path d="M100 190 L180 190" stroke="currentColor" strokeWidth="2" className="text-gold" opacity="0.6"/>
          </g>
        </svg>
      </motion.div>

      {/* Decorative horizontal sword lines */}
      <motion.div
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: 1.2, delay: 0.8 }}
        className="absolute left-[10%] top-[50%] -translate-y-1/2 z-[3] pointer-events-none"
      >
        <div className="w-[120px] h-[1px] bg-gradient-to-r from-transparent via-gold/20 to-gold/5" />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: 1.2, delay: 0.8 }}
        className="absolute right-[10%] top-[50%] -translate-y-1/2 z-[3] pointer-events-none"
      >
        <div className="w-[120px] h-[1px] bg-gradient-to-l from-transparent via-gold/20 to-gold/5" />
      </motion.div>

      {/* Content */}
      <div className="relative z-10 text-center">
        {/* WWM Logo - with mix-blend to avoid black bg standing out */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="flex justify-center mb-8"
        >
          <img
            src="/images/wwm-logo.png"
            alt="燕云十六声"
            className="w-[90px] h-[90px] object-contain opacity-80"
            style={{ mixBlendMode: 'lighten' }}
          />
        </motion.div>

        {/* Main calligraphy title - LARGE, gold gradient with glow sweep */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mb-5 relative"
        >
          <h1
            className="font-brush text-[10rem] leading-none tracking-[0.15em] relative inline-block hero-title-glow"
            style={{
              background: 'linear-gradient(105deg, #8a6d2f 0%, #c9a84c 25%, #f0d878 45%, #fffbe6 50%, #f0d878 55%, #c9a84c 75%, #8a6d2f 100%)',
              backgroundSize: '200% 100%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 0 30px rgba(201,168,76,0.3)) drop-shadow(0 0 60px rgba(201,168,76,0.1))',
            }}
          >
            月冕总坛
          </h1>
        </motion.div>

        {/* Game reference */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="font-display text-[11px] tracking-[0.3em] text-text-secondary/25 uppercase mb-10"
        >
          WHERE WINDS MEET · 燕云十六声
        </motion.p>

        {/* Slogan with decorative lines */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.0 }}
          className="flex items-center justify-center gap-6"
        >
          <div className="w-16 h-[1px] bg-gradient-to-r from-transparent to-gold/30" />
          <p className="text-gold/50 text-lg tracking-[0.4em] font-title">
            执剑天涯，护我月冕
          </p>
          <div className="w-16 h-[1px] bg-gradient-to-l from-transparent to-gold/30" />
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <svg className="w-5 h-5 text-gold/25" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
        </svg>
      </motion.div>

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{
        boxShadow: 'inset 0 0 200px 60px rgba(5,5,8,0.8)',
      }} />

      {/* Gold glow sweep animation */}
      <style jsx>{`
        .hero-title-glow {
          animation: goldSweep 4s ease-in-out infinite;
        }
        @keyframes goldSweep {
          0%, 100% { background-position: 100% 0; }
          50% { background-position: 0% 0; }
        }
      `}</style>
    </section>
  );
}
