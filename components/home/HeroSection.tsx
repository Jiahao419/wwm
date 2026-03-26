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

      {/* LEFT swordsman - ink painting style */}
      <motion.div
        initial={{ opacity: 0, x: -60 }}
        animate={{ opacity: 0.85, x: 0 }}
        transition={{ duration: 2, delay: 1.0, ease: 'easeOut' }}
        className="absolute left-0 bottom-0 z-[3] pointer-events-none select-none"
      >
        <img
          src="/images/swordsman-left.png"
          alt=""
          className="h-[90vh] w-auto object-contain"
          style={{ mixBlendMode: 'lighten', filter: 'brightness(1.8)' }}
          draggable={false}
        />
        {/* Fade edges into background */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#050508] pointer-events-none" style={{ right: '-10%' }} />
        <div className="absolute bottom-0 left-0 right-0 h-[20%] bg-gradient-to-t from-[#050508] to-transparent pointer-events-none" />
      </motion.div>

      {/* Right side intentionally empty for clean layout */}

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
