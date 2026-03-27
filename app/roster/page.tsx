'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
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
      {/* Loading state */}
      {loading && (
        <div className="h-screen flex items-center justify-center">
          <div className="text-text-secondary/50">加载中...</div>
        </div>
      )}

      {/* Cylinder Carousel section (top) */}
      {!loading && profiles.length > 0 && (
        <>
          <div className="max-w-[1400px] mx-auto px-8 pt-28 pb-6">
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
              currentUserId={user?.id || null}
              isAdminOrOwner={isAdminOrOwner}
              onRefresh={fetchData}
            />
          </motion.div>
        </>
      )}

      {/* Divider between sections */}
      {!loading && profiles.length > 0 && (
        <div className="max-w-[1400px] mx-auto px-8 py-10">
          <div className="flex items-center gap-4">
            <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
            <span className="text-text-secondary/30 text-xs tracking-[0.3em]">成 员 风 采</span>
            <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
          </div>
        </div>
      )}

      {/* Full-screen Character Showcase (below) */}
      {!loading && profiles.length > 0 && (
        <CharacterShowcase
          profiles={profiles}
          currentUserId={user?.id || null}
          isAdminOrOwner={isAdminOrOwner}
          onRefresh={fetchData}
          onEditProfile={(p) => setEditingProfile(p)}
        />
      )}

      {/* Admin: Add member button */}
      {isAdminOrOwner && (
        <div className="max-w-[1400px] mx-auto px-8 py-6 flex justify-end">
          <GoldButton
            variant="secondary"
            size="md"
            onClick={() => setShowAddModal(true)}
          >
            添加成员
          </GoldButton>
        </div>
      )}

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
