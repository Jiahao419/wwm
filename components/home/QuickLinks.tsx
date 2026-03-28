'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

const links = [
  { href: '/battle', title: '百业战务', desc: '查看战术部署与分队安排', icon: '⚔' },
  { href: '/signup', title: '赛事报名', desc: '报名参加即将到来的赛事', icon: '📋' },
  { href: '/roster', title: '月冕名册', desc: '浏览全体成员档案', icon: '📜' },
  { href: '/notices', title: '公告檄文', desc: '查看最新公会动态', icon: '🏮' },
];

export default function QuickLinks() {
  return (
    <section className="py-20 px-4 md:px-8">
      <div className="max-w-[1200px] mx-auto">
        <div className="text-center mb-12">
          <p className="font-display text-xs tracking-[0.3em] text-text-secondary/50 uppercase mb-2">
            QUICK ACCESS
          </p>
          <h2 className="font-title text-3xl text-text-primary">快捷入口</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {links.map((link, i) => (
            <motion.div
              key={link.href}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <Link href={link.href}>
                <div className="p-4 sm:p-6 lg:p-8 bg-bg-card gold-border-hover rounded-sm group cursor-pointer h-full">
                  <div className="text-3xl mb-4">{link.icon}</div>
                  <h3 className="font-title text-xl text-text-primary mb-2 group-hover:text-gold transition-colors">
                    {link.title}
                  </h3>
                  <p className="text-text-secondary text-sm">{link.desc}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
