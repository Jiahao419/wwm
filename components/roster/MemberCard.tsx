'use client';

import { motion } from 'framer-motion';
import { Profile } from '@/lib/types';

interface MemberCardProps {
  profile: Profile;
  onClick: () => void;
}

export default function MemberCard({ profile, onClick }: MemberCardProps) {
  const firstChar = profile.nickname.charAt(0);

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={onClick}
      className="group cursor-pointer bg-bg-card border border-gold/10 rounded-sm overflow-hidden
                 hover:border-gold/40 hover:shadow-[0_0_24px_rgba(201,168,76,0.15)] transition-all duration-300"
    >
      {/* Image Area */}
      <div className="relative w-full h-[250px] overflow-hidden">
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile.nickname}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${profile.node_color || '#9a8a6a'}22, ${profile.node_color || '#9a8a6a'}44)`,
            }}
          >
            <span
              className="font-brush text-7xl opacity-60 select-none"
              style={{ color: profile.node_color || '#9a8a6a' }}
            >
              {firstChar}
            </span>
          </div>
        )}

        {/* Role badge overlay */}
        {(profile.role === 'owner' || profile.role === 'admin') && (
          <div className="absolute top-3 right-3">
            {profile.role === 'owner' ? (
              <span className="px-2.5 py-1 text-xs font-title bg-cinnabar/80 text-white rounded border border-cinnabar-light/40 backdrop-blur-sm">
                坛主
              </span>
            ) : (
              <span className="px-2.5 py-1 text-xs font-title bg-blue-900/80 text-blue-200 rounded border border-blue-400/40 backdrop-blur-sm">
                管理员
              </span>
            )}
          </div>
        )}
      </div>

      {/* Info Area */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-1.5">
          <h3 className="font-title text-lg text-text-primary group-hover:text-gold transition-colors truncate">
            {profile.nickname}
          </h3>
          {profile.identity && (
            <span className="flex-shrink-0 px-2 py-0.5 text-xs bg-gold/15 text-gold rounded border border-gold/20">
              {profile.identity}
            </span>
          )}
        </div>

        {profile.intro ? (
          <p className="text-text-secondary text-sm line-clamp-2 leading-relaxed">
            {profile.intro}
          </p>
        ) : profile.description ? (
          <p className="text-text-secondary text-sm line-clamp-2 leading-relaxed">
            {profile.description}
          </p>
        ) : (
          <p className="text-text-secondary/30 text-sm italic">暂无简介</p>
        )}
      </div>
    </motion.div>
  );
}
