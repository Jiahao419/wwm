'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { useAuth } from '@/components/providers/AuthProvider';
import { getSiteStats, updateSiteStat } from '@/lib/db';
import type { SiteStat } from '@/lib/types';

const DEFAULT_STATS = [
  { id: 0, sort_order: 0, label: '成员人数', value: 48, suffix: '人', updated_at: '' },
  { id: 0, sort_order: 1, label: '活跃成员', value: 32, suffix: '人', updated_at: '' },
  { id: 0, sort_order: 2, label: '已完成赛事', value: 31, suffix: '场', updated_at: '' },
  { id: 0, sort_order: 3, label: '管理层人数', value: 6, suffix: '人', updated_at: '' },
];

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
    <span ref={ref} className="font-mono text-3xl sm:text-4xl lg:text-5xl text-gold gold-text-glow">
      {count}
      <span className="text-2xl text-gold/60 ml-1">{suffix}</span>
    </span>
  );
}

interface EditModalProps {
  stat: SiteStat;
  onSave: (id: number, data: { label: string; value: number; suffix: string }) => Promise<void>;
  onClose: () => void;
}

function EditStatModal({ stat, onSave, onClose }: EditModalProps) {
  const [label, setLabel] = useState(stat.label);
  const [value, setValue] = useState(stat.value);
  const [suffix, setSuffix] = useState(stat.suffix);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(stat.id, { label, value, suffix });
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-bg-card border border-gold/30 rounded-lg p-6 w-[360px]"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-gold font-brush text-xl mb-4">编辑统计项</h3>

        <div className="space-y-3">
          <div>
            <label className="text-text-secondary text-sm block mb-1">标签名称</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full bg-bg-primary border border-gold/20 rounded px-3 py-2 text-text-primary focus:border-gold/50 outline-none"
            />
          </div>
          <div>
            <label className="text-text-secondary text-sm block mb-1">数值</label>
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(parseInt(e.target.value) || 0)}
              className="w-full bg-bg-primary border border-gold/20 rounded px-3 py-2 text-text-primary focus:border-gold/50 outline-none"
            />
          </div>
          <div>
            <label className="text-text-secondary text-sm block mb-1">单位后缀</label>
            <input
              type="text"
              value={suffix}
              onChange={(e) => setSuffix(e.target.value)}
              className="w-full bg-bg-primary border border-gold/20 rounded px-3 py-2 text-text-primary focus:border-gold/50 outline-none"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-gold/20 rounded text-text-secondary hover:bg-gold/5 transition"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2 bg-gold/20 border border-gold/40 rounded text-gold hover:bg-gold/30 transition disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function StatsSection() {
  const { isAdminOrOwner } = useAuth();
  const [stats, setStats] = useState<SiteStat[]>(DEFAULT_STATS);
  const [editingStat, setEditingStat] = useState<SiteStat | null>(null);

  useEffect(() => {
    getSiteStats().then(({ data }) => {
      if (data && data.length > 0) {
        setStats(data);
      }
    });
  }, []);

  const handleSave = async (id: number, data: { label: string; value: number; suffix: string }) => {
    const { data: updated, error } = await updateSiteStat(id, data);
    if (!error && updated) {
      setStats((prev) => prev.map((s) => (s.id === id ? updated : s)));
    }
  };

  return (
    <section className="py-20 px-4 md:px-8">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.sort_order}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative text-center p-4 sm:p-6 lg:p-8 gold-border rounded-sm bg-bg-card/50 group"
            >
              {isAdminOrOwner && (
                <button
                  onClick={() => setEditingStat(stat)}
                  className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-gold/10 text-gold/50 hover:bg-gold/20 hover:text-gold opacity-0 group-hover:opacity-100 transition-all"
                  title="编辑"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              )}
              <AnimatedNumber value={stat.value} suffix={stat.suffix} />
              <p className="text-text-secondary text-sm mt-3 tracking-wider">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {editingStat && (
        <EditStatModal
          stat={editingStat}
          onSave={handleSave}
          onClose={() => setEditingStat(null)}
        />
      )}
    </section>
  );
}
