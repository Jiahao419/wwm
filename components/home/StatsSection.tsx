'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

const stats = [
  { label: '成员人数', value: 48, suffix: '人' },
  { label: '活跃成员', value: 32, suffix: '人' },
  { label: '已完成赛事', value: 31, suffix: '场' },
  { label: '管理层人数', value: 6, suffix: '人' },
];

function AnimatedNumber({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 1500;
    const step = Math.ceil(value / (duration / 16));
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
    <span ref={ref} className="font-mono text-5xl text-gold gold-text-glow">
      {count}
      <span className="text-2xl text-gold/60 ml-1">{suffix}</span>
    </span>
  );
}

export default function StatsSection() {
  return (
    <section className="py-20 px-8">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="text-center p-8 gold-border rounded-sm bg-bg-card/50"
            >
              <AnimatedNumber value={stat.value} suffix={stat.suffix} />
              <p className="text-text-secondary text-sm mt-3 tracking-wider">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
