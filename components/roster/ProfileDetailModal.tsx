'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Profile } from '@/lib/types';
import TagBadge from '@/components/ui/TagBadge';
import GoldButton from '@/components/ui/GoldButton';

interface ProfileDetailModalProps {
  profile: Profile;
  isAdminOrOwner: boolean;
  isOwner: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSetAdmin?: () => void;
  onRemoveAdmin?: () => void;
}

export default function ProfileDetailModal({
  profile,
  isAdminOrOwner,
  isOwner,
  onClose,
  onEdit,
  onDelete,
  onSetAdmin,
  onRemoveAdmin,
}: ProfileDetailModalProps) {
  const firstChar = profile.nickname.charAt(0);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="relative bg-bg-panel border border-gold/20 rounded-sm w-[520px] max-h-[85vh] overflow-y-auto"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center
                       text-text-secondary/60 hover:text-gold bg-black/40 backdrop-blur-sm
                       rounded-full border border-gold/10 hover:border-gold/30 transition-all"
          >
            ✕
          </button>

          {/* Large Image */}
          <div className="relative w-full h-[280px] overflow-hidden">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.nickname}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${profile.node_color || '#9a8a6a'}22, ${profile.node_color || '#9a8a6a'}55)`,
                }}
              >
                <span
                  className="font-brush text-8xl opacity-50 select-none"
                  style={{ color: profile.node_color || '#9a8a6a' }}
                >
                  {firstChar}
                </span>
              </div>
            )}

            {/* Gradient overlay at bottom of image */}
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-bg-panel to-transparent" />
          </div>

          {/* Content */}
          <div className="px-8 pb-8 -mt-6 relative">
            {/* Nickname & badges */}
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h2 className="font-title text-2xl text-text-primary">{profile.nickname}</h2>
              {profile.identity && (
                <span className="px-2.5 py-0.5 text-xs bg-gold/15 text-gold rounded border border-gold/20">
                  {profile.identity}
                </span>
              )}
              {profile.role === 'owner' && (
                <span className="px-2.5 py-0.5 text-xs bg-cinnabar/20 text-cinnabar-light rounded border border-cinnabar/30">
                  坛主
                </span>
              )}
              {profile.role === 'admin' && (
                <span className="px-2.5 py-0.5 text-xs bg-blue-900/30 text-blue-300 rounded border border-blue-500/30">
                  管理员
                </span>
              )}
            </div>

            {/* Intro */}
            {profile.intro && (
              <p className="text-text-primary/80 text-sm mb-3 leading-relaxed">{profile.intro}</p>
            )}

            {/* Description */}
            {profile.description && (
              <p className="text-text-secondary text-sm mb-4 leading-relaxed whitespace-pre-wrap">
                {profile.description}
              </p>
            )}

            {/* Tags */}
            {profile.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {profile.tags.map(tag => (
                  <TagBadge key={tag} tag={tag} size="sm" />
                ))}
              </div>
            )}

            {/* Discord */}
            {profile.discord_username && (
              <div className="flex items-center gap-2 text-sm text-text-secondary mb-6 py-2 px-3 bg-bg-card rounded border border-gold/5">
                <svg className="w-4 h-4 text-[#5865F2] flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
                </svg>
                <span>{profile.discord_username}</span>
              </div>
            )}

            {/* Admin Actions */}
            {isAdminOrOwner && (
              <div className="flex gap-3 pt-4 border-t border-gold/10">
                <GoldButton variant="secondary" size="sm" onClick={onEdit}>
                  编辑档案
                </GoldButton>
                <GoldButton
                  variant="ghost"
                  size="sm"
                  onClick={onDelete}
                  className="text-cinnabar-light/70 hover:text-cinnabar-light"
                >
                  删除
                </GoldButton>
                {isOwner && profile.role === 'member' && onSetAdmin && (
                  <GoldButton variant="ghost" size="sm" onClick={onSetAdmin} className="text-blue-300/70 hover:text-blue-300">
                    设为管理
                  </GoldButton>
                )}
                {isOwner && profile.role === 'admin' && onRemoveAdmin && (
                  <GoldButton variant="ghost" size="sm" onClick={onRemoveAdmin} className="text-yellow-300/70 hover:text-yellow-300">
                    取消管理
                  </GoldButton>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
