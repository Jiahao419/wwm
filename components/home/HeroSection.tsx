'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import GoldButton from '@/components/ui/GoldButton';
import ParticleBackground from '@/components/ui/ParticleBackground';
import FloatingLeaves from '@/components/ui/FloatingLeaves';
import WwmLogo from '@/components/ui/WwmLogo';

export default function HeroSection() {
  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Deep dark background with subtle radial */}
      <div className="absolute inset-0 bg-[#050508]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(201,168,76,0.04)_0%,transparent_60%)]" />

      {/* Ink/mist atmosphere layers */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,rgba(60,50,30,0.15)_0%,transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_50%,rgba(60,50,30,0.1)_0%,transparent_50%)]" />
      <div className="absolute bottom-0 left-0 right-0 h-[30%] bg-gradient-to-t from-[#050508] via-transparent to-transparent" />

      {/* Gold particles (subtle, like dust in moonlight) */}
      <ParticleBackground />

      {/* Floating leaves */}
      <div className="absolute inset-0 z-[2]">
        <FloatingLeaves count={12} />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center">
        {/* WWM-style bamboo/sword cross mark */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="flex justify-center mb-6"
        >
          <WwmLogo size={100} className="opacity-90" />
        </motion.div>

        {/* Main title - calligraphy style, mimicking the WWM logo layout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mb-4"
        >
          {/* Main calligraphy title */}
          <h1 className="font-brush text-8xl text-[#e8dcc8] tracking-[0.2em] leading-none"
              style={{
                textShadow: '0 0 40px rgba(201,168,76,0.15), 0 0 80px rgba(201,168,76,0.05)',
              }}
          >
            月冕总坛
          </h1>
        </motion.div>

        {/* English subtitle - matching WWM's "WHERE WINDS MEET" style */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="font-display text-sm tracking-[0.5em] text-[#c9a84c] uppercase mb-2"
          style={{ fontWeight: 400 }}
        >
          GUILD OF THE ETERNAL MOON
        </motion.p>

        {/* Game reference line */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.0 }}
          className="font-display text-[11px] tracking-[0.3em] text-text-secondary/30 uppercase mb-12"
        >
          WHERE WINDS MEET · 燕云十六声
        </motion.p>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="text-text-secondary/60 text-base max-w-md mx-auto mb-10 leading-relaxed tracking-wider"
        >
          执剑天涯，护我月冕
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.4 }}
          className="flex items-center gap-5 justify-center"
        >
          <Link href="/battle">
            <GoldButton variant="primary" size="lg">
              查看百业战务
            </GoldButton>
          </Link>
          <Link href="/signup">
            <GoldButton variant="secondary" size="lg">
              立即加入报名
            </GoldButton>
          </Link>
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

      {/* Subtle vignette edges */}
      <div className="absolute inset-0 pointer-events-none" style={{
        boxShadow: 'inset 0 0 200px 60px rgba(5,5,8,0.8)',
      }} />
    </section>
  );
}
