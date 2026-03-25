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
import { getBattleEvents, getAssignments, updateBattleEvent, upsertAssignment } from '@/lib/db';
import { mockBattleEvent, mockAssignments } from '@/lib/mockData';
import type { BattleEvent, BattleAssignment } from '@/lib/types';
import ReactMarkdown from 'react-markdown';

type AssignmentWithProfile = BattleAssignment & { profile?: any; signup?: any };

function stripJoined(a: AssignmentWithProfile): Omit<BattleAssignment, 'profile' | 'signup'> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { profile: _p, signup: _s, ...data } = a;
  return data;
}

export default function BattlePage() {
  const { isAdminOrOwner } = useAuth();
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

  const fetchData = useCallback(async () => {
    try {
      const { data: events, error: evtErr } = await getBattleEvents();
      if (evtErr || !events || events.length === 0) {
        // Fallback to mock data
        setEvent(mockBattleEvent);
        setAssignments(mockAssignments);
        setUsingMock(true);
        setLoading(false);
        return;
      }

      // Use the most recent active event, or the first event
      const activeEvent = events.find(e => e.status === 'active') || events[0];
      setEvent(activeEvent);

      const { data: assigns, error: assignErr } = await getAssignments(activeEvent.id);
      if (assignErr || !assigns || assigns.length === 0) {
        // If this event matches the mock event, use mock assignments as fallback
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
      // On any error, fallback to mock
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

  // Reset all assignments (clear team_number, assigned_role, map_zone)
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

  // Update a single assignment in local state
  const handleAssignmentChange = (id: string, field: string, value: any) => {
    setAssignments(prev =>
      prev.map(a => (a.id === id ? { ...a, [field]: value } : a))
    );
  };

  // Update member position from map drag
  const handlePositionChange = (id: string, x: number, y: number) => {
    setAssignments(prev =>
      prev.map(a => (a.id === id ? { ...a, map_x: x, map_y: y } : a))
    );
    // Auto-save position if connected to DB
    if (!usingMock) {
      const assignment = assignments.find(a => a.id === id);
      if (assignment) {
        upsertAssignment({ ...stripJoined(assignment), map_x: x, map_y: y });
      }
    }
  };

  // Tactic notes editing
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
      <PageHeader
        englishTitle="BATTLE OPERATIONS"
        chineseTitle="百业战务"
      />

      <div className="max-w-[1600px] mx-auto px-8 pb-20">
        {/* Event Overview */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <EventOverview event={event} />
        </motion.div>

        {/* Two-column layout: Map + Table */}
        <div className="grid grid-cols-[55%_45%] gap-6 mb-12">
          {/* Left: Map */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-title text-lg text-text-primary flex items-center gap-2">
                <span className="font-display text-xs text-text-secondary/40 tracking-widest">MAP</span>
                百业战地图
              </h3>
              {/* Zoom controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={zoomOut}
                  disabled={zoom <= 0.5}
                  className="w-7 h-7 flex items-center justify-center border border-gold/20 text-gold hover:bg-gold/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm font-bold rounded-sm"
                >
                  -
                </button>
                <span className="text-text-secondary text-xs min-w-[3rem] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={zoomIn}
                  disabled={zoom >= 3}
                  className="w-7 h-7 flex items-center justify-center border border-gold/20 text-gold hover:bg-gold/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm font-bold rounded-sm"
                >
                  +
                </button>
              </div>
            </div>
            <div className="overflow-auto gold-border rounded-sm" style={{ maxHeight: '70vh' }}>
              <div
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.2s ease',
                }}
              >
                <BattleMapSVG
                  assignments={assignments}
                  isAdmin={isAdminOrOwner}
                  onPositionChange={handlePositionChange}
                />
              </div>
            </div>
          </motion.div>

          {/* Right: Assignment Table */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-title text-lg text-text-primary flex items-center gap-2">
                <span className="font-display text-xs text-text-secondary/40 tracking-widest">ASSIGNMENTS</span>
                分配控制
              </h3>
              {isAdminOrOwner && (
                <div className="flex gap-2">
                  <GoldButton variant="primary" size="sm" onClick={handleSaveAll}>
                    保存全部修改
                  </GoldButton>
                  <GoldButton variant="ghost" size="sm" onClick={handleResetAll}>
                    重置分配
                  </GoldButton>
                </div>
              )}
            </div>
            <AssignmentTable
              assignments={assignments}
              isAdmin={isAdminOrOwner}
              onAssignmentChange={handleAssignmentChange}
            />
          </motion.div>
        </div>

        {/* Divider */}
        <div className="section-divider my-12" />

        {/* Result Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <h3 className="font-title text-xl text-text-primary mb-6 flex items-center gap-2">
            <span className="font-display text-xs text-text-secondary/40 tracking-widest">RESULT</span>
            分配结果
          </h3>
          <ResultDisplay assignments={assignments} />
        </motion.div>

        {/* Divider */}
        <div className="section-divider my-12" />

        {/* Tactic Notes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center gap-4 mb-6">
            <h3 className="font-title text-xl text-text-primary flex items-center gap-2">
              <span className="font-display text-xs text-text-secondary/40 tracking-widest">TACTICS</span>
              战术部署
            </h3>
            {isAdminOrOwner && !editingTactics && (
              <button
                onClick={handleStartEditTactics}
                className="text-xs text-gold/60 hover:text-gold transition-colors border border-gold/20 hover:border-gold/40 px-2 py-0.5 rounded-sm"
              >
                编辑
              </button>
            )}
          </div>

          {editingTactics ? (
            <div className="space-y-4">
              <textarea
                value={tacticDraft}
                onChange={e => setTacticDraft(e.target.value)}
                className="w-full h-64 p-4 bg-bg-card border border-gold/20 rounded-sm text-text-primary text-sm font-mono resize-y focus:border-gold/40 focus:outline-none"
                placeholder="输入战术说明（支持 Markdown 格式）..."
              />
              <div className="flex gap-2">
                <GoldButton variant="primary" size="sm" onClick={handleSaveTactics} disabled={savingTactics}>
                  {savingTactics ? '保存中...' : '保存'}
                </GoldButton>
                <GoldButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingTactics(false)}
                >
                  取消
                </GoldButton>
              </div>
            </div>
          ) : event.tactic_notes ? (
            <div className="p-6 bg-bg-card gold-border rounded-sm prose prose-invert prose-gold max-w-none
              [&_h2]:font-title [&_h2]:text-gold [&_h2]:text-lg [&_h2]:mb-3
              [&_h3]:font-title [&_h3]:text-text-primary [&_h3]:text-base [&_h3]:mb-2
              [&_p]:text-text-secondary [&_p]:text-sm [&_p]:leading-relaxed
              [&_li]:text-text-secondary [&_li]:text-sm
              [&_ul]:space-y-1
            ">
              <ReactMarkdown>{event.tactic_notes}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-text-secondary/50 text-sm">暂无战术说明。</p>
          )}
        </motion.div>
      </div>
    </>
  );
}
