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
        // 当前用户要添加师父 → 目标是师父(from)，当前用户是徒弟(to)
        fromId = targetProfileId;
        toId = selectedProfileId;
        storeType = 'shifu';
      } else if (relationType === 'tudi') {
        // 当前用户要添加徒弟 → 当前用户是师父(from)，目标是徒弟(to)
        fromId = selectedProfileId;
        toId = targetProfileId;
        storeType = 'shifu';
      }

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
    } catch (err) {
      console.error('Failed to create relation:', err);
      alert('添加关系失败');
    }
    setShowAddModal(false);
    setAddRelationType(null);
  };

  const handleDeleteRelation = async (relationId: string) => {
    if (usingMock) return;
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

      <div className="max-w-[1400px] mx-auto px-8 pb-20">
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
          className="flex gap-6"
        >
          {/* Force graph */}
          <div className={viewMode === 'individual' && selectedProfileId ? 'flex-1 min-w-0' : 'w-full'}>
            {loading ? (
              <div className="w-full h-[600px] bg-bg-secondary gold-border rounded-sm flex items-center justify-center">
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
              className="w-[320px] flex-shrink-0"
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
