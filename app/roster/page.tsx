'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MemberCard from '@/components/roster/MemberCard';
import EditModal from '@/components/roster/EditModal';
import ProfileDetailModal from '@/components/roster/ProfileDetailModal';
import CylinderCarousel from '@/components/roster/CylinderCarousel';
import CharacterShowcase from '@/components/roster/CharacterShowcase';
import { Profile, ProfileImage } from '@/lib/types';
import { getProfilesWithImages, updateProfile, deleteProfile, setUserRole, createProfile } from '@/lib/db';
import { useAuth } from '@/components/providers/AuthProvider';
import GoldButton from '@/components/ui/GoldButton';

type ProfileWithImages = Profile & { profile_images: ProfileImage[] };

export default function RosterPage() {
  const [profiles, setProfiles] = useState<ProfileWithImages[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [viewingProfile, setViewingProfile] = useState<Profile | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const { isAdminOrOwner, profile: currentProfile, user } = useAuth();

  const fetchData = useCallback(async () => {
    try {
      const { data, error } = await getProfilesWithImages();
      if (error) console.error('getProfiles error:', error);
      if (data) setProfiles(data as ProfileWithImages[]);
    } catch (err) {
      console.error('getProfiles exception:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => {
    return profiles.filter(p => {
      const matchesSearch = !search ||
        p.nickname.includes(search) ||
        p.identity?.includes(search) ||
        p.intro?.includes(search) ||
        p.description?.includes(search) ||
        p.tags.some(t => t.includes(search));
      return matchesSearch;
    });
  }, [search, profiles]);

  const handleSave = async (data: Partial<Profile>) => {
    if (!editingProfile) return;
    const { error } = await updateProfile(editingProfile.id, data);
    if (error) {
      console.error('updateProfile error:', error);
      alert('保存失败：' + error.message);
    } else {
      await fetchData();
    }
    setEditingProfile(null);
  };

  const handleAddSave = async (data: Partial<Profile>) => {
    const { error } = await createProfile({
      nickname: data.nickname || '新成员',
      identity: data.identity || null,
      intro: data.intro || null,
      description: data.description || null,
      tags: data.tags || [],
      avatar_url: data.avatar_url || null,
    });
    if (error) {
      console.error('createProfile error:', error);
      alert('添加失败：' + error.message);
    } else {
      await fetchData();
    }
    setShowAddModal(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除该成员档案吗？此操作不可恢复。')) return;
    const { error } = await deleteProfile(id);
    if (!error) {
      setProfiles(prev => prev.filter(p => p.id !== id));
      setViewingProfile(null);
    }
  };

  const isOwner = currentProfile?.role === 'owner';

  const handleSetAdmin = async (userId: string) => {
    if (!confirm('确定将该成员设为管理员？')) return;
    const { error } = await setUserRole(userId, 'admin');
    if (!error) await fetchData();
  };

  const handleRemoveAdmin = async (userId: string) => {
    if (!confirm('确定取消该成员的管理员身份？')) return;
    const { error } = await setUserRole(userId, 'member');
    if (!error) await fetchData();
  };

  const canEdit = (profile: Profile) => {
    if (isAdminOrOwner) return true;
    if (user && profile.user_id === user.id) return true;
    return false;
  };

  const newProfileTemplate: Profile = {
    id: '',
    user_id: '',
    nickname: '',
    avatar_url: null,
    identity: null,
    intro: null,
    description: null,
    tags: [],
    is_public: true,
    discord_username: null,
    discord_id: null,
    role: 'member',
    node_color: '#9a8a6a',
    node_size: 'medium',
    graph_x: null,
    graph_y: null,
    showcase_url: null,
    faction: null,
    created_at: '',
    updated_at: '',
  };

  return (
    <>
      {/* Full-screen Character Showcase */}
      {!loading && profiles.length > 0 && (
        <CharacterShowcase
          profiles={profiles}
          currentUserId={user?.id || null}
          isAdminOrOwner={isAdminOrOwner}
          onRefresh={fetchData}
          onEditProfile={(p) => setEditingProfile(p)}
        />
      )}

      {/* Loading state */}
      {loading && (
        <div className="h-screen flex items-center justify-center">
          <div className="text-text-secondary/50">加载中...</div>
        </div>
      )}

      {/* Divider: Cylinder section */}
      {!loading && profiles.length > 0 && (
        <>
          <div className="max-w-[1400px] mx-auto px-8 py-10">
            <div className="flex items-center gap-4">
              <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
              <span className="text-text-secondary/30 text-xs tracking-[0.3em]">月 冕 转 轮</span>
              <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
            </div>
            <p className="text-center text-text-secondary/20 text-xs mt-2 tracking-widest">拖拽旋转 · 点击查看详情</p>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <CylinderCarousel
              profiles={profiles}
              onProfileClick={(p) => setViewingProfile(p)}
            />
          </motion.div>
        </>
      )}

      {/* Divider: Card grid section */}
      <div className="max-w-[1400px] mx-auto px-8 py-10">
        <div className="flex items-center gap-4">
          <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
          <span className="text-text-secondary/30 text-xs tracking-[0.3em]">成 员 名 片</span>
          <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-8 pb-20">
        {/* Search + Add */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8 flex gap-4 items-center"
        >
          <input
            type="text"
            placeholder="搜索昵称、身份、标签、描述..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-bg-card border border-gold/10 px-5 py-3 text-text-primary placeholder:text-text-secondary/40 focus:border-gold/30 focus:outline-none transition-colors text-sm"
          />
          {isAdminOrOwner && (
            <GoldButton
              variant="secondary"
              size="md"
              onClick={() => setShowAddModal(true)}
              className="flex-shrink-0"
            >
              添加成员
            </GoldButton>
          )}
        </motion.div>

        {/* Members Grid */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {filtered.map((profile, i) => (
                <motion.div
                  key={profile.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.03 * i }}
                >
                  <MemberCard
                    profile={profile}
                    onClick={() => setViewingProfile(profile)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
            {filtered.length === 0 && (
              <div className="col-span-full text-center py-16 text-text-secondary/50">
                未找到匹配的成员
              </div>
            )}
          </div>
        )}
      </div>

      {/* Profile Detail Modal */}
      {viewingProfile && (
        <ProfileDetailModal
          profile={viewingProfile}
          canEdit={canEdit(viewingProfile)}
          isAdminOrOwner={isAdminOrOwner}
          isOwner={isOwner}
          isSelf={!!user && viewingProfile.user_id === user.id}
          onClose={() => setViewingProfile(null)}
          onEdit={() => {
            setEditingProfile(viewingProfile);
            setViewingProfile(null);
          }}
          onDelete={() => handleDelete(viewingProfile.id)}
          onSetAdmin={() => handleSetAdmin(viewingProfile.user_id)}
          onRemoveAdmin={() => handleRemoveAdmin(viewingProfile.user_id)}
          onRefresh={fetchData}
        />
      )}

      {/* Edit Modal */}
      {editingProfile && (
        <EditModal
          profile={editingProfile}
          onClose={() => setEditingProfile(null)}
          onSave={handleSave}
        />
      )}

      {/* Add Member Modal */}
      {showAddModal && (
        <EditModal
          profile={newProfileTemplate}
          onClose={() => setShowAddModal(false)}
          onSave={handleAddSave}
        />
      )}
    </>
  );
}
