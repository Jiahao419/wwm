'use client';

import { useState, useMemo } from 'react';
import { Profile, MemberRelation } from '@/lib/types';
import { RELATION_TYPES } from '@/lib/constants';

interface AddRelationModalProps {
  currentProfileId: string;
  profiles: Profile[];
  relations: MemberRelation[];
  defaultType: string | null;
  onConfirm: (targetProfileId: string, relationType: MemberRelation['relation_type']) => void;
  onClose: () => void;
}

export default function AddRelationModal({
  currentProfileId,
  profiles,
  relations,
  defaultType,
  onConfirm,
  onClose,
}: AddRelationModalProps) {
  const [selectedType, setSelectedType] = useState<string>(defaultType || RELATION_TYPES[0].id);
  const [selectedTarget, setSelectedTarget] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const currentProfile = profiles.find(p => p.id === currentProfileId);

  // Count existing relations of each type for the current user (using profile.id)
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    RELATION_TYPES.forEach(t => { counts[t.id] = 0; });

    relations.forEach(r => {
      if (r.from_user_id === currentProfileId || r.to_user_id === currentProfileId) {
        const type = r.relation_type;
        // For shifu/tudi, only count from the right perspective
        if (type === 'shifu') {
          if (r.to_user_id === currentProfileId) counts.shifu = (counts.shifu || 0) + 1;
          else counts.tudi = (counts.tudi || 0) + 1;
        } else if (type === 'tudi') {
          if (r.from_user_id === currentProfileId) counts.tudi = (counts.tudi || 0) + 1;
          else counts.shifu = (counts.shifu || 0) + 1;
        } else {
          counts[type] = (counts[type] || 0) + 1;
        }
      }
    });
    return counts;
  }, [relations, currentProfileId]);

  // Exclude current user and already-related users of the selected type
  const availableTargets = useMemo(() => {
    const existingTargets = new Set<string>();
    relations.forEach(r => {
      if (r.relation_type === selectedType ||
          // Also check the inverse for shifu/tudi
          (selectedType === 'shifu' && r.relation_type === 'tudi') ||
          (selectedType === 'tudi' && r.relation_type === 'shifu')) {
        if (r.from_user_id === currentProfileId) existingTargets.add(r.to_user_id);
        if (r.to_user_id === currentProfileId) existingTargets.add(r.from_user_id);
      }
    });

    return profiles.filter(p => p.id !== currentProfileId && !existingTargets.has(p.id));
  }, [profiles, relations, currentProfileId, selectedType]);

  const currentType = RELATION_TYPES.find(t => t.id === selectedType);
  const currentCount = typeCounts[selectedType] || 0;
  const maxCount = currentType?.max || 0;
  const isMaxed = currentCount >= maxCount;

  const handleConfirm = () => {
    if (!selectedTarget) {
      setError('请选择目标成员');
      return;
    }
    if (isMaxed) {
      setError(`${currentType?.label}已达上限 (${maxCount})`);
      return;
    }
    setError(null);
    onConfirm(selectedTarget, selectedType as MemberRelation['relation_type']);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-bg-card gold-border rounded-sm w-[400px] max-w-[90vw] shadow-2xl">
        <div className="p-5 border-b border-gold/10">
          <h3 className="font-title text-text-primary text-lg">添加关系</h3>
          <p className="text-text-secondary text-xs mt-1">
            为 {currentProfile?.nickname || '成员'} 添加新的关系
          </p>
        </div>

        <div className="p-5 space-y-4">
          {/* Relation type selector */}
          <div>
            <label className="block text-text-secondary text-xs mb-1.5">关系类型</label>
            <div className="grid grid-cols-2 gap-2">
              {RELATION_TYPES.map(t => {
                const count = typeCounts[t.id] || 0;
                const max = t.max;
                const disabled = count >= max;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      if (!disabled) {
                        setSelectedType(t.id);
                        setSelectedTarget('');
                        setError(null);
                      }
                    }}
                    disabled={disabled}
                    className={`px-3 py-2 text-xs border rounded-sm transition-all text-left ${
                      selectedType === t.id
                        ? 'border-gold/50 bg-gold/10'
                        : disabled
                        ? 'border-gold/5 bg-bg-panel/50 opacity-40 cursor-not-allowed'
                        : 'border-gold/10 bg-bg-panel hover:border-gold/30'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-[2px] inline-block"
                        style={{ backgroundColor: t.color }}
                      />
                      <span style={{ color: selectedType === t.id ? t.color : undefined }}>
                        {t.label}
                      </span>
                    </div>
                    <span className="text-text-secondary/50 text-[10px] mt-0.5 block">
                      {count}/{max}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target member selector with search */}
          <div>
            <label className="block text-text-secondary text-xs mb-1.5">目标成员</label>
            {isMaxed ? (
              <p className="text-red-400/80 text-xs py-2">
                {currentType?.label}已达上限 ({maxCount})，无法继续添加
              </p>
            ) : availableTargets.length === 0 ? (
              <p className="text-text-secondary/50 text-xs py-2">
                没有可添加的成员
              </p>
            ) : (
              <div>
                <input
                  type="text"
                  placeholder="搜索成员名字..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-bg-panel border border-gold/10 rounded-sm text-text-primary focus:border-gold/40 focus:outline-none mb-2"
                />
                <div className="max-h-[200px] overflow-y-auto border border-gold/10 rounded-sm bg-bg-panel">
                  {availableTargets
                    .filter(p => !searchQuery || p.nickname.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map(p => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setSelectedTarget(p.id);
                          setError(null);
                        }}
                        className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-all ${
                          selectedTarget === p.id
                            ? 'bg-gold/15 text-gold'
                            : 'text-text-primary hover:bg-gold/5'
                        }`}
                      >
                        <span className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0 border border-gold/20">
                          {p.avatar_url ? (
                            <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="w-full h-full flex items-center justify-center text-[9px] bg-bg-card text-gold/40">
                              {p.nickname.charAt(0)}
                            </span>
                          )}
                        </span>
                        <span>{p.nickname}</span>
                        {p.identity && <span className="text-text-secondary/50 text-xs">({p.identity})</span>}
                      </button>
                    ))}
                  {availableTargets.filter(p => !searchQuery || p.nickname.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                    <p className="text-text-secondary/50 text-xs py-3 text-center">未找到匹配成员</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-400 text-xs">{error}</p>
          )}
        </div>

        {/* Actions */}
        <div className="p-5 pt-0 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs border border-gold/10 text-text-secondary rounded-sm hover:border-gold/30 transition-all"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={isMaxed || !selectedTarget}
            className="px-4 py-1.5 text-xs border border-gold/40 text-gold bg-gold/10 rounded-sm hover:bg-gold/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            确认添加
          </button>
        </div>
      </div>
    </div>
  );
}
