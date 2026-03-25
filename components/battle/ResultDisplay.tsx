'use client';

import { BattleAssignment } from '@/lib/types';
import { TEAM_COLORS } from '@/lib/constants';

interface ResultDisplayProps {
  assignments: (BattleAssignment & { profile?: any })[];
}

export default function ResultDisplay({ assignments }: ResultDisplayProps) {
  const teams: Record<number, typeof assignments> = {};
  const substitutes: typeof assignments = [];

  assignments.forEach(a => {
    if (a.is_substitute) {
      substitutes.push(a);
    } else if (a.team_number) {
      if (!teams[a.team_number]) teams[a.team_number] = [];
      teams[a.team_number].push(a);
    }
  });

  return (
    <div className="space-y-8">
      {/* Attack teams */}
      <div>
        <h3 className="font-title text-lg text-cinnabar-light mb-4 flex items-center gap-2">
          <span className="w-6 h-0.5 bg-cinnabar-light" />
          进攻组
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(num => (
            <TeamCard key={num} teamNumber={num} members={teams[num] || []} />
          ))}
        </div>
      </div>

      {/* Defense teams */}
      <div>
        <h3 className="font-title text-lg text-team-4 mb-4 flex items-center gap-2">
          <span className="w-6 h-0.5 bg-team-4" />
          防守组
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {[4, 5, 6].map(num => (
            <TeamCard key={num} teamNumber={num} members={teams[num] || []} />
          ))}
        </div>
      </div>

      {/* Substitutes */}
      {substitutes.length > 0 && (
        <div>
          <h3 className="font-title text-lg text-text-secondary mb-4">替补名单</h3>
          <div className="flex gap-3">
            {substitutes.map(s => (
              <div key={s.id} className="flex items-center gap-2 px-3 py-2 bg-bg-card border border-dashed border-gold/10 rounded-sm">
                <span className="w-6 h-6 rounded-full border border-dashed border-text-secondary/30 flex items-center justify-center text-[10px] text-text-secondary">
                  {s.profile?.nickname?.charAt(0)}
                </span>
                <span className="text-text-secondary text-sm">{s.profile?.nickname}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TeamCard({
  teamNumber,
  members,
}: {
  teamNumber: number;
  members: (BattleAssignment & { profile?: any })[];
}) {
  const color = TEAM_COLORS[teamNumber];

  return (
    <div className="p-4 bg-bg-card rounded-sm" style={{ borderLeft: `3px solid ${color}` }}>
      <h4 className="text-sm font-title mb-3" style={{ color }}>
        {teamNumber}队
      </h4>
      <div className="space-y-2">
        {members.map(m => (
          <div key={m.id} className="flex items-center gap-2">
            <span
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
              style={{ backgroundColor: `${color}20`, color, border: `1px solid ${color}40` }}
            >
              {m.profile?.nickname?.charAt(0)}
            </span>
            <span className="text-text-primary text-sm">{m.profile?.nickname}</span>
            {m.assigned_role && (
              <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: `${color}15`, color }}>
                {m.assigned_role}
              </span>
            )}
          </div>
        ))}
        {members.length === 0 && (
          <p className="text-text-secondary/30 text-xs">暂无成员</p>
        )}
      </div>
    </div>
  );
}
