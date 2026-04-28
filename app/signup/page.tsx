'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import PageHeader from '@/components/ui/PageHeader';
import GoldButton from '@/components/ui/GoldButton';
import SignupForm from '@/components/signup/SignupForm';
import SignupList from '@/components/signup/SignupList';
import CreateEventModal from '@/components/signup/CreateEventModal';
import DungeonTeamGrid from '@/components/signup/DungeonTeamGrid';
import { useAuth } from '@/components/providers/AuthProvider';
import { getBattleEvents, getSignups, updateBattleEvent, deleteSignup, deleteAllSignups, deleteBattleEvent } from '@/lib/db';
import { mockBattleEvent, mockSignups } from '@/lib/mockData';
import { EVENT_TYPES } from '@/lib/constants';
import { BattleEvent, BattleSignup, Profile } from '@/lib/types';
import { useAuditLog } from '@/lib/useAuditLog';

const statusLabels: Record<string, { text: string; cls: string }> = {
  upcoming: { text: '即将开始', cls: 'bg-blue-900/30 text-blue-400' },
  active: { text: '报名中', cls: 'bg-gold/20 text-gold' },
  closed: { text: '已截止', cls: 'bg-orange-900/30 text-orange-400' },
  finished: { text: '已结束', cls: 'bg-bg-panel text-text-secondary' },
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return '-';
  // 直接截取日期字符串前10位，避免时区转换问题
  if (dateStr.length >= 10) {
    const [y, m, d] = dateStr.substring(0, 10).split('-');
    return `${y}.${m}.${d}`;
  }
  const dt = new Date(dateStr);
  return `${dt.getFullYear()}.${String(dt.getMonth() + 1).padStart(2, '0')}.${String(dt.getDate()).padStart(2, '0')}`;
}

// Fallback mock events
const fallbackEvents: BattleEvent[] = [
  mockBattleEvent,
  {
    id: 'e2', title: '周三十人本 · 风暴深渊', event_type: 'dungeon_10',
    opponent: null, battle_time: '2026-03-26T21:00:00Z',
    signup_deadline: '2026-03-26T18:00:00Z', max_participants: 10,
    team_count: 1, team_size: 10, status: 'active',
    description: '周三例行十人本，需要主T和奶妈优先报名。',
    tactic_notes: null, battle_mode: null, result: null, created_by: 'u2', created_at: '', updated_at: '',
  },
  {
    id: 'e3', title: '百业好声音 第二季', event_type: 'activity',
    opponent: null, battle_time: '2026-04-05T20:00:00Z',
    signup_deadline: '2026-04-05T12:00:00Z', max_participants: 50,
    team_count: 0, team_size: 0, status: 'upcoming',
    description: '月冕内部K歌赛，欢迎所有成员参加！',
    tactic_notes: null, battle_mode: null, result: null, created_by: 'u10', created_at: '', updated_at: '',
  },
];

