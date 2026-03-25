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
  const { isAdminOrOwner, user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [relations, setRelations] = useState<MemberRelation[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('global');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addRelationType, setAddRelationType] = useState<string | null>(null);

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
    } catch {
      setProfiles(mockProfiles);
      setRelations(mockRelations);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const selectedProfile = profiles.find(p => p.user_id === selectedUserId) || null;

  // Get relations for the selected member
  const getRelationsForUser = (userId: string) => {
    return relations.filter(
      r => r.from_user_id === userId || r.to_user_id === userId
    );
  };

  // Get filtered graph data based on view mode
  const graphProfiles = viewMode === 'individual' && selectedUserId
    ? (() => {
        const userRelations = getRelationsForUser(selectedUserId);
        const connectedIds = new Set<string>([selectedUserId]);
        userRelations.forEach(r => {
          connectedIds.add(r.from_user_id);
          connectedIds.add(r.to_user_id);
        });
        return profiles.filter(p => connectedIds.has(p.user_id));
      })()
    : profiles;

  const graphRelations = viewMode === 'individual' && selectedUserId
    ? getRelationsForUser(selectedUserId)
    : relations;

  const handleNodeClick = (userId: string) => {
    setSelectedUserId(userId);
    if (viewMode === 'global') {
      setViewMode('individual');
    }
  };

  const handleAddRelation = async (
    targetUserId: string,
    relationType: MemberRelation['relation_type']
  ) => {
    if (!selectedUserId || !user) return;
    try {
      await createRelation({
        from_user_id: selectedUserId,
        to_user_id: targetUserId,
        relation_type: relationType,
        label: RELATION_TYPES.find(t => t.id === relationType)?.label || null,
        line_color: null,
        group_name: null,
        created_by: user.id,
      });
      await fetchData();
    } catch (err) {
      console.error('Failed to create relation:', err);
    }
    setShowAddModal(false);
    setAddRelationType(null);
  };

  const handleDeleteRelation = async (relationId: string) => {
    try {
      await deleteRelation(relationId);
      await fetchData();
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
              if (!selectedUserId && profiles.length > 0) {
                setSelectedUserId(profiles[0].user_id);
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
          <div className={viewMode === 'individual' && selectedUserId ? 'flex-1 min-w-0' : 'w-full'}>
            {loading ? (
              <div className="w-full h-[600px] bg-bg-secondary gold-border rounded-sm flex items-center justify-center">
                <span className="text-text-secondary text-sm">Loading...</span>
              </div>
            ) : (
              <ForceGraph
                profiles={graphProfiles}
                relations={graphRelations}
                selectedUserId={selectedUserId}
                viewMode={viewMode}
                onNodeClick={handleNodeClick}
              />
            )}
          </div>

          {/* Detail panel (individual view only) */}
          {viewMode === 'individual' && selectedUserId && selectedProfile && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="w-[320px] flex-shrink-0"
            >
              <RelationPanel
                profile={selectedProfile}
                relations={getRelationsForUser(selectedUserId)}
                profiles={profiles}
                isAdmin={isAdminOrOwner}
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
                  key={p.user_id}
                  onClick={() => setSelectedUserId(p.user_id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs border rounded-sm transition-all ${
                    selectedUserId === p.user_id
                      ? 'bg-gold/20 border-gold/50 text-gold'
                      : 'border-gold/10 text-text-secondary bg-bg-card hover:border-gold/30'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: p.node_color }}
                  />
                  {p.nickname}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Add Relation Modal */}
      {showAddModal && selectedUserId && (
        <AddRelationModal
          currentUserId={selectedUserId}
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
