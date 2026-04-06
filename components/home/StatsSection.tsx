'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { getProfiles } from '@/lib/db';
import { FACTIONS, FACTION_COLORS } from '@/lib/constants';

function AnimatedNumber({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 1500;
    const step = Math.max(1, Math.ceil(value / (duration / 16)));
    const timer = setInterval(() => {
      start += step;
      if (start >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, value]);

  return (
    <span ref={ref} className="font-mono text-3xl sm:text-4xl lg:text-5xl">
      {count}
      <span className="text-2xl opacity-60 ml-1">{suffix}</span>
    </span>
  );
}

export default function StatsSection() {
  const [factionCounts, setFactionCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    getProfiles().then(({ data }) => {
      if (!data) return;
      const counts: Record<string, number> = {};
      for (const f of FACTIONS) counts[f] = 0;
      for (const p of data) {
        if (p.faction && counts[p.faction] !== undefined) {
          counts[p.faction]++;
        }
      }
      setFactionCounts(counts);
    });
  }, []);

  return (
    <section className="py-20 px-4 md:px-8">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {FACTIONS.map((faction, i) => {
            const colors = FACTION_COLORS[faction];
            return (
              <motion.div
                key={faction}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="relative text-center p-4 sm:p-6 lg:p-8 rounded-sm"
                style={{
                  background: colors?.bg || 'rgba(255,255,255,0.05)',
                  border: `1px solid ${colors?.border || 'rgba(255,255,255,0.1)'}`,
                }}
              >
                <div style={{ color: colors?.text || '#c9a84c' }}>
                  <AnimatedNumber value={factionCounts[faction] || 0} suffix="人" />
                </div>
                <p
                  className="text-sm mt-3 tracking-wider font-medium"
                  style={{ color: colors?.text || '#c9a84c' }}
                >
                  {faction}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
