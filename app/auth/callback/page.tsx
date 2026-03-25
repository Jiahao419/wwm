'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function AuthCallbackPage() {
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const supabase = createClient();
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then((result: { error: Error | null }) => {
        if (result.error) {
          console.error('Auth exchange error:', result.error);
        }
        // Use window.location for a full page reload to ensure session is picked up
        window.location.href = '/';
      });
    } else {
      window.location.href = '/?error=auth';
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto mb-4" />
        <p className="text-text-secondary text-sm">正在登录...</p>
      </div>
    </div>
  );
}
