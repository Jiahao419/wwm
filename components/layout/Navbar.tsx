'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS } from '@/lib/constants';
import { useAuth } from '@/components/providers/AuthProvider';
import { getProfiles, updateProfile } from '@/lib/db';
import EditModal from '@/components/roster/EditModal';
import type { Profile } from '@/lib/types';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [myProfile, setMyProfile] = useState<Profile | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileNavRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { user, loading, signInWithDiscord, signOut } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch current user's profile
  const fetchMyProfile = useCallback(async () => {
    if (!user) return;
    const { data } = await getProfiles();
    if (data) {
      const p = data.find(pr => pr.user_id === user.id);
      if (p) setMyProfile(p);
    }
  }, [user]);

  useEffect(() => {
    fetchMyProfile();
  }, [fetchMyProfile]);

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Close mobile nav when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        mobileNavOpen &&
        mobileNavRef.current &&
        !mobileNavRef.current.contains(e.target as Node)
      ) {
        setMobileNavOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [mobileNavOpen]);

  // Close mobile nav on route change
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  const discordAvatar = user?.user_metadata?.avatar_url;
  const discordName = user?.user_metadata?.full_name || user?.user_metadata?.name || '江湖侠客';

  const handleSaveProfile = async (data: Partial<Profile>) => {
    if (!myProfile) return;
    const { error } = await updateProfile(myProfile.id, data);
    if (error) {
      alert('保存失败：' + error.message);
    } else {
      await fetchMyProfile();
    }
    setShowEditProfile(false);
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b ${
          scrolled
            ? 'glass-heavy border-gold/20'
            : 'glass border-gold/10'
        }`}
      >
        <div className="max-w-[1600px] mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          {/* Left: Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <img src="/images/wwm-icon.ico" alt="月冕" width={28} height={28} className="opacity-70 group-hover:opacity-100 transition-opacity" />
            <span className="font-title text-base md:text-xl text-text-primary group-hover:text-gold transition-colors tracking-wider">
              月冕总坛
            </span>
          </Link>

          {/* Center: Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
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

          {/* Right: Auth + Hamburger */}
          <div className="flex items-center gap-2">
            {loading ? (
              <div className="w-[120px] md:w-[180px] h-10 animate-pulse bg-gold/5 border border-gold/10" />
            ) : user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 md:gap-3 px-2 md:px-3 py-1.5 border border-gold/20 hover:border-gold/40 transition-all duration-200 group"
                >
                  {discordAvatar ? (
                    <img
                      src={discordAvatar}
                      alt={discordName}
                      className="w-6 h-6 md:w-7 md:h-7 rounded-full ring-1 ring-gold/30"
                    />
                  ) : (
                    <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-gold/20 flex items-center justify-center">
                      <span className="text-gold text-xs">{discordName[0]}</span>
                    </div>
                  )}
                  <span className="hidden sm:inline text-text-primary text-sm group-hover:text-gold transition-colors">
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
                    {myProfile && (
                      <button
                        onClick={() => { setMenuOpen(false); setShowEditProfile(true); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-text-secondary hover:text-gold hover:bg-gold/5 transition-colors"
                      >
                        编辑档案
                      </button>
                    )}
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
              <button
                onClick={signInWithDiscord}
                className="flex items-center gap-2 px-3 md:px-4 py-2 border border-gold/30 text-gold/80 text-xs md:text-sm hover:bg-gold/10 hover:border-gold/60 transition-all duration-200"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
                </svg>
                <span className="hidden sm:inline">以 Discord 身份登录</span>
                <span className="sm:hidden">登录</span>
              </button>
            )}

            {/* Hamburger menu button - mobile only */}
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="md:hidden flex items-center justify-center w-9 h-9 border border-gold/20 hover:border-gold/40 transition-colors"
              aria-label="菜单"
            >
              {mobileNavOpen ? (
                <svg className="w-5 h-5 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile slide-down nav panel */}
        <div
          ref={mobileNavRef}
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out border-t border-gold/10 ${
            mobileNavOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 border-t-0'
          }`}
        >
          <div className="px-4 py-3 glass-heavy flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-3 text-sm tracking-wider transition-all duration-200 border-l-2 ${
                    isActive
                      ? 'text-gold border-gold bg-gold/5'
                      : 'text-text-secondary hover:text-text-primary border-transparent hover:border-gold/30 hover:bg-gold/5'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Edit Profile Modal */}
      {showEditProfile && myProfile && (
        <EditModal
          profile={myProfile}
          onClose={() => setShowEditProfile(false)}
          onSave={handleSaveProfile}
        />
      )}
    </>
  );
}
