'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { getProfiles } from '@/lib/db';
import { FACTIONS, FACTION_COLORS } from '@/lib/constants';
import type { Profile } from '@/lib/types';

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

function FactionModal({
  faction,
  members,
  onClose,
}: {
  faction: string;
  members: Profile[];
  onClose: () => void;
}) {
  const colors = FACTION_COLORS[faction];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-md max-h-[70vh] overflow-hidden rounded-lg"
        style={{
          background: 'rgba(20,20,25,0.95)',
          border: `1px solid ${colors?.border || 'rgba(255,255,255,0.2)'}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 px-6 py-4 flex items-center justify-between"
          style={{ background: colors?.bg || 'rgba(255,255,255,0.05)', borderBottom: `1px solid ${colors?.border || 'rgba(255,255,255,0.1)'}` }}
        >
          <h3 className="text-xl font-bold tracking-wider" style={{ color: colors?.text || '#c9a84c' }}>
            {faction}
            <span className="text-sm font-normal opacity-70 ml-2">({members.length}人)</span>
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition text-white/60 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Member list */}
        <div className="overflow-y-auto max-h-[calc(70vh-64px)] p-4">
          {members.length === 0 ? (
            <p className="text-center text-white/40 py-8">暂无成员</p>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg transition hover:bg-white/5"
                  style={{ border: `1px solid ${colors?.border || 'rgba(255,255,255,0.08)'}` }}
                >
                  {m.avatar_url ? (
                    <img
                      src={m.avatar_url}
                      alt={m.nickname}
                      className="w-10 h-10 rounded-full object-cover border"
                      style={{ borderColor: colors?.border || 'rgba(255,255,255,0.2)' }}
                    />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{
                        background: colors?.bg || 'rgba(255,255,255,0.1)',
                        color: colors?.text || '#c9a84c',
                        border: `1px solid ${colors?.border || 'rgba(255,255,255,0.2)'}`,
                      }}
                    >
                      {m.nickname.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{m.nickname}</p>
                    {m.identity && (
                      <p className="text-xs text-white/40 truncate">{m.identity}</p>
                    )}
                  </div>
                  {m.tags && m.tags.length > 0 && (
                    <div className="flex gap-1 flex-shrink-0">
                      {m.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] px-1.5 py-0.5 rounded"
                          style={{
                            background: colors?.bg || 'rgba(255,255,255,0.1)',
                            color: colors?.text || '#c9a84c',
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function StatsSection() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [factionCounts, setFactionCounts] = useState<Record<string, number>>({});
  const [selectedFaction, setSelectedFaction] = useState<string | null>(null);

  useEffect(() => {
    getProfiles().then(({ data }) => {
      if (!data) return;
      setProfiles(data);
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

  const selectedMembers = selectedFaction
    ? profiles.filter((p) => p.faction === selectedFaction)
    : [];

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
                onClick={() => setSelectedFaction(faction)}
                className="relative text-center p-4 sm:p-6 lg:p-8 rounded-sm cursor-pointer hover:scale-[1.03] transition-transform"
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

      <AnimatePresence>
        {selectedFaction && (
          <FactionModal
            faction={selectedFaction}
            members={selectedMembers}
            onClose={() => setSelectedFaction(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
