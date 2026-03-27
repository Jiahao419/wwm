'use client';

import { useState, useRef } from 'react';
import { Profile } from '@/lib/types';
import { MEMBER_TAGS, MemberTag, FACTIONS } from '@/lib/constants';
import GoldButton from '@/components/ui/GoldButton';
import TagBadge from '@/components/ui/TagBadge';
import { createClient } from '@/lib/supabase/client';

interface EditModalProps {
  profile: Profile;
  onClose: () => void;
  onSave: (data: Partial<Profile>) => void;
}

export default function EditModal({ profile, onClose, onSave }: EditModalProps) {
  const [nickname, setNickname] = useState(profile.nickname);
  const [identity, setIdentity] = useState(profile.identity || '');
  const [intro, setIntro] = useState(profile.intro || '');
  const [description, setDescription] = useState(profile.description || '');
  const [tags, setTags] = useState<MemberTag[]>(profile.tags as MemberTag[]);
  const [faction, setFaction] = useState(profile.faction || '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleTag = (tag: MemberTag) => {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const supabase = createClient();
      const fileExt = file.name.split('.').pop();
      const filePath = `${profile.user_id}/${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage.from('avatars').upload(filePath, file);
      if (error) {
        console.error('Upload error:', error);
        alert('上传失败：' + error.message);
        return;
      }
      if (data) {
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
        setAvatarUrl(publicUrl);
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('上传失败，请重试');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = () => {
    onSave({
      nickname,
      identity,
      intro,
      description,
      tags,
      faction: faction || null,
      avatar_url: avatarUrl || null,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-bg-panel border border-gold/20 rounded-sm p-8 w-[560px] max-h-[85vh] overflow-y-auto">
        <h2 className="font-title text-2xl text-text-primary mb-6">编辑档案</h2>

        <div className="space-y-5">
          {/* Avatar upload */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full border-2 border-gold/30 flex items-center justify-center bg-bg-card overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt={nickname} className="w-full h-full object-cover" />
              ) : (
                <span className="font-title text-xl text-gold/40">{nickname.charAt(0)}</span>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-3 py-1.5 text-xs border border-gold/20 text-text-secondary hover:text-gold hover:border-gold/40 transition-all disabled:opacity-50"
            >
              {uploading ? '上传中...' : '上传头像'}
            </button>
            {avatarUrl && (
              <button
                onClick={() => setAvatarUrl('')}
                className="px-3 py-1.5 text-xs border border-cinnabar/20 text-cinnabar-light/60 hover:text-cinnabar-light hover:border-cinnabar/40 transition-all"
              >
                移除
              </button>
            )}
          </div>

          <div>
            <label className="block text-text-secondary text-sm mb-1.5">昵称</label>
            <input
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              className="w-full bg-bg-card border border-gold/10 px-4 py-2.5 text-text-primary text-sm focus:border-gold/40 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-text-secondary text-sm mb-1.5">身份/职衔</label>
            <input
              value={identity}
              onChange={e => setIdentity(e.target.value)}
              className="w-full bg-bg-card border border-gold/10 px-4 py-2.5 text-text-primary text-sm focus:border-gold/40 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-text-secondary text-sm mb-1.5">流派</label>
            <div className="flex flex-wrap gap-2">
              {FACTIONS.map(f => (
                <button
                  key={f}
                  onClick={() => setFaction(faction === f ? '' : f)}
                  className={`px-3 py-1.5 text-xs rounded-sm border transition-all ${
                    faction === f
                      ? 'bg-gold/15 text-gold border-gold/40'
                      : 'bg-bg-card text-text-secondary/60 border-gold/10 hover:border-gold/25 hover:text-text-secondary'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-text-secondary text-sm mb-1.5">自我介绍</label>
            <input
              value={intro}
              onChange={e => setIntro(e.target.value)}
              className="w-full bg-bg-card border border-gold/10 px-4 py-2.5 text-text-primary text-sm focus:border-gold/40 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-text-secondary text-sm mb-1.5">个人描述</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-bg-card border border-gold/10 px-4 py-2.5 text-text-primary text-sm focus:border-gold/40 focus:outline-none transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-text-secondary text-sm mb-2">标签</label>
            <div className="flex flex-wrap gap-2">
              {MEMBER_TAGS.map(tag => (
                <TagBadge
                  key={tag}
                  tag={tag}
                  active={tags.includes(tag)}
                  onClick={() => toggleTag(tag)}
                  size="sm"
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <GoldButton variant="ghost" onClick={onClose}>取消</GoldButton>
          <GoldButton variant="primary" onClick={handleSave}>保存</GoldButton>
        </div>
      </div>
    </div>
  );
}
