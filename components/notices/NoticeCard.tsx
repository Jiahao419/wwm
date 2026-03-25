'use client';

import { Notice } from '@/lib/types';
import { NOTICE_TYPES } from '@/lib/constants';

interface NoticeCardProps {
  notice: Notice;
  isPinned?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  isAdminOrOwner?: boolean;
  onEdit?: (notice: Notice) => void;
  onDelete?: (notice: Notice) => void;
}

function getTypeLabel(type: string) {
  return NOTICE_TYPES.find(t => t.value === type)?.label || type;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default function NoticeCard({ notice, isPinned, expanded, onToggle, isAdminOrOwner, onEdit, onDelete }: NoticeCardProps) {
  return (
    <div
      className={`bg-bg-card rounded-sm overflow-hidden transition-all ${
        isPinned ? 'border-l-4 border-l-gold gold-border' : 'gold-border-hover'
      }`}
    >
      <div
        className="p-5 cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3 mb-2">
          <span className="px-2 py-0.5 text-xs bg-cinnabar/20 text-cinnabar-light rounded">
            {getTypeLabel(notice.type)}
          </span>
          <span className="text-text-secondary/50 text-xs">{formatDate(notice.created_at)}</span>
          {notice.is_pinned && <span className="text-gold/60 text-xs">置顶</span>}

          {/* Admin actions */}
          {isAdminOrOwner && (
            <div className="ml-auto flex gap-2" onClick={e => e.stopPropagation()}>
              <button
                onClick={() => onEdit?.(notice)}
                className="text-xs text-gold/60 hover:text-gold transition-colors px-2 py-0.5 border border-gold/10 rounded-sm hover:border-gold/30"
              >
                编辑
              </button>
              <button
                onClick={() => onDelete?.(notice)}
                className="text-xs text-cinnabar-light/60 hover:text-cinnabar-light transition-colors px-2 py-0.5 border border-cinnabar/10 rounded-sm hover:border-cinnabar/30"
              >
                删除
              </button>
            </div>
          )}
        </div>
        <h3 className="font-title text-lg text-text-primary mb-1">{notice.title}</h3>
        {notice.summary && (
          <p className="text-text-secondary text-sm">{notice.summary}</p>
        )}
      </div>

      {expanded && notice.content && (
        <div className="px-5 pb-5 border-t border-gold/10 pt-4">
          <div className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap">
            {notice.content}
          </div>
        </div>
      )}
    </div>
  );
}
