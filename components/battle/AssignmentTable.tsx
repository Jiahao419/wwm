'use client';

import { useState } from 'react';
import { BattleAssignment } from '@/lib/types';
import { TEAM_COLORS, BATTLE_ROLES_BAIYE, MAP_ZONES } from '@/lib/constants';

interface AssignmentTableProps {
  assignments: (BattleAssignment & { profile?: any; signup?: any })[];
  isAdmin: boolean;
  onAssignmentChange: (id: string, field: string, value: any) => void;
}

export default function AssignmentTable({ assignments, isAdmin, onAssignmentChange }: AssignmentTableProps) {
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});

  const teams: Record<number, typeof assignments> = {};
  assignments.forEach(a => {
    const t = a.team_number || 0;
    if (!teams[t]) teams[t] = [];
    teams[t].push(a);
  });

  const teamNums = Object.keys(teams).map(Number).sort((a, b) => a - b);

  const toggleTeam = (num: number) => {
    setCollapsed(prev => ({ ...prev, [num]: !prev[num] }));
  };

  return (
    <div className="space-y-4">
      {teamNums.map(num => {
        const teamAssignments = teams[num];
        const isCollapsed = collapsed[num];
        const color = num > 0 ? TEAM_COLORS[num] : '#9a8a6a';
        const label = num === 0 ? '未分配'
          : `${num}队 (${num <= 3 ? '进攻' : '防守'})`;

        return (
          <div key={num} className="bg-bg-card gold-border rounded-sm overflow-hidden">
            {/* Team header */}
            <button
              onClick={() => toggleTeam(num)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-bg-panel/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-text-primary text-sm font-title">{label}</span>
                <span className="text-text-secondary text-xs">{teamAssignments.length}人</span>
              </div>
              <svg
                className={`w-4 h-4 text-text-secondary transition-transform ${isCollapsed ? '' : 'rotate-180'}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Team members table */}
            {!isCollapsed && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-t border-gold/10 text-text-secondary text-xs">
                    <th className="px-4 py-2 text-left font-normal w-[140px]">成员</th>
                    <th className="px-4 py-2 text-left font-normal">偏好(参考)</th>
                    {isAdmin && (
                      <th className="px-4 py-2 text-left font-normal">队伍</th>
                    )}
                    <th className="px-4 py-2 text-left font-normal">分配职责</th>
                    <th className="px-4 py-2 text-left font-normal">地图位置</th>
                    <th className="px-4 py-2 text-left font-normal w-[60px]">替补</th>
                    <th className="px-4 py-2 text-left font-normal">备注</th>
                  </tr>
                </thead>
                <tbody>
                  {teamAssignments.map(a => {
                    const rowColor = a.team_number && a.team_number > 0
                      ? TEAM_COLORS[a.team_number] || '#9a8a6a'
                      : '#9a8a6a';

                    return (
                      <tr key={a.id} className="border-t border-gold/5 hover:bg-bg-panel/30 transition-colors">
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                              style={{ backgroundColor: `${rowColor}20`, color: rowColor, border: `1px solid ${rowColor}40` }}
                            >
                              {a.profile?.nickname?.charAt(0)}
                            </span>
                            <span className="text-text-primary">{a.profile?.nickname}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-text-secondary/50 text-xs">
                          {a.signup?.preferred_route && <span>{a.signup.preferred_route} · </span>}
                          {a.signup?.preferred_roles?.join(', ')}
                        </td>

                        {/* Team number dropdown - admin only column */}
                        {isAdmin && (
                          <td className="px-4 py-2.5">
                            <select
                              value={a.team_number ?? ''}
                              onChange={e => {
                                const val = e.target.value === '' ? null : Number(e.target.value);
                                onAssignmentChange(a.id, 'team_number', val);
                              }}
                              className="bg-bg-panel border border-gold/10 text-text-primary text-xs px-2 py-1 focus:border-gold/30 focus:outline-none"
                            >
                              <option value="">未分配</option>
                              {[1, 2, 3, 4, 5, 6].map(n => (
                                <option key={n} value={n}>
                                  {n}队 ({n <= 3 ? '攻' : '守'})
                                </option>
                              ))}
                            </select>
                          </td>
                        )}

                        {/* Assigned role */}
                        <td className="px-4 py-2.5">
                          {isAdmin ? (
                            <select
                              value={a.assigned_role || ''}
                              onChange={e => onAssignmentChange(a.id, 'assigned_role', e.target.value || null)}
                              className="bg-bg-panel border border-gold/10 text-text-primary text-xs px-2 py-1 focus:border-gold/30 focus:outline-none"
                            >
                              <option value="">未分配</option>
                              {BATTLE_ROLES_BAIYE.map(r => (
                                <option key={r} value={r}>{r}</option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-text-primary text-xs">
                              {a.assigned_role || <span className="text-text-secondary/40">未分配</span>}
                            </span>
                          )}
                        </td>

                        {/* Map zone */}
                        <td className="px-4 py-2.5">
                          {isAdmin ? (
                            <select
                              value={a.map_zone || ''}
                              onChange={e => onAssignmentChange(a.id, 'map_zone', e.target.value || null)}
                              className="bg-bg-panel border border-gold/10 text-text-primary text-xs px-2 py-1 focus:border-gold/30 focus:outline-none"
                            >
                              <option value="">未指定</option>
                              {MAP_ZONES.map(z => (
                                <option key={z.id} value={z.id}>{z.name}</option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-text-primary text-xs">
                              {a.map_zone
                                ? MAP_ZONES.find(z => z.id === a.map_zone)?.name || a.map_zone
                                : <span className="text-text-secondary/40">未指定</span>}
                            </span>
                          )}
                        </td>

                        {/* Substitute checkbox */}
                        <td className="px-4 py-2.5 text-center">
                          {isAdmin ? (
                            <input
                              type="checkbox"
                              checked={a.is_substitute}
                              onChange={e => onAssignmentChange(a.id, 'is_substitute', e.target.checked)}
                              className="accent-gold"
                            />
                          ) : (
                            <span className="text-text-secondary text-xs">
                              {a.is_substitute ? '是' : '-'}
                            </span>
                          )}
                        </td>

                        {/* Admin note */}
                        <td className="px-4 py-2.5">
                          {isAdmin ? (
                            <input
                              value={a.admin_note || ''}
                              onChange={e => onAssignmentChange(a.id, 'admin_note', e.target.value || null)}
                              placeholder="备注"
                              className="bg-transparent border-b border-gold/10 text-text-primary text-xs px-1 py-0.5 focus:border-gold/30 focus:outline-none w-full"
                            />
                          ) : (
                            <span className="text-text-secondary text-xs">
                              {a.admin_note || '-'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        );
      })}
    </div>
  );
}
