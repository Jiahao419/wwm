'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import PageHeader from '@/components/ui/PageHeader';
import ForceGraph from '@/components/relations/ForceGraph';
import RelationPanel from '@/components/relations/RelationPanel';
import AddRelationModal from '@/components/relations/AddRelationModal';
import { useAuth } from '@/components/providers/AuthProvider';
import { getRelations, getProfiles, createRelation, deleteRelation } from '@/lib/db';
import { mockProfiles, mockRelations } from '@/lib/mockData';
import { RELATION_TYPES } from '@/lib/constants';
import type { Profile, MemberRelation } from '@/lib/types';

type ViewMode = 'individual' | 'global';

export default function RelationsPage() {
  const { isAdminOrOwner, user, profile: myProfile } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [relations, setRelations] = useState<MemberRelation[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('global');
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addRelationType, setAddRelationType] = useState<string | null>(null);
  const [usingMock, setUsingMock] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [profilesRes, relationsRes] = await Promise.all([
        getProfiles(),
        getRelations(),
      ]);
      const p = profilesRes.data?.length ? profilesRes.data : mockProfiles;
      const r = relationsRes.data?.length ? relationsRes.data : mockRelations;
      setProfiles(p);
      setRelations(r);
      setUsingMock(!profilesRes.data?.length);
    } catch {
      setProfiles(mockProfiles);
      setRelations(mockRelations);
      setUsingMock(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const selectedProfile = profiles.find(p => p.id === selectedProfileId) || null;

  // Check if user can edit a specific profile's relations
  const canEditProfile = (profileId: string) => {
    if (isAdminOrOwner) return true;
    // User can edit their own profile's relations
    if (myProfile && myProfile.id === profileId) return true;
    return false;
  };

  // Get relations for the selected member (using profile.id)
  const getRelationsForProfile = (profileId: string) => {
    return relations.filter(
      r => r.from_user_id === profileId || r.to_user_id === profileId
    );
  };

  // Get filtered graph data based on view mode
  const graphProfiles = viewMode === 'individual' && selectedProfileId
    ? (() => {
        const profileRelations = getRelationsForProfile(selectedProfileId);
        const connectedIds = new Set<string>([selectedProfileId]);
        profileRelations.forEach(r => {
          connectedIds.add(r.from_user_id);
          connectedIds.add(r.to_user_id);
        });
        return profiles.filter(p => connectedIds.has(p.id));
      })()
    : profiles;

  const graphRelations = viewMode === 'individual' && selectedProfileId
    ? getRelationsForProfile(selectedProfileId)
    : relations;

  const handleNodeClick = (profileId: string) => {
    setSelectedProfileId(profileId);
    if (viewMode === 'global') {
      setViewMode('individual');
    }
  };

  // 找到某人的所有结义伙伴
  const getJieyiGroup = (profileId: string): Set<string> => {
    const group = new Set<string>();
    const queue = [profileId];
    while (queue.length > 0) {
      const current = queue.pop()!;
      if (group.has(current)) continue;
      group.add(current);
      relations
        .filter(r => r.relation_type === 'jieyi' && (r.from_user_id === current || r.to_user_id === current))
        .forEach(r => {
          const other = r.from_user_id === current ? r.to_user_id : r.from_user_id;
          if (!group.has(other)) queue.push(other);
        });
    }
    return group;
  };

  const handleAddRelation = async (
    targetProfileId: string,
    relationType: MemberRelation['relation_type']
  ) => {
    if (!selectedProfileId || !user) return;
    if (usingMock) {
      alert('演示数据无法编辑');
      return;
    }
    try {
      // 师徒关系：from_user_id 是师父，to_user_id 是徒弟，统一存为 'shifu'
      let fromId = selectedProfileId;
      let toId = targetProfileId;
      let storeType = relationType;

      if (relationType === 'shifu') {
        fromId = targetProfileId;
        toId = selectedProfileId;
        storeType = 'shifu';
      } else if (relationType === 'tudi') {
        fromId = selectedProfileId;
        toId = targetProfileId;
        storeType = 'shifu';
      }

      if (relationType === 'jieyi') {
        // 结义是团体关系：A加B时，B也要和A的所有结义伙伴互相建立关系
        const groupA = getJieyiGroup(selectedProfileId);
        const groupB = getJieyiGroup(targetProfileId);

        // 合并两个团体，所有未连接的pair都要建立关系
        const allMembers = new Set([...groupA, ...groupB]);
        const existingPairs = new Set<string>();
        relations
          .filter(r => r.relation_type === 'jieyi')
          .forEach(r => {
            existingPairs.add([r.from_user_id, r.to_user_id].sort().join('|'));
          });

        const newPairs: [string, string][] = [];
        const members = Array.from(allMembers);
        for (let i = 0; i < members.length; i++) {
          for (let j = i + 1; j < members.length; j++) {
            const pairKey = [members[i], members[j]].sort().join('|');
            if (!existingPairs.has(pairKey)) {
              newPairs.push([members[i], members[j]]);
            }
          }
        }

        const errors: string[] = [];
        for (const [a, b] of newPairs) {
          const { error } = await createRelation({
            from_user_id: a,
            to_user_id: b,
            relation_type: 'jieyi',
            label: RELATION_TYPES.find(t => t.id === 'jieyi')?.label || null,
            line_color: null,
            group_name: null,
            created_by: user.id,
          });
          if (error) errors.push(error.message);
        }

        if (errors.length > 0) {
          console.error('部分结义关系创建失败:', errors);
          alert('部分结义关系创建失败');
        }
        await fetchData();
      } else {
        // 非结义关系：正常创建单条
        const { error } = await createRelation({
          from_user_id: fromId,
          to_user_id: toId,
          relation_type: storeType,
          label: RELATION_TYPES.find(t => t.id === storeType)?.label || null,
          line_color: null,
          group_name: null,
          created_by: user.id,
        });
        if (error) {
          console.error('Failed to create relation:', error);
          alert('添加关系失败：' + error.message);
        } else {
          await fetchData();
        }
      }
    } catch (err) {
      console.error('Failed to create relation:', err);
      alert('添加关系失败');
    }
    setShowAddModal(false);
    setAddRelationType(null);
  };

  const handleDeleteRelation = async (relationId: string) => {
    if (usingMock) return;
    // 查找这条关系
    const rel = relations.find(r => r.id === relationId);
    if (!rel) return;

    if (rel.relation_type === 'jieyi') {
      // 结义删除：删除该人与当前选中人的结义关系
      // 同时删除该人与当前选中人的整个结义团体之间的所有连线
      const otherPersonId = rel.from_user_id === selectedProfileId ? rel.to_user_id : rel.from_user_id;
      if (!confirm(`确定将该成员从结义团体中移除？将同时删除此人与团体所有成员的结义关系。`)) return;

      // 找到当前团体中除了被移除的人之外的所有人
      const jieyiRelations = relations.filter(
        r => r.relation_type === 'jieyi' &&
        (r.from_user_id === otherPersonId || r.to_user_id === otherPersonId)
      );

      const errors: string[] = [];
      for (const r of jieyiRelations) {
        const { error } = await deleteRelation(r.id);
        if (error) errors.push(error.message);
      }
      if (errors.length > 0) {
        console.error('部分结义关系删除失败:', errors);
      }
      await fetchData();
    } else {
      if (!confirm('确定删除此关系？')) return;
      try {
        const { error } = await deleteRelation(relationId);
        if (error) {
          console.error('Failed to delete relation:', error);
          alert('删除关系失败：' + error.message);
        } else {
          await fetchData();
        }
      } catch (err) {
        console.error('Failed to delete relation:', err);
      }
    }
  };

  const handleOpenAddModal = (relationType?: string) => {
    setAddRelationType(relationType || null);
    setShowAddModal(true);
  };

  return (
    <>
      <PageHeader
        englishTitle="GUILD RELATIONS"
        chineseTitle="月冕关系谱"
      />

      <div className="max-w-[1400px] mx-auto px-4 md:px-8 pb-20">
        {/* View mode toggle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2 mb-6"
        >
          <button
            onClick={() => {
              setViewMode('individual');
              if (!selectedProfileId && profiles.length > 0) {
                // Default to user's own profile, otherwise first profile
                const myP = myProfile ? profiles.find(p => p.id === myProfile.id) : null;
                setSelectedProfileId(myP?.id || profiles[0].id);
              }
            }}
            className={`px-4 py-1.5 text-sm border rounded-sm transition-all ${
              viewMode === 'individual'
                ? 'bg-gold/20 border-gold/50 text-gold'
                : 'border-gold/10 text-text-secondary bg-bg-primary/80 hover:border-gold/30'
            }`}
          >
            个人关系
          </button>
          <button
            onClick={() => setViewMode('global')}
            className={`px-4 py-1.5 text-sm border rounded-sm transition-all ${
              viewMode === 'global'
                ? 'bg-gold/20 border-gold/50 text-gold'
                : 'border-gold/10 text-text-secondary bg-bg-primary/80 hover:border-gold/30'
            }`}
          >
            全部关系
          </button>
        </motion.div>

        {/* Main content area */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col lg:flex-row gap-6"
        >
          {/* Force graph */}
          <div className={viewMode === 'individual' && selectedProfileId ? 'flex-1 min-w-0' : 'w-full'}>
            {loading ? (
              <div className="w-full h-[400px] md:h-[600px] bg-bg-secondary gold-border rounded-sm flex items-center justify-center">
                <span className="text-text-secondary text-sm">Loading...</span>
              </div>
            ) : (
              <ForceGraph
                profiles={graphProfiles}
                relations={graphRelations}
                selectedProfileId={selectedProfileId}
                viewMode={viewMode}
                onNodeClick={handleNodeClick}
              />
            )}
          </div>

          {/* Detail panel (individual view only) */}
          {viewMode === 'individual' && selectedProfileId && selectedProfile && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="w-full lg:w-[320px] flex-shrink-0"
            >
              <RelationPanel
                profile={selectedProfile}
                relations={getRelationsForProfile(selectedProfileId)}
                profiles={profiles}
                canEdit={canEditProfile(selectedProfileId)}
                isSelf={myProfile?.id === selectedProfileId}
                onAddRelation={handleOpenAddModal}
                onDeleteRelation={handleDeleteRelation}
              />
            </motion.div>
          )}
        </motion.div>

        {/* Member selector for individual view */}
        {viewMode === 'individual' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6"
          >
            <div className="text-center mb-3">
              <p className="text-text-secondary text-xs">
                点击图谱节点或从下方选择成员查看个人关系
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {profiles.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProfileId(p.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs border rounded-sm transition-all ${
                    selectedProfileId === p.id
                      ? 'bg-gold/20 border-gold/50 text-gold'
                      : 'border-gold/10 text-text-secondary bg-bg-card hover:border-gold/30'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: p.node_color }}
                  />
                  {p.nickname}
                  {myProfile?.id === p.id && (
                    <span className="text-[9px] bg-green-900/30 text-green-400 px-1 rounded">我</span>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Add Relation Modal */}
      {showAddModal && selectedProfileId && (
        <AddRelationModal
          currentProfileId={selectedProfileId}
          profiles={profiles}
          relations={relations}
          defaultType={addRelationType}
          onConfirm={handleAddRelation}
          onClose={() => {
            setShowAddModal(false);
            setAddRelationType(null);
          }}
        />
      )}
    </>
  );
}
