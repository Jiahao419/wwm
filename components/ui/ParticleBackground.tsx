'use client';

import { useEffect, useState } from 'react';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import type { ISourceOptions } from '@tsparticles/engine';

const particleOptions: ISourceOptions = {
  fullScreen: false,
  background: { color: { value: 'transparent' } },
  fpsLimit: 60,
  particles: {
    color: { value: '#c9a84c' },
    move: {
      enable: true,
      speed: 0.4,
      direction: 'none',
      random: true,
      straight: false,
      outModes: { default: 'out' },
    },
    number: {
      value: 80,
      density: { enable: true },
    },
    opacity: {
      value: { min: 0.1, max: 0.5 },
      animation: {
        enable: true,
        speed: 0.5,
        sync: false,
      },
    },
    size: {
      value: { min: 1, max: 3 },
    },
    links: {
      enable: false,
    },
  },
};

export default function ParticleBackground() {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => setInit(true));
  }, []);

  if (!init) return null;

  return (
    <Particles
      id="hero-particles"
      className="absolute inset-0 z-0"
      options={particleOptions}
    />
  );
}
