'use client';

import { BattleSignup, Profile } from '@/lib/types';

interface SignupListProps {
  signups: (BattleSignup & { profile: Profile })[];
  maxParticipants: number;
}

export default function SignupList({ signups, maxParticipants }: SignupListProps) {
  return (
    <div className="p-6 bg-bg-card gold-border rounded-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-title text-lg text-text-primary">已报名名单</h3>
        <span className="text-sm">
          <span className="text-gold font-mono">{signups.length}</span>
          <span className="text-text-secondary"> / {maxParticipants}</span>
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-bg-panel rounded-full mb-5 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-gold-dark to-gold rounded-full transition-all duration-500"
          style={{ width: `${Math.min((signups.length / maxParticipants) * 100, 100)}%` }}
        />
      </div>

      <div className="space-y-3">
        {signups.map((signup, i) => (
          <div key={signup.id} className="flex items-center gap-3 py-2 border-b border-gold/5 last:border-0">
            <span className="w-6 text-text-secondary/30 text-xs text-right font-mono">{i + 1}</span>
            <div className="w-8 h-8 rounded-full border border-gold/20 flex items-center justify-center bg-bg-panel">
              <span className="text-xs text-gold/60">{signup.nickname_snapshot.charAt(0)}</span>
            </div>
            <span className="text-text-primary text-sm">{signup.nickname_snapshot}</span>
            {signup.preferred_roles.length > 0 && (
              <div className="flex gap-1 ml-auto">
                {signup.preferred_roles.map(r => (
                  <span key={r} className="text-xs px-1.5 py-0.5 bg-bg-panel text-text-secondary rounded">
                    {r}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
