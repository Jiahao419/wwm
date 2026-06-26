'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// Supported languages: code must match Google Translate language codes
const LANGUAGES: { code: string; label: string; native: string }[] = [
  { code: 'zh-CN', label: '中文', native: '简体中文' },
  { code: 'en', label: 'EN', native: 'English' },
  { code: 'ja', label: '日本語', native: '日本語' },
  { code: 'ko', label: '한국어', native: '한국어' },
];

const PAGE_LANG = 'zh-CN';

declare global {
  interface Window {
    google?: {
      translate?: {
        TranslateElement: new (
          options: Record<string, unknown>,
          element: string
        ) => void;
      };
    };
    googleTranslateElementInit?: () => void;
  }
}

// Read the googtrans cookie to know the current language
function getCurrentLangFromCookie(): string {
  if (typeof document === 'undefined') return PAGE_LANG;
  const match = document.cookie.match(/googtrans=([^;]+)/);
  if (match) {
    const parts = decodeURIComponent(match[1]).split('/');
    if (parts[2]) return parts[2];
  }
  return PAGE_LANG;
}

function setLangCookie(lang: string) {
  const value = lang === PAGE_LANG ? '' : `/${PAGE_LANG}/${lang}`;
  // Set on current domain and parent domain so it persists across the site
  const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `googtrans=${value};expires=${expires};path=/`;
  const host = window.location.hostname;
  if (host.includes('.')) {
    const root = '.' + host.split('.').slice(-2).join('.');
    document.cookie = `googtrans=${value};expires=${expires};path=/;domain=${root}`;
  }
}

export default function GoogleTranslate() {
  const [open, setOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState(PAGE_LANG);
  const ref = useRef<HTMLDivElement>(null);

  // Inject Google Translate script once
  useEffect(() => {
    setCurrentLang(getCurrentLangFromCookie());

    if (document.getElementById('google-translate-script')) return;

    window.googleTranslateElementInit = () => {
      if (window.google?.translate?.TranslateElement) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: PAGE_LANG,
            includedLanguages: LANGUAGES.map(l => l.code).join(','),
            autoDisplay: false,
          },
          'google_translate_element'
        );
      }
    };

    const script = document.createElement('script');
    script.id = 'google-translate-script';
    script.src =
      'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const switchLanguage = useCallback((lang: string) => {
    setLangCookie(lang);
    setCurrentLang(lang);
    setOpen(false);
    // Reload so Google Translate applies cleanly (avoids React DOM conflicts)
    window.location.reload();
  }, []);

  const current = LANGUAGES.find(l => l.code === currentLang) || LANGUAGES[0];

  return (
    <div className="relative" ref={ref}>
      {/* Hidden element required by Google Translate */}
      <div id="google_translate_element" className="hidden" />

      {/* Custom styled trigger button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 border border-gold/20 hover:border-gold/40 transition-all duration-200 text-text-secondary hover:text-gold text-xs md:text-sm notranslate"
        title="切换语言 / Language"
      >
        {/* Globe icon */}
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.5 3.5 6 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-6-3.5-9s1-6.5 3.5-9z" />
        </svg>
        <span className="hidden sm:inline">{current.label}</span>
        <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 4.5L6 7.5L9 4.5" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-36 py-1 glass-heavy border border-gold/20 shadow-lg shadow-black/30 z-50 notranslate">
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              onClick={() => switchLanguage(lang.code)}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                lang.code === currentLang
                  ? 'text-gold bg-gold/5'
                  : 'text-text-secondary hover:text-gold hover:bg-gold/5'
              }`}
            >
              {lang.native}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
