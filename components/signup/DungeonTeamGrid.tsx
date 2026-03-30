'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/components/providers/AuthProvider';
import { getAssignments, upsertAssignment, deleteAssignment, updateBattleEvent, getProfiles } from '@/lib/db';
import { TEAM_COLORS } from '@/lib/constants';
import type { BattleEvent, BattleAssignment, Profile, DungeonTeamConfig } from '@/lib/types';
import GoldButton from '@/components/ui/GoldButton';

type AssignmentWithProfile = BattleAssignment & { profile?: Profile | null };

// Slot definitions: index → role label
const SLOT_DEFS = [
  { index: 0, role: '指挥', label: '指挥' },
  { index: 1, role: '队员', label: '队员' },
  { index: 2, role: '队员', label: '队员' },
  { index: 3, role: '队员', label: '队员' },
  { index: 4, role: '队员', label: '队员' },
  { index: 5, role: '队员', label: '队员' },
  { index: 6, role: '队员', label: '队员' },
  { index: 7, role: '队员', label: '队员' },
  { index: 8, role: '奶/队员', label: '奶/队员' },
  { index: 9, role: '奶/队员', label: '奶/队员' },
];

const DEFAULT_CONFIG: DungeonTeamConfig = {
  teams: Array.from({ length: 10 }, (_, i) => ({
    number: i + 1,
    time: '',
    target: '双十',
  })),
};

function parseConfig(tactic_notes: string | null): DungeonTeamConfig {
  if (!tactic_notes) return DEFAULT_CONFIG;
  try {
    const parsed = JSON.parse(tactic_notes);
    if (parsed?.teams?.length) {
      // If saved config has fewer teams than default, extend it
      const existing = parsed.teams;
      if (existing.length < DEFAULT_CONFIG.teams.length) {
        for (let i = existing.length; i < DEFAULT_CONFIG.teams.length; i++) {
          existing.push({ number: i + 1, time: '', target: '双十' });
        }
      }
      return { ...parsed, teams: existing };
    }
  } catch { /* not JSON, ignore */ }
  return DEFAULT_CONFIG;
}

interface Props {
  event: BattleEvent;
  onRefresh?: () => void;
}

