import Link from 'next/link';
import WwmLogo from '@/components/ui/WwmLogo';
import { InkDivider } from '@/components/ui/InkDecoration';

export default function Footer() {
  return (
    <footer className="border-t border-gold/10 bg-bg-secondary">
      <div className="max-w-[1600px] mx-auto px-8 py-16">
        <div className="grid grid-cols-4 gap-12">
          {/* Logo & Description */}
          <div className="col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <WwmLogo size={32} className="opacity-60" />
              <span className="font-title text-xl text-text-primary tracking-wider">月冕总坛</span>
            </div>
            <p className="text-text-secondary text-sm leading-relaxed">
              《燕云十六声》百业综合公会<br />
              执剑天涯，护我月冕
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-title text-gold/80 text-sm mb-4 tracking-wider">导航</h4>
            <div className="flex flex-col gap-2">
              <Link href="/roster" className="text-text-secondary text-sm hover:text-gold transition-colors">月冕名册</Link>
              <Link href="/battle" className="text-text-secondary text-sm hover:text-gold transition-colors">百业战务</Link>
              <Link href="/signup" className="text-text-secondary text-sm hover:text-gold transition-colors">赛事报名</Link>
              <Link href="/relations" className="text-text-secondary text-sm hover:text-gold transition-colors">关系谱</Link>
              <Link href="/notices" className="text-text-secondary text-sm hover:text-gold transition-colors">公告檄文</Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-title text-gold/80 text-sm mb-4 tracking-wider">联系我们</h4>
            <div className="flex flex-col gap-2">
              <span className="text-text-secondary text-sm">Discord 服务器</span>
              <span className="text-text-secondary text-sm">微信群（扫码加入）</span>
            </div>
          </div>

          {/* Game Info */}
          <div>
            <h4 className="font-title text-gold/80 text-sm mb-4 tracking-wider">关于游戏</h4>
            <p className="text-text-secondary text-sm leading-relaxed">
              《燕云十六声》是一款开放世界武侠RPG游戏，月冕总坛为游戏内百业系统公会组织。
            </p>
          </div>
        </div>

        {/* Divider */}
        <InkDivider />

        {/* Copyright */}
        <div className="flex items-center justify-between">
          <p className="text-text-secondary/50 text-xs">
            &copy; 2026 月冕总坛 · YUEMIAN GUILD. All rights reserved.
          </p>
          <p className="text-text-secondary/30 text-xs font-display tracking-wider">
            GUILD OF THE ETERNAL MOON · WHERE WINDS MEET
          </p>
        </div>
      </div>
    </footer>
  );
}
