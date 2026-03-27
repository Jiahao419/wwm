'use client';

import { useState } from 'react';
import { BattleEvent } from '@/lib/types';
import { EVENT_TYPES, BATTLE_ROUTES, BATTLE_ROLES_BAIYE, BATTLE_ROLES_DUNGEON } from '@/lib/constants';
import { createSignup } from '@/lib/db';
import { useAuth } from '@/components/providers/AuthProvider';
import GoldButton from '@/components/ui/GoldButton';

interface SignupFormProps {
  event: BattleEvent;
  onSignupCreated?: () => void;
}

export default function SignupForm({ event, onSignupCreated }: SignupFormProps) {
  const { user, profile } = useAuth();
  const [contact, setContact] = useState('');
  const [intro, setIntro] = useState('');
  const [note, setNote] = useState('');
  const [route, setRoute] = useState('');
  const [roles, setRoles] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const config = EVENT_TYPES[event.event_type];
  const fields = config.fields as readonly string[];
  const showRoute = fields.includes('route');
  const showBaiyeRoles = fields.includes('role_baiye');
  const showDungeonRoles = fields.includes('role_dungeon');

  const toggleRole = (role: string) => {
    setRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
  };

  const handleSubmit = async () => {
    if (!user || !profile) return;
    setSubmitting(true);
    try {
      await createSignup({
        event_id: event.id,
        user_id: user.id,
        nickname_snapshot: profile.nickname,
        contact: contact.trim() || null,
        intro: intro.trim() || null,
        preferred_route: route || null,
        preferred_roles: roles,
        note: note.trim() || null,
      });
      setSubmitted(true);
      onSignupCreated?.();
    } catch (err) {
      console.error('Failed to submit signup:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="p-6 bg-bg-card gold-border rounded-sm text-center">
        <div className="text-gold text-lg font-title mb-2">报名成功</div>
        <p className="text-text-secondary text-sm">已成功提交报名，请等待管理员分配。</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-bg-card gold-border rounded-sm">
      <div className="space-y-5">
        {/* Auto-filled nickname */}
        <div>
          <label className="block text-text-secondary text-sm mb-1.5">昵称</label>
          <input
            value={profile?.nickname || '未登录'}
            disabled
            className="w-full bg-bg-panel border border-gold/5 px-4 py-2.5 text-text-secondary text-sm cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-text-secondary text-sm mb-1.5">联系方式</label>
          <input
            value={contact}
            onChange={e => setContact(e.target.value)}
            placeholder="Discord / 微信"
            className="w-full bg-bg-panel border border-gold/10 px-4 py-2.5 text-text-primary text-sm focus:border-gold/30 focus:outline-none transition-colors"
          />
        </div>

        {/* 流派 (baiye_war only) */}
        {showRoute && (
          <div>
            <label className="block text-text-secondary text-sm mb-2">流派</label>
            <div className="flex gap-3">
              {BATTLE_ROUTES.map(r => (
                <label key={r} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="route"
                    value={r}
                    checked={route === r}
                    onChange={() => setRoute(r)}
                    className="accent-gold"
                  />
                  <span className="text-text-primary text-sm">{r}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Baiye roles */}
        {showBaiyeRoles && (
          <div>
            <label className="block text-text-secondary text-sm mb-2">职责偏好（可多选）</label>
            <div className="flex flex-wrap gap-2">
              {BATTLE_ROLES_BAIYE.map(role => (
                <button
                  key={role}
                  onClick={() => toggleRole(role)}
                  className={`px-3 py-1.5 text-sm border transition-all ${
                    roles.includes(role)
                      ? 'bg-gold/20 border-gold/50 text-gold'
                      : 'border-gold/10 text-text-secondary hover:border-gold/30'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Dungeon roles */}
        {showDungeonRoles && (
          <div>
            <label className="block text-text-secondary text-sm mb-2">职责偏好（可多选）</label>
            <div className="flex flex-wrap gap-2">
              {BATTLE_ROLES_DUNGEON.map(role => (
                <button
                  key={role}
                  onClick={() => toggleRole(role)}
                  className={`px-3 py-1.5 text-sm border transition-all ${
                    roles.includes(role)
                      ? 'bg-gold/20 border-gold/50 text-gold'
                      : 'border-gold/10 text-text-secondary hover:border-gold/30'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-text-secondary text-sm mb-1.5">本场说明</label>
          <textarea
            value={intro}
            onChange={e => setIntro(e.target.value)}
            placeholder="能否全程参加、时间限制等"
            rows={2}
            className="w-full bg-bg-panel border border-gold/10 px-4 py-2.5 text-text-primary text-sm focus:border-gold/30 focus:outline-none transition-colors resize-none"
          />
        </div>

        <div>
          <label className="block text-text-secondary text-sm mb-1.5">备注</label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="其他说明"
            rows={2}
            className="w-full bg-bg-panel border border-gold/10 px-4 py-2.5 text-text-primary text-sm focus:border-gold/30 focus:outline-none transition-colors resize-none"
          />
        </div>

        <GoldButton
          variant="primary"
          className="w-full"
          onClick={handleSubmit}
          disabled={submitting || !user}
        >
          {submitting ? '提交中...' : '提交报名'}
        </GoldButton>
      </div>
    </div>
  );
}