export default function DungeonTeamGrid({ event, onRefresh }: Props) {
  const { isAdminOrOwner, user, profile: currentProfile } = useAuth();
  const [config, setConfig] = useState<DungeonTeamConfig>(parseConfig(event.tactic_notes));
  const [assignments, setAssignments] = useState<AssignmentWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [editingMeta, setEditingMeta] = useState(false);
  const [metaDraft, setMetaDraft] = useState<DungeonTeamConfig>(config);
  const [savingSlot, setSavingSlot] = useState<string | null>(null); // "team-slot"
  // Admin pick member
  const [pickingSlot, setPickingSlot] = useState<{ team: number; slot: number } | null>(null);
  const [searchText, setSearchText] = useState('');

  const fetchAssignments = useCallback(async () => {
    const { data } = await getAssignments(event.id);
    if (data) setAssignments(data as AssignmentWithProfile[]);
    setLoading(false);
  }, [event.id]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  useEffect(() => {
    setConfig(parseConfig(event.tactic_notes));
  }, [event.tactic_notes]);

  // Get assignment for a specific team+slot
  const getSlotAssignment = (teamNum: number, slotIdx: number) => {
    return assignments.find(
      a => a.team_number === teamNum && a.admin_note === `slot_${slotIdx}`
    );
  };

  // Find all slots the current user occupies
  const myAssignments = assignments.filter(a => {
    if (!user) return false;
    return a.user_id === user.id ||
      a.user_id === currentProfile?.id ||
      a.user_id === currentProfile?.user_id ||
      a.profile?.user_id === user.id;
  });

  // User clicks empty slot to sign up
  const handleSignup = async (teamNum: number, slotIdx: number) => {
    if (!user || !currentProfile) return;
    // 检查该用户是否已在这个队伍中报名
    const alreadyInTeam = assignments.some(
      a => a.team_number === teamNum && (
        a.user_id === currentProfile.id ||
        a.user_id === currentProfile.user_id ||
        a.user_id === user.id
      )
    );
    if (alreadyInTeam) {
      alert('你已经在这个队伍中报名了！');
      return;
    }
    if (!confirm(`确定报名 ${teamNum}车？`)) return;
    setSavingSlot(`${teamNum}-${slotIdx}`);
    const slotDef = SLOT_DEFS[slotIdx];
    try {
      const { error } = await upsertAssignment({
        id: '',
        event_id: event.id,
        user_id: currentProfile.id,
        team_number: teamNum,
        assigned_role: slotDef.role,
        map_zone: null,
        map_x: null,
        map_y: null,
        is_substitute: false,
        admin_note: `slot_${slotIdx}`,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      });
      if (error) {
        console.error('Signup error:', error);
        alert(`报名失败：${error.message}`);
      }
      await fetchAssignments();
    } catch (err) {
      console.error('Signup exception:', err);
      alert('报名失败，请重试');
    }
    setSavingSlot(null);
  };

  // User withdraws from their slot
  const handleWithdraw = async (assignmentId: string) => {
    if (!confirm('确定退出该位置？')) return;
    try {
      const { error } = await deleteAssignment(assignmentId);
      if (error) {
        console.error('Withdraw error:', error);
        alert(`退出失败：${error.message}`);
        return;
      }
    } catch (err) {
      console.error('Withdraw exception:', err);
      alert('退出失败，请重试');
      return;
    }
    await fetchAssignments();
  };

  // Admin: assign a profile to a slot
  const handleAdminAssign = async (profile: Profile, teamNum: number, slotIdx: number) => {
    // 检查是否已在这个队伍中
    const alreadyInTeam = assignments.some(
      a => a.team_number === teamNum && (a.user_id === profile.id || a.user_id === profile.user_id)
    );
    if (alreadyInTeam) {
      alert(`「${profile.nickname}」已经在 ${teamNum}车 中了！`);
      return;
    }
    if (!confirm(`确定将「${profile.nickname}」分配到 ${teamNum}车？`)) return;
    const slotDef = SLOT_DEFS[slotIdx];
    await upsertAssignment({
      id: '',
      event_id: event.id,
      user_id: profile.id,
      team_number: teamNum,
      assigned_role: slotDef.role,
      map_zone: null,
      map_x: null,
      map_y: null,
      is_substitute: false,
      admin_note: `slot_${slotIdx}`,
      updated_by: user?.id || null,
      updated_at: new Date().toISOString(),
    });
    setPickingSlot(null);
    setSearchText('');
    await fetchAssignments();
  };

  // Admin: clear a slot
  const handleClearSlot = async (assignmentId: string) => {
    if (!confirm('确定清除该位置的成员？')) return;
    await deleteAssignment(assignmentId);
    await fetchAssignments();
  };

  // Admin: open member picker
  const openPicker = async (team: number, slot: number) => {
    setPickingSlot({ team, slot });
    setSearchText('');
    if (profiles.length === 0) {
      const { data } = await getProfiles();
      if (data) setProfiles(data);
    }
  };

  // Save team metadata (times, targets)
  const handleSaveMeta = async () => {
    const json = JSON.stringify(metaDraft);
    try {
      const { error } = await updateBattleEvent(event.id, { tactic_notes: json });
      if (error) {
        console.error('Save meta error:', error);
        alert(`保存失败：${error.message}`);
        return;
      }
      setConfig(metaDraft);
      setEditingMeta(false);
      onRefresh?.();
    } catch (err) {
      console.error('Save meta exception:', err);
      alert('保存失败，请重试');
    }
  };

  const filteredProfiles = profiles.filter(p => {
    if (!searchText) return true;
    return p.nickname.toLowerCase().includes(searchText.toLowerCase());
  });

  if (loading) {
    return <div className="text-center py-12 text-text-secondary/50">加载排班表...</div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 gap-2">
        <h3 className="font-title text-base md:text-lg text-text-primary">排班时间表</h3>
        {user && (
          <div className="flex gap-2">
            {!editingMeta ? (
              <GoldButton variant="ghost" size="sm" onClick={() => { setMetaDraft({ ...config }); setEditingMeta(true); }}>
                编辑时间
              </GoldButton>
            ) : (
              <>
                <GoldButton variant="primary" size="sm" onClick={handleSaveMeta}>保存</GoldButton>
                <GoldButton variant="ghost" size="sm" onClick={() => setEditingMeta(false)}>取消</GoldButton>
              </>
            )}
            {isAdminOrOwner && assignments.length > 0 && (
              <button
                onClick={async () => {
                  if (!confirm(`确定要清空所有 ${assignments.length} 个报名吗？此操作不可撤销！`)) return;
                  for (const a of assignments) {
                    await deleteAssignment(a.id);
                  }
                  setAssignments([]);
                  onRefresh?.();
                }}
                className="text-xs text-red-400/60 hover:text-red-400 transition-colors border border-red-400/20 hover:border-red-400/40 px-2 py-1 rounded"
              >
                清空报名
              </button>
            )}
          </div>
        )}
      </div>

      {/* Hint */}
      {user && (
        <p className={`text-xs mb-4 ${myAssignments.length > 0 ? 'text-gold/80' : 'text-text-secondary/60'}`}>
          {myAssignments.length > 0
            ? `✦ 你已报名 ${myAssignments.map(a => `${a.team_number}车`).join('、')} · 点击你的名字可退出`
            : '点击空位即可报名'}
        </p>
      )}

      {/* Grid table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs md:text-sm border-collapse min-w-[600px]">
          <thead>
            <tr>
              <th className="py-2 px-3 text-left text-text-secondary/50 text-xs font-normal w-20 border-b border-gold/10"></th>
              {config.teams.map(team => (
                <th
                  key={team.number}
                  className="py-2 px-3 text-center font-title text-sm border-b border-gold/10 min-w-[120px]"
                  style={{ color: TEAM_COLORS[team.number] || '#c9a84c' }}
                >
                  {team.number}车
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Target row */}
            <tr className="border-b border-gold/5">
              <td className="py-2 px-3 text-text-secondary/50 text-xs">目标</td>
              {config.teams.map((team, ti) => (
                <td key={team.number} className="py-2 px-3 text-center">
                  {editingMeta ? (
                    <input
                      type="text"
                      value={metaDraft.teams[ti]?.target || ''}
                      onChange={e => {
                        const t = [...metaDraft.teams];
                        t[ti] = { ...t[ti], target: e.target.value };
                        setMetaDraft({ teams: t });
                      }}
                      className="w-full bg-bg-card border border-gold/20 px-2 py-1 text-text-primary text-xs text-center rounded-sm focus:border-gold/40 focus:outline-none"
                    />
                  ) : (
                    <span className="text-text-secondary text-xs">{team.target || '-'}</span>
                  )}
                </td>
              ))}
            </tr>

            {/* Time row */}
            <tr className="border-b border-gold/10">
              <td className="py-2 px-3 text-text-secondary/50 text-xs">时间</td>
              {config.teams.map((team, ti) => (
                <td key={team.number} className="py-2 px-3 text-center">
                  {editingMeta ? (
                    <input
                      type="text"
                      value={metaDraft.teams[ti]?.time || ''}
                      onChange={e => {
                        const t = [...metaDraft.teams];
                        t[ti] = { ...t[ti], time: e.target.value };
                        setMetaDraft({ teams: t });
                      }}
                      placeholder="如: 3/30 22:30"
                      className="w-full bg-bg-card border border-gold/20 px-2 py-1 text-text-primary text-xs text-center rounded-sm focus:border-gold/40 focus:outline-none"
                    />
                  ) : (
                    <span className={`text-xs font-title ${team.time ? 'text-gold' : 'text-text-secondary/30'}`}>
                      {team.time || '待定'}
                    </span>
                  )}
                </td>
              ))}
            </tr>

            {/* Slot rows */}
            {SLOT_DEFS.map(slotDef => (
              <tr key={slotDef.index} className={`border-b border-gold/5 ${slotDef.role === '指挥' ? 'bg-gold/[0.03]' : ''}`}>
                <td className="py-2 px-3 text-xs whitespace-nowrap" style={{
                  color: slotDef.role === '指挥' ? '#c9a84c' : slotDef.role === '奶/队员' ? '#55b0e0' : 'rgba(255,255,255,0.35)',
                }}>
                  {slotDef.label}
                </td>
                {config.teams.map(team => {
                  const assignment = getSlotAssignment(team.number, slotDef.index);
                  const isMine = assignment && user && (
                    assignment.user_id === user.id ||
                    assignment.user_id === currentProfile?.id ||
                    assignment.user_id === currentProfile?.user_id ||
                    assignment.profile?.user_id === user.id
                  );
                  const isSaving = savingSlot === `${team.number}-${slotDef.index}`;
                  const displayName = assignment?.profile?.nickname || (assignment ? '已占位' : null);

                  return (
                    <td key={team.number} className="py-1.5 px-2 text-center">
                      {assignment ? (
                        // Filled slot
                        <div className="group relative">
                          <button
                            onClick={() => {
                              if (isMine) handleWithdraw(assignment.id);
                              else if (isAdminOrOwner) handleClearSlot(assignment.id);
                            }}
                            disabled={!isMine && !isAdminOrOwner}
                            className={`px-2 py-1 text-xs rounded-sm transition-all w-full truncate ${
                              isMine
                                ? 'bg-gold/15 text-gold border border-gold/30 hover:bg-red-900/20 hover:text-red-300 hover:border-red-400/30'
                                : 'bg-bg-card/80 text-text-primary border border-transparent hover:border-red-400/20'
                            } ${!isMine && !isAdminOrOwner ? 'cursor-default' : 'cursor-pointer'}`}
                            title={isMine ? '点击退出' : isAdminOrOwner ? '点击清除' : displayName || ''}
                          >
                            {displayName}
                          </button>
                        </div>
                      ) : (
                        // Empty slot
                        <button
                          onClick={() => {
                            if (!user) { alert('请先登录'); return; }
                            if (!currentProfile) { alert('登录信息加载中，请稍后再试'); return; }
                            if (isAdminOrOwner) openPicker(team.number, slotDef.index);
                            else handleSignup(team.number, slotDef.index);
                          }}
                          disabled={isSaving}
                          className="w-full px-2 py-1 text-xs rounded-sm border border-dashed border-gold/10 text-text-secondary/20 hover:border-gold/30 hover:text-gold/40 hover:bg-gold/[0.03] transition-all disabled:cursor-not-allowed"
                          style={{ borderColor: isSaving ? TEAM_COLORS[team.number] : undefined }}
                        >
                          {isSaving ? '...' : '空位'}
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* Summary row */}
            <tr>
              <td className="py-2 px-3 text-text-secondary/30 text-xs">人数</td>
              {config.teams.map(team => {
                const teamAssignments = assignments.filter(a => a.team_number === team.number);
                const count = teamAssignments.length;
                const maxSlots = SLOT_DEFS.length;
                return (
                  <td key={team.number} className="py-2 px-3 text-center">
                    <span className={`text-xs ${count >= maxSlots ? 'text-green-400' : count > 0 ? 'text-gold/60' : 'text-text-secondary/20'}`}>
                      {count}/{maxSlots}
                    </span>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Admin member picker modal */}
      {pickingSlot && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setPickingSlot(null)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-10 bg-bg-panel border border-gold/20 rounded-sm w-full max-w-[400px] max-h-[60vh] flex flex-col"
          >
            <div className="p-4 border-b border-gold/10">
              <h4 className="font-title text-sm text-gold mb-2">
                选择成员 — {pickingSlot.team}车 {SLOT_DEFS[pickingSlot.slot].label}
              </h4>
              <input
                type="text"
                placeholder="搜索昵称..."
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                className="w-full bg-bg-card border border-gold/20 rounded px-3 py-1.5 text-text-primary text-sm focus:border-gold/40 outline-none"
                autoFocus
              />
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {filteredProfiles.map(p => {
                const alreadyInSlots = assignments.filter(a => a.user_id === p.id || a.user_id === p.user_id);
                return (
                  <button
                    key={p.id}
                    onClick={() => handleAdminAssign(p, pickingSlot.team, pickingSlot.slot)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-bg-card/50 transition-colors text-left"
                  >
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-bg-card border border-gold/10 flex-shrink-0 flex items-center justify-center">
                      {p.avatar_url ? (
                        <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-gold/40 text-[10px]">{p.nickname.charAt(0)}</span>
                      )}
                    </div>
                    <span className="text-text-primary text-sm flex-1 truncate">{p.nickname}</span>
                    {alreadyInSlots.length > 0 && (
                      <span className="text-text-secondary/40 text-[10px] flex-shrink-0">
                        {alreadyInSlots.map(a => `${a.team_number}车`).join('、')}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="p-3 border-t border-gold/10 flex justify-end">
              <GoldButton variant="ghost" size="sm" onClick={() => setPickingSlot(null)}>取消</GoldButton>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
