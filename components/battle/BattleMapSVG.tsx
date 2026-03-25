'use client';

import { useRef } from 'react';
import { BattleAssignment } from '@/lib/types';
import { TEAM_COLORS } from '@/lib/constants';
import MemberMarker from './MemberMarker';

interface BattleMapSVGProps {
  assignments: (BattleAssignment & { profile?: any })[];
  isAdmin?: boolean;
  onPositionChange?: (id: string, x: number, y: number) => void;
}

export default function BattleMapSVG({ assignments, isAdmin = false, onPositionChange }: BattleMapSVGProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const handleDragEnd = (id: string, clientX: number, clientY: number) => {
    if (!mapContainerRef.current || !onPositionChange) return;
    const rect = mapContainerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
    onPositionChange(id, Math.round(x * 100) / 100, Math.round(y * 100) / 100);
  };

  return (
    <div className="relative w-full bg-bg-secondary overflow-hidden">
      {/* SVG Map background - landscape 4:3 */}
      <div className="relative" style={{ aspectRatio: '4 / 3' }} ref={mapContainerRef}>
        <img
          src="/map/battle-map.svg"
          alt="百业战地图"
          className="w-full h-full object-contain"
          draggable={false}
        />

        {/* Member markers overlay */}
        <div className="absolute inset-0">
          {assignments.map(assignment => {
            if (assignment.map_x == null || assignment.map_y == null) return null;
            const teamColor = assignment.team_number
              ? TEAM_COLORS[assignment.team_number] || '#9a8a6a'
              : '#9a8a6a';

            return (
              <MemberMarker
                key={assignment.id}
                id={assignment.id}
                nickname={assignment.profile?.nickname || '?'}
                avatarChar={assignment.profile?.nickname?.charAt(0) || '?'}
                teamNumber={assignment.team_number}
                role={assignment.assigned_role}
                color={teamColor}
                isSubstitute={assignment.is_substitute}
                x={assignment.map_x!}
                y={assignment.map_y!}
                draggable={isAdmin}
                onDragEnd={handleDragEnd}
              />
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="p-4 border-t border-gold/10">
        {/* Team colors */}
        <div className="flex flex-wrap gap-4 mb-2">
          {[1, 2, 3, 4, 5, 6].map(num => (
            <div key={num} className="flex items-center gap-1.5 text-xs">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: TEAM_COLORS[num] }}
              />
              <span className="text-text-secondary">
                {num}队 ({num <= 3 ? '进攻' : '防守'})
              </span>
            </div>
          ))}
        </div>
        {/* Base info */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#c05050', opacity: 0.6 }} />
            <span className="text-text-secondary">红方基地（左）</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#5080c0', opacity: 0.6 }} />
            <span className="text-text-secondary">蓝方基地（右）</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="w-3 h-3 rounded-sm border" style={{ borderColor: '#c9a84c', opacity: 0.5 }} />
            <span className="text-text-secondary">防御塔</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="w-3 h-3 rounded-sm border border-dashed" style={{ borderColor: '#c9a84c', opacity: 0.4 }} />
            <span className="text-text-secondary">野区</span>
          </div>
        </div>
      </div>
    </div>
  );
}
