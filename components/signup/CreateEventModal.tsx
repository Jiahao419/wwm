'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GoldButton from '@/components/ui/GoldButton';
import { EVENT_TYPES, EventType } from '@/lib/constants';
import { createBattleEvent } from '@/lib/db';
import { useAuth } from '@/components/providers/AuthProvider';

interface CreateEventModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const eventTypeOptions = Object.entries(EVENT_TYPES).map(([key, val]) => ({
  value: key as EventType,
  label: val.label,
}));

export default function CreateEventModal({ open, onClose, onCreated }: CreateEventModalProps) {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState<EventType>('baiye_war');
  const [opponent, setOpponent] = useState('');
  const [battleTime, setBattleTime] = useState('');
  const [signupDeadline, setSignupDeadline] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(30);
  const [description, setDescription] = useState('');

  const inputCls = 'w-full bg-bg-card border border-gold/10 px-4 py-2.5 text-text-primary text-sm focus:border-gold/40 focus:outline-none transition-colors rounded-sm';

  const reset = () => {
    setTitle('');
    setEventType('baiye_war');
    setOpponent('');
    setBattleTime('');
    setSignupDeadline('');
    setMaxParticipants(30);
    setDescription('');
  };

  const handleSubmit = async () => {
    if (!title.trim() || !user) return;
    setSubmitting(true);
    try {
      const config = EVENT_TYPES[eventType];
      await createBattleEvent({
        title: title.trim(),
        event_type: eventType,
        opponent: opponent.trim() || null,
        battle_time: battleTime ? new Date(battleTime).toISOString() : null,
        signup_deadline: signupDeadline ? new Date(signupDeadline).toISOString() : null,
        max_participants: maxParticipants || (config.maxParticipants ?? 30),
        team_count: 'teamCount' in config ? config.teamCount : 0,
        team_size: 'teamSize' in config ? config.teamSize : 0,
        status: 'upcoming',
        description: description.trim() || null,
        tactic_notes: null,
        created_by: user.id,
      });
      reset();
      onCreated();
      onClose();
    } catch (err) {
      console.error('Failed to create event:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-lg bg-bg-primary border border-gold/20 rounded-sm shadow-2xl max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6">
              <h2 className="font-title text-xl text-gold mb-6">创建赛事</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-text-secondary text-sm mb-1.5">赛事标题 *</label>
                  <input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="例：月冕 vs 风雷阁 · 百业战"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block text-text-secondary text-sm mb-1.5">赛事类型</label>
                  <select
                    value={eventType}
                    onChange={e => setEventType(e.target.value as EventType)}
                    className={inputCls}
                  >
                    {eventTypeOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-text-secondary text-sm mb-1.5">对手</label>
                  <input
                    value={opponent}
                    onChange={e => setOpponent(e.target.value)}
                    placeholder="对手帮会名（可留空）"
                    className={inputCls}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-text-secondary text-sm mb-1.5">比赛时间</label>
                    <input
                      type="datetime-local"
                      value={battleTime}
                      onChange={e => setBattleTime(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-text-secondary text-sm mb-1.5">报名截止</label>
                    <input
                      type="datetime-local"
                      value={signupDeadline}
                      onChange={e => setSignupDeadline(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-text-secondary text-sm mb-1.5">人数上限</label>
                  <input
                    type="number"
                    value={maxParticipants}
                    onChange={e => setMaxParticipants(Number(e.target.value))}
                    min={1}
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block text-text-secondary text-sm mb-1.5">描述</label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="赛事描述"
                    rows={3}
                    className={`${inputCls} resize-none`}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <GoldButton
                  variant="secondary"
                  className="flex-1"
                  onClick={onClose}
                  disabled={submitting}
                >
                  取消
                </GoldButton>
                <GoldButton
                  variant="primary"
                  className="flex-1"
                  onClick={handleSubmit}
                  disabled={submitting || !title.trim()}
                >
                  {submitting ? '创建中...' : '创建赛事'}
                </GoldButton>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
