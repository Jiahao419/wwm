'use client';

import { MEMBER_TAGS } from '@/lib/constants';
import TagBadge from '@/components/ui/TagBadge';

interface TagFilterProps {
  activeTags: string[];
  onToggle: (tag: string) => void;
}

export default function TagFilter({ activeTags, onToggle }: TagFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {MEMBER_TAGS.map(tag => (
        <TagBadge
          key={tag}
          tag={tag}
          active={activeTags.includes(tag)}
          onClick={() => onToggle(tag)}
        />
      ))}
    </div>
  );
}
