'use client';

import { Profile, MemberRelation } from '@/lib/types';
import { RELATION_TYPES } from '@/lib/constants';

interface RelationPanelProps {
  profile: Profile;
  relations: MemberRelation[];
  profiles: Profile[];
  isAdmin: boolean;
  onAddRelation: (relationType?: string) => void;
  onDeleteRelation: (relationId: string) => void;
}

type RelationTypeId = typeof RELATION_TYPES[number]['id'];

export default function RelationPanel({
  profile,
  relations,
  profiles,
  isAdmin,
  onAddRelation,
  onDeleteRelation,
}: RelationPanelProps) {
  // Categorize relations for this user
  const categorized: Record<RelationTypeId, { relation: MemberRelation; other: Profile }[]> = {
    xiayuan: [],
    jieyi: [],
    shifu: [],
    tudi: [],
  };

  relations.forEach(r => {
    const otherId = r.from_user_id === profile.user_id ? r.to_user_id : r.from_user_id;
    const otherProfile = profiles.find(p => p.user_id === otherId);
    if (!otherProfile) return;

    const type = r.relation_type as RelationTypeId;

    if (type === 'xiayuan' || type === 'jieyi') {
      // Bidirectional - always show
      categorized[type].push({ relation: r, other: otherProfile });
    } else if (type === 'shifu') {
      // from_user_id is the shifu, to_user_id is the tudi
      if (r.to_user_id === profile.user_id) {
        // This user has a shifu
        categorized.shifu.push({ relation: r, other: otherProfile });
      } else {
        // This user IS the shifu -> the other person is their tudi
        categorized.tudi.push({ relation: r, other: otherProfile });
      }
    } else if (type === 'tudi') {
      // from_user_id has the tudi (to_user_id)
      if (r.from_user_id === profile.user_id) {
        categorized.tudi.push({ relation: r, other: otherProfile });
      } else {
        categorized.shifu.push({ relation: r, other: otherProfile });
      }
    }
  });

  const sections = RELATION_TYPES.map(rt => ({
    ...rt,
    items: categorized[rt.id as RelationTypeId],
    canAdd: categorized[rt.id as RelationTypeId].length < rt.max,
  }));

  return (
    <div className="bg-bg-card gold-border rounded-sm overflow-hidden">
      {/* Header with avatar and name */}
      <div className="p-4 border-b border-gold/10">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-title"
            style={{
              backgroundColor: `${profile.node_color}20`,
              color: profile.node_color,
              border: `1.5px solid ${profile.node_color}40`,
            }}
          >
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.nickname}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              profile.nickname.charAt(0)
            )}
          </div>
          <div>
            <h3 className="font-title text-text-primary text-base">{profile.nickname}</h3>
            <p className="text-text-secondary text-xs">{profile.identity || '成员'}</p>
          </div>
        </div>
      </div>

      {/* Relation sections */}
      <div className="p-4 space-y-4">
        {sections.map(section => (
          <div key={section.id}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-[2px] inline-block"
                  style={{ backgroundColor: section.color }}
                />
                <span className="text-xs font-title" style={{ color: section.color }}>
                  {section.label}
                </span>
                <span className="text-text-secondary/50 text-[10px]">
                  ({section.items.length}/{section.max})
                </span>
              </div>
              {isAdmin && section.canAdd && (
                <button
                  onClick={() => onAddRelation(section.id)}
                  className="text-[10px] text-gold/60 hover:text-gold border border-gold/10 hover:border-gold/30 px-1.5 py-0.5 rounded-sm transition-all"
                >
                  + 添加
                </button>
              )}
            </div>

            {section.items.length === 0 ? (
              <p className="text-text-secondary/30 text-xs pl-5">暂无</p>
            ) : (
              <div className="space-y-1 pl-5">
                {section.items.map(({ relation, other }) => (
                  <div
                    key={relation.id}
                    className="flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[9px]"
                        style={{
                          backgroundColor: `${other.node_color}20`,
                          color: other.node_color,
                          border: `1px solid ${other.node_color}40`,
                        }}
                      >
                        {other.nickname.charAt(0)}
                      </span>
                      <span className="text-text-primary text-xs">{other.nickname}</span>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => onDeleteRelation(relation.id)}
                        className="opacity-0 group-hover:opacity-100 text-red-400/60 hover:text-red-400 text-xs transition-all px-1"
                        title="删除关系"
                      >
                        &times;
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
