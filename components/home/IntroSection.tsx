'use client';

import { motion } from 'framer-motion';

export default function IntroSection() {
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
          <h2 className="font-title text-3xl text-text-primary mb-6">月冕简介</h2>
          <div className="space-y-4 text-text-secondary leading-relaxed">
            <p>
              月冕总坛是《燕云十六声》中的百业综合公会，致力于百业战竞技与公会运营。
              我们拥有完善的指挥体系、灵活的战术策略，以及一群热爱游戏的伙伴。
            </p>
            <p>
              从日常副本到百业争锋，从新人培养到战术研讨，月冕始终坚持
              「执剑天涯，护我月冕」的信念，在燕云江湖中书写属于我们的传奇。
            </p>
            <p>
              无论你是久经沙场的老手，还是初入江湖的新侠，月冕都欢迎你的加入。
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
