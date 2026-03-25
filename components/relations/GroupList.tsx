'use client';

import { Profile } from '@/lib/types';

interface Group {
  name: string;
  members: Profile[];
}

interface GroupListProps {
  groups: Group[];
}

export default function GroupList({ groups }: GroupListProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {groups.map(group => (
        <div key={group.name} className="p-5 bg-bg-card gold-border rounded-sm">
          <h4 className="font-title text-gold/80 text-sm mb-3">{group.name}</h4>
          <div className="flex flex-wrap gap-2">
            {group.members.map(m => (
              <div key={m.id} className="flex items-center gap-1.5 px-2 py-1 bg-bg-panel rounded-sm">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
                  style={{ backgroundColor: `${m.node_color}20`, color: m.node_color, border: `1px solid ${m.node_color}40` }}
                >
                  {m.nickname.charAt(0)}
                </span>
                <span className="text-text-primary text-xs">{m.nickname}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
