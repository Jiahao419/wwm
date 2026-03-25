'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/components/providers/AuthProvider';
import { getSiteConfig, upsertSiteConfig } from '@/lib/db';

const DEFAULT_INTRO = `月冕总坛是《燕云十六声》中的百业综合公会，致力于百业战竞技与公会运营。我们拥有完善的指挥体系、灵活的战术策略，以及一群热爱游戏的伙伴。

从日常副本到百业争锋，从新人培养到战术研讨，月冕始终坚持「执剑天涯，护我月冕」的信念，在燕云江湖中书写属于我们的传奇。

无论你是久经沙场的老手，还是初入江湖的新侠，月冕都欢迎你的加入。`;

export default function IntroSection() {
  const { isAdminOrOwner } = useAuth();
  const [intro, setIntro] = useState(DEFAULT_INTRO);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSiteConfig('intro').then(({ data }) => {
      if (data?.value) setIntro(data.value);
    });
  }, []);

  const handleEdit = () => {
    setDraft(intro);
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await upsertSiteConfig('intro', draft);
    if (!error) {
      setIntro(draft);
      setEditing(false);
    } else {
      console.error('保存简介失败:', error);
      alert('保存失败：' + error.message);
    }
    setSaving(false);
  };

  const paragraphs = intro.split('\n').filter(line => line.trim());

  return (
    <section className="py-24 px-8">
      <div className="max-w-[1200px] mx-auto grid grid-cols-2 gap-16 items-center">
        {/* Left: Image placeholder */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="aspect-[4/3] rounded-sm gold-border bg-gradient-to-br from-bg-card to-bg-panel flex items-center justify-center"
        >
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full border border-gold/30 flex items-center justify-center bg-gold/5">
              <span className="font-title text-3xl text-gold/40">月</span>
            </div>
            <p className="text-text-secondary/40 text-sm">月冕集结图</p>
          </div>
        </motion.div>

        {/* Right: Text */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="font-display text-xs tracking-[0.3em] text-text-secondary/50 uppercase mb-2">
            ABOUT YUEMIAN
          </p>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="font-title text-3xl text-text-primary">月冕简介</h2>
            {isAdminOrOwner && !editing && (
              <button
                onClick={handleEdit}
                className="text-xs text-gold/50 hover:text-gold border border-gold/20 hover:border-gold/40 px-2 py-0.5 rounded-sm transition-colors"
              >
                编辑
              </button>
            )}
          </div>

          {editing ? (
            <div className="space-y-4">
              <textarea
                value={draft}
                onChange={e => setDraft(e.target.value)}
                rows={8}
                className="w-full p-4 bg-bg-card border border-gold/20 rounded-sm text-text-secondary text-sm leading-relaxed resize-y focus:border-gold/40 focus:outline-none"
                placeholder="输入简介内容，用空行分段..."
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-1.5 text-xs border border-gold/40 text-gold bg-gold/10 rounded-sm hover:bg-gold/20 transition-all disabled:opacity-50"
                >
                  {saving ? '保存中...' : '保存'}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="px-4 py-1.5 text-xs border border-gold/10 text-text-secondary rounded-sm hover:border-gold/30 transition-all"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-text-secondary leading-relaxed">
              {paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
