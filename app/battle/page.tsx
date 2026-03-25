'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import PageHeader from '@/components/ui/PageHeader';
import EventOverview from '@/components/battle/EventOverview';
import BattleMapSVG from '@/components/battle/BattleMapSVG';
import AssignmentTable from '@/components/battle/AssignmentTable';
import ResultDisplay from '@/components/battle/ResultDisplay';
import GoldButton from '@/components/ui/GoldButton';
import { useAuth } from '@/components/providers/AuthProvider';
import {
  getBattleEvents, getAssignments, updateBattleEvent,
  upsertAssignment, deleteAssignment, getProfiles, getSignups,
} from '@/lib/db';
import { mockBattleEvent, mockAssignments } from '@/lib/mockData';
import type { BattleEvent, BattleAssignment, Profile } from '@/lib/types';
import ReactMarkdown from 'react-markdown';

type AssignmentWithProfile = BattleAssignment & { profile?: any; signup?: any };

function stripJoined(a: AssignmentWithProfile): Omit<BattleAssignment, 'profile' | 'signup'> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { profile: _p, signup: _s, ...data } = a;
  return data;
}

export default function BattlePage() {
  const { isAdminOrOwner, user } = useAuth();
  const [event, setEvent] = useState<BattleEvent | null>(null);
  const [assignments, setAssignments] = useState<AssignmentWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingMock, setUsingMock] = useState(false);

  // Tactic editing state
  const [editingTactics, setEditingTactics] = useState(false);
  const [tacticDraft, setTacticDraft] = useState('');
  const [savingTactics, setSavingTactics] = useState(false);

  // Map zoom state
  const [zoom, setZoom] = useState(1);
  const zoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const zoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));

  // Add member modal
  const [showAddMember, setShowAddMember] = useState(false);
  const [rosterProfiles, setRosterProfiles] = useState<Profile[]>([]);
  const [memberSearch, setMemberSearch] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const { data: events, error: evtErr } = await getBattleEvents();
      if (evtErr || !events || events.length === 0) {
        setEvent(mockBattleEvent);
        setAssignments(mockAssignments);
        setUsingMock(true);
        setLoading(false);
        return;
      }

      const activeEvent = events.find(e => e.status === 'active') || events[0];
      setEvent(activeEvent);

      const { data: assigns, error: assignErr } = await getAssignments(activeEvent.id);
      if (assignErr || !assigns || assigns.length === 0) {
        if (activeEvent.id === mockBattleEvent.id) {
          setAssignments(mockAssignments);
          setUsingMock(true);
        } else {
          setAssignments([]);
        }
      } else {
        setAssignments(assigns as AssignmentWithProfile[]);
        setUsingMock(false);
      }
    } catch {
      setEvent(mockBattleEvent);
      setAssignments(mockAssignments);
      setUsingMock(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Save all assignment changes
  const handleSaveAll = async () => {
    if (usingMock || !event) return;
    for (const a of assignments) {
      await upsertAssignment(stripJoined(a));
    }
    await fetchData();
  };

  // Reset all assignments
  const handleResetAll = async () => {
    const resetted = assignments.map(a => ({
      ...a,
      team_number: null,
      assigned_role: null,
      map_zone: null,
      map_x: null,
      map_y: null,
    }));
    setAssignments(resetted);

    if (!usingMock && event) {
      for (const a of resetted) {
        await upsertAssignment(stripJoined(a));
      }
    }
  };

  // Default map positions by team number (spread out across the map)
  const getDefaultPosition = (teamNum: number | null, index: number) => {
    const positions: Record<number, { x: number; y: number }> = {
      1: { x: 38, y: 25 },  // 上路进攻
      2: { x: 42, y: 50 },  // 中路进攻
      3: { x: 38, y: 75 },  // 下路进攻
      4: { x: 62, y: 25 },  // 上路防守
      5: { x: 58, y: 50 },  // 中路防守
      6: { x: 62, y: 75 },  // 下路防守
    };
    const base = positions[teamNum || 0] || { x: 50, y: 50 };
    // Spread members within the same team slightly
    const offset = (index % 5) * 3;
    return { x: base.x + offset - 6, y: base.y + (Math.floor(index / 5)) * 4 };
  };

  // Update single assignment — auto-assign map position when team changes
  const handleAssignmentChange = (id: string, field: string, value: any) => {
    setAssignments(prev => {
      const updated = prev.map(a => {
        if (a.id !== id) return a;
        const newA = { ...a, [field]: value };
        // When team is assigned and no position yet, give a default position
        if (field === 'team_number' && value != null && (a.map_x == null || a.map_y == null)) {
          const teamMembers = prev.filter(x => x.team_number === value);
          const pos = getDefaultPosition(value, teamMembers.length);
          newA.map_x = pos.x;
          newA.map_y = pos.y;
        }
        return newA;
      });
      return updated;
    });
  };

  // Update member position from map drag
  const handlePositionChange = (id: string, x: number, y: number) => {
    setAssignments(prev =>
      prev.map(a => (a.id === id ? { ...a, map_x: x, map_y: y } : a))
    );
    if (!usingMock) {
      const assignment = assignments.find(a => a.id === id);
      if (assignment) {
        upsertAssignment({ ...stripJoined(assignment), map_x: x, map_y: y });
      }
    }
  };

  // Remove member from assignments
  const handleRemoveAssignment = async (id: string) => {
    if (!confirm('确定移除该成员？')) return;
    if (!usingMock) {
      await deleteAssignment(id);
    }
    setAssignments(prev => prev.filter(a => a.id !== id));
  };

  // Update event info
  const handleUpdateEvent = async (data: Partial<BattleEvent>) => {
    if (!event || usingMock) return;
    await updateBattleEvent(event.id, data);
    setEvent(prev => prev ? { ...prev, ...data } : prev);
  };

  // Add member from roster
  const handleOpenAddMember = async () => {
    setShowAddMember(true);
    const { data } = await getProfiles();
    if (data) setRosterProfiles(data);
  };

  const handleAddMember = async (profile: Profile) => {
    if (!event || usingMock) return;
    // Check if already added
    if (assignments.some(a => a.user_id === profile.user_id)) {
      alert('该成员已在列表中');
      return;
    }
    // Give new member a default position in center area so they're visible on map
    const idx = assignments.length;
    const defaultX = 48 + (idx % 5) * 2;
    const defaultY = 45 + Math.floor(idx / 5) * 3;
    const newAssignment = {
      id: crypto.randomUUID(),
      event_id: event.id,
      user_id: profile.user_id || profile.id,
      team_number: null,
      assigned_role: null,
      map_zone: null,
      map_x: defaultX,
      map_y: defaultY,
      is_substitute: false,
      admin_note: null,
      updated_by: user?.id || '',
      updated_at: new Date().toISOString(),
    };
    const { error } = await upsertAssignment(newAssignment);
    if (!error) {
      setAssignments(prev => [...prev, { ...newAssignment, profile }]);
    } else {
      alert('添加失败：' + error.message);
    }
  };

  // Import from signups
  const handleImportSignups = async () => {
    if (!event || usingMock) return;
    const { data: signups } = await getSignups(event.id);
    if (!signups || signups.length === 0) {
      alert('暂无报名记录');
      return;
    }
    const existingUserIds = new Set(assignments.map(a => a.user_id));
    const newSignups = signups.filter(s => !existingUserIds.has(s.user_id));
    if (newSignups.length === 0) {
      alert('所有报名成员已添加');
      return;
    }

    // Get profiles for these users
    const { data: allProfiles } = await getProfiles();
    const profileMap = new Map((allProfiles || []).map(p => [p.user_id, p]));

    for (const s of newSignups) {
      const newAssignment = {
        id: crypto.randomUUID(),
        event_id: event.id,
        user_id: s.user_id,
        team_number: null,
        assigned_role: null,
        map_zone: null,
        map_x: null,
        map_y: null,
        is_substitute: false,
        admin_note: null,
        updated_by: user?.id || '',
        updated_at: new Date().toISOString(),
      };
      await upsertAssignment(newAssignment);
      setAssignments(prev => [...prev, {
        ...newAssignment,
        profile: profileMap.get(s.user_id) || { nickname: s.nickname_snapshot } as any,
        signup: s,
      }]);
    }
    alert(`成功导入 ${newSignups.length} 名成员`);
  };

  // Tactic notes
  const handleStartEditTactics = () => {
    setTacticDraft(event?.tactic_notes || '');
    setEditingTactics(true);
  };

  const handleSaveTactics = async () => {
    if (!event) return;
    setSavingTactics(true);
    if (!usingMock) {
      await updateBattleEvent(event.id, { tactic_notes: tacticDraft });
    }
    setEvent(prev => prev ? { ...prev, tactic_notes: tacticDraft } : prev);
    setEditingTactics(false);
    setSavingTactics(false);
  };

  // Filtered roster for add member
  const filteredRoster = rosterProfiles.filter(p => {
    if (!memberSearch) return true;
    return p.nickname.includes(memberSearch) || p.identity?.includes(memberSearch);
  });

  if (loading) {
    return (
      <>
        <PageHeader englishTitle="BATTLE OPERATIONS" chineseTitle="百业战务" />
        <div className="max-w-[1600px] mx-auto px-8 pb-20 text-center text-text-secondary py-20">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <span className="text-gold">Loading...</span>
          </motion.div>
        </div>
      </>
    );
  }

  if (!event) {
    return (
      <>
        <PageHeader englishTitle="BATTLE OPERATIONS" chineseTitle="百业战务" />
        <div className="max-w-[1600px] mx-auto px-8 pb-20 text-center text-text-secondary py-20">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="text-lg font-title">暂无战务</p>
            <p className="text-sm mt-2">目前没有进行中或即将开始的战务活动。</p>
          </motion.div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader englishTitle="BATTLE OPERATIONS" chineseTitle="百业战务" />

      <div className="max-w-[1600px] mx-auto px-8 pb-20">
        {/* Event Overview */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <EventOverview event={event} isAdmin={isAdminOrOwner} onUpdateEvent={handleUpdateEvent} />
        </motion.div>

        {/* Two-column layout: Map + Table */}
        <div className="grid grid-cols-[55%_45%] gap-6 mb-12">
          {/* Left: Map */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-title text-lg text-text-primary flex items-center gap-2">
                <span className="font-display text-xs text-text-secondary/40 tracking-widest">MAP</span>
                百业战地图
              </h3>
              <div className="flex items-center gap-2">
                <button onClick={zoomOut} disabled={zoom <= 0.5}
                  className="w-7 h-7 flex items-center justify-center border border-gold/20 text-gold hover:bg-gold/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm font-bold rounded-sm">
                  -
                </button>
                <span className="text-text-secondary text-xs min-w-[3rem] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button onClick={zoomIn} disabled={zoom >= 3}
                  className="w-7 h-7 flex items-center justify-center border border-gold/20 text-gold hover:bg-gold/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm font-bold rounded-sm">
                  +
                </button>
              </div>
            </div>
            <div className="overflow-auto gold-border rounded-sm" style={{ maxHeight: '70vh' }}>
              <div style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', transition: 'transform 0.2s ease' }}>
                <BattleMapSVG
                  assignments={assignments}
                  isAdmin={isAdminOrOwner}
                  onPositionChange={handlePositionChange}
                />
              </div>
            </div>
          </motion.div>

          {/* Right: Assignment Table */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-title text-lg text-text-primary flex items-center gap-2">
                <span className="font-display text-xs text-text-secondary/40 tracking-widest">ASSIGNMENTS</span>
                分配控制
                <span className="text-text-secondary text-xs">({assignments.length}人)</span>
              </h3>
              {isAdminOrOwner && (
                <div className="flex gap-2">
                  <GoldButton variant="secondary" size="sm" onClick={handleOpenAddMember}>
                    添加成员
                  </GoldButton>
                  <GoldButton variant="secondary" size="sm" onClick={handleImportSignups}>
                    导入报名
                  </GoldButton>
                  <GoldButton variant="primary" size="sm" onClick={handleSaveAll}>
                    保存全部
                  </GoldButton>
                  <GoldButton variant="ghost" size="sm" onClick={handleResetAll}>
                    重置
                  </GoldButton>
                </div>
              )}
            </div>
            <AssignmentTable
              assignments={assignments}
              isAdmin={isAdminOrOwner}
              onAssignmentChange={handleAssignmentChange}
              onRemoveAssignment={isAdminOrOwner ? handleRemoveAssignment : undefined}
            />
          </motion.div>
        </div>

        <div className="section-divider my-12" />

        {/* Result Display */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-12">
          <h3 className="font-title text-xl text-text-primary mb-6 flex items-center gap-2">
            <span className="font-display text-xs text-text-secondary/40 tracking-widest">RESULT</span>
            分配结果
          </h3>
          <ResultDisplay assignments={assignments} />
        </motion.div>

        <div className="section-divider my-12" />

        {/* Tactic Notes */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <div className="flex items-center gap-4 mb-6">
            <h3 className="font-title text-xl text-text-primary flex items-center gap-2">
              <span className="font-display text-xs text-text-secondary/40 tracking-widest">TACTICS</span>
              战术部署
            </h3>
            {isAdminOrOwner && !editingTactics && (
              <button onClick={handleStartEditTactics}
                className="text-xs text-gold/60 hover:text-gold transition-colors border border-gold/20 hover:border-gold/40 px-2 py-0.5 rounded-sm">
                编辑
              </button>
            )}
          </div>

          {editingTactics ? (
            <div className="space-y-4">
              <textarea value={tacticDraft} onChange={e => setTacticDraft(e.target.value)}
                className="w-full h-64 p-4 bg-bg-card border border-gold/20 rounded-sm text-text-primary text-sm font-mono resize-y focus:border-gold/40 focus:outline-none"
                placeholder="输入战术说明（支持 Markdown 格式）..." />
              <div className="flex gap-2">
                <GoldButton variant="primary" size="sm" onClick={handleSaveTactics} disabled={savingTactics}>
                  {savingTactics ? '保存中...' : '保存'}
                </GoldButton>
                <GoldButton variant="ghost" size="sm" onClick={() => setEditingTactics(false)}>取消</GoldButton>
              </div>
            </div>
          ) : event.tactic_notes ? (
            <div className="p-6 bg-bg-card gold-border rounded-sm prose prose-invert prose-gold max-w-none
              [&_h2]:font-title [&_h2]:text-gold [&_h2]:text-lg [&_h2]:mb-3
              [&_h3]:font-title [&_h3]:text-text-primary [&_h3]:text-base [&_h3]:mb-2
              [&_p]:text-text-secondary [&_p]:text-sm [&_p]:leading-relaxed
              [&_li]:text-text-secondary [&_li]:text-sm [&_ul]:space-y-1">
              <ReactMarkdown>{event.tactic_notes}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-text-secondary/50 text-sm">暂无战术说明。</p>
          )}
        </motion.div>
      </div>

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddMember(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-bg-panel border border-gold/20 rounded-sm w-[480px] max-h-[70vh] flex flex-col"
          >
            <div className="p-5 border-b border-gold/10">
              <h3 className="font-title text-lg text-gold mb-3">添加成员到战务</h3>
              <input
                type="text"
                placeholder="搜索成员昵称..."
                value={memberSearch}
                onChange={e => setMemberSearch(e.target.value)}
                className="w-full bg-bg-card border border-gold/20 rounded px-3 py-2 text-text-primary text-sm focus:border-gold/40 outline-none"
              />
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {filteredRoster.length === 0 ? (
                <p className="text-center text-text-secondary/50 py-8 text-sm">未找到成员</p>
              ) : (
                <div className="space-y-1">
                  {filteredRoster.map(p => {
                    const alreadyAdded = assignments.some(a => a.user_id === p.user_id);
                    return (
                      <div key={p.id} className="flex items-center justify-between px-3 py-2 rounded hover:bg-bg-card/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-bg-card border border-gold/10 flex items-center justify-center">
                            {p.avatar_url ? (
                              <img src={p.avatar_url} alt={p.nickname} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-gold/40 text-xs">{p.nickname.charAt(0)}</span>
                            )}
                          </div>
                          <div>
                            <span className="text-text-primary text-sm">{p.nickname}</span>
                            {p.identity && <span className="text-text-secondary text-xs ml-2">{p.identity}</span>}
                          </div>
                        </div>
                        {alreadyAdded ? (
                          <span className="text-text-secondary/40 text-xs">已添加</span>
                        ) : (
                          <button
                            onClick={() => handleAddMember(p)}
                            className="text-xs text-gold border border-gold/30 hover:bg-gold/10 px-2.5 py-1 rounded transition-colors"
                          >
                            添加
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gold/10 flex justify-end">
              <GoldButton variant="ghost" size="sm" onClick={() => setShowAddMember(false)}>关闭</GoldButton>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
