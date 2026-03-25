'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS } from '@/lib/constants';
import WwmLogo from '@/components/ui/WwmLogo';
import { useAuth } from '@/components/providers/AuthProvider';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { user, loading, signInWithDiscord, signOut } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Extract Discord avatar and username from user metadata
  const discordAvatar = user?.user_metadata?.avatar_url;
  const discordName = user?.user_metadata?.full_name || user?.user_metadata?.name || '江湖侠客';

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b ${
        scrolled
          ? 'glass-heavy border-gold/20'
          : 'glass border-gold/10'
      }`}
    >
      <div className="max-w-[1600px] mx-auto px-8 h-16 flex items-center justify-between">
        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <WwmLogo size={28} className="opacity-70 group-hover:opacity-100 transition-opacity" />
          <span className="font-title text-xl text-text-primary group-hover:text-gold transition-colors tracking-wider">
            月冕总坛
          </span>
        </Link>

        {/* Center: Nav links */}
        <div className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 text-sm tracking-wider transition-all duration-200 relative ${
                  isActive
                    ? 'text-gold'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-px bg-gold" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Right: Auth */}
        {loading ? (
          <div className="w-[180px] h-10 animate-pulse bg-gold/5 border border-gold/10" />
        ) : user ? (
          /* Logged in - show avatar + name + dropdown */
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-3 px-3 py-1.5 border border-gold/20 hover:border-gold/40 transition-all duration-200 group"
            >
              {discordAvatar ? (
                <img
                  src={discordAvatar}
                  alt={discordName}
                  className="w-7 h-7 rounded-full ring-1 ring-gold/30"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gold/20 flex items-center justify-center">
                  <span className="text-gold text-xs">{discordName[0]}</span>
                </div>
              )}
              <span className="text-text-primary text-sm group-hover:text-gold transition-colors">
                {discordName}
              </span>
              <svg className={`w-3 h-3 text-text-secondary transition-transform ${menuOpen ? 'rotate-180' : ''}`} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 4.5L6 7.5L9 4.5" />
              </svg>
            </button>

            {/* Dropdown menu */}
            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 py-1 glass-heavy border border-gold/20 shadow-lg shadow-black/30">
                <div className="px-4 py-2 border-b border-gold/10">
                  <p className="text-text-secondary text-xs truncate">{user.email || discordName}</p>
                </div>
                <button
                  onClick={() => { setMenuOpen(false); signOut(); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-text-secondary hover:text-cinnabar hover:bg-cinnabar/5 transition-colors"
                >
                  退出登录
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Not logged in - show Discord login button */
          <button
            onClick={signInWithDiscord}
            className="flex items-center gap-2 px-4 py-2 border border-gold/30 text-gold/80 text-sm hover:bg-gold/10 hover:border-gold/60 transition-all duration-200"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
            </svg>
            以 Discord 身份登录
          </button>
        )}
      </div>
    </nav>
  );
}