function SignupPageContent() {
  const { isAdminOrOwner } = useAuth();
  const audit = useAuditLog();
  const searchParams = useSearchParams();
  const eventFromUrl = searchParams.get('event');
  const [events, setEvents] = useState<BattleEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [signups, setSignups] = useState<(BattleSignup & { profile: Profile })[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPastEvent, setEditingPastEvent] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<string>('');
  const [editBattleTime, setEditBattleTime] = useState<string>('');
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [editingHeader, setEditingHeader] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [savingHeader, setSavingHeader] = useState(false);

  const fetchEvents = useCallback(async () => {
    try {
      const { data, error } = await getBattleEvents();
      if (error || !data || data.length === 0) {
        setEvents(fallbackEvents);
        setSelectedEvent(fallbackEvents[0].id);
      } else {
        setEvents(data);
        setSelectedEvent(prev => {
          // URL param takes priority
          if (eventFromUrl && data.find(e => e.id === eventFromUrl)) return eventFromUrl;
          if (prev && data.find(e => e.id === prev)) return prev;
          const active = data.find(e => e.status === 'active' || e.status === 'upcoming');
          return active?.id || data[0].id;
        });
      }
    } catch {
      setEvents(fallbackEvents);
      setSelectedEvent(fallbackEvents[0].id);
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  const fetchSignups = useCallback(async (eventId: string) => {
    // Check if using mock data
    const isMock = fallbackEvents.some(e => e.id === eventId) && events === fallbackEvents;
    if (isMock) {
      setSignups(eventId === 'e1' ? mockSignups : mockSignups.slice(0, 3));
      return;
    }
    try {
      const { data } = await getSignups(eventId);
      // Signups from DB won't have profile joined, cast as-is
      setSignups((data || []) as (BattleSignup & { profile: Profile })[]);
    } catch {
      setSignups([]);
    }
  }, [events]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    if (selectedEvent) {
      fetchSignups(selectedEvent);
    }
  }, [selectedEvent, fetchSignups]);

  const activeEvents = events.filter(e => e.status === 'upcoming' || e.status === 'active');
  const pastEvents = events.filter(e => e.status === 'closed' || e.status === 'finished');
  const current = events.find(e => e.id === selectedEvent) || activeEvents[0] || events[0];
  const typeLabel = current ? (EVENT_TYPES[current.event_type]?.label || current.event_type) : '';
  const status = current ? statusLabels[current.status] : null;

  const handleSaveHeader = async () => {
    if (!current || !editTitle.trim()) return;
    setSavingHeader(true);
    try {
      await updateBattleEvent(current.id, {
        title: editTitle.trim(),
        description: editDescription.trim() || null,
      });
      audit({ action: '编辑赛事信息', category: 'event', targetType: 'battle_event', targetId: current.id, details: { title: editTitle.trim() } });
      setEditingHeader(false);
      fetchEvents();
    } catch (err) {
      console.error('Failed to update event:', err);
    } finally {
      setSavingHeader(false);
    }
  };

  const handleSavePastEvent = async (eventId: string) => {
    if (!editStatus) return;
    try {
      await updateBattleEvent(eventId, {
        status: editStatus as BattleEvent['status'],
        battle_time: editBattleTime || null,
      });
      audit({ action: '编辑往期赛事', category: 'event', targetType: 'battle_event', targetId: eventId, details: { status: editStatus } });
      setEditingPastEvent(null);
      setEditStatus('');
      setEditBattleTime('');
      fetchEvents();
    } catch (err) {
      console.error('Failed to update event:', err);
    }
  };

  if (loadingEvents) {
    return (
      <>
        <PageHeader englishTitle="EVENT SIGNUP" chineseTitle="赛事报名" />
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 pb-20 text-center text-text-secondary">
          加载中...
        </div>
      </>
    );
  }

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 z-0" style={{ backgroundImage: 'url(/images/baoming.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
      <div className="fixed inset-0 z-0 bg-black/60" />

      <div className="relative z-10">
      <PageHeader englishTitle="EVENT SIGNUP" chineseTitle="赛事报名" />

      <div className="max-w-[1200px] mx-auto px-4 md:px-8 pb-20">
        {/* Admin create event button */}
        {isAdminOrOwner && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex justify-end mb-6"
          >
            <GoldButton variant="secondary" size="sm" onClick={() => setShowCreateModal(true)}>
              + 创建赛事
            </GoldButton>
          </motion.div>
        )}

        {/* Active event tabs */}
        {activeEvents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap gap-2 md:gap-4 mb-8"
          >
            {activeEvents.map(event => {
              const isActive = event.id === selectedEvent;
              const st = statusLabels[event.status];
              return (
                <button
                  key={event.id}
                  onClick={() => setSelectedEvent(event.id)}
                  className={`flex-1 min-w-[140px] p-3 md:p-4 rounded-sm border transition-all text-left ${
                    isActive
                      ? 'bg-bg-card border-gold/40 shadow-[0_0_20px_rgba(201,168,76,0.1)]'
                      : 'bg-bg-card/50 border-gold/10 hover:border-gold/20'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-1.5 py-0.5 text-[10px] rounded ${st.cls}`}>{st.text}</span>
                    <span className="text-[10px] text-text-secondary">{EVENT_TYPES[event.event_type]?.label}</span>
                  </div>
                  <h4 className={`text-xs md:text-sm font-title ${isActive ? 'text-gold' : 'text-text-primary'}`}>
                    {event.title}
                  </h4>
                </button>
              );
            })}
          </motion.div>
        )}

        {/* Event description header — only for active/upcoming events */}
        {current && status && (current.status === 'upcoming' || current.status === 'active') && (
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-bg-card gold-border rounded-sm mb-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="px-2 py-0.5 text-xs bg-bg-panel text-text-secondary rounded">{typeLabel}</span>
            </div>
            {editingHeader ? (
              <div className="space-y-3">
                <input
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full bg-bg-card border border-gold/10 px-4 py-2.5 text-text-primary text-lg font-title focus:border-gold/40 focus:outline-none transition-colors rounded-sm"
                  placeholder="赛事标题"
                />
                <textarea
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  className="w-full bg-bg-card border border-gold/10 px-4 py-2.5 text-text-primary text-sm focus:border-gold/40 focus:outline-none transition-colors rounded-sm resize-none"
                  rows={3}
                  placeholder="赛事描述（可留空）"
                />
                <div className="flex gap-2">
                  <GoldButton
                    variant="primary"
                    size="sm"
                    onClick={handleSaveHeader}
                    disabled={savingHeader || !editTitle.trim()}
                  >
                    {savingHeader ? '保存中...' : '保存'}
                  </GoldButton>
                  <GoldButton
                    variant="secondary"
                    size="sm"
                    onClick={() => setEditingHeader(false)}
                    disabled={savingHeader}
                  >
                    取消
                  </GoldButton>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <h2 className="font-title text-2xl text-text-primary">{current.title}</h2>
                  {isAdminOrOwner && (
                    <button
                      onClick={() => {
                        setEditTitle(current.title);
                        setEditDescription(current.description || '');
                        setEditingHeader(true);
                      }}
                      className="text-gold/40 hover:text-gold transition-colors text-sm"
                      title="编辑赛事信息"
                    >
                      ✎
                    </button>
                  )}
                  {isAdminOrOwner && (
                    <button
                      onClick={async () => {
                        if (!confirm(`确定要结束「${current.title}」？活动将移至往期赛事。`)) return;
                        await updateBattleEvent(current.id, { status: 'finished' });
                        audit({ action: '结束赛事', category: 'event', targetType: 'battle_event', targetId: current.id, details: { title: current.title } });
                        fetchEvents();
                      }}
                      className="ml-auto text-xs text-red-400/60 hover:text-red-400 transition-colors border border-red-400/20 hover:border-red-400/40 px-3 py-1 rounded"
                    >
                      结束活动
                    </button>
                  )}
                </div>
                {current.description && (
                  <p className="text-text-secondary text-sm mt-2">{current.description}</p>
                )}
              </>
            )}
          </motion.div>
        )}

        {/* Content area — different views based on event type */}
        {current && (current.status === 'upcoming' || current.status === 'active') && (
          current.event_type === 'dungeon_10' ? (
            /* 10人本排班表 */
            <DungeonTeamGrid event={current} onRefresh={fetchEvents} />
          ) : (
            /* 其他类型：常规报名表单 + 名单 */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h3 className="font-title text-lg text-text-primary mb-4">报名表单</h3>
                <SignupForm
                  event={current}
                  onSignupCreated={() => fetchSignups(current.id)}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-title text-lg text-text-primary">已报名</h3>
                  {isAdminOrOwner && signups.length > 0 && (
                    <button
                      onClick={async () => {
                        if (!confirm(`确定要清空所有 ${signups.length} 个报名吗？此操作不可撤销！`)) return;
                        const { error } = await deleteAllSignups(current.id);
                        if (error) {
                          alert('清空失败：' + error.message);
                          return;
                        }
                        audit({ action: '清空所有报名', category: 'signup', targetType: 'battle_event', targetId: current?.id, details: { count: signups.length } });
                        setSignups([]);
                      }}
                      className="text-xs text-red-400/60 hover:text-red-400 transition-colors border border-red-400/20 hover:border-red-400/40 px-2 py-1 rounded"
                    >
                      清空报名
                    </button>
                  )}
                </div>
                <SignupList
                  signups={signups}
                  maxParticipants={current.max_participants}
                  isAdminOrOwner={isAdminOrOwner}
                  onDelete={async (id) => {
                    const { error } = await deleteSignup(id);
                    if (error) {
                      alert('删除失败：' + error.message);
                    } else {
                      const deleted = signups.find(s => s.id === id);
                      audit({ action: '删除报名', category: 'signup', targetType: 'battle_signup', targetId: id, details: { nickname: deleted?.nickname_snapshot } });
                      setSignups(prev => prev.filter(s => s.id !== id));
                    }
                  }}
                />
              </motion.div>
            </div>
          )
        )}

        {/* Past events section */}
        {pastEvents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12"
          >
            <h3 className="font-title text-lg text-text-primary mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-gold/40 rounded-full" />
              往期赛事
            </h3>
            <div className="bg-bg-card gold-border rounded-sm overflow-hidden overflow-x-auto">
              <table className="w-full text-sm min-w-[500px]">
                <thead>
                  <tr className="border-b border-gold/10 text-text-secondary text-xs">
                    <th className="py-3 px-4 text-left font-normal">日期</th>
                    <th className="py-3 px-4 text-left font-normal">赛事名称</th>
                    <th className="py-3 px-4 text-left font-normal">类型</th>
                    <th className="py-3 px-4 text-left font-normal">状态</th>
                    {isAdminOrOwner && <th className="py-3 px-4 text-right font-normal">操作</th>}
                  </tr>
                </thead>
                <tbody>
                  {pastEvents.map(event => {
                    const st = statusLabels[event.status];
                    const isEditing = editingPastEvent === event.id;
                    return (
                      <tr key={event.id} className="border-b border-gold/5 last:border-0 hover:bg-gold/5 transition-colors">
                        <td className="py-3 px-4 text-text-secondary">
                          {isEditing ? (
                            <input
                              type="date"
                              value={editBattleTime ? editBattleTime.split('T')[0] : ''}
                              onChange={e => setEditBattleTime(e.target.value ? e.target.value + 'T12:00:00Z' : '')}
                              className="bg-bg-card border border-gold/10 px-2 py-1 text-text-primary text-xs focus:border-gold/40 focus:outline-none rounded-sm"
                            />
                          ) : formatDate(event.battle_time)}
                        </td>
                        <td className="py-3 px-4 text-text-primary">{event.title}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 text-xs bg-bg-panel text-text-secondary rounded">
                            {EVENT_TYPES[event.event_type]?.label || event.event_type}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {isEditing ? (
                            <select
                              value={editStatus}
                              onChange={e => setEditStatus(e.target.value)}
                              className="bg-bg-card border border-gold/10 px-2 py-1 text-text-primary text-xs focus:border-gold/40 focus:outline-none rounded-sm"
                            >
                              <option value="closed">已截止</option>
                              <option value="finished">已结束</option>
                            </select>
                          ) : (
                            <span className={`px-2 py-0.5 text-xs rounded ${st.cls}`}>{st.text}</span>
                          )}
                        </td>
                        {isAdminOrOwner && (
                          <td className="py-3 px-4 text-right">
                            {isEditing ? (
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => handleSavePastEvent(event.id)}
                                  className="text-xs text-gold hover:text-gold-light transition-colors"
                                >
                                  保存
                                </button>
                                <button
                                  onClick={() => { setEditingPastEvent(null); setEditStatus(''); setEditBattleTime(''); }}
                                  className="text-xs text-text-secondary hover:text-text-primary transition-colors"
                                >
                                  取消
                                </button>
                              </div>
                            ) : (
                              <div className="flex gap-3 justify-end">
                                <button
                                  onClick={() => { setEditingPastEvent(event.id); setEditStatus(event.status); setEditBattleTime(event.battle_time || ''); }}
                                  className="text-xs text-gold/60 hover:text-gold transition-colors"
                                >
                                  编辑
                                </button>
                                <button
                                  onClick={async () => {
                                    if (!confirm(`确定要删除「${event.title}」？此操作不可撤销！`)) return;
                                    await deleteBattleEvent(event.id);
                                    audit({ action: '删除赛事', category: 'event', targetType: 'battle_event', targetId: event.id, details: { title: event.title } });
                                    fetchEvents();
                                  }}
                                  className="text-xs text-red-400/50 hover:text-red-400 transition-colors"
                                >
                                  删除
                                </button>
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>

      {/* Create Event Modal */}
      <CreateEventModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={fetchEvents}
      />
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-text-secondary">加载中...</div>}>
      <SignupPageContent />
    </Suspense>
  );
}
